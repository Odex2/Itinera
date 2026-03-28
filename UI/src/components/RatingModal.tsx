import { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';

interface RatingModalProps {
  poiId: string;
  poiName: string;
  onClose: () => void;
  onRated?: (score: number) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function RatingModal({ poiId, poiName, onClose, onRated }: RatingModalProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleRate = async (score: number) => {
    setSelectedStar(score);
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/user/rate-place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poiId, score }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setSubmitted(true);
      onRated?.(score);
    } catch (err) {
      console.error('[RatingModal] Submit failed:', err);
      setError('Impossibile inviare la valutazione. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayStar = hoveredStar || selectedStar;

  const labels = ['', 'Pessimo', 'Mediocre', 'Buono', 'Ottimo', 'Eccezionale'];

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Valuta questo luogo"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm mx-3 mb-3 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-2 flex items-start justify-between">
          <div>
            <h2 className="text-stone-900 font-bold text-lg">Valuta questo luogo</h2>
            <p className="text-stone-500 text-sm mt-0.5">{poiName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        {/* Stars */}
        <div className="px-5 py-6">
          {!submitted ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2" role="radiogroup" aria-label="Punteggio">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    disabled={submitting}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => handleRate(star)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                    role="radio"
                    aria-checked={selectedStar === star}
                    aria-label={`${star} ${star === 1 ? 'stella' : 'stelle'}`}
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= displayStar
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Label */}
              <p className="text-stone-500 text-sm h-5">
                {displayStar > 0 ? labels[displayStar] : 'Tocca una stella'}
              </p>

              {/* Loading */}
              {submitting && (
                <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
              )}

              {/* Error */}
              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <Star className="w-7 h-7 text-green-600 fill-green-600" />
              </div>
              <p className="text-stone-900 font-bold text-lg">Grazie!</p>
              <p className="text-stone-500 text-sm text-center">
                Hai dato {selectedStar} {selectedStar === 1 ? 'stella' : 'stelle'} a {poiName}.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-stone-900 text-white font-bold text-sm rounded-xl hover:bg-stone-800 transition-colors"
              >
                Chiudi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
