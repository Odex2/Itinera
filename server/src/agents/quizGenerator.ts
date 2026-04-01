import { generateStructured } from '../services/regolo.js';

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
  mode?: 'visual' | 'topic';
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
const VISUAL_SYSTEM_PROMPT = `Sei il Quiz Master di "Play The City", gioco di esplorazione urbana a Roma.

TIPI DI SFIDA:

1. QUIZ (scelta multipla): domanda con 4 opzioni, una corretta.
   → options: ["Testo vera risposta", "Testo risposta sbagliata 1", "Testo risposta sbagliata 2"], correctAnswer: 0-2

REGOLE:
- Domande NON banali e NON generiche: le domande devono riguardare dettagli storici, architettonici, curiosità o storie inconfondibilmente legate a QUESTO SPECIFICO LUOGO. Non fare domande applicabili ad altre piazze o monumenti.
- Personalizza il TONO in base agli interessi: se l'utente ama l'enogastronomia, collega la domanda al cibo/vino locale; se ama lo sport, usa metafore sportive; se ama l'arte, chiedi di osservare stili architettonici.
- Le opzioni sbagliate devono essere plausibili, non ridicole.
- xpBonus: facile=20-30, medio=40-60, difficile=70-120
- Framing: "Quanto ne sai su..." piuttosto che "Guarda e rispondi..."
- REGOLA AGGIUNTIVA FONDAMENTALE: Ignora quanto scritto sopra sul numero di opzioni. Le sfide di tipo QUIZ devono categoricamente avere SOLO 3 OPZIONI contenenti ESPRESSAMENTE IL TESTO DELLE RISPOSTE (es. ["Il Colosseo", "Il Pantheon", "I Fori Imperiali"]). NON INVIARE MAI le lettere "A", "B", "C". Di conseguenza, correctAnswer DEVE essere esclusivamente 0, 1 o 2. Invia ESATTAMENTE e SOLO 3 opzioni, non 4.

Rispondi SOLO con un array JSON valido con questa struttura esatta:
[
  {
    "type": "quiz",
    "question": "Testo della domanda sulla storia o sul dettaglio...",
    "options": ["Testo vera risposta", "Risposta falsa 1", "Risposta falsa 2"],
    "correctAnswer": 0,
    "difficulty": "medio",
    "xpBonus": 50
  }
]
Nessun blocco testuale fuori dal JSON.`;

const TOPIC_SYSTEM_PROMPT = `Sei il Quiz Master di "Play The City", gioco di esplorazione urbana a Roma.

L'utente è LONTANO dal luogo, quindi NON può osservare fisicamente nulla. Genera quiz culturali e narrativi.

TIPI DI SFIDA CONSENTITI:

1. QUIZ (scelta multipla): domanda con 4 opzioni, una corretta.
   → options: ["Testo vera risposta", "Testo risposta sbagliata 1", "Testo risposta sbagliata 2"], correctAnswer: 0-2

REGOLE:
- Le domande devono essere risolvibili da QUALSIASI luogo, basate su conoscenza culturale, storica o curiosità.
- Personalizza il TONO in base agli interessi dell'utente: se ama l'enogastronomia, collega la domanda al cibo/vino; se ama lo sport, usa metafore sportive; se ama l'arte, chiedi di stili e movimenti artistici.
- Domande NON banali: no "In che anno è stato costruito?", no "Chi lo ha progettato?" salvo se controintuitivo.
- Le opzioni sbagliate devono essere plausibili, non ridicole.
- Framing: "Quanto ne sai su..." piuttosto che "Guarda e rispondi..."
- xpBonus: facile=20-30, medio=40-60, difficile=70-120
- REGOLA AGGIUNTIVA FONDAMENTALE: Ignora quanto scritto sopra sul numero di opzioni. Le sfide di tipo QUIZ devono categoricamente avere SOLO 3 OPZIONI contenenti ESPRESSAMENTE IL TESTO DELLE RISPOSTE (es. ["Il Colosseo", "Il Pantheon", "I Fori Imperiali"]). NON INVIARE MAI le lettere "A", "B", "C". Di conseguenza, correctAnswer DEVE essere esclusivamente 0, 1 o 2. Invia ESATTAMENTE e SOLO 3 opzioni, non 4.

Rispondi SOLO con un array JSON valido con questa struttura esatta:
[
  {
    "type": "quiz",
    "question": "Testo della domanda sulla cultura o storia del luogo...",
    "options": ["Testo vera risposta", "Risposta falsa 1", "Risposta falsa 2"],
    "correctAnswer": 0,
    "difficulty": "medio",
    "xpBonus": 50
  }
]
Nessun blocco testuale fuori dal JSON.`;

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
- Genera SOLO domande relative a questo preciso LUOGO (${input.poiName}). Le sfide devono essere totalmente diverse da quelle di qualsiasi altro luogo della città.
- Ignora riferimenti a countdown, observation o choice; genera **SOLO** quiz a risposta multipla (type: "quiz").
- Ogni sfida deve sembrare scritta su misura per questo utente e per il suo punto di vista su quel luogo esatto.`;

  const systemPrompt = input.mode === 'topic' ? TOPIC_SYSTEM_PROMPT : VISUAL_SYSTEM_PROMPT;
  const raw = await generateStructured<GeneratedChallenge[]>(systemPrompt, userMessage);

  // Normalize: ensure correctAnswer=-1 for 'choice' type,
  // and that free-input challenges have empty options array.
  // In topic mode, force any physical types to quiz as a safety net.
  return raw.map((c) => {
    // Normalizza sempre il type a minuscolo
    const normalizedType = String(c.type).toLowerCase() as GeneratedChallenge['type'];

    if (input.mode === 'topic' && (normalizedType === 'countdown' || normalizedType === 'observation')) {
      c = { ...c, type: 'quiz' };
    } else {
      c.type = normalizedType;
    }

    // Default fallback x xpBonus e difficulty just in case
    c.xpBonus = c.xpBonus || 50;
    c.difficulty = c.difficulty || 'medio';

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