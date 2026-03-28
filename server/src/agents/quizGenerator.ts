import { generateStructured } from '../services/claude.js';

interface GeneratedChallenge {
  type: 'quiz' | 'countdown' | 'observation' | 'choice';
  question: string;
  description?: string;
  options: string[];       // empty array [] for free-input challenges (countdown/observation)
  correctAnswer: number;   // for multiple-choice: index 0-3; for free-input: the numeric answer
  timeLimit?: number;
  hint?: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  xpBonus: number;
}

interface QuizGeneratorInput {
  poiName: string;
  poiDescription: string;
  hiddenFact: string;
  shortStory: string;
  category: string;
  count: number;
  userInterests?: string[];
  difficulty?: string;
}

// BUG 3 FIX: Completely rewritten prompt.
// Problems with the old version:
// 1. It generated the same 4 quiz options even for "count the arches" challenges,
//    which should have a free numeric answer.
// 2. It wasn't truly customized on user interests — it just listed them.
// 3. It never generated challenges that required physical interaction (walk around,
//    find the hidden detail, etc.).
//
// New prompt:
// - Explicitly supports two challenge modes: multiple-choice (options array with 4 items)
//   and free-input (options = [], correctAnswer = the numeric answer).
// - Forces at least one "do something physical" challenge per set.
// - Requires interest-tailored framing (a history buff gets different phrasing than a foodie).
// - Requires counting/observation challenges to use free-input mode.
const SYSTEM_PROMPT = `Sei il Quiz Master di "Play The City", gioco di esplorazione urbana a Roma.

TIPI DI SFIDA — usa una MIX di questi:

1. QUIZ (scelta multipla): domanda con 4 opzioni, una corretta.
   → options: ["A","B","C","D"], correctAnswer: 0-3

2. COUNTDOWN (conta / osserva, input libero): l'utente guarda e conta. NON dare opzioni.
   → options: [], correctAnswer: <numero intero>, timeLimit: 10-20 secondi
   Esempio: "Conta i gradini della rampa principale. Hai 15 secondi."

3. OBSERVATION (cerca / trova, input libero o opzioni): l'utente cerca un dettaglio fisico.
   → Può avere options (se è una scelta) o options:[] con correctAnswer numerico se deve contare.
   Esempio senza opzioni: "Quante finestre ha la facciata nord? Hai 20 secondi."
   Esempio con opzioni: "Quale dei seguenti simboli è nascosto sulla colonna di sinistra?"

4. CHOICE (narrativa): l'utente sceglie un percorso, non c'è risposta giusta.
   → options: 3 scelte narrative, correctAnswer: -1 (sempre "corretto")

REGOLE:
- Per COUNTDOWN e OBSERVATION che richiedono conteggio: options DEVE essere [] e correctAnswer DEVE essere il numero atteso.
- Domande NON banali: no "In che anno è stato costruito?", no "Chi lo ha progettato?" salvo se l'anno/il nome sia controintuitivo.
- Almeno una sfida deve richiedere di MUOVERSI fisicamente (camminare, girare attorno, toccare, cercare).
- Personalizza il TONO in base agli interessi: se l'utente ama l'enogastronomia, collega la domanda al cibo/vino locale; se ama lo sport, usa metafore sportive; se ama l'arte, chiedi di osservare stili architettonici.
- Le opzioni sbagliate devono essere plausibili, non ridicole.
- xpBonus: facile=20-30, medio=40-60, difficile=70-120

Rispondi SOLO con un array JSON valido. Nessun testo aggiuntivo.`;

export async function generateQuiz(input: QuizGeneratorInput): Promise<GeneratedChallenge[]> {
  const interestContext = input.userInterests?.length
    ? `INTERESSI UTENTE: ${input.userInterests.join(', ')}.
Usa questi interessi per personalizzare il TONO e il COLLEGAMENTO delle sfide. Ad esempio:
- enogastronomia → collega al cibo/vino/taverne storiche legate al luogo
- arte → chiedi di osservare stile architettonico, simboli, materiali
- sport → usa metafore di gara, sfida fisica, record
- storia → vai sul paradosso storico, l'ironia, il retroscena scomodo
- shopping → collega ai materiali, ai commerci storici del luogo`
    : '';

  const diffContext = input.difficulty
    ? `DIFFICOLTÀ PREFERITA: ${input.difficulty}. Tendenza verso questa difficoltà, ma puoi variare.`
    : '';

  const userMessage = `Genera ${input.count} sfide per:

LUOGO: ${input.poiName}
CATEGORIA: ${input.category}
DESCRIZIONE: ${input.poiDescription}
STORIA: ${input.shortStory}
CURIOSITÀ NASCOSTA: ${input.hiddenFact}
${interestContext}
${diffContext}

OBBLIGATORIO:
- Genera un MIX di tipi (almeno 1 quiz E almeno 1 tra countdown/observation).
- Se generi un countdown o observation che richiede CONTEGGIO: usa options=[] e correctAnswer=<numero>.
- Almeno una sfida deve richiedere azione fisica sul posto.
- Ogni sfida deve sembrare scritta su misura per questo utente, non copiata da Wikipedia.`;

  const raw = await generateStructured<GeneratedChallenge[]>(SYSTEM_PROMPT, userMessage);

  // Normalize: ensure correctAnswer=-1 for 'choice' type,
  // and that free-input challenges have empty options array
  return raw.map((c) => {
    if (c.type === 'choice') {
      return { ...c, options: c.options ?? [], correctAnswer: -1 };
    }
    // If it's countdown/observation with numeric answer already, keep it
    return {
      ...c,
      options: c.options ?? [],
      correctAnswer: c.correctAnswer ?? 0,
    };
  });
}