import { Router, Request, Response } from 'express';
import { discoverPOIs } from '../agents/poiDiscoverer.js';
import { generateSpokenChallenge } from '../agents/challengeDialogue.js';
import { validateAnswer } from '../agents/answerValidator.js';
import { synthesizeSpeech } from '../services/elevenlabs.js';
import { transcribeAudio } from '../services/whisper.js';
import { filterOpenPOIs } from '../utils/timeFilter.js';
import { filterUncompletedPOIs, inMemoryStore } from '../utils/completedChallenges.js';
import { fetchOverpassPOIs, type OverpassElement } from '../services/overpass.js';
import { config } from '../config.js';

export const discoverRouter = Router();

// ── BUG 4 FIX: helpers to convert Overpass bar elements into the DiscoveredPOI format ──

/**
 * Converts an Overpass element (bar/pub/cafe) to a DiscoveredPOI shape.
 * Returns null if the element lacks coordinates or a name.
 */
function overpassToPOI(el: OverpassElement): DiscoveredPOI | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const name = el.tags?.name;

  if (!lat || !lon || !name) return null;

  const amenity = el.tags?.amenity ?? 'bar';
  const partnerType = amenity === 'pub' ? 'pub' : amenity === 'cafe' ? 'caffè' : 'bar';
  const opening = el.tags?.opening_hours ?? '';
  const openingNote = opening ? ` Orari: ${opening}.` : '';

  return {
    id: `osm-${el.id}`,
    name,
    description: `${partnerType.charAt(0).toUpperCase() + partnerType.slice(1)} nelle vicinanze.${openingNote}`,
    lat,
    lng: lon,
    category: 'enogastronomia',
    importanceScore: 42,   // below AI-discovered gems, above nothing
    unlockDistance: 50,    // must be nearby to unlock
    xpReward: 60,
    source: 'openstreetmap',
  };
}

interface DiscoveredPOI {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  category: string;
  importanceScore: number;
  unlockDistance: number;
  xpReward: number;
  source?: string;
}

/**
 * Builds a rough bounding box around a lat/lng point for an 800m radius.
 */
function buildBbox(lat: number, lng: number, radiusMeters = 800) {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  return {
    south: lat - latDelta,
    north: lat + latDelta,
    west: lng - lngDelta,
    east: lng + lngDelta,
  };
}

// ── POST /api/ai/discover-pois ─────────────────────────────────
// BUG 4 FIX: now runs BOTH the AI discovery agent AND the Overpass API
// in parallel, then merges and deduplicates the results.
// The AI agent finds hidden cultural gems; Overpass finds real nearby bars.

discoverRouter.post('/discover-pois', async (req: Request, res: Response) => {
  try {
    const { lat, lng, interests } = req.body;

    if (typeof lat !== 'number' || typeof lng !== 'number' || !Array.isArray(interests)) {
      res.status(400).json({ error: 'lat (number), lng (number), and interests (string[]) are required' });
      return;
    }

    const bbox = buildBbox(lat, lng, 800);

    // Run AI discovery + Overpass bar lookup in parallel
    const [aiPois, overpassElements] = await Promise.allSettled([
      discoverPOIs({ lat, lng, interests }),
      fetchOverpassPOIs(bbox.south, bbox.west, bbox.north, bbox.east),
    ]);

    // Collect AI-discovered POIs
    const pois: DiscoveredPOI[] = aiPois.status === 'fulfilled' ? aiPois.value : [];

    // Convert and merge Overpass bars (skip if Overpass failed)
    if (overpassElements.status === 'fulfilled') {
      const existingIds = new Set(pois.map((p) => p.id));

      // Limit to 5 nearest bars to avoid flooding the map
      const bars = overpassElements.value
        .map(overpassToPOI)
        .filter((p): p is DiscoveredPOI => p !== null)
        .filter((p) => !existingIds.has(p.id))
        .slice(0, 5);

      pois.push(...bars);
    }

    res.json({ pois });
  } catch (err) {
    console.error('[AI /discover-pois]', err);
    res.status(500).json({ error: 'Failed to discover POIs' });
  }
});

// ── POST /api/ai/spoken-challenge ─────────────────────────────

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

    const challenge = await generateSpokenChallenge({
      poiName,
      poiDescription: poiDescription || '',
      category: category || 'cultura',
      profileTag,
      lat: lat || 0,
      lng: lng || 0,
    });

    const audioBuffer = await synthesizeSpeech(challenge.question, challenge.voiceStyle);

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

// ── POST /api/ai/answer-challenge ─────────────────────────────

discoverRouter.post('/answer-challenge', async (req: Request, res: Response) => {
  try {
    const { challengeQuestion, correctAnswer, acceptableKeywords } = req.body;
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

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const transcript = await transcribeAudio(audioBuffer, audioFilename);

    const normalizedTranscript = transcript.toLowerCase().trim();
    const keywordMatch = acceptableKeywords?.some((kw: string) =>
      normalizedTranscript.includes(kw.toLowerCase()),
    );

    const validation = await validateAnswer({
      challengeQuestion,
      challengeType: 'voice',
      userAnswer: transcript,
      context: correctAnswer
        ? `La risposta corretta è: ${correctAnswer}. Parole chiave accettabili: ${acceptableKeywords?.join(', ') ?? ''}`
        : '',
    });

    if (keywordMatch && !validation.correct) {
      validation.correct = true;
      validation.xpAwarded = Math.max(validation.xpAwarded, 40);
    }

    res.json({ transcript, ...validation });
  } catch (err) {
    console.error('[AI /answer-challenge]', err);
    res.status(500).json({ error: 'Failed to process voice answer' });
  }
});

// ── POST /api/ai/filter-open ───────────────────────────────────

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

// ── GET /api/ai/overpass ───────────────────────────────────────

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

// ── POST /api/ai/uncompleted ───────────────────────────────────

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

// ── POST /api/ai/mark-completed ───────────────────────────────

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