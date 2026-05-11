"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { requestPasswordReset, ApiError } from "@/lib/api";
import { sanitizeEmail, isValidEmail } from "@/lib/sanitize";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = sanitizeEmail(email);
    if (!isValidEmail(cleanEmail)) {
      setError("Введите корректный email адрес");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(cleanEmail);
      setSent(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.detail || "Произошла ошибка. Попробуйте позже");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">EduPlatform</span>
        </Link>

        {sent ? (
          /* Успешная отправка */
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Письмо отправлено</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Если аккаунт с адресом <strong>{email}</strong> существует, на него отправлена ссылка для сброса пароля. Проверьте почту.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              Ссылка действительна 1 час
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Вернуться к входу
            </Link>
          </div>
        ) : (
          /* Форма */
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Забыли пароль?</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Введите email вашего аккаунта, и мы отправим ссылку для сброса пароля
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                  maxLength={254}
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Отправка...
                  </>
                ) : (
                  "Отправить ссылку"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Вспомнили пароль?{" "}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700">
                Войти
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
