import { config } from '../config.js';

// Default Italian voice (Bella - warm, natural Italian)
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

const VOICE_STYLE_SETTINGS: Record<string, object> = {
  enthusiastic: { stability: 0.4, similarity_boost: 0.75, style: 0.6, use_speaker_boost: true },
  mysterious:   { stability: 0.6, similarity_boost: 0.80, style: 0.4, use_speaker_boost: false },
  calm:         { stability: 0.8, similarity_boost: 0.85, style: 0.2, use_speaker_boost: false },
};

export async function synthesizeSpeech(
  text: string,
  voiceStyle: 'enthusiastic' | 'mysterious' | 'calm' = 'calm',
  voiceId: string = DEFAULT_VOICE_ID,
): Promise<Buffer> {
  if (!config.elevenlabsApiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voiceSettings = VOICE_STYLE_SETTINGS[voiceStyle] ?? VOICE_STYLE_SETTINGS.calm;

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': config.elevenlabsApiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: voiceSettings,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
