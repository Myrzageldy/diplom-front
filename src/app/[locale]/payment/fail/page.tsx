'use client';

import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-md mx-auto px-4 py-8 pt-28 text-center">
        {/* Иконка */}
        <div className="w-24 h-24 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/30">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">Оплата не прошла</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Что-то пошло не так. Проверьте данные карты и попробуйте ещё раз.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/courses"
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            Вернуться к курсам
          </Link>
        </div>
      </main>
    </div>
  );
}
