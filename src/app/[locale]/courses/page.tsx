'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { getCourses, getCategories, getMediaUrl, Course, Category } from '@/lib/api';
import Header from '@/components/Header';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  async function loadData() {
    try {
      const [coursesData, categoriesData] = await Promise.all([
        getCourses(),
        getCategories(),
      ]);
      setCourses(coursesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCourses() {
    try {
      const data = await getCourses({
        search: search || undefined,
        category: selectedCategory || undefined,
      });
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      {/* Hero banner */}
      <div className="pt-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-3">
            Каталог <span className="gradient-text">курсов</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Найдите курс для себя и начните обучение прямо сейчас
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск курсов..."
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Category filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors cursor-pointer"
              >
                <option value="">Все категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="aspect-video skeleton" />
                <div className="p-5 space-y-3">
                  <div className="h-4 skeleton rounded w-1/3" />
                  <div className="h-5 skeleton rounded" />
                  <div className="h-4 skeleton rounded w-2/3" />
                  <div className="h-4 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Курсы не найдены</h3>
            <p className="text-slate-500 dark:text-slate-400">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 font-medium">
              Найдено курсов: <span className="text-slate-900 dark:text-white font-bold">{courses.length}</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="course-card group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center relative overflow-hidden">
                    {course.image ? (
                      <img
                        src={getMediaUrl(course.image) || ''}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-white text-5xl">📚</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {course.price > 0 && (
                      <span className="absolute top-3 right-3 px-3 py-1 bg-white/95 dark:bg-slate-900/90 rounded-full text-sm font-bold text-slate-900 dark:text-white shadow-md">
                        {course.price} ₸
                      </span>
                    )}
                    {Number(course.price) === 0 && (
                      <span className="absolute top-3 right-3 px-3 py-1 bg-emerald-500 rounded-full text-xs font-bold text-white shadow-md">
                        Бесплатно
                      </span>
                    )}
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
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{course.rating}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-gradient-to-br from-indigo-400 to-violet-500 rounded-full flex items-center justify-center text-white font-bold">
                          {course.teacher_name?.charAt(0) || 'T'}
                        </div>
                        <span className="font-medium text-slate-600 dark:text-slate-300">{course.teacher_name}</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400">
                        {course.students_count} студ.
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
