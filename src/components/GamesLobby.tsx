import React, { useState } from 'react';
import { 
  Crown, 
  Sparkles, 
  Play, 
  Flame, 
  Search, 
  Coins, 
  Users, 
  Shield, 
  Volume2, 
  VolumeX, 
  LogIn, 
  LogOut, 
  Layers, 
  Dices, 
  Tv, 
  Award,
  Clock,
  ArrowRight,
  Info,
  History,
  BookOpen,
  Trophy,
  CheckCircle2,
  Wallet,
  Home,
  Gamepad2,
  ChevronRight,
  Globe
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { UserProfile } from '../types/game';

interface GameItem {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'cards' | 'table' | 'live' | 'vip';
  categoryLabelAr: string;
  categoryLabelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  minBet: number;
  maxBet: number;
  activePlayers: number;
  isLive: boolean;
  badge?: string;
  accentColor: string;
  bgGradient: string;
  thumbnailIcon: string;
}

interface GamesLobbyProps {
  user: UserProfile | null;
  userBalance: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
  onOpenRecharge: () => void;
  onOpenHistory?: () => void;
  onOpenRules?: () => void;
  onOpenRank?: () => void;
  onSelectGame: (gameId: string) => void;
}

const AVAILABLE_GAMES: GameItem[] = [
  {
    id: 'teen-patti',
    titleAr: 'تين باتي رويال (Teen Patti)',
    titleEn: 'Teen Patti Royal 3-Cards',
    category: 'cards',
    categoryLabelAr: 'ألعاب الورق • مباشر',
    categoryLabelEn: 'Card Games • Live',
    descriptionAr: 'لعبة البوكر الهندية الملكية الكلاسيكية بـ 3 بطاقات مع رهان 3 كراسي (A, B, C) وموزع آلي فوري وجوائز متصاعدة.',
    descriptionEn: 'Flagship 3-card Indian poker with 3 betting chairs (A, B, C), live automatic dealer and instant pot showdowns.',
    minBet: 50,
    maxBet: 50000,
    activePlayers: 428,
    isLive: true,
    badge: 'LIVE NOW',
    accentColor: 'border-amber-400/80 shadow-amber-500/20',
    bgGradient: 'from-amber-950/40 via-yellow-950/20 to-slate-900',
    thumbnailIcon: '👑',
  },
  {
    id: 'roulette-royale',
    titleAr: 'روليت الملوك 3D (Roulette)',
    titleEn: 'Roulette Royale 3D',
    category: 'table',
    categoryLabelAr: 'ألعاب الطاولة',
    categoryLabelEn: 'Table Games',
    descriptionAr: 'عجلة الروليت الأوروبية الكلاسيكية، رهان الأرقام المباشرة، الألوان (أحمر/أسود)، الفردي والزوجي مع فيزياء دوران واقعية.',
    descriptionEn: 'European classic roulette wheel with inside/outside bets, red/black splits, and realistic 3D ball physics.',
    minBet: 100,
    maxBet: 100000,
    activePlayers: 312,
    isLive: false,
    badge: 'COMING SOON',
    accentColor: 'border-rose-500/40 shadow-rose-500/10',
    bgGradient: 'from-rose-950/40 via-red-950/20 to-slate-900',
    thumbnailIcon: '🎡',
  },
  {
    id: 'andar-bahar',
    titleAr: 'أندار باهار جولد (Andar Bahar)',
    titleEn: 'Andar Bahar VIP Gold',
    category: 'cards',
    categoryLabelAr: 'ألعاب الورق',
    categoryLabelEn: 'Card Games',
    descriptionAr: 'لعبة الحظ والحدس الأسرع، خمن أين سيتطابق كرت الجوكر الملكي، في خانة أندار (الداخل) أم باهار (الخارج) بأرباح مضاعفة.',
    descriptionEn: 'The traditional matching card showdown. Predict whether the matching card lands on Andar or Bahar for instant multipliers.',
    minBet: 50,
    maxBet: 25000,
    activePlayers: 289,
    isLive: false,
    badge: 'COMING SOON',
    accentColor: 'border-emerald-500/40 shadow-emerald-500/10',
    bgGradient: 'from-emerald-950/40 via-teal-950/20 to-slate-900',
    thumbnailIcon: '🎴',
  },
  {
    id: 'dragon-tiger',
    titleAr: 'دراجون ضد تايجر (Dragon vs Tiger)',
    titleEn: 'Dragon vs Tiger Speed',
    category: 'live',
    categoryLabelAr: 'كازينو مباشر',
    categoryLabelEn: 'Live Casino',
    descriptionAr: 'مواجهة الكرتين الحاسمة في 15 ثانية، التنين ضد النمر مع خيار رهان التعادل الملكي Tie بنسبة ربح 8:1.',
    descriptionEn: 'High-speed 2-card battle. Bet on Dragon, Tiger, or Suited Tie with lucrative 8:1 payout tables.',
    minBet: 50,
    maxBet: 50000,
    activePlayers: 195,
    isLive: false,
    badge: 'COMING SOON',
    accentColor: 'border-orange-500/40 shadow-orange-500/10',
    bgGradient: 'from-orange-950/40 via-amber-950/20 to-slate-900',
    thumbnailIcon: '🐉',
  },
  {
    id: 'baccarat-vip',
    titleAr: 'باكارات الملوك (Baccarat Squeeze)',
    titleEn: 'Baccarat Squeeze VIP',
    category: 'vip',
    categoryLabelAr: 'غرف كبار الشخصيات',
    categoryLabelEn: 'VIP High Roller',
    descriptionAr: 'لعبة الأثرياء الكلاسيكية، لاعب ضد البنكر للوصول إلى مجموع 9 الساحر مع ميزة كشف البطاقات البطيء (Card Squeeze).',
    descriptionEn: 'High-stakes VIP tables. Player vs Banker with standard 9-point rule and authentic Macau-style card squeeze mechanics.',
    minBet: 500,
    maxBet: 250000,
    activePlayers: 140,
    isLive: false,
    badge: 'VIP ROOM',
    accentColor: 'border-purple-500/40 shadow-purple-500/10',
    bgGradient: 'from-purple-950/40 via-indigo-950/20 to-slate-900',
    thumbnailIcon: '💎',
  },
  {
    id: 'blackjack-21',
    titleAr: 'بلاك جاك 21 الملكي (Blackjack)',
    titleEn: 'Blackjack Royal 21',
    category: 'cards',
    categoryLabelAr: 'ألعاب الورق',
    categoryLabelEn: 'Card Games',
    descriptionAr: 'تحدي الرقم 21 الشهير، اهزم يد الموزع واطلب بطاقة أو توقف أو ضاعف رهانك أو قسّم الأزواج مع ميزة التأمين.',
    descriptionEn: 'Beat the dealer to 21 without going bust. Features split hands, double down, and dealer stands on soft 17.',
    minBet: 100,
    maxBet: 75000,
    activePlayers: 220,
    isLive: false,
    badge: 'COMING SOON',
    accentColor: 'border-cyan-500/40 shadow-cyan-500/10',
    bgGradient: 'from-blue-950/40 via-cyan-950/20 to-slate-900',
    thumbnailIcon: '♠️',
  },
  {
    id: 'texas-holdem',
    titleAr: 'تكساس هولديم بوكر (Texas Hold\'em)',
    titleEn: 'Texas Hold\'em Poker VIP',
    category: 'vip',
    categoryLabelAr: 'غرف كبار الشخصيات',
    categoryLabelEn: 'VIP High Roller',
    descriptionAr: 'بطولات بوكر كبار الشخصيات، جولتان سريتان و5 بطاقات مجتمعية (الفلوب، التيرن، الريفر) مع جوائز كبرى للفل هاوس والرويال فلاش.',
    descriptionEn: 'Multi-table poker tournaments with community cards, full house and royal flush progressive jackpots.',
    minBet: 250,
    maxBet: 200000,
    activePlayers: 175,
    isLive: false,
    badge: 'VIP ROOM',
    accentColor: 'border-amber-500/40 shadow-amber-500/10',
    bgGradient: 'from-yellow-950/40 via-amber-950/20 to-slate-900',
    thumbnailIcon: '🃏',
  }
];

export const GamesLobby: React.FC<GamesLobbyProps> = ({
  user,
  userBalance,
  isSoundEnabled,
  onToggleSound,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  onOpenRecharge,
  onOpenHistory,
  onOpenRules,
  onOpenRank,
  onSelectGame,
}) => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cards' | 'table' | 'live' | 'vip'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [devNotice, setDevNotice] = useState<string | null>(null);

  const filteredGames = AVAILABLE_GAMES.filter((game) => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      game.titleAr.toLowerCase().includes(q) || 
      game.titleEn.toLowerCase().includes(q) ||
      game.descriptionAr.toLowerCase().includes(q) ||
      game.descriptionEn.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleGameClick = (game: GameItem) => {
    if (game.id === 'teen-patti') {
      onSelectGame('teen-patti');
    } else {
      setDevNotice(language === 'ar' 
        ? `لعبة "${game.titleAr}" قيد الترخيص والتجهيز وستنطلق قريباً جداً في التحديث القادم! يمكنك الاستمتاع الآن بلعبة تين باتي رويال المتاحة فورياً.`
        : `"${game.titleEn}" is in final licensing and will launch in the next update! Enjoy our live Teen Patti Royal table now.`
      );
      setTimeout(() => setDevNotice(null), 5000);
    }
  };

  return (
    <div 
      className="w-full min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 pb-20 sm:pb-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* 1. TOP STICKY MOBILE & DESKTOP HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#0b0f19]/95 backdrop-blur-xl border-b border-amber-500/20 px-3 sm:px-6 py-2.5 shadow-xl transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-0.5 shadow-[0_0_15px_rgba(245,158,11,0.35)] flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 drop-shadow" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif font-black text-sm sm:text-lg md:text-xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 tracking-wide leading-tight">
                  ROYAL CASINO
                </h1>
                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  VIP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden xs:block font-medium">
                {language === 'ar' ? 'صالة الألعاب الملكية الكبرى' : 'Grand Royal Gaming Lounge'}
              </p>
            </div>
          </div>

          {/* Right Header Controls (Compact for mobile, spacious for desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Live Balance Chip & Fast Recharge */}
            <div 
              id="header-balance-chip"
              className="flex items-center bg-slate-900/90 border border-amber-400/50 rounded-full pl-2 pr-1 sm:px-3 py-1 shadow-[0_2px_10px_rgba(245,158,11,0.15)] group"
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 mr-1 rtl:mr-0 rtl:ml-1 animate-pulse" />
              <span className="font-black text-xs sm:text-sm text-amber-300 font-mono tracking-tight mr-1.5 rtl:mr-0 rtl:ml-1.5">
                {userBalance.toLocaleString()}
              </span>
              <button
                id="btn-lobby-recharge"
                onClick={onOpenRecharge}
                className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-[10px] sm:text-xs shadow-sm transition-transform active:scale-90 cursor-pointer flex items-center gap-0.5"
                title={t.topUp}
              >
                <span>+</span>
                <span className="hidden xs:inline">{t.topUp}</span>
              </button>
            </div>

            {/* Language Switcher */}
            <button
              id="btn-lobby-lang"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-2 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="تغيير اللغة / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              id="btn-lobby-sound"
              onClick={onToggleSound}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors active:scale-95 cursor-pointer"
              title={isSoundEnabled ? t.soundOn : t.soundOff}
            >
              {isSoundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              )}
            </button>

            {/* Admin Dashboard Pill (Exclusively for Admin) */}
            {user?.role === 'admin' && (
              <button
                id="btn-lobby-admin"
                onClick={onOpenAdmin}
                className="px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1 border border-yellow-300 active:scale-95 cursor-pointer"
                title={t.admin}
              >
                <Shield className="w-3.5 h-3.5 fill-slate-950" />
                <span className="hidden sm:inline">{t.admin}</span>
              </button>
            )}

            {/* Auth / Profile Avatar */}
            {user ? (
              <div className="flex items-center gap-1">
                <div 
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs"
                  title={user.email}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono font-bold text-amber-200">
                    {user.customId || `ROYAL-${user.userId.slice(-6).toUpperCase()}`}
                  </span>
                </div>
                <button
                  id="btn-lobby-logout"
                  onClick={onLogout}
                  className="p-1.5 sm:p-2 rounded-xl bg-slate-900/80 hover:bg-red-950/60 border border-slate-700/80 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-colors active:scale-95 cursor-pointer"
                  title={t.logout}
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-lobby-login"
                onClick={onOpenAuth}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t.loginVip}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. DEV NOTIFICATION ALERT */}
      {devNotice && (
        <div className="sticky top-14 z-50 w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 fill-slate-950 text-amber-400" />
              <span>{devNotice}</span>
            </div>
            <button
              onClick={() => onSelectGame('teen-patti')}
              className="px-3 py-1 rounded-lg bg-slate-950 text-amber-300 hover:bg-slate-900 text-xs font-black shrink-0 transition-transform active:scale-95 cursor-pointer"
            >
              {language === 'ar' ? 'العب تين باتي الآن 👑' : 'Play Teen Patti Now 👑'}
            </button>
          </div>
        </div>
      )}

      {/* 3. HERO SHOWCASE & PROGRESSIVE JACKPOT (EYE-SAFE LUXURY DESIGN) */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-[#0e1422] via-[#090d16] to-[#080b11] py-6 sm:py-10 border-b border-amber-500/10">
        <div className="absolute inset-0 bg-radial-vignette opacity-20 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          
          {/* JackPot Ticker */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-950/80 via-yellow-950/60 to-amber-950/80 border border-amber-400/50 text-amber-200 font-mono font-bold text-xs sm:text-sm mb-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-amber-300 tracking-wide">{t.megaJackpot}:</span>
            <span className="text-yellow-400 font-black tracking-wider text-sm sm:text-base">$1,458,920 🪙</span>
          </div>

          <h2 className="text-xl sm:text-3xl md:text-4xl font-black font-serif text-white tracking-tight leading-snug max-w-3xl">
            {language === 'ar' ? (
              <span>كازينو الملوك الفاخر • متعة اللعب المباشر السحابي</span>
            ) : (
              <span>Grand Royal Casino • Real-time Cloud Multiplayer</span>
            )}
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            {language === 'ar'
              ? 'صالة ألعاب متوافقة مع جميع أجهزة الآيفون والأندرويد بتصميم مريح للعين ونظام رصيد موحد.'
              : 'Seamless gaming optimized for mobile, iOS and Android with eye-friendly dark luxury atmosphere.'}
          </p>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 sm:gap-4 mt-4 flex-wrap justify-center text-[11px] sm:text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span><strong>1,280+</strong> {t.activePlayers}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
              <Tv className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ar' ? 'طاولات حية 24/7' : '24/7 Live Tables'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.fairGaming}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTAINER: FEATURED BANNER + CATEGORIES + GAME CARDS */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 w-full py-5 space-y-6">
        
        {/* FEATURED GAME SPOTLIGHT CARD (TEEN PATTI ROYAL) */}
        <div 
          onClick={() => onSelectGame('teen-patti')}
          className="relative w-full rounded-3xl bg-gradient-to-r from-amber-950/60 via-yellow-950/40 to-slate-900/90 border-2 border-amber-400/80 p-4 sm:p-6 shadow-[0_10px_35px_rgba(245,158,11,0.25)] hover:border-amber-300 transition-all cursor-pointer group overflow-hidden"
        >
          {/* Ambient Glow Background */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left/Right Game Info */}
            <div className="flex items-center gap-3.5 sm:gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-slate-950 flex items-center justify-center text-3xl shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                👑
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{t.liveNow}</span>
                  </span>
                  <span className="text-[11px] font-bold text-amber-300/80">
                    {t.threeSeatsLive} (A, B, C)
                  </span>
                </div>

                <h3 className="font-serif font-black text-lg sm:text-2xl text-white group-hover:text-amber-300 transition-colors">
                  {language === 'ar' ? 'تين باتي رويال • طاولات الملوك الحية' : 'Teen Patti Royal • Live 3-Card Table'}
                </h3>
                
                <p className="text-xs text-slate-300 max-w-xl line-clamp-2">
                  {language === 'ar' 
                    ? 'اللعبة الملكية الأكثر إثارة الآن، راهن على الكراسي A أو B أو C واستمتع بالموزع الآلي السحابي الفوري.'
                    : 'The most popular Indian 3-card poker table. Bet on Chairs A, B, or C with synchronized live cloud dealer.'}
                </p>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t border-amber-500/20 md:border-none">
              <div className="flex flex-col text-left md:text-right text-[11px] font-mono text-amber-200">
                <span className="text-slate-400">{t.minMaxStake}:</span>
                <strong className="text-amber-400 text-xs sm:text-sm">50 - 50,000 🪙</strong>
              </div>

              <button
                id="btn-featured-play-now"
                className="px-5 sm:px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.enterTable}</span>
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* 5. QUICK NAVIGATION & MODAL LAUNCHERS (RULES, RANK, HISTORY, TOPUP) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {onOpenRecharge && (
            <button
              onClick={onOpenRecharge}
              className="p-3 rounded-2xl bg-[#0e1320] hover:bg-[#131b2e] border border-amber-500/20 hover:border-amber-400/40 text-slate-200 flex items-center gap-2.5 transition-all active:scale-95 text-left rtl:text-right shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block font-bold text-xs text-white truncate">{t.topUp}</span>
                <span className="block text-[10px] text-slate-400 truncate">{t.storeSubtitle}</span>
              </div>
            </button>
          )}

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="p-3 rounded-2xl bg-[#0e1320] hover:bg-[#131b2e] border border-amber-500/20 hover:border-amber-400/40 text-slate-200 flex items-center gap-2.5 transition-all active:scale-95 text-left rtl:text-right shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block font-bold text-xs text-white truncate">{t.gameHistory}</span>
                <span className="block text-[10px] text-slate-400 truncate">{language === 'ar' ? 'نتائج الجولات' : 'Round Logs'}</span>
              </div>
            </button>
          )}

          {onOpenRules && (
            <button
              onClick={onOpenRules}
              className="p-3 rounded-2xl bg-[#0e1320] hover:bg-[#131b2e] border border-amber-500/20 hover:border-amber-400/40 text-slate-200 flex items-center gap-2.5 transition-all active:scale-95 text-left rtl:text-right shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block font-bold text-xs text-white truncate">{t.rulesTab}</span>
                <span className="block text-[10px] text-slate-400 truncate">{language === 'ar' ? 'ترتيب الأوراق' : 'Hand Rankings'}</span>
              </div>
            </button>
          )}

          {onOpenRank && (
            <button
              onClick={onOpenRank}
              className="p-3 rounded-2xl bg-[#0e1320] hover:bg-[#131b2e] border border-amber-500/20 hover:border-amber-400/40 text-slate-200 flex items-center gap-2.5 transition-all active:scale-95 text-left rtl:text-right shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="block font-bold text-xs text-white truncate">{t.rankTab}</span>
                <span className="block text-[10px] text-slate-400 truncate">{t.topWinner}</span>
              </div>
            </button>
          )}
        </div>

        {/* 6. CATEGORY FILTER TABS & INSTANT SEARCH */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          
          {/* Horizontal Scroll Category Pills (Mobile Friendly) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            {[
              { id: 'all', label: t.allGames, icon: Layers },
              { id: 'cards', label: t.cardGames, icon: Award },
              { id: 'table', label: t.tableGames, icon: Dices },
              { id: 'live', label: t.liveCasino, icon: Tv },
              { id: 'vip', label: t.vipRooms, icon: Crown },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md scale-105 font-black'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-64">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
            <input
              type="text"
              placeholder={t.searchGames}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 shadow-inner`}
            />
          </div>
        </div>

        {/* 7. GAMES CATALOG CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredGames.map((game) => {
            const isFlagship = game.id === 'teen-patti';

            return (
              <div
                key={game.id}
                onClick={() => handleGameClick(game)}
                className={`group relative rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isFlagship
                    ? 'border-amber-400/80 bg-gradient-to-b from-amber-950/40 via-[#0d121f] to-[#0a0e17] shadow-[0_8px_25px_rgba(245,158,11,0.2)] hover:border-amber-300 hover:scale-[1.02]'
                    : 'border-slate-800/90 bg-[#0d121f]/90 hover:border-slate-700 hover:bg-[#111728] hover:scale-[1.01]'
                }`}
              >
                {/* Top Section */}
                <div className="p-4 sm:p-5 pb-3">
                  
                  {/* Category & Status */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400">
                      {language === 'ar' ? game.categoryLabelAr : game.categoryLabelEn}
                    </span>
                    
                    {game.isLive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>{t.liveNow}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold">
                        {game.badge || t.comingSoon}
                      </span>
                    )}
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center text-2xl shadow-md shrink-0 group-hover:scale-110 transition-transform">
                      {game.thumbnailIcon}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors">
                        {language === 'ar' ? game.titleAr : game.titleEn}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {language === 'ar' ? game.descriptionAr : game.descriptionEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Section: Stake & Action */}
                <div className="p-4 pt-3 border-t border-slate-800/70 bg-black/20 flex items-center justify-between gap-2">
                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                    <span className="text-slate-500">{t.minMaxStake}: </span>
                    <strong className="text-amber-300">{game.minBet.toLocaleString()} - {game.maxBet.toLocaleString()}</strong>
                  </div>

                  {isFlagship ? (
                    <button
                      id={`btn-play-${game.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t.enterTable}</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-400 text-[11px] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{t.comingSoon}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredGames.length === 0 && (
          <div className="py-16 text-center text-slate-400">
            <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold">{language === 'ar' ? 'لا توجد ألعاب تطابق بحثك' : 'No games found'}</p>
          </div>
        )}
      </main>

      {/* 8. DESKTOP FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#090d16] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-400">ROYAL CASINO MULTIPLAYER</span>
          </div>
          <p className="text-[11px]">
            {language === 'ar' ? 'منصة الألعاب الملكية • متوافقة مع الهواتف الذكية والأجهزة اللوحية' : 'Royal Gaming Platform • Full Android & iPhone Support'}
          </p>
        </div>
      </footer>

      {/* 9. MOBILE BOTTOM APP BAR (NATIVE IPHONE & ANDROID EXPERIENCE) */}
      <nav 
        id="mobile-bottom-nav"
        className="fixed bottom-0 inset-x-0 z-50 sm:hidden bg-[#0b0f19]/95 backdrop-blur-xl border-t border-amber-500/25 px-2 py-1.5 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] flex items-center justify-around"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Home */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 text-amber-400 hover:text-amber-300 py-1 px-2 active:scale-95 transition-transform cursor-pointer"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t.bottomNavHome}</span>
        </button>

        {/* Store / Recharge */}
        <button
          onClick={onOpenRecharge}
          className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-amber-300 py-1 px-2 active:scale-95 transition-transform cursor-pointer"
        >
          <Coins className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-bold">{t.bottomNavStore}</span>
        </button>

        {/* Center Floating "Play Teen Patti" Button */}
        <div className="relative -top-3">
          <button
            onClick={() => onSelectGame('teen-patti')}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center text-slate-950 font-black active:scale-90 transition-transform cursor-pointer"
            title={t.enterTable}
          >
            <Play className="w-5 h-5 fill-slate-950 ml-0.5 rtl:ml-0 rtl:mr-0.5" />
          </button>
          <span className="block text-[9px] font-black text-amber-300 text-center mt-0.5 whitespace-nowrap">
            {t.bottomNavPlay}
          </span>
        </div>

        {/* History */}
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-amber-300 py-1 px-2 active:scale-95 transition-transform cursor-pointer"
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-bold">{t.bottomNavHistory}</span>
          </button>
        )}

        {/* Rules or Admin */}
        {user?.role === 'admin' ? (
          <button
            onClick={onOpenAdmin}
            className="flex flex-col items-center gap-0.5 text-yellow-400 hover:text-yellow-300 py-1 px-2 active:scale-95 transition-transform cursor-pointer"
          >
            <Shield className="w-5 h-5 fill-yellow-400 text-slate-950" />
            <span className="text-[10px] font-bold">{t.bottomNavAdmin}</span>
          </button>
        ) : (
          <button
            onClick={onOpenRules}
            className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-amber-300 py-1 px-2 active:scale-95 transition-transform cursor-pointer"
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-bold">{t.rulesTab}</span>
          </button>
        )}
      </nav>
    </div>
  );
};
