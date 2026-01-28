/**
 * API модуль для связи с бэкендом
 *
 * Здесь все функции для отправки запросов на Django сервер
 */

const API_URL = 'http://localhost:8000/api';

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

  return result;
}

/**
 * Вход в аккаунт
 */
export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/users/login/`, {
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

  return result;
}

/**
 * Выход из аккаунта
 */
export function logoutUser(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/users/profile/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
 * Получить профиль с сервера
 */
export async function fetchProfile(): Promise<User> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/users/profile/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/my/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
}

/**
 * Получить статистику преподавателя
 */
export async function getTeacherStats(): Promise<TeacherStats> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/stats/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

  return result;
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
  price?: number;
  enable_certificate?: boolean;
  certificate_title?: string;
}): Promise<Course> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/my/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/my/${id}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/my/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/my/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result = await response.json();
    throw result as ApiError;
  }
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/${courseId}/modules/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/modules/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/modules/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/modules/${moduleId}/lessons/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/lessons/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/lessons/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/modules/${moduleId}/test/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/modules/${moduleId}/test/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/modules/${moduleId}/test/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/modules/${moduleId}/test/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/tests/${testId}/questions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/questions/${id}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/questions/${id}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/courses/${id}/`, { headers });
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/${courseId}/enroll/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw result as ApiError;
  }

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/enrolled/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/${courseId}/progress/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/learn/lessons/${lessonId}/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/lessons/${lessonId}/complete/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/tests/${testId}/start/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/tests/${testId}/submit/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/tests/${testId}/results/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/courses/${courseId}/certificate/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const token = getAccessToken();

  const response = await fetch(`${API_URL}/certificates/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

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
  const response = await fetch(`${API_URL}/certificates/${certificateNumber}/verify/`);

  const result = await response.json();

  if (!response.ok) {
    return { valid: false };
  }

  return result;
}
