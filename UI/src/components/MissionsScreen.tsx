import { Target, Lock, CheckCircle2, Clock, MapPin, Star } from 'lucide-react';
import { POI } from '../types';

interface MissionsScreenProps {
  pois: POI[];
  onPOISelect: (poi: POI) => void;
}

const categoryLabels: Record<string, string> = {
  storia: 'Storia',
  arte: 'Arte',
  cultura: 'Cultura',
  natura: 'Natura',
  enogastronomia: 'Enogastronomia',
  paesaggio: 'Paesaggio',
  shopping: 'Shopping',
  artigianato: 'Artigianato',
  intrattenimento: 'Intrattenimento',
  family: 'Family',
  sport: 'Sport',
};

export default function MissionsScreen({ pois, onPOISelect }: MissionsScreenProps) {
  const completed = pois.filter((p) => p.status === 'completed').length;
  const total = pois.length;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-gradient-to-r from-stone-800 to-amber-900 text-white shadow-md">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">Le tue Missioni</h1>
          <p className="text-stone-300 text-sm">
            {completed}/{total} completate -- Completa missioni per sbloccare nuovi luoghi
          </p>
          <div className="mt-3 bg-white/20 rounded-full h-2">
            <div
              className="bg-amber-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {pois.map((poi) => (
          <div
            key={poi.id}
            onClick={() => poi.status !== 'locked' && onPOISelect(poi)}
            className={`
              bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-200
              ${poi.status !== 'locked' ? 'hover:shadow-lg cursor-pointer active:scale-[0.98]' : 'opacity-60'}
            `}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`
                    p-2.5 rounded-xl flex-shrink-0
                    ${poi.status === 'completed'
                      ? 'bg-green-100'
                      : poi.status === 'available' || poi.status === 'active'
                        ? 'bg-amber-100'
                        : 'bg-stone-100'
                    }
                  `}
                >
                  {poi.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {(poi.status === 'available' || poi.status === 'active') && <Target className="w-5 h-5 text-amber-600" />}
                  {poi.status === 'locked' && <Lock className="w-5 h-5 text-stone-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-bold text-stone-900">{poi.name}</h3>
                      <span className="text-xs text-stone-500">{categoryLabels[poi.category] || poi.category}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-stone-700">{poi.importanceScore}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 mb-2">{poi.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {poi.bestTime === 'any' ? 'Sempre' : poi.bestTime === 'mattina' ? 'Mattina' : poi.bestTime === 'pomeriggio' ? 'Pomeriggio' : poi.bestTime === 'sera' ? 'Sera' : 'Tramonto'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {poi.challenges.length} sfide
                      </span>
                    </div>
                    <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {poi.xpReward} XP
                    </div>
                  </div>

                  {poi.status === 'locked' && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-400">
                      <Lock className="w-3 h-3" />
                      <span>Completa altre missioni per sbloccare</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
