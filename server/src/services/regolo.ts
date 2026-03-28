// Regolo.ai REST client — replaces the OpenAI SDK dependency.
// The API key is read ONLY from process.env via config (never exposed to the frontend).

import { config } from '../config.js';

const REGOLO_BASE_URL = 'https://api.regolo.ai/v1';
const REGOLO_MODEL = 'Llama-3.3-70B-Instruct';

interface RegoloMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface RegoloChoice {
  message: { content: string };
}

interface RegoloResponse {
  choices: RegoloChoice[];
}

/**
 * Send a structured generation request to Regolo.ai via direct REST call.
 * Parses the LLM response into the expected JSON shape `T`.
 * SECURITY: API key is read from `config.regaloApiKey` (process.env.REGOLO_API_KEY).
 */
export async function generateStructured<T>(
  systemPrompt: string,
  userMessage: string,
): Promise<T> {
  if (!config.regaloApiKey) {
    throw new Error('REGOLO_API_KEY is not configured in server environment');
  }

  const messages: RegoloMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];

  const res = await fetch(`${REGOLO_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.regaloApiKey}`,
    },
    body: JSON.stringify({
      model: REGOLO_MODEL,
      max_tokens: 2048,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Regolo.ai API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as RegoloResponse;

  const textBlock = data.choices?.[0]?.message?.content;
  if (!textBlock) {
    throw new Error('No text response from Regolo.ai');
  }

  // Extract JSON from the response (handles ```json blocks too)
  let jsonStr = textBlock.trim();

  // Strip markdown code fences if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Find first JSON object or array if there's surrounding prose
  const firstBrace = jsonStr.search(/[{[]/);
  if (firstBrace > 0) {
    jsonStr = jsonStr.slice(firstBrace);
  }

  return JSON.parse(jsonStr) as T;
}
