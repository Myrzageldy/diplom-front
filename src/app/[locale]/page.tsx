'use client';

import { useEffect } from 'react';
import Header from "@/components/Header";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useTranslations } from 'next-intl';
import StudentDashboard from "@/components/StudentDashboard";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const t = useTranslations('home');

  useEffect(() => {
    if (!isLoading && user && user.role === 'teacher') {
      router.push('/teacher');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="pt-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl w-1/3" />
              <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (user && user.role === 'teacher') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="pt-20 px-4 pb-12">
          <StudentDashboard />
        </main>
      </div>
    );
  }

  /* ===== Guest Landing ===== */
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 overflow-x-hidden">
      <Header />

      {/* Hero section */}
      <main className="pt-16">
        <section className="relative mesh-gradient min-h-[90vh] flex items-center overflow-hidden">
          {/* Animated blobs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-600/15 rounded-full blur-3xl blob pointer-events-none" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/15 rounded-full blur-3xl blob blob-delay-1 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/15 dark:bg-blue-600/10 rounded-full blur-3xl blob blob-delay-2 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left — text */}
              <div className="animate-slide-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-full text-sm text-indigo-700 dark:text-indigo-300 font-medium mb-6">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  Платформа онлайн-образования
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
                  <span className="gradient-text">{t('title')}</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-lg leading-relaxed">
                  {t('subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-semibold rounded-2xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 active:translate-y-0"
                  >
                    {t('startLearning')}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-lg font-semibold rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                  >
                    {t('login')}
                  </Link>
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-6 mt-10">
                  <div className="flex -space-x-2">
                    {['А', 'Б', 'В', 'Г'].map((l, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: `hsl(${220 + i * 30}, 70%, 55%)` }}>
                        {l}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-900 dark:text-white">10,000+</span> студентов уже учатся
                  </p>
                </div>
              </div>

              {/* Right — stats cards */}
              <div className="hidden lg:block">
                <div className="relative">
                  {/* Main card */}
                  <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 float">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                        <div className="text-3xl mb-2">📚</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">500+</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('stats.courses')}</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                        <div className="text-3xl mb-2">👨‍🏫</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">100+</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('stats.teachers')}</div>
                      </div>
                      <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/50">
                        <div className="text-3xl mb-2">🎓</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">10K+</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('stats.students')}</div>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 p-5 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                        <div className="text-3xl mb-2">🌍</div>
                        <div className="text-3xl font-extrabold text-slate-900 dark:text-white">2</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('stats.languages')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -top-5 -right-5 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl p-4 shadow-xl shadow-indigo-500/30 float-delay-1">
                    <div className="text-2xl mb-1">⭐</div>
                    <div className="text-lg font-bold">4.9</div>
                    <div className="text-xs opacity-80">Рейтинг</div>
                  </div>

                  {/* Floating badge 2 */}
                  <div className="absolute -bottom-5 -left-5 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-slate-700 float-delay-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg">
                        ✓
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Сертификаты</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">По окончании курса</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features strip */}
        <section className="border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
              {[
                { icon: '🎯', text: 'Структурированные курсы' },
                { icon: '📱', text: 'Учись с любого устройства' },
                { icon: '🏆', text: 'Сертификаты по завершении' },
                { icon: '🌐', text: 'На русском и казахском' },
                { icon: '♾️', text: 'Доступ навсегда' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 font-medium">
                  <span>{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For whom section */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
                {t('forWhom.title')}
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                {t('forWhom.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* For students */}
              <div className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 rounded-2xl flex items-center justify-center mb-6 text-4xl group-hover:scale-110 transition-transform">
                  🎓
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {t('forStudents.title')}
                </h3>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300 mb-8">
                  {[
                    t('forStudents.feature1'),
                    t('forStudents.feature2'),
                    t('forStudents.feature3'),
                    t('forStudents.feature4'),
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?role=student"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-500/25 hover:-translate-y-0.5"
                >
                  {t('forStudents.cta')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              {/* For teachers */}
              <div className="group relative bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 hover:border-violet-200 dark:hover:border-violet-800 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center mb-6 text-4xl group-hover:scale-110 transition-transform">
                  👨‍🏫
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {t('forTeachers.title')}
                </h3>
                <ul className="space-y-3 text-slate-600 dark:text-slate-300 mb-8">
                  {[
                    t('forTeachers.feature1'),
                    t('forTeachers.feature2'),
                    t('forTeachers.feature3'),
                    t('forTeachers.feature4'),
                  ].map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-violet-600 dark:text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?role=teacher"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all shadow-md shadow-violet-500/25 hover:-translate-y-0.5"
                >
                  {t('forTeachers.cta')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-base">E</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  EduPlatform
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                © 2025 {t('footer.rights')}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
