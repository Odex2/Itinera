import { useState, useEffect } from 'react';
import { Trophy, Medal, Loader2, AlertTriangle } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  level: number;
  city: string;
}

interface LeaderboardProps {
  city?: string;
  onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ── Mock data for quick UI testing ────────────────────────────────────────────
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'Marco_Explorer', xp: 4820, level: 17, city: 'Roma' },
  { rank: 2, username: 'GiuliaRoma',     xp: 4350, level: 15, city: 'Roma' },
  { rank: 3, username: 'LucaAdventure',  xp: 3980, level: 14, city: 'Roma' },
  { rank: 4, username: 'SaraWalker',     xp: 3640, level: 13, city: 'Roma' },
  { rank: 5, username: 'AndreaVibes',    xp: 3210, level: 11, city: 'Roma' },
  { rank: 6, username: 'ElenaQuiz',      xp: 2870, level: 10, city: 'Roma' },
  { rank: 7, username: 'DavideRun',      xp: 2540, level: 9,  city: 'Roma' },
  { rank: 8, username: 'ChiaraFoodie',   xp: 2180, level: 8,  city: 'Roma' },
  { rank: 9, username: 'FedericoArt',    xp: 1920, level: 7,  city: 'Roma' },
  { rank: 10, username: 'AlessiaStory',  xp: 1650, level: 6,  city: 'Roma' },
];

const RANK_STYLES: Record<number, { bg: string; text: string; icon: string }> = {
  1: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-500' },
  2: { bg: 'bg-stone-100', text: 'text-stone-600', icon: 'text-stone-400' },
  3: { bg: 'bg-orange-50',  text: 'text-orange-700', icon: 'text-orange-400' },
};

export default function Leaderboard({ city = 'Rome', onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLeaderboard() {
      try {
        const res = await fetch(
          `${API_BASE}/api/leaderboard?city=${encodeURIComponent(city)}`,
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!cancelled) {
          setEntries(Array.isArray(data) ? data.slice(0, 10) : []);
          setLoading(false);
        }
      } catch (err) {
        console.error('[Leaderboard] Fetch failed, using mock data:', err);
        if (!cancelled) {
          // Fallback to mock data for offline/dev testing
          setEntries(MOCK_LEADERBOARD);
          setLoading(false);
        }
      }
    }

    fetchLeaderboard();
    return () => { cancelled = true; };
  }, [city]);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Classifica"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-3 mb-3 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">Classifica — {city}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white font-bold text-lg leading-none"
            aria-label="Chiudi"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-stone-400 text-sm">Caricamento classifica...</p>
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertTriangle className="w-8 h-8 text-stone-300" />
              <p className="text-stone-400 text-sm">Nessun dato disponibile.</p>
            </div>
          )}

          {!loading && entries.length > 0 && (
            <ul className="divide-y divide-stone-100">
              {entries.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const style = RANK_STYLES[entry.rank];

                return (
                  <li
                    key={entry.rank}
                    className={`flex items-center gap-4 px-5 py-3.5 ${
                      isTop3 ? style?.bg ?? '' : 'hover:bg-stone-50'
                    } transition-colors`}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center">
                      {isTop3 ? (
                        <Medal className={`w-6 h-6 ${style?.icon}`} />
                      ) : (
                        <span className="text-stone-400 font-bold text-sm">{entry.rank}</span>
                      )}
                    </div>

                    {/* Name + Level */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isTop3 ? style?.text : 'text-stone-800'}`}>
                        {entry.username}
                      </p>
                      <p className="text-stone-400 text-xs">Livello {entry.level}</p>
                    </div>

                    {/* XP */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-amber-600 text-sm">
                        {entry.xp.toLocaleString('it-IT')}
                      </p>
                      <p className="text-stone-400 text-xs">XP</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
