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

const SYSTEM_PROMPT = `Sei il "Scopritore Segreto" di "Play The City", un agente AI specializzato nel trovare gemme nascoste a Roma.

Il tuo compito è generare 3-5 Punti di Interesse (POI) nascosti e poco conosciuti entro 800 metri dalle coordinate fornite.

REGOLE:
1. I POI devono essere REALI o estremamente plausibili per la zona indicata
2. Privilegia luoghi insoliti: cortili nascosti, botteghe storiche, street art, fontanelle antiche, vicoli con storia
3. NON suggerire i classici monumenti turistici (Colosseo, Fontana di Trevi, ecc.)
4. Adatta la selezione agli interessi dell'utente
5. Le coordinate (lat, lng) devono essere realistiche e vicine al punto di partenza (max 800m)
6. L'importanceScore deve essere tra 40 e 75 (sono gemme nascoste, non monumenti famosi)
7. unlockDistance: distanza in metri per sbloccare il POI (30-150m)
8. xpReward: tra 50 e 200 in base all'importanceScore
9. L'id deve essere nel formato "discovered-{nome-slug}"

CATEGORIE VALIDE: enogastronomia, cultura, arte, storia, natura, paesaggio, shopping, artigianato, intrattenimento, family, sport

Rispondi SOLO con un array JSON di oggetti con campi: id, name, description, lat, lng, category, importanceScore, unlockDistance, xpReward.`;

export async function discoverPOIs(input: DiscoverInput): Promise<DiscoveredPOI[]> {
  const userMessage = `Trova 3-5 gemme nascoste vicino a queste coordinate:

LATITUDINE: ${input.lat}
LONGITUDINE: ${input.lng}
INTERESSI UTENTE: ${input.interests.join(', ')}

Genera POI nascosti e sorprendenti entro 800 metri che corrispondano agli interessi indicati. Ogni POI deve avere una descrizione evocativa di 1-2 frasi.`;

  const pois = await generateStructured<DiscoveredPOI[]>(SYSTEM_PROMPT, userMessage);

  // Validate and clamp importanceScore to [40, 75]
  return pois.map((poi) => ({
    ...poi,
    importanceScore: Math.max(40, Math.min(75, poi.importanceScore)),
    unlockDistance: Math.max(30, Math.min(150, poi.unlockDistance)),
    xpReward: Math.max(50, Math.min(200, poi.xpReward)),
  }));
}
