'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import { createCourse, getCategories, Category } from '@/lib/api';
import Header from '@/components/Header';

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [enableCertificate, setEnableCertificate] = useState(false);
  const [certificateTitle, setCertificateTitle] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      router.push('/login');
      return;
    }

    loadCategories();
  }, [user, authLoading, router]);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const course = await createCourse({
        title,
        description,
        category_id: categoryId,
        enable_certificate: enableCertificate,
        certificate_title: certificateTitle,
      });

      router.push(`/teacher/courses/${course.id}`);
    } catch (err: any) {
      setError(err.detail || 'Ошибка при создании курса');
    } finally {
      setLoading(false);
    }
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/teacher" className="hover:text-blue-600">
                Панель учителя
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">Новый курс</li>
          </ol>
        </nav>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Создание нового курса
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Название курса *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Python для начинающих"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание курса *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите, чему студенты научатся на этом курсе..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Категория
              </label>
              <select
                id="category"
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                <option value="">Без категории</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Certificate */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="enableCertificate"
                  checked={enableCertificate}
                  onChange={(e) => setEnableCertificate(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="enableCertificate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Выдавать сертификат после прохождения
                </label>
              </div>

              {enableCertificate && (
                <div>
                  <label htmlFor="certificateTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Текст на сертификате
                  </label>
                  <input
                    type="text"
                    id="certificateTitle"
                    value={certificateTitle}
                    onChange={(e) => setCertificateTitle(e.target.value)}
                    placeholder='Например: "Успешно завершил курс по Python"'
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Link
                href="/teacher"
                className="flex-1 py-3 text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Отмена
              </Link>
              <button
                type="submit"
                disabled={loading || !title || !description}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Создание...' : 'Создать курс'}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Что дальше?</p>
              <p>После создания курса вы сможете добавить модули, уроки с видео и тесты. Курс будет в статусе "черновик" пока вы не опубликуете его.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
