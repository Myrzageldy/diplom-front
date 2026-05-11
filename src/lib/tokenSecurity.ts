/**
 * Утилиты для безопасной работы с JWT токенами
 *
 * Предоставляет функции для:
 * - Декодирования JWT payload (без проверки подписи — она на сервере)
 * - Проверки истечения срока действия токена
 * - Управления auth-cookie для серверного middleware
 */

interface JWTPayload {
  exp?: number;
  iat?: number;
  user_id?: number;
  [key: string]: unknown;
}

/**
 * Декодирует payload JWT токена (Base64url → JSON).
 * Проверка подписи выполняется исключительно на сервере.
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url → Base64 → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Проверяет, действителен ли токен (не истёк).
 * Добавляет буфер 30 секунд для учёта задержки сети.
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) return false;

  const bufferMs = 30 * 1000; // 30 секунд запаса
  return Date.now() < payload.exp * 1000 - bufferMs;
}

/**
 * Возвращает UNIX-timestamp (мс) истечения токена, или null.
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
}

/**
 * Возвращает true, если до истечения токена осталось менее 5 минут.
 * Используется для превентивного обновления.
 */
export function shouldRefreshToken(token: string): boolean {
  const payload = decodeJWTPayload(token);
  if (!payload || !payload.exp) return true;

  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() > payload.exp * 1000 - fiveMinutes;
}

/**
 * Устанавливает auth cookie для серверного middleware.
 * Cookie НЕ содержит токен — только флаг аутентификации.
 * SameSite=Strict защищает от CSRF-атак.
 */
export function setAuthCookie(role: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = 7 * 24 * 60 * 60; // 7 дней в секундах
  document.cookie = `auth_status=1; path=/; SameSite=Strict; max-age=${maxAge}`;
  document.cookie = `user_role=${role}; path=/; SameSite=Strict; max-age=${maxAge}`;
}

/**
 * Удаляет auth cookie при выходе из системы.
 */
export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'auth_status=; path=/; SameSite=Strict; max-age=0';
  document.cookie = 'user_role=; path=/; SameSite=Strict; max-age=0';
}

/**
 * Форматирует оставшееся время до истечения токена в читаемый вид.
 */
export function formatTokenTimeRemaining(token: string): string {
  const expiry = getTokenExpiry(token);
  if (!expiry) return 'Неизвестно';

  const remaining = expiry - Date.now();
  if (remaining <= 0) return 'Истёк';

  const minutes = Math.floor(remaining / 60000);
  if (minutes < 60) return `${minutes} мин.`;

  const hours = Math.floor(minutes / 60);
  return `${hours} ч. ${minutes % 60} мин.`;
}
