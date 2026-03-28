// Typed client for the Play The City backend API
// All calls go to the Express server (default: http://localhost:3001)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonalityScores {
  relax: number;
  divertimento: number;
  cultura: number;
  avventura: number;
  socialita: number;
}

export interface NarrationResult {
  narration: string;
  hiddenFact: string;
  voiceStyle: 'enthusiastic' | 'mysterious' | 'calm';
}

export interface GeneratedChallenge {
  type: 'quiz' | 'countdown' | 'observation' | 'choice';
  question: string;
  description?: string;
  options: string[];
  correctAnswer: number;
  timeLimit?: number;
  hint?: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  xpBonus: number;
}

export interface ValidationResult {
  correct: boolean;
  explanation: string;
  xpAwarded: number;
}

export interface WeatherData {
  condition: 'sun' | 'cloud' | 'rain' | 'storm';
  temperature: number;
  description: string;
  icon: string;
  updatedAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── AI Endpoints ─────────────────────────────────────────────────────────────

/**
 * Generate personalized narration for a POI based on user personality.
 */
export async function fetchNarration(params: {
  poiName: string;
  poiDescription: string;
  shortStory: string;
  hiddenFact: string;
  category: string;
  personality: PersonalityScores;
  timeOfDay: string;
}): Promise<NarrationResult> {
  return post<NarrationResult>('/api/ai/narration', params);
}

/**
 * Generate AI challenges for a POI.
 */
export async function fetchChallenges(params: {
  poiName: string;
  poiDescription: string;
  hiddenFact: string;
  shortStory: string;
  category: string;
  count?: number;
  userInterests?: string[];
}): Promise<GeneratedChallenge[]> {
  const result = await post<{ challenges: GeneratedChallenge[] }>('/api/ai/challenge', params);
  return result.challenges;
}

/**
 * Validate a free-form or photo challenge answer.
 */
export async function validateChallengeAnswer(params: {
  challengeQuestion: string;
  challengeType: string;
  userAnswer: string;
  context: string;
}): Promise<ValidationResult> {
  return post<ValidationResult>('/api/ai/validate', params);
}

// ─── Weather Endpoint ─────────────────────────────────────────────────────────

/**
 * Fetch current weather for given coordinates (Rome default).
 */
export async function fetchWeather(lat = 41.8967, lng = 12.4822): Promise<WeatherData> {
  return get<WeatherData>('/api/weather', {
    lat: lat.toString(),
    lng: lng.toString(),
  });
}

// ─── Voice Endpoint ───────────────────────────────────────────────────────────

/**
 * Fetch TTS audio as a Blob URL ready for <audio> playback.
 */
export async function fetchTTS(
  text: string,
  voiceStyle: 'enthusiastic' | 'mysterious' | 'calm' = 'calm',
): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceStyle }),
  });
  if (!res.ok) throw new Error(`TTS error: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
