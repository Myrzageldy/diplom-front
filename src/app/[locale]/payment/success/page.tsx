'use client';

import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id');

  return (
    <main className="max-w-md mx-auto px-4 py-8 pt-28 text-center">
      {/* Иконка */}
      <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Оплата прошла!</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">
        Вы успешно записались на курс. Можете начинать обучение прямо сейчас.
      </p>

      <div className="flex flex-col gap-3">
        {courseId && (
          <Link
            href={`/learn/${courseId}`}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Начать обучение
          </Link>
        )}
        <Link
          href="/courses"
          className="w-full py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Все курсы
        </Link>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      <Suspense>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
