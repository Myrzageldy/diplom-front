"use client";

import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { loginUser, verifyTOTPLogin, ApiError, User } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { sanitizeEmail, isValidEmail } from "@/lib/sanitize";
import {
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
  getRemainingAttempts,
  getBlockedSecondsRemaining,
  formatBlockedTime,
} from "@/lib/rateLimiter";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const t = useTranslations('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [blockedTimeDisplay, setBlockedTimeDisplay] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 2FA состояние
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // Серверная блокировка аккаунта
  const [serverLocked, setServerLocked] = useState(false);
  const [serverLockedUntil, setServerLockedUntil] = useState<Date | null>(null);
  const [serverLockedDisplay, setServerLockedDisplay] = useState("");

  // Обновляем таймер клиентской блокировки каждую секунду
  useEffect(() => {
    const interval = setInterval(() => {
      const cleanEmail = sanitizeEmail(email);
      if (cleanEmail && isRateLimited(cleanEmail)) {
        setBlockedTimeDisplay(formatBlockedTime(cleanEmail));
      } else {
        setBlockedTimeDisplay("");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [email]);

  // Таймер серверной блокировки
  useEffect(() => {
    if (!serverLockedUntil) return;
    const interval = setInterval(() => {
      const now = new Date();
      if (now >= serverLockedUntil) {
        setServerLocked(false);
        setServerLockedUntil(null);
        setServerLockedDisplay("");
        setError("");
        clearInterval(interval);
      } else {
        const diff = Math.ceil((serverLockedUntil.getTime() - now.getTime()) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        setServerLockedDisplay(mins > 0 ? `${mins} мин. ${secs} сек.` : `${secs} сек.`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [serverLockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = sanitizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      setError("Введите корректный email адрес");
      return;
    }

    if (isRateLimited(cleanEmail)) {
      const secs = getBlockedSecondsRemaining(cleanEmail);
      const mins = Math.floor(secs / 60);
      setError(
        `Слишком много попыток входа. Попробуйте через ${mins > 0 ? `${mins} мин.` : `${secs} сек.`}`
      );
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ email: cleanEmail, password });
      // Если сервер требует 2FA
      if ('requires_2fa' in result && result.requires_2fa) {
        setTempToken((result as { requires_2fa: boolean; temp_token: string }).temp_token);
        setRequires2FA(true);
        return;
      }
      clearAttempts(cleanEmail);
      setUser((result as { user: User }).user);
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError & { locked?: boolean; locked_until?: string };

      // Серверная блокировка аккаунта (HTTP 403)
      if (apiError.locked && apiError.locked_until) {
        setServerLocked(true);
        setServerLockedUntil(new Date(apiError.locked_until));
        setError(apiError.detail || "Аккаунт временно заблокирован");
        return;
      }

      recordFailedAttempt(cleanEmail);
      const remaining = getRemainingAttempts(cleanEmail);

      if (apiError.detail) {
        setError(
          remaining > 0
            ? `${apiError.detail}`
            : apiError.detail
        );
      } else {
        setError(t('errorDefault'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await verifyTOTPLogin(tempToken, totpCode);
      setUser(result.user);
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.detail || "Неверный код");
    } finally {
      setLoading(false);
    }
  };

  const cleanEmail = sanitizeEmail(email);
  const isBlocked = cleanEmail ? isRateLimited(cleanEmail) : false;
  const isAnyBlocked = isBlocked || serverLocked;

  // ─── Шаг 2: ввод TOTP кода ──────────────────────────────────────────────────
  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Двухфакторная аутентификация</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Введите 6-значный код из приложения-аутентификатора
            </p>
          </div>

          <form onSubmit={handleTOTPSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Код аутентификатора
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                autoFocus
                autoComplete="one-time-code"
              />
            </div>
            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><span className="btn-spinner" />Проверка...</> : "Войти"}
            </button>
            <button
              type="button"
              onClick={() => { setRequires2FA(false); setTotpCode(""); setError(""); }}
              className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Вернуться назад
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">EduPlatform</span>
          </Link>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('subtitle')}
          </p>

          {/* Серверная блокировка аккаунта */}
          {serverLocked && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/50 rounded-lg">
              <p className="text-red-700 dark:text-red-300 font-semibold text-sm">Аккаунт заблокирован</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                Слишком много неудачных попыток входа. Попробуйте через:{" "}
                <span className="font-mono font-bold">{serverLockedDisplay}</span>
              </p>
              <p className="text-red-500 dark:text-red-500 text-xs mt-1">
                Или воспользуйтесь <a href="/forgot-password" className="underline hover:text-red-700">сбросом пароля</a>
              </p>
            </div>
          )}

          {/* Клиентская блокировка */}
          {isBlocked && !serverLocked && (
            <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-500/50 rounded-lg">
              <p className="text-orange-700 dark:text-orange-300 font-semibold text-sm">Вход временно заблокирован</p>
              <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">
                Слишком много неудачных попыток. Повторите через:{" "}
                <span className="font-mono font-bold">{blockedTimeDisplay}</span>
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && !isBlocked && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
                maxLength={254}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{t('rememberMe')}</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                {t('forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading || isAnyBlocked}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading
                ? <><span className="btn-spinner" />{t('submitting')}</>
                : serverLocked
                  ? `Заблокирован (${serverLockedDisplay})`
                  : isBlocked
                    ? `Заблокирован (${blockedTimeDisplay})`
                    : t('submit')}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            {t('noAccount')}{" "}
            <Link href="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right - image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 items-center justify-center p-12">
        <div className="max-w-lg">
          <Image
            src="/undraw_taking-notes_oyqz.png"
            alt="Learning online"
            width={500}
            height={400}
            className="w-full h-auto"
            priority
          />
          <div className="text-center mt-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {t('sideTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('sideSubtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
