import { Router, Request, Response } from 'express';
import { discoverPOIs } from '../agents/poiDiscoverer.js';
import { generateSpokenChallenge } from '../agents/challengeDialogue.js';
import { validateAnswer } from '../agents/answerValidator.js';
import { synthesizeSpeech } from '../services/elevenlabs.js';
import { transcribeAudio } from '../services/whisper.js';
import { filterOpenPOIs } from '../utils/timeFilter.js';
import { filterUncompletedPOIs, inMemoryStore } from '../utils/completedChallenges.js';
import { fetchOverpassPOIs } from '../services/overpass.js';
import { config } from '../config.js';

export const discoverRouter = Router();

// ── POST /api/ai/discover-pois (Bug 02 & 12) ───────────────────

discoverRouter.post('/discover-pois', async (req: Request, res: Response) => {
  try {
    const { lat, lng, interests } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number' || !Array.isArray(interests)) {
      res.status(400).json({ error: 'lat (number), lng (number), and interests (string[]) are required' });
      return;
    }

    const pois = await discoverPOIs({ lat, lng, interests });
    res.json({ pois });
  } catch (err) {
    console.error('[AI /discover-pois]', err);
    res.status(500).json({ error: 'Failed to discover POIs' });
  }
});

// ── POST /api/ai/spoken-challenge (Bug 04a + 04b) ──────────────

discoverRouter.post('/spoken-challenge', async (req: Request, res: Response) => {
  try {
    const { poiName, poiDescription, category, profileTag, lat, lng } = req.body;

    if (!poiName || !profileTag) {
      res.status(400).json({ error: 'poiName and profileTag are required' });
      return;
    }

    if (!config.elevenlabsApiKey) {
      res.status(503).json({ error: 'Voice service not configured' });
      return;
    }

    // 1. Generate the challenge text via the Dialogue agent
    const challenge = await generateSpokenChallenge({
      poiName,
      poiDescription: poiDescription || '',
      category: category || 'cultura',
      profileTag,
      lat: lat || 0,
      lng: lng || 0,
    });

    // 2. Synthesize the question to speech via ElevenLabs
    const audioBuffer = await synthesizeSpeech(challenge.question, challenge.voiceStyle);

    // 3. Return challenge metadata + audio as base64
    // (base64 avoids multipart complexity; frontend decodes to audio)
    res.json({
      challenge: {
        question: challenge.question,
        correctAnswer: challenge.correctAnswer,
        acceptableKeywords: challenge.acceptableKeywords,
        difficulty: challenge.difficulty,
        xpBonus: challenge.xpBonus,
        voiceStyle: challenge.voiceStyle,
      },
      audio: {
        base64: audioBuffer.toString('base64'),
        mimeType: 'audio/mpeg',
        byteLength: audioBuffer.length,
      },
    });
  } catch (err) {
    console.error('[AI /spoken-challenge]', err);
    res.status(500).json({ error: 'Failed to generate spoken challenge' });
  }
});

// ── POST /api/ai/answer-challenge (Bug 04c) ────────────────────

discoverRouter.post('/answer-challenge', async (req: Request, res: Response) => {
  try {
    const { challengeQuestion, correctAnswer, acceptableKeywords } = req.body;

    // Audio file expected as base64 in req.body.audio
    const audioBase64: string | undefined = req.body.audio;
    const audioFilename: string = req.body.audioFilename || 'recording.webm';

    if (!challengeQuestion || !audioBase64) {
      res.status(400).json({ error: 'challengeQuestion and audio (base64) are required' });
      return;
    }

    if (!config.regaloApiKey) {
      res.status(503).json({ error: 'Regolo API key not configured (needed for STT)' });
      return;
    }

    // 1. Decode audio and transcribe with Whisper
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const transcript = await transcribeAudio(audioBuffer, audioFilename);

    // 2. Quick keyword check (fast path before AI validation)
    const normalizedTranscript = transcript.toLowerCase().trim();
    const keywordMatch = acceptableKeywords?.some((kw: string) =>
      normalizedTranscript.includes(kw.toLowerCase()),
    );

    // 3. AI-powered validation for nuanced answers
    const validation = await validateAnswer({
      challengeQuestion,
      challengeType: 'voice',
      userAnswer: transcript,
      context: correctAnswer
        ? `La risposta corretta è: ${correctAnswer}. Parole chiave accettabili: ${acceptableKeywords?.join(', ') ?? ''}`
        : '',
    });

    // Boost confidence if keywords matched
    if (keywordMatch && !validation.correct) {
      validation.correct = true;
      validation.xpAwarded = Math.max(validation.xpAwarded, 40);
    }

    res.json({
      transcript,
      ...validation,
    });
  } catch (err) {
    console.error('[AI /answer-challenge]', err);
    res.status(500).json({ error: 'Failed to process voice answer' });
  }
});

// ── POST /api/ai/filter-open (Bug 05) ──────────────────────────

discoverRouter.post('/filter-open', async (req: Request, res: Response) => {
  try {
    const { pois } = req.body;
    if (!Array.isArray(pois)) {
      res.status(400).json({ error: 'pois (array) is required' });
      return;
    }
    const openPois = filterOpenPOIs(pois);
    res.json({ pois: openPois, total: pois.length, open: openPois.length });
  } catch (err) {
    console.error('[AI /filter-open]', err);
    res.status(500).json({ error: 'Failed to filter open POIs' });
  }
});

// ── GET /api/ai/overpass (Bug 06) ───────────────────────────────

discoverRouter.get('/overpass', async (req: Request, res: Response) => {
  try {
    const south = parseFloat(req.query.south as string);
    const west = parseFloat(req.query.west as string);
    const north = parseFloat(req.query.north as string);
    const east = parseFloat(req.query.east as string);

    if ([south, west, north, east].some(isNaN)) {
      res.status(400).json({ error: 'south, west, north, east query params are required' });
      return;
    }

    const elements = await fetchOverpassPOIs(south, west, north, east);
    res.json({ elements, count: elements.length });
  } catch (err) {
    console.error('[AI /overpass]', err);
    res.status(500).json({ error: 'Failed to fetch Overpass data' });
  }
});

// ── POST /api/ai/uncompleted (Bug 09) ──────────────────────────

discoverRouter.post('/uncompleted', async (req: Request, res: Response) => {
  try {
    const { userId, pois } = req.body;

    if (!userId || !Array.isArray(pois)) {
      res.status(400).json({ error: 'userId (string) and pois (array) are required' });
      return;
    }

    const uncompleted = await filterUncompletedPOIs(userId, pois);
    res.json({ pois: uncompleted, filtered: pois.length - uncompleted.length });
  } catch (err) {
    console.error('[AI /uncompleted]', err);
    res.status(500).json({ error: 'Failed to filter completed POIs' });
  }
});

// ── POST /api/ai/mark-completed (Bug 09 companion) ─────────────

discoverRouter.post('/mark-completed', async (req: Request, res: Response) => {
  try {
    const { userId, poiId } = req.body;

    if (!userId || !poiId) {
      res.status(400).json({ error: 'userId and poiId are required' });
      return;
    }

    await inMemoryStore.markCompleted(userId, poiId);
    res.json({ success: true });
  } catch (err) {
    console.error('[AI /mark-completed]', err);
    res.status(500).json({ error: 'Failed to mark POI as completed' });
  }
});
