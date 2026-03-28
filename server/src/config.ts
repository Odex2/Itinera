import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  regaloApiKey: process.env.REGOLO_API_KEY || '',
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  openweatherApiKey: process.env.OPENWEATHER_API_KEY || '',
};
