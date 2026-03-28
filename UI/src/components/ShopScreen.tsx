import { useState } from 'react';
import { Coins, Clock, ChevronDown, ChevronUp, Star, Tag, MapPin, Sun, Sunset, Moon, CloudMoon } from 'lucide-react';
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

const CATEGORY_GRADIENTS: Record<string, string> = {
  enogastronomia: 'from-amber-400 to-orange-500',
  cultura: 'from-indigo-400 to-purple-500',
  arte: 'from-rose-400 to-pink-500',
  storia: 'from-yellow-600 to-amber-700',
  natura: 'from-emerald-400 to-green-600',
  paesaggio: 'from-sky-400 to-cyan-500',
  shopping: 'from-fuchsia-400 to-purple-500',
  artigianato: 'from-orange-400 to-red-500',
  intrattenimento: 'from-violet-400 to-indigo-500',
  family: 'from-teal-400 to-emerald-500',
  sport: 'from-blue-400 to-indigo-500',
};

const TIME_LABELS: Record<string, string> = {
  mattina: 'del mattino',
  pomeriggio: 'del pomeriggio',
  sera: 'della sera',
  notte: 'della notte',
};

function TimeIcon({ timeOfDay }: { timeOfDay: string }) {
  switch (timeOfDay) {
    case 'mattina':
      return <Sun className="w-5 h-5 text-amber-500" />;
    case 'pomeriggio':
      return <Sunset className="w-5 h-5 text-orange-500" />;
    case 'sera':
      return <Moon className="w-5 h-5 text-indigo-400" />;
    case 'notte':
      return <CloudMoon className="w-5 h-5 text-slate-400" />;
    default:
      return <Sun className="w-5 h-5 text-amber-500" />;
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-3xl font-bold text-gray-900">Ricompense</h1>
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2 rounded-full shadow-lg">
              <Coins className="w-5 h-5" />
              <span className="text-lg font-bold tracking-wide">{profile.coins}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <TimeIcon timeOfDay={timeOfDay} />
            <span className="text-sm font-medium">
              Offerte {TIME_LABELS[timeOfDay]}
            </span>
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm text-gray-500 italic">
          Premi ottimizzati per te, in questo momento
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`
                flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                ${selectedCategory === cat.value
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-amber-300 hover:text-amber-600'
                }
              `}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Cards */}
      <div className="px-4 space-y-4 pb-4">
        {availableRewards.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nessuna ricompensa in questa categoria</p>
          </div>
        )}

        {availableRewards.map((reward) => {
          const canAfford = profile.coins >= reward.cost;
          const available = isAvailableNow(reward);
          const availabilityLabel = getAvailabilityLabel(reward);
          const recommended = matchesUserInterests(reward, profile);
          const gradient = CATEGORY_GRADIENTS[reward.category] || 'from-gray-400 to-gray-500';

          return (
            <div
              key={reward.id}
              className={`
                bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-200
                ${available ? 'hover:shadow-lg' : 'opacity-80'}
              `}
            >
              {/* Image Placeholder */}
              <div className={`relative h-32 bg-gradient-to-br ${gradient}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-white/40" />
                </div>

                {recommended && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    Consigliato per te
                  </div>
                )}

                {!available && availabilityLabel && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {availabilityLabel}
                  </div>
                )}

                {available && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Disponibile ora
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                      {reward.partnerName} -- {reward.partnerType}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 mt-0.5 leading-tight">
                      {reward.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {reward.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="text-lg font-bold text-gray-900">{reward.cost}</span>
                    </div>
                    <span className="text-sm text-gray-400 line-through">
                      {reward.originalValue}
                    </span>
                  </div>

                  <button
                    onClick={() => canAfford && available && onClaimReward(reward.id)}
                    disabled={!canAfford || !available}
                    className={`
                      px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200
                      ${canAfford && available
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md hover:shadow-lg active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {!canAfford ? 'Monete insufficienti' : !available ? 'Non disponibile' : 'Riscatta'}
                  </button>
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
            className="flex items-center justify-between w-full bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 mb-3"
          >
            <span className="text-sm font-semibold text-gray-700">
              Ricompense riscattate ({claimedRewards.length})
            </span>
            {claimedExpanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </button>

          {claimedExpanded && (
            <div className="space-y-3">
              {claimedRewards.map((reward) => {
                const gradient = CATEGORY_GRADIENTS[reward.category] || 'from-gray-400 to-gray-500';
                return (
                  <div
                    key={reward.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden opacity-70 border border-gray-100"
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                        <Tag className="w-5 h-5 text-white/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{reward.title}</p>
                        <p className="text-xs text-gray-400">{reward.partnerName}</p>
                      </div>
                      <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0">
                        Riscattato
                      </span>
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
