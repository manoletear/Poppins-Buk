'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';

interface OvertimeV1 {
  id: string;
  employee_id: string;
  fecha: string;
  horas: number;
  tipo: '50%' | '100%' | 'otro';
  monto: number | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  observaciones: string | null;
  employee: { id: string; nombre: string; apellido: string } | null;
}

function StatusBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    aprobada: 'bg-emerald-100 text-emerald-700',
    rechazada: 'bg-red-100 text-red-600',
    cancelada: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[estado] || 'bg-gray-100 text-gray-500'}`}>
      {estado}
    </span>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00').toLocaleDateString('es-CL');
}

function empName(ot: OvertimeV1): string {
  if (ot.employee) {
    return `${ot.employee.nombre} ${ot.employee.apellido}`;
  }
  return `Empleado ${ot.employee_id.slice(0, 8)}`;
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-CL');
}

export default function HorasExtraPage() {
  const router = useRouter();
  const [overtime, setOvertime] = useState<OvertimeV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOvertime = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/overtime');
      if (!res.ok) throw new Error('Error al cargar horas extra');
      const json = await res.json();
      setOvertime(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchOvertime().finally(() => setLoading(false));
  }, [fetchOvertime]);

  const handleApprove = async (id: string) => {
    await fetch(`/api/v1/overtime/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'aprobada' }),
    });
    fetchOvertime();
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/v1/overtime/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'rechazada' }),
    });
    fetchOvertime();
  };

  // Summary stats
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthOvertime = overtime.filter(ot => ot.fecha.startsWith(currentMonth));
  const totalHorasMes = monthOvertime.reduce((sum, ot) => sum + (ot.horas || 0), 0);
  const pendingCount = overtime.filter(ot => ot.estado === 'pendiente').length;

  const estimatedCost = overtime.reduce((sum, ot) => {
    if (ot.monto != null) return sum + ot.monto;
    const hourlyRate = ot.tipo === '100%' ? 20000 : 15000;
    return sum + (ot.horas * hourlyRate);
  }, 0);

  const pendingOvertimes = overtime.filter(ot => ot.estado === 'pendiente');
  const resolvedOvertimes = overtime.filter(ot => ot.estado !== 'pendiente');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Horas Extra</h1>
        <button
          onClick={() => router.push('/dashboard/horas-extra/nueva')}
          className="px-4 py-2 bg-[#F0197A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4166c] transition"
        >
          + Registrar Horas Extra
        </button>
      </div>

      {error && <div className="text-red-500 text-sm">Error: {error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-500 text-sm font-medium">Total Horas Mes</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{totalHorasMes}h</div>
            </div>
            <div className="p-2.5 bg-[#F0197A]/10 rounded-lg">
              <Clock size={20} className="text-[#F0197A]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-500 text-sm font-medium">Costo Estimado</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{fmt(estimatedCost)}</div>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-lg">
              <span className="text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-gray-500 text-sm font-medium">Pendientes Aprobación</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{pendingCount}</div>
            </div>
            <div className="p-2.5 bg-yellow-100 rounded-lg">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Cargando horas extra...</div>
      ) : overtime.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-600">Sin registros de horas extra</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pendingOvertimes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">
                  Pendientes de Aprobación ({pendingOvertimes.length})
                </span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Colaborador</th>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Horas</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOvertimes.map(ot => (
                    <tr key={ot.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-800">{empName(ot)}</td>
                      <td className="px-3 py-3 text-gray-600">{formatDate(ot.fecha)}</td>
                      <td className="px-3 py-3 text-gray-600 font-medium">{ot.horas}h</td>
                      <td className="px-3 py-3 text-gray-600">{ot.tipo}</td>
                      <td className="px-3 py-3">
                        <StatusBadge estado={ot.estado} />
                      </td>
                      <td className="px-3 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(ot.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(ot.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                        >
                          Rechazar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Historial</span>
            </div>
            {resolvedOvertimes.length === 0 ? (
              <div className="p-5 text-sm text-gray-400">Sin registros</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Colaborador</th>
                    <th className="px-3 py-3">Fecha</th>
                    <th className="px-3 py-3">Horas</th>
                    <th className="px-3 py-3">Tipo</th>
                    <th className="px-3 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedOvertimes.map(ot => (
                    <tr key={ot.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium text-gray-800">{empName(ot)}</td>
                      <td className="px-3 py-3 text-gray-600">{formatDate(ot.fecha)}</td>
                      <td className="px-3 py-3 text-gray-600 font-medium">{ot.horas}h</td>
                      <td className="px-3 py-3 text-gray-600">{ot.tipo}</td>
                      <td className="px-3 py-3">
                        <StatusBadge estado={ot.estado} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
