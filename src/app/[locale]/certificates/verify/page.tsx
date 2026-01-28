'use client';

import { useState } from 'react';
import Header from "@/components/Header";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';

export default function VerifyPage() {
  const router = useRouter();
  const t = useTranslations('certificates');
  const [certificateNumber, setCertificateNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certificateNumber.trim()) {
      router.push(`/certificates/verify/${certificateNumber.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="pt-20 px-4 pb-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              {t('verifyCertificate')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {t('verifyDesc')}
            </p>

            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('certificateNumber')}
              </label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="CERT-XXXXXXXX"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4"
              />

              <button
                type="submit"
                disabled={!certificateNumber.trim()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('verify')}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
