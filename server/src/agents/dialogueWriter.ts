import { generateStructured } from '../services/claude.js';

interface PersonalityScores {
  relax: number;
  divertimento: number;
  cultura: number;
  avventura: number;
  socialita: number;
}

interface NarrationResult {
  narration: string;
  hiddenFact: string;
  voiceStyle: 'enthusiastic' | 'mysterious' | 'calm';
}

interface NarrationInput {
  poiName: string;
  poiDescription: string;
  shortStory: string;
  hiddenFact: string;
  category: string;
  personality: PersonalityScores;
  timeOfDay: string;
  userInterests?: string[];
}

function getDominantTrait(scores: PersonalityScores): string {
  let maxKey = 'cultura';
  let maxVal = -1;
  for (const [key, val] of Object.entries(scores)) {
    if (val > maxVal) {
      maxVal = val;
      maxKey = key;
    }
  }
  return maxKey;
}

const SYSTEM_PROMPT = `Sei il narratore di "Play The City", una guida AI che accompagna i giocatori nell'esplorazione di Roma.

Il tuo compito e creare micro-narrazioni personalizzate in seconda persona ("Ti trovi davanti a...") che:
- Siano coinvolgenti e immersive (max 150 parole)
- Si adattino alla personalita del giocatore
- Includano un fatto nascosto sorprendente e poco conosciuto
- Tengano conto del momento della giornata

STILI per personalita dominante:
- relax: tono calmo, poetico, contemplativo
- divertimento: tono leggero, spiritoso, con battute
- cultura: tono colto, ricco di riferimenti storici e dettagli
- avventura: tono epico, misterioso, pieno di suspense
- socialita: tono caldo, che invita a condividere e interagire

Rispondi SOLO con un oggetto JSON con campi: narration, hiddenFact, voiceStyle.`;

export async function generateNarration(input: NarrationInput): Promise<NarrationResult> {
  const dominant = getDominantTrait(input.personality);

  const interestsLine = input.userInterests?.length
    ? `INTERESSI UTENTE: ${input.userInterests.join(', ')}`
    : '';

  const userMessage = `Genera una narrazione personalizzata per:

LUOGO: ${input.poiName}
CATEGORIA: ${input.category}
STORIA: ${input.shortStory}
CURIOSITA NOTA: ${input.hiddenFact}
MOMENTO: ${input.timeOfDay}
PERSONALITA DOMINANTE: ${dominant}
SCORES: relax=${input.personality.relax}, divertimento=${input.personality.divertimento}, cultura=${input.personality.cultura}, avventura=${input.personality.avventura}, socialita=${input.personality.socialita}
${interestsLine}

Crea una narrazione che si adatti alla personalita "${dominant}" e al momento "${input.timeOfDay}".
${input.userInterests?.length ? `IMPORTANTE: L'utente e interessato a ${input.userInterests.join(', ')}. Cerca di collegare la narrazione e la curiosita nascosta ai suoi interessi. Ad esempio, se ama la musica, racconta aspetti musicali del luogo; se ama l'enogastronomia, parla di tradizioni culinarie legate al posto.` : ''}
Includi un fatto nascosto DIVERSO e ancora piu sorprendente rispetto a quello gia noto.`;

  return generateStructured<NarrationResult>(SYSTEM_PROMPT, userMessage);
}
