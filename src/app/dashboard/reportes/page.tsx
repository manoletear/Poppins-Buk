'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, DollarSign, Clock } from 'lucide-react';

interface ReportSummary {
  headcount: {
    total: number;
    activos: number;
    inactivos: number;
    licencia: number;
    vacaciones: number;
  };
  payroll: {
    periodo: string;
    total_haberes: number;
    total_descuentos: number;
    total_liquido: number;
    count: number;
  };
  absences: {
    total: number;
    pendientes: number;
    aprobadas: number;
    rechazadas: number;
  };
  overtime: {
    mes_actual: string;
    total_horas: number;
    pendientes: number;
    costo_estimado: number;
  };
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-CL');
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function KpiCard({ label, value, sub, icon, iconBg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-gray-500 text-sm font-medium">{label}</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
          {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default function ReportesPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/reports/summary')
      .then(r => r.json())
      .then(json => {
        if (json.data) setSummary(json.data);
        else setError(json.error ?? 'Error al cargar reportes');
      })
      .catch(() => setError('Error al cargar reportes'))
      .finally(() => setLoading(false));
  }, []);

  const periodLabel = summary?.payroll.periodo
    ? new Date(summary.payroll.periodo + '-01').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    : '—';

  const totalPayroll = summary
    ? summary.payroll.total_haberes + summary.payroll.total_descuentos
    : 0;
  const pctHaberes = totalPayroll > 0
    ? ((summary!.payroll.total_haberes / totalPayroll) * 100).toFixed(1)
    : '0';
  const pctDescuentos = totalPayroll > 0
    ? ((summary!.payroll.total_descuentos / totalPayroll) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        {summary && (
          <span className="text-sm text-gray-500 capitalize">
            Período: {periodLabel}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Section 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <KpiCard
              label="Total Colaboradoras"
              value={summary?.headcount.total ?? 0}
              sub="Registradas en el sistema"
              icon={<Users className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-100"
            />
            <KpiCard
              label="Activas"
              value={summary?.headcount.activos ?? 0}
              sub={`de ${summary?.headcount.total ?? 0} totales`}
              icon={<UserCheck className="w-5 h-5 text-emerald-700" />}
              iconBg="bg-emerald-50"
            />
            <KpiCard
              label="Costo Líquido Mensual"
              value={summary ? fmt(summary.payroll.total_liquido) : '—'}
              sub={`${summary?.payroll.count ?? 0} liquidaciones`}
              icon={<DollarSign className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-100"
            />
            <KpiCard
              label="Solicitudes Pendientes"
              value={summary?.absences.pendientes ?? 0}
              sub="Requieren aprobación"
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              iconBg="bg-amber-100"
            />
          </>
        )}
      </div>

      {/* Section 2 — Distribución de Costos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Distribución de Costos</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded-full" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-3">
            <div className="flex h-6 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${pctHaberes}%` }}
                title={`Haberes ${pctHaberes}%`}
              />
              <div
                className="h-full bg-red-400 transition-all"
                style={{ width: `${pctDescuentos}%` }}
                title={`Descuentos ${pctDescuentos}%`}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-gray-500 text-xs font-medium">Haberes</span>
                </div>
                <div className="font-bold text-gray-900">{fmt(summary.payroll.total_haberes)}</div>
                <div className="text-xs text-gray-400">{pctHaberes}% del total</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-gray-500 text-xs font-medium">Descuentos</span>
                </div>
                <div className="font-bold text-gray-900">{fmt(summary.payroll.total_descuentos)}</div>
                <div className="text-xs text-gray-400">{pctDescuentos}% del total</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-500 text-xs font-medium">Líquido</span>
                </div>
                <div className="font-bold text-gray-900">{fmt(summary.payroll.total_liquido)}</div>
                <div className="text-xs text-gray-400">Neto a pagar</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Sin datos de nómina para este período</div>
        )}
      </div>

      {/* Section 3 — Estado de Colaboradoras */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">Estado de Colaboradoras</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Activas', count: summary.headcount.activos, color: 'bg-emerald-100 text-emerald-700' },
              { label: 'Inactivas', count: summary.headcount.inactivos, color: 'bg-gray-100 text-gray-600' },
              { label: 'En Licencia', count: summary.headcount.licencia, color: 'bg-amber-100 text-amber-700' },
              { label: 'Vacaciones', count: summary.headcount.vacaciones, color: 'bg-blue-100 text-blue-700' },
            ].map(item => (
              <div key={item.label} className={`rounded-lg p-4 ${item.color}`}>
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-xs font-medium mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">Sin datos</div>
        )}
      </div>

      {/* Section 4 — Horas Extra del Mes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4">
          Horas Extra del Mes
          {summary && (
            <span className="ml-2 text-xs font-normal text-gray-400 capitalize">({periodLabel})</span>
          )}
        </h2>
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 font-medium">Total Horas</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{summary.overtime.total_horas}h</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 font-medium">Costo Estimado</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{fmt(summary.overtime.costo_estimado)}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-xs text-yellow-700 font-medium">Pendientes Aprobación</div>
              <div className="text-2xl font-bold text-yellow-800 mt-1">{summary.overtime.pendientes}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Sin datos de horas extra</div>
        )}
      </div>
    </div>
  );
}
