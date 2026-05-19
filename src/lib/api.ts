/**
 * API модуль для связи с бэкендом
 *
 * Здесь все функции для отправки запросов на Django сервер.
 * URL-адреса берутся из переменных окружения (.env.local),
 * что позволяет легко переключаться между dev и production.
 */

import { setAuthCookie, clearAuthCookie, isTokenValid } from './tokenSecurity';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL ?? 'http://localhost:8000';

/**
 * Получить полный URL для медиа-файла
 */
export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${MEDIA_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Обёртка для fetch с обработкой 401 ошибки
 * При истёкшем токене пробует обновить через refresh token
 */
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = getAccessToken();

  // Если токен истёк — сразу пробуем обновить, не тратя запрос
  if (token && !isTokenValid(token)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      await logoutUser();
    }
    token = getAccessToken();
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(url, { ...options, headers });

  // Если 401 (сервер отклонил) и есть refresh токен — повторная попытка
  if (response.status === 401 && localStorage.getItem('refresh_token')) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
      }
      response = await fetch(url, { ...options, headers });
    } else {
      await logoutUser();
    }
  }

  return response;
}

/**
 * Обновить access token через refresh token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      return true;
    }
  } catch {
    // Ошибка сети - ничего не делаем
  }

  return false;
}

// Типы данных
export type UserRole = 'student' | 'teacher';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  date_joined: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface ApiError {
  detail?: string;
  email?: string[];
  password?: string[];
  password_confirm?: string[];
  name?: string[];
  code?: string[];
}

// Типы для курсов
export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string | null;
  teacher_name: string;
  category_name: string | null;
  students_count: number;
  rating: number | null;
  is_published: boolean;
  created_at: string;
}

export interface TeacherCoursesResponse {
  courses: Course[];
  total: number;
  published: number;
  drafts: number;
}

export interface TeacherStats {
  courses_count: number;
  published_count: number;
  students_count: number;
}

/**
 * Отправка кода верификации на email
 */
export async function sendVerificationCode(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/users/send-code/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Проверка кода верификации
 */
export async function verifyCode(email: string, code: string): Promise<{ message: string; verified: boolean }> {
  const response = await fetch(`${API_URL}/users/verify-code/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Регистрация нового пользователя
 */
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  password_confirm: string;
  role: UserRole;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/users/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  // Сохраняем токены в localStorage
  localStorage.setItem('access_token', result.tokens.access);
  localStorage.setItem('refresh_token', result.tokens.refresh);
  localStorage.setItem('user', JSON.stringify(result.user));

  // Устанавливаем auth cookie для серверного middleware (без JWT, только флаг)
  setAuthCookie(result.user.role);

  return result;
}

/**
 * Вход в аккаунт
 */
export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse | { requires_2fa: true; temp_token: string }> {
  const response = await fetch(`${API_URL}/users/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError & { locked?: boolean; locked_until?: string };
  }

  // Шаг 1 двухфакторной аутентификации — токены ещё не выданы
  if (result.requires_2fa) {
    return result as { requires_2fa: true; temp_token: string };
  }

  // Сохраняем токены в localStorage
  localStorage.setItem('access_token', result.tokens.access);
  localStorage.setItem('refresh_token', result.tokens.refresh);
  localStorage.setItem('user', JSON.stringify(result.user));

  // Устанавливаем auth cookie для серверного middleware (без JWT, только флаг)
  setAuthCookie(result.user.role);

  return result;
}

/**
 * Выход из аккаунта
 *
 * Инвалидирует refresh token на сервере (blacklist), затем очищает
 * локальные данные сессии. Защита от кражи refresh token: даже украденный
 * токен перестаёт работать сразу после вызова logout.
 *
 * ВАЖНО: даже если запрос к серверу не прошёл — локальная сессия всё равно
 * очищается (пользователь выходит на клиенте).
 */
export async function logoutUser(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token');
  const accessToken = localStorage.getItem('access_token');

  // Инвалидируем refresh token на сервере (добавляем в blacklist)
  if (refreshToken) {
    try {
      await fetch(`${API_URL}/users/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Ошибка сети — всё равно очищаем локально
    }
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // Очищаем auth cookie — middleware перестанет пускать на защищённые маршруты
  clearAuthCookie();
}

/**
 * Получить текущего пользователя из localStorage
 */
export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
}

/**
 * Проверить авторизован ли пользователь
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

/**
 * Получить access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Обновить профиль пользователя
 */
export async function updateProfile(data: { name: string }): Promise<{ message: string; user: User }> {
  const response = await fetchWithAuth(`${API_URL}/users/profile/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  // Обновляем пользователя в localStorage
  localStorage.setItem('user', JSON.stringify(result.user));

  return result;
}

/**
 * Удалить аккаунт пользователя
 * Требует подтверждение паролем, после чего чистит localStorage и cookie
 */
export async function deleteAccount(password: string): Promise<{ message: string }> {
  const refreshToken = localStorage.getItem('refresh_token');

  const response = await fetchWithAuth(`${API_URL}/users/delete-account/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, refresh: refreshToken }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  // Очищаем всё локально после успешного удаления
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  clearAuthCookie();

  return result;
}

/**
 * Получить профиль с сервера
 */
export async function fetchProfile(): Promise<User> {
  const response = await fetchWithAuth(`${API_URL}/users/profile/`);

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  // Обновляем пользователя в localStorage
  localStorage.setItem('user', JSON.stringify(result));

  return result;
}

// ============================================
// КУРСЫ
// ============================================

/**
 * Получить список курсов
 */
export async function getCourses(params?: { search?: string; category?: string }): Promise<Course[]> {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.category) searchParams.set('category', params.category);

  const url = `${API_URL}/courses/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

  const response = await fetch(url);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Получить список категорий
 */
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/courses/categories/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Получить курсы преподавателя
 */
export async function getTeacherCourses(): Promise<TeacherCoursesResponse> {
  const response = await fetchWithAuth(`${API_URL}/courses/my/`);

  if (!response.ok) {
    let error: ApiError = {};
    try { error = await response.json(); } catch { /* ignore parse error */ }
    throw error;
  }

  return response.json();
}

/**
 * Получить статистику преподавателя
 */
export async function getTeacherStats(): Promise<TeacherStats> {
  const response = await fetchWithAuth(`${API_URL}/courses/stats/`);

  if (!response.ok) {
    let error: ApiError = {};
    try { error = await response.json(); } catch { /* ignore parse error */ }
    throw error;
  }

  return response.json();
}

// ============================================
// СОЗДАНИЕ/РЕДАКТИРОВАНИЕ КУРСОВ
// ============================================

export interface CourseDetail extends Course {
  teacher?: User;
  category?: Category;
  modules?: Module[];
  is_enrolled?: boolean;
  enable_certificate?: boolean;
  modules_count?: number;
}

export interface Module {
  id: number;
  title: string;
  description: string;
  order: number;
  is_published: boolean;
  lessons_count: number;
  has_test: boolean;
  lessons?: Lesson[];
  created_at: string;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  video_url: string;
  order: number;
  duration_minutes: number;
  is_published: boolean;
  materials_count?: number;
  materials?: LessonMaterial[];
  module_title?: string;
  course_id?: number;
  created_at: string;
}

export interface LessonMaterial {
  id: number;
  title: string;
  file: string;
  file_type: string;
  uploaded_at: string;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
  attempts_allowed: number;
  is_published: boolean;
  questions_count: number;
  questions?: Question[];
  created_at: string;
}

export interface Question {
  id: number;
  text: string;
  question_type: 'single' | 'multiple';
  order: number;
  points: number;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  text: string;
  is_correct: boolean;
  order: number;
}

/**
 * Создать новый курс
 */
export async function createCourse(data: {
  title: string;
  description: string;
  category_id?: number | null;
  category_name?: string;
  price?: number;
  enable_certificate?: boolean;
  certificate_title?: string;
}): Promise<Course> {
  const response = await fetchWithAuth(`${API_URL}/courses/my/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Получить детали курса (для учителя)
 */
export async function getTeacherCourseDetail(id: number): Promise<CourseDetail> {
  const response = await fetchWithAuth(`${API_URL}/courses/my/${id}/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Обновить курс
 */
export async function updateCourse(id: number, data: Partial<{
  title: string;
  description: string;
  category_id: number | null;
  price: number;
  is_published: boolean;
  enable_certificate: boolean;
  certificate_title: string;
}>): Promise<Course> {
  const response = await fetchWithAuth(`${API_URL}/courses/my/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Удалить курс
 */
export async function deleteCourse(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/courses/my/${id}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw result as ApiError;
  }
}

/**
 * Загрузить обложку курса
 */
export async function uploadCourseImage(courseId: number, file: File): Promise<Course> {
  const formData = new FormData();
  formData.append('image', file);

  const token = getAccessToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/courses/my/${courseId}/upload-image/`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

// ============================================
// МОДУЛИ
// ============================================

/**
 * Создать модуль
 */
export async function createModule(courseId: number, data: {
  title: string;
  description?: string;
}): Promise<Module> {
  const response = await fetchWithAuth(`${API_URL}/courses/${courseId}/modules/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Обновить модуль
 */
export async function updateModule(id: number, data: Partial<{
  title: string;
  description: string;
  order: number;
  is_published: boolean;
}>): Promise<Module> {
  const response = await fetchWithAuth(`${API_URL}/courses/modules/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Удалить модуль
 */
export async function deleteModule(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/courses/modules/${id}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw result as ApiError;
  }
}

// ============================================
// УРОКИ
// ============================================

/**
 * Создать урок
 */
export async function createLesson(moduleId: number, data: {
  title: string;
  description?: string;
  video_url?: string;
  duration_minutes?: number;
}): Promise<Lesson> {
  const response = await fetchWithAuth(`${API_URL}/courses/modules/${moduleId}/lessons/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Обновить урок
 */
export async function updateLesson(id: number, data: Partial<{
  title: string;
  description: string;
  video_url: string;
  order: number;
  duration_minutes: number;
  is_published: boolean;
}>): Promise<Lesson> {
  const response = await fetchWithAuth(`${API_URL}/courses/lessons/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Удалить урок
 */
export async function deleteLesson(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/courses/lessons/${id}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw result as ApiError;
  }
}

// ============================================
// ТЕСТЫ
// ============================================

/**
 * Получить тест модуля
 */
export async function getModuleTest(moduleId: number): Promise<Test> {
  const response = await fetchWithAuth(`${API_URL}/courses/modules/${moduleId}/test/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Создать тест
 */
export async function createTest(moduleId: number, data: {
  title: string;
  description?: string;
  passing_score?: number;
  time_limit_minutes?: number;
  attempts_allowed?: number;
}): Promise<Test> {
  const response = await fetchWithAuth(`${API_URL}/courses/modules/${moduleId}/test/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Обновить тест
 */
export async function updateTest(moduleId: number, data: Partial<{
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
  attempts_allowed: number;
  is_published: boolean;
}>): Promise<Test> {
  const response = await fetchWithAuth(`${API_URL}/courses/modules/${moduleId}/test/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Удалить тест
 */
export async function deleteTest(moduleId: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/courses/modules/${moduleId}/test/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw result as ApiError;
  }
}

/**
 * Добавить вопрос к тесту
 */
export async function createQuestion(testId: number, data: {
  text: string;
  question_type: 'single' | 'multiple';
  points?: number;
  answers: { text: string; is_correct: boolean }[];
}): Promise<Question> {
  const response = await fetchWithAuth(`${API_URL}/courses/tests/${testId}/questions/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Обновить вопрос
 */
export async function updateQuestion(id: number, data: Partial<{
  text: string;
  question_type: 'single' | 'multiple';
  order: number;
  points: number;
  answers: { text: string; is_correct: boolean }[];
}>): Promise<Question> {
  const response = await fetchWithAuth(`${API_URL}/courses/questions/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Удалить вопрос
 */
export async function deleteQuestion(id: number): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/courses/questions/${id}/`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const result = await response.json();
    throw result as ApiError;
  }
}

// ============================================
// ПУБЛИЧНЫЕ КУРСЫ (для студентов)
// ============================================

/**
 * Получить детали курса (публичный)
 */
export async function getCourseDetail(id: number): Promise<CourseDetail> {
  // Используем fetchWithAuth - если токен истёк, он обновится или очистится
  const response = await fetchWithAuth(`${API_URL}/courses/${id}/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Записаться на курс
 */
export async function enrollCourse(courseId: number): Promise<{ message: string }> {
  const response = await fetchWithAuth(`${API_URL}/courses/${courseId}/enroll/`, {
    method: 'POST',
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Инициализировать платёж за курс
 */
export async function initPayment(courseId: number): Promise<{ payment_id: string; amount: number; course_title: string } | { enrolled: boolean }> {
  const response = await fetchWithAuth(`${API_URL}/courses/${courseId}/payment/init/`, {
    method: 'POST',
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Подтвердить оплату (mock)
 */
export async function confirmPayment(paymentId: string): Promise<{ enrolled: boolean; course_id: number }> {
  const response = await fetchWithAuth(`${API_URL}/courses/payment/${paymentId}/confirm/`, {
    method: 'POST',
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Получить статус платежа
 */
export async function getPaymentStatus(paymentId: string): Promise<{ status: string; course_id: number; amount: number; course_title: string }> {
  const response = await fetchWithAuth(`${API_URL}/courses/payment/${paymentId}/status/`);
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Получить записи студента на курсы
 */
export interface Enrollment {
  id: number;
  course: Course;
  enrolled_at: string;
}

export async function getEnrollments(): Promise<Enrollment[]> {
  const response = await fetchWithAuth(`${API_URL}/courses/enrolled/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

// ============================================
// ОБУЧЕНИЕ СТУДЕНТА
// ============================================

export interface LessonDetail extends Lesson {
  is_completed?: boolean;
  prev_lesson?: number | null;
  next_lesson?: number | null;
}

export interface ModuleProgress {
  id: number;
  title: string;
  lessons: {
    id: number;
    title: string;
    is_completed: boolean;
    video_url: string;
    duration_minutes: number;
  }[];
  test?: {
    id: number;
    title: string;
    is_passed: boolean;
    best_score: number | null;
    attempts_count: number;
  } | null;
}

export interface CourseProgress {
  course_id: number;
  course_title: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  modules: ModuleProgress[];
}

/**
 * Получить прогресс по курсу
 */
export async function getCourseProgress(courseId: number): Promise<CourseProgress> {
  const response = await fetchWithAuth(`${API_URL}/courses/${courseId}/progress/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Получить урок для просмотра студентом
 */
export async function getStudentLesson(lessonId: number): Promise<LessonDetail> {
  const response = await fetchWithAuth(`${API_URL}/courses/learn/lessons/${lessonId}/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Отметить урок как завершённый
 */
export async function completeLesson(lessonId: number): Promise<{ detail: string }> {
  const response = await fetchWithAuth(`${API_URL}/courses/lessons/${lessonId}/complete/`, {
    method: 'POST',
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

// ============================================
// ТЕСТЫ ДЛЯ СТУДЕНТА
// ============================================

export interface StudentTest {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number;
  attempts_allowed: number;
  questions_count: number;
  questions: {
    id: number;
    text: string;
    question_type: 'single' | 'multiple';
    order: number;
    points: number;
    answers: {
      id: number;
      text: string;
      order: number;
    }[];
  }[];
}

export interface TestResult {
  attempt_id: number;
  score: number;
  is_passed: boolean;
  passing_score: number;
}

export interface TestAttemptResult {
  id: number;
  test: number;
  test_title: string;
  score: number;
  is_passed: boolean;
  started_at: string;
  finished_at: string;
}

/**
 * Начать тест (получить вопросы)
 */
export async function startTest(testId: number): Promise<StudentTest> {
  const response = await fetchWithAuth(`${API_URL}/courses/tests/${testId}/start/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Отправить ответы теста
 */
export async function submitTest(testId: number, answers: Record<string, number[]>): Promise<TestResult> {
  const response = await fetchWithAuth(`${API_URL}/courses/tests/${testId}/submit/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Получить результаты теста
 */
export async function getTestResults(testId: number): Promise<{
  test_title: string;
  passing_score: number;
  attempts: TestAttemptResult[];
}> {
  const response = await fetchWithAuth(`${API_URL}/courses/tests/${testId}/results/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

// ============================================
// СЕРТИФИКАТЫ
// ============================================

export interface Certificate {
  id: number;
  certificate_number: string;
  student_name: string;
  course_title: string;
  issued_at: string;
  pdf_file?: string;
}

export interface CertificateVerification {
  valid: boolean;
  certificate?: {
    certificate_number: string;
    student_name: string;
    course_title: string;
    teacher_name: string;
    issued_at: string;
  };
}

/**
 * Получить сертификат курса (или запросить генерацию)
 */
export async function getCourseCertificate(courseId: number): Promise<Certificate> {
  const response = await fetchWithAuth(`${API_URL}/courses/${courseId}/certificate/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Получить все мои сертификаты
 */
export async function getMyCertificates(): Promise<Certificate[]> {
  const response = await fetchWithAuth(`${API_URL}/courses/certificates/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Проверить сертификат по номеру
 */
export async function verifyCertificate(certificateNumber: string): Promise<CertificateVerification> {
  const response = await fetch(`${API_URL}/courses/certificates/${certificateNumber}/verify/`);

  const result = await response.json();

  if (!response.ok) {
    return { valid: false };
  }

  return result;
}

// ============================================
// УЧЕНИКИ УЧИТЕЛЯ
// ============================================

export interface StudentProgress {
  id: number;
  student: {
    id: number;
    name: string;
    email: string;
  };
  course: {
    id: number;
    title: string;
  };
  enrolled_at: string;
  progress_percent: number;
  completed_lessons: number;
  total_lessons: number;
  last_activity: string | null;
  tests_passed: number;
  tests_total: number;
  average_score: number | null;
}

export interface TeacherStudentsResponse {
  students: StudentProgress[];
  total_students: number;
  total_enrollments: number;
}

/**
 * Получить учеников учителя с прогрессом
 */
export async function getTeacherStudents(courseId?: number): Promise<TeacherStudentsResponse> {
  const params = courseId ? `?course_id=${courseId}` : '';
  const response = await fetchWithAuth(`${API_URL}/courses/my/students/${params}`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Получить детальную информацию об ученике
 */
export interface StudentDetail {
  student: {
    id: number;
    name: string;
    email: string;
    date_joined: string;
  };
  enrollments: {
    course_id: number;
    course_title: string;
    enrolled_at: string;
    progress_percent: number;
    completed_lessons: number;
    total_lessons: number;
    last_activity: string | null;
    test_results: {
      test_id: number;
      test_title: string;
      module_title: string;
      score: number;
      is_passed: boolean;
      attempts_count: number;
      last_attempt: string;
    }[];
  }[];
}

export async function getStudentDetail(studentId: number): Promise<StudentDetail> {
  const response = await fetchWithAuth(`${API_URL}/courses/my/students/${studentId}/`);
  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

// ─── 2FA / TOTP ───────────────────────────────────────────────────────────────

export interface TOTPSetupData {
  secret: string;
  qr_code: string;  // data:image/png;base64,...
  uri: string;
}

export async function getTOTPSetup(): Promise<TOTPSetupData> {
  const response = await fetchWithAuth(`${API_URL}/users/2fa/setup/`);
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

export async function confirmTOTPSetup(code: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`${API_URL}/users/2fa/setup/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

export async function disableTOTP(password: string, code: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`${API_URL}/users/2fa/disable/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, code }),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

export async function verifyTOTPLogin(
  temp_token: string,
  code: string
): Promise<{ message: string; user: User; tokens: { access: string; refresh: string } }> {
  const response = await fetch(`${API_URL}/users/2fa/verify-login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temp_token, code }),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;

  localStorage.setItem('access_token', result.tokens.access);
  localStorage.setItem('refresh_token', result.tokens.refresh);
  localStorage.setItem('user', JSON.stringify(result.user));
  setAuthCookie(result.user.role);

  return result;
}

// ─── Сброс пароля ─────────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/users/password-reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

export async function confirmPasswordReset(
  token: string,
  password: string,
  password_confirm: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/users/password-reset/confirm/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password, password_confirm }),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

// ─── WebAuthn / Passkey ────────────────────────────────────────────────────────

/** Данные одного passkey (как возвращает сервер) */
export interface PasskeyCredential {
  id: string;
  name: string;
  device_type: 'platform' | 'cross-platform';
  transports: string[];
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
}

/** Ответ сервера на успешный вход через passkey */
export interface PasskeyLoginResponse {
  message: string;
  user: User;
  tokens: { access: string; refresh: string };
}

/**
 * Шаг 1 регистрации passkey: запрашиваем challenge у сервера.
 * Требует JWT (пользователь должен быть авторизован).
 */
export async function passkeyRegisterBegin(): Promise<{
  options: Record<string, unknown>;
  session_id: string;
}> {
  const response = await fetchWithAuth(`${API_URL.replace('/api', '')}/api/auth/passkey/register/begin/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Шаг 2 регистрации passkey: отправляем подписанный ответ аутентификатора.
 */
export async function passkeyRegisterComplete(
  session_id: string,
  credential: Record<string, unknown>,
  name: string,
): Promise<{ message: string; passkey: PasskeyCredential }> {
  const response = await fetchWithAuth(`${API_URL.replace('/api', '')}/api/auth/passkey/register/complete/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, credential, name }),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Шаг 1 входа через passkey: получаем challenge.
 * email опционален — без него используется discoverable credentials flow.
 */
export async function passkeyLoginBegin(email?: string): Promise<{
  options: Record<string, unknown>;
  session_id: string;
}> {
  const body = email ? { email } : {};
  const response = await fetch(`${API_URL.replace('/api', '')}/api/auth/passkey/login/begin/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Шаг 2 входа: отправляем подписанный assertion, получаем JWT.
 */
export async function passkeyLoginComplete(
  session_id: string,
  credential: Record<string, unknown>,
): Promise<PasskeyLoginResponse> {
  const response = await fetch(`${API_URL.replace('/api', '')}/api/auth/passkey/login/complete/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id, credential }),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Получить список passkeys текущего пользователя.
 */
export async function getPasskeys(): Promise<PasskeyCredential[]> {
  const response = await fetchWithAuth(`${API_URL.replace('/api', '')}/api/auth/passkey/`);
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Переименовать passkey.
 */
export async function renamePasskey(
  id: string,
  name: string,
): Promise<{ message: string; passkey: PasskeyCredential }> {
  const response = await fetchWithAuth(
    `${API_URL.replace('/api', '')}/api/auth/passkey/${id}/`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    },
  );
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}

/**
 * Удалить passkey.
 */
export async function deletePasskey(id: string): Promise<{ message: string }> {
  const response = await fetchWithAuth(`${API_URL.replace('/api', '')}/api/auth/passkey/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const result = await response.json();
  if (!response.ok) throw result as ApiError;
  return result;
}
