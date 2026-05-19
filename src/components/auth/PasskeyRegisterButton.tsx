'use client';

/**
 * PasskeyRegisterButton — кнопка добавления нового Passkey в настройках.
 *
 * Реализует WebAuthn Registration Ceremony (WebAuthn Level 3):
 * 1. Запрашивает challenge у сервера (begin)
 * 2. Вызывает navigator.credentials.create() — браузер/OS запускает аутентификатор
 * 3. Отправляет подписанный ответ на сервер (complete)
 * 4. При успехе вызывает onSuccess() для обновления списка ключей
 */

import { useState } from 'react';
import {
  isWebAuthnSupported,
  prepareRegistrationOptions,
  serializeRegistrationCredential,
  getWebAuthnErrorMessage,
  RegistrationOptionsJSON,
} from '@/lib/webauthn';
import { passkeyRegisterBegin, passkeyRegisterComplete, PasskeyCredential } from '@/lib/api';

interface PasskeyRegisterButtonProps {
  /** Вызывается после успешного добавления ключа */
  onSuccess: (passkey: PasskeyCredential) => void;
  /** Дополнительные CSS классы */
  className?: string;
}

type Step = 'idle' | 'naming' | 'waiting' | 'verifying' | 'done' | 'error';

export default function PasskeyRegisterButton({
  onSuccess,
  className = '',
}: PasskeyRegisterButtonProps) {
  const [step, setStep] = useState<Step>('idle');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isWebAuthnSupported()) {
    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm text-amber-700 dark:text-amber-300">
        Ваш браузер не поддерживает Passkey. Используйте Chrome, Edge или Safari последних версий.
      </div>
    );
  }

  const handleStart = () => {
    setError('');
    setName('');
    setStep('naming');
  };

  const handleRegister = async () => {
    const keyName = name.trim() || getDefaultKeyName();
    setStep('waiting');
    setError('');

    try {
      // Шаг 1: получаем challenge от сервера
      const { options: optionsJson, session_id } = await passkeyRegisterBegin();

      // Подготавливаем опции для браузерного API (base64url → ArrayBuffer)
      const publicKeyOptions = prepareRegistrationOptions(optionsJson as unknown as RegistrationOptionsJSON);

      // Шаг 2: браузер/ОС запускает аутентификатор (Windows Hello, Touch ID и т.д.)
      // Пользователь выполняет верификацию (PIN, отпечаток, Face ID...)
      const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });

      if (!credential || !(credential instanceof PublicKeyCredential)) {
        throw new Error('Аутентификатор не вернул учётные данные');
      }

      setStep('verifying');

      // Шаг 3: сериализуем ответ и отправляем на сервер для верификации
      const credentialJson = serializeRegistrationCredential(credential);
      const { passkey } = await passkeyRegisterComplete(
        session_id,
        credentialJson as unknown as Record<string, unknown>,
        keyName,
      );

      setStep('done');
      setName('');
      onSuccess(passkey);

      // Через 2 секунды возвращаемся в исходное состояние
      setTimeout(() => setStep('idle'), 2000);
    } catch (err) {
      setStep('error');
      // DOMException (NotAllowedError и др.) — понятное сообщение
      if (err instanceof DOMException) {
        setError(getWebAuthnErrorMessage(err));
      } else if (err instanceof Error) {
        setError(err.message || 'Не удалось добавить Passkey');
      } else {
        setError('Произошла непредвиденная ошибка');
      }
      setTimeout(() => setStep('idle'), 100);
    }
  };

  const handleCancel = () => {
    setStep('idle');
    setName('');
    setError('');
  };

  // Диалог ввода имени ключа
  if (step === 'naming') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Введите название для нового ключа (например: «Ноут Windows», «iPhone», «YubiKey»):
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
          placeholder={getDefaultKeyName()}
          maxLength={100}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleRegister}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Добавить ключ
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Сообщение об ошибке */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Кнопка добавления */}
      <button
        onClick={handleStart}
        disabled={step === 'waiting' || step === 'verifying'}
        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {step === 'waiting' ? (
          <>
            <SpinnerIcon />
            Ожидаем аутентификатор...
          </>
        ) : step === 'verifying' ? (
          <>
            <SpinnerIcon />
            Верификация на сервере...
          </>
        ) : step === 'done' ? (
          <>
            <CheckIcon />
            Passkey добавлен!
          </>
        ) : (
          <>
            <KeyIcon />
            Добавить Passkey
          </>
        )}
      </button>

      {(step === 'waiting' || step === 'verifying') && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {step === 'waiting'
            ? 'Следуйте инструкциям на экране (Windows Hello, Touch ID...)'
            : 'Проверяем ключ на сервере...'}
        </p>
      )}
    </div>
  );
}

/** Определяет название ключа по умолчанию на основе User-Agent */
function getDefaultKeyName(): string {
  if (typeof window === 'undefined') return 'Мой Passkey';
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iPhone / iPad';
  if (/Android/.test(ua)) return 'Android устройство';
  if (/Mac/.test(ua)) return 'Mac (Touch ID)';
  if (/Windows/.test(ua)) return 'Windows (Windows Hello)';
  return 'Мой Passkey';
}

function KeyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
