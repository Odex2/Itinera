import { generateStructured } from '../services/claude.js';

export interface DiscoveredPOI {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  importanceScore: number;
  unlockDistance: number;
  xpReward: number;
}

interface DiscoverInput {
  lat: number;
  lng: number;
  interests: string[];
}


// --- PINNED POIs (demo) ---
// Injected into AI results when the user is within the specified radius.
const PINNED_POIS: (DiscoveredPOI & { pinnedLat: number; pinnedLng: number; pinnedRadius: number })[] = [
  {
    id: 'pinned-gazometro',
    name: 'Gazometro di Roma',
    description: "L'iconica struttura industriale dell'Ostiense, simbolo della Roma operaia e palcoscenico di street art d'autore.",
    lat: 41.869515470340716,
    lng: 12.47499398273591,
    category: 'arte',
    importanceScore: 85,
    unlockDistance: 200,
    xpReward: 150,
    pinnedLat: 41.869515470340716,
    pinnedLng: 12.47499398273591,
    pinnedRadius: 200,
  },
];

// Groups of categories — each parallel call stays small and focused,
// preventing the model from "padding" with landmarks from other zones.
const CATEGORY_GROUPS = [
  'enogastronomia, shopping, artigianato',
  'cultura, storia, arte',
  'natura, paesaggio, intrattenimento, family, sport',
];

function buildSystemPrompt(categoryFocus: string): string {
  return `Sei il "Scopritore Segreto" di "Play The City", un agente AI specializzato nel trovare luoghi interessanti a Roma.

Il tuo compito è generare ESATTAMENTE 2-3 Punti di Interesse nella CATEGORIA: ${categoryFocus}.

REGOLA ASSOLUTA — GEOGRAFICA:
- Riceverai coordinate precise e il nome del quartiere/zona
- Genera SOLO luoghi che si trovano fisicamente IN QUELLA SPECIFICA ZONA — non altrove a Roma
- Se non conosci luoghi famosi lì, inventa posti tipici del quartiere (chiesa locale, parco, bar storico, mercato rionale) — sono preferibili a monumenti di altre zone
- È VIETATO generare luoghi che non si trovano fisicamente nella zona indicata (es. il Pincio, Colosseo, Fontana di Trevi se non siamo lì)
- Le coordinate lat/lng di ogni POI devono essere entro ±0.004 rispetto alle coordinate fornite (~400m)

ALTRE REGOLE:
- importanceScore: 40-75
- unlockDistance: 30-150m
- xpReward: 50-200
- id nel formato "discovered-{nome-slug}"
- Descrizione evocativa di 1-2 frasi

CATEGORIE VALIDE: enogastronomia, cultura, arte, storia, natura, paesaggio, shopping, artigianato, intrattenimento, family, sport

Rispondi SOLO con un array JSON di oggetti con campi: id, name, description, lat, lng, category, importanceScore, unlockDistance, xpReward.`;
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`, {
      headers: { 'User-Agent': 'PlayTheCity/1.0' },
    });
    if (!res.ok) return '';
    const data = await res.json() as { address?: { suburb?: string; neighbourhood?: string; quarter?: string; city_district?: string; road?: string; city?: string } };
    const a = data.address ?? {};
    const zone = a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
    const road = a.road || '';
    const city = a.city || 'Roma';
    return [zone, road, city].filter(Boolean).join(', ');
  } catch { return ''; }
}

function validateAndClamp(poi: DiscoveredPOI, input: DiscoverInput, index: number, total: number): DiscoveredPOI {
  const clamped = {
    ...poi,
    importanceScore: Math.max(40, Math.min(75, poi.importanceScore)),
    unlockDistance: Math.max(30, Math.min(150, poi.unlockDistance)),
    xpReward: Math.max(50, Math.min(200, poi.xpReward)),
  };

  const dist = getDistanceMeters(input.lat, input.lng, clamped.lat, clamped.lng);
  if (dist > 600) {
    const angle = (Math.PI * 2 * (index + 1)) / (total + 1);
    const offsetM = 200 + Math.random() * 300;
    const latOffset = (offsetM * Math.cos(angle)) / 111320;
    const lngOffset = (offsetM * Math.sin(angle)) / (111320 * Math.cos(input.lat * Math.PI / 180));
    console.warn(`[poiDiscoverer] Relocated "${clamped.name}" — was ${Math.round(dist)}m away`);
    clamped.lat = input.lat + latOffset;
    clamped.lng = input.lng + lngOffset;
  }

  return clamped;
}

export async function discoverPOIs(input: DiscoverInput): Promise<DiscoveredPOI[]> {
  const zoneName = await reverseGeocode(input.lat, input.lng);

  const userMessage = (categoryFocus: string) =>
    `Zona: ${zoneName || 'Roma'} — GENERA SOLO POI IN QUESTA ZONA.

COORDINATE CENTRO: ${input.lat}, ${input.lng}
RAGGIO MASSIMO: 400 metri (±0.004 in lat/lng)
CATEGORIA: ${categoryFocus}
INTERESSI UTENTE: ${input.interests.join(', ')}

Ogni POI deve trovarsi fisicamente in "${zoneName || 'questa zona'}". Non usare monumenti o luoghi di altre zone di Roma.`;

  // Fire all category groups in parallel — each call is small (2-3 POI) so the model
  // stays anchored to the zone instead of drifting toward famous landmarks elsewhere.
  const results = await Promise.allSettled(
    CATEGORY_GROUPS.map(group =>
      generateStructured<DiscoveredPOI[]>(buildSystemPrompt(group), userMessage(group))
    )
  );

  const allPois = results.flatMap((r, groupIndex) => {
    if (r.status === 'rejected') {
      console.warn(`[poiDiscoverer] Group "${CATEGORY_GROUPS[groupIndex]}" failed:`, r.reason);
      return [];
    }
    return r.value;
  });

  // Deduplicate by id, then validate/clamp each POI
  const seen = new Set<string>();
  const unique = allPois.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const validated = unique.map((poi, i) => validateAndClamp(poi, input, i, unique.length));

  // Inject pinned POIs into results when user is within their radius (demo)
  const pinned = PINNED_POIS
    .filter(p => getDistanceMeters(input.lat, input.lng, p.pinnedLat, p.pinnedLng) <= p.pinnedRadius)
    .filter(p => !seen.has(p.id))
    .map(({ pinnedLat, pinnedLng, pinnedRadius, ...poi }) => poi);

  return [...pinned, ...validated];
}