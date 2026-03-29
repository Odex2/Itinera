// dialogueWriter — generates personalized POI narrations via Regolo.ai
// SECURITY: All LLM calls go through the server. The Regolo API key is NEVER
// exposed to the Vite frontend.

import { generateStructured } from '../services/regolo.js';

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

// System prompt — demands INEDITA (unpublished, unique) content.
// Explicitly forbids generic tourist-guide encyclopedia entries.
const SYSTEM_PROMPT = `Sei il narratore di "Play The City". Scrivi micro-narrazioni di 100-140 parole in italiano, in seconda persona ("Ti trovi...").

REGOLE ASSOLUTE:
1. VIETATO iniziare con "Questo luogo...", "Qui si trova...", "Siamo davanti a...", "Benvenuto..." o qualsiasi apertura da guida turistica.
2. VIETATO descrivere il luogo in modo generico o didascalico. NIENTE contenuti da enciclopedia o Wikipedia.
3. OBBLIGATORIO iniziare con un aneddoto, una scena concreta, una domanda retorica o un dettaglio assurdo/curioso.
4. L'hidden fact DEVE essere INEDITO — una curiosità mai pubblicata su guide turistiche, blog di viaggio o pagine Wikipedia. Deve essere SPECIFICO e VERIFICABILE: un numero preciso, una data, un nome, una misura, un paradosso storico. MAI una generalità.
5. Collega SEMPRE la narrazione agli interessi dell'utente in modo esplicito e creativo.
6. Ogni narrazione deve essere UNICA e NON RIPETIBILE — come se fosse scritta da uno storyteller locale che conosce segreti che nessun turista troverà online.
7. non inventarti NULLA che non sia verificabile. Se non sai, lascia perdere. La credibilità è tutto.

STILI per personalità dominante — segui ESATTAMENTE il tono indicato:

relax → Rallenta il ritmo. Usa frasi brevi, atmosferiche. Es: "Il silenzio qui ha un peso diverso. Chiudi gli occhi un secondo..."
divertimento → Spiritoso, con una battuta o una situazione assurda. Es: "Quindi 80.000 persone urlavano qui ogni domenica. Il tuo stadio preferito si sente in colpa."
cultura → Denso di dettagli precisi, date, nomi, numeri. Es: "Nel 125 d.C., mentre Adriano supervisionava i lavori, l'oculus pesava già 4.535 tonnellate — senza una sola vite."
avventura → Epico, cinematografico, misterioso. Es: "C'è qualcosa di nascosto qui che quasi nessuno nota. Preparati a cercarlo."
socialita → Caldo, che include il lettore in un "noi". Es: "Ogni anno 3 milioni di persone fanno la stessa cosa che stai per fare tu. La differenza è che tu sai il perché."

Rispondi SOLO con JSON: { "narration": "...", "hiddenFact": "...", "voiceStyle": "enthusiastic"|"mysterious"|"calm" }`;

export async function generateNarration(input: NarrationInput): Promise<NarrationResult> {
  const dominant = getDominantTrait(input.personality);

  // Build a rich interest-connection prompt
  const interestLine = input.userInterests?.length
    ? `INTERESSI DICHIARATI: ${input.userInterests.join(', ')}.\nOBBLIGATORIO: trova un collegamento ESPLICITO tra ${input.poiName} e almeno uno di questi interessi. Non accennarlo — costruisci la narrazione attorno a quel collegamento.`
    : '';

  const userMessage = `Genera una narrazione personalizzata INEDITA e UNICA. Non ripetere mai contenuti enciclopedici.

LUOGO: ${input.poiName}
CATEGORIA: ${input.category}
DESCRIZIONE: ${input.poiDescription}
STORIA NOTA (NON RIPETERE QUESTA): ${input.shortStory}
CURIOSITÀ GIÀ NOTA (NON RIPETERE QUESTA, INVENTA UNA NUOVA): ${input.hiddenFact}
MOMENTO DELLA GIORNATA: ${input.timeOfDay}
PERSONALITÀ DOMINANTE: ${dominant}
SCORES COMPLETI: relax=${input.personality.relax}, divertimento=${input.personality.divertimento}, cultura=${input.personality.cultura}, avventura=${input.personality.avventura}, socialita=${input.personality.socialita}
${interestLine}

IMPORTANTE:
- La curiosità nascosta (hiddenFact) DEVE essere INEDITA: un fatto che non si trova su Wikipedia, guide turistiche o blog di viaggio. Deve essere sorprendente e iperspecifica.
- Deve contenere almeno un dato preciso (numero, anno, misura, nome, paradosso).
- La narrazione deve essere nel tono "${dominant}": segui ESATTAMENTE le istruzioni di stile.
- È ${input.timeOfDay}: usa questo per creare atmosfera (luce, folla, temperatura, rumori del momento).
- NON generare contenuto generico da enciclopedia. Questa è una storia UNICA che potrebbe raccontare solo un abitante del quartiere.`;

  return generateStructured<NarrationResult>(SYSTEM_PROMPT, userMessage);
}