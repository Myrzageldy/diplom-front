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

  // Redirect teacher to /teacher (hook must be before any returns)
  useEffect(() => {
    if (!isLoading && user && user.role === 'teacher') {
      router.push('/teacher');
    }
  }, [user, isLoading, router]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="pt-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3" />
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Teacher will be redirected, show loading
  if (user && user.role === 'teacher') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Student dashboard on main page
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="pt-20 px-4 pb-12">
          <StudentDashboard />
        </main>
      </div>
    );
  }

  // Guest - welcome page
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Hero section */}
      <main className="pt-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - text */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {t('title')}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {t('subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors text-center"
                >
                  {t('startLearning')}
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-lg font-semibold rounded-xl hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-center"
                >
                  {t('login')}
                </Link>
              </div>
            </div>

            {/* Right - illustration */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-200 dark:bg-blue-900/30 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-4 -right-4 w-72 h-72 bg-purple-200 dark:bg-purple-900/30 rounded-full blur-3xl opacity-50" />
                <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-600 p-4 rounded-xl shadow-sm">
                      <div className="text-3xl mb-2">📚</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div>
                      <div className="text-gray-500 dark:text-gray-300 text-sm">{t('stats.courses')}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-600 p-4 rounded-xl shadow-sm">
                      <div className="text-3xl mb-2">👨‍🏫</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">100+</div>
                      <div className="text-gray-500 dark:text-gray-300 text-sm">{t('stats.teachers')}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-600 p-4 rounded-xl shadow-sm">
                      <div className="text-3xl mb-2">🎓</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div>
                      <div className="text-gray-500 dark:text-gray-300 text-sm">{t('stats.students')}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-600 p-4 rounded-xl shadow-sm">
                      <div className="text-3xl mb-2">🌍</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">2</div>
                      <div className="text-gray-500 dark:text-gray-300 text-sm">{t('stats.languages')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For whom section */}
        <section className="bg-gray-50 dark:bg-gray-800 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              {t('forWhom.title')}
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
              {t('forWhom.subtitle')}
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* For students */}
              <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 text-4xl">
                  🎓
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('forStudents.title')}
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forStudents.feature1')}
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forStudents.feature2')}
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forStudents.feature3')}
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forStudents.feature4')}
                  </li>
                </ul>
                <Link
                  href="/register?role=student"
                  className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {t('forStudents.cta')}
                </Link>
              </div>

              {/* For teachers */}
              <div className="bg-white dark:bg-gray-700 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mb-6 text-4xl">
                  👨‍🏫
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('forTeachers.title')}
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forTeachers.feature1')}
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forTeachers.feature2')}
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forTeachers.feature3')}
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t('forTeachers.feature4')}
                  </li>
                </ul>
                <Link
                  href="/register?role=teacher"
                  className="mt-6 inline-block px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
                >
                  {t('forTeachers.cta')}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold">EduPlatform</span>
              </div>
              <p className="text-gray-400">
                2025 {t('footer.rights')}
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
