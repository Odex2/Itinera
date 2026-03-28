import { useState, useCallback } from 'react';
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
import { onboardingQuestions } from '../data/onboardingQuestions';

const XP_PER_LEVEL = 300;

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

  const completeOnboarding = useCallback(
    (answers: OnboardingAnswer[], dietary: string[]) => {
      const interests: InterestCategory[] = [];
      const personality: PersonalityScores = { relax: 0, divertimento: 0, cultura: 0, avventura: 0, socialita: 0 };

      answers.forEach((answer) => {
        answer.categories.forEach((cat) => {
          if (!interests.includes(cat)) interests.push(cat);
        });
      });

      answers.forEach((answer) => {
        const question = onboardingQuestions.find((q) => q.id === answer.questionId);
        if (question) {
          const option = question.options.find((o) => o.id === answer.answerId);
          if (option?.personalityBoost) {
            for (const [trait, boost] of Object.entries(option.personalityBoost)) {
              personality[trait as keyof PersonalityScores] += boost as number;
            }
          }
        }
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
    [pois, profile.completedPOIs.length, addXP, addCoins]
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
  };
}
