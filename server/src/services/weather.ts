import { config } from '../config.js';

interface WeatherData {
  condition: 'sun' | 'cloud' | 'rain' | 'storm';
  temperature: number;
  description: string;
  icon: string;
  updatedAt: number;
}

// 30-minute in-memory cache
const cache = new Map<string, WeatherData>();
const CACHE_TTL = 30 * 60 * 1000;

function mapCondition(weatherId: number): WeatherData['condition'] {
  if (weatherId >= 200 && weatherId < 300) return 'storm';
  if (weatherId >= 300 && weatherId < 600) return 'rain';
  if (weatherId >= 600 && weatherId < 700) return 'rain'; // snow → rain category
  if (weatherId >= 700 && weatherId < 800) return 'cloud';
  if (weatherId === 800) return 'sun';
  return 'cloud';
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.updatedAt < CACHE_TTL) {
    return cached;
  }

  if (!config.openweatherApiKey) {
    // Fallback when no API key configured
    return {
      condition: 'sun',
      temperature: 22,
      description: 'Soleggiato',
      icon: '☀️',
      updatedAt: Date.now(),
    };
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${config.openweatherApiKey}&units=metric&lang=it`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeather API error: ${res.status}`);

  const data = (await res.json()) as {
    weather: { id: number; description: string }[];
    main: { temp: number };
  };

  const weatherId = data.weather[0].id;
  const condition = mapCondition(weatherId);
  const iconMap: Record<WeatherData['condition'], string> = {
    sun: '☀️',
    cloud: '⛅',
    rain: '🌧️',
    storm: '⛈️',
  };

  const result: WeatherData = {
    condition,
    temperature: Math.round(data.main.temp),
    description: data.weather[0].description,
    icon: iconMap[condition],
    updatedAt: Date.now(),
  };

  cache.set(cacheKey, result);
  return result;
}
