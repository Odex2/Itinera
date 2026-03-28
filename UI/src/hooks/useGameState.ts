import { useState, useCallback, useRef } from 'react';
import {
  UserProfile,
  POI,
  Reward,
  Badge,
  Screen,
  OnboardingAnswer,
  InterestCategory,
  PersonalityScores,
  Challenge,
} from '../types';
import { romePOIs } from '../data/pois';
import { rewards as initialRewards } from '../data/rewards';

import { getDistanceMeters } from './useGeolocation';
import { fetchDiscoverPOIs, DiscoveredPOI, fetchNarration } from '../services/api';

const XP_PER_LEVEL = 300;
const DYNAMIC_FETCH_THRESHOLD = 500;

const initialBadges: Badge[] = [
  { id: 'explorer', name: 'Esploratore', description: 'Visita 5 luoghi', icon: 'compass', requirement: 5, progress: 0, unlocked: false, category: 'explorer', color: 'blue' },
  { id: 'quizmaster', name: 'Quiz Master', description: 'Rispondi correttamente a 10 quiz', icon: 'brain', requirement: 10, progress: 0, unlocked: false, category: 'quiz', color: 'green' },
  { id: 'firstblood', name: 'Primi Passi', description: 'Completa la tua prima missione', icon: 'star', requirement: 1, progress: 0, unlocked: false, category: 'explorer', color: 'yellow' },
  { id: 'collector', name: 'Collezionista', description: 'Riscatta 3 premi', icon: 'gift', requirement: 3, progress: 0, unlocked: false, category: 'collector', color: 'purple' },
  { id: 'citymaster', name: 'Cittadino Onorario', description: 'Completa tutte le missioni di Roma', icon: 'crown', requirement: 7, progress: 0, unlocked: false, category: 'master', color: 'gold' },
  { id: 'storyteller', name: 'Cantastorie', description: 'Leggi 5 storie nascoste', icon: 'book', requirement: 5, progress: 0, unlocked: false, category: 'explorer', color: 'orange' },
  { id: 'speedrunner', name: 'Velocista', description: 'Completa 3 sfide a tempo', icon: 'timer', requirement: 3, progress: 0, unlocked: false, category: 'quiz', color: 'red' },
  { id: 'foodie', name: 'Buongustaio', description: 'Riscatta 3 premi gastronomici', icon: 'utensils', requirement: 3, progress: 0, unlocked: false, category: 'collector', color: 'pink' },
];

function createInitialProfile(): UserProfile {
  return {
    id: crypto.randomUUID(),
    username: '',
    age: 0,
    answers: [],
    dietaryPreferences: [],
    interests: [],
    personalityScores: { relax: 0, divertimento: 0, cultura: 0, avventura: 0, socialita: 0 },
    level: 1,
    xp: 0,
    totalXp: 0,
    coins: 0,
    completedPOIs: [],
    visitedPOIs: [],
    quizResults: [],
    currentCity: 'Roma',
  };
}

function getTimeOfDay(): 'mattina' | 'pomeriggio' | 'sera' | 'notte' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'mattina';
  if (hour >= 12 && hour < 17) return 'pomeriggio';
  if (hour >= 17 && hour < 22) return 'sera';
  return 'notte';
}

export function useGameState() {
  const [profile, setProfile] = useState<UserProfile>(createInitialProfile);
  const [pois, setPois] = useState<POI[]>(romePOIs);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const timeOfDay = getTimeOfDay();

  // ── Dynamic POI discovery ───────────────────────────────────────────────
  const lastFetchLocation = useRef<{ lat: number; lng: number } | null>(null);
  const isFetchingPOIs = useRef(false);

  const scorePOI = useCallback(
    (poi: POI): number => {
      let score = poi.importanceScore;
      if (profile.interests.includes(poi.category)) score += 15;
      return score;
    },
    [profile.interests],
  );

  const fetchDynamicPOIs = useCallback(
    async (userLat: number, userLng: number) => {
      if (isFetchingPOIs.current) return;
      if (lastFetchLocation.current) {
        const dist = getDistanceMeters(lastFetchLocation.current.lat, lastFetchLocation.current.lng, userLat, userLng);
        if (dist < DYNAMIC_FETCH_THRESHOLD) return;
      }
      isFetchingPOIs.current = true;
      lastFetchLocation.current = { lat: userLat, lng: userLng };
      try {
        const discovered = await fetchDiscoverPOIs({ lat: userLat, lng: userLng, interests: profile.interests });
        setPois((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPois: POI[] = discovered
            .filter((d: DiscoveredPOI) => !existingIds.has(d.id))
            .map((d: DiscoveredPOI) => ({
              id: d.id, name: d.name, description: d.description, shortStory: '', hiddenFact: '',
              lat: d.lat, lng: d.lng, category: d.category as InterestCategory,
              importanceScore: d.importanceScore, imageUrl: '', challenges: [],
              status: 'available' as const, unlockDistance: d.unlockDistance,
              xpReward: d.xpReward, coinReward: Math.floor(d.xpReward / 5),
              bestTime: 'any' as const, source: 'ai-discovered',
            }));
          return newPois.length > 0 ? [...prev, ...newPois] : prev;
        });
      } catch (err) { console.error('[fetchDynamicPOIs]', err); }
      finally { isFetchingPOIs.current = false; }
    },
    [profile.interests],
  );

  const getVisiblePOIs = useCallback(
    (userLat: number, userLng: number): POI[] => {
      type ScoredPOI = POI & { _dist: number; _score: number };
      const scored: ScoredPOI[] = pois.map((poi) => ({
        ...poi, _dist: getDistanceMeters(userLat, userLng, poi.lat, poi.lng), _score: scorePOI(poi),
      }));
      const byScore = (a: ScoredPOI, b: ScoredPOI) => b._score - a._score;
      const near = scored.filter((p) => p._dist <= 1000).sort(byScore).slice(0, 10);
      const mid = scored.filter((p) => p._dist > 1000 && p._dist <= 2000).sort(byScore).slice(0, 5);
      const far = scored.filter((p) => p._dist > 2000 && p._dist <= 3000).sort(byScore).slice(0, 3);
      const selected = new Set([...near, ...mid, ...far].map((p) => p.id));
      const rest = scored.filter((p) => !selected.has(p.id)).sort(byScore);
      return [...near, ...mid, ...far, ...rest].map(({ _dist, _score, ...poi }) => poi);
    },
    [pois, scorePOI],
  );

  const completeOnboarding = useCallback(
    (answers: OnboardingAnswer[], dietary: string[]) => {
      const interests: InterestCategory[] = [];
      const personality: PersonalityScores = { relax: 0, divertimento: 0, cultura: 0, avventura: 0, socialita: 0 };

      // Collect unique interests from all answer categories
      answers.forEach((answer) => {
        answer.categories.forEach((cat) => {
          if (!interests.includes(cat)) interests.push(cat);
        });
      });

      // Derive personality from categories (new onboarding format uses categories directly)
      const CATEGORY_TO_PERSONALITY: Record<string, Partial<PersonalityScores>> = {
        enogastronomia: { socialita: 2, relax: 1 },
        storia: { cultura: 2, avventura: 1 },
        cultura: { cultura: 2, relax: 1 },
        arte: { cultura: 1, divertimento: 1 },
        sport: { avventura: 2, divertimento: 1 },
        natura: { avventura: 1, relax: 1 },
        paesaggio: { relax: 2, avventura: 1 },
        shopping: { divertimento: 1, socialita: 1 },
        artigianato: { cultura: 1, socialita: 1 },
        intrattenimento: { divertimento: 2, socialita: 1 },
        family: { relax: 1, socialita: 2 },
      };

      answers.forEach((answer) => {
        answer.categories.forEach((cat) => {
          const boosts = CATEGORY_TO_PERSONALITY[cat];
          if (boosts) {
            for (const [trait, val] of Object.entries(boosts)) {
              personality[trait as keyof PersonalityScores] += val as number;
            }
          }
        });
      });

      setProfile((prev) => ({
        ...prev,
        answers,
        dietaryPreferences: dietary,
        interests,
        personalityScores: personality,
      }));
      setHasOnboarded(true);
      setCurrentScreen('map');
    },
    []
  );

  const updateProfileBasic = useCallback((username: string, age: number) => {
    setProfile(prev => ({ ...prev, username, age }));
  }, []);

  const addXP = useCallback((amount: number) => {
    setProfile((prev) => {
      const newTotalXp = prev.totalXp + amount;
      const newLevel = Math.floor(newTotalXp / XP_PER_LEVEL) + 1;
      const newXp = newTotalXp % XP_PER_LEVEL;
      return { ...prev, xp: newXp, totalXp: newTotalXp, level: newLevel };
    });
  }, []);

  const addCoins = useCallback((amount: number) => {
    setProfile((prev) => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const completePOI = useCallback(
    (poiId: string) => {
      // BUG 6 FIX: prevent double-completion — if already completed, do nothing.
      // This blocks infinite XP/coin farming by re-opening the same POI.
      if (profile.completedPOIs.includes(poiId)) {
        console.warn(`[completePOI] POI ${poiId} already completed — skipping.`);
        return;
      }

      setProfile((prev) => ({
        ...prev,
        completedPOIs: [...prev.completedPOIs, poiId],
      }));

      setPois((prev) =>
        prev.map((poi) => {
          if (poi.id === poiId) return { ...poi, status: 'completed' as const };
          if (poi.status === 'locked') {
            // unlock next POIs based on progression
            return { ...poi, status: 'available' as const };
          }
          return poi;
        })
      );

      const poi = pois.find((p) => p.id === poiId);
      if (poi) {
        addXP(poi.xpReward);
        addCoins(poi.coinReward);
      }

      setBadges((prev) =>
        prev.map((badge) => {
          let newProgress = badge.progress;
          if (badge.id === 'explorer' || badge.id === 'firstblood' || badge.id === 'citymaster') {
            newProgress = profile.completedPOIs.length + 1;
          }
          return {
            ...badge,
            progress: Math.min(newProgress, badge.requirement),
            unlocked: newProgress >= badge.requirement,
          };
        })
      );

      setSelectedPOI(null);
      setActiveChallenge(null);
    },
    [pois, profile.completedPOIs, addXP, addCoins]
  );

  const completeChallenge = useCallback(
    (correct: boolean, xpBonus: number) => {
      if (correct) {
        addXP(xpBonus);
        addCoins(Math.floor(xpBonus / 5));
      }
      setBadges((prev) =>
        prev.map((badge) => {
          if (badge.id === 'quizmaster' && correct) {
            const newProgress = badge.progress + 1;
            return { ...badge, progress: newProgress, unlocked: newProgress >= badge.requirement };
          }
          if (badge.id === 'speedrunner' && correct && activeChallenge?.timeLimit) {
            const newProgress = badge.progress + 1;
            return { ...badge, progress: newProgress, unlocked: newProgress >= badge.requirement };
          }
          return badge;
        })
      );
    },
    [addXP, addCoins, activeChallenge]
  );

  const claimReward = useCallback(
    (rewardId: string) => {
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward || reward.claimed || profile.coins < reward.cost) return false;

      setProfile((prev) => ({ ...prev, coins: prev.coins - reward.cost }));
      setRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? { ...r, claimed: true } : r))
      );

      setBadges((prev) =>
        prev.map((badge) => {
          if (badge.id === 'collector') {
            const newProgress = badge.progress + 1;
            return { ...badge, progress: newProgress, unlocked: newProgress >= badge.requirement };
          }
          if (badge.id === 'foodie' && reward.category === 'enogastronomia') {
            const newProgress = badge.progress + 1;
            return { ...badge, progress: newProgress, unlocked: newProgress >= badge.requirement };
          }
          return badge;
        })
      );

      return true;
    },
    [rewards, profile.coins]
  );

  const getTimeOptimizedRewards = useCallback(() => {
    const hour = new Date().getHours();
    return [...rewards]
      .filter((r) => !r.claimed)
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        // time relevance
        if (hour >= a.availableFrom && hour <= a.availableTo) scoreA += 3;
        if (hour >= b.availableFrom && hour <= b.availableTo) scoreB += 3;

        // interest match
        if (profile.interests.includes(a.category)) scoreA += 2;
        if (profile.interests.includes(b.category)) scoreB += 2;

        // affordability
        if (a.cost <= profile.coins) scoreA += 1;
        if (b.cost <= profile.coins) scoreB += 1;

        return scoreB - scoreA;
      });
  }, [rewards, profile.interests, profile.coins]);

  // ── Dynamic Narration fetcher (calls /api/ai/narration → Regolo.ai) ──────
  const fetchDynamicNarration = useCallback(
    async (
      poiId: string,
      userParams?: {
        personality?: typeof profile.personalityScores;
        interests?: typeof profile.interests;
        currentTimeOfDay?: string;
      },
    ) => {
      const poi = pois.find((p) => p.id === poiId);
      if (!poi) {
        console.error(`[fetchDynamicNarration] POI not found: ${poiId}`);
        return;
      }

      // Skip if already generated or currently generating
      if (poi.aiNarration || poi.isGeneratingNarration) return;

      // Set loading flag (immutable update)
      setPois((prev) =>
        prev.map((p) =>
          p.id === poiId ? { ...p, isGeneratingNarration: true } : p,
        ),
      );

      try {
        const result = await fetchNarration({
          poiName: poi.name,
          poiDescription: poi.description,
          shortStory: poi.shortStory,
          hiddenFact: poi.hiddenFact,
          category: poi.category,
          personality: userParams?.personality ?? profile.personalityScores,
          timeOfDay: userParams?.currentTimeOfDay ?? timeOfDay,
          userInterests: userParams?.interests ?? profile.interests,
        });

        // Patch POI with AI narration (immutable update)
        setPois((prev) =>
          prev.map((p) =>
            p.id === poiId
              ? {
                  ...p,
                  aiNarration: {
                    narration: result.narration,
                    hiddenFact: result.hiddenFact,
                    voiceStyle: result.voiceStyle,
                  },
                  isGeneratingNarration: false,
                }
              : p,
          ),
        );
      } catch (err) {
        console.error(`[fetchDynamicNarration] Failed for "${poi.name}":`, err);
        // Clear loading flag on error — UI will fallback to static content
        setPois((prev) =>
          prev.map((p) =>
            p.id === poiId ? { ...p, isGeneratingNarration: false } : p,
          ),
        );
      }
    },
    [pois, profile.personalityScores, profile.interests, timeOfDay],
  );

  return {
    profile,
    pois,
    rewards,
    badges,
    currentScreen,
    selectedPOI,
    activeChallenge,
    hasOnboarded,
    timeOfDay,
    setCurrentScreen,
    setSelectedPOI,
    setActiveChallenge,
    updateProfileBasic,
    completeOnboarding,
    completePOI,
    completeChallenge,
    claimReward,
    getTimeOptimizedRewards,
    addXP,
    addCoins,
    fetchDynamicPOIs,
    fetchDynamicNarration,
    scorePOI,
    getVisiblePOIs,
  };
}