import {
  Map,
  Brain,
  Star,
  Gift,
  Crown,
  BookOpen,
  Timer,
  Utensils,
  MapPin,
  Coins,
  Trophy,
  Lock,
} from 'lucide-react';
import type { UserProfile, Badge, InterestCategory, PersonalityScores } from '../types';

interface ProfileScreenProps {
  profile: UserProfile;
  badges: Badge[];
  totalPOICount?: number;
}

const LEVEL_TITLES: { max: number; title: string }[] = [
  { max: 1, title: 'Turista Curioso' },
  { max: 3, title: 'Esploratore Locale' },
  { max: 5, title: 'Conoscitore della Citta' },
  { max: Infinity, title: 'Cittadino Onorario' },
];

const XP_PER_LEVEL = 300;

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  map: Map,
  brain: Brain,
  star: Star,
  gift: Gift,
  crown: Crown,
  book: BookOpen,
  timer: Timer,
  utensils: Utensils,
};

const PERSONALITY_LABELS: Record<string, string> = {
  relax: 'Relax',
  divertimento: 'Divertimento',
  cultura: 'Cultura',
  avventura: 'Avventura',
  socialita: 'Socialita',
};

const PERSONALITY_COLORS: Record<string, string> = {
  relax: 'bg-teal-500',
  divertimento: 'bg-cyan-500',
  cultura: 'bg-violet-500',
  avventura: 'bg-red-500',
  socialita: 'bg-sky-500',
};

const INTEREST_LABELS: Record<InterestCategory, string> = {
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

const DOMINANT_TRAIT_DESCRIPTIONS: Record<string, string> = {
  relax:
    'Ami goderti la citta con calma, scoprendo angoli tranquilli e atmosfere rilassanti. Un vero esperto del dolce far niente.',
  divertimento:
    'Cerchi sempre il lato divertente di ogni esperienza. La citta per te e un grande parco giochi da esplorare con entusiasmo.',
  cultura:
    'Sei un appassionato di storia e cultura. Ogni monumento e un libro aperto che aspetta di essere letto.',
  avventura:
    'Lo spirito di avventura ti guida in ogni esplorazione. Ami le sfide e i percorsi meno battuti.',
  socialita:
    'Per te la citta si vive insieme. Ami condividere scoperte e creare ricordi con gli altri.',
};

function getLevelTitle(level: number): string {
  for (const entry of LEVEL_TITLES) {
    if (level <= entry.max) return entry.title;
  }
  return LEVEL_TITLES[LEVEL_TITLES.length - 1].title;
}

function getDominantTrait(scores: PersonalityScores): string {
  let maxKey = 'cultura';
  let maxVal = -1;
  for (const [key, val] of Object.entries(scores)) {
    if (val > maxVal) {
      maxVal = val;
      maxKey = key;
    }
  }
  return maxKey;
}

function getBadgeIcon(iconName: string) {
  return BADGE_ICONS[iconName.toLowerCase()] || Star;
}

function getBadgeColorClasses(color: string, unlocked: boolean) {
  if (!unlocked) {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-400',
      progress: 'bg-slate-300',
      border: 'border-slate-200',
    };
  }

  const colors: Record<string, { bg: string; text: string; progress: string; border: string }> = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      progress: 'bg-blue-500',
      border: 'border-blue-300',
    },
    orange: {
      bg: 'bg-sky-50',
      text: 'text-sky-600',
      progress: 'bg-sky-500',
      border: 'border-sky-300',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      progress: 'bg-green-500',
      border: 'border-green-300',
    },
    pink: {
      bg: 'bg-pink-50',
      text: 'text-pink-600',
      progress: 'bg-pink-500',
      border: 'border-pink-300',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-blue-600',
      progress: 'bg-blue-500',
      border: 'border-yellow-300',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      progress: 'bg-red-500',
      border: 'border-red-300',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      progress: 'bg-purple-500',
      border: 'border-purple-300',
    },
    amber: {
      bg: 'bg-cyan-50',
      text: 'text-cyan-600',
      progress: 'bg-cyan-500',
      border: 'border-cyan-300',
    },
  };

  return colors[color] || colors.amber;
}

export default function ProfileScreen({ profile, badges, totalPOICount }: ProfileScreenProps) {
  const xpInCurrentLevel = profile.xp % XP_PER_LEVEL;
  const xpProgressPercent = (xpInCurrentLevel / XP_PER_LEVEL) * 100;
  const levelTitle = getLevelTitle(profile.level);
  const dominantTrait = getDominantTrait(profile.personalityScores);

  const completedCount = profile.completedPOIs.length;
  const totalPOIs = totalPOICount ?? 0;
  const quizCount = profile.quizResults.length;

  const personalityEntries = Object.entries(profile.personalityScores) as [string, number][];
  const maxPersonalityScore = Math.max(...personalityEntries.map(([, v]) => v), 1);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-cyan-600 via-cyan-500 to-slate-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/95 backdrop-blur-md opacity-5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/95 backdrop-blur-md opacity-5 rounded-full -ml-16 -mb-16" />

        <div className="relative z-10 px-5 pt-8 pb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 rounded-xl bg-white/95 backdrop-blur-md bg-opacity-20 backdrop-blur-sm flex items-center justify-center border border-white border-opacity-30">
              <span className="text-3xl font-black text-white">{profile.level}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{levelTitle}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-white text-opacity-80" />
                <span className="text-white text-opacity-80 text-sm">Roma</span>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-white text-opacity-90 mb-1.5">
              <span>Livello {profile.level}</span>
              <span>
                {xpInCurrentLevel} / {XP_PER_LEVEL} XP
              </span>
            </div>
            <div className="bg-white/95 backdrop-blur-md bg-opacity-20 rounded-full h-3 backdrop-blur-sm">
              <div
                className="bg-white/95 backdrop-blur-md h-3 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md bg-opacity-15 rounded-xl px-4 py-2.5 backdrop-blur-sm w-fit">
            <Coins className="w-5 h-5 text-yellow-200" />
            <span className="text-white font-bold text-lg">{profile.coins}</span>
            <span className="text-white text-opacity-70 text-sm">monete</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 -mt-0">
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm shadow-cyan-900/5 p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-cyan-50 p-2 rounded-lg">
                <Map className="w-5 h-5 text-cyan-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{completedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Luoghi visitati{totalPOIs > 0 ? ` (su ${totalPOIs})` : ''}
            </p>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm shadow-cyan-900/5 p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-violet-50 p-2 rounded-lg">
                <Brain className="w-5 h-5 text-violet-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{quizCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">Quiz completati</p>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm shadow-cyan-900/5 p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-50 p-2 rounded-lg">
                <Trophy className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{profile.totalXp}</p>
            <p className="text-xs text-slate-500 mt-0.5">Punti totali</p>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm shadow-cyan-900/5 p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-yellow-50 p-2 rounded-lg">
                <Coins className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{profile.coins}</p>
            <p className="text-xs text-slate-500 mt-0.5">Monete guadagnate</p>
          </div>
        </div>
      </div>

      {/* Personality Profile */}
      <div className="px-4 mt-6">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm shadow-cyan-900/5 p-5 border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Il tuo profilo esploratore</h2>

          <div className="space-y-3">
            {personalityEntries.map(([key, value]) => {
              const percentage = Math.round((value / maxPersonalityScore) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">
                      {PERSONALITY_LABELS[key] || key}
                    </span>
                    <span className="text-slate-500">{percentage}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`${PERSONALITY_COLORS[key] || 'bg-slate-400'} h-2.5 rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 bg-slate-50 rounded-xl p-3.5">
            <p className="text-sm text-slate-600 leading-relaxed">
              {DOMINANT_TRAIT_DESCRIPTIONS[dominantTrait] ||
                'Continua a esplorare per definire il tuo profilo.'}
            </p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-slate-800 mb-3">Badge</h2>

        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => {
            const colors = getBadgeColorClasses(badge.color, badge.unlocked);
            const Icon = getBadgeIcon(badge.icon);
            const progressPercent =
              badge.requirement > 0 ? (badge.progress / badge.requirement) * 100 : 0;

            return (
              <div
                key={badge.id}
                className={`
                  bg-white/95 backdrop-blur-md rounded-xl shadow-sm shadow-cyan-900/5 p-3 text-center transition-all duration-200
                  border
                  ${
                    badge.unlocked
                      ? `${colors.border} shadow-md shadow-cyan-900/10 ring-1 ring-opacity-30 ring-cyan-300`
                      : 'border-slate-100'
                  }
                `}
              >
                <div className="flex justify-center mb-2">
                  <div
                    className={`${colors.bg} p-3 rounded-xl relative ${badge.unlocked ? '' : 'opacity-50'}`}
                  >
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                    {!badge.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-md bg-opacity-60 rounded-xl">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>
                <h3
                  className={`text-xs font-bold mb-1.5 ${badge.unlocked ? 'text-slate-800' : 'text-slate-400'}`}
                >
                  {badge.name}
                </h3>
                <div className="bg-slate-100 rounded-full h-1.5 mb-1">
                  <div
                    className={`${colors.progress} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
                <p className={`text-xs ${badge.unlocked ? 'text-slate-500' : 'text-slate-400'}`}>
                  {badge.progress}/{badge.requirement}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interests */}
      {profile.interests.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-slate-800 mb-3">I tuoi interessi</h2>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-1.5 rounded-full text-sm font-medium"
              >
                {INTEREST_LABELS[interest] || interest}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
