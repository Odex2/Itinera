import { Router, Request, Response } from 'express';
import { generateNarration } from '../agents/dialogueWriter.js';
import { generateQuiz } from '../agents/quizGenerator.js';
import { validateAnswer } from '../agents/answerValidator.js';

export const aiRouter = Router();

// POST /api/ai/narration
aiRouter.post('/narration', async (req: Request, res: Response) => {
  try {
    const { poiName, poiDescription, shortStory, hiddenFact, category, personality, timeOfDay, userInterests } =
      req.body;

    if (!poiName || !personality) {
      res.status(400).json({ error: 'poiName and personality are required' });
      return;
    }

    const result = await generateNarration({
      poiName,
      poiDescription: poiDescription || '',
      shortStory: shortStory || '',
      hiddenFact: hiddenFact || '',
      category: category || 'cultura',
      personality,
      timeOfDay: timeOfDay || 'pomeriggio',
      userInterests: Array.isArray(userInterests) ? userInterests : undefined,
    });

    res.json(result);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[AI /narration] ❌ Regolo API Error:', error.message);
    console.error('[AI /narration] Stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate narration' });
  }
});

// POST /api/ai/challenge
aiRouter.post('/challenge', async (req: Request, res: Response) => {
  try {
    const {
      poiName,
      poiDescription,
      hiddenFact,
      shortStory,
      category,
      count = 2,
      userInterests,
      difficulty,
    } = req.body;

    if (!poiName) {
      res.status(400).json({ error: 'poiName is required' });
      return;
    }

    const challenges = await generateQuiz({
      poiName,
      poiDescription: poiDescription || '',
      hiddenFact: hiddenFact || '',
      shortStory: shortStory || '',
      category: category || 'cultura',
      count: Math.min(count, 4), // cap at 4
      userInterests,
      difficulty,
    });

    res.json({ challenges });
  } catch (err) {
    console.error('[AI /challenge]', err);
    res.status(500).json({ error: 'Failed to generate challenges' });
  }
});

// POST /api/ai/validate
aiRouter.post('/validate', async (req: Request, res: Response) => {
  try {
    const { challengeQuestion, challengeType, userAnswer, context } = req.body;

    if (!challengeQuestion || !userAnswer) {
      res.status(400).json({ error: 'challengeQuestion and userAnswer are required' });
      return;
    }

    const result = await validateAnswer({
      challengeQuestion,
      challengeType: challengeType || 'observation',
      userAnswer,
      context: context || '',
    });

    res.json(result);
  } catch (err) {
    console.error('[AI /validate]', err);
    res.status(500).json({ error: 'Failed to validate answer' });
  }
});
