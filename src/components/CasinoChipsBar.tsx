import React from 'react';

interface CasinoChipsBarProps {
  chips: number[];
  selectedChip: number;
  onSelectChip: (amount: number) => void;
  disabled?: boolean;
}

export const CasinoChipsBar: React.FC<CasinoChipsBarProps> = ({
  chips = [100, 1000, 10000, 100000],
  selectedChip,
  onSelectChip,
  disabled = false,
}) => {
  const getChipStyle = (val: number) => {
    switch (val) {
      case 100:
        return {
          bg: 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300',
          border: 'border-cyan-200',
          textColor: 'text-slate-950 font-black',
          dashes: 'border-white',
          label: '100',
          outerRing: 'ring-teal-300',
        };
      case 1000:
        return {
          bg: 'bg-gradient-to-tr from-slate-200 via-white to-slate-300',
          border: 'border-slate-400',
          textColor: 'text-slate-900 font-black',
          dashes: 'border-slate-800',
          label: '1000',
          outerRing: 'ring-slate-300',
        };
      case 10000:
      case 2000:
        return {
          bg: 'bg-gradient-to-tr from-slate-800 via-slate-700 to-slate-900',
          border: 'border-slate-500',
          textColor: 'text-white font-black',
          dashes: 'border-slate-300',
          label: '10k',
          outerRing: 'ring-slate-400',
        };
      case 100000:
      default:
        return {
          bg: 'bg-gradient-to-tr from-slate-400 via-blue-200 to-slate-300',
          border: 'border-slate-400',
          textColor: 'text-slate-900 font-black',
          dashes: 'border-slate-700',
          label: '100K',
          outerRing: 'ring-blue-300',
        };
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      {chips.map((chipVal) => {
        const style = getChipStyle(chipVal);
        const isSelected = selectedChip === chipVal;

        return (
          <button
            key={chipVal}
            id={`btn-chip-${chipVal}`}
            disabled={disabled}
            onClick={() => onSelectChip(chipVal)}
            className={`group relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-200 transform ${
              isSelected
                ? 'scale-110 -translate-y-1.5 shadow-[0_8px_20px_rgba(250,204,21,0.6)] ring-4 ring-yellow-400 z-10'
                : 'hover:scale-105 active:scale-95 opacity-90 hover:opacity-100 shadow-md'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Outer dashed border resembling real casino chips in the photo */}
            <div
              className={`w-full h-full rounded-full border-2 sm:border-[3px] border-dashed ${style.dashes} ${style.bg} p-1 flex items-center justify-center shadow-inner`}
            >
              {/* Center Medallion with Chip Value */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-white/90 border border-black/20 flex items-center justify-center shadow-sm">
                <span className={`text-[10px] sm:text-xs md:text-sm tracking-tight ${style.textColor}`}>
                  {style.label}
                </span>
              </div>
            </div>

            {/* Glowing selected tick indicator */}
            {isSelected && (
              <div className="absolute -top-1 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
