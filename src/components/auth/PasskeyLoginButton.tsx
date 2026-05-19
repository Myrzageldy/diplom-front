'use client';

/**
 * PasskeyLoginButton — кнопка «Войти через Passkey» на странице входа.
 *
 * Использует discoverable credentials flow (без ввода email):
 * 1. Запрашивает challenge (пустой allowCredentials)
 * 2. Вызывает navigator.credentials.get() — браузер показывает пикер
 *    (Windows Hello: «Выберите аккаунт для EduPlatform»)
 * 3. Отправляет подписанный assertion на сервер
 * 4. Получает JWT и перенаправляет на /dashboard
 */

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/lib/AuthContext';
import { setAuthCookie } from '@/lib/tokenSecurity';
import {
  isWebAuthnSupported,
  prepareAuthenticationOptions,
  serializeAuthenticationCredential,
  getWebAuthnErrorMessage,
  AuthenticationOptionsJSON,
} from '@/lib/webauthn';
import { passkeyLoginBegin, passkeyLoginComplete } from '@/lib/api';

interface PasskeyLoginButtonProps {
  /** Email пользователя (если уже введён в форме). Необязателен. */
  email?: string;
  /** Дополнительные CSS классы */
  className?: string;
}

type Step = 'idle' | 'waiting' | 'verifying' | 'done' | 'error';

export default function PasskeyLoginButton({
  email,
  className = '',
}: PasskeyLoginButtonProps) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');

  if (!isWebAuthnSupported()) {
    return null; // Не показываем кнопку если WebAuthn недоступен
  }

  const handleLogin = async () => {
    setStep('waiting');
    setError('');

    try {
      // Шаг 1: получаем challenge.
      // Если email указан — сервер вернёт allowCredentials для этого пользователя.
      // Если нет — discoverable flow, браузер сам определяет доступные passkeys.
      const { options: optionsJson, session_id } = await passkeyLoginBegin(email);

      // Подготавливаем опции для браузерного API
      const publicKeyOptions = prepareAuthenticationOptions(
        optionsJson as unknown as AuthenticationOptionsJSON
      );

      // Шаг 2: браузер показывает диалог выбора аккаунта (Windows Hello / Touch ID)
      // Пользователь выбирает аккаунт и проходит верификацию (PIN, биометрия)
      const credential = await navigator.credentials.get({ publicKey: publicKeyOptions });

      if (!credential || !(credential instanceof PublicKeyCredential)) {
        throw new Error('Аутентификатор не вернул учётные данные');
      }

      setStep('verifying');

      // Шаг 3: отправляем подписанный assertion на сервер
      const credentialJson = serializeAuthenticationCredential(credential);
      const result = await passkeyLoginComplete(
        session_id,
        credentialJson as unknown as Record<string, unknown>,
      );

      // Сохраняем токены и данные пользователя (тот же flow, что и обычный вход)
      localStorage.setItem('access_token', result.tokens.access);
      localStorage.setItem('refresh_token', result.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(result.user));
      setAuthCookie(result.user.role);

      setUser(result.user);
      setStep('done');

      // Редирект на главную страницу
      router.push('/');
    } catch (err) {
      setStep('error');

      if (err instanceof DOMException) {
        // Ошибки WebAuthn API (отмена, таймаут и др.)
        setError(getWebAuthnErrorMessage(err));
      } else if (err instanceof Error) {
        const msg = err.message || '';
        // Преобразуем серверные ошибки в понятные сообщения
        if (msg.includes('не найден') || msg.includes('not found')) {
          setError('Passkey не найден. Зарегистрируйте новый ключ в настройках.');
        } else if (msg.includes('подозрительная')) {
          setError(msg);
        } else {
          setError(msg || 'Не удалось войти через Passkey');
        }
      } else {
        setError('Произошла непредвиденная ошибка');
      }

      setTimeout(() => setStep('idle'), 100);
    }
  };

  const isLoading = step === 'waiting' || step === 'verifying';

  return (
    <div className={className}>
      {/* Сообщение об ошибке */}
      {error && step !== 'waiting' && step !== 'verifying' && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2.5 px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-sm transition-colors"
        title="Войти без пароля с помощью Windows Hello, Touch ID или USB-ключа"
      >
        {isLoading ? (
          <>
            <SpinnerIcon />
            <span>
              {step === 'waiting'
                ? 'Ожидаем аутентификатор...'
                : 'Проверяем на сервере...'}
            </span>
          </>
        ) : step === 'done' ? (
          <>
            <CheckIcon />
            <span>Вход выполнен!</span>
          </>
        ) : (
          <>
            <PasskeyIcon />
            <span>Войти через Passkey</span>
          </>
        )}
      </button>

      {isLoading && (
        <p className="mt-1.5 text-center text-xs text-slate-400 dark:text-slate-500">
          {step === 'waiting'
            ? 'Следуйте инструкциям: выберите аккаунт и подтвердите личность'
            : 'Верификация подписи...'}
        </p>
      )}
    </div>
  );
}

function PasskeyIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
