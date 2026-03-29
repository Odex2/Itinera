import { Target, CheckCircle2, Clock, MapPin, Star } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-slate-800 to-amber-900 text-white shadow-md shadow-cyan-900/10">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold mb-1">Le tue Missioni</h1>
          <p className="text-slate-300 text-sm">
            {completed}/{total} completate -- Completa missioni per sbloccare nuovi luoghi
          </p>
          <div className="mt-3 bg-white/95 backdrop-blur-md/20 rounded-full h-2">
            <div
              className="bg-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {pois.map((poi) => (
          <div
            key={poi.id}
            onClick={() => onPOISelect(poi)}
            className="bg-white/95 backdrop-blur-md rounded-xl shadow-md shadow-cyan-900/10 overflow-hidden transition-all duration-200 hover:shadow-[0_8px_30px_rgb(6,182,212,0.12)] cursor-pointer active:scale-[0.98]"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`
                    p-2.5 rounded-xl flex-shrink-0
                    ${poi.status === 'completed' ? 'bg-green-100' : 'bg-cyan-100'}
                  `}
                >
                  {poi.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {poi.status !== 'completed' && <Target className="w-5 h-5 text-cyan-600" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-bold text-slate-900">{poi.name}</h3>
                      <span className="text-xs text-slate-500">{categoryLabels[poi.category] || poi.category}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500" />
                      <span className="text-xs font-bold text-slate-700">{poi.importanceScore}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">{poi.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {poi.bestTime === 'any' ? 'Sempre' : poi.bestTime === 'mattina' ? 'Mattina' : poi.bestTime === 'pomeriggio' ? 'Pomeriggio' : poi.bestTime === 'sera' ? 'Sera' : 'Tramonto'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {poi.challenges.length} sfide
                      </span>
                    </div>
                    <div className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {poi.xpReward} XP
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
