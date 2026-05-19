'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslations } from 'next-intl';
import { getTeacherCourses, getTeacherStats, getMediaUrl, Course, TeacherStats } from '@/lib/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const t = useTranslations('teacherDashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
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
    loadData();
  }, []);

  const statCards = [
    {
      value: stats?.courses_count || 0,
      label: t('stats.courses'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      iconClass: 'stat-icon-blue',
    },
    {
      value: stats?.students_count || 0,
      label: t('stats.students'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      iconClass: 'stat-icon-green',
    },
    {
      value: stats?.published_count || 0,
      label: t('stats.published'),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconClass: 'stat-icon-purple',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/50 rounded-full text-xs text-violet-700 dark:text-violet-300 font-medium mb-4">
          <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
          Преподаватель
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
          {t('greeting', { name: user?.name || '' })}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg">
          {t('subtitle')}
        </p>
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
                  {loading ? (
                    <span className="inline-block w-12 h-8 skeleton rounded" />
                  ) : card.value}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My courses */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('myCourses')}
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-500/25 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('createCourse')}
          </button>
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('noCourses.title')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {t('noCourses.subtitle')}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('createFirstCourse')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-indigo-500/10 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200"
                >
                  <div className="aspect-video bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden">
                    {course.image ? (
                      <img src={getMediaUrl(course.image) || ''} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-white text-4xl">📚</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {t('students', { count: course.students_count })}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        course.is_published
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      }`}>
                        {course.is_published ? t('published') : t('draft')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create course modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              {t('modal.title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {t('modal.text')}
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all"
            >
              {t('modal.ok')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
