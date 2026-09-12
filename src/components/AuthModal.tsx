import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  Crown, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Coins
} from 'lucide-react';
import { loginWithEmail, registerWithEmail } from '../lib/firebase';
import type { UserProfile } from '../types/game';
import { useLanguage } from '../lib/i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const { t, isRTL, language } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage(language === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 6 خانات' : 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        const { profile } = await registerWithEmail(
          email.trim(),
          password,
          displayName.trim() || email.split('@')[0]
        );
        setSuccessMessage(
          language === 'ar'
            ? `تم إنشاء الحساب بنجاح! تم تعيين معرف الـ VIP: ${profile.customId}`
            : `Account created successfully! VIP ID assigned: ${profile.customId}`
        );
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 1200);
      } else {
        const { profile } = await loginWithEmail(email.trim(), password);
        setSuccessMessage(
          language === 'ar'
            ? `مرحباً بعودتك ${profile.displayName}! تم تسجيل الدخول بنجاح.`
            : `Welcome back ${profile.displayName}! Signed in successfully.`
        );
        setTimeout(() => {
          onAuthSuccess(profile);
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      const errStr = err instanceof Error ? err.message : String(err);
      console.error('Auth submit error:', err);
      if (errStr.includes('email-already-in-use')) {
        setErrorMessage(language === 'ar' ? 'هذا البريد الإلكتروني مسجل بالفعل، يمكنك تسجيل الدخول بدلاً من ذلك.' : 'This email is already in use. Please sign in instead.');
      } else if (errStr.includes('invalid-credential') || errStr.includes('wrong-password') || errStr.includes('user-not-found')) {
        setErrorMessage(language === 'ar' ? 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور.' : 'Invalid credentials. Please verify email and password.');
      } else if (errStr.includes('weak-password')) {
        setErrorMessage(language === 'ar' ? 'كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور أقوى.' : 'Password is too weak. Please choose a stronger password.');
      } else if (errStr.includes('invalid-email')) {
        setErrorMessage(language === 'ar' ? 'صيغة البريد الإلكتروني غير صالحة.' : 'Invalid email format.');
      } else {
        setErrorMessage(language === 'ar' ? 'حدث خطأ أثناء الاتصال: ' + errStr : 'An error occurred: ' + errStr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setEmail(`royal.vip${randomSuffix}@casino.club`);
    setPassword('RoyalVIP777');
    setDisplayName(`VIP Player ${randomSuffix}`);
  };

  return (
    <div 
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div 
        id="auth-modal-card"
        className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-amber-950/90 via-slate-900/95 to-black border-2 border-amber-500/40 p-6 shadow-2xl shadow-amber-500/20 text-white overflow-hidden"
      >
        {/* Glow ambient decoration */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="auth-close-btn"
          onClick={onClose}
          className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-amber-200/80 hover:text-white transition-all`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-300 border-2 border-amber-300 shadow-lg shadow-amber-500/40 mb-3">
            <Crown className="w-7 h-7 text-slate-950 fill-slate-950" />
          </div>
          <h2 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
            Teen Patti Royal Club
          </h2>
          <p className="text-xs text-amber-200/70 mt-1 font-medium">
            {language === 'ar' ? 'نادي الملوك والأمراء • حفظ البيانات السحابي' : 'Royal Players Club • Cloud Sync'}
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-slate-900/90 p-1 mb-5 border border-amber-500/20">
          <button
            type="button"
            id="tab-register-btn"
            onClick={() => { setMode('register'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-amber-200/70 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.registerTab}</span>
          </button>
          <button
            type="button"
            id="tab-login-btn"
            onClick={() => { setMode('login'); setErrorMessage(null); setSuccessMessage(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-amber-200/70 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.loginTab}</span>
          </button>
        </div>

        {/* Highlight Privilege Badge */}
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-100 leading-relaxed">
            <span className="font-bold text-amber-300">{language === 'ar' ? 'ميزة الأعضاء:' : 'Member Privileges:'}</span> {language === 'ar' ? 'يحصل كل حساب جديد على معرف VIP فريد ورصيد ترحيبي مع مزامنة سحابية.' : 'Every account receives a unique VIP ID, welcome balance, and cloud synchronization.'}
          </div>
        </div>

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-amber-200/90 mb-1">
                {t.displayName}
              </label>
              <div className="relative">
                <UserIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60`} />
                <input
                  type="text"
                  id="auth-name-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: السلطان، الملك، شاهين...' : 'e.g. Sultan, King, Ace...'}
                  className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 bg-slate-950/80 border border-amber-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-amber-200/90 mb-1">
              {t.email}
            </label>
            <div className="relative">
              <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60`} />
              <input
                type="email"
                id="auth-email-input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@casino.club"
                className={`w-full ${isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2.5 bg-slate-950/80 border border-amber-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors`}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-200/90 mb-1">
              {t.password}
            </label>
            <div className="relative">
              <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/60`} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="auth-password-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-10 py-2.5 bg-slate-950/80 border border-amber-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-300`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="auth-submit-btn"
            disabled={isLoading}
            className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'register' ? (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>{t.registerTab}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{t.loginTab}</span>
                  </>
                )}
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Helper */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-200/60">
          <span>{language === 'ar' ? 'تريد تجربة سريعة؟' : 'Quick demo?'}</span>
          <button
            type="button"
            onClick={fillQuickDemo}
            className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
          >
            {language === 'ar' ? 'تعبئة بيانات حساب VIP تجريبي' : 'Auto-fill VIP Demo'}
          </button>
        </div>
      </div>
    </div>
  );
};
