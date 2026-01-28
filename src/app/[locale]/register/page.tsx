"use client";

import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from 'next-intl';
import { registerUser, sendVerificationCode, verifyCode, ApiError, UserRole } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

type Step = 1 | 2 | 3 | 4;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const t = useTranslations('register');
  const tCommon = useTranslations('common');

  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
    setError("");
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendVerificationCode(email);
      setStep(3);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.email) {
        setError(apiError.email.join(". "));
      } else if (apiError.detail) {
        setError(apiError.detail);
      } else {
        setError(t('step2.errorDefault'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await verifyCode(email, code);
      setStep(4);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code) {
        setError(apiError.code.join(". "));
      } else if (apiError.detail) {
        setError(apiError.detail);
      } else {
        setError(t('step3.errorDefault'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t('step4.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        name,
        email,
        password,
        password_confirm: confirmPassword,
        role,
      });
      setUser(result.user);
      router.push("/");
    } catch (err) {
      const apiError = err as ApiError;
      const errors: string[] = [];
      if (apiError.detail) errors.push(apiError.detail);
      if (apiError.email) errors.push(...apiError.email);
      if (apiError.password) errors.push(...apiError.password);
      if (apiError.name) errors.push(...apiError.name);

      setError(errors.join(". ") || t('step4.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await sendVerificationCode(email);
      alert(t('step3.resendSuccess'));
    } catch {
      setError(t('step2.errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              s < step
                ? "bg-green-500 text-white"
                : s === step
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {s < step ? "✓" : s}
          </div>
          {s < 4 && (
            <div className={`w-8 h-1 ${s < step ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );

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

          <ProgressBar />

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('step1.title')}
              </h1>
              <p className="text-gray-600 mb-8">
                {t('step1.subtitle')}
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect("student")}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl group-hover:bg-blue-200 transition-colors">
                      🎓
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('step1.student')}</h3>
                      <p className="text-gray-600 text-sm">{t('step1.studentDesc')}</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect("teacher")}
                  className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-3xl group-hover:bg-purple-200 transition-colors">
                      👨‍🏫
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('step1.teacher')}</h3>
                      <p className="text-gray-600 text-sm">{t('step1.teacherDesc')}</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Email */}
          {step === 2 && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="mb-4 text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← {tCommon('back')}
              </button>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('step2.title')}
              </h1>
              <p className="text-gray-600 mb-8">
                {t('step2.subtitle')}
              </p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('step2.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? t('step2.submitting') : t('step2.submit')}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Code verification */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="mb-4 text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← {tCommon('back')}
              </button>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('step3.title')}
              </h1>
              <p className="text-gray-600 mb-8">
                {t('step3.subtitle')} <span className="font-medium">{email}</span>
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('step3.code')}
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t('step3.codePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-center text-2xl tracking-widest"
                    required
                    autoFocus
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? t('step3.submitting') : t('step3.submit')}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="w-full py-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  {t('step3.resend')}
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Name and password */}
          {step === 4 && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('step4.title')}
              </h1>
              <p className="text-gray-600 mb-8">
                {t('step4.subtitle')}
              </p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('step4.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('step4.namePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('step4.password')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('step4.passwordPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('step4.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('step4.confirmPasswordPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                    {t('step4.terms')}{" "}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                      {t('step4.termsLink')}
                    </Link>{" "}
                    {t('step4.and')}{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                      {t('step4.privacyLink')}
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mt-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? t('step4.submitting') : t('step4.submit')}
                </button>
              </form>
            </div>
          )}

          {/* Login link */}
          <p className="mt-8 text-center text-gray-600">
            {t('hasAccount')}{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right - image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-50 to-purple-100 items-center justify-center p-12">
        <div className="max-w-lg">
          <Image
            src="/undraw_exam-prep_nmly.png"
            alt="Start learning"
            width={500}
            height={400}
            className="w-full h-auto"
            priority
          />
          <div className="text-center mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {role === "student" ? t('sideStudent.title') : t('sideTeacher.title')}
            </h2>
            <p className="text-gray-600">
              {role === "student" ? t('sideStudent.subtitle') : t('sideTeacher.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
