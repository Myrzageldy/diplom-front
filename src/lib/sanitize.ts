/**
 * Утилиты санитизации и валидации пользовательского ввода
 *
 * Защита от XSS (Cross-Site Scripting) путём экранирования
 * специальных HTML-символов перед выводом и обрезки опасных конструкций.
 *
 * Принцип: доверяй, но проверяй — весь пользовательский ввод
 * должен пройти санитизацию перед использованием.
 */

/**
 * Экранирует HTML-спецсимволы, предотвращая XSS при вставке в DOM.
 * Пример: '<script>' → '&lt;script&gt;'
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Нормализует строку: удаляет управляющие символы и лишние пробелы.
 * Ограничивает длину для защиты от DoS через гигантские строки.
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // управляющие символы кроме \t\n\r
    .slice(0, maxLength);
}

/**
 * Приводит email к нижнему регистру и обрезает до стандартного максимума (254 символа RFC 5321).
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 254);
}

/**
 * Проверяет email по RFC 5322 (упрощённый вариант).
 */
export function isValidEmail(email: string): boolean {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Проверяет имя пользователя: буквы Unicode (кириллица, латиница),
 * пробелы, дефисы и апострофы. Длина 2–100 символов.
 */
export function isValidName(name: string): boolean {
  const nameRegex = /^[\p{L}\p{M}\s'\-]{2,100}$/u;
  return nameRegex.test(name.trim());
}

/**
 * Санитизация поискового запроса: убирает кавычки и угловые скобки.
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>'"\\]/g, '')
    .slice(0, 200);
}

/**
 * Проверяет URL на допустимость (только http/https).
 * Защита от javascript: и data: URL-схем (XSS вектор).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Санитизирует объект данных, применяя sanitizeText ко всем строковым полям.
 * Удобно для обработки form data перед отправкой на API.
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data };
  for (const key in result) {
    if (typeof result[key] === 'string') {
      (result[key] as unknown) = sanitizeText(result[key] as string);
    }
  }
  return result;
}
