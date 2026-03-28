import { useState } from 'react';
import { X, Gift, Copy, Check } from 'lucide-react';

interface RewardModalProps {
  rewardTitle: string;
  rewardDescription: string;
  sponsorLogo: string;
  sponsorName: string;
  onClose: () => void;
}

function generateCouponCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I/1/O/0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function RewardModal({
  rewardTitle,
  rewardDescription,
  sponsorLogo,
  sponsorName,
  onClose,
}: RewardModalProps) {
  const [coupon, setCoupon] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRedeem = () => {
    setCoupon(generateCouponCode());
  };

  const handleCopy = async () => {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[RewardModal] Copy failed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Riscatta premio"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm mx-3 mb-3 sm:mb-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">Premio</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-6 space-y-5">
          {/* Sponsor */}
          <div className="flex items-center gap-4">
            <img
              src={sponsorLogo}
              alt={sponsorName}
              className="w-14 h-14 rounded-xl object-contain bg-stone-100 p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="%23d4d4d8"><rect width="56" height="56" rx="12"/></svg>';
              }}
            />
            <div>
              <h3 className="text-stone-900 font-bold">{rewardTitle}</h3>
              <p className="text-stone-500 text-sm">{sponsorName}</p>
            </div>
          </div>

          <p className="text-stone-600 text-sm">{rewardDescription}</p>

          {/* Coupon or Redeem button */}
          {!coupon ? (
            <button
              onClick={handleRedeem}
              className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:from-purple-600 hover:to-indigo-700 active:scale-[0.98] transition-all"
            >
              Riscatta il premio
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-stone-400 text-xs font-medium uppercase tracking-wider text-center">
                Il tuo codice coupon
              </p>
              <div className="flex items-center justify-center gap-3 bg-stone-50 border-2 border-dashed border-stone-300 rounded-xl px-5 py-4">
                <span className="text-3xl font-mono font-bold text-stone-900 tracking-[0.3em]">
                  {coupon}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-stone-200 transition-colors"
                  aria-label="Copia codice"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-stone-400" />
                  )}
                </button>
              </div>
              <p className="text-stone-400 text-xs text-center">
                Mostra questo codice al partner per riscattare il premio.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-colors"
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
