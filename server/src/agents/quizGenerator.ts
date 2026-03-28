import { generateStructured } from '../services/claude.js';

interface GeneratedChallenge {
  type: 'quiz' | 'countdown' | 'observation' | 'choice';
  question: string;
  description?: string;
  options: string[];
  correctAnswer: number;
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

const SYSTEM_PROMPT = `Sei il Quiz Master di "Play The City", un gioco di esplorazione urbana a Roma.

Il tuo compito e generare sfide interattive e coinvolgenti basate su luoghi reali.

REGOLE FONDAMENTALI:
1. Le domande devono richiedere INFERENZA e RAGIONAMENTO, non semplice memoria
2. Se un fatto dice "la colonna e di Traiano", NON chiedere "di chi e la colonna?"
3. Mescola i tipi: quiz (scelta multipla), countdown (a tempo), observation (osservazione del luogo)
4. Le risposte sbagliate devono essere plausibili, non ovviamente false
5. Includi curiosita sorprendenti e poco conosciute
6. Il tono deve essere avventuroso e coinvolgente, come un game master
7. La lingua e l'italiano

Per ogni sfida, specifica:
- type: "quiz" | "countdown" | "observation" | "choice"
- question: la domanda
- description: contesto narrativo (opzionale)
- options: 4 opzioni di risposta
- correctAnswer: indice (0-3) della risposta corretta
- timeLimit: secondi (solo per countdown, tipicamente 15-30)
- hint: suggerimento (opzionale, per observation)
- difficulty: "facile" | "medio" | "difficile"
- xpBonus: punti (facile: 20-30, medio: 40-60, difficile: 70-100)

Rispondi SOLO con un array JSON valido.`;

export async function generateQuiz(input: QuizGeneratorInput): Promise<GeneratedChallenge[]> {
  const userMessage = `Genera ${input.count} sfide per il seguente punto di interesse:

LUOGO: ${input.poiName}
CATEGORIA: ${input.category}
DESCRIZIONE: ${input.poiDescription}
STORIA: ${input.shortStory}
CURIOSITA NASCOSTA: ${input.hiddenFact}
${input.userInterests ? `INTERESSI UTENTE: ${input.userInterests.join(', ')}` : ''}
${input.difficulty ? `DIFFICOLTA PREFERITA: ${input.difficulty}` : ''}

Genera un mix di tipi diversi (almeno 1 quiz e 1 di altro tipo). Le domande devono essere stimolanti e non banali.`;

  return generateStructured<GeneratedChallenge[]>(SYSTEM_PROMPT, userMessage);
}
