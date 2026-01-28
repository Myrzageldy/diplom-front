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

  // Load course progress
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

  // Load specific lesson
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

  // Initial load
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
        // Load first uncompleted lesson or first lesson
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

  // Mark lesson as completed
  const handleComplete = async () => {
    if (!currentLesson || currentLesson.is_completed) return;

    setCompleting(true);
    try {
      await completeLesson(currentLesson.id);
      // Refresh progress and current lesson
      await loadProgress();
      setCurrentLesson(prev => prev ? { ...prev, is_completed: true } : null);
    } catch (err) {
      console.error('Failed to complete lesson', err);
    } finally {
      setCompleting(false);
    }
  };

  // Navigate to lesson
  const goToLesson = (lessonId: number) => {
    loadLesson(lessonId);
  };

  // Navigate to next/prev lesson
  const goToNext = () => {
    if (currentLesson?.next_lesson) {
      loadLesson(currentLesson.next_lesson);
    }
  };

  const goToPrev = () => {
    if (currentLesson?.prev_lesson) {
      loadLesson(currentLesson.prev_lesson);
    }
  };

  // Extract video ID for embedding
  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <main className="pt-16">
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <Header />
        <main className="pt-16">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
            <p className="text-red-500 mb-4">{error}</p>
            <Link href="/courses" className="text-blue-600 hover:underline">
              {t('backToCourses')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />

      <main className="pt-16 flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-80' : 'w-0'
          } transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-4rem)] overflow-hidden flex-shrink-0`}
        >
          <div className="w-80 h-full overflow-y-auto">
            {/* Course header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                {progress.course_title}
              </h2>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>{t('progress')}</span>
                  <span>{progress.progress_percent}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${progress.progress_percent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {progress.completed_lessons} / {progress.total_lessons} {t('lessonsCompleted')}
                </p>
              </div>
            </div>

            {/* Modules list */}
            <div className="p-2">
              {progress.modules.map((module: ModuleProgress, moduleIndex: number) => (
                <div key={module.id} className="mb-2">
                  <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {t('module')} {moduleIndex + 1}: {module.title}
                  </div>

                  {/* Lessons */}
                  <ul className="mt-1 space-y-1">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <li key={lesson.id}>
                        <button
                          onClick={() => goToLesson(lesson.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                            currentLesson?.id === lesson.id
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {lesson.is_completed ? (
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="w-5 h-5 flex items-center justify-center text-xs text-gray-500 border border-gray-300 dark:border-gray-600 rounded-full flex-shrink-0">
                              {lessonIndex + 1}
                            </span>
                          )}
                          <span className="truncate">{lesson.title}</span>
                          {lesson.duration_minutes > 0 && (
                            <span className="ml-auto text-xs text-gray-500">
                              {lesson.duration_minutes} {t('min')}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Module test */}
                  {module.test && (
                    <Link
                      href={`/learn/${courseId}/test/${module.test.id}`}
                      className={`mt-1 w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                        module.test.is_passed
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {module.test.is_passed ? (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )}
                      <span className="truncate">{t('test')}: {module.test.title}</span>
                      {module.test.best_score !== null && (
                        <span className="ml-auto text-xs">
                          {module.test.best_score}%
                        </span>
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
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg p-2 shadow-md"
          style={{ marginLeft: sidebarOpen ? '320px' : '0' }}
        >
          <svg
            className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {lessonLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : currentLesson ? (
            <div className="max-w-4xl mx-auto p-6">
              {/* Video player */}
              {currentLesson.video_url && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
                  {getYoutubeEmbedUrl(currentLesson.video_url) ? (
                    <iframe
                      src={getYoutubeEmbedUrl(currentLesson.video_url)!}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={currentLesson.video_url}
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>
              )}

              {/* Lesson info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {currentLesson.module_title}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentLesson.title}
                    </h1>
                  </div>

                  {currentLesson.is_completed ? (
                    <span className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('completed')}
                    </span>
                  ) : (
                    <button
                      onClick={handleComplete}
                      disabled={completing}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                  <div className="prose dark:prose-invert max-w-none mt-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {currentLesson.description}
                    </p>
                  </div>
                )}

                {/* Materials */}
                {currentLesson.materials && currentLesson.materials.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      {t('materials')}
                    </h3>
                    <div className="space-y-2">
                      {currentLesson.materials.map((material) => (
                        <a
                          key={material.id}
                          href={material.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {material.title}
                            </p>
                            <p className="text-xs text-gray-500">{material.file_type}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={goToPrev}
                    disabled={!currentLesson.prev_lesson}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t('prevLesson')}
                  </button>

                  <Link
                    href={`/courses/${courseId}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {t('backToCourse')}
                  </Link>

                  <button
                    onClick={goToNext}
                    disabled={!currentLesson.next_lesson}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('nextLesson')}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {t('noLessons')}
                </p>
                <Link
                  href={`/courses/${courseId}`}
                  className="text-blue-600 hover:underline"
                >
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
