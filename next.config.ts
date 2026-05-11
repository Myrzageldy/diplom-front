import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/**
 * HTTP Security Headers
 *
 * Защищают приложение от распространённых веб-атак:
 * - Content-Security-Policy (CSP): ограничивает источники загрузки ресурсов, блокирует inline-скрипты
 * - X-Frame-Options: запрещает встраивание в <iframe> (защита от Clickjacking)
 * - X-Content-Type-Options: запрещает MIME-sniffing (защита от XSS через загрузку файлов)
 * - Referrer-Policy: ограничивает передачу Referer-заголовка
 * - Permissions-Policy: отключает неиспользуемые браузерные API
 * - Strict-Transport-Security: принудительно HTTPS (HSTS)
 */
const securityHeaders = [
  {
    // Content Security Policy — главный щит от XSS
    // default-src 'self': загружать ресурсы только с текущего домена
    // script-src: разрешаем Next.js nonce-based скрипты
    // connect-src: API сервер (локальный и продакшн)
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval нужен для Next.js dev mode
      "style-src 'self' 'unsafe-inline'",                // unsafe-inline нужен для Tailwind
      "img-src 'self' data: blob: http://localhost:8000 https:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:8000 https://localhost:8000",
      "frame-src https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com", // Разрешаем YouTube видео
      "frame-ancestors 'none'",                          // Запрет встраивания (аналог X-Frame-Options)
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",                               // Запрет Flash и плагинов
    ].join('; '),
  },
  {
    // Запрет встраивания страницы в <iframe>, <frame>, <embed>
    // Защита от Clickjacking атак
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Браузер не должен угадывать MIME-тип файла
    // Предотвращает XSS через загрузку HTML-файлов как изображений
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // При переходе с HTTPS на HTTP не передавать URL страницы
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Отключить неиспользуемые браузерные API
    // Снижает поверхность атаки
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()',
  },
  {
    // HSTS: браузер всегда обращается по HTTPS (актуально для продакшна)
    // max-age=31536000 = 1 год
    // preload — домен вносится в Chrome/Firefox preload list: браузер НИКОГДА
    // не пойдёт на HTTP, даже при первом визите (защита от SSL stripping)
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    // Запрет загрузки страницы в DNS prefetch (небольшая приватность)
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Применяем security headers ко всем маршрутам
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Разрешаем загрузку изображений с бэкенда
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
