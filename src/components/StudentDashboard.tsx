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

  // Load categories on mount
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

  // Load enrolled courses with progress
  useEffect(() => {
    async function loadEnrolledCourses() {
      setEnrolledLoading(true);
      try {
        const enrollments = await getEnrollments();

        // Load progress for each enrolled course
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

  // Load courses when filters change
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

    // Debounce for search
    const timer = setTimeout(loadCourses, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('greeting', { name: user?.name || '' })}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t('subtitle')}
        </p>
      </div>

      {/* Enrolled Courses Section */}
      {enrolledCourses.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('myCourses')}
          </h2>

          {enrolledLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
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
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {enrolled.course.image ? (
                        <img
                          src={enrolled.course.image}
                          alt={enrolled.course.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-white text-2xl">📚</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {enrolled.course.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {enrolled.course.teacher_name}
                      </p>

                      {/* Progress bar */}
                      {enrolled.progress && (
                        <div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{enrolled.progress.completed_lessons} / {enrolled.progress.total_lessons} {t('lessons')}</span>
                            <span>{enrolled.progress.progress_percent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t('browseCourses')}
        </h2>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {tCommon('all')}
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.slug)}
            className={`px-4 py-2 rounded-full font-medium transition-colors ${
              selectedCategory === category.slug
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="mb-4">
        <p className="text-gray-600 dark:text-gray-400">
          {loading ? tCommon('loading') : t('foundCourses', { count: courses.length })}
        </p>
      </div>

      {/* Courses list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('noCourses.title')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('noCourses.subtitle')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              {/* Cover */}
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-5xl">📚</span>
                )}
                <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg text-sm font-medium text-gray-900 dark:text-white">
                  {Number(course.price) === 0 ? t('free') : `${Number(course.price).toLocaleString()} ₸`}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  {course.category_name && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      {course.category_name}
                    </span>
                  )}
                  {course.rating && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{course.rating}</span>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    {course.teacher_name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
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
