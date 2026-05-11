/**
 * Валидатор надёжности пароля
 *
 * Оценивает пароль по 5 критериям NIST SP 800-63B:
 * - Длина (минимум 8 символов)
 * - Наличие заглавных букв
 * - Наличие строчных букв
 * - Наличие цифр
 * - Наличие специальных символов
 *
 * Результат — числовой балл 0–4 и набор рекомендаций.
 */

export type PasswordStrengthLevel =
  | 'very-weak'
  | 'weak'
  | 'medium'
  | 'strong'
  | 'very-strong';

export interface PasswordChecks {
  length: boolean;      // >= 8 символов
  uppercase: boolean;   // A-Z
  lowercase: boolean;   // a-z
  numbers: boolean;     // 0-9
  special: boolean;     // !@#$%...
}

export interface PasswordStrengthResult {
  score: number;                  // 0–4
  level: PasswordStrengthLevel;
  label: string;                  // Читаемое название
  color: string;                  // CSS-цвет для индикатора
  widthPercent: number;           // Ширина прогресс-бара (20–100%)
  checks: PasswordChecks;
  suggestions: string[];          // Что улучшить
}

const LEVELS: { level: PasswordStrengthLevel; label: string; color: string; widthPercent: number }[] = [
  { level: 'very-weak',   label: 'Очень слабый',   color: '#ef4444', widthPercent: 20  },
  { level: 'weak',        label: 'Слабый',          color: '#f97316', widthPercent: 40  },
  { level: 'medium',      label: 'Средний',         color: '#eab308', widthPercent: 60  },
  { level: 'strong',      label: 'Сильный',         color: '#22c55e', widthPercent: 80  },
  { level: 'very-strong', label: 'Очень сильный',   color: '#16a34a', widthPercent: 100 },
];

/**
 * Проверяет пароль и возвращает подробный результат оценки.
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const checks: PasswordChecks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers:   /[0-9]/.test(password),
    special:   /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(password),
  };

  // Балл = количество пройденных проверок минус 1 (чтобы начинать с 0)
  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.max(0, Math.min(4, passed - 1));

  const suggestions: string[] = [];
  if (!checks.length)    suggestions.push('Используйте не менее 8 символов');
  if (!checks.uppercase) suggestions.push('Добавьте заглавные буквы (A-Z)');
  if (!checks.lowercase) suggestions.push('Добавьте строчные буквы (a-z)');
  if (!checks.numbers)   suggestions.push('Добавьте цифры (0-9)');
  if (!checks.special)   suggestions.push('Добавьте спецсимволы (!@#$%^&*)');

  return {
    score,
    ...LEVELS[score],
    checks,
    suggestions,
  };
}

/**
 * Возвращает true, если пароль приемлем (оценка >= medium).
 * Минимальный порог для регистрации.
 */
export function isPasswordAcceptable(password: string): boolean {
  return checkPasswordStrength(password).score >= 2;
}

/**
 * Проверяет минимальные требования к паролю:
 * - Длина >= 8
 * - Строчные и заглавные буквы
 * - Цифра или спецсимвол
 */
export function meetsMinimumRequirements(password: string): boolean {
  const { checks } = checkPasswordStrength(password);
  return checks.length && checks.uppercase && checks.lowercase && (checks.numbers || checks.special);
}
