import { Router, Request, Response } from 'express';
import { fetchWeather } from '../services/weather.js';

export const weatherRouter = Router();

// GET /api/weather?lat=41.89&lng=12.48
weatherRouter.get('/', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat((req.query.lat as string) || '41.8967');
    const lng = parseFloat((req.query.lng as string) || '12.4822');

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Invalid lat/lng parameters' });
      return;
    }

    const weather = await fetchWeather(lat, lng);
    res.json(weather);
  } catch (err) {
    console.error('[Weather]', err);
    // Fallback to default rather than failing the whole request
    res.json({
      condition: 'sun',
      temperature: 22,
      description: 'Soleggiato',
      icon: '☀️',
      updatedAt: Date.now(),
    });
  }
});
