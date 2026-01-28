'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('settings');

  const setLanguage = (lang: string) => {
    router.replace('/settings', { locale: lang });
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="pt-20 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6 w-48" />
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="pt-20 px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('title')}
          </h1>

          <div className="space-y-6">
            {/* Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('theme.title')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{t('theme.light')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('theme.lightDesc')}</p>
                    </div>
                  </div>
                  {theme === 'light' && (
                    <div className="mt-3 flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('theme.selected')}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{t('theme.dark')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('theme.darkDesc')}</p>
                    </div>
                  </div>
                  {theme === 'dark' && (
                    <div className="mt-3 flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('theme.selected')}
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('language.title')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setLanguage('ru')}
                  className={`p-4 rounded-xl border-2 transition-all ${locale === 'ru' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center text-2xl font-medium text-gray-700 dark:text-gray-300">
                      RU
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{t('language.ru')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('language.ruDesc')}</p>
                    </div>
                  </div>
                  {locale === 'ru' && (
                    <div className="mt-3 flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('language.selected')}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setLanguage('kk')}
                  className={`p-4 rounded-xl border-2 transition-all ${locale === 'kk' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center text-2xl font-medium text-gray-700 dark:text-gray-300">
                      KZ
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{t('language.kk')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('language.kkDesc')}</p>
                    </div>
                  </div>
                  {locale === 'kk' && (
                    <div className="mt-3 flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('language.selected')}
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('notifications.title')}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('notifications.email')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifications.emailDesc')}</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t('notifications.reminders')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifications.remindersDesc')}</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6 transition" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
