'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import {
  getTeacherCourseDetail,
  updateCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  uploadCourseImage,
  getMediaUrl,
  CourseDetail,
  Module,
  Lesson,
} from '@/lib/api';
import Header from '@/components/Header';

export default function EditCoursePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit mode
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [editingLesson, setEditingLesson] = useState<number | null>(null);

  // New items
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newLessonData, setNewLessonData] = useState<{
    moduleId: number;
    title: string;
    video_url: string;
  } | null>(null);

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      router.push('/login');
      return;
    }

    if (user?.role === 'teacher' && courseId) {
      loadCourse();
    }
  }, [user, authLoading, courseId, router]);

  async function loadCourse() {
    setLoading(true);
    try {
      const data = await getTeacherCourseDetail(courseId);
      setCourse(data);
    } catch (err) {
      console.error('Error loading course:', err);
      setError('Курс не найден');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!course) return;
    setSaving(true);
    try {
      await updateCourse(courseId, { is_published: !course.is_published });
      setCourse({ ...course, is_published: !course.is_published });
      setSuccess(course.is_published ? 'Курс снят с публикации' : 'Курс опубликован!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при обновлении курса');
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !course) return;

    setUploadingImage(true);
    try {
      const updated = await uploadCourseImage(courseId, file);
      setCourse({ ...course, image: updated.image });
      setSuccess('Обложка обновлена');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при загрузке обложки');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleAddModule() {
    if (!newModuleTitle.trim()) return;
    setSaving(true);
    try {
      const module = await createModule(courseId, { title: newModuleTitle });
      setCourse(prev => prev ? {
        ...prev,
        modules: [...(prev.modules || []), { ...module, lessons: [] }]
      } : null);
      setNewModuleTitle('');
      setSuccess('Модуль добавлен');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при создании модуля');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateModule(moduleId: number, title: string) {
    setSaving(true);
    try {
      await updateModule(moduleId, { title });
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules?.map(m => m.id === moduleId ? { ...m, title } : m)
      } : null);
      setEditingModule(null);
      setSuccess('Модуль обновлён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при обновлении модуля');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteModule(moduleId: number) {
    if (!confirm('Удалить модуль и все его уроки?')) return;
    setSaving(true);
    try {
      await deleteModule(moduleId);
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules?.filter(m => m.id !== moduleId)
      } : null);
      setSuccess('Модуль удалён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при удалении модуля');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishModule(moduleId: number, is_published: boolean) {
    setSaving(true);
    try {
      await updateModule(moduleId, { is_published });
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules?.map(m => m.id === moduleId ? { ...m, is_published } : m)
      } : null);
    } catch (err) {
      setError('Ошибка при обновлении модуля');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLesson() {
    if (!newLessonData || !newLessonData.title.trim()) return;
    setSaving(true);
    try {
      const lesson = await createLesson(newLessonData.moduleId, {
        title: newLessonData.title,
        video_url: newLessonData.video_url,
      });
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules?.map(m => m.id === newLessonData.moduleId ? {
          ...m,
          lessons: [...(m.lessons || []), lesson]
        } : m)
      } : null);
      setNewLessonData(null);
      setSuccess('Урок добавлен');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при создании урока');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateLesson(lessonId: number, moduleId: number, data: Partial<Lesson>) {
    setSaving(true);
    try {
      await updateLesson(lessonId, data);
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules?.map(m => m.id === moduleId ? {
          ...m,
          lessons: m.lessons?.map(l => l.id === lessonId ? { ...l, ...data } : l)
        } : m)
      } : null);
      setEditingLesson(null);
      setSuccess('Урок обновлён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при обновлении урока');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteLesson(lessonId: number, moduleId: number) {
    if (!confirm('Удалить урок?')) return;
    setSaving(true);
    try {
      await deleteLesson(lessonId);
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules?.map(m => m.id === moduleId ? {
          ...m,
          lessons: m.lessons?.filter(l => l.id !== lessonId)
        } : m)
      } : null);
      setSuccess('Урок удалён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при удалении урока');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishLesson(lessonId: number, moduleId: number, is_published: boolean) {
    setSaving(true);
    try {
      await updateLesson(lessonId, { is_published });
      setCourse(prev => prev ? {
        ...prev,
        modules: prev.modules?.map(m => m.id === moduleId ? {
          ...m,
          lessons: m.lessons?.map(l => l.id === lessonId ? { ...l, is_published } : l)
        } : m)
      } : null);
    } catch (err) {
      setError('Ошибка при обновлении урока');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Курс не найден</h1>
          <Link href="/teacher" className="text-blue-600 hover:underline">
            Вернуться в панель учителя
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/teacher" className="hover:text-blue-600">Панель учителя</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">{course.title}</li>
          </ol>
        </nav>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl">
            {error}
            <button onClick={() => setError('')} className="float-right">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl">
            {success}
          </div>
        )}

        {/* Course Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          {/* Обложка курса */}
          <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
            {course.image ? (
              <img
                src={getMediaUrl(course.image) || ''}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <label className="absolute bottom-3 right-3 px-3 py-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2">
              {uploadingImage ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Загрузка...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {course.image ? 'Изменить обложку' : 'Добавить обложку'}
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </label>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  {course.category_name && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                      {course.category_name}
                    </span>
                  )}
                  <span className="text-gray-500 dark:text-gray-400">
                    {course.modules?.length || 0} модулей
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {course.students_count || 0} студентов
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    course.is_published
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {course.is_published ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
              </div>
              <button
                onClick={handlePublish}
                disabled={saving}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  course.is_published
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {course.is_published ? 'Снять с публикации' : 'Опубликовать'}
              </button>
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Модули курса</h2>
          </div>

          {course.modules?.map((module, moduleIndex) => (
            <div key={module.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Module Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-medium">
                    {moduleIndex + 1}
                  </span>

                  {editingModule === module.id ? (
                    <input
                      type="text"
                      defaultValue={module.title}
                      autoFocus
                      onBlur={(e) => handleUpdateModule(module.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateModule(module.id, e.currentTarget.value);
                        if (e.key === 'Escape') setEditingModule(null);
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  ) : (
                    <h3 className="flex-1 font-semibold text-gray-900 dark:text-white">
                      {module.title}
                    </h3>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={module.is_published}
                        onChange={(e) => handlePublishModule(module.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      Опубликован
                    </label>
                    <button
                      onClick={() => setEditingModule(module.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Редактировать"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteModule(module.id)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Удалить"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lessons */}
              <div className="p-4 space-y-3">
                {module.lessons?.map((lesson, lessonIndex) => (
                  <div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                      {lessonIndex + 1}.
                    </span>

                    {editingLesson === lesson.id ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          defaultValue={lesson.title}
                          placeholder="Название урока"
                          id={`lesson-title-${lesson.id}`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                        <input
                          type="url"
                          defaultValue={lesson.video_url}
                          placeholder="Ссылка на видео (YouTube)"
                          id={`lesson-video-${lesson.id}`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const title = (document.getElementById(`lesson-title-${lesson.id}`) as HTMLInputElement).value;
                              const video_url = (document.getElementById(`lesson-video-${lesson.id}`) as HTMLInputElement).value;
                              handleUpdateLesson(lesson.id, module.id, { title, video_url });
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            Сохранить
                          </button>
                          <button
                            onClick={() => setEditingLesson(null)}
                            className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white text-sm font-medium">
                            {lesson.title}
                          </p>
                          {lesson.video_url && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                              {lesson.video_url}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <input
                              type="checkbox"
                              checked={lesson.is_published}
                              onChange={(e) => handlePublishLesson(lesson.id, module.id, e.target.checked)}
                              className="w-3.5 h-3.5 text-blue-600 rounded"
                            />
                            Опубл.
                          </label>
                          <button
                            onClick={() => setEditingLesson(lesson.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson.id, module.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Add lesson form */}
                {newLessonData?.moduleId === module.id ? (
                  <div className="p-3 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl space-y-2">
                    <input
                      type="text"
                      value={newLessonData.title}
                      onChange={(e) => setNewLessonData({ ...newLessonData, title: e.target.value })}
                      placeholder="Название урока"
                      autoFocus
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    <input
                      type="url"
                      value={newLessonData.video_url}
                      onChange={(e) => setNewLessonData({ ...newLessonData, video_url: e.target.value })}
                      placeholder="Ссылка на видео (YouTube)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddLesson}
                        disabled={!newLessonData.title.trim()}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        Добавить
                      </button>
                      <button
                        onClick={() => setNewLessonData(null)}
                        className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewLessonData({ moduleId: module.id, title: '', video_url: '' })}
                    className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
                  >
                    + Добавить урок
                  </button>
                )}

                {/* Test link */}
                <Link
                  href={`/teacher/courses/${courseId}/modules/${module.id}/test`}
                  className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  {module.has_test ? 'Редактировать тест' : 'Добавить тест к модулю'}
                </Link>
              </div>
            </div>
          ))}

          {/* Add module */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Название нового модуля"
                onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleAddModule}
                disabled={!newModuleTitle.trim() || saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
              >
                Добавить модуль
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
