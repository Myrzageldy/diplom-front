'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { getTeacherCourses, getTeacherStats, deleteCourse, Course, TeacherStats } from '@/lib/api';
import Header from '@/components/Header';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('teacherDashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
    try {
      const [coursesData, statsData] = await Promise.all([
        getTeacherCourses(),
        getTeacherStats(),
      ]);
      setCourses(coursesData.courses);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Вы уверены, что хотите удалить этот курс?')) return;

    try {
      await deleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
      setStats(prev => prev ? {
        ...prev,
        courses_count: prev.courses_count - 1,
      } : null);
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Ошибка при удалении курса');
    }
    setDeleteId(null);
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('greeting', { name: user?.name || '' })}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats?.courses_count || 0}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('stats.courses')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats?.students_count || 0}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('stats.students')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats?.published_count || 0}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('stats.published')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* My courses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('myCourses')}
            </h2>
            <Link
              href="/teacher/courses/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('createCourse')}
            </Link>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-600" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('noCourses.title')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {t('noCourses.subtitle')}
                </p>
                <Link
                  href="/teacher/courses/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
                    className="group bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <Link href={`/teacher/courses/${course.id}`}>
                      <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-4xl">📚</span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/teacher/courses/${course.id}`}>
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {t('students', { count: course.students_count })}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          course.is_published
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                          {course.is_published ? t('published') : t('draft')}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Link
                          href={`/teacher/courses/${course.id}`}
                          className="flex-1 text-center py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Редактировать
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
