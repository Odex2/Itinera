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

2. COUNTDOWN (conta / osserva, input libero): l'utente guarda e conta.
   → options: [], correctAnswer: <numero intero>, timeLimit: 10-20 secondi
   ⚠️  USA QUESTO TIPO SOLO SE conosci il numero con certezza assoluta (es. colonne Pantheon=16, gradini Campidoglio=124).
   Se non sei sicuro al 100%, usa quiz a scelta multipla invece.
   Esempio valido: "Conta le colonne della facciata. Hai 15 secondi."
   Esempio NON valido: "Conta gli anelli" (se non ne sei certo documentatamente)

3. OBSERVATION (cerca / trova, preferibilmente scelta multipla): l'utente cerca un dettaglio fisico.
   → Usa PREFERIBILMENTE options con 4 scelte. Se usi options:[] il numero DEVE essere un fatto documentato.
   Esempio con opzioni: "Quale dei seguenti simboli è inciso sulla colonna? A) aquila B) lupa C) croce D) spiga"
4. CHOICE (narrativa): l'utente sceglie un percorso, non c'è risposta giusta.
   → options: 3 scelte narrative, correctAnswer: -1 (sempre "corretto")

REGOLE:
- Per COUNTDOWN: usa options=[] e correctAnswer=<numero> SOLO SE sei assolutamente certo del numero (es. elementi architettonici documentati). In caso di dubbio, converti in quiz a scelta multipla.
- Per OBSERVATION: usa SEMPRE opzioni multiple (4 scelte), mai input libero.
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

  // Pass high temperature for creative variety + a random seed string
  // so the model explores different angles even for the same POI
  const ANGLES = [
    'prospettiva storica e politica',
    'dettagli architettonici e materiali',
    'curiosità umane e aneddoti personali',
    'connessioni con la vita quotidiana romana',
    'paradossi e contraddizioni del luogo',
    'dimensioni, misure e numeri sorprendenti',
    'confronto prima e dopo nel tempo',
    'leggende urbane e misteri irrisolti',
  ];
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
  const seed = Math.random().toString(36).slice(2, 8);
  const variedMessage = userMessage + `\n\nANGOLO CREATIVO PER QUESTA SESSIONE [${seed}]: Privilegia sfide con angolazione "${angle}". Genera domande che nessuno si aspetterebbe su questo luogo.`;

  const raw = await generateStructured<GeneratedChallenge[]>(SYSTEM_PROMPT, variedMessage, 0.9);

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