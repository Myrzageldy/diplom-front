'use client';

/**
 * PasskeyList — компонент управления Passkeys в настройках безопасности.
 *
 * Показывает список зарегистрированных ключей с возможностью:
 * - Добавить новый ключ (через PasskeyRegisterButton)
 * - Переименовать существующий
 * - Удалить ключ
 *
 * Каждый ключ отображается с иконкой устройства, датой создания
 * и транспортными протоколами.
 */

import { useEffect, useState } from 'react';
import {
  getPasskeys,
  renamePasskey,
  deletePasskey,
  PasskeyCredential,
} from '@/lib/api';
import PasskeyRegisterButton from '@/components/auth/PasskeyRegisterButton';

export default function PasskeyList() {
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Состояние переименования
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Состояние удаления
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPasskeys = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPasskeys();
      setPasskeys(data);
    } catch {
      setError('Не удалось загрузить список ключей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  const handlePasskeyAdded = (newPasskey: PasskeyCredential) => {
    setPasskeys((prev) => [newPasskey, ...prev]);
  };

  const handleStartRename = (passkey: PasskeyCredential) => {
    setRenamingId(passkey.id);
    setRenameValue(passkey.name);
  };

  const handleConfirmRename = async (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setRenameLoading(true);
    try {
      const { passkey: updated } = await renamePasskey(id, trimmed);
      setPasskeys((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
      setRenamingId(null);
    } catch {
      // Оставляем форму открытой при ошибке
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePasskey(id);
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // Если удаление не прошло — оставляем ключ в списке
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Список существующих ключей */}
      {passkeys.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
          У вас нет зарегистрированных Passkey. Добавьте первый ключ ниже.
        </p>
      ) : (
        <div className="space-y-2">
          {passkeys.map((passkey) => (
            <PasskeyItem
              key={passkey.id}
              passkey={passkey}
              isRenaming={renamingId === passkey.id}
              renameValue={renameValue}
              renameLoading={renameLoading}
              isDeleting={deletingId === passkey.id}
              onStartRename={() => handleStartRename(passkey)}
              onRenameChange={setRenameValue}
              onConfirmRename={() => handleConfirmRename(passkey.id)}
              onCancelRename={() => setRenamingId(null)}
              onDelete={() => handleDelete(passkey.id)}
            />
          ))}
        </div>
      )}

      {/* Кнопка добавления нового ключа */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <PasskeyRegisterButton onSuccess={handlePasskeyAdded} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────

interface PasskeyItemProps {
  passkey: PasskeyCredential;
  isRenaming: boolean;
  renameValue: string;
  renameLoading: boolean;
  isDeleting: boolean;
  onStartRename: () => void;
  onRenameChange: (v: string) => void;
  onConfirmRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

function PasskeyItem({
  passkey,
  isRenaming,
  renameValue,
  renameLoading,
  isDeleting,
  onStartRename,
  onRenameChange,
  onConfirmRename,
  onCancelRename,
  onDelete,
}: PasskeyItemProps) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl">
      <div className="flex items-center gap-3">
        {/* Иконка типа устройства */}
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
          {passkey.device_type === 'platform' ? (
            <PlatformIcon />
          ) : (
            <CrossPlatformIcon />
          )}
        </div>

        {/* Информация о ключе */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmRename();
                  if (e.key === 'Escape') onCancelRename();
                }}
                className="flex-1 px-2 py-1 text-sm border border-indigo-400 dark:border-indigo-500 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                autoFocus
                maxLength={100}
              />
              <button
                onClick={onConfirmRename}
                disabled={renameLoading || !renameValue.trim()}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {renameLoading ? '...' : 'OK'}
              </button>
              <button
                onClick={onCancelRename}
                className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
              {passkey.name}
            </p>
          )}

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {/* Тип устройства */}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {passkey.device_type === 'platform' ? 'Встроенный' : 'Внешний ключ'}
            </span>

            {/* Синхронизация в облаке */}
            {passkey.backed_up && (
              <span className="text-xs px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full">
                синхронизирован
              </span>
            )}

            {/* Транспорты */}
            {passkey.transports.length > 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {formatTransports(passkey.transports)}
              </span>
            )}

            {/* Дата добавления */}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Добавлен {formatDate(passkey.created_at)}
            </span>

            {/* Последнее использование */}
            {passkey.last_used_at && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                · Использован {formatDate(passkey.last_used_at)}
              </span>
            )}
          </div>
        </div>

        {/* Действия */}
        {!isRenaming && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onStartRename}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              title="Переименовать"
            >
              <PencilIcon />
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 disabled:opacity-50 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              title="Удалить"
            >
              {isDeleting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <TrashIcon />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Вспомогательные функции и иконки
// ────────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTransports(transports: string[]): string {
  const labels: Record<string, string> = {
    internal: 'встроенный',
    usb: 'USB',
    nfc: 'NFC',
    ble: 'Bluetooth',
    hybrid: 'Hybrid',
    'smart-card': 'смарт-карта',
  };
  return transports.map((t) => labels[t] || t).join(', ');
}

function PlatformIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CrossPlatformIcon() {
  return (
    <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
