export interface UserProfile {
  id: string;
  username: string;
  age: number;
  answers: OnboardingAnswer[];
  dietaryPreferences: string[];
  interests: InterestCategory[];
  personalityScores: PersonalityScores;
  level: number;
  xp: number;
  totalXp: number;
  coins: number;
  completedPOIs: string[];
  visitedPOIs: string[];
  quizResults: QuizResult[];
  currentCity: string;
}

export interface OnboardingAnswer {
  questionId: number;
  answerId: string;
  categories: InterestCategory[];
}

export type InterestCategory =
  | 'enogastronomia'
  | 'cultura'
  | 'arte'
  | 'storia'
  | 'natura'
  | 'paesaggio'
  | 'shopping'
  | 'artigianato'
  | 'intrattenimento'
  | 'family'
  | 'sport';

export interface PersonalityScores {
  relax: number;
  divertimento: number;
  cultura: number;
  avventura: number;
  socialita: number;
}

export interface OnboardingQuestion {
  id: number;
  title: string;
  subtitle: string;
  options: OnboardingOption[];
}

export interface OnboardingOption {
  id: string;
  text: string;
  icon: string;
  categories: InterestCategory[];
  personalityBoost: Partial<PersonalityScores>;
}

export interface POINarration {
  narration: string;
  hiddenFact: string;
  voiceStyle: 'enthusiastic' | 'mysterious' | 'calm';
}

export interface POI {
  id: string;
  name: string;
  description: string;
  shortStory: string;
  hiddenFact: string;
  lat: number;
  lng: number;
  category: InterestCategory;
  importanceScore: number;
  imageUrl: string;
  challenges: Challenge[];
  status: 'locked' | 'available' | 'active' | 'completed';
  unlockDistance: number;
  xpReward: number;
  coinReward: number;
  bestTime: 'mattina' | 'pomeriggio' | 'sera' | 'tramonto' | 'any';
  source: string;
  /** AI-generated narration from the dialogueWriter agent */
  aiNarration?: POINarration;
  /** True while the narration is being generated server-side */
  isGeneratingNarration?: boolean;
}

export interface Challenge {
  type: 'quiz' | 'photo' | 'countdown' | 'observation' | 'choice';
  question: string;
  description?: string;
  options?: string[];
  correctAnswer?: number;
  timeLimit?: number;
  hint?: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  xpBonus: number;
}

export interface QuizResult {
  poiId: string;
  correct: boolean;
  category: InterestCategory;
  timestamp: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  partnerType: string;
  cost: number;
  originalValue: string;
  imageUrl: string;
  category: InterestCategory;
  availableFrom: number;
  availableTo: number;
  bestTimeOfDay: 'mattina' | 'pomeriggio' | 'sera' | 'any';
  distanceFromCenter: number;
  lat: number;
  lng: number;
  claimed: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  progress: number;
  unlocked: boolean;
  category: 'explorer' | 'quiz' | 'social' | 'collector' | 'master';
  color: string;
}

export interface GameState {
  profile: UserProfile;
  pois: POI[];
  rewards: Reward[];
  badges: Badge[];
  currentScreen: Screen;
  selectedPOI: POI | null;
  activeChallenge: Challenge | null;
  userLocation: { lat: number; lng: number } | null;
  weatherCondition: 'sun' | 'cloud' | 'rain' | 'storm';
  timeOfDay: 'mattina' | 'pomeriggio' | 'sera' | 'notte';
}

export type Screen = 'onboarding' | 'city_selection' | 'map' | 'missions' | 'shop' | 'profile';
