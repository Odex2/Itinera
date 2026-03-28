// LandingScreen.tsx
// Place in src/components/LandingScreen.tsx
//
// Usage in App.tsx:
//   const [screen, setScreen] = useState<'landing' | 'onboarding' | 'map'>('landing');
//   {screen === 'landing' && <LandingScreen onStart={() => setScreen('onboarding')} />}
//
// Font: add to index.html <head>:
//   <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

import { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';

interface LandingScreenProps {
    onStart: () => void;
}

// Tech dot coordinates
const DOTS = Array.from({ length: 90 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 3,
    opacity: Math.random() * 0.4 + 0.1,
}));

// Technical grid/map lines
const LINES = [
    { x1: 5, y1: 30, x2: 45, y2: 28 },
    { x1: 45, y1: 28, x2: 55, y2: 45 },
    { x1: 55, y1: 45, x2: 95, y2: 42 },
    { x1: 10, y1: 60, x2: 40, y2: 55 },
    { x1: 40, y1: 55, x2: 60, y2: 70 },
    { x1: 60, y1: 70, x2: 92, y2: 68 },
    { x1: 20, y1: 15, x2: 30, y2: 40 },
    { x1: 70, y1: 10, x2: 65, y2: 50 },
    { x1: 80, y1: 50, x2: 85, y2: 85 },
    { x1: 15, y1: 75, x2: 50, y2: 80 },
    { x1: 50, y1: 80, x2: 88, y2: 78 },
    { x1: 35, y1: 20, x2: 55, y2: 45 },
    { x1: 55, y1: 45, x2: 72, y2: 30 },
];

export default function LandingScreen({ onStart }: LandingScreenProps) {
    const [mounted, setMounted] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        // Stagger mount for orchestrated reveal
        const t = setTimeout(() => setMounted(true), 60);
        return () => clearTimeout(t);
    }, []);

    const handleStart = useCallback(() => {
        setExiting(true);
        setTimeout(() => onStart(), 700);
    }, [onStart]);

    return (
        <div
            style={{
                fontFamily: '"DM Sans", sans-serif',
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(150deg, #f8faff 0%, #f0fdff 55%, #ecfeff 100%)',
                overflow: 'hidden',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                opacity: exiting ? 0 : 1,
                transform: exiting ? 'scale(0.96)' : 'scale(1)',
            }}
        >
            {/* Grid bg */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: `
            linear-gradient(rgba(6,182,212,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.05) 1px, transparent 1px)
            `,
                backgroundSize: '44px 44px',
            }} />

            {/* Ambient glows */}
            <div style={{
                position: 'absolute', top: '-15%', right: '-15%',
                width: '55vw', height: '55vw', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{
                position: 'absolute', bottom: '-15%', left: '-10%',
                width: '45vw', height: '45vw', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(14,165,233,0.09) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0,
            }} />

            {/* ── Animated map background ── */}
            <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15, pointerEvents: 'none' }}
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid slice"
            >
                {/* Road lines */}
                {LINES.map((l, i) => (
                    <line
                        key={i}
                        x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                        stroke="#06b6d4"
                        strokeWidth="0.15"
                        strokeLinecap="round"
                        style={{
                            opacity: mounted ? 0.6 : 0,
                            transition: `opacity 1.2s ease ${0.4 + i * 0.05}s`,
                        }}
                    />
                ))}
                {/* Glowing dots — POI markers */}
                {DOTS.map((d) => (
                    <circle
                        key={d.id}
                        cx={d.x}
                        cy={d.y}
                        r={d.size * 0.18}
                        fill="#0891b2"
                        style={{
                            opacity: mounted ? d.opacity : 0,
                            transition: `opacity 1s ease ${d.delay * 0.15}s`,
                            animation: `pulse-dot ${d.duration}s ease-in-out ${d.delay}s infinite alternate`,
                        }}
                    />
                ))}
            </svg>

            {/* ── Top badge ── */}
            <div style={{
                position: 'absolute',
                top: 52,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #ecfeff, #cffafe)',
                border: '1.5px solid rgba(6,182,212,0.3)',
                borderRadius: 100, padding: '6px 14px',
                opacity: mounted ? 1 : 0,
                transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s',
                marginTop: mounted ? 0 : -8,
                zIndex: 10
            }}>
                <Zap size={12} color="#0891b2" fill="#0891b2" />
                <span style={{
                    fontFamily: '"DM Mono", monospace',
                    color: '#0891b2',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                }}>
                    EXPLORE THE CITY
                </span>
            </div>

            {/* ── Main content — centered ── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 24px',
                textAlign: 'center',
                zIndex: 2,
                pointerEvents: 'none', // Allow clicking things behind, though here mostly self-contained
            }}>

                {/* Cyber tech bar top */}
                <div style={{
                    width: mounted ? 40 : 0,
                    height: 3,
                    background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
                    marginBottom: 28,
                    borderRadius: 2,
                    transition: 'width 1s ease 0.5s',
                }} />

                {/* ITINERA — main title */}
                <h1
                    style={{
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontSize: 'clamp(50px, 15vw, 130px)',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                        margin: 0,
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
                        transition: 'opacity 1s ease 0.6s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.6s',
                    }}
                >
                    ITINERA
                </h1>

                {/* Tech subtitle */}
                <p
                    style={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 400,
                        fontSize: 'clamp(18px, 5vw, 24px)',
                        color: '#94a3b8',
                        letterSpacing: '0.01em',
                        marginTop: 16,
                        marginBottom: 0,
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
                        transition: 'opacity 1s ease 0.85s, transform 1s cubic-bezier(0.16,1,0.3,1) 0.85s',
                    }}
                >
                    Ogni luogo racconta una storia.
                </p>

                {/* Cyber tech bar bottom */}
                <div style={{
                    width: mounted ? 40 : 0,
                    height: 3,
                    background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
                    marginTop: 28,
                    marginBottom: 52,
                    borderRadius: 2,
                    transition: 'width 1s ease 1s',
                }} />

                {/* CTA button */}
                <button
                    onClick={handleStart}
                    style={{
                        position: 'relative',
                        padding: '16px 32px',
                        background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                        border: 'none',
                        borderRadius: 16,
                        color: 'white',
                        fontSize: 16,
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1) 1.1s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: mounted ? '0 10px 28px rgba(6,182,212,0.32)' : 'none',
                        pointerEvents: 'auto',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = mounted ? 'translateY(-3px)' : 'translateY(12px)';
                        e.currentTarget.style.boxShadow = '0 20px 48px rgba(6,182,212,0.4)';
                        const shine = e.currentTarget.querySelector('.btn-shine') as HTMLElement;
                        if (shine) shine.style.transform = 'translate(200%, -50%) rotate(25deg)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = mounted ? 'translateY(0)' : 'translateY(12px)';
                        e.currentTarget.style.boxShadow = mounted ? '0 10px 28px rgba(6,182,212,0.32)' : 'none';
                        const shine = e.currentTarget.querySelector('.btn-shine') as HTMLElement;
                        if (shine) { shine.style.transition = 'none'; shine.style.transform = 'translate(-200%, -50%) rotate(25deg)'; setTimeout(() => { shine.style.transition = 'transform 0.6s ease'; }, 10); }
                    }}
                >
                    {/* Shine sweep */}
                    <span
                        className="btn-shine"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: 0,
                            width: '150%',
                            height: '200%',
                            background: 'linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
                            transform: 'translate(-200%, -50%) rotate(25deg)',
                            transition: 'transform 0.6s ease',
                            pointerEvents: 'none',
                        }}
                    />
                    <Zap size={16} fill="white" />
                    Inizia il tour
                </button>

                {/* Scroll hint */}
                <p style={{
                    marginTop: 40,
                    color: '#94a3b8',
                    fontFamily: '"DM Mono", monospace',
                    fontSize: 12,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    opacity: mounted ? 1 : 0,
                    transition: 'opacity 1.2s ease 1.5s',
                }}>
                    Roma · HACKATON26
                </p>
            </div>

            {/* ── Corner decorations ── */}
            {[
                { top: 20, left: 20 },
                { top: 20, right: 20 },
                { bottom: 20, left: 20 },
                { bottom: 20, right: 20 },
            ].map((pos, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        ...pos,
                        width: 20,
                        height: 20,
                        borderTop: 'top' in pos ? '1.5px solid rgba(6,182,212,0.3)' : undefined,
                        borderBottom: 'bottom' in pos ? '1.5px solid rgba(6,182,212,0.3)' : undefined,
                        borderLeft: 'left' in pos ? '1.5px solid rgba(6,182,212,0.3)' : undefined,
                        borderRight: 'right' in pos ? '1.5px solid rgba(6,182,212,0.3)' : undefined,
                        opacity: mounted ? 1 : 0,
                        transition: `opacity 1s ease ${1.4 + i * 0.1}s`,
                    }}
                />
            ))}

            {/* ── Keyframe injection ── */}
            <style>{`
        @keyframes pulse-dot {
          from { opacity: var(--from-op, 0.05); transform: scale(1);  }
          to   { opacity: var(--to-op,   0.35); transform: scale(1.1); }
        }
      `}</style>
        </div>
    );
}