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
function categorizeOverpass(tags: Record<string, string> | undefined): { category: string; label: string; importance: number } {
  if (!tags) return { category: 'cultura', label: 'Punto di interesse', importance: 42 };
  const amenity = tags.amenity ?? '';
  const tourism = tags.tourism ?? '';
  const historic = tags.historic ?? '';
  const leisure = tags.leisure ?? '';
  const shop = tags.shop ?? '';

  if (tourism === 'museum') return { category: 'cultura', label: 'Museo', importance: 65 };
  if (tourism === 'artwork') return { category: 'arte', label: 'Opera d\'arte', importance: 55 };
  if (tourism === 'attraction') return { category: 'cultura', label: 'Attrazione', importance: 60 };
  if (historic) return { category: 'storia', label: historic === 'memorial' ? 'Memoriale' : historic === 'monument' ? 'Monumento' : historic === 'ruins' ? 'Rovine' : 'Sito storico', importance: 58 };
  if (amenity === 'place_of_worship') return { category: 'cultura', label: 'Chiesa', importance: 55 };
  if (leisure === 'park') return { category: 'natura', label: 'Parco', importance: 50 };
  if (leisure === 'garden') return { category: 'natura', label: 'Giardino', importance: 48 };
  if (amenity === 'restaurant') return { category: 'enogastronomia', label: 'Ristorante', importance: 45 };
  if (amenity === 'cafe') return { category: 'enogastronomia', label: 'Caffè', importance: 42 };
  if (amenity === 'pub') return { category: 'enogastronomia', label: 'Pub', importance: 42 };
  if (amenity === 'bar') return { category: 'enogastronomia', label: 'Bar', importance: 42 };
  if (shop === 'bakery') return { category: 'enogastronomia', label: 'Panificio', importance: 44 };
  if (shop === 'craft') return { category: 'artigianato', label: 'Bottega artigiana', importance: 50 };
  return { category: 'cultura', label: 'Punto di interesse', importance: 42 };
}

function overpassToPOI(el: OverpassElement): DiscoveredPOI | null {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  const name = el.tags?.name;

  if (!lat || !lon || !name) return null;

  const { category, label, importance } = categorizeOverpass(el.tags);
  const opening = el.tags?.opening_hours ?? '';
  const openingNote = opening ? ` Orari: ${opening}.` : '';

  return {
    id: `osm-${el.id}`,
    name,
    description: `${label} nelle vicinanze.${openingNote}`,
    lat,
    lng: lon,
    category,
    importanceScore: importance,
    unlockDistance: 50,
    xpReward: Math.round(importance * 1.2),
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

    // Overpass first (real places, fast), AI second (enrichment, slow)
    // Run in parallel but respond as soon as Overpass is ready
    const [overpassResult, aiResult] = await Promise.allSettled([
      fetchOverpassPOIs(bbox.south, bbox.west, bbox.north, bbox.east),
      discoverPOIs({ lat, lng, interests }),
    ]);

    const pois: DiscoveredPOI[] = [];

    // Real places from OpenStreetMap — these are guaranteed to be nearby
    if (overpassResult.status === 'fulfilled') {
      const realPois = overpassResult.value
        .map(overpassToPOI)
        .filter((p): p is DiscoveredPOI => p !== null)
        .sort((a, b) => b.importanceScore - a.importanceScore)
        .slice(0, 15);
      pois.push(...realPois);
    }

    // AI-discovered hidden gems (may have relocated coordinates)
    if (aiResult.status === 'fulfilled') {
      const existingIds = new Set(pois.map((p) => p.id));
      const aiPois = aiResult.value.filter((p) => !existingIds.has(p.id));
      pois.push(...aiPois);
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