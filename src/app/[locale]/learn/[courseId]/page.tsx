'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from "@/components/Header";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useTranslations } from 'next-intl';
import {
  getCourseProgress,
  getStudentLesson,
  completeLesson,
  CourseProgress,
  LessonDetail,
  ModuleProgress,
} from "@/lib/api";

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('learn');

  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completing, setCompleting] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const data = await getCourseProgress(courseId);
      setProgress(data);
      return data;
    } catch (err: unknown) {
      const error = err as { detail?: string };
      setError(error.detail || 'Failed to load course');
      return null;
    }
  }, [courseId]);

  const loadLesson = useCallback(async (lessonId: number) => {
    setLessonLoading(true);
    try {
      const lesson = await getStudentLesson(lessonId);
      setCurrentLesson(lesson);
    } catch (err: unknown) {
      const error = err as { detail?: string };
      setError(error.detail || 'Failed to load lesson');
    } finally {
      setLessonLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    const init = async () => {
      setLoading(true);
      const data = await loadProgress();
      if (data && data.modules.length > 0) {
        let firstLessonId: number | null = null;
        for (const module of data.modules) {
          for (const lesson of module.lessons) {
            if (!lesson.is_completed && !firstLessonId) {
              firstLessonId = lesson.id;
              break;
            }
            if (!firstLessonId) {
              firstLessonId = lesson.id;
            }
          }
          if (firstLessonId && !module.lessons.find(l => l.id === firstLessonId)?.is_completed) {
            break;
          }
        }
        if (firstLessonId) {
          await loadLesson(firstLessonId);
        }
      }
      setLoading(false);
    };
    init();
  }, [authLoading, user, router, loadProgress, loadLesson]);

  const handleComplete = async () => {
    if (!currentLesson || currentLesson.is_completed) return;
    setCompleting(true);
    try {
      await completeLesson(currentLesson.id);
      await loadProgress();
      setCurrentLesson(prev => prev ? { ...prev, is_completed: true } : null);
    } catch (err) {
      console.error('Failed to complete lesson', err);
    } finally {
      setCompleting(false);
    }
  };

  const goToLesson = (lessonId: number) => loadLesson(lessonId);
  const goToNext = () => { if (currentLesson?.next_lesson) loadLesson(currentLesson.next_lesson); };
  const goToPrev = () => { if (currentLesson?.prev_lesson) loadLesson(currentLesson.prev_lesson); };

  const getCurrentModuleInfo = () => {
    if (!progress || !currentLesson) return null;
    for (const module of progress.modules) {
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLesson.id);
      if (lessonIndex !== -1) {
        return {
          module,
          isLastInModule: lessonIndex === module.lessons.length - 1,
          hasTest: !!module.test,
          test: module.test,
        };
      }
    }
    return null;
  };

  const moduleInfo = getCurrentModuleInfo();

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <Header />
        <main className="pt-16">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Загружаем курс...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <Header />
        <main className="pt-16">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-rose-500 mb-4 font-medium">{error}</p>
            <Link href="/courses" className="text-indigo-600 hover:text-indigo-700 font-medium">
              {t('backToCourses')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!progress) return null;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <Header />

      <main className="pt-16 flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-hidden`}
        >
          <div className="w-80 h-full flex flex-col">
            {/* Course header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h2 className="font-bold text-slate-900 dark:text-white truncate text-sm mb-3">
                {progress.course_title}
              </h2>
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                  <span>{t('progress')}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{progress.progress_percent}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="progress-gradient h-2 rounded-full"
                    style={{ width: `${progress.progress_percent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {progress.completed_lessons}/{progress.total_lessons} {t('lessonsCompleted')}
                </p>
              </div>
            </div>

            {/* Modules list */}
            <div className="flex-1 overflow-y-auto p-2">
              {progress.modules.map((module: ModuleProgress, moduleIndex: number) => (
                <div key={module.id} className="mb-3">
                  <div className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center gap-2">
                    <span className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {moduleIndex + 1}
                    </span>
                    <span className="truncate">{module.title}</span>
                  </div>

                  <ul className="mt-1 space-y-0.5">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <li key={lesson.id}>
                        <button
                          onClick={() => goToLesson(lesson.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors ${
                            currentLesson?.id === lesson.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {lesson.is_completed ? (
                            <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <span className="w-5 h-5 flex items-center justify-center text-xs text-slate-500 border border-slate-300 dark:border-slate-600 rounded-full flex-shrink-0">
                              {lessonIndex + 1}
                            </span>
                          )}
                          <span className="truncate flex-1">{lesson.title}</span>
                          {lesson.duration_minutes > 0 && (
                            <span className="text-slate-400 dark:text-slate-500 flex-shrink-0">
                              {lesson.duration_minutes}м
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {module.test && (
                    <Link
                      href={`/learn/${courseId}/test/${module.test.id}`}
                      className={`mt-1 w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors ${
                        module.test.is_passed
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'hover:bg-violet-50 dark:hover:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                      }`}
                    >
                      {module.test.is_passed ? (
                        <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      )}
                      <span className="truncate flex-1">{t('test')}: {module.test.title}</span>
                      {module.test.best_score !== null && (
                        <span className="flex-shrink-0 font-semibold">{module.test.best_score}%</span>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute z-10 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-xl p-2 shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          style={{ marginTop: '4rem', marginLeft: sidebarOpen ? '320px' : '0' }}
        >
          <svg
            className={`w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {lessonLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : currentLesson ? (
            <div className="max-w-4xl mx-auto p-6">
              {/* Video player */}
              {currentLesson.video_url && (
                <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-6 shadow-xl shadow-black/20">
                  {getYoutubeEmbedUrl(currentLesson.video_url) ? (
                    <iframe
                      src={getYoutubeEmbedUrl(currentLesson.video_url)!}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={currentLesson.video_url} controls className="w-full h-full" />
                  )}
                </div>
              )}

              {/* Lesson info card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                      {currentLesson.module_title}
                    </p>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                      {currentLesson.title}
                    </h1>
                  </div>

                  {currentLesson.is_completed ? (
                    <span className="flex-shrink-0 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-full text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('completed')}
                    </span>
                  ) : (
                    <button
                      onClick={handleComplete}
                      disabled={completing}
                      className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50 font-medium text-sm"
                    >
                      {completing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {t('markComplete')}
                    </button>
                  )}
                </div>

                {/* Description */}
                {currentLesson.description && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                      {currentLesson.description}
                    </p>
                  </div>
                )}

                {/* Materials */}
                {currentLesson.materials && currentLesson.materials.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('materials')}
                    </h3>
                    <div className="space-y-2">
                      {currentLesson.materials.map((material) => (
                        <a
                          key={material.id}
                          href={material.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800 border border-transparent transition-all"
                        >
                          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{material.title}</p>
                            <p className="text-xs text-slate-500">{material.file_type}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test prompt */}
                {moduleInfo?.isLastInModule && moduleInfo.hasTest && moduleInfo.test && !moduleInfo.test.is_passed && (
                  <div className="mt-5 p-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/50 rounded-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0">
                          📝
                        </div>
                        <div>
                          <p className="font-bold text-violet-900 dark:text-violet-100 text-sm">
                            {t('moduleComplete') || 'Модуль завершён!'}
                          </p>
                          <p className="text-xs text-violet-700 dark:text-violet-300">
                            {t('takeTestPrompt') || 'Пройдите тест чтобы продолжить'}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/learn/${courseId}/test/${moduleInfo.test.id}`}
                        className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all font-semibold text-sm shadow-md shadow-violet-500/25"
                      >
                        {t('takeTest') || 'Пройти тест'}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={goToPrev}
                    disabled={!currentLesson.prev_lesson}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('prevLesson')}
                  </button>

                  <Link
                    href={`/courses/${courseId}`}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                  >
                    {t('backToCourse')}
                  </Link>

                  {moduleInfo?.isLastInModule && moduleInfo.hasTest && moduleInfo.test && !moduleInfo.test.is_passed ? (
                    <Link
                      href={`/learn/${courseId}/test/${moduleInfo.test.id}`}
                      className="flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      {t('takeTest') || 'Пройти тест'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <button
                      onClick={goToNext}
                      disabled={!currentLesson.next_lesson}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('nextLesson')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-4 font-medium">{t('noLessons')}</p>
                <Link href={`/courses/${courseId}`} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                  {t('backToCourse')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
