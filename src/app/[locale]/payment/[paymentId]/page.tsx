'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { getPaymentStatus, confirmPayment } from '@/lib/api';
import Header from '@/components/Header';

export default function PaymentPage() {
  const params = useParams();
  const paymentId = params.paymentId as string;
  const router = useRouter();

  const [paymentInfo, setPaymentInfo] = useState<{ amount: number; course_title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  // Поля карты (mock — не отправляются на сервер)
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    loadPayment();
  }, [paymentId]);

  async function loadPayment() {
    try {
      const data = await getPaymentStatus(paymentId);
      if (data.status === 'paid') {
        router.replace(`/payment/success?course_id=${data.course_id}`);
        return;
      }
      if (data.status === 'failed') {
        router.replace('/payment/fail');
        return;
      }
      setPaymentInfo({ amount: data.amount, course_title: data.course_title });
    } catch {
      setError('Платёж не найден');
    } finally {
      setLoading(false);
    }
  }

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Введите полный номер карты');
      return;
    }
    if (!cardName.trim()) {
      setError('Введите имя держателя карты');
      return;
    }
    if (expiry.length < 5) {
      setError('Введите срок действия карты');
      return;
    }
    if (cvv.length < 3) {
      setError('Введите CVV/CVC код');
      return;
    }

    setPaying(true);
    setError('');
    try {
      const result = await confirmPayment(paymentId);
      if (result.enrolled) {
        router.replace(`/payment/success?course_id=${result.course_id}`);
      }
    } catch (err: any) {
      setError(err.detail || 'Ошибка оплаты. Попробуйте ещё раз.');
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="max-w-md mx-auto px-4 py-8 pt-28">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mx-auto" />
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error && !paymentInfo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <main className="max-w-md mx-auto px-4 py-8 pt-28 text-center">
          <p className="text-rose-500">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <main className="max-w-md mx-auto px-4 py-8 pt-28">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Оплата курса</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{paymentInfo?.course_title}</p>
        </div>

        {/* Сумма */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 mb-6 text-white text-center shadow-lg shadow-indigo-500/25">
          <p className="text-sm opacity-80 mb-1">К оплате</p>
          <p className="text-4xl font-extrabold">{paymentInfo?.amount?.toLocaleString()} <span className="text-2xl">₸</span></p>
        </div>

        {/* Форма */}
        <form onSubmit={handlePay} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">

          {/* Номер карты */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Номер карты</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-lg tracking-widest"
                maxLength={19}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                <div className="w-6 h-4 bg-red-500 rounded-sm opacity-80" />
                <div className="w-6 h-4 bg-yellow-400 rounded-sm opacity-80 -ml-2" />
              </div>
            </div>
          </div>

          {/* Имя */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Имя держателя</label>
            <input
              type="text"
              placeholder="IVAN IVANOV"
              value={cardName}
              onChange={e => setCardName(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wider"
              required
            />
          </div>

          {/* Срок и CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Срок действия</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                value={expiry}
                onChange={e => setExpiry(formatExpiry(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                maxLength={5}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CVV / CVC</label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="•••"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                maxLength={3}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={paying}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <span className="btn-spinner" />
                Обрабатываем...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Оплатить {paymentInfo?.amount?.toLocaleString()} ₸
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Защищённое соединение · Данные карты не сохраняются
          </p>
        </form>
      </main>
    </div>
  );
}
