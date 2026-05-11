/**
 * Next.js Middleware — защита маршрутов и интернационализация
 *
 * Выполняется на сервере (Edge Runtime) перед каждым запросом.
 * Объединяет две задачи:
 * 1. Локализация (next-intl) — перенаправление по локали
 * 2. Защита маршрутов — редирект неаутентифицированных пользователей
 *
 * Механизм аутентификации в middleware:
 * - При входе клиент устанавливает cookie `auth_status=1` и `user_role=teacher|student`
 * - Middleware читает эти cookie для проверки доступа
 * - Cookie НЕ содержат JWT — только флаги состояния сессии
 * - Реальная проверка JWT происходит на бэкенде при каждом API-запросе
 */

import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Маршруты, требующие аутентификации (без префикса локали)
const PROTECTED_PATHS = [
  '/profile',
  '/settings',
  '/learn',
  '/certificates',
  '/teacher',
];

// Маршруты, недоступные для авторизованных пользователей
const GUEST_ONLY_PATHS = [
  '/login',
  '/register',
];

/**
 * Извлекает путь без префикса локали.
 * Пример: /ru/profile → /profile, /kk/teacher/courses → /teacher/courses
 */
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(ru|kk)/, '') || '/';
}

/**
 * Проверяет, требует ли путь аутентификации.
 */
function requiresAuth(pathname: string): boolean {
  const path = stripLocale(pathname);
  return PROTECTED_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

/**
 * Проверяет, предназначен ли путь только для гостей.
 */
function isGuestOnly(pathname: string): boolean {
  const path = stripLocale(pathname);
  return GUEST_ONLY_PATHS.some((p) => path === p || path.startsWith(p + '/'));
}

/**
 * Проверяет, требует ли путь роли преподавателя.
 */
function requiresTeacher(pathname: string): boolean {
  const path = stripLocale(pathname);
  return path === '/teacher' || path.startsWith('/teacher/');
}

export default function middleware(request: NextRequest) {
  // CVE-2025-29927: блокируем заголовок x-middleware-subrequest.
  // Злоумышленник мог подделать этот внутренний заголовок, чтобы Next.js
  // пропустил весь middleware и обошёл аутентификацию.
  // Хотя Next.js 16+ уже исправил это на уровне фреймворка, оставляем
  // явную проверку как защиту в глубину (defense-in-depth).
  if (request.headers.get('x-middleware-subrequest')) {
    return new NextResponse(null, { status: 400 });
  }

  const { pathname } = request.nextUrl;

  // Читаем auth-cookie (устанавливаются клиентом при входе)
  const authStatus = request.cookies.get('auth_status')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const isAuthenticated = authStatus === '1';

  // 1. Авторизованный пользователь не должен видеть login/register
  if (isGuestOnly(pathname) && isAuthenticated) {
    const locale = pathname.match(/^\/(ru|kk)/)?.[1] ?? 'ru';
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // 2. Защищённые маршруты доступны только авторизованным
  if (requiresAuth(pathname) && !isAuthenticated) {
    const locale = pathname.match(/^\/(ru|kk)/)?.[1] ?? 'ru';
    const loginUrl = new URL(`/${locale}/login`, request.url);
    // Сохраняем исходный URL для редиректа после входа
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Раздел /teacher доступен только преподавателям
  if (requiresTeacher(pathname) && isAuthenticated && userRole !== 'teacher') {
    const locale = pathname.match(/^\/(ru|kk)/)?.[1] ?? 'ru';
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Передаём запрос в next-intl middleware (обработка локали)
  return intlMiddleware(request);
}

export const config = {
  // Применяем middleware ко всем маршрутам кроме статических файлов и API
  matcher: ['/', '/(ru|kk)/:path*', '/((?!api|_next|.*\\..*).*)'],
};
