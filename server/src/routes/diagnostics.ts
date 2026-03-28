import { Router } from 'express';
import { config } from '../config.js';

export const diagnosticsRouter = Router();

// GET /api/diagnostics — quick health check for all external services
diagnosticsRouter.get('/diagnostics', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    services: {
      regolo: config.regaloApiKey ? 'configured' : 'MISSING',
      elevenlabs: config.elevenlabsApiKey ? 'configured' : 'MISSING',
      openweather: config.openweatherApiKey ? 'configured' : 'MISSING',
    },
  });
});
