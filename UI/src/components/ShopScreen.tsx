import { useState } from 'react';
import { Coins, Clock, ChevronDown, ChevronUp, Star, Tag, Sun, Sunset, Moon, CloudMoon, Percent, MapPin } from 'lucide-react';
import type { Reward, UserProfile, InterestCategory } from '../types';

interface ShopScreenProps {
  rewards: Reward[];
  profile: UserProfile;
  onClaimReward: (rewardId: string) => boolean;
  timeOfDay: 'mattina' | 'pomeriggio' | 'sera' | 'notte';
}

const CATEGORY_FILTERS: { label: string; value: InterestCategory | 'tutti' }[] = [
  { label: 'Tutti', value: 'tutti' },
  { label: 'Enogastronomia', value: 'enogastronomia' },
  { label: 'Arte', value: 'arte' },
  { label: 'Artigianato', value: 'artigianato' },
  { label: 'Cultura', value: 'cultura' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Intrattenimento', value: 'intrattenimento' },
  { label: 'Natura', value: 'natura' },
  { label: 'Sport', value: 'sport' },
];

// Category accent colors (left border + icon tint)
const CATEGORY_ACCENT: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  enogastronomia: { border: 'border-l-amber-400',  bg: 'bg-amber-50',   text: 'text-amber-700',  icon: '🍷' },
  cultura:        { border: 'border-l-indigo-400', bg: 'bg-indigo-50',  text: 'text-indigo-700', icon: '🏛️' },
  arte:           { border: 'border-l-rose-400',   bg: 'bg-rose-50',    text: 'text-rose-700',   icon: '🎨' },
  storia:         { border: 'border-l-blue-400',   bg: 'bg-blue-50',    text: 'text-blue-700',   icon: '📜' },
  natura:         { border: 'border-l-emerald-400',bg: 'bg-emerald-50', text: 'text-emerald-700',icon: '🌿' },
  paesaggio:      { border: 'border-l-sky-400',    bg: 'bg-sky-50',     text: 'text-sky-700',    icon: '🌅' },
  shopping:       { border: 'border-l-fuchsia-400',bg: 'bg-fuchsia-50', text: 'text-fuchsia-700',icon: '🛍️' },
  artigianato:    { border: 'border-l-orange-400', bg: 'bg-orange-50',  text: 'text-orange-700', icon: '🏺' },
  intrattenimento:{ border: 'border-l-violet-400', bg: 'bg-violet-50',  text: 'text-violet-700', icon: '🎭' },
  family:         { border: 'border-l-teal-400',   bg: 'bg-teal-50',    text: 'text-teal-700',   icon: '👨‍👩‍👧' },
  sport:          { border: 'border-l-cyan-400',   bg: 'bg-cyan-50',    text: 'text-cyan-700',   icon: '⚡' },
};

const TIME_LABELS: Record<string, string> = {
  mattina: 'del mattino',
  pomeriggio: 'del pomeriggio',
  sera: 'della sera',
  notte: 'della notte',
};

function TimeIcon({ timeOfDay }: { timeOfDay: string }) {
  switch (timeOfDay) {
    case 'mattina':    return <Sun className="w-4 h-4 text-amber-500" />;
    case 'pomeriggio': return <Sunset className="w-4 h-4 text-sky-500" />;
    case 'sera':       return <Moon className="w-4 h-4 text-indigo-400" />;
    case 'notte':      return <CloudMoon className="w-4 h-4 text-slate-400" />;
    default:           return <Sun className="w-4 h-4 text-amber-500" />;
  }
}

function isAvailableNow(reward: Reward): boolean {
  const hour = new Date().getHours();
  return hour >= reward.availableFrom && hour <= reward.availableTo;
}

function getAvailabilityLabel(reward: Reward): string | null {
  if (isAvailableNow(reward)) return null;
  return `Apre alle ${reward.availableFrom.toString().padStart(2, '0')}:00`;
}

function matchesUserInterests(reward: Reward, profile: UserProfile): boolean {
  return profile.interests.includes(reward.category);
}

// Extract numeric discount from originalValue string like "15%"
function parseDiscount(originalValue: string): number | null {
  const match = originalValue.match(/(\d+)%/);
  return match ? parseInt(match[1]) : null;
}

export default function ShopScreen({ rewards, profile, onClaimReward, timeOfDay }: ShopScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<InterestCategory | 'tutti'>('tutti');
  const [claimedExpanded, setClaimedExpanded] = useState(false);

  const filteredRewards = rewards.filter((r) => {
    if (selectedCategory !== 'tutti' && r.category !== selectedCategory) return false;
    return true;
  });

  const availableRewards = filteredRewards.filter((r) => !r.claimed);
  const claimedRewards = filteredRewards.filter((r) => r.claimed);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Ricompense</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <TimeIcon timeOfDay={timeOfDay} />
                <span className="text-sm text-slate-500">Offerte {TIME_LABELS[timeOfDay]}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-cyan-500 text-white px-3 py-2 rounded-xl">
              <Coins className="w-4 h-4" />
              <span className="font-bold text-base">{profile.coins}</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                  ${selectedCategory === cat.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reward Cards */}
      <div className="p-4 space-y-3 pb-6">
        {availableRewards.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Tag className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nessuna ricompensa in questa categoria</p>
          </div>
        )}

        {availableRewards.map((reward) => {
          const canAfford = profile.coins >= reward.cost;
          const available = isAvailableNow(reward);
          const availabilityLabel = getAvailabilityLabel(reward);
          const recommended = matchesUserInterests(reward, profile);
          const discount = parseDiscount(reward.originalValue);
          const accent = CATEGORY_ACCENT[reward.category] ?? CATEGORY_ACCENT.cultura;

          return (
            <div
              key={reward.id}
              className={`
                bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden
                border-l-4 ${accent.border}
                ${!available ? 'opacity-70' : ''}
                transition-all duration-150 hover:shadow-md
              `}
            >
              <div className="p-4">
                {/* Top row: category icon + name + badges */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Category emoji icon */}
                    <div className={`${accent.bg} rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 text-xl`}>
                      {accent.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{reward.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{reward.partnerName}</p>
                    </div>
                  </div>

                  {/* Discount badge */}
                  {discount !== null && (
                    <div className="flex items-center gap-0.5 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0">
                      <Percent className="w-3 h-3" />
                      {discount}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{reward.description}</p>

                {/* Bottom row: status + cost + button */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Availability */}
                    {available ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Disponibile
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {availabilityLabel}
                      </span>
                    )}

                    {/* Recommended badge */}
                    {recommended && (
                      <span className="flex items-center gap-0.5 text-xs text-cyan-600 font-medium">
                        <Star className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                        Per te
                      </span>
                    )}
                  </div>

                  {/* Cost + button */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="font-bold text-slate-800 text-sm">{reward.cost}</span>
                    </div>
                    <button
                      onClick={() => canAfford && available && onClaimReward(reward.id)}
                      disabled={!canAfford || !available}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150
                        ${canAfford && available
                          ? 'bg-cyan-500 text-white hover:bg-cyan-600 active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {!canAfford ? 'Monete insufficienti' : !available ? 'Non disp.' : 'Riscatta'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Claimed Rewards Section */}
      {claimedRewards.length > 0 && (
        <div className="px-4 pb-8">
          <button
            onClick={() => setClaimedExpanded(!claimedExpanded)}
            className="flex items-center justify-between w-full bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100 mb-3"
          >
            <span className="text-sm font-semibold text-slate-600">
              Riscattate ({claimedRewards.length})
            </span>
            {claimedExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
            }
          </button>

          {claimedExpanded && (
            <div className="space-y-2">
              {claimedRewards.map((reward) => {
                const accent = CATEGORY_ACCENT[reward.category] ?? CATEGORY_ACCENT.cultura;
                const discount = parseDiscount(reward.originalValue);
                return (
                  <div
                    key={reward.id}
                    className={`bg-white rounded-xl border border-slate-100 border-l-4 ${accent.border} opacity-60 overflow-hidden`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className={`${accent.bg} rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0 text-lg`}>
                        {accent.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{reward.title}</p>
                        <p className="text-xs text-slate-400">{reward.partnerName}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {discount !== null && (
                          <span className="text-xs text-slate-400">-{discount}%</span>
                        )}
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Riscattato
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}