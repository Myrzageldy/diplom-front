# Документация: Разработка защищённого веб-приложения с использованием современных средств аутентификации и шифрования

**Проект:** EduPlatform KZ — Образовательная платформа
**Стек:** Next.js 16 + React 19 + TypeScript (фронтенд) / Django 5 + DRF + SimpleJWT (бэкенд)
**Язык:** Казахский / Русский

---

## Содержание

1. [Введение и обзор проекта](#1-введение)
2. [Архитектура системы](#2-архитектура)
3. [Стек технологий](#3-стек-технологий)
4. [JWT-аутентификация](#4-jwt-аутентификация)
5. [Ролевая модель доступа (RBAC)](#5-rbac)
6. [Защита маршрутов (Middleware)](#6-middleware)
7. [Безопасность HTTP-заголовков (CSP, HSTS, X-Frame)](#7-security-headers)
8. [Санитизация входных данных (XSS-защита)](#8-санитизация)
9. [Валидация надёжности пароля](#9-пароль)
10. [Защита от брутфорса (Rate Limiting)](#10-rate-limiting)
11. [Email-верификация](#11-email)
12. [Переменные окружения и управление секретами](#12-env)
13. [Аудит и логирование](#13-логирование)
14. [Шифрование и криптография](#14-криптография)
15. [CORS — защита от несанкционированных источников](#15-cors)
16. [Безопасность на уровне бэкенда](#16-бэкенд)
17. [Итоговая таблица реализованных мер](#17-итог)
18. [Рекомендации для production](#18-production)

---

## 1. Введение

### 1.1 О проекте

EduPlatform KZ — образовательная веб-платформа для Казахстана, предоставляющая услуги онлайн-обучения. Платформа поддерживает два типа пользователей:

- **Студент** — просматривает и проходит курсы, сдаёт тесты, получает сертификаты
- **Преподаватель** — создаёт и управляет курсами, материалами, тестами

### 1.2 Цель дипломной работы

Разработать современное защищённое веб-приложение, применив комплекс мер информационной безопасности на всех уровнях архитектуры. Исследовать и реализовать:

- Современные механизмы аутентификации (JWT, OAuth 2.0 концепции)
- Шифрование и безопасную передачу данных (HTTPS, TLS)
- Защиту от основных веб-уязвимостей (OWASP Top 10)
- Ролевую модель управления доступом (RBAC)
- Rate limiting и защиту от автоматизированных атак

### 1.3 Актуальность

По данным OWASP (Open Web Application Security Project), более 70% веб-приложений содержат критические уязвимости. В 2024–2025 годах количество кибератак выросло на 38%. Для образовательных платформ особенно важна защита персональных данных студентов (GDPR, Закон РК о персональных данных).

---

## 2. Архитектура

### 2.1 Общая схема

```
┌─────────────────────────────────────────────────────────┐
│                    КЛИЕНТ (Браузер)                       │
│  Next.js 16 SPA │ React 19 │ TypeScript │ Tailwind CSS   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / TLS 1.3
                         │ Bearer JWT Token
                         │
┌────────────────────────▼────────────────────────────────┐
│              БЭКЕНД (Django REST API)                     │
│  Django 5 │ DRF │ SimpleJWT │ CORS │ Rate Limiting        │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                     База данных                           │
│           SQLite (dev) / PostgreSQL (prod)                │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Структура фронтенда

```
src/
├── app/[locale]/          # Next.js App Router (локализованные страницы)
│   ├── login/             # Страница входа (rate limiting, санитизация)
│   ├── register/          # Регистрация (password strength, email verify)
│   ├── teacher/           # Защищённые маршруты преподавателя
│   └── learn/             # Защищённые маршруты студента
├── lib/
│   ├── api.ts             # API-клиент с JWT refresh и security utils
│   ├── AuthContext.tsx    # Контекст аутентификации с проверкой токена
│   ├── tokenSecurity.ts   # JWT утилиты (декодирование, проверка срока)
│   ├── sanitize.ts        # Санитизация входных данных (XSS-защита)
│   ├── passwordStrength.ts # Оценка надёжности пароля
│   └── rateLimiter.ts     # Клиентский rate limiter
├── middleware.ts           # Защита маршрутов (server-side)
└── next.config.ts         # Security headers (CSP, HSTS, X-Frame-Options)
```

### 2.3 Структура бэкенда

```
diplom-backend/
├── config/
│   └── settings.py        # Конфигурация безопасности, JWT, CORS, throttling
├── users/
│   ├── views.py           # Auth views с rate limiting и аудит-логами
│   ├── models.py          # User + EmailVerification модели
│   ├── serializers.py     # Валидация входных данных
│   └── throttles.py       # Кастомные throttle-классы (rate limiting)
└── courses/               # Бизнес-логика курсов
```

---

## 3. Стек технологий

### 3.1 Фронтенд

| Технология | Версия | Назначение |
|-----------|--------|-----------|
| Next.js | 16.1.4 | React-фреймворк с SSR, App Router, Middleware |
| React | 19.2.3 | UI-библиотека |
| TypeScript | 5.x | Типизированный JavaScript |
| Tailwind CSS | 4.x | Utility-first CSS-фреймворк |
| next-intl | 4.7.0 | Мультиязычность (RU/KK) |

### 3.2 Бэкенд

| Технология | Версия | Назначение |
|-----------|--------|-----------|
| Python | 3.11+ | Язык программирования |
| Django | 5.0.1 | Web-фреймворк |
| Django REST Framework | 3.14.0 | REST API |
| SimpleJWT | 5.3.1 | JWT-аутентификация с blacklist |
| django-cors-headers | 4.3.1 | CORS политика |
| python-dotenv | 1.0.0 | Управление env переменными |

---

## 4. JWT-аутентификация

### 4.1 Что такое JWT

**JSON Web Token (JWT)** — открытый стандарт (RFC 7519) для передачи данных между сторонами в виде JSON-объекта, который можно верифицировать и которому можно доверять, поскольку он подписан цифровой подписью.

### 4.2 Структура JWT

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← Header (алгоритм)
.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MDAwMDB9   ← Payload (данные + срок)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_    ← Signature (подпись)
```

- **Header**: тип токена и алгоритм подписи (HS256 — HMAC-SHA256)
- **Payload**: user_id, exp (время истечения), iat (время создания)
- **Signature**: `HMAC-SHA256(base64(Header) + "." + base64(Payload), SECRET_KEY)`

### 4.3 Схема работы в EduPlatform

```
Клиент                              Сервер
  │                                    │
  │─── POST /api/users/login/ ────────►│
  │    {email, password}               │ authenticate()
  │◄── {access: "JWT...", ────────────┤ PBKDF2-SHA256 verify
  │     refresh: "JWT..."}             │
  │                                    │
  │─── GET /api/courses/ ─────────────►│
  │    Authorization: Bearer {access}  │ JWTAuthentication
  │◄── [{id:1, title:...}] ───────────┤ verify HMAC + exp
  │                                    │
  │  (через 60 минут, access истёк)    │
  │                                    │
  │─── POST /api/users/token/refresh/ ►│
  │    {refresh: "JWT..."}             │ rotate + blacklist old
  │◄── {access: "NEW_JWT..."} ────────┤
```

### 4.4 Настройки JWT

```python
# config/settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),  # Access: 60 минут
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # Refresh: 7 дней
    'ROTATE_REFRESH_TOKENS': True,    # Каждый refresh выдаёт новый
    'BLACKLIST_AFTER_ROTATION': True, # Старый refresh блокируется
    'ALGORITHM': 'HS256',             # HMAC с SHA-256
}
```

**Почему 60 минут?** Это баланс между безопасностью и удобством. Если токен утечёт — он действует ограниченное время. Оригинально было 24 часа — небезопасно.

### 4.5 Клиентская проверка токена

```typescript
// src/lib/tokenSecurity.ts
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJWTPayload(token);  // base64 decode без verify
  if (!payload?.exp) return false;
  const bufferMs = 30 * 1000;  // 30 секунд запаса
  return Date.now() < payload.exp * 1000 - bufferMs;
}
```

### 4.6 Автоматическое обновление токена

```typescript
// src/lib/api.ts
async function fetchWithAuth(url, options) {
  let token = getAccessToken();

  // Превентивное обновление до истечения
  if (token && !isTokenValid(token)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) logoutUser();
    token = getAccessToken();
  }
  // ... запрос с токеном
  // При 401 — ещё одна попытка refresh
}
```

### 4.7 Инвалидация токена при logout

```python
# users/views.py
class LogoutView(APIView):
    def post(self, request):
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()  # Токен нельзя использовать даже до истечения
```

---

## 5. RBAC — Ролевая модель доступа

### 5.1 Теория RBAC

**Role-Based Access Control (RBAC)** — модель управления доступом, при которой права назначаются ролям, а не конкретным пользователям (NIST RBAC Model).

| Роль | Ресурс | Разрешение |
|------|--------|-----------|
| `student` | Курсы | Чтение, запись на курс |
| `student` | Уроки | Просмотр, отметка завершения |
| `student` | Тесты | Прохождение, просмотр результатов |
| `student` | Сертификаты | Получение, просмотр |
| `teacher` | Свои курсы | CRUD (создание, изменение, удаление) |
| `teacher` | Модули/Уроки | CRUD |
| `teacher` | Статистика | Просмотр прогресса студентов |

### 5.2 Реализация на бэкенде

```python
class TeacherCoursesView(APIView):
    permission_classes = [IsAuthenticated]  # Шаг 1: аутентификация

    def get(self, request):
        if request.user.role != 'teacher':  # Шаг 2: авторизация
            return Response({'detail': 'Доступ только для преподавателей'}, status=403)
        # Шаг 3: бизнес-логика
        courses = Course.objects.filter(teacher=request.user)
```

### 5.3 Реализация на фронтенде

```typescript
// src/middleware.ts
if (requiresTeacher(pathname) && isAuthenticated && userRole !== 'teacher') {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
```

**Важно:** фронтендная проверка роли — только UX. Реальная авторизация всегда на бэкенде.

---

## 6. Middleware — Защита маршрутов

### 6.1 Концепция

Next.js Middleware выполняется в **Edge Runtime** (сервер) до рендеринга страницы. Это позволяет проверять аутентификацию и делать редиректы без загрузки JS на клиенте.

### 6.2 Cookie-механизм

Поскольку JWT в `localStorage` недоступен серверу, при входе устанавливается специальный cookie:

```typescript
// src/lib/tokenSecurity.ts
export function setAuthCookie(role: string): void {
    // НЕ содержит JWT — только флаг аутентификации
    document.cookie = `auth_status=1; SameSite=Strict; max-age=604800`;
    document.cookie = `user_role=${role}; SameSite=Strict; max-age=604800`;
}
```

**SameSite=Strict** — cookie не отправляется при переходе с других сайтов, защита от CSRF.

### 6.3 Защищённые маршруты

| Путь | Требование |
|------|-----------|
| `/profile`, `/settings` | Аутентификация |
| `/learn/*` | Аутентификация |
| `/certificates/*` | Аутентификация |
| `/teacher/*` | Аутентификация + `role=teacher` |
| `/login`, `/register` | Только неаутентифицированные |

---

## 7. Security Headers

### 7.1 Content Security Policy (CSP)

CSP — механизм, позволяющий серверу указывать браузеру, какие ресурсы разрешено загружать. Главная защита от XSS.

```typescript
// next.config.ts
"Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "img-src 'self' data: http://localhost:8000 https:",
    "connect-src 'self' http://localhost:8000",
    "frame-ancestors 'none'",   // Нельзя встроить в iframe (Clickjacking)
    "object-src 'none'",        // Запрет Flash/Java плагинов
].join('; ')
```

### 7.2 Таблица заголовков

| Заголовок | Значение | Защита от |
|-----------|----------|-----------|
| X-Frame-Options | DENY | Clickjacking |
| X-Content-Type-Options | nosniff | MIME-sniffing XSS |
| Strict-Transport-Security | max-age=31536000 | SSL stripping |
| Referrer-Policy | strict-origin-when-cross-origin | Утечка URL |
| Permissions-Policy | camera=(), microphone=() | Нежелательные API |

---

## 8. Санитизация входных данных

### 8.1 Типы XSS

- **Reflected XSS**: вредоносный код отражается в ответе
- **Stored XSS**: код сохраняется в БД и выполняется у других пользователей
- **DOM-based XSS**: код внедряется через DOM без участия сервера

### 8.2 Реализация (src/lib/sanitize.ts)

```typescript
// Экранирование HTML
export function escapeHtml(input: string): string {
    return input
        .replace(/</g, '&lt;')   // Нельзя начать тег
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;') // Нельзя закрыть атрибут
        .replace(/'/g, '&#x27;');
}

// Валидация email (RFC 5322)
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@.../;
    return emailRegex.test(email) && email.length <= 254;
}

// Валидация имени (Unicode — кириллица + латиница)
export function isValidName(name: string): boolean {
    const nameRegex = /^[\p{L}\p{M}\s'\-]{2,100}$/u;
    return nameRegex.test(name.trim());
}
```

---

## 9. Валидация надёжности пароля

### 9.1 Стандарт NIST SP 800-63B

NIST рекомендует:
- Минимальная длина 8 символов
- Проверка против списка скомпрометированных паролей
- Запрет на использование только цифр
- Поддержка спецсимволов

### 9.2 Реализация (src/lib/passwordStrength.ts)

Пять критериев оценки:

```typescript
const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers:   /[0-9]/.test(password),
    special:   /[!@#$%^&*()\-_=+...]/.test(password),
};
// Балл 0–4 = количество пройденных критериев - 1
```

### 9.3 Визуальный индикатор

В форме регистрации пользователь видит:
- Цветную полосу: `█████░░░░░` (прогресс)
- Метку: «Очень слабый» → «Очень сильный»
- Чек-лист требований
- Конкретные подсказки по улучшению

**Кнопка «Зарегистрироваться» заблокирована пока пароль ниже уровня «Средний».**

---

## 10. Rate Limiting

### 10.1 Угроза брутфорса

При скорости 1000 запросов/сек. подбор 8-символьного пароля занял бы ~89 лет. Задача rate limiting — снизить скорость до допустимого для реального пользователя уровня.

### 10.2 Клиентский rate limiter (src/lib/rateLimiter.ts)

```typescript
const MAX_ATTEMPTS = 5;                      // Лимит
const WINDOW_MS = 15 * 60 * 1000;           // Окно: 15 минут
const BLOCK_DURATION_MS = 15 * 60 * 1000;  // Блокировка: 15 минут

// При неудачном входе:
recordFailedAttempt(email);

// Перед попыткой:
if (isRateLimited(email)) {
    showBlockedMessage(formatBlockedTime(email)); // мм:сс
    return;
}
```

### 10.3 Серверный rate limiter (users/throttles.py)

```python
class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'
    rate = '5/min'    # 5 попыток/минуту на IP

class SendCodeRateThrottle(AnonRateThrottle):
    scope = 'send_code'
    rate = '3/hour'   # 3 кода/час на IP
```

Серверный rate limiter работает на уровне IP и не зависит от клиента.

---

## 11. Email-верификация

### 11.1 Схема

```
1. Ввод email → POST /send-code/ → генерируем 6-цифровой код
2. Код отправляется на email через Gmail SMTP (TLS 587)
3. Пользователь вводит код → POST /verify-code/
4. Проверка: code == stored && created_at + 10 мин > now()
5. Регистрация разрешена только с is_verified=True
```

### 11.2 Защита кодов

- Длина 6 цифр = 1 000 000 комбинаций
- Срок действия: **10 минут**
- Rate limit: **3 кода/час**
- Одноразовость: новый запрос удаляет старые коды
- Клиент: `input.replace(/\D/g, "")` — только цифры

---

## 12. Переменные окружения

### 12.1 Принцип (12-Factor App)

Секреты **никогда** не должны быть в коде. Конфигурация — в среде выполнения.

### 12.2 Фронтенд

```bash
# .env.local (НЕ коммитить!)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_MEDIA_URL=http://localhost:8000
```

```typescript
// До: const API_URL = 'http://localhost:8000/api';
// После:
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
```

### 12.3 Бэкенд

```python
# Было (КРИТИЧЕСКИ НЕБЕЗОПАСНО):
EMAIL_HOST_PASSWORD = 'qtxz vwek kdmb lwkr'  # ← открытые credentials!

# Стало:
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
```

---

## 13. Аудит и логирование

### 13.1 Зачем нужны логи

- Обнаружение атак постфактум
- Расследование инцидентов безопасности
- Соответствие GDPR (ст. 33 — уведомление об утечках)

### 13.2 Что логируется

```python
# users/views.py
logger.info('Login success: email=%s ip=%s', email, ip)
logger.warning('Login failed: email=%s ip=%s', email, ip)
logger.info('User registered: email=%s role=%s ip=%s', ...)
logger.info('Logout: user=%s', ...)
```

Пример записи в `logs/security.log`:
```
[2025-01-15 14:23:01] SECURITY WARNING: Login failed: email=hacker@test.com ip=185.123.45.67
```

---

## 14. Шифрование и криптография

### 14.1 Хранение паролей (PBKDF2-SHA256)

```
hash = PBKDF2(password, salt, iterations=260000, hash=SHA256)
```

- **Salt**: уникальная случайная строка, защита от rainbow tables
- **260000 итераций**: делает подбор вычислительно дорогим
- В БД хранится: `pbkdf2_sha256$260000$<salt>$<hash>`

### 14.2 Подпись JWT (HMAC-SHA256)

```
Signature = HMAC-SHA256(base64(Header) + "." + base64(Payload), SECRET_KEY)
```

Изменение payload (например `role: student → teacher`) сделает подпись невалидной.

### 14.3 TLS/HTTPS

В production весь трафик шифруется **TLS 1.3**:
- **Конфиденциальность**: данные зашифрованы
- **Целостность**: данные не изменены
- **Аутентификация**: сервер подлинный (SSL-сертификат)

```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True  # HTTP → HTTPS
    SECURE_HSTS_SECONDS = 31536000
```

---

## 15. CORS

### 15.1 Проблема SOP

**Same-Origin Policy** — браузер запрещает JS делать запросы к другому домену. Без CORS фронтенд на `localhost:3000` не мог бы обращаться к API на `localhost:8000`.

### 15.2 Настройка

```python
# config/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Только наш фронтенд
]
CORS_ALLOW_CREDENTIALS = True   # Разрешает отправку Authorization header
```

В production — только реальный домен фронтенда.

---

## 16. Безопасность бэкенда

### 16.1 SQL-инъекции

Django ORM параметризует все запросы автоматически:

```python
# БЕЗОПАСНО — ORM экранирует параметры
Course.objects.filter(teacher=request.user, title__icontains=search)

# ОПАСНО — не используется
Course.objects.raw(f"SELECT * WHERE title='{search}'")
```

### 16.2 Валидация через Serializers

```python
class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()         # Формат email
    password = serializers.CharField(min_length=8)  # Минимум 8 символов

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Пароли не совпадают")
        return data
```

---

## 17. Итоговая таблица

| Мера безопасности | Где реализована | Статус |
|-------------------|-----------------|--------|
| JWT аутентификация | Frontend + Backend | ✅ |
| JWT blacklist (logout) | Backend (SimpleJWT) | ✅ |
| Refresh token rotation | Backend | ✅ |
| Проверка срока токена | Frontend (tokenSecurity.ts) | ✅ |
| Ролевая модель (RBAC) | Frontend + Backend | ✅ |
| Middleware защита маршрутов | Frontend (middleware.ts) | ✅ |
| Content Security Policy | Frontend (next.config.ts) | ✅ |
| X-Frame-Options: DENY | Frontend | ✅ |
| X-Content-Type-Options | Frontend | ✅ |
| HSTS | Frontend + Backend (prod) | ✅ |
| Referrer-Policy | Frontend | ✅ |
| Permissions-Policy | Frontend | ✅ |
| Санитизация email/name | Frontend (sanitize.ts) | ✅ |
| Индикатор надёжности пароля | Frontend (passwordStrength.ts) | ✅ |
| Блокировка слабых паролей | Frontend + Backend | ✅ |
| Rate limiting клиент | Frontend (rateLimiter.ts) | ✅ |
| Rate limiting сервер | Backend (throttles.py) | ✅ |
| Email верификация | Backend + Frontend | ✅ |
| Аудит логи | Backend | ✅ |
| Секреты в .env | Frontend + Backend | ✅ |
| CORS политика | Backend | ✅ |
| SQL injection защита | Backend (ORM) | ✅ |
| Шифрование паролей PBKDF2 | Backend (Django) | ✅ |
| HTTPS/TLS (production) | Backend (settings) | ✅ |
| Auth cookie SameSite=Strict | Frontend | ✅ |

---

## 18. Рекомендации для Production

### Обязательные шаги

1. Сгенерировать новый `SECRET_KEY`:
   ```python
   from django.core.management.utils import get_random_secret_key
   print(get_random_secret_key())
   ```

2. Установить `DEBUG=False` в `.env`

3. Переключить базу на **PostgreSQL**

4. Настроить SSL-сертификат (Let's Encrypt — бесплатно)

5. Обновить `CORS_ALLOWED_ORIGINS` и `ALLOWED_HOSTS`

### Дополнительные улучшения

- Двухфакторная аутентификация (TOTP)
- OAuth 2.0 вход через Google
- Мониторинг (Sentry, Prometheus)
- WAF (Web Application Firewall)
- Регулярный аудит зависимостей (`npm audit`, `safety check`)

---

## Заключение

В проекте EduPlatform KZ реализован комплексный подход к информационной безопасности:

**Концепции:**
1. **Stateless Auth** через JWT — масштабируемо, без зависимости от сессий
2. **Defence in Depth** — защита на каждом уровне: клиент, сеть, сервер, БД
3. **Принцип минимальных привилегий** — каждая роль имеет только нужные права
4. **Fail Secure** — при ошибке доступ закрывается, а не открывается
5. **Security by Design** — безопасность встроена в архитектуру

**Соответствие OWASP Top 10 (2023):**
- A01 Broken Access Control → RBAC + Middleware
- A02 Cryptographic Failures → HTTPS + PBKDF2 + JWT HS256
- A03 Injection → ORM + Sanitization
- A05 Security Misconfiguration → .env + Security Headers
- A07 Identification Failures → JWT + Email Verify + Rate Limiting

---

*Документация подготовлена в рамках дипломного проекта*
*«Разработка защищённого веб-приложения с использованием современных средств аутентификации и шифрования»*
