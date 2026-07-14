'use client';

import { useState, useEffect, useCallback } from 'react';

interface AbsenceV1 {
  id: string;
  employee_id: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  observaciones: string | null;
  employee: { id: string; nombre: string; apellido: string; rut: string } | null;
}

interface VacationBalanceV1 {
  id: string;
  employee_id: string;
  dias_legales_totales: number;
  dias_progresivos: number;
  dias_adicionales: number;
  dias_usados: number;
  dias_pendientes: number;
  dias_disponibles: number;
  fecha_corte: string;
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

function empName(abs: AbsenceV1): string {
  if (abs.employee) {
    return `${abs.employee.nombre} ${abs.employee.apellido}`;
  }
  return `Empleado ${abs.employee_id.slice(0, 8)}`;
}

export default function VacacionesPage() {
  const [absences, setAbsences] = useState<AbsenceV1[]>([]);
  const [balances, setBalances] = useState<VacationBalanceV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAbsences = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/absences');
      if (!res.ok) throw new Error('Error al cargar solicitudes');
      const json = await res.json();
      setAbsences(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [absRes, balRes] = await Promise.all([
          fetch('/api/v1/absences'),
          fetch('/api/v1/vacation-balances'),
        ]);

        if (!absRes.ok) throw new Error('Error al cargar solicitudes');
        if (!balRes.ok) throw new Error('Error al cargar saldos');

        const [absJson, balJson] = await Promise.all([absRes.json(), balRes.json()]);
        setAbsences(absJson.data ?? []);
        setBalances(balJson.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleApprove = async (id: string) => {
    await fetch(`/api/v1/absences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'aprobada' }),
    });
    fetchAbsences();
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/v1/absences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'rechazada' }),
    });
    fetchAbsences();
  };

  const pendientes = absences.filter(a => a.estado === 'pendiente');
  const resueltas = absences.filter(a => a.estado !== 'pendiente');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Vacaciones y Permisos</h1>
        <a href="/dashboard/vacaciones/nueva" className="px-4 py-2 bg-[#F0197A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4166c] transition inline-block">
          + Nueva Solicitud
        </a>
      </div>

      {/* Saldo de Vacaciones */}
      {balances.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="text-sm font-semibold text-gray-800 mb-3">Saldo de Vacaciones</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {balances.map(b => {
              const nombre = b.employee
                ? `${b.employee.nombre} ${b.employee.apellido}`
                : `Empleado ${b.employee_id.slice(0, 8)}`;
              const total = b.dias_legales_totales + b.dias_progresivos + b.dias_adicionales;
              const usedPct = total > 0 ? Math.min(100, (b.dias_usados / total) * 100) : 0;
              return (
                <div key={b.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium truncate">{nombre}</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-emerald-600">{b.dias_disponibles}</span>
                    <span className="text-xs text-gray-400">/ {total} días</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>{b.dias_usados} usados</span>
                    {b.dias_pendientes > 0 && (
                      <span className="text-yellow-600">{b.dias_pendientes} pend.</span>
                    )}
                  </div>
                  {b.dias_progresivos > 0 && (
                    <div className="mt-1">
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                        +{b.dias_progresivos} progresivos
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <div className="text-red-500 text-sm">Error: {error}</div>}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando solicitudes...</div>
      ) : (
        <>
          {/* Pending */}
          {pendientes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">
                  Pendientes de Aprobación ({pendientes.length})
                </span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {pendientes.map(abs => (
                    <tr key={abs.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-800">{empName(abs)}</div>
                        <div className="text-xs text-gray-400">{abs.tipo}</div>
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {formatDate(abs.fecha_inicio)} &rarr; {formatDate(abs.fecha_fin)}
                      </td>
                      <td className="px-3 py-3 text-gray-600">{abs.dias} días</td>
                      <td className="px-3 py-3"><StatusBadge estado={abs.estado} /></td>
                      <td className="px-3 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(abs.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(abs.id)}
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
            {resueltas.length === 0 ? (
              <div className="p-5 text-sm text-gray-400">Sin registros</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-2">Colaboradora</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Fechas</th>
                    <th className="px-3 py-2">Días</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resueltas.map(abs => (
                    <tr key={abs.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-2.5 font-medium text-gray-800">{empName(abs)}</td>
                      <td className="px-3 py-2.5 text-gray-600">{abs.tipo}</td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {formatDate(abs.fecha_inicio)} &rarr; {formatDate(abs.fecha_fin)}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{abs.dias}</td>
                      <td className="px-3 py-2.5"><StatusBadge estado={abs.estado} /></td>
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
