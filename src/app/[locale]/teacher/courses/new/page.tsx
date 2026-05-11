'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import { createCourse, createModule, createLesson, createTest, createQuestion, uploadCourseImage } from '@/lib/api';
import Header from '@/components/Header';
import { useTranslations } from 'next-intl';

// Типы для wizard-а
interface ModuleData {
  title: string;
  description: string;
  videoUrl: string;
  lessonTitle: string;
  lessonDescription: string;
  testTitle: string;
  testQuestions: QuestionData[];
}

interface QuestionData {
  text: string;
  question_type: 'single' | 'multiple';
  answers: { text: string; is_correct: boolean }[];
}

type WizardStep = 'course-info' | 'modules-count' | 'module-details';

// ID категорий для курсов
const CATEGORY_IDS = [
  'programming',
  'webDev',
  'mobileDev',
  'dataScience',
  'aiMl',
  'design',
  'marketing',
  'business',
  'finance',
  'languages',
  'math',
  'physics',
  'chemistry',
  'biology',
  'history',
  'photography',
  'music',
  'art',
  'health',
  'personalDev',
  'other',
] as const;

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const t = useTranslations('createCourse');
  const tCat = useTranslations('categories');
  const tCommon = useTranslations('common');

  // Wizard state
  const [step, setStep] = useState<WizardStep>('course-info');
  const [courseId, setCourseId] = useState<number | null>(null);

  // Course info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [enableCertificate, setEnableCertificate] = useState(false);
  const [certificateTitle, setCertificateTitle] = useState('');

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Modules
  const [modulesCount, setModulesCount] = useState(1);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [modules, setModules] = useState<ModuleData[]>([]);

  // Current module form
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [questions, setQuestions] = useState<QuestionData[]>([
    { text: '', question_type: 'single', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }] }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  // Handle image selection
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
  }

  // Получить название категории для отправки
  function getCategoryName(): string | undefined {
    if (selectedCategory === 'other') {
      return customCategory || undefined;
    }
    if (selectedCategory && CATEGORY_IDS.includes(selectedCategory as typeof CATEGORY_IDS[number])) {
      return tCat(selectedCategory as typeof CATEGORY_IDS[number]);
    }
    return undefined;
  }

  // Шаг 1: Создание курса
  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const categoryName = getCategoryName();

      const course = await createCourse({
        title,
        description,
        category_name: categoryName,
        enable_certificate: enableCertificate,
        certificate_title: certificateTitle,
      });

      // Загружаем обложку если выбрана
      if (imageFile) {
        try {
          await uploadCourseImage(course.id, imageFile);
        } catch (imgErr) {
          console.error('Error uploading image:', imgErr);
          // Продолжаем даже если картинка не загрузилась
        }
      }

      setCourseId(course.id);
      setStep('modules-count');
    } catch (err: any) {
      setError(err.detail || 'Ошибка при создании курса');
    } finally {
      setLoading(false);
    }
  }

  // Шаг 2: Подтверждение количества модулей
  function handleModulesCountSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Инициализируем пустые модули
    const emptyModules: ModuleData[] = Array.from({ length: modulesCount }, () => ({
      title: '',
      description: '',
      videoUrl: '',
      lessonTitle: '',
      lessonDescription: '',
      testTitle: '',
      testQuestions: []
    }));
    setModules(emptyModules);
    setCurrentModuleIndex(0);
    setStep('module-details');
  }

  // Добавить вопрос
  function addQuestion() {
    setQuestions([
      ...questions,
      { text: '', question_type: 'single', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }] }
    ]);
  }

  // Удалить вопрос
  function removeQuestion(index: number) {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  }

  // Обновить вопрос
  function updateQuestion(index: number, field: keyof QuestionData, value: any) {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  }

  // Обновить ответ
  function updateAnswer(questionIndex: number, answerIndex: number, field: 'text' | 'is_correct', value: any) {
    const updated = [...questions];
    const answers = [...updated[questionIndex].answers];

    if (field === 'is_correct' && value === true && updated[questionIndex].question_type === 'single') {
      // Для single choice - только один правильный ответ
      answers.forEach((a, i) => {
        answers[i] = { ...a, is_correct: i === answerIndex };
      });
    } else {
      answers[answerIndex] = { ...answers[answerIndex], [field]: value };
    }

    updated[questionIndex] = { ...updated[questionIndex], answers };
    setQuestions(updated);
  }

  // Сохранить текущий модуль и перейти к следующему
  async function handleSaveModule() {
    setError('');
    setLoading(true);

    try {
      if (!courseId) throw new Error('Курс не создан');

      // Создаем модуль
      const moduleData = await createModule(courseId, {
        title: moduleTitle,
        description: moduleDescription,
      });

      // Создаем урок в модуле
      if (lessonTitle) {
        await createLesson(moduleData.id, {
          title: lessonTitle,
          description: lessonDescription,
          video_url: videoUrl,
        });
      }

      // Создаем тест если есть вопросы
      const validQuestions = questions.filter(q => q.text.trim() && q.answers.some(a => a.text.trim()));
      if (testTitle && validQuestions.length > 0) {
        const test = await createTest(moduleData.id, {
          title: testTitle,
          passing_score: 70,
        });

        // Добавляем вопросы
        for (const q of validQuestions) {
          const validAnswers = q.answers.filter(a => a.text.trim());
          if (validAnswers.length >= 2) {
            await createQuestion(test.id, {
              text: q.text,
              question_type: q.question_type,
              answers: validAnswers,
            });
          }
        }
      }

      // Переходим к следующему модулю или завершаем
      if (currentModuleIndex < modulesCount - 1) {
        setCurrentModuleIndex(currentModuleIndex + 1);
        // Очищаем форму
        setModuleTitle('');
        setModuleDescription('');
        setVideoUrl('');
        setLessonTitle('');
        setLessonDescription('');
        setTestTitle('');
        setQuestions([
          { text: '', question_type: 'single', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }] }
        ]);
      } else {
        // Все модули созданы - переходим на страницу курса
        router.push(`/teacher/courses/${courseId}`);
      }
    } catch (err: any) {
      setError(err.detail || 'Ошибка при сохранении модуля');
    } finally {
      setLoading(false);
    }
  }

  // Пропустить модуль (создать только пустой модуль)
  async function handleSkipModule() {
    setError('');
    setLoading(true);

    try {
      if (!courseId) throw new Error('Курс не создан');

      // Создаем пустой модуль
      await createModule(courseId, {
        title: moduleTitle || `Модуль ${currentModuleIndex + 1}`,
        description: moduleDescription,
      });

      // Переходим к следующему модулю или завершаем
      if (currentModuleIndex < modulesCount - 1) {
        setCurrentModuleIndex(currentModuleIndex + 1);
        // Очищаем форму
        setModuleTitle('');
        setModuleDescription('');
        setVideoUrl('');
        setLessonTitle('');
        setLessonDescription('');
        setTestTitle('');
        setQuestions([
          { text: '', question_type: 'single', answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }] }
        ]);
      } else {
        router.push(`/teacher/courses/${courseId}`);
      }
    } catch (err: any) {
      setError(err.detail || 'Ошибка при создании модуля');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link href="/teacher" className="hover:text-blue-600">
                Панель учителя
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">Новый курс</li>
          </ol>
        </nav>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {step === 'course-info' && t('step1')}
              {step === 'modules-count' && t('step2')}
              {step === 'module-details' && t('step3', { current: currentModuleIndex + 1, total: modulesCount })}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {step === 'course-info' && '1/3'}
              {step === 'modules-count' && '2/3'}
              {step === 'module-details' && '3/3'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: step === 'course-info' ? '33%' : step === 'modules-count' ? '66%' : '100%'
              }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Step 1: Course Info */}
        {step === 'course-info' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {t('title')}
            </h1>

            <form onSubmit={handleCreateCourse} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('courseTitle')} *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('courseTitlePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('courseDescription')} *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('courseDescriptionPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  required
                />
              </div>

              {/* Обложка курса */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('coverImage')}
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt={t('coverImage')}
                      className="w-full h-48 object-cover rounded-xl border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{t('clickToUpload')}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('imageFormats')}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              {/* Категория */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('category')}
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="">{t('selectCategory')}</option>
                  {CATEGORY_IDS.map((catId) => (
                    <option key={catId} value={catId}>
                      {tCat(catId)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Своя категория если выбрано "Другое" */}
              {selectedCategory === 'other' && (
                <div>
                  <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('customCategoryLabel')} *
                  </label>
                  <input
                    type="text"
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder={t('customCategoryPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    required
                  />
                </div>
              )}

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="enableCertificate"
                    checked={enableCertificate}
                    onChange={(e) => setEnableCertificate(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enableCertificate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('certificate')}
                  </label>
                </div>

                {enableCertificate && (
                  <div>
                    <label htmlFor="certificateTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('certificateText')}
                    </label>
                    <input
                      type="text"
                      id="certificateTitle"
                      value={certificateTitle}
                      onChange={(e) => setCertificateTitle(e.target.value)}
                      placeholder={t('certificateTextPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Link
                  href="/teacher"
                  className="flex-1 py-3 text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {tCommon('cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={loading || !title || !description || (selectedCategory === 'other' && !customCategory)}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? t('creating') : tCommon('next')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Modules Count */}
        {step === 'modules-count' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t('modulesCount')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('modulesCountDesc')}
            </p>

            <form onSubmit={handleModulesCountSubmit} className="space-y-6">
              <div>
                <label htmlFor="modulesCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('modulesCount')}
                </label>
                <input
                  type="number"
                  id="modulesCount"
                  min={1}
                  max={20}
                  value={modulesCount}
                  onChange={(e) => setModulesCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-center text-2xl font-bold"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {t('modulesRange')}
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('course-info')}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {tCommon('back')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {tCommon('next')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Module Details Modal */}
        {step === 'module-details' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('step3', { current: currentModuleIndex + 1, total: modulesCount })}
              </h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                {currentModuleIndex + 1}/{modulesCount}
              </span>
            </div>

            <div className="space-y-8">
              {/* Module Info */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                  {t('moduleInfo')}
                </h2>
                <div className="space-y-4 pl-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('moduleTitle')} *
                    </label>
                    <input
                      type="text"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder={t('moduleTitlePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('moduleDescription')}
                    </label>
                    <textarea
                      value={moduleDescription}
                      onChange={(e) => setModuleDescription(e.target.value)}
                      placeholder={t('moduleDescriptionPlaceholder')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Video */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                  {t('videoLesson')}
                </h2>
                <div className="space-y-4 pl-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('lessonTitle')}
                    </label>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder={t('lessonTitlePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('videoUrl')}
                    </label>
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={t('videoUrlPlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('textMaterials')}
                    </label>
                    <textarea
                      value={lessonDescription}
                      onChange={(e) => setLessonDescription(e.target.value)}
                      placeholder={t('textMaterialsPlaceholder')}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Test */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                  {t('test')}
                </h2>
                <div className="space-y-4 pl-10">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('testTitle')}
                    </label>
                    <input
                      type="text"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      placeholder={t('testTitlePlaceholder')}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  {/* Questions */}
                  {testTitle && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('questions')} ({questions.length})
                        </span>
                        <button
                          type="button"
                          onClick={addQuestion}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + {t('addQuestion')}
                        </button>
                      </div>

                      {questions.map((question, qIndex) => (
                        <div key={qIndex} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {t('question')} {qIndex + 1}
                            </span>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeQuestion(qIndex)}
                                className="text-red-500 hover:text-red-600 text-sm"
                              >
                                {t('deleteQuestion')}
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                            placeholder={t('question') + '...'}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          />

                          <select
                            value={question.question_type}
                            onChange={(e) => updateQuestion(qIndex, 'question_type', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="single">{t('singleAnswer')}</option>
                            <option value="multiple">{t('multipleAnswers')}</option>
                          </select>

                          <div className="space-y-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('answerOptions')}:</span>
                            {question.answers.map((answer, aIndex) => (
                              <div key={aIndex} className="flex items-center gap-2">
                                <input
                                  type={question.question_type === 'single' ? 'radio' : 'checkbox'}
                                  checked={answer.is_correct}
                                  onChange={(e) => updateAnswer(qIndex, aIndex, 'is_correct', e.target.checked)}
                                  className="w-4 h-4 text-green-600"
                                  name={`q${qIndex}_correct`}
                                />
                                <input
                                  type="text"
                                  value={answer.text}
                                  onChange={(e) => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                                  placeholder={`${t('answer')} ${aIndex + 1}`}
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                                />
                              </div>
                            ))}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t('markCorrectAnswers')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleSkipModule}
                  disabled={loading}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {t('skip')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveModule}
                  disabled={loading || !moduleTitle}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {loading ? t('saving') : currentModuleIndex < modulesCount - 1 ? t('saveAndNext') : t('finish')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
