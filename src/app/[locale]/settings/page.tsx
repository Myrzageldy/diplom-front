'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { deleteAccount, getTOTPSetup, confirmTOTPSetup, disableTOTP } from '@/lib/api';
import PasskeyList from '@/components/settings/PasskeyList';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('settings');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 2FA состояние
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetupStep, setTotpSetupStep] = useState<'idle' | 'qr' | 'confirm' | 'disable'>('idle');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpDisablePassword, setTotpDisablePassword] = useState('');
  const [totpError, setTotpError] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpSuccess, setTotpSuccess] = useState('');

  const setLanguage = (lang: string) => {
    router.replace('/settings', { locale: lang });
  };

  // Синхронизируем состояние totpEnabled с профилем пользователя
  useEffect(() => {
    if (user) {
      setTotpEnabled((user as unknown as { totp_enabled?: boolean }).totp_enabled ?? false);
    }
  }, [user]);

  const handleStartTOTPSetup = async () => {
    setTotpError('');
    setTotpSuccess('');
    setTotpLoading(true);
    try {
      const data = await getTOTPSetup();
      setTotpQrCode(data.qr_code);
      setTotpSecret(data.secret);
      setTotpSetupStep('qr');
    } catch {
      setTotpError('Не удалось получить QR-код');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleConfirmTOTP = async () => {
    setTotpError('');
    setTotpLoading(true);
    try {
      await confirmTOTPSetup(totpCode);
      setTotpEnabled(true);
      setTotpSetupStep('idle');
      setTotpCode('');
      setTotpSuccess('2FA успешно включена!');
    } catch (err) {
      const e = err as { detail?: string };
      setTotpError(e?.detail || 'Неверный код');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisableTOTP = async () => {
    setTotpError('');
    setTotpLoading(true);
    try {
      await disableTOTP(totpDisablePassword, totpCode);
      setTotpEnabled(false);
      setTotpSetupStep('idle');
      setTotpCode('');
      setTotpDisablePassword('');
      setTotpSuccess('2FA отключена');
    } catch (err) {
      const e = err as { detail?: string };
      setTotpError(e?.detail || 'Ошибка');
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError(t('deleteAccount.errorEmpty'));
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAccount(deletePassword);
      router.push('/login');
    } catch (err: unknown) {
      const e = err as { detail?: string };
      setDeleteError(e?.detail || t('deleteAccount.errorDefault'));
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="pt-24 px-4 pb-12">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="h-10 skeleton rounded-xl w-48" />
            <div className="h-48 skeleton rounded-2xl" />
            <div className="h-48 skeleton rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="pt-24 px-4 pb-12">
        <div className="max-w-2xl mx-auto">

          {/* Page header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-full text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-4">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              {user.name}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {t('title')}
            </h1>
          </div>

          <div className="space-y-5">

            {/* Theme */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('theme.title')}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Light */}
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    theme === 'light'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t('theme.light')}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('theme.lightDesc')}</p>
                  {theme === 'light' && (
                    <div className="mt-2 flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('theme.selected')}
                    </div>
                  )}
                </button>

                {/* Dark */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    theme === 'dark'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t('theme.dark')}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('theme.darkDesc')}</p>
                  {theme === 'dark' && (
                    <div className="mt-2 flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('theme.selected')}
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('language.title')}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Russian */}
                <button
                  onClick={() => setLanguage('ru')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    locale === 'ru'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-2xl">
                      🇷🇺
                    </div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t('language.ru')}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('language.ruDesc')}</p>
                  {locale === 'ru' && (
                    <div className="mt-2 flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('language.selected')}
                    </div>
                  )}
                </button>

                {/* Kazakh */}
                <button
                  onClick={() => setLanguage('kk')}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    locale === 'kk'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-2xl">
                      🇰🇿
                    </div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t('language.kk')}</p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('language.kkDesc')}</p>
                  {locale === 'kk' && (
                    <div className="mt-2 flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('language.selected')}
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('notifications.title')}
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t('notifications.email')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('notifications.emailDesc')}</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition shadow-sm" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t('notifications.reminders')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('notifications.remindersDesc')}</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition shadow-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2FA / TOTP */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Двухфакторная аутентификация (2FA)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {totpEnabled ? 'Включена — ваш аккаунт защищён' : 'Выключена — рекомендуем включить'}
                  </p>
                </div>
                <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${totpEnabled ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  {totpEnabled ? 'Активна' : 'Не активна'}
                </span>
              </div>

              {totpSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-300">
                  {totpSuccess}
                </div>
              )}

              {totpError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {totpError}
                </div>
              )}

              {/* Шаг: показ QR-кода */}
              {totpSetupStep === 'qr' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Отсканируйте QR-код в приложении <strong>Google Authenticator</strong> или <strong>Authy</strong>:
                  </p>
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={totpQrCode} alt="QR код для 2FA" className="w-48 h-48 border border-slate-200 dark:border-slate-600 rounded-xl p-2 bg-white" />
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Или введите секрет вручную:</p>
                    <code className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{totpSecret}</code>
                  </div>
                  <button
                    onClick={() => setTotpSetupStep('confirm')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Я отсканировал — продолжить
                  </button>
                  <button onClick={() => { setTotpSetupStep('idle'); setTotpError(''); }} className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
                    Отмена
                  </button>
                </div>
              )}

              {/* Шаг: подтверждение кода */}
              {totpSetupStep === 'confirm' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Введите код из приложения для подтверждения:</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleConfirmTOTP}
                    disabled={totpLoading || totpCode.length !== 6}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    {totpLoading ? 'Проверка...' : 'Включить 2FA'}
                  </button>
                  <button onClick={() => { setTotpSetupStep('qr'); setTotpCode(''); setTotpError(''); }} className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">
                    Назад
                  </button>
                </div>
              )}

              {/* Шаг: отключение */}
              {totpSetupStep === 'disable' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Введите пароль и код из приложения для отключения 2FA:</p>
                  <input
                    type="password"
                    value={totpDisablePassword}
                    onChange={(e) => setTotpDisablePassword(e.target.value)}
                    placeholder="Текущий пароль"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Код из приложения"
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                  <button
                    onClick={handleDisableTOTP}
                    disabled={totpLoading || !totpDisablePassword || totpCode.length !== 6}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    {totpLoading ? 'Отключение...' : 'Отключить 2FA'}
                  </button>
                  <button onClick={() => { setTotpSetupStep('idle'); setTotpCode(''); setTotpDisablePassword(''); setTotpError(''); }} className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">
                    Отмена
                  </button>
                </div>
              )}

              {/* Кнопки в состоянии idle */}
              {totpSetupStep === 'idle' && !totpEnabled && (
                <button
                  onClick={handleStartTOTPSetup}
                  disabled={totpLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {totpLoading ? 'Загрузка...' : 'Включить 2FA'}
                </button>
              )}

              {totpSetupStep === 'idle' && totpEnabled && (
                <button
                  onClick={() => { setTotpSetupStep('disable'); setTotpError(''); setTotpSuccess(''); }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors border border-slate-200 dark:border-slate-600"
                >
                  Отключить 2FA
                </button>
              )}
            </div>

            {/* Passkey / WebAuthn */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Passkeys (WebAuthn)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Вход без пароля — Windows Hello, Touch ID, USB-ключ
                  </p>
                </div>
              </div>

<PasskeyList />
            </div>

            {/* Danger zone */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">
                  {t('deleteAccount.title')}
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 ml-12">
                {t('deleteAccount.description')}
              </p>
              <button
                onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError(''); }}
                className="ml-12 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-semibold text-sm transition-colors"
              >
                {t('deleteAccount.button')}
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('deleteAccount.modalTitle')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('deleteAccount.modalSubtitle')}</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('deleteAccount.passwordLabel')}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleDeleteAccount()}
                placeholder={t('deleteAccount.passwordPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all"
                autoFocus
              />
              {deleteError && (
                <p className="mt-2 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                  {deleteError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 font-semibold text-sm transition-colors"
              >
                {t('deleteAccount.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {deleteLoading ? t('deleteAccount.deleting') : t('deleteAccount.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
