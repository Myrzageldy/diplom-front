'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import Header from '@/components/Header';
import { useAuth } from '@/lib/AuthContext';
import { updateProfile } from '@/lib/api';

export default function ProfilePage() {
  const { user, setUser, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('profile');
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (user) {
      setName(user.name);
    }
  }, [user, isLoading, router]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    setMessage('');

    try {
      const result = await updateProfile({ name: name.trim() });
      setUser(result.user);
      setIsEditing(false);
      setMessage(t('updated'));
      setIsError(false);
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage(t('updateError'));
      setIsError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        <main className="pt-20 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="pt-20 px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {t('title')}
          </h1>

          {message && (
            <div className={`mb-6 p-4 rounded-xl ${isError ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
              {message}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-blue-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-blue-100">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t('name')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                ) : (
                  <p className="text-lg text-gray-900 dark:text-white">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t('email')}
                </label>
                <p className="text-lg text-gray-900 dark:text-white">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t('role')}
                </label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === 'teacher' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                    {user.role === 'teacher' ? t('teacher') : t('student')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {t('dateJoined')}
                </label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {new Date(user.date_joined).toLocaleDateString(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              {isEditing ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? t('saving') : t('save')}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('edit')}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
