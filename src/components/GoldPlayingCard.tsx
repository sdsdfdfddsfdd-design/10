import React from 'react';
import { Card } from '../types/game';

interface GoldPlayingCardProps {
  card?: Card;
  isFaceDown?: boolean;
  highlight?: boolean;
}

export const GoldPlayingCard: React.FC<GoldPlayingCardProps> = ({
  card,
  isFaceDown = true,
  highlight = false,
}) => {
  const isRed = card?.suit === '♥' || card?.suit === '♦';

  return (
    <div
      className={`relative w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 rounded-md shadow-md transition-all duration-500 transform preserve-3d ${
        highlight ? 'ring-2 ring-yellow-300 scale-105 -translate-y-1' : ''
      }`}
    >
      {/* Front Face (White Card with Rank & Suit) */}
      <div
        className={`absolute inset-0 w-full h-full rounded-md bg-white border border-slate-300 p-0.5 sm:p-1 flex flex-col justify-between select-none shadow transition-opacity duration-300 ${
          isFaceDown ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex justify-between items-start leading-none">
          <span
            className={`font-black text-[9px] sm:text-[11px] md:text-xs ${
              isRed ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {card?.rank}
          </span>
          <span
            className={`text-[8px] sm:text-[10px] ${
              isRed ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {card?.suit}
          </span>
        </div>

        <div
          className={`self-center text-xs sm:text-base md:text-lg ${
            isRed ? 'text-red-600' : 'text-slate-900'
          }`}
        >
          {card?.suit}
        </div>

        <div className="flex justify-between items-end rotate-180 leading-none">
          <span
            className={`font-black text-[9px] sm:text-[11px] md:text-xs ${
              isRed ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {card?.rank}
          </span>
          <span
            className={`text-[8px] sm:text-[10px] ${
              isRed ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {card?.suit}
          </span>
        </div>
      </div>

      {/* Back Face (Exact Golden Patterned Card from user screenshot) */}
      <div
        className={`absolute inset-0 w-full h-full rounded-md border border-amber-300 bg-gradient-to-b from-[#ffea9f] via-[#f7b733] to-[#e47d12] p-0.5 flex items-center justify-center select-none shadow overflow-hidden transition-opacity duration-300 ${
          isFaceDown ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Inner Gold Guilloche / Pattern */}
        <div className="w-full h-full rounded border border-amber-100/50 flex items-center justify-center relative bg-gradient-to-tr from-amber-400/20 via-transparent to-yellow-200/30">
          {/* Subtle clover / club medallion watermark */}
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-amber-200/60 bg-yellow-300/30 flex items-center justify-center shadow-inner">
            <span className="text-[10px] sm:text-xs text-amber-900/60 font-serif leading-none">♣</span>
          </div>

          {/* Corner flourish */}
          <div className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-amber-100/60" />
          <div className="absolute top-0.5 right-0.5 w-1 h-1 border-t border-r border-amber-100/60" />
          <div className="absolute bottom-0.5 left-0.5 w-1 h-1 border-b border-l border-amber-100/60" />
          <div className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-amber-100/60" />
        </div>
      </div>
    </div>
  );
};
