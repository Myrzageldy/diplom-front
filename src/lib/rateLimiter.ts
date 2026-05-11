/**
 * Фронтенд Rate Limiter — защита от брутфорса и флуда
 *
 * Отслеживает количество попыток аутентификации по идентификатору
 * (email пользователя) в скользящем временном окне.
 *
 * После MAX_ATTEMPTS неудачных попыток за WINDOW_MS миллисекунд
 * дальнейшие попытки блокируются на BLOCK_DURATION_MS.
 *
 * Примечание: это клиентская защита. Основная защита — на сервере.
 * Данная мера снижает нагрузку и улучшает UX (информирует пользователя).
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

const attemptsStore = new Map<string, AttemptRecord>();

/**
 * Проверяет, заблокирован ли данный идентификатор.
 */
export function isRateLimited(identifier: string): boolean {
  const record = attemptsStore.get(identifier);
  if (!record) return false;

  const now = Date.now();

  if (record.blockedUntil && now < record.blockedUntil) {
    return true;
  }

  if (now - record.firstAttempt > WINDOW_MS) {
    attemptsStore.delete(identifier);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

/**
 * Регистрирует неудачную попытку аутентификации.
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const existing = attemptsStore.get(identifier);

  if (!existing || now - existing.firstAttempt > WINDOW_MS) {
    attemptsStore.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      blockedUntil: null,
    });
    return;
  }

  const newCount = existing.count + 1;
  attemptsStore.set(identifier, {
    ...existing,
    count: newCount,
    lastAttempt: now,
    blockedUntil: newCount >= MAX_ATTEMPTS ? now + BLOCK_DURATION_MS : null,
  });
}

/**
 * Сбрасывает счётчик при успешном входе.
 */
export function clearAttempts(identifier: string): void {
  attemptsStore.delete(identifier);
}

/**
 * Возвращает оставшееся время блокировки в секундах (0 если не заблокирован).
 */
export function getBlockedSecondsRemaining(identifier: string): number {
  const record = attemptsStore.get(identifier);
  if (!record?.blockedUntil) return 0;
  return Math.max(0, Math.ceil((record.blockedUntil - Date.now()) / 1000));
}

/**
 * Возвращает количество оставшихся попыток до блокировки.
 */
export function getRemainingAttempts(identifier: string): number {
  const record = attemptsStore.get(identifier);
  if (!record) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - record.count);
}

/**
 * Форматирует оставшееся время блокировки в вид мм:сс.
 */
export function formatBlockedTime(identifier: string): string {
  const seconds = getBlockedSecondsRemaining(identifier);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
