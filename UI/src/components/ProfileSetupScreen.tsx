// ProfileSetupScreen.tsx
// Pagina raccolta username + età, inserita tra SplashScreen e OnboardingScreen
// Stile: identico a OnboardingScreen (Modern Corporate Tech, cyan, Plus Jakarta Sans)
//
// interface: onComplete(username: string, age: number) => void

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, User, Zap, AtSign, Calendar } from 'lucide-react';

interface ProfileSetupScreenProps {
    onComplete: (username: string, age: number) => void;
}

// ── CSS ───────────────────────────────────────────────────────────────────
const PROFILE_CSS = `
  @keyframes ps-fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ps-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-6px); }
  }
  @keyframes ps-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes ps-ping {
    0%   { transform: scale(1);   opacity: 1; }
    75%  { transform: scale(2);   opacity: 0; }
    100% { transform: scale(2);   opacity: 0; }
  }
  @keyframes ps-caret {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes ps-badge-pop {
    0%   { transform: translate(-50%, -50%) scale(0) rotate(-10deg); opacity: 0; }
    60%  { transform: translate(-50%, -50%) scale(1.15) rotate(3deg);  opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1) rotate(0deg);    opacity: 1; }
  }
  @keyframes ps-badge-out {
    from { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
    to   { transform: translate(-50%, -60%) scale(0.8); opacity: 0; }
  }
  @keyframes ps-shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    40%       { transform: translateX(6px); }
    60%       { transform: translateX(-4px); }
    80%       { transform: translateX(4px); }
  }

  .ps-input-wrap {
    transition: box-shadow 0.2s ease, border-color 0.2s ease !important;
  }
  .ps-input-wrap:focus-within {
    border-color: #06b6d4 !important;
    box-shadow: 0 0 0 4px rgba(6,182,212,0.12), 0 4px 20px rgba(6,182,212,0.12) !important;
  }
  .ps-input {
    outline: none;
    background: transparent;
    width: 100%;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600;
    font-size: 17px;
    color: #0f172a;
    letter-spacing: -0.02em;
    caret-color: #06b6d4;
  }
  .ps-input::placeholder {
    color: #cbd5e1;
    font-weight: 400;
  }
  .ps-input::-webkit-inner-spin-button,
  .ps-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  .ps-cta {
    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1) !important;
  }
  .ps-cta:hover:not(:disabled) {
    transform: translateY(-3px) !important;
    box-shadow: 0 20px 48px rgba(6,182,212,0.4) !important;
  }
  .ps-cta:active:not(:disabled) {
    transform: scale(0.97) !important;
  }
  .ps-age-btn {
    transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1) !important;
  }
  .ps-age-btn:hover {
    transform: translateY(-2px) scale(1.04) !important;
    box-shadow: 0 8px 22px rgba(6,182,212,0.18) !important;
  }
  .ps-age-btn:active {
    transform: scale(0.95) !important;
  }
  .ps-age-btn-selected {
    animation: ps-ping-once 0.35s ease;
  }
  .ps-shake {
    animation: ps-shake 0.4s ease !important;
  }
`;

// ── Age bracket options ───────────────────────────────────────────────────
const AGE_BRACKETS = [
    { id: 'teen', label: '< 18', range: [0, 17], emoji: '🎮' },
    { id: 'young', label: '18–25', range: [18, 25], emoji: '🚀' },
    { id: 'mid', label: '26–35', range: [26, 35], emoji: '💼' },
    { id: 'adult', label: '36–45', range: [36, 45], emoji: '🌍' },
    { id: 'mature', label: '46–60', range: [46, 60], emoji: '🏔️' },
    { id: 'senior', label: '60+', range: [61, 99], emoji: '🎭' },
];

// ── Avatar generator (initials + color) ──────────────────────────────────
const AVATAR_GRADIENTS = [
    ['#06b6d4', '#0284c7'],
    ['#8b5cf6', '#6d28d9'],
    ['#f59e0b', '#d97706'],
    ['#10b981', '#059669'],
    ['#ef4444', '#dc2626'],
    ['#ec4899', '#db2777'],
];

function getGradient(name: string) {
    const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[idx] ?? AVATAR_GRADIENTS[0];
}

function Avatar({ username, size = 72 }: { username: string; size?: number }) {
    const initials = username.slice(0, 2).toUpperCase() || '?';
    const [from, to] = getGradient(username || 'A');
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `linear-gradient(135deg, ${from}, ${to})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 28px ${from}55`,
            flexShrink: 0,
            animation: username ? 'ps-float 2.5s ease infinite' : 'none',
            position: 'relative',
        }}>
            <span style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 800, fontSize: size * 0.34,
                color: 'white', letterSpacing: '-0.02em',
                userSelect: 'none',
            }}>
                {initials}
            </span>
            {/* Ping ring when name present */}
            {username.length >= 2 && (
                <div style={{
                    position: 'absolute', inset: -4,
                    borderRadius: '50%',
                    border: `2px solid ${from}`,
                    opacity: 0.4,
                    animation: 'ps-ping 2.5s ease infinite',
                }} />
            )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function ProfileSetupScreen({ onComplete }: ProfileSetupScreenProps) {
    const [username, setUsername] = useState('');
    const [selectedBracket, setSelectedBracket] = useState<string | null>(null);
    const [exiting, setExiting] = useState(false);
    const [shakeUser, setShakeUser] = useState(false);
    const [shakeAge, setShakeAge] = useState(false);
    const [xpFlash, setXpFlash] = useState(false);
    const [xpOut, setXpOut] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const tag = document.createElement('style');
        tag.innerHTML = PROFILE_CSS;
        tag.id = 'profile-setup-css';
        document.head.appendChild(tag);
        return () => { document.getElementById('profile-setup-css')?.remove(); };
    }, []);

    // Auto-focus on mount
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 600);
    }, []);

    const canSubmit = username.trim().length >= 2 && selectedBracket !== null;

    const handleSubmit = useCallback(() => {
        let valid = true;
        if (username.trim().length < 2) { setShakeUser(true); setTimeout(() => setShakeUser(false), 450); valid = false; }
        if (!selectedBracket) { setShakeAge(true); setTimeout(() => setShakeAge(false), 450); valid = false; }
        if (!valid) return;

        const bracket = AGE_BRACKETS.find((b) => b.id === selectedBracket);
        const midAge = bracket ? Math.round((bracket.range[0] + bracket.range[1]) / 2) : 25;

        // XP flash
        setXpFlash(true);
        setXpOut(false);
        setTimeout(() => setXpOut(true), 800);
        setTimeout(() => {
            setXpFlash(false);
            setExiting(true);
            setTimeout(() => onComplete(username.trim(), midAge), 400);
        }, 1100);
    }, [username, selectedBracket, onComplete]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    }, [handleSubmit]);

    const preview = username.trim() || null;

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

            {/* XP pop badge */}
            {xpFlash && (
                <div style={{
                    position: 'fixed', top: '44%', left: '50%',
                    zIndex: 200, pointerEvents: 'none',
                    animation: xpOut
                        ? 'ps-badge-out 0.35s ease forwards'
                        : 'ps-badge-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                        borderRadius: 18, padding: '14px 26px',
                        boxShadow: '0 16px 50px rgba(6,182,212,0.45)',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <User size={18} color="white" />
                        <span style={{
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            fontWeight: 800, fontSize: 17, color: 'white', letterSpacing: '-0.02em',
                        }}>
                            Profilo creato!
                        </span>
                    </div>
                </div>
            )}

            {/* ── Header strip ── */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: 'rgba(248,250,255,0.88)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(6,182,212,0.1)',
                padding: '14px 20px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                        boxShadow: '0 0 8px rgba(6,182,212,0.6)',
                    }} />
                    <span style={{
                        fontFamily: '"DM Mono", monospace', fontSize: 11,
                        color: '#0891b2', letterSpacing: '0.12em',
                    }}>
                        CREA PROFILO
                    </span>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
                    border: '1.5px solid rgba(6,182,212,0.25)',
                    borderRadius: 100, padding: '5px 12px',
                }}>
                    <Zap size={11} color="#0891b2" fill="#0891b2" />
                    <span style={{
                        fontFamily: '"DM Mono", monospace', fontSize: 11,
                        fontWeight: 500, color: '#0891b2', letterSpacing: '0.04em',
                    }}>
                        0 XP
                    </span>
                </div>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{
                flex: 1, position: 'relative', zIndex: 1,
                padding: '36px 22px 160px',
                display: 'flex', flexDirection: 'column',
            }}>

                {/* Hero */}
                <div style={{
                    textAlign: 'center', marginBottom: 40,
                    animation: 'ps-fadeUp 0.5s ease both',
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
                        border: '1.5px solid rgba(6,182,212,0.3)',
                        borderRadius: 100, padding: '6px 14px', marginBottom: 18,
                    }}>
                        <User size={12} color="#0891b2" />
                        <span style={{
                            fontFamily: '"DM Mono", monospace', fontSize: 11,
                            color: '#0891b2', fontWeight: 500, letterSpacing: '0.1em',
                        }}>
                            STEP 1 DI 1
                        </span>
                    </div>

                    <h1 style={{
                        fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800,
                        fontSize: 30, color: '#0f172a', margin: 0,
                        lineHeight: 1.1, letterSpacing: '-0.04em',
                    }}>
                        Chi sei tu,<br />
                        <span style={{
                            background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            esploratore?
                        </span>
                    </h1>
                    <p style={{
                        fontFamily: '"DM Sans", sans-serif', fontWeight: 400, fontSize: 13,
                        color: '#94a3b8', marginTop: 10, marginBottom: 0,
                    }}>
                        Crea il tuo profilo
                    </p>
                    <div style={{
                        width: 40, height: 3, borderRadius: 2,
                        background: 'linear-gradient(90deg, #67e8f9, #06b6d4)',
                        margin: '14px auto 0',
                        boxShadow: '0 0 10px rgba(6,182,212,0.5)',
                    }} />
                </div>

                {/* Avatar preview */}
                <div style={{
                    display: 'flex', justifyContent: 'center', marginBottom: 36,
                    animation: 'ps-fadeUp 0.5s ease both', animationDelay: '80ms',
                }}>
                    <Avatar username={preview || ''} size={80} />
                </div>

                {/* ── Username field ── */}
                <div style={{
                    marginBottom: 28,
                    animation: 'ps-fadeUp 0.5s ease both', animationDelay: '150ms',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                    }}>
                        <AtSign size={13} color="#06b6d4" />
                        <span style={{
                            fontFamily: '"DM Mono", monospace', fontSize: 11,
                            color: '#0891b2', letterSpacing: '0.1em',
                        }}>
                            USERNAME
                        </span>
                    </div>

                    <div
                        className={`ps-input-wrap${shakeUser ? ' ps-shake' : ''}`}
                        style={{
                            background: 'white',
                            border: `2px solid ${shakeUser ? '#ef4444' : '#f1f5f9'}`,
                            borderRadius: 16, padding: '16px 18px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}
                    >
                        <span style={{
                            fontFamily: '"DM Mono", monospace', fontSize: 16,
                            color: '#06b6d4', fontWeight: 500, flexShrink: 0,
                        }}>
                            @
                        </span>
                        <input
                            ref={inputRef}
                            className="ps-input"
                            type="text"
                            placeholder="il_tuo_nome"
                            value={username}
                            maxLength={20}
                            onChange={(e) => setUsername(e.target.value.replace(/\s/g, '_').toLowerCase())}
                            onKeyDown={handleKeyDown}
                        />
                        {username.length >= 2 && (
                            <div style={{
                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(6,182,212,0.35)',
                            }}>
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Char count */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginTop: 6, padding: '0 2px',
                    }}>
                        <span style={{
                            fontFamily: '"DM Sans", sans-serif', fontSize: 11,
                            color: shakeUser ? '#ef4444' : '#cbd5e1',
                        }}>
                            {shakeUser ? 'Almeno 2 caratteri' : 'Solo lettere, numeri e _'}
                        </span>
                        <span style={{
                            fontFamily: '"DM Mono", monospace', fontSize: 11,
                            color: username.length > 15 ? '#f59e0b' : '#cbd5e1',
                        }}>
                            {username.length}/20
                        </span>
                    </div>
                </div>

                {/* ── Age bracket ── */}
                <div style={{
                    animation: 'ps-fadeUp 0.5s ease both', animationDelay: '230ms',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
                    }}>
                        <Calendar size={13} color="#06b6d4" />
                        <span style={{
                            fontFamily: '"DM Mono", monospace', fontSize: 11,
                            color: '#0891b2', letterSpacing: '0.1em',
                        }}>
                            ETÀ
                        </span>
                        {shakeAge && (
                            <span style={{
                                fontFamily: '"DM Sans", sans-serif', fontSize: 11,
                                color: '#ef4444', marginLeft: 4,
                            }}>
                                — seleziona una fascia
                            </span>
                        )}
                    </div>

                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
                    }}
                        className={shakeAge ? 'ps-shake' : ''}
                    >
                        {AGE_BRACKETS.map((bracket, i) => {
                            const isOn = selectedBracket === bracket.id;
                            return (
                                <button
                                    key={bracket.id}
                                    className="ps-age-btn"
                                    onClick={() => setSelectedBracket(bracket.id)}
                                    style={{
                                        background: isOn
                                            ? 'linear-gradient(145deg, #ecfeff, #e0f9ff)'
                                            : 'white',
                                        border: isOn ? '2.5px solid #06b6d4' : '2px solid #f1f5f9',
                                        borderRadius: 16, padding: '14px 8px',
                                        cursor: 'pointer', textAlign: 'center',
                                        boxShadow: isOn
                                            ? '0 8px 24px rgba(6,182,212,0.2)'
                                            : '0 2px 8px rgba(0,0,0,0.05)',
                                        animation: `ps-fadeUp 0.45s ease both`,
                                        animationDelay: `${230 + i * 55}ms`,
                                        position: 'relative', overflow: 'hidden',
                                    }}
                                >
                                    {/* Shimmer on selected */}
                                    {isOn && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.65) 50%, transparent 60%)',
                                            backgroundSize: '200% auto',
                                            animation: 'ps-shimmer 2.2s linear infinite',
                                            pointerEvents: 'none',
                                        }} />
                                    )}
                                    <div style={{
                                        fontSize: 22, lineHeight: 1, marginBottom: 6,
                                        display: 'inline-block',
                                        animation: isOn ? 'ps-float 2s ease infinite' : 'none',
                                    }}>
                                        {bracket.emoji}
                                    </div>
                                    <div style={{
                                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                                        fontWeight: isOn ? 700 : 500, fontSize: 13,
                                        color: isOn ? '#0891b2' : '#0f172a',
                                        letterSpacing: '-0.01em',
                                    }}>
                                        {bracket.label}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Preview card */}
                {canSubmit && (
                    <div style={{
                        marginTop: 32,
                        background: 'linear-gradient(135deg, #ecfeff, #e0f9ff)',
                        border: '1.5px solid rgba(6,182,212,0.25)',
                        borderRadius: 20, padding: '18px 20px',
                        display: 'flex', alignItems: 'center', gap: 16,
                        boxShadow: '0 4px 20px rgba(6,182,212,0.12)',
                        animation: 'ps-fadeUp 0.4s ease both',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
                            backgroundSize: '200% auto',
                            animation: 'ps-shimmer 3s linear infinite',
                            pointerEvents: 'none',
                        }} />
                        <Avatar username={username} size={48} />
                        <div>
                            <div style={{
                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                fontWeight: 800, fontSize: 16, color: '#0f172a',
                                letterSpacing: '-0.02em', marginBottom: 3,
                            }}>
                                @{username}
                            </div>
                            <div style={{
                                fontFamily: '"DM Sans", sans-serif', fontSize: 12,
                                color: '#64748b', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <span>{AGE_BRACKETS.find(b => b.id === selectedBracket)?.emoji}</span>
                                <span>{AGE_BRACKETS.find(b => b.id === selectedBracket)?.label} anni</span>
                                <span style={{ color: '#cbd5e1' }}>·</span>
                                <span style={{ color: '#06b6d4', fontFamily: '"DM Mono", monospace', fontSize: 11 }}>
                                    0 XP
                                </span>
                            </div>
                        </div>
                        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                                borderRadius: 10, padding: '5px 10px',
                                fontFamily: '"DM Mono", monospace', fontSize: 10,
                                color: 'white', fontWeight: 500, letterSpacing: '0.05em',
                            }}>
                                LIVE
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── CTA sticky ── */}
            <div style={{
                position: 'sticky', bottom: 0, zIndex: 10,
                background: 'linear-gradient(to top, rgba(248,250,255,1) 60%, rgba(248,250,255,0))',
                padding: '20px 22px 38px',
            }}>
                <button
                    className="ps-cta"
                    onClick={handleSubmit}
                    style={{
                        width: '100%', padding: '16px 24px', borderRadius: 16, border: 'none',
                        background: canSubmit
                            ? 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)'
                            : '#f1f5f9',
                        color: canSubmit ? 'white' : '#cbd5e1',
                        fontSize: 14, fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontWeight: 700, letterSpacing: '-0.01em',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: canSubmit ? '0 10px 28px rgba(6,182,212,0.32)' : 'none',
                    }}
                >
                    {canSubmit ? (
                        <>Crea il mio profilo <ChevronRight size={15} /></>
                    ) : (
                        'Inserisci username ed età'
                    )}
                </button>
            </div>

        </div>
    );
}