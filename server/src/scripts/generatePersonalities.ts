/**
 * Bug 08 — Static Profiles: Offline script that generates a 1-sentence
 * "personality" for each POI using GPT-4, and prepares a DB update array.
 *
 * Usage:
 *   npx tsx src/scripts/generatePersonalities.ts
 *
 * Reads POI data from stdin (JSON array) or a hardcoded source,
 * calls GPT-4 for each POI, and outputs a JSON array of updates.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.REGOLO_API_KEY,
  baseURL: 'https://api.regolo.ai/v1',
});

interface POIInput {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface PersonalityUpdate {
  id: string;
  personality: string;
}

const SYSTEM_PROMPT = `Sei un copywriter creativo per "Play The City", un gioco di esplorazione urbana a Roma.
Per ogni luogo, genera UNA SOLA FRASE (max 20 parole) che ne catturi la "personalità" — come se il luogo fosse un personaggio.
La frase deve essere evocativa, memorabile e in italiano.
Rispondi SOLO con la frase, senza virgolette né punteggiatura iniziale.`;

async function generatePersonality(poi: POIInput): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'Llama-3.3-70B-Instruct',
    max_tokens: 100,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `LUOGO: ${poi.name}\nCATEGORIA: ${poi.category}\nDESCRIZIONE: ${poi.description}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? '';
}

async function main() {
  // Read POI data from stdin or use sample data
  let pois: POIInput[];

  const stdinData = await readStdin();
  if (stdinData) {
    pois = JSON.parse(stdinData);
  } else {
    console.error('No input provided. Pipe a JSON array of POIs via stdin:');
    console.error('  cat pois.json | npx tsx src/scripts/generatePersonalities.ts');
    process.exit(1);
  }

  console.error(`Generating personalities for ${pois.length} POIs...`);

  const updates: PersonalityUpdate[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < pois.length; i += BATCH_SIZE) {
    const batch = pois.slice(i, i + BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (poi) => {
        try {
          const personality = await generatePersonality(poi);
          console.error(`  ✓ ${poi.name}: "${personality}"`);
          return { id: poi.id, personality };
        } catch (err) {
          console.error(`  ✗ ${poi.name}: ${(err as Error).message}`);
          return { id: poi.id, personality: '' };
        }
      }),
    );

    updates.push(...results.filter((u) => u.personality !== ''));
  }

  // Output the DB update array as JSON to stdout
  console.log(JSON.stringify(updates, null, 2));
  console.error(`\nDone. ${updates.length}/${pois.length} personalities generated.`);
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
