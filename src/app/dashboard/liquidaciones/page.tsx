'use client';

import { useState, useEffect, useRef } from 'react';

interface PayrollV1 {
  id: string;
  employee_id: string;
  periodo: string;
  sueldo_base: number;
  gratificacion: number;
  horas_extra: number;
  monto_horas_extra: number;
  bonos: number;
  colacion: number;
  movilizacion: number;
  otros_haberes: number;
  total_haberes: number;
  desc_afp: number;
  desc_salud: number;
  desc_cesantia: number;
  impuesto_unico: number;
  otros_descuentos: number;
  total_descuentos: number;
  sueldo_liquido: number;
  estado: 'borrador' | 'calculado' | 'aprobado' | 'pagado';
  fecha_pago: string | null;
  employee: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string;
  } | null;
}

function safe(n: unknown): number {
  if (typeof n === 'number' && !isNaN(n)) return n;
  if (typeof n === 'string') { const p = parseFloat(n); if (!isNaN(p)) return p; }
  return 0;
}

function fmt(n: unknown): string {
  return '$' + safe(n).toLocaleString('es-CL');
}

function formatPeriodo(periodo: string): string {
  try {
    return new Date(periodo + '-01').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  } catch {
    return periodo;
  }
}

function estadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    borrador: 'Borrador',
    calculado: 'Calculado',
    aprobado: 'Aprobado',
    pagado: 'Pagado',
  };
  return labels[estado] ?? estado;
}

function estadoClass(estado: string): string {
  switch (estado) {
    case 'pagado': return 'bg-emerald-100 text-emerald-700';
    case 'aprobado': return 'bg-green-100 text-green-700';
    case 'calculado': return 'bg-blue-100 text-blue-700';
    case 'borrador': return 'bg-gray-100 text-gray-600';
    default: return 'bg-yellow-100 text-yellow-700';
  }
}

function empFullName(liq: PayrollV1): string {
  if (liq.employee) {
    return `${liq.employee.nombre} ${liq.employee.apellido}`.trim();
  }
  return `Empleado #${liq.employee_id}`;
}

function LiquidacionDetail({ liq, onClose }: { liq: PayrollV1; onClose: () => void }) {
  const name = empFullName(liq);
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#1B1564] to-[#3730A3] p-5 text-white">
          <div className="text-lg font-bold">{name}</div>
          {liq.employee?.rut && (
            <div className="text-white/60 text-xs">{liq.employee.rut}</div>
          )}
          <div className="text-white/60 text-sm">Liquidación {formatPeriodo(liq.periodo)}</div>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Haberes</div>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Sueldo Base</span><span className="font-medium">{fmt(liq.sueldo_base)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Horas Extra</span><span className="font-medium">{fmt(liq.monto_horas_extra)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bonos</span><span className="font-medium">{fmt(liq.bonos)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gratificación</span><span className="font-medium">{fmt(liq.gratificacion)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-1 font-semibold"><span>Total Haberes</span><span>{fmt(liq.total_haberes)}</span></div>
          </div>

          <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide mt-3">Descuentos</div>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Salud</span><span className="font-medium text-red-500">-{fmt(liq.desc_salud)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">AFP</span><span className="font-medium text-red-500">-{fmt(liq.desc_afp)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cesantía</span><span className="font-medium text-red-500">-{fmt(liq.desc_cesantia)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Impuesto Único</span><span className="font-medium text-red-500">-{fmt(liq.impuesto_unico)}</span></div>
            <div className="flex justify-between border-t border-gray-100 pt-1 font-semibold"><span>Total Descuentos</span><span className="text-red-500">-{fmt(liq.total_descuentos)}</span></div>
          </div>

          <div className="flex justify-between border-t-2 border-gray-200 pt-2 text-base font-bold">
            <span>Líquido a Pagar</span>
            <span className="text-emerald-600">{fmt(liq.sueldo_liquido)}</span>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => window.print()}
              className="flex-1 py-2 rounded-lg bg-[#1B1564] text-white text-sm font-medium text-center hover:bg-[#1B1564]/90 transition"
            >
              Imprimir PDF
            </button>
            <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-600 hover:bg-gray-200 transition">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCurrentPeriodo(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface GenerarModalProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function GenerarNominaModal({ onClose, onSuccess }: GenerarModalProps) {
  const [periodo, setPeriodo] = useState(getCurrentPeriodo());
  const [bonos, setBonos] = useState('');
  const [colacion, setColacion] = useState('');
  const [movilizacion, setMovilizacion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleGenerar = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/v1/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodo,
          bonos_global: bonos ? Number(bonos) : 0,
          colacion_global: colacion ? Number(colacion) : 0,
          movilizacion_global: movilizacion ? Number(movilizacion) : 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGenError(json.error ?? 'Error al generar nómina');
        return;
      }
      const d = json.data;
      onSuccess(`Nómina generada para ${d.created} empleada${d.created !== 1 ? 's' : ''}${d.skipped > 0 ? ` (${d.skipped} sin contrato omitida${d.skipped !== 1 ? 's' : ''})` : ''}`);
      onClose();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1B1564] to-[#3730A3] p-5 text-white">
          <div className="text-lg font-bold">Generar Nómina</div>
          <div className="text-white/60 text-sm">Calcular y guardar liquidaciones del período</div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Período <span className="text-red-500">*</span></label>
            <input
              type="month"
              value={periodo}
              onChange={e => setPeriodo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B1564]/20 focus:border-[#1B1564] transition"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bonos adicionales (opcional)</label>
            <input
              type="number"
              min="0"
              placeholder="$0"
              value={bonos}
              onChange={e => setBonos(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B1564]/20 focus:border-[#1B1564] transition"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Colación (opcional)</label>
            <input
              type="number"
              min="0"
              placeholder="$0"
              value={colacion}
              onChange={e => setColacion(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B1564]/20 focus:border-[#1B1564] transition"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Movilización (opcional)</label>
            <input
              type="number"
              min="0"
              placeholder="$0"
              value={movilizacion}
              onChange={e => setMovilizacion(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B1564]/20 focus:border-[#1B1564] transition"
            />
          </div>

          {genError && (
            <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {genError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleGenerar}
              disabled={!periodo || generating}
              className="flex-1 py-2.5 rounded-lg bg-[#1B1564] text-white text-sm font-semibold hover:bg-[#1B1564]/90 transition disabled:opacity-50"
            >
              {generating ? 'Calculando nómina...' : 'Calcular y Guardar'}
            </button>
            <button
              onClick={onClose}
              disabled={generating}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-600 hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiquidacionesPage() {
  const [payroll, setPayroll] = useState<PayrollV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PayrollV1 | null>(null);
  const [showGenerar, setShowGenerar] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPayroll = () => {
    setLoading(true);
    fetch('/api/v1/payroll')
      .then(r => r.json())
      .then(res => {
        setPayroll(Array.isArray(res?.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err?.message || 'Error desconocido');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handleGenerarSuccess = (msg: string) => {
    setSuccessMsg(msg);
    fetchPayroll();
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Liquidaciones</h1>
        <button
          onClick={() => setShowGenerar(true)}
          className="px-4 py-2 rounded-lg bg-[#1B1564] text-white text-sm font-semibold hover:bg-[#1B1564]/90 transition"
        >
          Generar Nómina
        </button>
      </div>

      {successMsg && (
        <div className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
          {successMsg}
        </div>
      )}

      {error && <div className="text-red-500 text-sm">Error: {error}</div>}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando liquidaciones...</div>
      ) : payroll.length === 0 ? (
        <div className="text-sm text-gray-400">No hay liquidaciones para mostrar.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Colaboradora</th>
                <th className="px-3 py-3">RUT</th>
                <th className="px-3 py-3">Período</th>
                <th className="px-3 py-3 text-right">Bruto</th>
                <th className="px-3 py-3 text-right">Descuentos</th>
                <th className="px-3 py-3 text-right">Líquido</th>
                <th className="px-3 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map(liq => (
                <tr
                  key={liq.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => setSelected(liq)}
                >
                  <td className="px-5 py-3 font-medium text-gray-800">{empFullName(liq)}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{liq.employee?.rut ?? '-'}</td>
                  <td className="px-3 py-3 text-gray-600">{formatPeriodo(liq.periodo)}</td>
                  <td className="px-3 py-3 text-right font-medium">{fmt(liq.total_haberes)}</td>
                  <td className="px-3 py-3 text-right text-red-500">-{fmt(liq.total_descuentos)}</td>
                  <td className="px-3 py-3 text-right font-bold text-emerald-600">{fmt(liq.sueldo_liquido)}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${estadoClass(liq.estado)}`}>
                      {estadoLabel(liq.estado)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <LiquidacionDetail liq={selected} onClose={() => setSelected(null)} />}
      {showGenerar && (
        <GenerarNominaModal
          onClose={() => setShowGenerar(false)}
          onSuccess={handleGenerarSuccess}
        />
      )}
    </div>
  );
}
