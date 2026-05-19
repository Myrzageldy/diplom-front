'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  getCourses,
  getCategories,
  getEnrollments,
  getCourseProgress,
  getMediaUrl,
  Course,
  Category,
  Enrollment,
  CourseProgress,
} from '@/lib/api';

interface EnrolledCourseWithProgress extends Enrollment {
  progress?: CourseProgress;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const t = useTranslations('studentDashboard');
  const tCommon = useTranslations('common');
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseWithProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [enrolledLoading, setEnrolledLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadEnrolledCourses() {
      setEnrolledLoading(true);
      try {
        const enrollments = await getEnrollments();
        const enrolledWithProgress: EnrolledCourseWithProgress[] = await Promise.all(
          enrollments.map(async (enrollment) => {
            try {
              const progress = await getCourseProgress(enrollment.course.id);
              return { ...enrollment, progress };
            } catch {
              return enrollment;
            }
          })
        );
        setEnrolledCourses(enrolledWithProgress);
      } catch (error) {
        console.error('Error loading enrollments:', error);
      } finally {
        setEnrolledLoading(false);
      }
    }
    loadEnrolledCourses();
  }, []);

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      try {
        const data = await getCourses({
          search: searchQuery || undefined,
          category: selectedCategory || undefined,
        });
        setCourses(data);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(loadCourses, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-full text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-4">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
          Студент
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
          {t('greeting', { name: user?.name || '' })}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg">
          {t('subtitle')}
        </p>
      </div>

      {/* Enrolled Courses Section */}
      {enrolledCourses.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('myCourses')}
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {enrolledCourses.length} курс{enrolledCourses.length !== 1 ? 'а' : ''}
            </span>
          </div>

          {enrolledLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 skeleton rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton rounded w-3/4" />
                      <div className="h-3 skeleton rounded w-1/2" />
                      <div className="h-2 skeleton rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((enrolled) => (
                <Link
                  key={enrolled.id}
                  href={`/learn/${enrolled.course.id}`}
                  className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200"
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {enrolled.course.image ? (
                        <img src={getMediaUrl(enrolled.course.image) || ''} alt={enrolled.course.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-2xl">📚</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {enrolled.course.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {enrolled.course.teacher_name}
                      </p>
                      {enrolled.progress && (
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>{enrolled.progress.completed_lessons}/{enrolled.progress.total_lessons} {t('lessons')}</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{enrolled.progress.progress_percent}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className="progress-gradient h-1.5 rounded-full"
                              style={{ width: `${enrolled.progress.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          {t('browseCourses')}
        </h2>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-base shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === ''
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800'
          }`}
        >
          {tCommon('all')}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.slug)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category.slug
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? tCommon('loading') : t('foundCourses', { count: courses.length })}
        </p>
      </div>

      {/* Courses grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="aspect-video skeleton" />
              <div className="p-5 space-y-3">
                <div className="h-4 skeleton rounded w-1/3" />
                <div className="h-5 skeleton rounded" />
                <div className="h-4 skeleton rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {t('noCourses.title')}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {t('noCourses.subtitle')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="course-card group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Cover */}
              <div className="aspect-video bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center relative overflow-hidden">
                {course.image ? (
                  <img src={getMediaUrl(course.image) || ''} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-white text-5xl">📚</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-3 right-3">
                  {Number(course.price) === 0 ? (
                    <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg">
                      {t('free')}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-white/95 dark:bg-slate-900/90 text-slate-900 dark:text-white text-xs font-bold rounded-full shadow-lg">
                      {Number(course.price).toLocaleString()} ₸
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2.5">
                  {course.category_name && (
                    <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full font-medium border border-indigo-100 dark:border-indigo-900/50">
                      {course.category_name}
                    </span>
                  )}
                  {course.rating && (
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{course.rating}</span>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {course.teacher_name?.charAt(0) || 'T'}
                    </div>
                    <span className="font-medium text-slate-600 dark:text-slate-300">{course.teacher_name}</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                    </svg>
                    {t('students', { count: course.students_count })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
