import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  MapPin,
  Star,
  ChevronRight,
  Clock,
  Eye,
  HelpCircle,
  CheckCircle,
  XCircle,
  Award,
  Coins,
  BookOpen,
  Target,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import type { POI, Challenge } from '../types';

interface MissionPanelProps {
  poi: POI;
  onClose: () => void;
  onCompleteChallenge: (correct: boolean, xpBonus: number) => void;
  onCompletePOI: (poiId: string) => void;
  userDistance: number | null;
}

type Tab = 'storia' | 'sfida' | 'completato';

const difficultyConfig: Record<
  Challenge['difficulty'],
  { label: string; color: string; bg: string }
> = {
  facile: { label: 'Facile', color: 'text-green-700', bg: 'bg-green-100' },
  medio: { label: 'Medio', color: 'text-amber-700', bg: 'bg-amber-100' },
  difficile: { label: 'Difficile', color: 'text-red-700', bg: 'bg-red-100' },
};

const categoryLabels: Record<string, string> = {
  enogastronomia: 'Enogastronomia',
  cultura: 'Cultura',
  arte: 'Arte',
  storia: 'Storia',
  natura: 'Natura',
  paesaggio: 'Paesaggio',
  shopping: 'Shopping',
  artigianato: 'Artigianato',
  intrattenimento: 'Intrattenimento',
  family: 'Family',
  sport: 'Sport',
};

// -- Countdown Timer Circle --------------------------------------------------

function CountdownCircle({
  timeLeft,
  totalTime,
}: {
  timeLeft: number;
  totalTime: number;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const strokeDashoffset = circumference * (1 - progress);
  const urgent = timeLeft <= 5;

  return (
    <div className="relative flex flex-col items-center justify-center w-[100px] h-[100px]">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={urgent ? '#ef4444' : '#d97706'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span
        className={`absolute text-2xl font-bold ${urgent ? 'text-red-600' : 'text-amber-700'}`}
      >
        {timeLeft}
      </span>
    </div>
  );
}

// -- Challenge Renderers -----------------------------------------------------

function QuizChallenge({
  challenge,
  onAnswer,
}: {
  challenge: Challenge;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correct = selected === challenge.correctAnswer;
    setTimeout(() => onAnswer(correct), 1200);
  };

  return (
    <div className="space-y-4">
      <p className="text-stone-800 font-medium text-base leading-relaxed">
        {challenge.question}
      </p>
      <div className="space-y-2">
        {challenge.options?.map((option, idx) => {
          let optionStyle = 'border-stone-200 bg-white hover:border-amber-400';
          if (submitted) {
            if (idx === challenge.correctAnswer) {
              optionStyle = 'border-green-500 bg-green-50 ring-2 ring-green-300';
            } else if (idx === selected && idx !== challenge.correctAnswer) {
              optionStyle = 'border-red-500 bg-red-50 ring-2 ring-red-300';
            } else {
              optionStyle = 'border-stone-200 bg-stone-50 opacity-50';
            }
          } else if (idx === selected) {
            optionStyle = 'border-amber-500 bg-amber-50 ring-2 ring-amber-300';
          }

          return (
            <button
              key={idx}
              disabled={submitted}
              onClick={() => setSelected(idx)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${optionStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-600 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-stone-700 text-sm">{option}</span>
                {submitted && idx === challenge.correctAnswer && (
                  <CheckCircle className="w-5 h-5 text-green-600 ml-auto shrink-0" />
                )}
                {submitted &&
                  idx === selected &&
                  idx !== challenge.correctAnswer && (
                    <XCircle className="w-5 h-5 text-red-600 ml-auto shrink-0" />
                  )}
              </div>
            </button>
          );
        })}
      </div>
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
        >
          Conferma risposta
        </button>
      )}
      {submitted && (
        <div
          className={`p-3 rounded-xl text-center font-medium ${
            selected === challenge.correctAnswer
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {selected === challenge.correctAnswer
            ? 'Risposta corretta! Ben fatto!'
            : 'Risposta sbagliata. La prossima volta!'}
        </div>
      )}
    </div>
  );
}

function CountdownChallenge({
  challenge,
  onAnswer,
}: {
  challenge: Challenge;
  onAnswer: (correct: boolean) => void;
}) {
  const totalTime = challenge.timeLimit ?? 30;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      setSubmitted(true);
      onAnswer(false);
    }
  }, [timeLeft, submitted, onAnswer]);

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSubmitted(true);
    const correct = selected === challenge.correctAnswer;
    setTimeout(() => onAnswer(correct), 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <CountdownCircle timeLeft={timeLeft} totalTime={totalTime} />
      </div>
      <p className="text-stone-800 font-medium text-base leading-relaxed text-center">
        {challenge.question}
      </p>
      <div className="space-y-2">
        {challenge.options?.map((option, idx) => {
          let optionStyle = 'border-stone-200 bg-white hover:border-amber-400';
          if (submitted) {
            if (idx === challenge.correctAnswer) {
              optionStyle = 'border-green-500 bg-green-50 ring-2 ring-green-300';
            } else if (idx === selected && idx !== challenge.correctAnswer) {
              optionStyle = 'border-red-500 bg-red-50 ring-2 ring-red-300';
            } else {
              optionStyle = 'border-stone-200 bg-stone-50 opacity-50';
            }
          } else if (idx === selected) {
            optionStyle = 'border-amber-500 bg-amber-50 ring-2 ring-amber-300';
          }

          return (
            <button
              key={idx}
              disabled={submitted || timeLeft === 0}
              onClick={() => setSelected(idx)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${optionStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-600 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-stone-700 text-sm">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
      {!submitted && timeLeft > 0 && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
        >
          Conferma risposta
        </button>
      )}
      {submitted && (
        <div
          className={`p-3 rounded-xl text-center font-medium ${
            timeLeft === 0
              ? 'bg-red-50 text-red-700'
              : selected === challenge.correctAnswer
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
          }`}
        >
          {timeLeft === 0
            ? 'Tempo scaduto!'
            : selected === challenge.correctAnswer
              ? 'Risposta corretta! Ben fatto!'
              : 'Risposta sbagliata.'}
        </div>
      )}
    </div>
  );
}

function ObservationChallenge({
  challenge,
  onAnswer,
}: {
  challenge: Challenge;
  onAnswer: (correct: boolean) => void;
}) {
  const [showHint, setShowHint] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correct = selected === challenge.correctAnswer;
    setTimeout(() => onAnswer(correct), 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
        <Eye className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-stone-700 text-sm">
          Osserva attentamente il luogo intorno a te per rispondere.
        </p>
      </div>
      {challenge.description && (
        <p className="text-stone-600 text-sm italic">{challenge.description}</p>
      )}
      <p className="text-stone-800 font-medium text-base leading-relaxed">
        {challenge.question}
      </p>

      {challenge.hint && !showHint && (
        <button
          onClick={() => setShowHint(true)}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium"
        >
          <HelpCircle className="w-4 h-4" />
          Mostra suggerimento
        </button>
      )}
      {showHint && challenge.hint && (
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 text-sm">
          <span className="font-medium text-stone-700">Suggerimento:</span>{' '}
          {challenge.hint}
        </div>
      )}

      <div className="space-y-2">
        {challenge.options?.map((option, idx) => {
          let optionStyle = 'border-stone-200 bg-white hover:border-amber-400';
          if (submitted) {
            if (idx === challenge.correctAnswer) {
              optionStyle = 'border-green-500 bg-green-50 ring-2 ring-green-300';
            } else if (idx === selected && idx !== challenge.correctAnswer) {
              optionStyle = 'border-red-500 bg-red-50 ring-2 ring-red-300';
            } else {
              optionStyle = 'border-stone-200 bg-stone-50 opacity-50';
            }
          } else if (idx === selected) {
            optionStyle = 'border-amber-500 bg-amber-50 ring-2 ring-amber-300';
          }

          return (
            <button
              key={idx}
              disabled={submitted}
              onClick={() => setSelected(idx)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${optionStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-600 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-stone-700 text-sm">{option}</span>
                {submitted && idx === challenge.correctAnswer && (
                  <CheckCircle className="w-5 h-5 text-green-600 ml-auto shrink-0" />
                )}
                {submitted &&
                  idx === selected &&
                  idx !== challenge.correctAnswer && (
                    <XCircle className="w-5 h-5 text-red-600 ml-auto shrink-0" />
                  )}
              </div>
            </button>
          );
        })}
      </div>
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
        >
          Conferma risposta
        </button>
      )}
      {submitted && (
        <div
          className={`p-3 rounded-xl text-center font-medium ${
            selected === challenge.correctAnswer
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {selected === challenge.correctAnswer
            ? 'Ottimo spirito di osservazione!'
            : 'Non preoccuparti, riprova la prossima volta!'}
        </div>
      )}
    </div>
  );
}

const personalityInsights = [
  'Sei un animo curioso, sempre alla ricerca di nuove prospettive.',
  'Hai un forte senso pratico e ami le soluzioni concrete.',
  'La tua sensibilita artistica ti guida nelle scelte.',
  "Sei un esploratore nato, con il cuore rivolto all'avventura.",
];

function ChoiceChallenge({
  challenge,
  onAnswer,
}: {
  challenge: Challenge;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    setTimeout(() => onAnswer(true), 1500);
  };

  return (
    <div className="space-y-4">
      {challenge.description && (
        <p className="text-stone-600 text-sm italic leading-relaxed">
          {challenge.description}
        </p>
      )}
      <p className="text-stone-800 font-medium text-base leading-relaxed">
        {challenge.question}
      </p>
      <div className="space-y-2">
        {challenge.options?.map((option, idx) => (
          <button
            key={idx}
            disabled={confirmed}
            onClick={() => setSelected(idx)}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
              confirmed && idx === selected
                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300'
                : confirmed
                  ? 'border-stone-200 bg-stone-50 opacity-50'
                  : idx === selected
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300'
                    : 'border-stone-200 bg-white hover:border-amber-400'
            }`}
          >
            <span className="text-stone-700 text-sm">{option}</span>
          </button>
        ))}
      </div>
      {!confirmed && (
        <button
          onClick={handleConfirm}
          disabled={selected === null}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
        >
          Conferma scelta
        </button>
      )}
      {confirmed && selected !== null && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
          <p className="text-amber-800 font-medium text-sm">
            La tua scelta rivela qualcosa di te:
          </p>
          <p className="text-stone-700 text-sm italic">
            {personalityInsights[selected % personalityInsights.length]}
          </p>
        </div>
      )}
    </div>
  );
}

// -- Main Component ----------------------------------------------------------

export default function MissionPanel({
  poi,
  onClose,
  onCompleteChallenge,
  onCompletePOI,
  userDistance,
}: MissionPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('storia');
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challengeResults, setChallengeResults] = useState<boolean[]>([]);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tooFar =
    userDistance !== null &&
    poi.unlockDistance > 0 &&
    userDistance > poi.unlockDistance;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleChallengeAnswer = useCallback(
    (correct: boolean) => {
      const challenge = poi.challenges[currentChallengeIndex];
      const xp = correct
        ? challenge.xpBonus
        : Math.floor(challenge.xpBonus * 0.2);

      setChallengeResults((prev) => [...prev, correct]);
      setTotalXpEarned((prev) => prev + xp);
      onCompleteChallenge(correct, xp);

      setTimeout(() => {
        if (currentChallengeIndex < poi.challenges.length - 1) {
          setCurrentChallengeIndex((prev) => prev + 1);
        } else {
          setActiveTab('completato');
          onCompletePOI(poi.id);
        }
      }, 1800);
    },
    [currentChallengeIndex, poi, onCompleteChallenge, onCompletePOI],
  );

  const currentChallenge = poi.challenges[currentChallengeIndex] as
    | Challenge
    | undefined;

  const renderChallenge = () => {
    if (!currentChallenge) return null;

    switch (currentChallenge.type) {
      case 'quiz':
        return (
          <QuizChallenge
            key={currentChallengeIndex}
            challenge={currentChallenge}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'countdown':
        return (
          <CountdownChallenge
            key={currentChallengeIndex}
            challenge={currentChallenge}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'observation':
        return (
          <ObservationChallenge
            key={currentChallengeIndex}
            challenge={currentChallenge}
            onAnswer={handleChallengeAnswer}
          />
        );
      case 'choice':
        return (
          <ChoiceChallenge
            key={currentChallengeIndex}
            challenge={currentChallenge}
            onAnswer={handleChallengeAnswer}
          />
        );
      default:
        return null;
    }
  };

  const diffBadge = currentChallenge
    ? difficultyConfig[currentChallenge.difficulty]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-4 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
        >
          <X className="w-5 h-5 text-stone-500" />
        </button>

        {/* Scrollable content */}
        <div
          className="overflow-y-auto px-5 pb-8"
          style={{ maxHeight: 'calc(90vh - 40px)' }}
        >
          {/* POI Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-stone-900 pr-8">
              {poi.name}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3" />
                {categoryLabels[poi.category] ?? poi.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3" />
                Importanza {poi.importanceScore}/10
              </span>
              {poi.source && (
                <span className="text-xs text-stone-400">
                  Fonte: {poi.source}
                </span>
              )}
            </div>
          </div>

          {/* Too far warning */}
          {tooFar && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">
                    Avvicinati al luogo
                  </p>
                  <p className="text-amber-700 text-xs mt-1">
                    Sei a {Math.round(userDistance!)}m di distanza. Devi essere
                    entro {poi.unlockDistance}m per iniziare la sfida.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-stone-100 p-1 rounded-xl">
            <TabButton
              active={activeTab === 'storia'}
              onClick={() => setActiveTab('storia')}
              icon={<BookOpen className="w-4 h-4" />}
              label="La Storia"
            />
            <TabButton
              active={activeTab === 'sfida'}
              onClick={() => !tooFar && setActiveTab('sfida')}
              icon={<Target className="w-4 h-4" />}
              label="La Sfida"
              disabled={tooFar}
            />
            <TabButton
              active={activeTab === 'completato'}
              onClick={() =>
                activeTab === 'completato' && setActiveTab('completato')
              }
              icon={<Trophy className="w-4 h-4" />}
              label="Completato"
              disabled={activeTab !== 'completato'}
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'storia' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  La storia
                </h3>
                <p className="text-stone-700 text-sm leading-relaxed">
                  {poi.shortStory}
                </p>
              </div>
              <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-2xl">
                <h4 className="text-sm font-semibold text-amber-800 mb-1.5">
                  Curiosita nascosta
                </h4>
                <p className="text-stone-700 text-sm leading-relaxed">
                  {poi.hiddenFact}
                </p>
              </div>
              {!tooFar && (
                <button
                  onClick={() => setActiveTab('sfida')}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                >
                  Inizia la sfida
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {activeTab === 'sfida' && !tooFar && (
            <div className="space-y-4">
              {/* Challenge progress */}
              {poi.challenges.length > 1 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-stone-500">
                    Sfida {currentChallengeIndex + 1} di{' '}
                    {poi.challenges.length}
                  </span>
                  <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${((currentChallengeIndex + 1) / poi.challenges.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Difficulty badge */}
              {diffBadge && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${diffBadge.bg} ${diffBadge.color}`}
                  >
                    {diffBadge.label}
                  </span>
                  {currentChallenge?.type === 'countdown' && (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                      <Clock className="w-3 h-3" />
                      {currentChallenge.timeLimit ?? 30}s
                    </span>
                  )}
                  <span className="ml-auto text-xs text-amber-600 font-medium">
                    +{currentChallenge?.xpBonus} XP
                  </span>
                </div>
              )}

              {renderChallenge()}
            </div>
          )}

          {activeTab === 'completato' && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Missione completata!
                </h3>
                <p className="text-stone-500 text-sm mt-1">
                  Hai completato tutte le sfide di questo luogo.
                </p>
              </div>

              {/* Stats */}
              <div className="flex justify-center gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-600">
                    <Award className="w-5 h-5" />
                    <span className="text-2xl font-bold">
                      {totalXpEarned + poi.xpReward}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500">XP guadagnati</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-600">
                    <Coins className="w-5 h-5" />
                    <span className="text-2xl font-bold">{poi.coinReward}</span>
                  </div>
                  <span className="text-xs text-stone-500">Monete</span>
                </div>
              </div>

              {/* Results breakdown */}
              {challengeResults.length > 0 && (
                <div className="space-y-1.5">
                  {challengeResults.map((correct, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${
                        correct
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      <span>
                        Sfida {idx + 1}:{' '}
                        {poi.challenges[idx]?.type === 'choice'
                          ? 'Scelta'
                          : correct
                            ? 'Corretta'
                            : 'Sbagliata'}
                      </span>
                      {correct ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
              >
                Chiudi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Tab Button ---------------------------------------------------------------

function TabButton({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
        active
          ? 'bg-white text-amber-700 shadow-sm'
          : disabled
            ? 'text-stone-300 cursor-not-allowed'
            : 'text-stone-500 hover:text-stone-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
