'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Link, useRouter } from '@/i18n/navigation';
import {
  getModuleTest,
  createTest,
  updateTest,
  deleteTest,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  Test,
  Question,
} from '@/lib/api';
import Header from '@/components/Header';

export default function TestEditorPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const moduleId = Number(params.moduleId);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New test form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [testTitle, setTestTitle] = useState('Тест по модулю');
  const [passingScore, setPassingScore] = useState(70);

  // New question form
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'single' | 'multiple'>('single');
  const [answers, setAnswers] = useState([
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);

  // Edit question
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'teacher')) {
      router.push('/login');
      return;
    }

    if (user?.role === 'teacher' && moduleId) {
      loadTest();
    }
  }, [user, authLoading, moduleId, router]);

  async function loadTest() {
    setLoading(true);
    try {
      const data = await getModuleTest(moduleId);
      setTest(data);
    } catch (err: any) {
      if (err.detail === 'Тест не найден') {
        setTest(null);
        setShowCreateForm(true);
      } else {
        setError('Ошибка загрузки теста');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTest() {
    setSaving(true);
    try {
      const newTest = await createTest(moduleId, {
        title: testTitle,
        passing_score: passingScore,
      });
      setTest(newTest);
      setShowCreateForm(false);
      setSuccess('Тест создан');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при создании теста');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTest(data: Partial<Test>) {
    if (!test) return;
    setSaving(true);
    try {
      await updateTest(moduleId, data);
      setTest({ ...test, ...data });
      setSuccess('Тест обновлён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при обновлении теста');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTest() {
    if (!confirm('Удалить тест и все вопросы?')) return;
    setSaving(true);
    try {
      await deleteTest(moduleId);
      setTest(null);
      setShowCreateForm(true);
      setSuccess('Тест удалён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при удалении теста');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddQuestion() {
    if (!test || !questionText.trim()) return;

    const validAnswers = answers.filter(a => a.text.trim());
    if (validAnswers.length < 2) {
      setError('Добавьте минимум 2 варианта ответа');
      return;
    }

    if (!validAnswers.some(a => a.is_correct)) {
      setError('Отметьте хотя бы один правильный ответ');
      return;
    }

    setSaving(true);
    try {
      const question = await createQuestion(test.id, {
        text: questionText,
        question_type: questionType,
        answers: validAnswers,
      });

      setTest({
        ...test,
        questions: [...(test.questions || []), question],
      });

      // Reset form
      setQuestionText('');
      setAnswers([
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ]);
      setShowQuestionForm(false);
      setSuccess('Вопрос добавлен');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при добавлении вопроса');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateQuestion() {
    if (!test || !editingQuestion) return;

    const validAnswers = answers.filter(a => a.text.trim());
    if (validAnswers.length < 2) {
      setError('Добавьте минимум 2 варианта ответа');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateQuestion(editingQuestion.id, {
        text: questionText,
        question_type: questionType,
        answers: validAnswers,
      });

      setTest({
        ...test,
        questions: test.questions?.map(q =>
          q.id === editingQuestion.id ? updated : q
        ),
      });

      setEditingQuestion(null);
      setQuestionText('');
      setAnswers([
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ]);
      setSuccess('Вопрос обновлён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при обновлении вопроса');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteQuestion(questionId: number) {
    if (!test || !confirm('Удалить вопрос?')) return;
    setSaving(true);
    try {
      await deleteQuestion(questionId);
      setTest({
        ...test,
        questions: test.questions?.filter(q => q.id !== questionId),
      });
      setSuccess('Вопрос удалён');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка при удалении вопроса');
    } finally {
      setSaving(false);
    }
  }

  function startEditQuestion(question: Question) {
    setEditingQuestion(question);
    setQuestionText(question.text);
    setQuestionType(question.question_type);

    const questionAnswers = question.answers || [];
    const paddedAnswers = [
      ...questionAnswers.map(a => ({ text: a.text, is_correct: a.is_correct })),
      ...Array(4 - questionAnswers.length).fill({ text: '', is_correct: false }),
    ].slice(0, 4);

    setAnswers(paddedAnswers);
    setShowQuestionForm(true);
  }

  function cancelEdit() {
    setEditingQuestion(null);
    setQuestionText('');
    setAnswers([
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
    ]);
    setShowQuestionForm(false);
  }

  if (authLoading || loading) {
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
              <Link href="/teacher" className="hover:text-blue-600">Панель учителя</Link>
            </li>
            <li>/</li>
            <li>
              <Link href={`/teacher/courses/${courseId}`} className="hover:text-blue-600">Курс</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white">Тест</li>
          </ol>
        </nav>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl">
            {error}
            <button onClick={() => setError('')} className="float-right">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl">
            {success}
          </div>
        )}

        {/* Create Test Form */}
        {showCreateForm && !test && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Создание теста
            </h1>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название теста
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Проходной балл (%)
                </label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  min={1}
                  max={100}
                  className="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Link
                  href={`/teacher/courses/${courseId}`}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Отмена
                </Link>
                <button
                  onClick={handleCreateTest}
                  disabled={saving || !testTitle.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {saving ? 'Создание...' : 'Создать тест'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test Editor */}
        {test && (
          <>
            {/* Test Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {test.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Проходной балл: {test.passing_score}%</span>
                    <span>{test.questions?.length || 0} вопросов</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      test.is_published
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {test.is_published ? 'Опубликован' : 'Черновик'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateTest({ is_published: !test.is_published })}
                    disabled={saving}
                    className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                      test.is_published
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {test.is_published ? 'Снять' : 'Опубликовать'}
                  </button>
                  <button
                    onClick={handleDeleteTest}
                    disabled={saving}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Вопросы</h2>
                {!showQuestionForm && (
                  <button
                    onClick={() => setShowQuestionForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Добавить вопрос
                  </button>
                )}
              </div>

              {/* Question list */}
              {test.questions?.map((question, index) => (
                <div key={question.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-start gap-4">
                    <span className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium mb-3">
                        {question.text}
                      </p>
                      <div className="space-y-2">
                        {question.answers?.map((answer) => (
                          <div
                            key={answer.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              answer.is_correct
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {answer.is_correct ? '✓' : '○'} {answer.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditQuestion(question)}
                        className="p-2 text-gray-500 hover:text-blue-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="p-2 text-gray-500 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add/Edit question form */}
              {showQuestionForm && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-blue-300 dark:border-blue-600 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {editingQuestion ? 'Редактирование вопроса' : 'Новый вопрос'}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Текст вопроса
                      </label>
                      <textarea
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        rows={2}
                        placeholder="Введите вопрос..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Тип вопроса
                      </label>
                      <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value as 'single' | 'multiple')}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="single">Один правильный ответ</option>
                        <option value="multiple">Несколько правильных ответов</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Варианты ответов
                      </label>
                      <div className="space-y-2">
                        {answers.map((answer, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input
                              type={questionType === 'single' ? 'radio' : 'checkbox'}
                              name="correct-answer"
                              checked={answer.is_correct}
                              onChange={(e) => {
                                const newAnswers = [...answers];
                                if (questionType === 'single') {
                                  newAnswers.forEach(a => a.is_correct = false);
                                }
                                newAnswers[index].is_correct = e.target.checked;
                                setAnswers(newAnswers);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <input
                              type="text"
                              value={answer.text}
                              onChange={(e) => {
                                const newAnswers = [...answers];
                                newAnswers[index].text = e.target.value;
                                setAnswers(newAnswers);
                              }}
                              placeholder={`Вариант ${index + 1}`}
                              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Отметьте правильные ответы галочкой/кружком слева
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                        disabled={saving || !questionText.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {saving ? 'Сохранение...' : editingQuestion ? 'Сохранить' : 'Добавить вопрос'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!test.questions?.length && !showQuestionForm && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Пока нет вопросов
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Добавьте вопросы для теста
                  </p>
                  <button
                    onClick={() => setShowQuestionForm(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                  >
                    Добавить первый вопрос
                  </button>
                </div>
              )}
            </div>

            {/* Back link */}
            <div className="mt-6">
              <Link
                href={`/teacher/courses/${courseId}`}
                className="text-blue-600 hover:underline"
              >
                ← Вернуться к курсу
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
