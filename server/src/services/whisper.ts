import OpenAI from 'openai';
import { config } from '../config.js';

// Use Regolo's STT endpoint (OpenAI-compatible)
const client = new OpenAI({
  apiKey: config.regaloApiKey,
  baseURL: 'https://api.regolo.ai/v1',
});

/**
 * Transcribes an audio buffer using Regolo's faster-whisper-large-v3.
 * Recommended: audio chunks < 2 minutes to prevent hallucinations.
 * Accepts mp3, wav, webm, m4a, ogg formats.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = 'recording.ogg',
): Promise<string> {
  if (!config.regaloApiKey) {
    throw new Error('Regolo API key not configured (required for STT)');
  }

  // Create a File object from the buffer for the OpenAI SDK
  const file = new File([new Uint8Array(audioBuffer)], filename, {
    type: getMimeType(filename),
  });

  const transcription = await client.audio.transcriptions.create({
    model: 'faster-whisper-large-v3',
    file,
    language: 'it', // Italian
  });

  return transcription.text;
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    webm: 'audio/webm',
    m4a: 'audio/m4a',
    ogg: 'audio/ogg',
  };
  return mimeTypes[ext ?? ''] ?? 'audio/ogg';
}
