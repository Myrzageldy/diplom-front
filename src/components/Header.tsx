'use client';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { useTranslations, useLocale } from 'next-intl';

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('header');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.push('/');
  };

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setLangMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm border-b border-slate-200/60 dark:border-slate-700/60'
        : 'bg-white/75 dark:bg-slate-900/75 backdrop-blur-lg border-b border-slate-200/30 dark:border-slate-700/30'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 group-hover:scale-105 transition-all duration-200">
              <span className="text-white font-bold text-base">E</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              EduPlatform
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/courses"
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all duration-150"
            >
              {t('courses')}
            </Link>
            <Link
              href="/about"
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-all duration-150"
            >
              {t('about')}
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Language switcher */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                <span className="text-base">{locale === 'ru' ? '🇷🇺' : '🇰🇿'}</span>
                {locale === 'ru' ? 'RU' : 'KZ'}
                <svg className={`w-3.5 h-3.5 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700 py-1.5 animate-fade-in">
                  <button
                    onClick={() => switchLocale('ru')}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${locale === 'ru' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    <span>🇷🇺</span> Русский
                  </button>
                  <button
                    onClick={() => switchLocale('kk')}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${locale === 'kk' ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    <span>🇰🇿</span> Қазақша
                  </button>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <label className="theme-switch" title={theme === 'light' ? t('darkTheme') : t('lightTheme')}>
              <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
              <div className="ts-slider" />
              <div className="ts-card">
                <div className="ts-face ts-front">☀️</div>
                <div className="ts-face ts-back">🌙</div>
              </div>
            </label>

            {isLoading ? (
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            ) : user ? (
              /* Logged in */
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/30">
                    <span className="text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 py-2 animate-fade-in">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                          <span className="inline-block mt-0.5 px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium">
                            {user.role === 'teacher' ? t('teacher') : t('student')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        {t('profile')}
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        {t('settings')}
                      </Link>

                      {user.role === 'student' && (
                        <Link
                          href="/certificates"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          {t('certificates')}
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not logged in */
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm rounded-xl font-medium hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
