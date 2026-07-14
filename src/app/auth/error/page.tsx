'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const params = useSearchParams();
  const message = params.get('message') ?? 'Ocurrió un error al iniciar sesión.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-600 text-xl">✕</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Error de autenticación</h1>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-[#1B1564] text-white text-sm font-medium rounded-xl hover:bg-[#15104e] transition"
        >
          Volver al login
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
