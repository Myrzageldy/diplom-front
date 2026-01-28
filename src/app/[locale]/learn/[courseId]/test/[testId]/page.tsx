'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Header from "@/components/Header";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useTranslations } from 'next-intl';
import {
  startTest,
  submitTest,
  getTestResults,
  StudentTest,
  TestResult,
  TestAttemptResult,
} from "@/lib/api";

type TestState = 'loading' | 'info' | 'taking' | 'submitted' | 'results';

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);
  const testId = Number(params.testId);
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('test');

  const [state, setState] = useState<TestState>('loading');
  const [test, setTest] = useState<StudentTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [attempts, setAttempts] = useState<TestAttemptResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load test info
  const loadTest = useCallback(async () => {
    try {
      const data = await startTest(testId);
      setTest(data);
      setState('info');
      // Initialize answers
      const initialAnswers: Record<string, number[]> = {};
      data.questions.forEach(q => {
        initialAnswers[String(q.id)] = [];
      });
      setAnswers(initialAnswers);
    } catch (err: unknown) {
      const error = err as { detail?: string };
      setError(error.detail || 'Failed to load test');
    }
  }, [testId]);

  // Load test results
  const loadResults = useCallback(async () => {
    try {
      const data = await getTestResults(testId);
      setAttempts(data.attempts);
    } catch (err) {
      console.error('Failed to load results', err);
    }
  }, [testId]);

  // Initial load
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    loadTest();
    loadResults();
  }, [authLoading, user, router, loadTest, loadResults]);

  // Timer
  useEffect(() => {
    if (state !== 'taking' || !test?.time_limit_minutes || timeLeft === null) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [state, test, timeLeft]);

  // Start test
  const handleStart = () => {
    setState('taking');
    if (test?.time_limit_minutes) {
      setTimeLeft(test.time_limit_minutes * 60);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: number, answerId: number, questionType: 'single' | 'multiple') => {
    setAnswers(prev => {
      const key = String(questionId);
      if (questionType === 'single') {
        return { ...prev, [key]: [answerId] };
      } else {
        const current = prev[key] || [];
        if (current.includes(answerId)) {
          return { ...prev, [key]: current.filter(id => id !== answerId) };
        } else {
          return { ...prev, [key]: [...current, answerId] };
        }
      }
    });
  };

  // Submit test
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const data = await submitTest(testId, answers);
      setResult(data);
      setState('submitted');
      await loadResults();
    } catch (err: unknown) {
      const error = err as { detail?: string };
      setError(error.detail || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  // View results
  const handleViewResults = () => {
    setState('results');
  };

  // Retry test
  const handleRetry = async () => {
    setResult(null);
    setAnswers({});
    await loadTest();
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || state === 'loading') {
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
            <Link href={`/learn/${courseId}`} className="text-blue-600 hover:underline">
              {t('backToCourse')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Test Info State */}
          {state === 'info' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {test.title}
              </h1>
              {test.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {test.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('questions')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {test.questions_count}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('passingScore')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {test.passing_score}%
                  </p>
                </div>
                {test.time_limit_minutes > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('timeLimit')}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {test.time_limit_minutes} {t('minutes')}
                    </p>
                  </div>
                )}
                {test.attempts_allowed > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('attemptsLeft')}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {test.attempts_allowed - attempts.length} / {test.attempts_allowed}
                    </p>
                  </div>
                )}
              </div>

              {/* Previous attempts */}
              {attempts.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                    {t('previousAttempts')}
                  </h3>
                  <div className="space-y-2">
                    {attempts.slice(0, 3).map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          attempt.is_passed
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                        }`}
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {t('attempt')} #{attempts.length - index}
                        </span>
                        <span className={`font-medium ${
                          attempt.is_passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleStart}
                  disabled={test.attempts_allowed > 0 && attempts.length >= test.attempts_allowed}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {attempts.length > 0 ? t('retake') : t('startTest')}
                </button>
                <Link
                  href={`/learn/${courseId}`}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('backToCourse')}
                </Link>
              </div>
            </div>
          )}

          {/* Taking Test State */}
          {state === 'taking' && (
            <div>
              {/* Timer bar */}
              {timeLeft !== null && (
                <div className="fixed top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
                  <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {test.title}
                    </span>
                    <span className={`font-mono text-lg ${
                      timeLeft < 60 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              )}

              <div className={`space-y-6 ${timeLeft !== null ? 'pt-16' : ''}`}>
                {test.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">
                          {question.text}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {question.question_type === 'single' ? t('selectOne') : t('selectMultiple')}
                          {question.points > 1 && ` • ${question.points} ${t('points')}`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 ml-12">
                      {question.answers.map((answer) => {
                        const isSelected = answers[String(question.id)]?.includes(answer.id);
                        return (
                          <button
                            key={answer.id}
                            onClick={() => handleAnswerSelect(question.id, answer.id, question.question_type)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {question.question_type === 'single' ? (
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-blue-500' : 'border-gray-300 dark:border-gray-500'
                                }`}>
                                  {isSelected && (
                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                  )}
                                </div>
                              ) : (
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-500'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              )}
                              <span className="text-gray-900 dark:text-white">
                                {answer.text}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Submit button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? t('submitting') : t('submit')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Submitted State */}
          {state === 'submitted' && result && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
              <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                result.is_passed
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {result.is_passed ? (
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {result.is_passed ? t('passed') : t('failed')}
              </h2>

              <p className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                {result.score}%
              </p>

              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('passingScore')}: {result.passing_score}%
              </p>

              <div className="flex gap-4 justify-center">
                {!result.is_passed && test.attempts_allowed > 0 && attempts.length < test.attempts_allowed && (
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    {t('tryAgain')}
                  </button>
                )}
                <Link
                  href={`/learn/${courseId}`}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('backToCourse')}
                </Link>
              </div>
            </div>
          )}

          {/* Results State */}
          {state === 'results' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('allAttempts')}
              </h2>

              <div className="space-y-3">
                {attempts.map((attempt, index) => (
                  <div
                    key={attempt.id}
                    className={`flex items-center justify-between p-4 rounded-xl ${
                      attempt.is_passed
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {t('attempt')} #{attempts.length - index}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(attempt.started_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        attempt.is_passed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attempt.score}%
                      </p>
                      <p className="text-sm text-gray-500">
                        {attempt.is_passed ? t('passed') : t('failed')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <Link
                  href={`/learn/${courseId}`}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
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
