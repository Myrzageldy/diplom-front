'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import { getCourseDetail, enrollCourse, initPayment, getMediaUrl, CourseDetail } from '@/lib/api';
import Header from '@/components/Header';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  async function loadCourse() {
    setLoading(true);
    try {
      const data = await getCourseDetail(courseId);
      setCourse(data);
    } catch (err) {
      console.error('Error loading course:', err);
      setError('Курс не найден');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnroll() {
    if (!user) {
      router.push('/login');
      return;
    }
    setEnrolling(true);
    setError('');
    try {
      const result = await initPayment(courseId);
      if ('enrolled' in result && result.enrolled) {
        // Бесплатный курс — сразу записан
        setCourse(prev => prev ? { ...prev, is_enrolled: true } : null);
      } else if ('payment_id' in result) {
        // Платный курс — редирект на страницу оплаты
        router.push(`/payment/${result.payment_id}`);
      }
    } catch (err: any) {
      setError(err.detail || 'Ошибка при записи на курс');
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8 pt-24">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
            <div className="h-72 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8 pt-24 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Курс не найден</h1>
          <Link href="/courses" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Вернуться в каталог
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link href="/courses" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Курсы
              </Link>
            </li>
            <li className="text-slate-300 dark:text-slate-600">/</li>
            <li className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-xs">{course.title}</li>
          </ol>
        </nav>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="aspect-video bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center relative overflow-hidden">
                {course.image ? (
                  <img src={getMediaUrl(course.image) || ''} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-6xl">📚</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              <div className="p-6">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
                  {course.title}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm mb-5">
                  {course.category_name && (
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold border border-indigo-100 dark:border-indigo-900/50">
                      {course.category_name}
                    </span>
                  )}
                  {course.teacher && (
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {course.teacher.name.charAt(0)}
                      </div>
                      {course.teacher.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    {course.students_count} студентов
                  </span>
                  {course.rating && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{course.rating}</span>
                    </span>
                  )}
                </div>

                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Modules */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
                Программа курса
              </h2>

              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-3">
                  {course.modules.map((module, index) => (
                    <div
                      key={module.id}
                      className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                    >
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md shadow-indigo-500/20">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                          {module.title}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {module.lessons_count} уроков
                          {module.has_test && (
                            <span className="ml-2 px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded text-xs font-medium">Тест</span>
                          )}
                        </p>
                      </div>
                      {course.is_enrolled ? (
                        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                  Программа курса пока не опубликована
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sticky top-24 shadow-sm">
              {/* Price */}
              <div className="text-center mb-6">
                {course.price > 0 ? (
                  <div>
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      {course.price} <span className="text-2xl text-slate-500">₸</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-4xl font-extrabold gradient-text">Бесплатно</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Полный доступ</p>
                  </div>
                )}
              </div>

              {/* Action button */}
              {course.is_enrolled ? (
                <Link
                  href={`/learn/${course.id}`}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Продолжить обучение
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  {enrolling ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="btn-spinner" />
                      Записываем...
                    </span>
                  ) : 'Записаться на курс'}
                </button>
              )}

              {/* Course info */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300">
                    {course.modules_count || course.modules?.length || 0} модулей
                  </span>
                </div>

                {course.enable_certificate && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300">Сертификат по окончании</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300">Доступ навсегда</span>
                </div>
              </div>

              {/* Teacher info */}
              {course.teacher && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-medium uppercase tracking-wide">Автор курса</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/25">
                      {course.teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{course.teacher.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Преподаватель</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
