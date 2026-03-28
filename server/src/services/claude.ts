import OpenAI from 'openai';
import { config } from '../config.js';

const client = new OpenAI({
  apiKey: config.regaloApiKey,
  baseURL: 'https://api.regolo.ai/v1',
});

export async function generateStructured<T>(
  systemPrompt: string,
  userMessage: string,
): Promise<T> {
  const response = await client.chat.completions.create({
    model: 'Llama-3.3-70B-Instruct',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.choices[0]?.message?.content;
  if (!textBlock) {
    throw new Error('No text response from Regolo.ai');
  }

  // Extract JSON from the response (handles ```json blocks too)
  let jsonStr = textBlock;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  return JSON.parse(jsonStr.trim()) as T;
}
