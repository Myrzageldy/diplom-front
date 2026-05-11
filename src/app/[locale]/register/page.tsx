"use client";

import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import { registerUser, sendVerificationCode, verifyCode, ApiError, UserRole } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { checkPasswordStrength, isPasswordAcceptable } from "@/lib/passwordStrength";
import { sanitizeEmail, sanitizeText, isValidEmail, isValidName } from "@/lib/sanitize";

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
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startResendCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const passwordStrength = checkPasswordStrength(password);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(2);
    setError("");
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = sanitizeEmail(email);
    if (!isValidEmail(cleanEmail)) {
      setError("Введите корректный email адрес");
      return;
    }

    setLoading(true);
    try {
      await sendVerificationCode(cleanEmail);
      setStep(3);
      startResendCooldown();
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
      await verifyCode(sanitizeEmail(email), code);
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

    const cleanName = sanitizeText(name);
    if (!isValidName(cleanName)) {
      setError("Имя должно содержать от 2 до 100 символов");
      return;
    }

    if (!isPasswordAcceptable(password)) {
      setError("Пароль слишком слабый. Используйте буквы разного регистра, цифры и спецсимволы.");
      return;
    }

    if (password !== confirmPassword) {
      setError(t('step4.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        name: cleanName,
        email: sanitizeEmail(email),
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
      await sendVerificationCode(sanitizeEmail(email));
      startResendCooldown();
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
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            {s < step ? "✓" : s}
          </div>
          {s < 4 && (
            <div className={`w-8 h-1 ${s < step ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
          )}
        </div>
      ))}
    </div>
  );

  const EyeIcon = ({ crossed }: { crossed: boolean }) => crossed ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const PasswordStrengthIndicator = () => {
    if (!password) return null;
    return (
      <div className="mt-2 space-y-1">
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${passwordStrength.widthPercent}%`, backgroundColor: passwordStrength.color }}
          />
        </div>
        <p className="text-xs font-medium" style={{ color: passwordStrength.color }}>
          {passwordStrength.label}
        </p>
        {showPasswordHints && passwordStrength.suggestions.length > 0 && (
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mt-1">
            {passwordStrength.suggestions.map((s, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="text-orange-400">•</span> {s}
              </li>
            ))}
          </ul>
        )}
        {showPasswordHints && (
          <div className="grid grid-cols-2 gap-1 mt-1">
            {[
              { ok: passwordStrength.checks.length,    label: '8+ символов' },
              { ok: passwordStrength.checks.uppercase, label: 'Заглавные' },
              { ok: passwordStrength.checks.lowercase, label: 'Строчные' },
              { ok: passwordStrength.checks.numbers,   label: 'Цифры' },
              { ok: passwordStrength.checks.special,   label: 'Спецсимволы' },
            ].map(({ ok, label }) => (
              <span
                key={label}
                className={`text-xs flex items-center gap-1 ${ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
              >
                {ok ? '✓' : '○'} {label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const eyeBtnClass = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors";

  return (
    <div className="min-h-screen flex">
      {/* Left - form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">EduPlatform</span>
          </Link>

          <ProgressBar />

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Role selection */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('step1.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('step1.subtitle')}
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => handleRoleSelect("student")}
                  className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-3xl group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      🎓
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('step1.student')}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{t('step1.studentDesc')}</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect("teacher")}
                  className="w-full p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-3xl group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      👨‍🏫
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('step1.teacher')}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{t('step1.teacherDesc')}</p>
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
                className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
              >
                ← {tCommon('back')}
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('step2.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('step2.subtitle')}
              </p>
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label htmlFor="email" className={labelClass}>
                    {t('step2.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className={inputClass}
                    required
                    autoFocus
                    maxLength={254}
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><span className="btn-spinner" />{t('step2.submitting')}</> : t('step2.submit')}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Code verification */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="mb-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
              >
                ← {tCommon('back')}
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('step3.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('step3.subtitle')} <span className="font-medium text-gray-900 dark:text-white">{email}</span>
              </p>
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code" className={labelClass}>
                    {t('step3.code')}
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder={t('step3.codePlaceholder')}
                    className={`${inputClass} text-center text-2xl tracking-widest`}
                    required
                    autoFocus
                    maxLength={6}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><span className="btn-spinner" />{t('step3.submitting')}</> : t('step3.submit')}
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading || resendCooldown > 0}
                  className="w-full py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed text-sm transition-colors"
                >
                  {resendCooldown > 0
                    ? `${t('step3.resend')} (${resendCooldown}с)`
                    : t('step3.resend')}
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Name and password */}
          {step === 4 && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('step4.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {t('step4.subtitle')}
              </p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="name" className={labelClass}>
                    {t('step4.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('step4.namePlaceholder')}
                    className={inputClass}
                    required
                    autoFocus
                    maxLength={100}
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>
                    {t('step4.password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setShowPasswordHints(true)}
                      placeholder={t('step4.passwordPlaceholder')}
                      className={`${inputClass} pr-12`}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={eyeBtnClass} tabIndex={-1}>
                      <EyeIcon crossed={showPassword} />
                    </button>
                  </div>
                  <PasswordStrengthIndicator />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>
                    {t('step4.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('step4.confirmPasswordPlaceholder')}
                      className={`${inputClass} pr-12 ${
                        confirmPassword && confirmPassword !== password
                          ? '!border-red-400 !bg-red-50 dark:!bg-red-900/20 dark:!border-red-500/50'
                          : ''
                      }`}
                      required
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={eyeBtnClass} tabIndex={-1}>
                      <EyeIcon crossed={showConfirm} />
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">Пароли не совпадают</p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <label className="uiv-checkbox-label mt-0.5">
                    <input type="checkbox" id="terms" required />
                    <div className="uiv-checkmark" />
                  </label>
                  <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 leading-snug cursor-pointer">
                    {t('step4.terms')}{" "}
                    <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      {t('step4.termsLink')}
                    </Link>{" "}
                    {t('step4.and')}{" "}
                    <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                      {t('step4.privacyLink')}
                    </Link>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPasswordAcceptable(password) || password !== confirmPassword}
                  className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mt-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? <><span className="btn-spinner" />{t('step4.submitting')}</> : t('step4.submit')}
                </button>
              </form>
            </div>
          )}

          {/* Login link */}
          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            {t('hasAccount')}{" "}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right - image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 items-center justify-center p-12">
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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {role === "student" ? t('sideStudent.title') : t('sideTeacher.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {role === "student" ? t('sideStudent.subtitle') : t('sideTeacher.subtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
