// OnboardingScreen.tsx — TECH REBOOT
// Aesthetic: Modern Corporate Tech × Gamification
// Light bg, cyan electric accent, heavy micro-animations
// Fonts: Plus Jakarta Sans (display) + DM Sans (body) + DM Mono (labels)
// Same wizard logic: one question per page, onComplete(answers, dietary)
//
// Add to index.html:
// <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Check, ChevronRight, ChevronLeft, Zap, Coffee, Footprints, Landmark, Store, Map, Compass, Wine, Ticket, Utensils, Moon, Sofa, BookOpen, Wand2, Camera, ChefHat, History, Navigation } from 'lucide-react';
import type { OnboardingAnswer, InterestCategory } from '../types';
import { dietaryOptions } from '../data/onboardingQuestions';

interface OnboardingScreenProps {
  onComplete: (answers: OnboardingAnswer[], dietary: string[]) => void;
}

// ── CSS injected once ─────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @keyframes ob-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ob-slideInRight {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes ob-slideInLeft {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes ob-ping {
    0%   { transform: scale(1);   opacity: 1; }
    75%  { transform: scale(1.8); opacity: 0; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  @keyframes ob-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes ob-pulse-border {
    0%, 100% { box-shadow: 0 0 0 4px rgba(6,182,212,0.15), 0 4px 16px rgba(6,182,212,0.25); }
    50%       { box-shadow: 0 0 0 8px rgba(6,182,212,0.08), 0 4px 20px rgba(6,182,212,0.35); }
  }
  @keyframes ob-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-5px); }
  }
  @keyframes ob-badge-pop {
    0%   { transform: translate(-50%, -50%) scale(0) rotate(-12deg); opacity: 0; }
    60%  { transform: translate(-50%, -50%) scale(1.15) rotate(3deg);  opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1) rotate(0deg);    opacity: 1; }
  }
  @keyframes ob-badge-out {
    from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    to   { transform: translate(-50%, -60%) scale(0.8); opacity: 0; }
  }
  .ob-card-btn {
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
                box-shadow 0.18s ease,
                background 0.15s ease,
                border-color 0.15s ease !important;
  }
  .ob-card-btn:hover:not(:disabled) {
    transform: translateY(-4px) scale(1.02) !important;
    box-shadow: 0 16px 40px rgba(6,182,212,0.2) !important;
  }
  .ob-card-btn:active:not(:disabled) {
    transform: scale(0.96) !important;
  }
  .ob-cta {
    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1) !important;
  }
  .ob-cta:hover:not(:disabled) {
    transform: translateY(-3px) !important;
    box-shadow: 0 20px 48px rgba(6,182,212,0.4) !important;
  }
  .ob-cta:active:not(:disabled) {
    transform: scale(0.97) !important;
  }
  .ob-back {
    transition: all 0.2s ease !important;
  }
  .ob-back:hover {
    background: rgba(6,182,212,0.06) !important;
    border-color: rgba(6,182,212,0.4) !important;
    color: #0891b2 !important;
  }
  .ob-dot-btn {
    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important;
  }
  .ob-dot-btn:hover {
    transform: scale(1.5) !important;
  }
  .ob-diet-btn {
    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important;
  }
  .ob-diet-btn:hover {
    transform: translateY(-2px) !important;
  }
`;

// ── Data ──────────────────────────────────────────────────────────────────

interface CardQuestion {
  kind: 'card';
  id: string;
  number: string;
  question: string;
  subtitle: string;
  options: {
    id: string;
    icon: React.ReactNode;
    label: string;
    desc: string;
    categories: InterestCategory[];
  }[];
}
interface SliderQuestion {
  kind: 'slider';
  id: string;
  number: string;
  question: string;
  subtitle: string;
  leftLabel: string;
  rightLabel: string;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
  categories: InterestCategory[];
}
type Question = CardQuestion | SliderQuestion;

const QUESTIONS: Question[] = [
  {
    kind: 'card', id: 'q1', number: '01',
    question: 'Come inizi una giornata ideale a Roma?',
    subtitle: 'Scegli quella che ti rappresenta di più',
    options: [
      { id: 'coffee', icon: <Coffee size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Bar storico', desc: 'Caffè lento in un posto con storia', categories: ['enogastronomia', 'storia'] },
      { id: 'run', icon: <Footprints size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Corsa ai Fori', desc: 'Movimento e la città che si sveglia', categories: ['sport', 'natura'] },
      { id: 'museum', icon: <Landmark size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Museo aperto', desc: 'Primo ingresso, nessuna fila, silenzio', categories: ['cultura', 'arte'] },
      { id: 'market', icon: <Store size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Mercato rionale', desc: 'Voci, colori, gente vera del quartiere', categories: ['shopping', 'family'] },
    ],
  },
  {
    kind: 'slider', id: 'q2', number: '02',
    question: 'Quanto sei avventuroso?',
    subtitle: "Dai percorsi battuti all'esplorazione totale",
    leftLabel: 'Sicurezza', rightLabel: 'Avventura',
    leftIcon: <Map size={24} color="#0891b2" strokeWidth={1.5} />, rightIcon: <Compass size={24} color="#0891b2" strokeWidth={1.5} />,
    categories: ['sport', 'natura', 'paesaggio'],
  },
  {
    kind: 'card', id: 'q3', number: '03',
    question: 'Cosa non può mancare in una serata a Roma?',
    subtitle: 'La tua serata perfetta',
    options: [
      { id: 'aperitivo', icon: <Wine size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Aperitivo in piazza', desc: 'Tramonto, vino, buona compagnia', categories: ['enogastronomia', 'intrattenimento'] },
      { id: 'show', icon: <Ticket size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Spettacolo', desc: 'Musica, teatro, cultura live', categories: ['intrattenimento', 'arte'] },
      { id: 'trattoria', icon: <Utensils size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Trattoria nascosta', desc: 'Pasta fatta a mano, zero turisti', categories: ['enogastronomia', 'storia'] },
      { id: 'walk', icon: <Moon size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Passeggiata notturna', desc: 'Roma illuminata, ritmo lento', categories: ['paesaggio', 'natura'] },
    ],
  },
  {
    kind: 'slider', id: 'q4', number: '04',
    question: 'Quanto conta la cultura nel tuo viaggio?',
    subtitle: 'Relax puro o immersione nella storia',
    leftLabel: 'Relax totale', rightLabel: 'Cultura intensa',
    leftIcon: <Sofa size={24} color="#0891b2" strokeWidth={1.5} />, rightIcon: <BookOpen size={24} color="#0891b2" strokeWidth={1.5} />,
    categories: ['cultura', 'arte', 'storia'],
  },
  {
    kind: 'card', id: 'q5', number: '05',
    question: 'Il tuo souvenir ideale di Roma?',
    subtitle: 'Cosa porti a casa',
    options: [
      { id: 'craft', icon: <Wand2 size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Artigianato', desc: 'Fatto a mano, unico, autentico', categories: ['artigianato', 'shopping'] },
      { id: 'photo', icon: <Camera size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Una foto perfetta', desc: "Il momento, la luce, l'angolo giusto", categories: ['paesaggio', 'arte'] },
      { id: 'recipe', icon: <ChefHat size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Una ricetta', desc: 'Lezione di cucina da rifare a casa', categories: ['enogastronomia', 'famiglia'] },
      { id: 'story', icon: <History size={32} color="#0891b2" strokeWidth={1.5} />, label: 'Una storia segreta', desc: 'Quel posto che non trovi sulle guide', categories: ['storia', 'cultura'] },
    ],
  },
];

const TOTAL_STEPS = QUESTIONS.length + 1;
const SLIDER_LABELS = ['', 'Per niente', 'Poco', 'Equilibrato', 'Abbastanza', 'Moltissimo'];
const SLIDER_MIDDLE = [null, <Map key="1" size={54} color="#0891b2" strokeWidth={1} />, <Map key="2" size={54} color="#0891b2" strokeWidth={1} />, <Navigation key="3" size={54} color="#0891b2" strokeWidth={1} />, <Compass key="4" size={54} color="#0891b2" strokeWidth={1} />, <Compass key="5" size={54} color="#0891b2" strokeWidth={1} />];

// ── Sub-components ────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 22 : 6, height: 6, borderRadius: 3,
          background: i < current
            ? '#06b6d4'
            : i === current
              ? 'linear-gradient(90deg, #06b6d4, #0284c7)'
              : 'rgba(0,0,0,0.1)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: i === current ? '0 0 10px rgba(6,182,212,0.55)' : 'none',
        }} />
      ))}
    </div>
  );
}

function CardOption({
  opt, isOn, onSelect, delay,
}: {
  opt: CardQuestion['options'][number];
  isOn: boolean;
  onSelect: () => void;
  delay: number;
}) {
  return (
    <button
      className="ob-card-btn"
      onClick={onSelect}
      style={{
        background: isOn
          ? 'linear-gradient(145deg, #ecfeff 0%, #e0f9ff 100%)'
          : '#ffffff',
        border: isOn ? '2.5px solid #06b6d4' : '2px solid #f1f5f9',
        borderRadius: 20, padding: '20px 16px', textAlign: 'left',
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        boxShadow: isOn
          ? '0 8px 28px rgba(6,182,212,0.22), inset 0 1px 0 rgba(255,255,255,0.9)'
          : '0 2px 10px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
        animation: `ob-fadeUp 0.45s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Ping ring on selected */}
      {isOn && (
        <div style={{ position: 'absolute', top: 13, right: 13, width: 22, height: 22 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(6,182,212,0.3)',
            animation: 'ob-ping 1.4s ease infinite',
          }} />
          <div style={{
            position: 'relative', width: 22, height: 22, borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(6,182,212,0.45)',
          }}>
            <Check size={12} color="white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Shimmer sweep */}
      {isOn && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.65) 50%, transparent 60%)',
          backgroundSize: '200% auto',
          animation: 'ob-shimmer 2.2s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      <div style={{
        marginBottom: 12, lineHeight: 1,
        display: 'inline-block',
        animation: isOn ? 'ob-float 2.2s ease infinite' : 'none',
        filter: isOn ? 'drop-shadow(0 4px 8px rgba(6,182,212,0.3))' : 'none',
      }}>
        {opt.icon}
      </div>
      <div style={{
        fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
        fontSize: 13, color: isOn ? '#0891b2' : '#0f172a',
        marginBottom: 5, letterSpacing: '-0.01em',
      }}>
        {opt.label}
      </div>
      <div style={{
        fontFamily: '"DM Sans", sans-serif', fontWeight: 400, fontSize: 11,
        color: isOn ? '#0e7490' : '#94a3b8', lineHeight: 1.5,
      }}>
        {opt.desc}
      </div>
    </button>
  );
}

function SliderStep({
  q, value, onChange,
}: { q: SliderQuestion; value: number; onChange: (v: number) => void }) {
  const pct = ((value - 1) / 4) * 100;
  return (
    <>
      <div style={{ marginBottom: 32, animation: 'ob-fadeUp 0.4s ease both' }}>
        <div style={{
          fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#06b6d4',
          letterSpacing: '0.15em', marginBottom: 12,
          background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
          border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8,
          padding: '4px 10px', display: 'inline-block',
        }}>
          {q.number} / 0{TOTAL_STEPS}
        </div>
        <h2 style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800,
          fontSize: 24, color: '#0f172a', margin: 0,
          lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 6,
        }}>
          {q.question}
        </h2>
        <p style={{
          fontFamily: '"DM Sans", sans-serif', fontWeight: 400, fontSize: 13,
          color: '#94a3b8', margin: 0,
        }}>
          {q.subtitle}
        </p>
      </div>

      {/* Big emoji + label display */}
      <div style={{
        textAlign: 'center', marginBottom: 36,
        animation: 'ob-fadeUp 0.4s ease both', animationDelay: '120ms',
      }}>
        <div style={{
          marginBottom: 8,
          display: 'inline-block',
          animation: 'ob-float 2.5s ease infinite',
          filter: 'drop-shadow(0 4px 12px rgba(6,182,212,0.2))',
        }}>
          {SLIDER_MIDDLE[value]}
        </div>
        <div style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
          fontSize: 17, color: '#0f172a', letterSpacing: '-0.02em',
        }}>
          {SLIDER_LABELS[value]}
        </div>
      </div>

      {/* Slider track */}
      <div style={{ animation: 'ob-fadeUp 0.4s ease both', animationDelay: '200ms' }}>
        <div style={{
          position: 'relative', height: 60, display: 'flex', alignItems: 'center',
          marginBottom: 8,
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3,
            background: '#f1f5f9',
          }} />
          <div style={{
            position: 'absolute', left: 0, width: `${pct}%`, height: 6, borderRadius: 3,
            background: 'linear-gradient(90deg, #67e8f9, #06b6d4)',
            transition: 'width 0.15s ease',
            boxShadow: '0 0 14px rgba(6,182,212,0.45)',
          }} />
          <input
            type="range" min={1} max={5} step={1} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{
              position: 'absolute', inset: 0, width: '100%',
              opacity: 0, cursor: 'pointer', height: '100%', margin: 0, zIndex: 2,
            }}
          />
          {/* Custom thumb */}
          <div style={{
            position: 'absolute', left: `calc(${pct}% - 22px)`,
            width: 44, height: 44, borderRadius: '50%',
            background: 'white',
            border: '3px solid #06b6d4',
            transition: 'left 0.15s ease',
            pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'ob-pulse-border 2s ease infinite',
          }}>
            <span style={{
              fontFamily: '"DM Mono", monospace', fontWeight: 500,
              fontSize: 14, color: '#0891b2',
            }}>{value}</span>
          </div>
        </div>

        {/* Dot picks */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '0 5px', marginTop: 4,
        }}>
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              className="ob-dot-btn"
              onClick={() => onChange(v)}
              style={{
                width: 10, height: 10, borderRadius: '50%', border: 'none',
                background: v <= value ? '#06b6d4' : '#e2e8f0',
                cursor: 'pointer', padding: 0,
                boxShadow: v === value ? '0 0 10px rgba(6,182,212,0.7)' : 'none',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
            {q.leftIcon} {q.leftLabel}
          </span>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
            {q.rightLabel} {q.rightIcon}
          </span>
        </div>
      </div>
    </>
  );
}

function DietaryStep({ dietary, onToggle }: { dietary: string[]; onToggle: (id: string) => void }) {
  return (
    <>
      <div style={{ marginBottom: 28, animation: 'ob-fadeUp 0.4s ease both' }}>
        <div style={{
          fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#06b6d4',
          letterSpacing: '0.15em', marginBottom: 12,
          background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
          border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8,
          padding: '4px 10px', display: 'inline-block',
        }}>
          06 / 06
        </div>
        <h2 style={{
          fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800,
          fontSize: 24, color: '#0f172a', margin: 0,
          lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 6,
        }}>
          Preferenze alimentari
        </h2>
        <p style={{
          fontFamily: '"DM Sans", sans-serif', fontWeight: 400, fontSize: 13,
          color: '#94a3b8', margin: 0, marginBottom: 28,
        }}>
          Facoltativo — salta se non necessario
        </p>
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10,
        animation: 'ob-fadeUp 0.4s ease both', animationDelay: '100ms',
      }}>
        {dietaryOptions.map((diet, i) => {
          const isOn = dietary.includes(diet.id);
          return (
            <button
              key={diet.id}
              className="ob-diet-btn"
              onClick={() => onToggle(diet.id)}
              style={{
                padding: '10px 20px', borderRadius: 100,
                border: isOn ? '2px solid #06b6d4' : '2px solid #f1f5f9',
                background: isOn ? 'linear-gradient(135deg, #ecfeff, #cffafe)' : 'white',
                color: isOn ? '#0891b2' : '#64748b',
                fontSize: 13, fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: isOn ? 600 : 400, cursor: 'pointer',
                boxShadow: isOn ? '0 4px 14px rgba(6,182,212,0.22)' : '0 1px 4px rgba(0,0,0,0.06)',
                animation: `ob-fadeUp 0.4s ease both`,
                animationDelay: `${i * 55}ms`,
              }}
            >
              {diet.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animKey, setAnimKey] = useState(0);
  const [cardAnswers, setCardAnswers] = useState<Record<string, { optionId: string; categories: InterestCategory[] }>>({});
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({ q2: 3, q4: 3 });
  const [dietary, setDietary] = useState<string[]>([]);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const tag = document.createElement('style');
    tag.innerHTML = GLOBAL_CSS;
    document.head.appendChild(tag);
    return () => { document.head.removeChild(tag); };
  }, []);

  const currentQ = step < QUESTIONS.length ? QUESTIONS[step] : null;
  const isDietaryStep = step === QUESTIONS.length;

  const canAdvance = useMemo(() => {
    if (isDietaryStep) return true;
    if (!currentQ) return false;
    if (currentQ.kind === 'card') return !!cardAnswers[currentQ.id];
    return true;
  }, [step, currentQ, cardAnswers, isDietaryStep]);

  const goTo = useCallback((next: number, dir: 'forward' | 'back') => {
    setDirection(dir);
    setStep(next);
    setAnimKey((k) => k + 1);
  }, []);

  const handleNext = useCallback(() => {
    if (!canAdvance) return;
    if (isDietaryStep) {
      setExiting(true);
      const answers: OnboardingAnswer[] = [
        ...Object.entries(cardAnswers).map(([qId, val]) => ({
          questionId: qId, answerId: val.optionId, categories: val.categories,
        })),
        ...QUESTIONS.filter((q): q is SliderQuestion => q.kind === 'slider').map((q) => {
          const v = sliderValues[q.id] ?? 3;
          const rep: InterestCategory[] = [];
          for (let i = 0; i < v; i++) rep.push(...q.categories);
          return { questionId: q.id, answerId: String(v), categories: rep };
        }),
      ];
      setTimeout(() => onComplete(answers, dietary), 450);
      return;
    }
    goTo(step + 1, 'forward');
  }, [canAdvance, isDietaryStep, step, goTo, cardAnswers, sliderValues, dietary, onComplete]);

  const handleBack = useCallback(() => {
    if (step === 0) return;
    goTo(step - 1, 'back');
  }, [step, goTo]);

  const toggleDietary = useCallback((id: string) => {
    setDietary((prev) => {
      if (id === 'none') return prev.includes('none') ? [] : ['none'];
      const without = prev.filter((d) => d !== 'none');
      return without.includes(id) ? without.filter((d) => d !== id) : [...without, id];
    });
  }, []);

  const buildAnswers = useCallback((): [OnboardingAnswer[], string[]] => {
    const answers: OnboardingAnswer[] = [
      ...Object.entries(cardAnswers).map(([qId, val]) => ({
        questionId: qId, answerId: val.optionId, categories: val.categories,
      })),
      ...QUESTIONS.filter((q): q is SliderQuestion => q.kind === 'slider').map((q) => {
        const v = sliderValues[q.id] ?? 3;
        const rep: InterestCategory[] = [];
        for (let i = 0; i < v; i++) rep.push(...q.categories);
        return { questionId: q.id, answerId: String(v), categories: rep };
      }),
    ];
    return [answers, dietary];
  }, [cardAnswers, sliderValues, dietary]);

  const slideAnim = direction === 'forward' ? 'ob-slideInRight' : 'ob-slideInLeft';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(150deg, #f8faff 0%, #f0fdff 55%, #ecfeff 100%)',
      fontFamily: '"DM Sans", sans-serif',
      opacity: exiting ? 0 : 1,
      transform: exiting ? 'scale(0.96)' : 'scale(1)',
      transition: 'opacity 0.4s ease, transform 0.4s ease',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Grid bg */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
      }} />

      {/* Ambient glows */}
      <div style={{
        position: 'fixed', top: '-15%', right: '-15%',
        width: '55vw', height: '55vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', left: '-10%',
        width: '45vw', height: '45vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />


      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(248,250,255,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(6,182,212,0.1)',
        padding: '14px 20px 12px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 11,
        }}>
          <StepDots current={step} total={TOTAL_STEPS} />
        </div>
        <div style={{ height: 3, background: '#e8f0f8', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(step / TOTAL_STEPS) * 100}%`,
            background: 'linear-gradient(90deg, #67e8f9, #06b6d4, #0284c7)',
            borderRadius: 2,
            transition: 'width 0.55s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 0 10px rgba(6,182,212,0.5)',
          }} />
        </div>
      </div>

      {/* ── Content ── */}
      <div
        key={animKey}
        style={{
          flex: 1, position: 'relative', zIndex: 1,
          padding: '32px 22px 150px',
          animation: `${slideAnim} 0.38s cubic-bezier(0.25,0.46,0.45,0.94) both`,
        }}
      >
        {/* Intro header (step 0 only) */}
        {step === 0 && (
          <div style={{
            marginBottom: 36, textAlign: 'center',
            animation: 'ob-fadeUp 0.5s ease both',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
              border: '1.5px solid rgba(6,182,212,0.3)',
              borderRadius: 100, padding: '6px 14px', marginBottom: 18,
            }}>
              <Zap size={12} color="#0891b2" fill="#0891b2" />
              <span style={{
                fontFamily: '"DM Mono", monospace', fontSize: 11,
                color: '#0891b2', fontWeight: 500, letterSpacing: '0.1em',
              }}>
                PERSONALIZZA LA TUA ROMA
              </span>
            </div>
            <h1 style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800,
              fontSize: 30, color: '#0f172a', margin: 0,
              lineHeight: 1.1, letterSpacing: '-0.04em',
            }}>
              Costruisci il tuo
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                profilo esploratore
              </span>
            </h1>
            <p style={{
              fontFamily: '"DM Sans", sans-serif', fontWeight: 400, fontSize: 13,
              color: '#94a3b8', marginTop: 10, marginBottom: 0,
            }}>
              6 step · sblocca esperienze
            </p>
            <div style={{
              width: 40, height: 3, borderRadius: 2,
              background: 'linear-gradient(90deg, #67e8f9, #06b6d4)',
              margin: '16px auto 0',
              boxShadow: '0 0 10px rgba(6,182,212,0.5)',
            }} />
          </div>
        )}

        {/* Card question */}
        {currentQ?.kind === 'card' && (() => {
          const q = currentQ as CardQuestion;
          return (
            <>
              <div style={{ marginBottom: 26, animation: 'ob-fadeUp 0.4s ease both' }}>
                <div style={{
                  fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#06b6d4',
                  letterSpacing: '0.15em', marginBottom: 12,
                  background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
                  border: '1px solid rgba(255,255,255,0.5)', borderRadius: 8,
                  padding: '4px 10px', display: 'inline-block',
                }}>
                  {q.number} / 0{TOTAL_STEPS}
                </div>
                <h2 style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800,
                  fontSize: 24, color: '#0f172a', margin: 0,
                  lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 6,
                }}>
                  {q.question}
                </h2>
                <p style={{
                  fontFamily: '"DM Sans", sans-serif', fontWeight: 400, fontSize: 13,
                  color: '#94a3b8', margin: 0,
                }}>
                  {q.subtitle}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {q.options.map((opt, i) => (
                  <CardOption
                    key={opt.id}
                    opt={opt}
                    isOn={cardAnswers[q.id]?.optionId === opt.id}
                    onSelect={() => setCardAnswers((prev) => ({
                      ...prev,
                      [q.id]: { optionId: opt.id, categories: opt.categories },
                    }))}
                    delay={i * 75}
                  />
                ))}
              </div>
            </>
          );
        })()}

        {/* Slider question */}
        {currentQ?.kind === 'slider' && (
          <SliderStep
            q={currentQ as SliderQuestion}
            value={sliderValues[(currentQ as SliderQuestion).id] ?? 3}
            onChange={(v) =>
              setSliderValues((prev) => ({ ...prev, [(currentQ as SliderQuestion).id]: v }))
            }
          />
        )}

        {/* Dietary */}
        {isDietaryStep && <DietaryStep dietary={dietary} onToggle={toggleDietary} />}
      </div>

      {/* ── CTA ── */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 10,
        background: 'linear-gradient(to top, rgba(248,250,255,1) 60%, rgba(248,250,255,0))',
        padding: '20px 22px 38px',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              className="ob-back"
              onClick={handleBack}
              style={{
                width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                background: 'white', border: '2px solid #e2e8f0',
                color: '#94a3b8', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <button
            className="ob-cta"
            onClick={handleNext}
            disabled={!canAdvance}
            style={{
              flex: 1, padding: '16px 24px', borderRadius: 16, border: 'none',
              background: canAdvance
                ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
                : '#f1f5f9',
              color: canAdvance ? 'white' : '#cbd5e1',
              fontSize: 14, fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700, letterSpacing: '-0.01em',
              cursor: canAdvance ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: canAdvance ? '0 10px 28px rgba(6,182,212,0.32)' : 'none',
            }}
          >
            {isDietaryStep
              ? <><Zap size={15} fill="white" /> Inizia l'avventura</>
              : canAdvance
                ? <>Continua <ChevronRight size={15} /></>
                : 'Scegli una risposta'}
          </button>
        </div>

        {isDietaryStep && (
          <button
            onClick={() => {
              setExiting(true);
              const [answers] = buildAnswers();
              setTimeout(() => onComplete(answers, []), 450);
            }}
            style={{
              display: 'block', margin: '10px auto 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#94a3b8',
            }}
          >
            Salta questo step
          </button>
        )}
      </div>

    </div>
  );
}