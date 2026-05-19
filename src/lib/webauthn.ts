/**
 * lib/webauthn.ts — Утилиты для работы с WebAuthn / Passkey API
 *
 * Браузерный WebAuthn API работает с ArrayBuffer, а сервер
 * передаёт данные в формате base64url (URL-safe Base64 без padding).
 *
 * Этот модуль содержит:
 * 1. Конверторы base64url ↔ ArrayBuffer
 * 2. Подготовку опций для navigator.credentials.create()
 * 3. Подготовку опций для navigator.credentials.get()
 * 4. Сериализацию ответов браузера в JSON для сервера
 */

// ────────────────────────────────────────────────────────────────────────────────
// Конверторы base64url ↔ ArrayBuffer
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Конвертирует строку base64url в ArrayBuffer.
 *
 * base64url отличается от стандартного base64:
 *   '+' → '-'  (безопасно для URL)
 *   '/' → '_'  (безопасно для URL)
 *   '=' → ''   (без padding)
 */
export function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  // Восстанавливаем стандартный base64 из base64url
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Конвертирует ArrayBuffer в строку base64url.
 */
export function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// ────────────────────────────────────────────────────────────────────────────────
// Типы данных
// ────────────────────────────────────────────────────────────────────────────────

/** Опции для регистрации (с сервера, все бинарные данные в base64url) */
export interface RegistrationOptionsJSON {
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  pubKeyCredParams: { type: string; alg: number }[];
  timeout?: number;
  excludeCredentials?: { id: string; type: string; transports?: string[] }[];
  authenticatorSelection?: {
    authenticatorAttachment?: string;
    residentKey?: string;
    requireResidentKey?: boolean;
    userVerification?: string;
  };
  attestation?: string;
}

/** Опции для входа (с сервера, все бинарные данные в base64url) */
export interface AuthenticationOptionsJSON {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: { id: string; type: string; transports?: string[] }[];
  userVerification?: string;
}

/** Credential от navigator.credentials.create() в JSON-формате для сервера */
export interface RegistrationCredentialJSON {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports: string[];
  };
}

/** Credential от navigator.credentials.get() в JSON-формате для сервера */
export interface AuthenticationCredentialJSON {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Подготовка опций для браузерного API
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Конвертирует опции регистрации из JSON (сервер) в формат браузера.
 *
 * Браузерный API работает с ArrayBuffer, а не с base64url строками.
 * Эта функция делает нужные преобразования.
 */
export function prepareRegistrationOptions(
  json: RegistrationOptionsJSON
): PublicKeyCredentialCreationOptions {
  return {
    rp: json.rp,
    user: {
      id: base64urlToArrayBuffer(json.user.id),
      name: json.user.name,
      displayName: json.user.displayName,
    },
    challenge: base64urlToArrayBuffer(json.challenge),
    pubKeyCredParams: json.pubKeyCredParams as PublicKeyCredentialParameters[],
    timeout: json.timeout,
    excludeCredentials: json.excludeCredentials?.map((cred) => ({
      id: base64urlToArrayBuffer(cred.id),
      type: cred.type as PublicKeyCredentialType,
      transports: cred.transports as AuthenticatorTransport[],
    })),
    authenticatorSelection: json.authenticatorSelection as AuthenticatorSelectionCriteria,
    attestation: json.attestation as AttestationConveyancePreference,
  };
}

/**
 * Конвертирует опции входа из JSON (сервер) в формат браузера.
 */
export function prepareAuthenticationOptions(
  json: AuthenticationOptionsJSON
): PublicKeyCredentialRequestOptions {
  return {
    challenge: base64urlToArrayBuffer(json.challenge),
    timeout: json.timeout,
    rpId: json.rpId,
    allowCredentials: json.allowCredentials?.map((cred) => ({
      id: base64urlToArrayBuffer(cred.id),
      type: cred.type as PublicKeyCredentialType,
      transports: cred.transports as AuthenticatorTransport[],
    })),
    userVerification: json.userVerification as UserVerificationRequirement,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Сериализация ответов браузера для сервера
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Конвертирует результат navigator.credentials.create() в JSON для сервера.
 *
 * Все ArrayBuffer поля конвертируем в base64url строки.
 */
export function serializeRegistrationCredential(
  credential: PublicKeyCredential
): RegistrationCredentialJSON {
  const response = credential.response as AuthenticatorAttestationResponse;

  // getTransports() — метод WebAuthn Level 3, показывает транспорты ключа
  const transports: string[] = typeof response.getTransports === 'function'
    ? response.getTransports()
    : [];

  return {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64url(response.attestationObject),
      transports,
    },
  };
}

/**
 * Конвертирует результат navigator.credentials.get() в JSON для сервера.
 */
export function serializeAuthenticationCredential(
  credential: PublicKeyCredential
): AuthenticationCredentialJSON {
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
      authenticatorData: arrayBufferToBase64url(response.authenticatorData),
      signature: arrayBufferToBase64url(response.signature),
      // userHandle присутствует при discoverable credentials flow
      userHandle: response.userHandle
        ? arrayBufferToBase64url(response.userHandle)
        : undefined,
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Проверка поддержки WebAuthn в браузере
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Проверяет, поддерживает ли браузер WebAuthn / Passkey API.
 *
 * Все современные браузеры (Chrome 67+, Firefox 60+, Safari 14+, Edge 79+)
 * поддерживают WebAuthn. Internet Explorer и старые браузеры — нет.
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator.credentials !== 'undefined'
  );
}

/**
 * Проверяет доступность платформенного аутентификатора (Windows Hello, Touch ID).
 *
 * Асинхронная проверка: возвращает true если устройство поддерживает
 * встроенный аутентификатор (биометрия или PIN через TPM/Secure Enclave).
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Человекочитаемые ошибки WebAuthn
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Конвертирует DOMException в понятное пользователю сообщение на русском.
 *
 * Основные ошибки WebAuthn API:
 * - NotAllowedError: пользователь отменил или истёк таймаут
 * - InvalidStateError: этот ключ уже зарегистрирован
 * - SecurityError: неправильный origin (origin ≠ RP ID)
 * - NotSupportedError: аутентификатор не поддерживает алгоритм
 * - AbortError: операция была прервана программно
 */
export function getWebAuthnErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Произошла неизвестная ошибка';
  }

  switch (error.name) {
    case 'NotAllowedError':
      return 'Аутентификация отменена или истёк таймаут (60 секунд). Попробуйте снова.';
    case 'InvalidStateError':
      return 'Этот ключ уже зарегистрирован. Используйте другое устройство или удалите существующий ключ.';
    case 'SecurityError':
      return 'Ошибка безопасности: неправильный домен (origin). Убедитесь, что открываете сайт с правильного адреса.';
    case 'NotSupportedError':
      return 'Ваш аутентификатор не поддерживает требуемый алгоритм шифрования.';
    case 'AbortError':
      return 'Операция была прервана. Попробуйте снова.';
    case 'ConstraintError':
      return 'Не удалось создать ключ: аутентификатор не поддерживает требования безопасности.';
    case 'UnknownError':
      return 'Аутентификатор вернул неизвестную ошибку. Попробуйте другой ключ безопасности.';
    default:
      return error.message || 'Произошла ошибка при работе с Passkey';
  }
}
