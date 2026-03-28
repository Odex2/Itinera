import { generateStructured } from '../services/claude.js';

export interface SpokenChallenge {
  question: string;
  correctAnswer: string;
  acceptableKeywords: string[];
  difficulty: 'facile' | 'medio' | 'difficile';
  xpBonus: number;
  voiceStyle: 'enthusiastic' | 'mysterious' | 'calm';
}

interface ChallengeDialogueInput {
  poiName: string;
  poiDescription: string;
  category: string;
  profileTag: string; // e.g. "Architecture", "Food", "History"
  lat: number;
  lng: number;
}

const SYSTEM_PROMPT = `Sei il "Narratore delle Sfide" di "Play The City", un agente AI che crea trivia parlate per i giocatori.

Il tuo compito è generare UNA breve sfida trivia vocale (da leggere ad alta voce) basata su un luogo specifico e sul profilo dell'utente.

REGOLE:
1. La domanda deve essere BREVE (max 2 frasi) — verrà sintetizzata in voce
2. Deve essere specifica al luogo e alla categoria indicata
3. Adatta il tono al profilo dell'utente (es. "Architecture" → dettagli strutturali, "Food" → curiosità gastronomiche)
4. Includi la risposta corretta e 3-5 parole chiave accettabili per la validazione vocale
5. La domanda deve essere in italiano, naturale e coinvolgente come se parlasse una guida
6. Scegli un voiceStyle coerente con il tono della domanda

Rispondi SOLO con un oggetto JSON con campi: question, correctAnswer, acceptableKeywords, difficulty, xpBonus, voiceStyle.`;

export async function generateSpokenChallenge(input: ChallengeDialogueInput): Promise<SpokenChallenge> {
  const userMessage = `Genera una sfida trivia vocale per:

LUOGO: ${input.poiName}
DESCRIZIONE: ${input.poiDescription}
CATEGORIA: ${input.category}
PROFILO UTENTE: ${input.profileTag}
COORDINATE: ${input.lat}, ${input.lng}

Crea una domanda breve, specifica e adatta al profilo "${input.profileTag}". La domanda verrà letta ad alta voce, quindi deve suonare naturale.`;

  return generateStructured<SpokenChallenge>(SYSTEM_PROMPT, userMessage);
}
