import React, { useEffect, useState } from 'react';
import { AdminConfig, GameHistoryEntry, TableState, TransactionRecord, UserProfile } from '../types/game';
import { 
  Shield, 
  Power, 
  Settings, 
  Users, 
  Coins, 
  Activity, 
  Clock, 
  Trash2, 
  UserMinus, 
  X, 
  RefreshCw, 
  CheckCircle,
  FileText,
  Search,
  Crown,
  PlusCircle,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  tableState: TableState | null;
  history: GameHistoryEntry[];
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  tableState,
  history,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'overview' | 'settings' | 'players' | 'transactions' | 'history'>('users');
  const [config, setConfig] = useState<AdminConfig>({
    isGameEnabled: true,
    defaultChips: [50, 500, 2000, 10000],
    roundCountdownSeconds: 15,
    minBet: 50,
    maxBet: 50000,
    autoFillBots: true,
    defaultPlayerBalance: 15000,
  });
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [chipInputs, setChipInputs] = useState<string>('50, 500, 2000, 10000');
  const [firebaseStatus, setFirebaseStatus] = useState<{ isAvailable: boolean; projectId: string; instructions: string }>({
    isAvailable: true,
    projectId: 'gen-lang-client-0889694545',
    instructions: 'Connected to Cloud Firestore'
  });

  // Users management state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [rechargeInputs, setRechargeInputs] = useState<Record<string, number>>({});
  const [rechargingUserId, setRechargingUserId] = useState<string | null>(null);
  const [rechargeAlert, setRechargeAlert] = useState<{ userId: string; msg: string; type: 'success' | 'error' } | null>(null);

  // Deletion, Reset, and Cleanup state
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserProfile | null>(null);
  const [confirmResetUser, setConfirmResetUser] = useState<UserProfile | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isCleaningServer, setIsCleaningServer] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    clearedHistory: number;
    clearedTransactions: number;
    tablesReset: number;
    activeSockets: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
      fetchUsersList();
    }
  }, [isOpen]);

  const fetchUsersList = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setUsersList(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [res, fbRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/firebase/status').catch(() => null)
      ]);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          setChipInputs(data.config.defaultChips.join(', '));
        }
        if (data.recentTransactions) {
          setTransactions(data.recentTransactions);
        }
      }
      if (fbRes && fbRes.ok) {
        const fbData = await fbRes.json();
        setFirebaseStatus(fbData);
      }
    } catch (err) {
      console.error('Failed to fetch admin overview', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRechargeUser = async (targetUserId: string, customAmount?: number) => {
    const amount = customAmount || rechargeInputs[targetUserId] || 5000;
    if (!amount || amount <= 0) return;
    setRechargingUserId(targetUserId);
    try {
      const res = await fetch('/api/admin/recharge-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, amount, adminName: 'Admin Control' })
      });
      if (res.ok) {
        const data = await res.json();
        setRechargeAlert({ 
          userId: targetUserId, 
          msg: `تم شحن +${amount.toLocaleString()} 🪙 في قاعدة البيانات بنجاح! الرصيد: ${data.newBalance.toLocaleString()}`, 
          type: 'success' 
        });
        setUsersList(prev => prev.map(u => (u.userId === targetUserId || (u as any).id === targetUserId) ? { ...u, balance: data.newBalance } : u));
        setTimeout(() => setRechargeAlert(null), 3500);
      }
    } catch (err) {
      setRechargeAlert({ userId: targetUserId, msg: 'تعذر شحن الرصيد، يرجى المحاولة ثانية', type: 'error' });
      setTimeout(() => setRechargeAlert(null), 3000);
    } finally {
      setRechargingUserId(null);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const parsedChips = chipInputs
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n) && n > 0);

      const updated = {
        ...config,
        defaultChips: parsedChips.length > 0 ? parsedChips : config.defaultChips,
      };

      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updated }),
      });

      if (res.ok) {
        setConfig(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save config', err);
    }
  };

  const handleKickPlayer = async (tableId: string, playerId: string) => {
    try {
      await fetch('/api/admin/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId, playerId }),
      });
      fetchAdminData();
    } catch (err) {
      console.error('Failed to kick player', err);
    }
  };

  const handleResetUserBalance = async (user: UserProfile) => {
    const targetUserId = user.userId || (user as any).id;
    setActionInProgress(targetUserId);
    try {
      const res = await fetch('/api/admin/reset-user-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, userName: user.displayName })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => (u.userId === targetUserId || (u as any).id === targetUserId) ? { ...u, balance: 0 } : u));
        setActionToast({ msg: `${t.balanceResetSuccess} (${user.displayName || targetUserId})`, type: 'success' });
        setTimeout(() => setActionToast(null), 4000);
      } else {
        setActionToast({ msg: 'فشل تصفير الرصيد', type: 'error' });
        setTimeout(() => setActionToast(null), 3000);
      }
    } catch (err) {
      setActionToast({ msg: 'تعذر الاتصال بالسيرفر لتصفير الرصيد', type: 'error' });
      setTimeout(() => setActionToast(null), 3000);
    } finally {
      setActionInProgress(null);
      setConfirmResetUser(null);
    }
  };

  const handleDeleteUserAccount = async (user: UserProfile) => {
    const targetUserId = user.userId || (user as any).id;
    setActionInProgress(targetUserId);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      });
      if (res.ok) {
        setUsersList(prev => prev.filter(u => u.userId !== targetUserId && (u as any).id !== targetUserId));
        setActionToast({ msg: `${t.accountDeleted} (${user.displayName || targetUserId})`, type: 'success' });
        setTimeout(() => setActionToast(null), 4000);
      } else {
        setActionToast({ msg: 'فشل حذف الحساب', type: 'error' });
        setTimeout(() => setActionToast(null), 3000);
      }
    } catch (err) {
      setActionToast({ msg: 'تعذر الاتصال بالسيرفر لحذف الحساب', type: 'error' });
      setTimeout(() => setActionToast(null), 3000);
    } finally {
      setActionInProgress(null);
      setConfirmDeleteUser(null);
    }
  };

  const handleExecuteServerCleanup = async () => {
    setIsCleaningServer(true);
    try {
      const res = await fetch('/api/admin/cleanup-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setCleanupResult({
          clearedHistory: data.clearedHistory || 0,
          clearedTransactions: data.clearedTransactions || 0,
          tablesReset: data.tablesReset || 1,
          activeSockets: data.activeSockets || 0,
        });
        setActionToast({ msg: t.cleanupSuccess, type: 'success' });
        fetchAdminData();
        fetchUsersList();
        setTimeout(() => setActionToast(null), 5000);
      }
    } catch (err) {
      setActionToast({ msg: 'فشل تنظيف السيرفر', type: 'error' });
      setTimeout(() => setActionToast(null), 3000);
    } finally {
      setIsCleaningServer(false);
    }
  };

  const handleToggleUserRole = async (user: UserProfile) => {
    const targetUserId = user.userId || (user as any).id;
    const newRole = user.role === 'admin' ? 'player' : 'admin';
    setActionInProgress(targetUserId);
    try {
      const res = await fetch('/api/admin/toggle-user-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, role: newRole })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => (u.userId === targetUserId || (u as any).id === targetUserId) ? { ...u, role: newRole } : u));
        setActionToast({ msg: `تم تعديل الرتبة إلى ${newRole === 'admin' ? 'مدير 👑' : 'لاعب 🎮'}`, type: 'success' });
        setTimeout(() => setActionToast(null), 3500);
      }
    } catch {
      setActionToast({ msg: 'تعذر تحديث الرتبة', type: 'error' });
      setTimeout(() => setActionToast(null), 3000);
    } finally {
      setActionInProgress(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Admin Control Dashboard</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Live Management
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Full game control: toggle game, table rules, bets, transactions, and players
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="btn-close-admin"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto text-xs" dir="rtl">
          {[
            { id: 'users', label: 'إدارة وشحن المستخدمين (Users & Recharge)', icon: Users },
            { id: 'overview', label: 'نظرة عامة (Overview)', icon: Activity },
            { id: 'settings', label: 'إعدادات اللعبة والرهان', icon: Settings },
            { id: 'players', label: 'اللاعبون النشطون', icon: Users },
            { id: 'transactions', label: 'سجل المعاملات', icon: Coins },
            { id: 'history', label: 'سجل الجولات', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'users') fetchUsersList();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-amber-400 border-t-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB: USERS & RECHARGE */}
          {activeTab === 'users' && (
            <div className="space-y-5" dir="rtl">
              {/* Top Banner: Server Cleanup & Maintenance */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-950/70 to-indigo-950/50 border border-purple-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{t.serverCleanup}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        صيانة السيرفر
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.serverCleanupSubtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    disabled={isCleaningServer}
                    onClick={handleExecuteServerCleanup}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isCleaningServer ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    <span>{t.runCleanup}</span>
                  </button>
                </div>
              </div>

              {/* Cleanup Results Summary (if executed) */}
              {cleanupResult && (
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-slate-200 flex items-center justify-between flex-wrap gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-purple-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{t.cleanupSuccess}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-300 text-[11px] font-mono">
                    <span>{t.clearedHistory} <strong className="text-amber-400">{cleanupResult.clearedHistory}</strong></span>
                    <span>{t.clearedTransactions} <strong className="text-amber-400">{cleanupResult.clearedTransactions}</strong></span>
                    <span>{t.tablesRefreshed} <strong className="text-emerald-400">{cleanupResult.tablesReset}</strong></span>
                  </div>
                </div>
              )}

              {/* Action Toast */}
              {actionToast && (
                <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                  actionToast.type === 'success'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-red-950/80 text-red-300 border-red-500/40'
                }`}>
                  {actionToast.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                  <span>{actionToast.msg}</span>
                </div>
              )}

              {/* Header & Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950/60 to-slate-900 border border-amber-500/30">
                <div>
                  <h3 className="text-base font-bold text-amber-200 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span>إدارة حسابات المستخدمين وشحن الرصيد السحابي</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    البيانات متصلة ومحفوظة في قاعدة بيانات Firestore السحابية فورياً
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300">
                    إجمالي المستخدمين: <span className="font-bold text-amber-400">{usersList.length}</span>
                  </div>
                  <button
                    onClick={fetchUsersList}
                    className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 text-xs font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تحديث</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، البريد الإلكتروني، أو المعرف المميز (مثل: ROYAL-123456)..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* User List Cards */}
              <div className="space-y-3">
                {usersList
                  .filter((u) => {
                    if (!userSearch) return true;
                    const q = userSearch.toLowerCase();
                    return (
                      u.displayName?.toLowerCase().includes(q) ||
                      u.email?.toLowerCase().includes(q) ||
                      u.customId?.toLowerCase().includes(q) ||
                      u.userId?.toLowerCase().includes(q)
                    );
                  })
                  .map((u) => {
                    const uId = u.userId || (u as any).id;
                    const isRecharging = rechargingUserId === uId;
                    const isOperating = actionInProgress === uId;
                    const alert = rechargeAlert?.userId === uId ? rechargeAlert : null;

                    return (
                      <div
                        key={uId}
                        className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/30 transition-all flex flex-col gap-3"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* User Profile Info */}
                          <div className="flex items-start sm:items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
                              {u.displayName ? u.displayName[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-white">
                                  {u.displayName || 'لاعب'}
                                </h4>
                                {/* Unique VIP ID Badge */}
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold text-[11px] flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-400" />
                                  <span>{u.customId || `ROYAL-${uId.slice(-6).toUpperCase()}`}</span>
                                </span>
                                {/* Role Badge */}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  u.role === 'admin' 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {u.role === 'admin' ? '👑 مدير (Admin)' : '🎮 لاعب (Player)'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">{u.email || `${uId}@player.local`}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-400">الرصيد في قاعدة البيانات:</span>
                                <span className="font-black text-amber-400 font-mono text-sm flex items-center gap-1">
                                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                  <span>{(u.balance || 0).toLocaleString()} 🪙</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Recharge Controls */}
                          <div className="flex flex-col sm:items-end gap-2 shrink-0">
                            {/* Quick Recharge Chips */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-slate-400 ml-1">شحن سريع:</span>
                              {[1000, 5000, 10000, 50000].map((amt) => (
                                <button
                                  key={amt}
                                  disabled={isRecharging || isOperating}
                                  onClick={() => handleRechargeUser(uId, amt)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-600/30 border border-slate-700 hover:border-amber-400 text-amber-300 text-xs font-bold transition-all disabled:opacity-50"
                                >
                                  +{amt.toLocaleString()}
                                </button>
                              ))}
                            </div>

                            {/* Custom Recharge Form */}
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                              <input
                                type="number"
                                placeholder="مبلغ مخصص..."
                                value={rechargeInputs[uId] || ''}
                                onChange={(e) => setRechargeInputs({ ...rechargeInputs, [uId]: Number(e.target.value) })}
                                className="w-28 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                              />
                              <button
                                disabled={isRecharging || isOperating}
                                onClick={() => handleRechargeUser(uId)}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                {isRecharging ? (
                                  <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <PlusCircle className="w-3.5 h-3.5" />
                                )}
                                <span>شحن الآن</span>
                              </button>
                            </div>

                            {/* Instant Feedback Alert */}
                            {alert && (
                              <div className={`text-[11px] font-bold mt-1 px-2.5 py-1 rounded-md ${
                                alert.type === 'success' 
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                                  : 'bg-red-950/80 text-red-300 border border-red-500/40'
                              }`}>
                                {alert.msg}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Account Operations Toolbar: Reset Balance, Delete User, Toggle Role */}
                        <div className="pt-2.5 mt-1 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Reset Balance Button */}
                            <button
                              disabled={isOperating}
                              onClick={() => setConfirmResetUser(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="تصفير رصيد المستخدم إلى 0 عملة"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                              <span>{t.resetBalance}</span>
                            </button>

                            {/* Delete User Button */}
                            <button
                              disabled={isOperating}
                              onClick={() => setConfirmDeleteUser(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="حذف هذا الحساب نهائياً من قاعدة البيانات"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              <span>{t.deleteAccount}</span>
                            </button>
                          </div>

                          {/* Toggle Role Button */}
                          <button
                            disabled={isOperating}
                            onClick={() => handleToggleUserRole(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.role === 'admin' ? t.toggleToPlayer : t.toggleToAdmin}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {usersList.length === 0 && (
                  <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs">لا يوجد مستخدمون حالياً. عند تسجيل أي لاعب سيظهر هنا فوراً مع صلاحية المدير وشحن الرصيد.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Status Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Database</span>
                    <span className={`w-2 h-2 rounded-full ${firebaseStatus.isAvailable ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                  </div>
                  <p className={`text-sm font-black font-mono ${firebaseStatus.isAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {firebaseStatus.isAvailable ? 'Firebase Live' : 'Firebase Ready'}
                  </p>
                  <p className="text-[10px] text-slate-400">{firebaseStatus.projectId}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Game Status</span>
                    <Power className={`w-3.5 h-3.5 ${config.isGameEnabled ? 'text-emerald-400' : 'text-rose-400'}`} />
                  </div>
                  <p className={`text-base font-black ${config.isGameEnabled ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {config.isGameEnabled ? 'ONLINE' : 'DISABLED'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Current Round</span>
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <p className="text-base font-black text-white font-mono">
                    #{tableState?.roundNumber || 1} ({tableState?.phase || 'IDLE'})
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Active Pot</span>
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-base font-black text-amber-400 font-mono">
                    {(tableState?.totalPot || 0).toLocaleString()} Coins
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                    <span>Seated Players</span>
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <p className="text-base font-black text-white font-mono">
                    {tableState?.players.filter((p) => p !== null).length || 0} / {tableState?.maxPlayers || 3}
                  </p>
                </div>
              </div>

              {/* Master Game Toggle */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Emergency Game Switch</h4>
                  <p className="text-xs text-slate-400">
                    Enable or disable the game immediately for maintenance or table resets.
                  </p>
                </div>
                <button
                  id="btn-admin-toggle-game"
                  onClick={() => {
                    const next = !config.isGameEnabled;
                    setConfig({ ...config, isGameEnabled: next });
                    fetch('/api/admin/config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ config: { isGameEnabled: next } }),
                    });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                    config.isGameEnabled
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>{config.isGameEnabled ? 'Stop Game' : 'Start Game'}</span>
                </button>
              </div>

              {/* Active Table Live State */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-sm font-black text-white mb-3">Active Table Inspector</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Table Name:</span>
                    <p className="font-bold text-slate-200 mt-0.5">{tableState?.name || 'Main Table'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Phase & Timer:</span>
                    <p className="font-bold text-cyan-400 mt-0.5">
                      {tableState?.phase} ({tableState?.timerRemaining}s left)
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Winning Hand:</span>
                    <p className="font-bold text-amber-400 mt-0.5">
                      {tableState?.winningHand?.rankName || 'Pending showdown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h4 className="text-sm font-black text-white">Bet Values & Chips Configuration</h4>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Available Betting Chips (comma separated values):
                  </label>
                  <input
                    type="text"
                    value={chipInputs}
                    onChange={(e) => setChipInputs(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    placeholder="50, 500, 2000, 10000"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Standard values: 50, 500, 2000, 10000 (shown as 50, 500, 2K, 10K on table)
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Min Bet (Coins):
                    </label>
                    <input
                      type="number"
                      value={config.minBet}
                      onChange={(e) => setConfig({ ...config, minBet: parseInt(e.target.value) || 10 })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Max Bet (Coins):
                    </label>
                    <input
                      type="number"
                      value={config.maxBet}
                      onChange={(e) => setConfig({ ...config, maxBet: parseInt(e.target.value) || 100000 })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Round Countdown Timer (seconds):
                    </label>
                    <input
                      type="number"
                      value={config.roundCountdownSeconds}
                      onChange={(e) => setConfig({ ...config, roundCountdownSeconds: parseInt(e.target.value) || 15 })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Default Player Starting Balance:
                    </label>
                    <input
                      type="number"
                      value={config.defaultPlayerBalance}
                      onChange={(e) => setConfig({ ...config, defaultPlayerBalance: parseInt(e.target.value) || 10000 })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="autoFillBots"
                    checked={config.autoFillBots}
                    onChange={(e) => setConfig({ ...config, autoFillBots: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <label htmlFor="autoFillBots" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Auto-fill vacant seats with Bots (Chef Raj, Sophia Lounge)
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center gap-3">
                  <button
                    id="btn-save-admin-config"
                    onClick={handleSaveConfig}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition-all"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-slate-950" />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLAYERS */}
          {activeTab === 'players' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <h4 className="text-sm font-black text-white mb-3">Seated Players at Table</h4>
                <div className="space-y-2.5">
                  {tableState?.players.map((p, idx) => {
                    if (!p) {
                      return (
                        <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-xs text-slate-500">
                          Seat #{idx + 1}: Empty
                        </div>
                      );
                    }

                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.isBot && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px]">
                                  BOT
                                </span>
                              )}
                              {p.isAutoPlay && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px]">
                                  AUTO
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-amber-400 font-mono">
                              Chips: {p.chips.toLocaleString()} | Bet: {p.currentBet}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleKickPlayer(tableState.id, p.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30 flex items-center gap-1.5"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Kick</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white">Financial Transaction Ledger</h4>
                <span className="text-xs text-slate-400">{transactions.length} records</span>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No financial transactions recorded yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              tx.type === 'WIN'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : tx.type === 'BET'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-bold text-slate-200">{tx.userName}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{tx.description}</p>
                      </div>

                      <div className="text-right font-mono">
                        <p
                          className={`font-bold ${
                            tx.type === 'WIN' || tx.type === 'RECHARGE'
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {tx.type === 'WIN' || tx.type === 'RECHARGE' ? `+${tx.amount}` : `-${tx.amount}`}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="text-sm font-black text-white">Game History Audit</h4>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-200">
                        Round #{h.roundNumber} - Winning Chair: <span className="text-amber-400">Chair {h.winningSpot}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pot: {h.totalPot.toLocaleString()} | Hand: {h.winningHandName}
                      </p>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(h.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset Balance Confirmation Modal */}
        {confirmResetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-5 rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                  <RotateCcw className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t.resetBalance}</h3>
                  <p className="text-xs text-slate-400">تصفير عملات الحساب إلى صفر</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {t.confirmResetBalance}
                <br />
                <span className="font-bold text-amber-400 mt-1 inline-block">
                  المستخدم: {confirmResetUser.displayName} ({confirmResetUser.email})
                </span>
                <br />
                <span className="text-slate-400">الرصيد الحالي: {(confirmResetUser.balance || 0).toLocaleString()} 🪙</span>
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmResetUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  disabled={actionInProgress !== null}
                  onClick={() => handleResetUserBalance(confirmResetUser)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5"
                >
                  {actionInProgress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  <span>تأكيد تصفير الرصيد (0)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation Modal */}
        {confirmDeleteUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md p-5 rounded-2xl bg-slate-900 border border-red-500/40 shadow-2xl space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{t.deleteAccount}</h3>
                  <p className="text-xs text-red-300">حذف الحساب نهائياً من قاعدة البيانات</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                {t.confirmDeleteAccount}
                <br />
                <span className="font-bold text-red-400 mt-1 inline-block">
                  المستخدم: {confirmDeleteUser.displayName} ({confirmDeleteUser.email})
                </span>
                <br />
                <span className="text-slate-400 font-mono text-[11px]">المعرف: {confirmDeleteUser.customId || confirmDeleteUser.userId}</span>
              </p>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmDeleteUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  disabled={actionInProgress !== null}
                  onClick={() => handleDeleteUserAccount(confirmDeleteUser)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all flex items-center gap-1.5"
                >
                  {actionInProgress ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>تأكيد الحذف النهائي</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
