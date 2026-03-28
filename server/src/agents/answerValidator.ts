import { generateStructured } from '../services/claude.js';

interface ValidationResult {
  correct: boolean;
  explanation: string;
  xpAwarded: number;
}

interface ValidateInput {
  challengeQuestion: string;
  challengeType: string;
  userAnswer: string;
  context: string;
}

const SYSTEM_PROMPT = `Sei il validatore di risposte di "Play The City".

Il tuo compito e valutare le risposte libere degli utenti alle sfide del gioco.
Sii generoso ma giusto: accetta risposte che dimostrano comprensione anche se non perfettamente formulate.

Per le sfide "observation" e "photo", valuta se la descrizione dell'utente corrisponde a cio che dovrebbe aver osservato.

Rispondi SOLO con un oggetto JSON: { "correct": boolean, "explanation": "...", "xpAwarded": number }
- Se corretto: xpAwarded = 40-80 in base alla qualita della risposta
- Se sbagliato: xpAwarded = 5-10 (punti partecipazione)`;

export async function validateAnswer(input: ValidateInput): Promise<ValidationResult> {
  const userMessage = `Valuta questa risposta:

TIPO SFIDA: ${input.challengeType}
DOMANDA: ${input.challengeQuestion}
CONTESTO: ${input.context}
RISPOSTA UTENTE: ${input.userAnswer}`;

  return generateStructured<ValidationResult>(SYSTEM_PROMPT, userMessage);
}
