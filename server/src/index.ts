import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { aiRouter } from './routes/ai.js';
import { weatherRouter } from './routes/weather.js';
import { voiceRouter } from './routes/voice.js';
import { discoverRouter } from './routes/discover.js';

const app = express();

app.use(cors({ origin: true })); // allows all origins (dev/tunnel mode)
app.use(express.json({ limit: '10mb' })); // 10mb for base64 audio payloads

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.use('/api/ai', aiRouter);
app.use('/api/ai', discoverRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/voice', voiceRouter);

app.listen(config.port, () => {
  console.log(`Play The City server running on http://localhost:${config.port}`);
  console.log(`Regolo API: ${config.regaloApiKey ? 'configured' : 'MISSING'}`);
  console.log(`ElevenLabs: ${config.elevenlabsApiKey ? 'configured' : 'MISSING'}`);

});