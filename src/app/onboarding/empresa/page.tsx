'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingEmpresaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    rut: '',
    razon_social: '',
    email: '',
    telefono: '',
    direccion: '',
    comuna: '',
    region: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.rut) {
      setError('El nombre y RUT de la empresa son requeridos.');
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch('/api/v1/onboarding/organization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Error al guardar la organización.');
      setLoading(false);
      return;
    }

    router.push('/onboarding/buk');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <span className="w-6 h-6 rounded-full bg-[#1B1564] text-white text-xs flex items-center justify-center font-bold">1</span>
            <span>Paso 1 de 3</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Datos de tu empresa</h1>
          <p className="text-sm text-gray-500 mt-1">Esta información aparecerá en documentos y liquidaciones.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la empresa *</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
                placeholder="Ej: Familia Aravena SpA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUT empresa *</label>
              <input name="rut" value={form.rut} onChange={handleChange} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
                placeholder="12.345.678-9" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón social</label>
              <input name="razon_social" value={form.razon_social} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
                placeholder="Igual al RUT si no aplica" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
                placeholder="contacto@empresa.cl" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
                placeholder="+56 9 1234 5678" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
                placeholder="Av. Principal 123, Of. 4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comuna</label>
              <input name="comuna" value={form.comuna} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]"
                placeholder="Las Condes" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Región</label>
              <select name="region" value={form.region} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1564]">
                <option value="">Seleccionar...</option>
                <option value="Metropolitana">Región Metropolitana</option>
                <option value="Valparaíso">Valparaíso</option>
                <option value="Biobío">Biobío</option>
                <option value="Maule">Maule</option>
                <option value="La Araucanía">La Araucanía</option>
                <option value="Los Lagos">Los Lagos</option>
                <option value="Antofagasta">Antofagasta</option>
                <option value="Coquimbo">Coquimbo</option>
                <option value="O'Higgins">O'Higgins</option>
                <option value="Tarapacá">Tarapacá</option>
                <option value="Atacama">Atacama</option>
                <option value="Magallanes">Magallanes</option>
                <option value="Aysén">Aysén</option>
                <option value="Los Ríos">Los Ríos</option>
                <option value="Arica y Parinacota">Arica y Parinacota</option>
                <option value="Ñuble">Ñuble</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#1B1564] text-white font-medium rounded-xl hover:bg-[#15104e] transition disabled:opacity-50 mt-2">
            {loading ? 'Guardando...' : 'Siguiente → Conexión BUK'}
          </button>
        </form>
      </div>
    </div>
  );
}
