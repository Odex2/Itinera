import { Router, Request, Response } from 'express';
import { synthesizeSpeech } from '../services/elevenlabs.js';
import { config } from '../config.js';

export const voiceRouter = Router();

// POST /api/voice/tts
// Body: { text: string, voiceStyle?: 'enthusiastic' | 'mysterious' | 'calm', voiceId?: string }
voiceRouter.post('/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceStyle = 'calm', voiceId } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    if (text.length > 2000) {
      res.status(400).json({ error: 'text too long (max 2000 chars)' });
      return;
    }

    if (!config.elevenlabsApiKey) {
      res.status(503).json({ error: 'Voice service not configured' });
      return;
    }

    const audioBuffer = await synthesizeSpeech(text, voiceStyle, voiceId);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=3600', // cache 1h on client
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('[Voice /tts]', err);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});
