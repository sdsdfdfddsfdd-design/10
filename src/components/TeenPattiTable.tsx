import React, { useEffect, useRef } from 'react';
import { SpotId, TableState } from '../types/game';
import { RoyalChair } from './RoyalChair';
import { GoldPlayingCard } from './GoldPlayingCard';
import { CasinoChipsBar } from './CasinoChipsBar';
import { sound } from '../lib/audio';
import confetti from 'canvas-confetti';
import { Star, RotateCcw, X, Trophy, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface TeenPattiTableProps {
  table: TableState;
  userBalance: number;
  selectedChip: number;
  onSelectChip: (chip: number) => void;
  onPlaceBet: (spot: SpotId, amount: number) => void;
  onOpenTopUp: () => void;
  onOpenHistory: () => void;
  onOpenRules: () => void;
  onOpenRank: () => void;
  onCloseGame?: () => void;
}

export const TeenPattiTable: React.FC<TeenPattiTableProps> = ({
  table,
  userBalance,
  selectedChip,
  onSelectChip,
  onPlaceBet,
  onOpenTopUp,
  onOpenHistory,
  onOpenRules,
  onOpenRank,
  onCloseGame,
}) => {
  const { t, language } = useLanguage();
  const prevPhase = useRef(table.phase);
  const prevTimer = useRef(table.timerRemaining);

  const getRankDisplayName = (name: string) => {
    if (language !== 'ar') return name;
    if (name.includes('Trail') || name.includes('Trio')) return 'تريو (ثلاثية)';
    if (name.includes('Pure Sequence')) return 'متتالية نقية';
    if (name.includes('Sequence')) return 'متتالية';
    if (name.includes('Color') || name.includes('Flush')) return 'لون موحد';
    if (name.includes('Pair')) return 'زوج';
    if (name.includes('High Card')) return 'كرت عالي';
    return name;
  };

  // Audio triggers
  useEffect(() => {
    if (prevPhase.current !== table.phase) {
      if (table.phase === 'COUNTDOWN') {
        sound.playGameStart();
      } else if (table.phase === 'DEALING') {
        sound.playDealCard();
      } else if (table.phase === 'SHOWDOWN' || table.phase === 'RESULTS') {
        sound.playWinFanfare();
        if (table.winningSpot && table.userBets[table.winningSpot] > 0) {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#e11d48', '#3b82f6', '#c026d3', '#fef08a'],
          });
        }
      }
      prevPhase.current = table.phase;
    }

    if (
      table.phase === 'COUNTDOWN' &&
      table.timerRemaining <= 5 &&
      table.timerRemaining > 0 &&
      prevTimer.current !== table.timerRemaining
    ) {
      sound.playTimerTick();
    }
    prevTimer.current = table.timerRemaining;
  }, [table.phase, table.timerRemaining, table.winningSpot, table.userBets]);

  const handleSpotClick = (spot: SpotId) => {
    if (table.phase !== 'COUNTDOWN') return;
    if (userBalance < selectedChip) {
      onOpenTopUp();
      return;
    }
    sound.playChipBet();
    onPlaceBet(spot, selectedChip);
  };

  const isRevealed = table.phase === 'SHOWDOWN' || table.phase === 'RESULTS';

  const spotsConfig: { id: SpotId; chairColor: 'blue' | 'magenta' | 'red'; name: string }[] = [
    { id: 'A', chairColor: 'blue', name: 'A' },
    { id: 'B', chairColor: 'magenta', name: 'B' },
    { id: 'C', chairColor: 'red', name: 'C' },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none py-0 sm:py-1 px-1">
      {/* Main Gold Framed Game Container (Exact replica of screenshot) */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl border-[5px] sm:border-[7px] border-amber-400/95 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_0_20px_rgba(245,158,11,0.35)] bg-gradient-to-b from-[#fde7be] via-[#f7cb93] to-[#fad6a5] p-2 sm:p-3 flex flex-col justify-between overflow-hidden">
        {/* Corner Rivet Screws */}
        <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-amber-700/60 border border-amber-200" />
        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-700/60 border border-amber-200" />
        <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-amber-700/60 border border-amber-200" />
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-amber-700/60 border border-amber-200" />

        {/* Top Header Bar Plaque with "Teen Patti" & Close/Lobby Buttons */}
        <div className="relative w-full flex items-center justify-between mb-2">
          {/* Back to Lobby Button */}
          <button
            id="btn-back-to-lobby"
            onClick={onCloseGame}
            className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-300 text-white font-black text-[10px] sm:text-xs shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
            title={t.backToLobby}
          >
            <ArrowRight className="w-3 h-3 rtl:rotate-0 ltr:rotate-180" />
            <span>{t.lobby}</span>
          </button>

          {/* Golden Arched Plaque */}
          <div className="relative px-4 sm:px-8 py-1 rounded-b-2xl bg-gradient-to-b from-[#fef08a] via-[#facc15] to-[#ca8a04] border-b-2 border-x-2 border-amber-600 shadow-md">
            <span className="font-serif font-black text-sm sm:text-lg md:text-xl text-amber-950 tracking-wide drop-shadow-sm">
              {t.tableTitle}
            </span>
          </div>

          {/* Red/Orange Round Close Button with 'X' */}
          <button
            id="btn-close-game"
            onClick={onCloseGame}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-orange-500 to-red-600 border-2 border-white text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={t.backToLobby}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </button>
        </div>

        {/* Main Content Arena with Left Tabs & 3 Columns */}
        <div className="relative w-full flex items-center gap-1 sm:gap-2">
          {/* Left Vertical Tabs: Rank & Rules */}
          <div className="flex flex-col gap-2 shrink-0 z-20">
            {/* Rank Tab */}
            <button
              id="btn-tab-rank"
              onClick={onOpenRank}
              className="px-1.5 sm:px-2 py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-amber-200 text-white font-black text-[11px] sm:text-xs shadow-md flex flex-col items-center justify-center leading-tight transition-transform active:scale-95"
              title={t.rankTitle}
            >
              {language === 'ar' ? (
                <div className="flex flex-col items-center text-[10px] sm:text-[11px] font-bold leading-3">
                  <span>تـ</span>
                  <span>ر</span>
                  <span>تـ</span>
                  <span>يـ</span>
                  <span>ب</span>
                </div>
              ) : (
                <div className="flex flex-col items-center leading-none">
                  <span>R</span>
                  <span>a</span>
                  <span>n</span>
                  <span>k</span>
                </div>
              )}
            </button>

            {/* Rules Tab */}
            <button
              id="btn-tab-rules"
              onClick={onOpenRules}
              className="px-1.5 sm:px-2 py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-b from-rose-500 to-red-700 border-2 border-rose-200 text-white font-black text-[11px] sm:text-xs shadow-md flex flex-col items-center justify-center leading-tight transition-transform active:scale-95"
              title={t.rulesTitle}
            >
              {language === 'ar' ? (
                <div className="flex flex-col items-center text-[10px] sm:text-[11px] font-bold leading-3">
                  <span>قـ</span>
                  <span>و</span>
                  <span>ا</span>
                  <span>عـ</span>
                  <span>د</span>
                </div>
              ) : (
                <div className="flex flex-col items-center leading-none">
                  <span>R</span>
                  <span>u</span>
                  <span>l</span>
                  <span>e</span>
                  <span>s</span>
                </div>
              )}
            </button>
          </div>

          {/* 3 Columns: Spot A, Spot B, Spot C */}
          <div className="flex-1 grid grid-cols-3 gap-1.5 sm:gap-3">
            {spotsConfig.map((spotCfg, index) => {
              const spot = table.spots[spotCfg.id];
              const isCenterB = spotCfg.id === 'B';
              const isSpotWinner = isRevealed && table.winningSpot === spotCfg.id;
              const myBet = table.userBets[spotCfg.id] || 0;

              return (
                <div
                  key={spotCfg.id}
                  className="flex flex-col items-center justify-between gap-1 sm:gap-2"
                >
                  {/* CARDS SECTION (Top of column) */}
                  <div className="relative w-full p-1 sm:p-1.5 rounded-xl border border-amber-700/20 bg-amber-900/10 shadow-inner flex items-center justify-center min-h-[56px] sm:min-h-[70px]">
                    <div className="flex items-center -space-x-4 sm:-space-x-5">
                      {[0, 1, 2].map((cardIdx) => (
                        <GoldPlayingCard
                          key={cardIdx}
                          card={spot?.cards?.[cardIdx]}
                          isFaceDown={!isRevealed}
                          highlight={isSpotWinner}
                        />
                      ))}
                    </div>

                    {/* COUNTDOWN TIMER BADGE (Positioned exactly on Column B like screenshot!) */}
                    {isCenterB && (
                      <div className="absolute z-30 flex items-center justify-center pointer-events-none">
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-purple-600 via-indigo-700 to-purple-900 border-2 border-amber-300 shadow-[0_0_15px_rgba(147,51,234,0.7)] flex items-center justify-center text-white font-mono font-black text-sm sm:text-base ${
                            table.timerRemaining <= 5 && table.phase === 'COUNTDOWN'
                              ? 'animate-ping'
                              : ''
                          }`}
                        >
                          <span>{table.timerRemaining}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ROYAL CHAIR (Middle of column) */}
                  <button
                    onClick={() => handleSpotClick(spotCfg.id)}
                    disabled={table.phase !== 'COUNTDOWN'}
                    className={`relative cursor-pointer transition-transform duration-200 ${
                      table.phase === 'COUNTDOWN' ? 'hover:scale-105 active:scale-95' : ''
                    }`}
                    title={`Bet on ${spotCfg.name}`}
                  >
                    <RoyalChair
                      color={spotCfg.chairColor}
                      isWinner={isSpotWinner}
                    />

                    {/* Winner Crown Indicator on Showdown */}
                    {isSpotWinner && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center animate-bounce">
                        <div className="px-2 py-0.5 rounded-full bg-amber-400 border border-white text-slate-950 text-[9px] font-black shadow flex items-center gap-0.5">
                          <Trophy className="w-3 h-3 text-amber-950" />
                          <span>{t.win}</span>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* BETTING BOX (Bottom of column) */}
                  <button
                    onClick={() => handleSpotClick(spotCfg.id)}
                    disabled={table.phase !== 'COUNTDOWN'}
                    className={`w-full rounded-xl sm:rounded-2xl border border-amber-800/30 bg-[#fde9cb] shadow-sm overflow-hidden text-left transition-all ${
                      table.phase === 'COUNTDOWN'
                        ? 'hover:border-amber-600 hover:shadow-md active:scale-98 cursor-pointer'
                        : ''
                    } ${isSpotWinner ? 'ring-2 ring-amber-500 bg-amber-100' : ''}`}
                  >
                    {/* Header Tab with 'A', 'B', or 'C' */}
                    <div className="w-full bg-gradient-to-r from-[#e7a57a] via-[#e29363] to-[#e7a57a] py-0.5 px-2 text-center border-b border-amber-800/20">
                      <span className="font-bold text-xs sm:text-sm text-white drop-shadow">
                        {spotCfg.name}
                      </span>
                    </div>

                    {/* Pot & My Rows */}
                    <div className="p-1.5 sm:p-2 flex flex-col gap-0.5 text-[10px] sm:text-xs font-semibold text-amber-950">
                      <div className="flex justify-between items-center">
                        <span className="text-amber-800">{t.pot}:</span>
                        <span className="font-mono font-bold">{spot?.pot || 0}</span>
                      </div>
                      <div className="w-full h-[1px] bg-amber-800/15" />
                      <div className="flex justify-between items-center">
                        <span className="text-amber-800">{t.my}:</span>
                        <span
                          className={`font-mono font-bold ${
                            myBet > 0 ? 'text-emerald-700' : 'text-amber-950'
                          }`}
                        >
                          {myBet}
                        </span>
                      </div>
                    </div>

                    {/* Hand Rank Reveal Ribbon */}
                    {isRevealed && spot?.evaluation && (
                      <div className="w-full py-0.5 bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black text-center truncate px-1">
                        {getRankDisplayName(spot.evaluation.rankName)}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Announcement Sub-Banner */}
        {table.phase !== 'COUNTDOWN' && (
          <div className="w-full my-1 flex items-center justify-center">
            <div className="px-4 py-1 rounded-full bg-slate-950/80 border border-amber-400 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {table.phase === 'DEALING' && t.dealingCards}
                {table.phase === 'SHOWDOWN' && `${t.winnerChair} ${table.winningSpot}!`}
                {table.phase === 'RESULTS' && `${t.nextRoundIn} ${table.timerRemaining}${t.secondsShort}`}
              </span>
            </div>
          </div>
        )}

        {/* Bottom Bar: Coins Balance, Top-up, Chips, History (Exact Match) */}
        <div className="w-full mt-2 pt-2 border-t border-amber-700/20 flex items-center justify-between gap-1 sm:gap-2">
          {/* Left: Star Coin Balance & Top-up */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-amber-950/20 border border-amber-600/30">
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-sm">
                <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-slate-950" />
              </div>
              <span className="font-mono font-black text-xs sm:text-sm md:text-base text-amber-900">
                {userBalance.toLocaleString()}
              </span>
            </div>

            {/* Top-up button */}
            <button
              id="btn-top-up"
              onClick={onOpenTopUp}
              className="text-amber-800 hover:text-amber-950 font-black text-xs sm:text-sm flex items-center transition-colors active:scale-95"
            >
              <span>{t.topUp}</span>
              <span className="text-[10px] ml-0.5">&gt;</span>
            </button>
          </div>

          {/* Center: The 4 Chips (100, 1000, 10k, 100k) */}
          <div className="flex items-center justify-center">
            <CasinoChipsBar
              chips={table.availableChips}
              selectedChip={selectedChip}
              onSelectChip={onSelectChip}
              disabled={table.phase !== 'COUNTDOWN'}
            />
          </div>

          {/* Right: Golden History Clock Button */}
          <button
            id="btn-game-history"
            onClick={onOpenHistory}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 border-2 border-white shadow-md text-amber-950 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title={t.gameHistory}
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
