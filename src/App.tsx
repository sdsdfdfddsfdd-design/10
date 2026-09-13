import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GameHistoryEntry, SpotId, TableState, UserProfile } from './types/game';
import { TeenPattiTable } from './components/TeenPattiTable';
import { GamesLobby } from './components/GamesLobby';
import { GameHistoryModal } from './components/GameHistoryModal';
import { RechargeModal } from './components/RechargeModal';
import { AdminDashboard } from './components/AdminDashboard';
import { RulesModal } from './components/RulesModal';
import { RankModal } from './components/RankModal';
import { AuthModal } from './components/AuthModal';
import { HappyCakeGame } from './components/HappyCakeGame';
import { LuckySevenGame } from './components/LuckySevenGame';
import { DragonTigerGame } from './components/DragonTigerGame';
import { RocketCrashGame } from './components/RocketCrashGame';
import { HorseRacingGame } from './components/HorseRacingGame';
import { MinesGame } from './components/MinesGame';
import { sound } from './lib/audio';
import { GamingAppBackground } from './components/GamingAppBackground';
import { WithdrawModal } from './components/WithdrawModal';
import { ChatWidget } from './components/ChatWidget';
import { 
  Volume2, 
  VolumeX, 
  Shield, 
  RefreshCw, 
  Crown, 
  LogIn, 
  LogOut, 
  Sparkles,
  User as UserIcon,
  Coins,
  Globe,
  MessageSquare
} from 'lucide-react';
import jokerBg from './assets/images/joker_casino_bg_1789250446471.jpg';
import { db, auth, onAuthStateChanged, logoutUser, getUserProfileFromFirestore } from './lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { useLanguage } from './lib/i18n';

const DEFAULT_USER_ID_KEY = 'royal_tp_user_id';
const DEFAULT_USER_NAME_KEY = 'royal_tp_user_name';

export default function App() {
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [table, setTable] = useState<TableState | null>(null);
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [currentView, setCurrentView] = useState<'lobby' | 'game' | 'happy-cake' | 'lucky-7' | 'dragon-tiger' | 'rocket-crash' | 'horse-racing' | 'mines'>('lobby');

  // Odds & Win/Loss rates config
  const [oddsConfig, setOddsConfig] = useState<{
    globalWinRate: number;
    gameWinRates: Record<string, number>;
    houseMode: string;
  }>({
    globalWinRate: 40,
    gameWinRates: {
      global: 40,
      teenPatti: 40,
      rocketCrash: 42,
      mines: 45,
      horseRacing: 38,
      happyCake: 40,
      luckySeven: 44,
      dragonTiger: 45,
    },
    houseMode: 'casino_standard',
  });

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isAlertRecharge, setIsAlertRecharge] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isRankOpen, setIsRankOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.uid && firebaseUser.uid.trim()) {
        const uid = firebaseUser.uid.trim();
        const profile = await getUserProfileFromFirestore(uid);
        if (profile) {
          const validId = (profile.userId && profile.userId.trim()) || uid;
          setCurrentUserProfile(profile);
          setUserId(validId);
          setUserName(profile.displayName || 'VIP Player');
          if (typeof profile.balance === 'number') {
            setBalance(profile.balance);
          }
        } else {
          const isAdminEmail = firebaseUser.email === 'sdsdfdfddsfdd@gmail.com' || (firebaseUser.email && firebaseUser.email.toLowerCase().includes('admin'));
          const fallbackProfile: UserProfile = {
            userId: uid,
            customId: `ROYAL-${Math.floor(100000 + Math.random() * 900000)}`,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'VIP Player'),
            role: isAdminEmail ? 'admin' : 'player',
            balance: 0,
          };
          setCurrentUserProfile(fallbackProfile);
          setUserId(uid);
          setUserName(fallbackProfile.displayName);
          setBalance(0);
        }
      } else {
        setCurrentUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to user's balance changes in real-time from Firestore
  useEffect(() => {
    if (!userId || typeof userId !== 'string' || !userId.trim()) return;
    const cleanId = userId.trim();

    let unsubscribe: (() => void) | undefined;
    try {
      const userDocRef = doc(db, 'users', cleanId);
      unsubscribe = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.balance === 'number') {
            setBalance(data.balance);
          }
          if (data.customId && (!currentUserProfile || currentUserProfile.customId !== data.customId)) {
            setCurrentUserProfile(prev => prev ? { ...prev, ...data } as UserProfile : data as UserProfile);
          }
        }
      }, (err) => {
        console.warn('Firestore user listener notice:', err);
      });
    } catch (e) {
      console.warn('Could not establish user firestore listener:', e);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUserProfile(null);
    showToast(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/game/history', {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && Array.isArray(data.history)) {
            setHistory(data.history);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch history:', err);
    }
  };

  const fetchBalance = async () => {
    if (!userId || typeof userId !== 'string' || !userId.trim()) return;
    try {
      const res = await fetch(`/api/user/${encodeURIComponent(userId.trim())}/balance`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (typeof data.balance === 'number') {
            setBalance(data.balance);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch balance:', err);
    }
  };

  const connectWebSocket = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {
        // ignore
      }
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        const validId = userId && typeof userId === 'string' && userId.trim() ? userId.trim() : 'usr_player';
        ws.send(
          JSON.stringify({
            type: 'JOIN_TABLE',
            tableId: 'table-main',
            player: {
              id: validId,
              name: userName || 'VIP Player',
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'TABLE_UPDATE') {
            setTable(msg.table);
            if (msg.balance !== undefined) {
              setBalance(msg.balance);
            }
            if (msg.table?.availableChips?.length > 0) {
              if (!msg.table.availableChips.includes(selectedChip)) {
                setSelectedChip(msg.table.availableChips[0]);
              }
            }
          } else if (msg.type === 'BET_RESULT') {
            if (!msg.success) {
              showToast(msg.message);
              if (
                msg.message.includes('Insufficient coin') ||
                msg.message.includes('recharge')
              ) {
                setIsAlertRecharge(true);
                setIsRechargeOpen(true);
              }
            }
            if (msg.balance !== undefined) {
              setBalance(msg.balance);
            }
          } else if (msg.type === 'BALANCE_UPDATED') {
            setBalance(msg.balance);
          }
        } catch (err) {
          console.error('Error handling WS message', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2500);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      socketRef.current = ws;
    } catch (err) {
      console.error('WebSocket error', err);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    }
  }, [userId, userName, selectedChip]);

  useEffect(() => {
    connectWebSocket();
    fetchBalance();
    fetchHistory();

    // Direct real-time listener to user balance in Firebase Firestore
    let unsubUser: (() => void) | undefined;
    if (userId && typeof userId === 'string' && userId.trim()) {
      const cleanId = userId.trim();
      try {
        const userDocRef = doc(db, 'users', cleanId);
        unsubUser = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              if (typeof data.balance === 'number') {
                setBalance(data.balance);
              }
            }
          },
          () => {
            // Immediately unsubscribe to close gRPC stream when database is offline or not yet created
            if (unsubUser) {
              unsubUser();
              unsubUser = undefined;
            }
          }
        );
      } catch {
        // ignore
      }
    }

    // Direct real-time listener to game rounds history in Firebase Firestore
    let unsubHistory: (() => void) | undefined;
    try {
      const historyCol = collection(db, 'game_history');
      const q = query(historyCol, orderBy('timestamp', 'desc'), limit(30));
      unsubHistory = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GameHistoryEntry));
            setHistory(items);
          }
        },
        () => {
          // Immediately unsubscribe to close gRPC stream on error
          if (unsubHistory) {
            unsubHistory();
            unsubHistory = undefined;
          }
        }
      );
    } catch {
      // ignore
    }

    const historyInterval = setInterval(fetchHistory, 5000);

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(historyInterval);
      if (unsubUser) unsubUser();
      if (unsubHistory) unsubHistory();
    };
  }, [connectWebSocket, userId]);

  const handlePlaceSpotBet = (spot: SpotId, amount: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'PLACE_SPOT_BET',
          tableId: table?.id || 'table-main',
          playerId: userId,
          spot,
          amount,
        })
      );
    }
  };

  const handleRecharge = async (amount: number) => {
    try {
      const res = await fetch(`/api/user/${userId}/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ amount, userName }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (typeof data.balance === 'number') {
            setBalance(data.balance);
            showToast(`+${amount.toLocaleString()} Coins Top-up Success!`);
          }
        }
      }
    } catch (err) {
      console.warn('Recharge failed:', err);
    }
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0a0706] text-amber-100 flex flex-col justify-start items-center overflow-x-hidden font-sans select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-amber-950 border-2 border-amber-400 text-amber-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* VIEW 1: GAMES LOBBY */}
      {currentView === 'lobby' ? (
        <GamesLobby
          user={currentUserProfile}
          userBalance={balance}
          isSoundEnabled={!isMuted}
          onToggleSound={handleToggleSound}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenRecharge={() => {
            setIsAlertRecharge(false);
            setIsRechargeOpen(true);
          }}
          onOpenWithdraw={() => setIsWithdrawOpen(true)}
          onOpenHistory={() => {
            fetchHistory();
            setIsHistoryOpen(true);
          }}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenRank={() => setIsRankOpen(true)}
          onSelectGame={(gameId) => {
            if (gameId === 'teen-patti') {
              setCurrentView('game');
            } else if (gameId === 'happy-cake') {
              setCurrentView('happy-cake');
            } else if (gameId === 'lucky-7') {
              setCurrentView('lucky-7');
            } else if (gameId === 'dragon-tiger') {
              setCurrentView('dragon-tiger');
            } else if (gameId === 'rocket-crash') {
              setCurrentView('rocket-crash');
            } else if (gameId === 'horse-racing') {
              setCurrentView('horse-racing');
            } else if (gameId === 'mines') {
              setCurrentView('mines');
            }
          }}
        />
      ) : currentView === 'rocket-crash' ? (
        <RocketCrashGame
          onBack={() => setCurrentView('lobby')}
          balance={balance}
          userId={userId}
          userName={userName}
          updateBalance={async (amt) => {
            setBalance((prev) => {
              const newBal = Math.max(0, prev + amt);
              fetch('/api/user/sync-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, delta: amt }),
              }).catch(() => {});
              return newBal;
            });
          }}
          language={language}
        />
      ) : currentView === 'horse-racing' ? (
        <HorseRacingGame
          onBack={() => setCurrentView('lobby')}
          balance={balance}
          userId={userId}
          userName={userName}
          updateBalance={async (amt) => {
            setBalance((prev) => {
              const newBal = Math.max(0, prev + amt);
              fetch('/api/user/sync-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, delta: amt }),
              }).catch(() => {});
              return newBal;
            });
          }}
          language={language}
        />
      ) : currentView === 'mines' ? (
        <MinesGame
          onBack={() => setCurrentView('lobby')}
          balance={balance}
          userId={userId}
          userName={userName}
          updateBalance={async (amt) => {
            setBalance((prev) => {
              const newBal = Math.max(0, prev + amt);
              fetch('/api/user/sync-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, delta: amt }),
              }).catch(() => {});
              return newBal;
            });
          }}
          language={language}
        />
      ) : currentView === 'happy-cake' ? (
        <HappyCakeGame 
          onBack={() => setCurrentView('lobby')}
          balance={balance}
          userId={userId}
          userName={userName}
          updateBalance={(amt) => {
            setBalance((prev) => {
              const newBal = Math.max(0, prev + amt);
              fetch('/api/user/sync-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, delta: amt }),
              }).catch(() => {});
              return newBal;
            });
          }}
          language={language}
        />
      ) : currentView === 'lucky-7' ? (
        <LuckySevenGame
          onBack={() => setCurrentView('lobby')}
          balance={balance}
          userId={userId}
          userName={userName}
          updateBalance={async (amt) => {
            setBalance((prev) => {
              const newBal = Math.max(0, prev + amt);
              fetch('/api/user/sync-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, delta: amt }),
              }).catch(() => {});
              return newBal;
            });
          }}
          language={language}
        />
      ) : currentView === 'dragon-tiger' ? (
        <DragonTigerGame
          onBack={() => setCurrentView('lobby')}
          balance={balance}
          userId={userId}
          userName={userName}
          updateBalance={async (amt) => {
            setBalance((prev) => {
              const newBal = Math.max(0, prev + amt);
              fetch('/api/user/sync-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, delta: amt }),
              }).catch(() => {});
              return newBal;
            });
          }}
          language={language}
        />
      ) : (
        /* VIEW 2: ACTIVE GAME TABLE (TEEN PATTI ROYAL) */
        <div className="relative min-h-screen w-full flex flex-col justify-center items-center py-2 px-1">
          {/* Cinematic Joker Casino Background */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <img
              src={jokerBg}
              alt="Cinematic Joker Casino Atmosphere"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-125"
            />
            {/* Cinematic Vignette & Deep Casino Ambience Gradients */}
            <div className="absolute inset-0 bg-radial-vignette from-transparent via-black/40 to-black/85" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </div>

          {/* Floating Header Utilities (VIP Identity, Auth, Sound & Admin buttons) */}
          <header className="relative w-full max-w-lg px-2.5 py-1.5 flex items-center justify-between z-20 gap-2 mb-1" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30 shadow-lg shrink-0">
              {/* Return to Lobby Button */}
              <button
                id="btn-header-lobby"
                onClick={() => setCurrentView('lobby')}
                className="px-2 py-0.5 rounded-full text-xs font-black text-amber-300 hover:text-white bg-gradient-to-r from-amber-600/60 to-amber-700/60 hover:from-amber-600 hover:to-amber-500 border border-amber-400/50 transition-all flex items-center gap-1 cursor-pointer"
                title={t.lobby}
              >
                <span>🏛️</span>
                <span className="font-bold">{t.lobby}</span>
              </button>

              <button
                onClick={handleToggleSound}
                className="p-1 rounded-full text-amber-300 hover:text-amber-100 transition-colors cursor-pointer"
                title={isMuted ? t.soundOff : t.soundOn}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>

              {/* Language Switcher Toggle */}
              <button
                id="btn-language-toggle"
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="px-2 py-0.5 rounded-full text-xs font-bold text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 transition-colors flex items-center gap-1 cursor-pointer"
                title={language === 'ar' ? 'Switch to English' : 'التحويل للغة العربية'}
              >
                <Globe className="w-3 h-3 text-amber-400" />
                <span className="font-mono text-[10px]">{language === 'ar' ? 'EN' : 'عربي'}</span>
              </button>

              <div className="flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500 animate-pulse'
                  }`}
                />
                <span>{isConnected ? t.live : t.connecting}</span>
              </div>
            </div>

            {/* User Status / Login / Admin Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {currentUserProfile ? (
                <>
                  {/* Unique VIP ID Pill */}
                  <div 
                    className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-950/90 to-yellow-950/80 border border-amber-400/60 text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                    title={`${t.emailLabel}: ${currentUserProfile.email || '—'}`}
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-mono text-[11px] text-yellow-300 tracking-wider">
                      {currentUserProfile.customId || `ROYAL-${userId.slice(-6).toUpperCase()}`}
                    </span>
                  </div>

                  {/* Admin Dashboard Button - Strictly restricted to admin role only */}
                  {currentUserProfile.role === 'admin' && (
                    <button
                      id="btn-open-admin-header"
                      onClick={() => setIsAdminOpen(true)}
                      className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black flex items-center gap-1 transition-all shadow-md shadow-amber-500/30 cursor-pointer animate-pulse"
                      title={t.admin}
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                      <span>{t.admin}</span>
                    </button>
                  )}

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    title={t.logout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  {/* Login / Register VIP Button */}
                  <button
                    id="btn-login-vip"
                    onClick={() => setIsAuthOpen(true)}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 fill-slate-950" />
                    <span>{t.loginVip}</span>
                  </button>
                </>
              )}
            </div>
          </header>

          {/* Main Game Screen (Matching user screenshot) */}
          <main className="relative w-full max-w-lg z-10 flex flex-col items-center justify-center p-1 sm:p-2">
            {table ? (
              <TeenPattiTable
                table={table}
                userBalance={balance}
                selectedChip={selectedChip}
                onSelectChip={setSelectedChip}
                onPlaceBet={handlePlaceSpotBet}
                onOpenTopUp={() => {
                  setIsAlertRecharge(false);
                  setIsRechargeOpen(true);
                }}
                onOpenHistory={() => {
                  fetchHistory();
                  setIsHistoryOpen(true);
                }}
                onOpenRules={() => setIsRulesOpen(true)}
                onOpenRank={() => setIsRankOpen(true)}
                onCloseGame={() => setCurrentView('lobby')}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-amber-300 py-20">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <p className="text-sm font-semibold">Loading Teen Patti table...</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(profile) => {
          const validId = profile.userId && profile.userId.trim() ? profile.userId.trim() : ('usr_' + Math.random().toString(36).substring(2, 8));
          setCurrentUserProfile(profile);
          setUserId(validId);
          setUserName(profile.displayName || 'VIP Player');
          if (typeof profile.balance === 'number') {
            setBalance(profile.balance);
          }
          showToast(`مرحباً بك يا ${profile.displayName || 'VIP Player'}! تم تفعيل لوحة التحكم.`);
        }}
      />

      <GameHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
      />

      <RechargeModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onRecharge={handleRecharge}
        isAlertOnly={isAlertRecharge}
      />

      <RankModal
        isOpen={isRankOpen}
        onClose={() => setIsRankOpen(false)}
      />

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        user={currentUserProfile}
        userBalance={balance}
        onBalanceUpdated={(newBal) => setBalance(newBal)}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        tableState={table}
        history={history}
      />

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-slate-950 animate-pulse"></span>
        </button>
      )}

      {/* Real-time Global Chat and 35% Gift Commission Widget */}
      <ChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={currentUserProfile}
        userBalance={balance}
        onBalanceUpdated={(newBal) => setBalance(newBal)}
      />
    </div>
  );
}

