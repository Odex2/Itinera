import { useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Utensils,
  Landmark,
  TreePine,
  ShoppingBag,
  Palette,
  Bike,
  Hammer,
  Gamepad2,
  Wine,
  Gem,
  Shirt,
  Camera,
  Users,
  Mountain,
  BookOpen,
  Sparkles,
  GlassWater,
  Sun,
  Music,
  Store,
  Check,
  Compass,
} from 'lucide-react';
import type { OnboardingAnswer, InterestCategory } from '../types';
import { onboardingQuestions, dietaryOptions } from '../data/onboardingQuestions';

interface OnboardingScreenProps {
  onComplete: (answers: OnboardingAnswer[], dietary: string[]) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  '/food': <Utensils className="w-6 h-6" />,
  '/history': <Landmark className="w-6 h-6" />,
  '/nature': <TreePine className="w-6 h-6" />,
  '/shopping': <ShoppingBag className="w-6 h-6" />,
  '/art': <Palette className="w-6 h-6" />,
  '/sport': <Bike className="w-6 h-6" />,
  '/craft': <Hammer className="w-6 h-6" />,
  '/fun': <Gamepad2 className="w-6 h-6" />,
  '/wine': <Wine className="w-6 h-6" />,
  '/handmade': <Gem className="w-6 h-6" />,
  '/fashion': <Shirt className="w-6 h-6" />,
  '/photos': <Camera className="w-6 h-6" />,
  '/family': <Users className="w-6 h-6" />,
  '/adventure': <Mountain className="w-6 h-6" />,
  '/curious': <BookOpen className="w-6 h-6" />,
  '/lively': <Sparkles className="w-6 h-6" />,
  '/aperitivo': <GlassWater className="w-6 h-6" />,
  '/sunset': <Sun className="w-6 h-6" />,
  '/show': <Music className="w-6 h-6" />,
  '/market': <Store className="w-6 h-6" />,
};

const TOTAL_STEPS = onboardingQuestions.length + 1;

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, OnboardingAnswer>>({});
  const [dietarySelections, setDietarySelections] = useState<string[]>([]);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [isAnimating, setIsAnimating] = useState(false);

  const isQuestionStep = currentStep < onboardingQuestions.length;
  const isDietaryStep = currentStep === onboardingQuestions.length;

  const currentQuestion = isQuestionStep ? onboardingQuestions[currentStep] : null;
  const selectedAnswerForStep = currentQuestion ? answers[currentQuestion.id] : null;

  const canProceed = isQuestionStep ? !!selectedAnswerForStep : isDietaryStep;

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const animateTransition = useCallback(
    (direction: 'left' | 'right', callback: () => void) => {
      setSlideDirection(direction);
      setIsAnimating(true);
      setTimeout(() => {
        callback();
        setIsAnimating(false);
      }, 250);
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (!canProceed) return;

    if (isLastStep) {
      const allAnswers = Object.values(answers);
      onComplete(allAnswers, dietarySelections);
      return;
    }

    animateTransition('left', () => {
      setCurrentStep((s) => s + 1);
    });
  }, [canProceed, isLastStep, answers, dietarySelections, onComplete, animateTransition]);

  const handleBack = useCallback(() => {
    if (currentStep === 0) return;
    animateTransition('right', () => {
      setCurrentStep((s) => s - 1);
    });
  }, [currentStep, animateTransition]);

  const handleOptionSelect = useCallback(
    (optionId: string, categories: InterestCategory[]) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          questionId: currentQuestion.id,
          answerId: optionId,
          categories,
        },
      }));
    },
    [currentQuestion],
  );

  const handleDietaryToggle = useCallback((dietId: string) => {
    setDietarySelections((prev) => {
      if (dietId === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const withoutNone = prev.filter((d) => d !== 'none');
      return withoutNone.includes(dietId)
        ? withoutNone.filter((d) => d !== dietId)
        : [...withoutNone, dietId];
    });
  }, []);

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const slideClass = isAnimating
    ? slideDirection === 'left'
      ? 'translate-x-[-100%] opacity-0'
      : 'translate-x-[100%] opacity-0'
    : 'translate-x-0 opacity-100';

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 px-5 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-700/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-600/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Progress bar */}
        <div className="relative z-10 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-200/70 text-xs font-medium tracking-widest uppercase">
              Passo {currentStep + 1} di {TOTAL_STEPS}
            </span>
          </div>
          <div className="w-full h-1.5 bg-stone-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Title area */}
        <div className="relative z-10">
          {currentStep === 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold tracking-wider uppercase">
                  Play The City
                </span>
              </div>
              <p className="text-stone-400 text-xs">
                Raccontaci come ti piace viaggiare
              </p>
            </div>
          )}

          {isQuestionStep && currentQuestion && (
            <>
              <h1 className="text-white text-2xl font-bold tracking-tight leading-tight">
                {currentQuestion.title}
              </h1>
              <p className="text-stone-300 text-sm mt-1.5 leading-relaxed">
                {currentQuestion.subtitle}
              </p>
            </>
          )}

          {isDietaryStep && (
            <>
              <h1 className="text-white text-2xl font-bold tracking-tight leading-tight">
                Preferenze alimentari
              </h1>
              <p className="text-stone-300 text-sm mt-1.5 leading-relaxed">
                Hai esigenze particolari? Seleziona tutte le opzioni rilevanti.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <div
          className={`transition-all duration-250 ease-in-out ${slideClass}`}
        >
          {/* Question options */}
          {isQuestionStep && currentQuestion && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedAnswerForStep?.answerId === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() =>
                      handleOptionSelect(
                        option.id,
                        option.categories as InterestCategory[],
                      )
                    }
                    className={`
                      w-full text-left rounded-2xl p-4 transition-all duration-200
                      border-2 flex items-start gap-4 group
                      ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 shadow-md shadow-amber-100'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div
                      className={`
                        flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                        transition-colors duration-200
                        ${
                          isSelected
                            ? 'bg-amber-600 text-white'
                            : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
                        }
                      `}
                    >
                      {iconMap[option.icon] || <MapPin className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`
                          text-sm leading-relaxed
                          ${isSelected ? 'text-stone-900 font-medium' : 'text-stone-700'}
                        `}
                      >
                        {option.text}
                      </p>
                    </div>
                    <div
                      className={`
                        flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                        transition-all duration-200 mt-0.5
                        ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600'
                            : 'border-stone-300'
                        }
                      `}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Dietary preferences */}
          {isDietaryStep && (
            <div className="space-y-3">
              {dietaryOptions.map((diet) => {
                const isSelected = dietarySelections.includes(diet.id);
                return (
                  <button
                    key={diet.id}
                    onClick={() => handleDietaryToggle(diet.id)}
                    className={`
                      w-full text-left rounded-2xl p-4 transition-all duration-200
                      border-2 flex items-center gap-4
                      ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 shadow-md shadow-amber-100'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div
                      className={`
                        flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center
                        transition-all duration-200
                        ${
                          isSelected
                            ? 'border-amber-600 bg-amber-600'
                            : 'border-stone-300'
                        }
                      `}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span
                      className={`
                        text-sm
                        ${isSelected ? 'text-stone-900 font-medium' : 'text-stone-700'}
                      `}
                    >
                      {diet.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="px-5 pb-8 pt-4 bg-stone-50 border-t border-stone-100">
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-xl text-stone-600 font-medium text-sm bg-stone-100 hover:bg-stone-200 transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              Indietro
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`
              flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
              font-semibold text-sm tracking-wide transition-all duration-200
              ${
                canProceed
                  ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg shadow-amber-700/25 hover:shadow-xl hover:shadow-amber-700/30 active:scale-[0.98]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            {isLastStep ? "Inizia l'avventura" : 'Avanti'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
