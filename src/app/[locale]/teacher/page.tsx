'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { getTeacherCourses, getTeacherStats, deleteCourse, getMediaUrl, Course, TeacherStats } from '@/lib/api';
import Header from '@/components/Header';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('teacherDashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'teacher') {
      loadData();
    }
  }, [user, authLoading, router]);

  async function loadData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [coursesData, statsData] = await Promise.all([
        getTeacherCourses(),
        getTeacherStats(),
      ]);
      setCourses(coursesData.courses ?? []);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
      const apiErr = err as { detail?: string };
      setLoadError(apiErr?.detail || 'Не удалось загрузить данные. Проверьте подключение к серверу.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить этот курс?')) return;
    try {
      await deleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
      setStats(prev => prev ? { ...prev, courses_count: prev.courses_count - 1 } : null);
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Ошибка при удалении курса');
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statCards = [
    {
      value: stats?.courses_count || 0,
      label: t('stats.courses'),
      iconClass: 'stat-icon-blue',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      value: stats?.students_count || 0,
      label: t('stats.students'),
      iconClass: 'stat-icon-green',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
        </svg>
      ),
    },
    {
      value: stats?.published_count || 0,
      label: t('stats.published'),
      iconClass: 'stat-icon-purple',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Greeting */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/50 rounded-full text-xs text-violet-700 dark:text-violet-300 font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
            Преподаватель
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
            {t('greeting', { name: user?.name || '' })} 👋
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg">{t('subtitle')}</p>
        </div>

        {/* Error banner */}
        {loadError && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-start justify-between gap-4">
            <div>
              <p className="text-rose-700 dark:text-rose-400 font-semibold text-sm">Ошибка загрузки</p>
              <p className="text-rose-600 dark:text-rose-300 text-sm mt-0.5">{loadError}</p>
            </div>
            <button onClick={loadData} className="flex-shrink-0 px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium">
              Повторить
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/teacher/students"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t('myStudents')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('myStudentsDesc')}</p>
            </div>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          <Link
            href="/teacher/courses/new"
            className="group flex items-center gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {t('createCourse')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('createCourseDesc')}</p>
            </div>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-500/8 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconClass}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {loading ? <span className="inline-block w-10 h-8 skeleton rounded" /> : card.value}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* My courses */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('myCourses')}</h2>
            <Link
              href="/teacher/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('createCourse')}
            </Link>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden">
                    <div className="aspect-video skeleton" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 skeleton rounded" />
                      <div className="h-4 skeleton rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('noCourses.title')}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">{t('noCourses.subtitle')}</p>
                <Link
                  href="/teacher/courses/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-500/25"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('createFirstCourse')}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="group bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200"
                  >
                    <Link href={`/teacher/courses/${course.id}`}>
                      <div className="aspect-video bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden">
                        {course.image ? (
                          <img src={getMediaUrl(course.image) || ''} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <span className="text-white text-4xl">📚</span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/teacher/courses/${course.id}`}>
                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
                          {course.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {t('students', { count: course.students_count })}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          course.is_published
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        }`}>
                          {course.is_published ? t('published') : t('draft')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/teacher/courses/${course.id}`}
                          className="flex-1 text-center py-2 text-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-500 hover:to-violet-500 transition-all font-semibold"
                        >
                          Редактировать
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
