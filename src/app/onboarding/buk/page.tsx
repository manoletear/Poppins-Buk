'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Zap } from 'lucide-react';

export default function OnboardingBukPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ buk_tenant_url: '', buk_api_token: '' });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setTestResult(null);
  }

  async function handleTest() {
    if (!form.buk_tenant_url || !form.buk_api_token) {
      setError('Completa la URL y el token antes de probar.');
      return;
    }
    setTesting(true);
    setError(null);
    setTestResult(null);

    const res = await fetch('/api/v1/onboarding/buk-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setTestResult(res.ok ? 'success' : 'error');
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'No se pudo conectar con BUK.');
    }
    setTesting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/v1/onboarding/buk-save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Error al guardar la configuración BUK.');
      setLoading(false);
      return;
    }

    router.push('/onboarding/completar');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <span className="w-6 h-6 rounded-full bg-[#1B1564] text-white text-xs flex items-center justify-center font-bold">2</span>
            <span>Paso 2 de 3</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Conectar con BUK</h1>
          <p className="text-sm text-gray-500 mt-1">
            Opcional — puedes saltarte esto y conectar BUK más tarde desde Configuración.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de tu empresa en BUK</label>
            <input name="buk_tenant_url" value={form.buk_tenant_url} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
              placeholder="https://tu-empresa.buk.cl" />
            <p className="text-xs text-gray-400 mt-1">Es la URL que usas para entrar a BUK.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Token de BUK</label>
            <input name="buk_api_token" type="password" value={form.buk_api_token} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
              placeholder="Tu token de acceso BUK" />
            <p className="text-xs text-gray-400 mt-1">
              Encuéntralo en BUK → Configuración → Accesos API. Se guarda encriptado.
            </p>
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleTest} disabled={testing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
              <Zap className="w-4 h-4" />
              {testing ? 'Probando...' : 'Probar conexión'}
            </button>
            {testResult === 'success' && (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <CheckCircle className="w-4 h-4" /> Conexión exitosa
              </span>
            )}
            {testResult === 'error' && (
              <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
                <XCircle className="w-4 h-4" /> Sin conexión
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.push('/onboarding/completar')}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-sm">
              Saltarse por ahora
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-[#1B1564] text-white font-medium rounded-xl hover:bg-[#15104e] transition disabled:opacity-50 text-sm">
              {loading ? 'Guardando...' : 'Guardar y continuar →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
