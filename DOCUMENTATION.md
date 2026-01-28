# EduPlatform KZ - Документация проекта

## Обзор проекта

**EduPlatform KZ** — образовательная платформа для учителей, где они могут создавать и продавать курсы с видео, материалами и тестами.

---

## 1. Текущее состояние

### Что уже есть в бэкенде (Django)

| Модель | Описание | Статус |
|--------|----------|--------|
| User | Пользователи (email, name, role: student/teacher) | ✅ Готово |
| EmailVerification | Коды подтверждения email | ✅ Готово |
| Category | Категории курсов | ✅ Готово |
| Course | Курсы (title, description, price, image) | ✅ Готово |
| Enrollment | Записи студентов на курсы | ✅ Готово |
| Review | Отзывы о курсах | ✅ Готово |

### Что уже есть в фронтенде (Next.js)

| Компонент | Описание | Статус |
|-----------|----------|--------|
| Header | Навигация, смена языка/темы | ✅ Готово |
| StudentDashboard | Панель студента | ✅ Готово |
| TeacherDashboard | Панель учителя (базовая) | ✅ Готово |
| AuthContext | Авторизация через JWT | ✅ Готово |
| ThemeContext | Тёмная/светлая тема | ✅ Готово |
| i18n | Локализация RU/KK | ✅ Готово |

### Существующие API endpoints

```
POST /api/users/send-code/      - Отправить код на email
POST /api/users/verify-code/    - Проверить код
POST /api/users/register/       - Регистрация
POST /api/users/login/          - Вход
GET  /api/users/profile/        - Получить профиль
PUT  /api/users/profile/        - Обновить профиль
POST /api/users/logout/         - Выход
POST /api/users/token/refresh/  - Обновить токен

GET  /api/courses/              - Список курсов
GET  /api/courses/<id>/         - Детали курса
GET  /api/courses/categories/   - Категории
GET  /api/courses/my/           - Мои курсы (учитель)
GET  /api/courses/enrolled/     - Записанные курсы (студент)
GET  /api/courses/stats/        - Статистика (учитель)
```

---

## 2. Что нужно добавить

### Новые модели для бэкенда

```
┌─────────────────────────────────────────────────────────────┐
│                      СТРУКТУРА КУРСА                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Course (Курс)                                             │
│   ├── Module (Модуль) #1                                    │
│   │   ├── Lesson (Урок) #1                                  │
│   │   │   ├── video_url                                     │
│   │   │   └── materials[]                                   │
│   │   ├── Lesson (Урок) #2                                  │
│   │   └── Test (Тест модуля)                                │
│   │       ├── Question #1                                   │
│   │       │   └── answers[] + correct_answer                │
│   │       └── Question #2                                   │
│   │                                                         │
│   ├── Module (Модуль) #2                                    │
│   │   └── ...                                               │
│   │                                                         │
│   └── Certificate (настройки сертификата)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Модель: Module (Модуль)

```python
class Module(models.Model):
    course = ForeignKey(Course)      # К какому курсу относится
    title = CharField(200)           # Название модуля
    description = TextField()        # Описание (опционально)
    order = PositiveIntegerField()   # Порядок в курсе (1, 2, 3...)
    is_published = BooleanField()    # Опубликован ли
    created_at = DateTimeField()
```

### Модель: Lesson (Урок)

```python
class Lesson(models.Model):
    module = ForeignKey(Module)      # К какому модулю относится
    title = CharField(200)           # Название урока
    description = TextField()        # Описание
    video_url = URLField()           # Ссылка на видео (YouTube embed)
    order = PositiveIntegerField()   # Порядок в модуле
    duration = DurationField()       # Длительность видео
    is_published = BooleanField()
    created_at = DateTimeField()
```

### Модель: LessonMaterial (Материалы урока)

```python
class LessonMaterial(models.Model):
    lesson = ForeignKey(Lesson)
    title = CharField(200)           # Название файла
    file = FileField()               # PDF, документ и т.д.
    file_type = CharField()          # pdf, doc, image
    uploaded_at = DateTimeField()
```

### Модель: Test (Тест)

```python
class Test(models.Model):
    module = OneToOneField(Module)   # Один тест на модуль
    title = CharField(200)           # Название теста
    description = TextField()
    passing_score = IntegerField()   # Проходной балл (например 70%)
    time_limit = IntegerField()      # Лимит времени в минутах (0 = без лимита)
    attempts_allowed = IntegerField() # Кол-во попыток (0 = безлимит)
    is_published = BooleanField()
    created_at = DateTimeField()
```

### Модель: Question (Вопрос)

```python
class Question(models.Model):
    QUESTION_TYPES = [
        ('single', 'Один правильный ответ'),
        ('multiple', 'Несколько правильных ответов'),
    ]

    test = ForeignKey(Test)
    text = TextField()               # Текст вопроса
    question_type = CharField()      # single / multiple
    order = PositiveIntegerField()   # Порядок вопроса
    points = IntegerField(default=1) # Баллы за вопрос
```

### Модель: Answer (Вариант ответа)

```python
class Answer(models.Model):
    question = ForeignKey(Question)
    text = CharField(500)            # Текст ответа
    is_correct = BooleanField()      # Правильный ли ответ
    order = PositiveIntegerField()
```

### Модель: LessonProgress (Прогресс по урокам)

```python
class LessonProgress(models.Model):
    student = ForeignKey(User)
    lesson = ForeignKey(Lesson)
    is_completed = BooleanField()    # Завершён ли урок
    completed_at = DateTimeField()
    watch_time = IntegerField()      # Сколько секунд смотрел

    class Meta:
        unique_together = ['student', 'lesson']
```

### Модель: TestAttempt (Попытка теста)

```python
class TestAttempt(models.Model):
    student = ForeignKey(User)
    test = ForeignKey(Test)
    score = IntegerField()           # Набранный балл (%)
    is_passed = BooleanField()       # Сдан ли тест
    started_at = DateTimeField()
    finished_at = DateTimeField()
```

### Модель: TestAnswer (Ответы студента)

```python
class TestAnswer(models.Model):
    attempt = ForeignKey(TestAttempt)
    question = ForeignKey(Question)
    selected_answers = ManyToManyField(Answer)  # Выбранные ответы
    is_correct = BooleanField()
```

### Модель: Certificate (Сертификат)

```python
class Certificate(models.Model):
    student = ForeignKey(User)
    course = ForeignKey(Course)
    certificate_number = CharField() # Уникальный номер
    issued_at = DateTimeField()
    pdf_file = FileField()           # Сгенерированный PDF

    class Meta:
        unique_together = ['student', 'course']
```

### Дополнение к Course

```python
# Добавить в существующую модель Course:
class Course(models.Model):
    # ... существующие поля ...

    # Новые поля:
    enable_certificate = BooleanField(default=False)  # Выдавать сертификат?
    certificate_title = CharField()   # Текст на сертификате
```

---

## 3. Новые API endpoints (нужно добавить)

### Управление курсами (для учителя)

```
POST   /api/courses/                    - Создать курс
PUT    /api/courses/<id>/               - Обновить курс
DELETE /api/courses/<id>/               - Удалить курс
POST   /api/courses/<id>/publish/       - Опубликовать курс
```

### Модули

```
GET    /api/courses/<course_id>/modules/           - Список модулей
POST   /api/courses/<course_id>/modules/           - Создать модуль
PUT    /api/modules/<id>/                          - Обновить модуль
DELETE /api/modules/<id>/                          - Удалить модуль
POST   /api/courses/<course_id>/modules/reorder/   - Изменить порядок
```

### Уроки

```
GET    /api/modules/<module_id>/lessons/           - Список уроков
POST   /api/modules/<module_id>/lessons/           - Создать урок
PUT    /api/lessons/<id>/                          - Обновить урок
DELETE /api/lessons/<id>/                          - Удалить урок
POST   /api/lessons/<id>/materials/                - Добавить материал
DELETE /api/materials/<id>/                        - Удалить материал
```

### Тесты

```
GET    /api/modules/<module_id>/test/              - Получить тест модуля
POST   /api/modules/<module_id>/test/              - Создать тест
PUT    /api/tests/<id>/                            - Обновить тест
DELETE /api/tests/<id>/                            - Удалить тест

POST   /api/tests/<id>/questions/                  - Добавить вопрос
PUT    /api/questions/<id>/                        - Обновить вопрос
DELETE /api/questions/<id>/                        - Удалить вопрос
```

### Прогресс студента

```
POST   /api/lessons/<id>/complete/                 - Отметить урок завершённым
GET    /api/courses/<id>/progress/                 - Мой прогресс по курсу
POST   /api/tests/<id>/start/                      - Начать тест
POST   /api/tests/<id>/submit/                     - Отправить ответы теста
GET    /api/tests/<id>/results/                    - Результаты теста
```

### Запись на курс

```
POST   /api/courses/<id>/enroll/                   - Записаться на курс
DELETE /api/courses/<id>/enroll/                   - Отписаться от курса
```

### Сертификаты

```
GET    /api/courses/<id>/certificate/              - Получить сертификат (если доступен)
GET    /api/certificates/                          - Мои сертификаты
GET    /api/certificates/<number>/verify/          - Проверить сертификат (публичный)
```

---

## 4. Страницы фронтенда (нужно создать)

### Общие страницы

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | HomePage | Главная страница |
| `/login` | LoginPage | Страница входа |
| `/register` | RegisterPage | Регистрация (4 шага) |
| `/courses` | CourseCatalog | Каталог всех курсов |
| `/courses/[id]` | CourseDetail | Страница курса |

### Страницы учителя

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/teacher` | TeacherDashboard | Панель учителя |
| `/teacher/courses/new` | CreateCourse | Создание курса |
| `/teacher/courses/[id]` | EditCourse | Редактирование курса |
| `/teacher/courses/[id]/modules` | ModuleEditor | Редактор модулей |
| `/teacher/courses/[id]/modules/[moduleId]` | LessonEditor | Редактор уроков |
| `/teacher/courses/[id]/modules/[moduleId]/test` | TestEditor | Конструктор теста |

### Страницы студента

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/student` | StudentDashboard | Панель студента |
| `/student/courses` | MyCourses | Мои курсы |
| `/learn/[courseId]` | LearnCourse | Обучение по курсу |
| `/learn/[courseId]/[lessonId]` | LessonView | Просмотр урока |
| `/learn/[courseId]/test/[testId]` | TakeTest | Прохождение теста |
| `/certificates` | MyCertificates | Мои сертификаты |

---

## 5. Сценарии использования

### Сценарий 1: Учитель создаёт курс

```
1. Учитель заходит в панель → нажимает "Создать курс"
2. Заполняет:
   - Название курса
   - Описание
   - Категория
   - Обложка (изображение)
   - Цена (пока 0)
   - Выдавать сертификат? (да/нет)
3. Сохраняет → переходит к редактору модулей
4. Добавляет модуль "Введение"
5. В модуле добавляет уроки:
   - Урок 1: вставляет YouTube ссылку
   - Урок 2: вставляет ссылку + загружает PDF
6. Создаёт тест для модуля:
   - Вопрос 1: "Что такое X?" → 4 варианта → отмечает правильный
   - Вопрос 2: ...
   - Проходной балл: 70%
7. Повторяет для других модулей
8. Нажимает "Опубликовать"
```

### Сценарий 2: Студент проходит курс

```
1. Студент заходит в каталог → выбирает курс
2. На странице курса видит:
   - Описание
   - Учитель
   - Список модулей (названия)
   - Кнопка "Записаться"
3. Нажимает "Записаться" → попадает на страницу обучения
4. Видит список модулей с уроками
5. Открывает первый урок:
   - Смотрит видео
   - Скачивает материалы (если есть)
   - Нажимает "Завершить урок"
6. После всех уроков модуля → появляется кнопка "Пройти тест"
7. Проходит тест:
   - Видит вопросы по одному или все сразу
   - Выбирает ответы
   - Нажимает "Завершить тест"
8. Видит результат:
   - Если сдал → открывается следующий модуль
   - Если не сдал → может пересдать
9. После всех модулей:
   - Если включен сертификат → генерируется PDF
   - Студент может скачать
```

### Сценарий 3: Проверка сертификата

```
1. Работодатель получает сертификат от кандидата
2. На сертификате есть номер и QR-код
3. Переходит по ссылке или вводит номер на сайте
4. Видит:
   - Имя студента
   - Название курса
   - Дата выдачи
   - Статус: "Действительный"
```

---

## 6. Структура базы данных (диаграмма)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Course    │       │  Category   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │◄──────│ teacher_id  │       │ id          │
│ email       │       │ category_id │──────►│ name        │
│ name        │       │ title       │       │ slug        │
│ role        │       │ description │       └─────────────┘
│ password    │       │ price       │
└─────────────┘       │ image       │
      │               │ is_published│
      │               │ enable_cert │
      │               └─────────────┘
      │                     │
      │                     │ 1:N
      │                     ▼
      │               ┌─────────────┐
      │               │   Module    │
      │               ├─────────────┤
      │               │ id          │
      │               │ course_id   │
      │               │ title       │
      │               │ order       │
      │               └─────────────┘
      │                     │
      │          ┌──────────┴──────────┐
      │          │ 1:N                 │ 1:1
      │          ▼                     ▼
      │    ┌─────────────┐       ┌─────────────┐
      │    │   Lesson    │       │    Test     │
      │    ├─────────────┤       ├─────────────┤
      │    │ id          │       │ id          │
      │    │ module_id   │       │ module_id   │
      │    │ title       │       │ passing_score│
      │    │ video_url   │       │ time_limit  │
      │    │ order       │       └─────────────┘
      │    └─────────────┘             │
      │          │                     │ 1:N
      │          │ 1:N                 ▼
      │          ▼               ┌─────────────┐
      │    ┌─────────────┐       │  Question   │
      │    │  Material   │       ├─────────────┤
      │    ├─────────────┤       │ id          │
      │    │ id          │       │ test_id     │
      │    │ lesson_id   │       │ text        │
      │    │ file        │       │ type        │
      │    └─────────────┘       └─────────────┘
      │                                │
      │                                │ 1:N
      │                                ▼
      │                          ┌─────────────┐
      │                          │   Answer    │
      │                          ├─────────────┤
      │                          │ id          │
      │                          │ question_id │
      │                          │ text        │
      │                          │ is_correct  │
      │                          └─────────────┘
      │
      │         ПРОГРЕСС СТУДЕНТА
      │
      ├──────────────────────────────────────────┐
      │                                          │
      ▼                                          ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│ Enrollment  │    │LessonProgress│    │  TestAttempt   │
├─────────────┤    ├─────────────┤    ├─────────────────┤
│ student_id  │    │ student_id  │    │ student_id      │
│ course_id   │    │ lesson_id   │    │ test_id         │
│ enrolled_at │    │ is_completed│    │ score           │
└─────────────┘    │ completed_at│    │ is_passed       │
                   └─────────────┘    └─────────────────┘
      │
      ▼
┌─────────────┐
│ Certificate │
├─────────────┤
│ student_id  │
│ course_id   │
│ number      │
│ issued_at   │
│ pdf_file    │
└─────────────┘
```

---

## 7. План реализации

### Фаза 1: Бэкенд — Модели и API

1. Добавить модели: Module, Lesson, LessonMaterial, Test, Question, Answer
2. Добавить модели прогресса: LessonProgress, TestAttempt, TestAnswer
3. Добавить модель Certificate
4. Создать сериализаторы для всех моделей
5. Создать ViewSet'ы с CRUD операциями
6. Добавить permissions (учитель может редактировать только свои курсы)
7. Настроить URLs

### Фаза 2: Фронтенд — Страницы авторизации

1. Страница входа `/login`
2. Страница регистрации `/register` (4 шага)
3. Middleware для защиты роутов

### Фаза 3: Фронтенд — Панель учителя

1. Улучшить TeacherDashboard
2. Форма создания курса
3. Редактор модулей (drag-and-drop сортировка)
4. Редактор уроков (загрузка видео, материалов)
5. Конструктор тестов

### Фаза 4: Фронтенд — Каталог и страница курса

1. Каталог курсов с фильтрами
2. Страница курса (описание, модули, запись)

### Фаза 5: Фронтенд — Обучение студента

1. Страница обучения (список модулей/уроков)
2. Видеоплеер
3. Прохождение теста
4. Отображение прогресса

### Фаза 6: Сертификаты

1. API генерации PDF сертификата
2. Страница "Мои сертификаты"
3. Публичная проверка сертификата

---

## 8. Технические детали

### Загрузка видео

Для MVP используем YouTube:
- Учитель вставляет ссылку на YouTube видео
- Фронтенд извлекает video_id и показывает embed плеер
- Формат ссылки: `https://www.youtube.com/embed/{video_id}`

### Загрузка файлов

- Материалы хранятся в `/media/materials/`
- Обложки курсов в `/media/courses/`
- Сертификаты в `/media/certificates/`
- Максимальный размер файла: 50MB

### Генерация сертификата

1. Используем библиотеку `reportlab` для Python
2. Шаблон PDF с:
   - Логотип платформы
   - Имя студента
   - Название курса
   - Дата завершения
   - Уникальный номер
   - QR-код со ссылкой на проверку

### Безопасность

- Учитель может редактировать только свои курсы
- Студент видит уроки только после записи на курс
- Тест доступен только после завершения всех уроков модуля
- JWT токены с временем жизни 1 день (access) / 7 дней (refresh)

---

## 9. Переменные окружения

### Backend (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3

EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Для production:
# ALLOWED_HOSTS=yourdomain.com
# CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 10. Команды для разработки

### Backend

```bash
cd diplom-backend

# Создать виртуальное окружение
python -m venv venv
venv\Scripts\activate  # Windows

# Установить зависимости
pip install -r requirements.txt

# Миграции
python manage.py makemigrations
python manage.py migrate

# Запуск сервера
python manage.py runserver
```

### Frontend

```bash
cd diplom-front

# Установить зависимости
npm install

# Запуск dev сервера
npm run dev
```

---

## 11. Контакты и ссылки

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api`
- **Admin панель**: `http://localhost:8000/admin`
