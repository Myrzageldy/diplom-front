'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { getTeacherStudents, getTeacherCourses, StudentProgress, Course } from '@/lib/api';
import Header from '@/components/Header';

export default function TeacherStudentsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('teacherStudents');
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      router.push('/login');
      return;
    }
    if (user?.role === 'teacher') {
      loadData();
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'teacher') {
      loadStudents();
    }
  }, [selectedCourse]);

  async function loadData() {
    setLoading(true);
    try {
      const [studentsData, coursesData] = await Promise.all([
        getTeacherStudents(),
        getTeacherCourses(),
      ]);
      setStudents(studentsData.students);
      setTotalStudents(studentsData.total_students);
      setCourses(coursesData.courses);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents() {
    try {
      const data = await getTeacherStudents(selectedCourse || undefined);
      setStudents(data.students);
      setTotalStudents(data.total_students);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }

  const filteredStudents = students.filter(s =>
    s.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function getProgressColor(percent: number) {
    if (percent >= 80) return 'progress-gradient';
    if (percent >= 50) return 'bg-blue-500';
    if (percent >= 20) return 'bg-amber-500';
    return 'bg-slate-400';
  }

  function getProgressTextColor(percent: number) {
    if (percent >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (percent >= 50) return 'text-blue-600 dark:text-blue-400';
    if (percent >= 20) return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-500 dark:text-slate-400';
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const statsData = [
    {
      value: totalStudents,
      label: t('stats.totalStudents'),
      iconClass: 'stat-icon-blue',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
        </svg>
      ),
    },
    {
      value: students.filter(s => s.progress_percent === 100).length,
      label: t('stats.completed'),
      iconClass: 'stat-icon-green',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      value: students.filter(s => s.progress_percent > 0 && s.progress_percent < 100).length,
      label: t('stats.inProgress'),
      iconClass: 'stat-icon-amber',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      value: students.length > 0 ? `${Math.round(students.reduce((acc, s) => acc + s.progress_percent, 0) / students.length)}%` : '0%',
      label: t('stats.avgProgress'),
      iconClass: 'stat-icon-purple',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/teacher"
            className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-0.5">
              {t('subtitle', { count: totalStudents })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statsData.map((card, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconClass}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{card.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={selectedCourse || ''}
                onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors cursor-pointer"
              >
                <option value="">{t('allCourses')}</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">{t('loading')}</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{t('noStudents.title')}</h3>
              <p className="text-slate-500 dark:text-slate-400">{t('noStudents.subtitle')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('table.student')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('table.course')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('table.progress')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('table.tests')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('table.avgScore')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('table.lastActivity')}
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('table.enrolled')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredStudents.map((item) => (
                    <tr
                      key={`${item.student.id}-${item.course.id}`}
                      className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors"
                      onClick={() => setSelectedStudent(item)}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-indigo-500/20">
                            {item.student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.student.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{item.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium max-w-[150px] truncate">{item.course.title}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden w-20">
                            <div
                              className={`h-full ${getProgressColor(item.progress_percent)} transition-all rounded-full`}
                              style={{ width: `${item.progress_percent}%` }}
                            />
                          </div>
                          <span className={`text-sm font-bold w-10 ${getProgressTextColor(item.progress_percent)}`}>
                            {item.progress_percent}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {item.completed_lessons}/{item.total_lessons} {t('lessons')}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-semibold ${
                          item.tests_passed === item.tests_total && item.tests_total > 0
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          {item.tests_passed}/{item.tests_total}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${
                          item.average_score !== null && item.average_score >= 80
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.average_score !== null && item.average_score >= 60
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.average_score !== null ? `${item.average_score}%` : '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(item.last_activity)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(item.enrolled_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Student detail modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedStudent(null)}>
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
                    {selectedStudent.student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStudent.student.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedStudent.student.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4 line-clamp-1">{selectedStudent.course.title}</h4>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 dark:text-slate-400">{t('modal.progress')}</span>
                    <span className={`font-bold ${getProgressTextColor(selectedStudent.progress_percent)}`}>{selectedStudent.progress_percent}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden mb-5">
                    <div
                      className={`h-full ${getProgressColor(selectedStudent.progress_percent)} rounded-full`}
                      style={{ width: `${selectedStudent.progress_percent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: t('modal.lessonsCompleted'), value: `${selectedStudent.completed_lessons}/${selectedStudent.total_lessons}` },
                      { label: t('modal.testsPassed'), value: `${selectedStudent.tests_passed}/${selectedStudent.tests_total}` },
                      { label: t('modal.avgScore'), value: selectedStudent.average_score !== null ? `${selectedStudent.average_score}%` : '-' },
                      { label: t('modal.enrolledAt'), value: formatDate(selectedStudent.enrolled_at) },
                    ].map((item, i) => (
                      <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-600">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{item.label}</p>
                        <p className="text-base font-bold text-slate-900 dark:text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selectedStudent.last_activity && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
                  {t('modal.lastActivity')}: {formatDate(selectedStudent.last_activity)}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
