'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';
import { verifyCertificate, CertificateVerification } from "@/lib/api";

export default function CertificateVerifyPage() {
  const params = useParams();
  const certificateNumber = params.number as string;
  const t = useTranslations('certificates');

  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const data = await verifyCertificate(certificateNumber);
        setResult(data);
      } catch {
        setResult({ valid: false });
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="pt-20 px-4 pb-12">
          <div className="max-w-lg mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">{t('verifying')}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="pt-20 px-4 pb-12">
        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm">
            {result?.valid ? (
              <>
                {/* Valid certificate */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-green-600 mb-2">
                    {t('validCertificate')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('validDesc')}
                  </p>
                </div>

                {/* Certificate details */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
                  <div className="text-center mb-6">
                    <div className="text-5xl mb-2">🏆</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {t('certificateTitle')}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('awardedTo')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.certificate?.student_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('forCompletion')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.certificate?.course_title}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('instructor')}</p>
                      <p className="text-gray-900 dark:text-white">
                        {result.certificate?.teacher_name}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-yellow-200 dark:border-yellow-800">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('certificateId')}</p>
                        <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                          {result.certificate?.certificate_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('issuedDate')}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {result.certificate?.issued_at && new Date(result.certificate.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Invalid certificate */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-red-600 mb-2">
                    {t('invalidCertificate')}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t('invalidDesc')}
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('searchedFor')}</p>
                    <p className="font-mono text-gray-900 dark:text-white">{certificateNumber}</p>
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/certificates/verify"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('verifyAnother')}
              </Link>
              <Link
                href="/"
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                {t('goHome')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
