'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { EmployeeV1 } from '@/hooks/useEmployeesV1';

const COLOR_PALETTE = ['#1B1564','#F0197A','#059669','#7C3AED','#D97706','#0284C7','#DC2626','#7C2D12'];

function getColor(nombre: string, apellido: string): string {
  const code = (nombre.charCodeAt(0) || 0) + (apellido.charCodeAt(0) || 0);
  return COLOR_PALETTE[code % COLOR_PALETTE.length];
}

function getIniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CL');
}

const CONTRACT_LABELS: Record<string, string> = {
  indefinido: 'Indefinido',
  plazo_fijo: 'Plazo Fijo',
  obra_faena: 'Por Obra',
  honorarios: 'Honorarios',
  part_time: 'Part Time',
};

function StatusBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    activo: 'bg-emerald-100 text-emerald-700',
    inactivo: 'bg-gray-100 text-gray-500',
    licencia: 'bg-amber-100 text-amber-700',
    vacaciones: 'bg-blue-100 text-blue-700',
    suspendido: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${colors[estado] || 'bg-gray-100 text-gray-500'}`}>
      {estado}
    </span>
  );
}

export default function ColaboradorasPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/v1/employees')
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setEmployees(json.data ?? []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(e => {
    const nombreCompleto = `${e.nombre} ${e.apellido}`.toLowerCase();
    const cargo = (e.job_position?.nombre ?? '').toLowerCase();
    const q = search.toLowerCase();
    return nombreCompleto.includes(q) || cargo.includes(q) || e.rut.includes(search);
  });

  const fmt = (n: number) => '$' + n.toLocaleString('es-CL');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Colaboradoras</h1>
        <a href="/dashboard/colaboradoras/nuevo" className="px-4 py-2 bg-[#F0197A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4166c] transition inline-block">
          + Nueva Colaboradora
        </a>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white rounded-lg px-3 h-10 shadow-sm border border-gray-100 max-w-sm">
        <span className="text-gray-400">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, cargo o RUT..."
          className="border-none bg-transparent outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
        />
      </div>

      {error && <div className="text-red-500 text-sm">Error: {error}</div>}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando colaboradoras...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Colaboradora</th>
                <th className="px-3 py-3">Cargo</th>
                <th className="px-3 py-3">Contrato</th>
                <th className="px-3 py-3">Sueldo Base</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3 text-right">Ingreso</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const nombreCompleto = `${emp.nombre} ${emp.apellido}`;
                const cargo = emp.job_position?.nombre ?? '—';
                const tipoContrato = CONTRACT_LABELS[emp.contract?.tipo_contrato ?? ''] ?? '—';
                const sueldoBase = emp.contract?.sueldo_base ?? 0;
                const iniciales = getIniciales(emp.nombre, emp.apellido);
                const color = getColor(emp.nombre, emp.apellido);
                const fechaIngreso = formatDate(emp.fecha_ingreso);
                return (
                  <tr
                    key={emp.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/colaboradoras/${emp.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: color }}>
                          {iniciales}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{nombreCompleto}</div>
                          <div className="text-xs text-gray-400">{emp.rut}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{cargo}</td>
                    <td className="px-3 py-3 text-gray-600">{tipoContrato}</td>
                    <td className="px-3 py-3 font-medium text-gray-800">{fmt(sueldoBase)}</td>
                    <td className="px-3 py-3"><StatusBadge estado={emp.estado} /></td>
                    <td className="px-3 py-3 text-right text-gray-500">{fechaIngreso}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
