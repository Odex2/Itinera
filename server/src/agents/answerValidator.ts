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

Il tuo compito è valutare le risposte libere degli utenti alle sfide del gioco.
Sii generoso ma giusto: accetta risposte che dimostrano comprensione anche se non perfettamente formulate.

REGOLE DI VALIDAZIONE:
- Per risposte NUMERICHE (conteggio, misure, anni): accetta ±1 di tolleranza sul numero atteso. Es: se la risposta corretta è 8, accetta 7, 8 o 9.
- Per risposte TESTUALI: accetta sinonimi, abbreviazioni, risposte parziali corrette.
- Per sfide "observation": valuta se la descrizione corrisponde a ciò che dovrebbe aver osservato.
- In caso di DUBBIO, preferisci dare corretto piuttosto che sbagliato.
- NON penalizzare errori di ortografia o grammatica.

Rispondi SOLO con un oggetto JSON: { "correct": boolean, "explanation": "...", "xpAwarded": number }
- Se corretto: xpAwarded = 40-80 in base alla qualità della risposta
- Se sbagliato: xpAwarded = 5-10 (punti partecipazione)
- Nell'explanation, se sbagliato, indica sempre la risposta corretta in modo chiaro.`;

export async function validateAnswer(input: ValidateInput): Promise<ValidationResult> {
  const userMessage = `Valuta questa risposta:

TIPO SFIDA: ${input.challengeType}
DOMANDA: ${input.challengeQuestion}
CONTESTO: ${input.context}
RISPOSTA UTENTE: ${input.userAnswer}`;

  return generateStructured<ValidationResult>(SYSTEM_PROMPT, userMessage);
}