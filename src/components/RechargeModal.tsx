import React, { useState } from 'react';
import { Coins, Plus, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: (amount: number) => void;
  isAlertOnly?: boolean;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  onClose,
  onRecharge,
  isAlertOnly = false,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [showPackages, setShowPackages] = useState(!isAlertOnly);
  const [successNotice, setSuccessNotice] = useState<number | null>(null);

  if (!isOpen) return null;

  const packages = [
    { coins: 1000, label: language === 'ar' ? 'باقة المبتدئين' : 'Starter Pack', popular: false },
    { coins: 5000, label: language === 'ar' ? 'الخزينة الفضية' : 'Silver Stash', popular: false },
    { coins: 20000, label: language === 'ar' ? 'كبار اللاعبين' : 'High Roller', popular: true },
    { coins: 50000, label: language === 'ar' ? 'ثروة الـ VIP' : 'VIP Wealth', popular: false },
    { coins: 100000, label: language === 'ar' ? 'زعيم الكازينو' : 'Casino Boss', popular: false },
  ];

  const handleSelectPackage = (amount: number) => {
    onRecharge(amount);
    setSuccessNotice(amount);
    setTimeout(() => {
      setSuccessNotice(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Insufficient coin prompt */}
      {!showPackages && !successNotice ? (
        <div className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Coins className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-black text-white">{t.insufficientCoins}</h3>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            {t.insufficientPrompt}
          </p>

          <div className="flex items-center gap-3">
            <button
              id="btn-recharge-confirm"
              onClick={() => setShowPackages(true)}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg transition-all"
            >
              {t.confirm}
            </button>
            <button
              id="btn-recharge-cancel"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition-all"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      ) : successNotice ? (
        <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-emerald-400 animate-bounce" />
          <h3 className="text-xl font-black text-white">{t.rechargeSuccessful}</h3>
          <p className="text-emerald-400 font-mono font-bold text-lg mt-1">
            +{successNotice.toLocaleString()} {t.chips}
          </p>
        </div>
      ) : (
        /* Full Coin Store */
        <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl">
          <button
            id="btn-close-store"
            onClick={onClose}
            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400`}
            title={t.coinStore}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{t.coinStore}</h3>
              <p className="text-xs text-slate-400">
                {t.coinStoreSubtitle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
            {packages.map((pkg) => (
              <button
                key={pkg.coins}
                id={`btn-buy-${pkg.coins}`}
                onClick={() => handleSelectPackage(pkg.coins)}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.99] ${
                  pkg.popular
                    ? 'bg-gradient-to-r from-amber-950/60 via-slate-900 to-yellow-950/60 border-amber-400/60 shadow-lg'
                    : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800'
                }`}
              >
                {pkg.popular && (
                  <span className={`absolute -top-2.5 ${isRTL ? 'right-4' : 'left-4'} bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow`}>
                    <Sparkles className="w-2.5 h-2.5" /> {language === 'ar' ? 'الأكثر طلباً' : 'POPULAR'}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-sm font-black text-white">
                      {pkg.coins.toLocaleString()} {t.chips}
                    </p>
                    <p className="text-[11px] text-slate-400">{pkg.label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-400/40">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addCoins}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>{language === 'ar' ? 'نظام شحن فوري تجريبي' : 'Instant reload simulator'}</span>
            <button
              onClick={() => handleSelectPackage(50000)}
              className="text-amber-400 hover:text-amber-300 font-bold underline"
            >
              +{language === 'ar' ? 'شحن سريع 50 ألف' : 'Quick 50k'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
