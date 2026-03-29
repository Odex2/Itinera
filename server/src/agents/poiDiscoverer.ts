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

const SYSTEM_PROMPT = `Sei il "Scopritore Segreto" di "Play The City", un agente AI specializzato nel trovare luoghi interessanti a Roma.

Il tuo compito è generare 3-5 Punti di Interesse (POI) entro 800 metri dalle coordinate fornite.

REGOLE FONDAMENTALI:
1. I POI devono essere REALI e trovarsi DAVVERO vicino alle coordinate indicate
2. Se le coordinate sono vicine a un monumento famoso (Colosseo, Fontana di Trevi, ecc.), includilo pure — ma SOLO se è realmente entro 800m
3. NON inventare la presenza di monumenti famosi in zone dove non esistono
4. Privilegia anche gemme nascoste: cortili nascosti, botteghe storiche, street art, fontanelle antiche, murales, mercati rionali
5. Le coordinate devono variare POCHISSIMO rispetto al punto di partenza (massimo ±0.005 in lat/lng)
6. Se la zona è residenziale e non conosci luoghi famosi lì, suggerisci posti tipici del quartiere (parchi, chiese, bar storici, panifici)
7. L'importanceScore deve essere tra 40 e 95 (più alto per monumenti famosi, più basso per gemme nascoste)
8. unlockDistance: 30-150m
9. xpReward: 50-200
10. L'id deve essere nel formato "discovered-{nome-slug}"

CATEGORIE VALIDE: enogastronomia, cultura, arte, storia, natura, paesaggio, shopping, artigianato, intrattenimento, family, sport

Rispondi SOLO con un array JSON di oggetti con campi: id, name, description, lat, lng, category, importanceScore, unlockDistance, xpReward.`;

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

export async function discoverPOIs(input: DiscoverInput): Promise<DiscoveredPOI[]> {
  const zoneName = await reverseGeocode(input.lat, input.lng);
  const zoneContext = zoneName ? `\nZONA ATTUALE: ${zoneName} — genera POI che esistono IN QUESTA ZONA, non altrove.` : '';

  const userMessage = `Trova 3-5 luoghi interessanti vicino a queste coordinate:

LATITUDINE: ${input.lat}
LONGITUDINE: ${input.lng}
INTERESSI UTENTE: ${input.interests.join(', ')}${zoneContext}

IMPORTANTE: I POI devono trovarsi REALMENTE vicino a queste coordinate (entro 800m). Le coordinate che generi devono essere molto vicine a quelle indicate sopra (differenza massima ±0.005). NON generare luoghi che si trovano in altre zone di Roma.

Ogni POI deve avere una descrizione evocativa di 1-2 frasi.`;

  const pois = await generateStructured<DiscoveredPOI[]>(SYSTEM_PROMPT, userMessage);

  // Validate, clamp values, and relocate POIs with hallucinated coordinates
  return pois.map((poi, i) => {
    const clamped = {
      ...poi,
      importanceScore: Math.max(40, Math.min(75, poi.importanceScore)),
      unlockDistance: Math.max(30, Math.min(150, poi.unlockDistance)),
      xpReward: Math.max(50, Math.min(200, poi.xpReward)),
    };

    const dist = getDistanceMeters(input.lat, input.lng, clamped.lat, clamped.lng);
    if (dist > 1000) {
      const angle = (Math.PI * 2 * (i + 1)) / (pois.length + 1);
      const offsetM = 400 + Math.random() * 300;
      const latOffset = (offsetM * Math.cos(angle)) / 111320;
      const lngOffset = (offsetM * Math.sin(angle)) / (111320 * Math.cos(input.lat * Math.PI / 180));
      console.warn(`[poiDiscoverer] Relocated "${clamped.name}" — was ${Math.round(dist)}m away`);
      clamped.lat = input.lat + latOffset;
      clamped.lng = input.lng + lngOffset;
    }

    return clamped;
  });
}
