import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, MapPin, Star, ChevronRight, Clock, Eye, HelpCircle,
  CheckCircle, XCircle, Award, Coins, BookOpen, Target, Trophy,
  AlertTriangle, Volume2, VolumeX, Loader2, Sparkles,
} from 'lucide-react';
import type { POI, Challenge, UserProfile } from '../types';
import { fetchNarration, fetchChallenges } from '../services/api';
import type { GeneratedChallenge, NarrationResult } from '../services/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface MissionPanelProps {
  poi: POI;
  profile: UserProfile;
  timeOfDay: string;
  onClose: () => void;
  onCompleteChallenge: (correct: boolean, xpBonus: number) => void;
  onCompletePOI: (poiId: string) => void;
  userDistance: number | null;
}

type Tab = 'storia' | 'sfida' | 'completato';

const difficultyConfig: Record<Challenge['difficulty'], { label: string; color: string; bg: string }> = {
  facile:   { label: 'Facile',   color: 'text-green-700', bg: 'bg-green-100' },
  medio:    { label: 'Medio',    color: 'text-cyan-700', bg: 'bg-cyan-100' },
  difficile:{ label: 'Difficile',color: 'text-red-700',   bg: 'bg-red-100'   },
};

const categoryLabels: Record<string, string> = {
  enogastronomia: 'Enogastronomia', cultura: 'Cultura', arte: 'Arte',
  storia: 'Storia', natura: 'Natura', paesaggio: 'Paesaggio',
  shopping: 'Shopping', artigianato: 'Artigianato',
  intrattenimento: 'Intrattenimento', family: 'Family', sport: 'Sport',
};

// ── Shimmer skeleton ─────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-lg ${className ?? ''}`} />
  );
}

function NarrationSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function ChallengeSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
      <div className="space-y-2 mt-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Countdown Timer Circle ────────────────────────────────────────────────────

function CountdownCircle({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - timeLeft / totalTime);
  const urgent = timeLeft <= 5;
  return (
    <div className="relative flex flex-col items-center justify-center w-[100px] h-[100px]">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={urgent ? '#ef4444' : '#d97706'}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <span className={`absolute text-2xl font-bold ${urgent ? 'text-red-600' : 'text-cyan-700'}`}>
        {timeLeft}
      </span>
    </div>
  );
}

// ── Quiz Challenge ────────────────────────────────────────────────────────────

function QuizChallenge({ challenge, onAnswer }: { challenge: Challenge | GeneratedChallenge; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setTimeout(() => onAnswer(selected === challenge.correctAnswer), 1200);
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-800 font-medium text-base leading-relaxed">{challenge.question}</p>
      <div className="space-y-2">
        {challenge.options?.map((option, idx) => {
          let style = 'border-slate-200 bg-white/95 backdrop-blur-md hover:border-cyan-400';
          if (submitted) {
            if (idx === challenge.correctAnswer) style = 'border-green-500 bg-green-50 ring-2 ring-green-300';
            else if (idx === selected) style = 'border-red-500 bg-red-50 ring-2 ring-red-300';
            else style = 'border-slate-200 bg-slate-50 opacity-50';
          } else if (idx === selected) style = 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-300';

          return (
            <button key={idx} disabled={submitted} onClick={() => setSelected(idx)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${style}`}>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-slate-700 text-sm">{option}</span>
                {submitted && idx === challenge.correctAnswer && <CheckCircle className="w-5 h-5 text-green-600 ml-auto shrink-0" />}
                {submitted && idx === selected && idx !== challenge.correctAnswer && <XCircle className="w-5 h-5 text-red-600 ml-auto shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      {!submitted && (
        <button onClick={handleSubmit} disabled={selected === null}
          className="w-full py-3 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all">
          Conferma risposta
        </button>
      )}
      {submitted && (
        <div className={`p-3 rounded-xl text-center font-medium ${selected === challenge.correctAnswer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {selected === challenge.correctAnswer ? 'Risposta corretta! Ben fatto!' : 'Risposta sbagliata. La prossima volta!'}
        </div>
      )}
    </div>
  );
}

// ── Countdown Challenge ───────────────────────────────────────────────────────

function CountdownChallenge({ challenge, onAnswer }: { challenge: Challenge | GeneratedChallenge; onAnswer: (correct: boolean) => void }) {
  const totalTime = challenge.timeLimit ?? 30;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { if (intervalRef.current) clearInterval(intervalRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !submitted) { setSubmitted(true); onAnswer(false); }
  }, [timeLeft, submitted, onAnswer]);

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSubmitted(true);
    setTimeout(() => onAnswer(selected === challenge.correctAnswer), 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center"><CountdownCircle timeLeft={timeLeft} totalTime={totalTime} /></div>
      <p className="text-slate-800 font-medium text-base leading-relaxed text-center">{challenge.question}</p>
      <div className="space-y-2">
        {challenge.options?.map((option, idx) => {
          let style = 'border-slate-200 bg-white/95 backdrop-blur-md hover:border-cyan-400';
          if (submitted) {
            if (idx === challenge.correctAnswer) style = 'border-green-500 bg-green-50 ring-2 ring-green-300';
            else if (idx === selected) style = 'border-red-500 bg-red-50 ring-2 ring-red-300';
            else style = 'border-slate-200 bg-slate-50 opacity-50';
          } else if (idx === selected) style = 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-300';
          return (
            <button key={idx} disabled={submitted || timeLeft === 0} onClick={() => setSelected(idx)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${style}`}>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-slate-700 text-sm">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
      {!submitted && timeLeft > 0 && (
        <button onClick={handleSubmit} disabled={selected === null}
          className="w-full py-3 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all">
          Conferma risposta
        </button>
      )}
      {submitted && (
        <div className={`p-3 rounded-xl text-center font-medium ${timeLeft === 0 ? 'bg-red-50 text-red-700' : selected === challenge.correctAnswer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {timeLeft === 0 ? 'Tempo scaduto!' : selected === challenge.correctAnswer ? 'Risposta corretta! Ben fatto!' : 'Risposta sbagliata.'}
        </div>
      )}
    </div>
  );
}

// ── Observation Challenge ─────────────────────────────────────────────────────

function ObservationChallenge({ challenge, onAnswer }: { challenge: Challenge | GeneratedChallenge; onAnswer: (correct: boolean) => void }) {
  const [showHint, setShowHint] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setTimeout(() => onAnswer(selected === challenge.correctAnswer), 1200);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-cyan-50 rounded-xl border border-cyan-200">
        <Eye className="w-5 h-5 text-cyan-600 mt-0.5 shrink-0" />
        <p className="text-slate-700 text-sm">Osserva attentamente il luogo intorno a te per rispondere.</p>
      </div>
      {challenge.description && <p className="text-slate-600 text-sm italic">{challenge.description}</p>}
      <p className="text-slate-800 font-medium text-base leading-relaxed">{challenge.question}</p>
      {challenge.hint && !showHint && (
        <button onClick={() => setShowHint(true)} className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 text-sm font-medium">
          <HelpCircle className="w-4 h-4" /> Mostra suggerimento
        </button>
      )}
      {showHint && challenge.hint && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-sm">
          <span className="font-medium text-slate-700">Suggerimento:</span> {challenge.hint}
        </div>
      )}
      <div className="space-y-2">
        {challenge.options?.map((option, idx) => {
          let style = 'border-slate-200 bg-white/95 backdrop-blur-md hover:border-cyan-400';
          if (submitted) {
            if (idx === challenge.correctAnswer) style = 'border-green-500 bg-green-50 ring-2 ring-green-300';
            else if (idx === selected) style = 'border-red-500 bg-red-50 ring-2 ring-red-300';
            else style = 'border-slate-200 bg-slate-50 opacity-50';
          } else if (idx === selected) style = 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-300';
          return (
            <button key={idx} disabled={submitted} onClick={() => setSelected(idx)}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${style}`}>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-slate-700 text-sm">{option}</span>
                {submitted && idx === challenge.correctAnswer && <CheckCircle className="w-5 h-5 text-green-600 ml-auto shrink-0" />}
                {submitted && idx === selected && idx !== challenge.correctAnswer && <XCircle className="w-5 h-5 text-red-600 ml-auto shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      {!submitted && (
        <button onClick={handleSubmit} disabled={selected === null}
          className="w-full py-3 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all">
          Conferma risposta
        </button>
      )}
      {submitted && (
        <div className={`p-3 rounded-xl text-center font-medium ${selected === challenge.correctAnswer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {selected === challenge.correctAnswer ? 'Ottimo spirito di osservazione!' : 'Non preoccuparti, riprova la prossima volta!'}
        </div>
      )}
    </div>
  );
}

// ── Choice Challenge ──────────────────────────────────────────────────────────

function ChoiceChallenge({ challenge, onAnswer }: { challenge: Challenge | GeneratedChallenge; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (selected === null) return;
    setConfirmed(true);
    setTimeout(() => onAnswer(true), 1500);
  };

  return (
    <div className="space-y-4">
      {challenge.description && <p className="text-slate-600 text-sm italic leading-relaxed">{challenge.description}</p>}
      <p className="text-slate-800 font-medium text-base leading-relaxed">{challenge.question}</p>
      <div className="space-y-2">
        {challenge.options?.map((option, idx) => (
          <button key={idx} disabled={confirmed} onClick={() => setSelected(idx)}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
              confirmed && idx === selected ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-300'
              : confirmed ? 'border-slate-200 bg-slate-50 opacity-50'
              : idx === selected ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-300'
              : 'border-slate-200 bg-white/95 backdrop-blur-md hover:border-cyan-400'
            }`}>
            <span className="text-slate-700 text-sm">{option}</span>
          </button>
        ))}
      </div>
      {!confirmed && (
        <button onClick={handleConfirm} disabled={selected === null}
          className="w-full py-3 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all">
          Conferma scelta
        </button>
      )}
      {confirmed && (
        <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
          <p className="text-cyan-800 font-medium text-sm">La tua scelta è stata registrata nel tuo profilo esploratore.</p>
        </div>
      )}
    </div>
  );
}

// ── BUG 5 FIX: Free-input challenge ──────────────────────────────────────────
// Used when a challenge has no options array (e.g. "Conta gli archi, Hai 20 secondi!").
// Renders a numeric input field + optional countdown timer.
// Validation: exact match OR ±1 tolerance for count-type questions.

function FreeInputChallenge({
  challenge,
  onAnswer,
}: {
  challenge: Challenge | GeneratedChallenge;
  onAnswer: (correct: boolean) => void;
}) {
  const totalTime = (challenge as Challenge).timeLimit ?? null;
  const [timeLeft, setTimeLeft] = useState<number | null>(totalTime);
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown if challenge has a time limit
  useEffect(() => {
    if (totalTime === null) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [totalTime]);

  // Auto-fail when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      setSubmitted(true);
      setIsCorrect(false);
      setTimeout(() => onAnswer(false), 1500);
    }
  }, [timeLeft, submitted, onAnswer]);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSubmitted(true);

    const userNum = parseInt(value.trim(), 10);
    const raw = challenge.correctAnswer;

    // Coerce to number regardless of whether it arrived as string or number
    const expected = typeof raw === 'string' ? parseInt(raw, 10) : raw;

    let correct = false;
    if (!isNaN(userNum) && typeof expected === 'number' && !isNaN(expected)) {
      // ±1 tolerance for counting challenges (easy off-by-one forgiveness)
      correct = Math.abs(userNum - expected) <= 1;
    } else {
      // fallback: loose string comparison
      correct = value.trim().toLowerCase() === String(raw ?? '').toLowerCase();
    }

    setIsCorrect(correct);
    setTimeout(() => onAnswer(correct), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Countdown timer if present */}
      {timeLeft !== null && (
        <div className="flex justify-center">
          <CountdownCircle timeLeft={timeLeft} totalTime={totalTime!} />
        </div>
      )}

      {/* Observation prompt */}
      <div className="flex items-start gap-2 p-3 bg-cyan-50 rounded-xl border border-cyan-200">
        <Eye className="w-5 h-5 text-cyan-600 mt-0.5 shrink-0" />
        <p className="text-slate-700 text-sm">Osserva attentamente, poi inserisci la tua risposta qui sotto.</p>
      </div>

      <p className="text-slate-800 font-medium text-base leading-relaxed">{challenge.question}</p>

      {/* Hint toggle */}
      {challenge.hint && !showHint && !submitted && (
        <button onClick={() => setShowHint(true)} className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 text-sm font-medium">
          <HelpCircle className="w-4 h-4" /> Mostra suggerimento
        </button>
      )}
      {showHint && challenge.hint && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-sm">
          <span className="font-medium text-slate-700">Suggerimento:</span> {challenge.hint}
        </div>
      )}

      {/* Numeric input */}
      {!submitted ? (
        <div className="space-y-3">
          <input
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Inserisci il numero..."
            disabled={timeLeft === 0}
            autoFocus
            className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 focus:border-cyan-500 focus:outline-none text-slate-800 text-center text-2xl font-bold tracking-widest transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || timeLeft === 0}
            className="w-full py-3 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          >
            Conferma risposta
          </button>
        </div>
      ) : (
        <div className={`p-4 rounded-xl text-center space-y-1.5 ${
          timeLeft === 0 ? 'bg-red-50 text-red-700'
          : isCorrect ? 'bg-green-50 text-green-700'
          : 'bg-orange-50 text-orange-700'
        }`}>
          <p className="font-semibold text-base">
            {timeLeft === 0
              ? 'Tempo scaduto!'
              : isCorrect
              ? '✓ Giusto! Ottimo spirito di osservazione!'
              : (() => {
                  const raw = challenge.correctAnswer;
                  const num = typeof raw === 'string' ? parseInt(raw, 10) : raw;
                  return typeof num === 'number' && !isNaN(num)
                    ? `Quasi! La risposta esatta era ${num}.`
                    : 'Non esattamente — riprova la prossima volta!';
                })()}
          </p>
          {!isCorrect && timeLeft !== 0 && value && (
            <p className="text-sm opacity-80">Hai risposto: {value}</p>
          )}
          {/* Show the description as a reveal/explanation only after answering */}
          {challenge.description && (
            <p className="text-sm opacity-90 mt-1 italic">{challenge.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Voice Button ──────────────────────────────────────────────────────────────
// BUG 1 FIX: previously used fetchTTS() from api.ts which parsed the binary
// audio response as JSON, causing a silent failure.
// Now uses a direct fetch → blob → object URL pipeline.

function VoiceButton({
  text,
  voiceStyle,
  disabled,
}: {
  text: string;
  voiceStyle?: 'enthusiastic' | 'mysterious' | 'calm';
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const toggle = async () => {
    // Stop playback
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    if (loading || disabled) return;

    setLoading(true);
    try {
      // BUG 1 FIX: fetch binary audio directly and convert to a blob URL
      const res = await fetch(`${API_BASE}/api/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 2000), voiceStyle: voiceStyle ?? 'calm' }),
      });

      if (!res.ok) throw new Error(`TTS error ${res.status}`);

      const blob = await res.blob();
      // Revoke previous object URL to avoid memory leaks
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => { setPlaying(false); setLoading(false); };

      await audio.play();
      setPlaying(true);
    } catch (err) {
      console.warn('[VoiceButton] TTS unavailable:', err);
      // voice not available — fail silently, button returns to idle state
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => () => {
    audioRef.current?.pause();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={playing ? 'Interrompi narrazione' : 'Ascolta la storia'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
        playing ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : playing ? (
        <VolumeX className="w-3.5 h-3.5" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
      {loading ? 'Carico...' : playing ? 'Interrompi' : 'Ascolta'}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MissionPanel({
  poi, profile, timeOfDay,
  onClose, onCompleteChallenge, onCompletePOI, userDistance,
}: MissionPanelProps) {
  // BUG 6 FIX: if the POI is already completed, open directly on the
  // "completato" tab so the user can't re-do challenges and farm rewards.
  const [activeTab, setActiveTab] = useState<Tab>(
    poi.status === 'completed' ? 'completato' : 'storia'
  );
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [challengeResults, setChallengeResults] = useState<boolean[]>([]);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // ── AI state ──
  const [aiNarration, setAiNarration] = useState<NarrationResult | null>(null);
  const [aiNarrationLoading, setAiNarrationLoading] = useState(true);
  const [aiChallenges, setAiChallenges] = useState<GeneratedChallenge[] | null>(null);
  const [aiChallengesLoading, setAiChallengesLoading] = useState(false);

  const tooFar =
    userDistance !== null && poi.unlockDistance > 0 && userDistance > poi.unlockDistance;

  // BUG 6 FIX: if completed, never allow switching to the sfida tab.
  const alreadyCompleted = poi.status === 'completed';

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // ── Fetch AI narration on mount ──
  useEffect(() => {
    let cancelled = false;
    setAiNarrationLoading(true);
    fetchNarration({
      poiName: poi.name,
      poiDescription: poi.description,
      shortStory: poi.shortStory,
      hiddenFact: poi.hiddenFact,
      category: poi.category,
      personality: profile.personalityScores,
      timeOfDay,
      userInterests: profile.interests,
    })
      .then((result) => { if (!cancelled) setAiNarration(result); })
      .catch(() => { /* silent fallback to static content */ })
      .finally(() => { if (!cancelled) setAiNarrationLoading(false); });
    return () => { cancelled = true; };
  }, [poi.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch AI challenges when sfida tab opens ──
  useEffect(() => {
    // BUG 6 FIX: never fetch challenges for already-completed POIs
    if (activeTab !== 'sfida' || aiChallenges !== null || tooFar || alreadyCompleted) return;
    let cancelled = false;
    setAiChallengesLoading(true);
    fetchChallenges({
      poiName: poi.name,
      poiDescription: poi.description,
      hiddenFact: poi.hiddenFact,
      shortStory: poi.shortStory,
      category: poi.category,
      count: 2,
      userInterests: profile.interests,
    })
      .then((challenges) => { if (!cancelled) setAiChallenges(challenges); })
      .catch(() => { /* silent fallback to static challenges */ })
      .finally(() => { if (!cancelled) setAiChallengesLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Use AI challenges if available, otherwise fall back to static
  const activeChallenges: (Challenge | GeneratedChallenge)[] =
    aiChallenges && aiChallenges.length > 0 ? aiChallenges : poi.challenges;

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleChallengeAnswer = useCallback(
    (correct: boolean) => {
      // BUG 6 FIX: never award XP/coins for a POI that's already completed
      if (alreadyCompleted) {
        handleClose();
        return;
      }

      const challenge = activeChallenges[currentChallengeIndex];
      const xp = correct ? challenge.xpBonus : Math.floor(challenge.xpBonus * 0.2);
      setChallengeResults((prev) => [...prev, correct]);
      setTotalXpEarned((prev) => prev + xp);
      onCompleteChallenge(correct, xp);
      setTimeout(() => {
        if (currentChallengeIndex < activeChallenges.length - 1) {
          setCurrentChallengeIndex((prev) => prev + 1);
        } else {
          setActiveTab('completato');
          onCompletePOI(poi.id);
        }
      }, 1800);
    },
    [currentChallengeIndex, activeChallenges, onCompleteChallenge, onCompletePOI, poi.id, alreadyCompleted, handleClose],
  );

  const currentChallenge = activeChallenges[currentChallengeIndex] as (Challenge | GeneratedChallenge) | undefined;

  const renderChallenge = () => {
    if (aiChallengesLoading) return <ChallengeSkeleton />;
    if (!currentChallenge) return null;

    const props = { key: currentChallengeIndex, challenge: currentChallenge, onAnswer: handleChallengeAnswer };

    // BUG 5 FIX: if the challenge has no options (e.g. a "count and observe" prompt),
    // fall back to FreeInputChallenge instead of rendering an empty options list.
    const hasOptions = (currentChallenge.options?.length ?? 0) > 0;

    switch (currentChallenge.type) {
      case 'quiz':
        return hasOptions ? <QuizChallenge {...props} /> : <FreeInputChallenge {...props} />;
      case 'countdown':
        return hasOptions ? <CountdownChallenge {...props} /> : <FreeInputChallenge {...props} />;
      case 'observation':
        return hasOptions ? <ObservationChallenge {...props} /> : <FreeInputChallenge {...props} />;
      case 'choice':
        return hasOptions ? <ChoiceChallenge {...props} /> : <FreeInputChallenge {...props} />;
      default:
        return null;
    }
  };

  const diffBadge = currentChallenge ? difficultyConfig[currentChallenge.difficulty] : null;

  // Determine text to read aloud
  const narrationText = aiNarration?.narration ?? poi.shortStory;
  const voiceStyle = aiNarration?.voiceStyle ?? 'calm';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-t-xl shadow-2xl transform transition-transform duration-300 ease-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Close button */}
        <button onClick={handleClose} className="absolute top-3 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
          <X className="w-5 h-5 text-slate-500" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-8" style={{ maxHeight: 'calc(90vh - 40px)' }}>

          {/* POI Header */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900 pr-8">{poi.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3" />{categoryLabels[poi.category] ?? poi.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3" />Importanza {poi.importanceScore}/100
              </span>
              {poi.source && <span className="text-xs text-slate-400">Fonte: {poi.source}</span>}
            </div>
          </div>

          {/* Too far warning */}
          {tooFar && (
            <div className="mb-4 p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-cyan-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-cyan-800 text-sm">Avvicinati al luogo</p>
                  <p className="text-cyan-700 text-xs mt-1">
                    Sei a {Math.round(userDistance!)}m. Devi essere entro {poi.unlockDistance}m per iniziare la sfida.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl">
            {/* Storia: always readable, even after completion */}
            <TabButton
              active={activeTab === 'storia'}
              onClick={() => setActiveTab('storia')}
              icon={<BookOpen className="w-4 h-4" />}
              label="La Storia"
              disabled={false}
            />
            {/* Sfida: blocked when completed OR too far */}
            <TabButton
              active={activeTab === 'sfida'}
              onClick={() => !tooFar && !alreadyCompleted && setActiveTab('sfida')}
              icon={<Target className="w-4 h-4" />}
              label="La Sfida"
              disabled={tooFar || alreadyCompleted}
            />
            {/* Completato: visible only once done */}
            <TabButton
              active={activeTab === 'completato'}
              onClick={() => alreadyCompleted && setActiveTab('completato')}
              icon={<Trophy className="w-4 h-4" />}
              label="Completato"
              disabled={!alreadyCompleted && activeTab !== 'completato'}
            />
          </div>

          {/* ── Storia Tab ─────────────────────────────────────────────────── */}
          {activeTab === 'storia' && (
            <div className="space-y-4">
              {/* AI badge + voice button */}
              <div className="flex items-center justify-between">
                {aiNarration ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />Narrazione personalizzata
                  </span>
                ) : aiNarrationLoading ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />Generazione in corso...
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Contenuto statico</span>
                )}
                <VoiceButton text={narrationText} voiceStyle={voiceStyle} disabled={aiNarrationLoading} />
              </div>

              {/* Story text */}
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">La storia</h3>
                {aiNarrationLoading ? (
                  <NarrationSkeleton />
                ) : (
                  <p className="text-slate-700 text-sm leading-relaxed transition-all duration-500">
                    {aiNarration?.narration ?? poi.shortStory}
                  </p>
                )}
              </div>

              {/* Hidden fact */}
              <div className="p-4 bg-cyan-50/60 border border-cyan-100 rounded-xl">
                <h4 className="text-sm font-semibold text-cyan-800 mb-1.5">Curiosità nascosta</h4>
                {aiNarrationLoading ? (
                  <NarrationSkeleton />
                ) : (
                  <p className="text-slate-700 text-sm leading-relaxed transition-all duration-500">
                    {aiNarration?.hiddenFact ?? poi.hiddenFact}
                  </p>
                )}
              </div>

              {!tooFar && !alreadyCompleted && (
                <button onClick={() => setActiveTab('sfida')}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2">
                  Inizia la sfida <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* ── Sfida Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'sfida' && !tooFar && !alreadyCompleted && (
            <div className="space-y-4">
              {/* AI badge */}
              {aiChallenges && aiChallenges.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />Sfide generate dall'AI
                </span>
              )}

              {/* Challenge progress */}
              {activeChallenges.length > 1 && !aiChallengesLoading && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    Sfida {currentChallengeIndex + 1} di {activeChallenges.length}
                  </span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${((currentChallengeIndex + 1) / activeChallenges.length) * 100}%` }} />
                  </div>
                </div>
              )}

              {/* Difficulty badge */}
              {diffBadge && !aiChallengesLoading && (
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${diffBadge.bg} ${diffBadge.color}`}>
                    {diffBadge.label}
                  </span>
                  {currentChallenge?.type === 'countdown' && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />{(currentChallenge as Challenge).timeLimit ?? 30}s
                    </span>
                  )}
                  <span className="ml-auto text-xs text-cyan-600 font-medium">
                    +{currentChallenge?.xpBonus} XP
                  </span>
                </div>
              )}

              {renderChallenge()}
            </div>
          )}

          {/* ── Completato Tab ─────────────────────────────────────────────── */}
          {activeTab === 'completato' && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Missione completata!</h3>
                <p className="text-slate-500 text-sm mt-1">Hai completato tutte le sfide di questo luogo.</p>
              </div>
              {/* BUG 6 FIX: only show XP earned for freshly completed POIs, not replays */}
              {!alreadyCompleted && (
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-cyan-600">
                      <Award className="w-5 h-5" />
                      <span className="text-2xl font-bold">{totalXpEarned + poi.xpReward}</span>
                    </div>
                    <span className="text-xs text-slate-500">XP guadagnati</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-cyan-600">
                      <Coins className="w-5 h-5" />
                      <span className="text-2xl font-bold">{poi.coinReward}</span>
                    </div>
                    <span className="text-xs text-slate-500">Monete</span>
                  </div>
                </div>
              )}
              {challengeResults.length > 0 && (
                <div className="space-y-1.5">
                  {challengeResults.map((correct, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <span>Sfida {idx + 1}: {activeChallenges[idx]?.type === 'choice' ? 'Scelta' : correct ? 'Corretta' : 'Sbagliata'}</span>
                      {correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleClose} className="w-full py-3 rounded-xl font-semibold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors">
                Chiudi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label, disabled }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
        active ? 'bg-white/95 backdrop-blur-md text-cyan-700 shadow-sm shadow-cyan-900/5'
        : disabled ? 'text-slate-300 cursor-not-allowed'
        : 'text-slate-500 hover:text-slate-700'
      }`}>
      {icon}{label}
    </button>
  );
}