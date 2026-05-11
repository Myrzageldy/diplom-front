"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { use } from "react";
import { confirmPasswordReset, ApiError } from "@/lib/api";
import { checkPasswordStrength } from "@/lib/passwordStrength";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; password_confirm?: string }>({});
  const [success, setSuccess] = useState(false);

  const strength = checkPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (password !== passwordConfirm) {
      setFieldErrors({ password_confirm: "Пароли не совпадают" });
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(token, password, passwordConfirm);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      const apiError = err as ApiError & { password?: string[]; password_confirm?: string[] };
      if (apiError.password) {
        setFieldErrors({ password: apiError.password[0] });
      } else if (apiError.password_confirm) {
        setFieldErrors({ password_confirm: apiError.password_confirm[0] });
      } else {
        setError(apiError.detail || "Произошла ошибка. Попробуйте запросить сброс пароля заново");
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Пароль изменён!</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Вы будете перенаправлены на страницу входа через несколько секунд...
          </p>
          <Link href="/login" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm">
            Войти сейчас
          </Link>
        </div>
      </div>
    );
  }

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

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Новый пароль</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Придумайте надёжный пароль для вашего аккаунта</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Новый пароль */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Новый пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                className={`w-full px-4 py-3 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${fieldErrors.password ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                required
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
            )}

            {/* Индикатор надёжности */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strengthColors[strength.score] : 'bg-gray-200 dark:bg-gray-700'}`}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Подтверждение */}
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Повторите пароль
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Повторите пароль"
              className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${fieldErrors.password_confirm ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
              required
              autoComplete="new-password"
            />
            {fieldErrors.password_confirm && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password_confirm}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 8}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Сохранение...
              </>
            ) : (
              "Сохранить новый пароль"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700">
            Вернуться к входу
          </Link>
        </p>
      </div>
    </div>
  );
}
