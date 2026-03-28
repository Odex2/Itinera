import OpenAI from 'openai';
import { config } from '../config.js';

const client = new OpenAI({
  apiKey: config.regaloApiKey,
  baseURL: 'https://api.regolo.ai/v1',
});

export async function generateStructured<T>(
  systemPrompt: string,
  userMessage: string,
  temperature?: number,
): Promise<T> {
  // BUG FIX: 'system' is NOT a top-level parameter in chat.completions.create.
  // The system prompt must go inside the messages array as role:'system'.
  // Previously the system prompt was silently ignored, causing all AI agents
  // to run without instructions → generic/broken output.
  const response = await client.chat.completions.create({
    model: 'Llama-3.3-70B-Instruct',
    max_tokens: 2048,
    temperature: temperature ?? 0.85, // high temp = varied output, avoids deterministic repeats
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const textBlock = response.choices[0]?.message?.content;
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