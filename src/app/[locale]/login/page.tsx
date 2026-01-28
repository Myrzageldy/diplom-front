"use client";

import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from 'next-intl';
import { loginUser, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const t = useTranslations('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser({ email, password });
      setUser(result.user);
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.detail) {
        setError(apiError.detail);
      } else {
        setError(t('errorDefault'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">EduPlatform</span>
          </Link>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 mb-8">
            {t('subtitle')}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">{t('rememberMe')}</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                {t('forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-gray-600">
            {t('noAccount')}{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right - image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-12">
        <div className="max-w-lg">
          <Image
            src="/undraw_taking-notes_oyqz.png"
            alt="Learning online"
            width={500}
            height={400}
            className="w-full h-auto"
            priority
          />
          <div className="text-center mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {t('sideTitle')}
            </h2>
            <p className="text-gray-600">
              {t('sideSubtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
