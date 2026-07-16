'use client';

import { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, CalendarX, Clock, Trash2, LogOut } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  nombre: string;
  apellido: string;
}

interface AttendanceRecord {
  id: string;
  org_id: string;
  employee_id: string;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  horas_trabajadas: number | null;
  tipo: 'normal' | 'feriado' | 'turno_extra';
  estado: 'presente' | 'ausente' | 'tardanza' | 'media_jornada';
  observaciones: string | null;
  employee: { id: string; nombre: string; apellido: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFecha(isoDate: string): string {
  return new Date(isoDate + 'T00:00').toLocaleDateString('es-CL');
}

function formatHora(t: string | null): string {
  if (!t) return '—';
  return t.slice(0, 5); // "HH:MM"
}

function formatHoras(h: number | null): string {
  if (h == null) return '—';
  return `${h}h`;
}

function empName(rec: AttendanceRecord): string {
  if (rec.employee) return `${rec.employee.nombre} ${rec.employee.apellido}`;
  return `Empleado ${rec.employee_id.slice(0, 8)}`;
}

function currentMonthStr(): string {
  return new Date().toISOString().slice(0, 7);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    presente:      'bg-emerald-100 text-emerald-700',
    ausente:       'bg-red-100 text-red-600',
    tardanza:      'bg-amber-100 text-amber-700',
    media_jornada: 'bg-blue-100 text-blue-700',
  };
  const labels: Record<string, string> = {
    presente:      'Presente',
    ausente:       'Ausente',
    tardanza:      'Tardanza',
    media_jornada: 'Media jornada',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[estado] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[estado] ?? estado}
    </span>
  );
}

// ─── Tipo Badge ──────────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: string }) {
  const map: Record<string, string> = {
    normal:      'bg-gray-100 text-gray-600',
    feriado:     'bg-purple-100 text-purple-700',
    turno_extra: 'bg-orange-100 text-orange-700',
  };
  const labels: Record<string, string> = {
    normal:      'Normal',
    feriado:     'Feriado',
    turno_extra: 'Turno extra',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[tipo] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[tipo] ?? tipo}
    </span>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-gray-500 text-sm font-medium">{label}</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Register Attendance Modal ────────────────────────────────────────────────

interface RegisterModalProps {
  employees: Employee[];
  onClose: () => void;
  onSaved: () => void;
}

function RegisterModal({ employees, onClose, onSaved }: RegisterModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [fecha, setFecha] = useState(todayStr());
  const [estado, setEstado] = useState<string>('presente');
  const [tipo, setTipo] = useState<string>('normal');
  const [horaEntrada, setHoraEntrada] = useState('');
  const [horaSalida, setHoraSalida] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !fecha) {
      setError('Colaboradora y fecha son requeridos');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          fecha,
          estado,
          tipo,
          hora_entrada: horaEntrada || null,
          hora_salida: horaSalida || null,
          observaciones: observaciones || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Registrar Asistencia</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Colaboradora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colaboradora</label>
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              required
            >
              <option value="">Seleccionar...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              required
            />
          </div>

          {/* Estado + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={estado}
                onChange={e => setEstado(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              >
                <option value="presente">Presente</option>
                <option value="ausente">Ausente</option>
                <option value="tardanza">Tardanza</option>
                <option value="media_jornada">Media jornada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              >
                <option value="normal">Normal</option>
                <option value="feriado">Feriado</option>
                <option value="turno_extra">Turno extra</option>
              </select>
            </div>
          </div>

          {/* Hora entrada + Hora salida */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de entrada</label>
              <input
                type="time"
                value={horaEntrada}
                onChange={e => setHoraEntrada(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de salida <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                type="time"
                value={horaSalida}
                onChange={e => setHoraSalida(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#F0197A] rounded-lg hover:bg-[#d4166c] disabled:opacity-60 transition"
            >
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Register Salida Modal ────────────────────────────────────────────────────

interface SalidaModalProps {
  record: AttendanceRecord;
  onClose: () => void;
  onSaved: () => void;
}

function SalidaModal({ record, onClose, onSaved }: SalidaModalProps) {
  const [horaSalida, setHoraSalida] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horaSalida) {
      setError('Ingresa la hora de salida');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/attendance/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hora_salida: horaSalida }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar');
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Registrar Salida</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {empName(record)} — {formatFecha(record.fecha)}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora de salida</label>
            <input
              type="time"
              value={horaSalida}
              onChange={e => setHoraSalida(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#F0197A] rounded-lg hover:bg-[#d4166c] disabled:opacity-60 transition"
            >
              {saving ? 'Guardando...' : 'Registrar salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AsistenciaPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterMonth, setFilterMonth] = useState(currentMonthStr());

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [salidaRecord, setSalidaRecord] = useState<AttendanceRecord | null>(null);

  // ── fetch employees once ───────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/v1/employees')
      .then(r => r.json())
      .then(j => setEmployees(j.data ?? []))
      .catch(() => setEmployees([]));
  }, []);

  // ── fetch attendance records ───────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterEmployee) params.set('employee_id', filterEmployee);
      if (filterMonth) params.set('month', filterMonth);

      const res = await fetch(`/api/v1/attendance?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar asistencia');
      const json = await res.json();
      setRecords(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [filterEmployee, filterMonth]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar este registro de asistencia?')) return;
    try {
      const res = await fetch(`/api/v1/attendance/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Error al eliminar');
      }
      fetchRecords();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  // ── summary stats (computed from current records list) ────────────────────
  const currentMonth = currentMonthStr();
  const monthRecords = records.filter(r => r.fecha.startsWith(currentMonth));
  const diasPresentes = monthRecords.filter(r => r.estado === 'presente').length;
  const ausencias = monthRecords.filter(r => r.estado === 'ausente').length;
  const horasList = records
    .filter(r => r.horas_trabajadas != null)
    .map(r => r.horas_trabajadas as number);
  const promedioHoras =
    horasList.length > 0
      ? Math.round((horasList.reduce((a, b) => a + b, 0) / horasList.length) * 10) / 10
      : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Asistencia</h1>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-[#F0197A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4166c] transition"
        >
          + Registrar Asistencia
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Dias Presentes este mes"
          value={diasPresentes}
          icon={<CalendarCheck size={20} className="text-[#F0197A]" />}
          iconBg="bg-[#F0197A]/10"
        />
        <SummaryCard
          label="Ausencias este mes"
          value={ausencias}
          icon={<CalendarX size={20} className="text-red-500" />}
          iconBg="bg-red-100"
        />
        <SummaryCard
          label="Promedio Horas/Dia"
          value={promedioHoras != null ? `${promedioHoras}h` : '—'}
          icon={<Clock size={20} className="text-[#1B1564]" />}
          iconBg="bg-[#1B1564]/10"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={filterEmployee}
          onChange={e => setFilterEmployee(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30 min-w-[200px]"
        >
          <option value="">Todas las colaboradoras</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.nombre} {emp.apellido}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400">Cargando registros...</div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <CalendarCheck size={22} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Sin registros de asistencia</p>
          <p className="text-gray-400 text-xs mt-1">Ajusta los filtros o registra el primer control.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Colaboradora</th>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Entrada</th>
                <th className="px-3 py-3">Salida</th>
                <th className="px-3 py-3">Horas</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {records.map(rec => (
                <tr key={rec.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-gray-800">{empName(rec)}</td>
                  <td className="px-3 py-3 text-gray-600">{formatFecha(rec.fecha)}</td>
                  <td className="px-3 py-3 text-gray-600">{formatHora(rec.hora_entrada)}</td>
                  <td className="px-3 py-3 text-gray-600">{formatHora(rec.hora_salida)}</td>
                  <td className="px-3 py-3 text-gray-600 font-medium">{formatHoras(rec.horas_trabajadas)}</td>
                  <td className="px-3 py-3"><TipoBadge tipo={rec.tipo} /></td>
                  <td className="px-3 py-3"><StatusBadge estado={rec.estado} /></td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {rec.hora_salida == null && (
                        <button
                          onClick={() => setSalidaRecord(rec)}
                          title="Registrar salida"
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#1B1564]/10 text-[#1B1564] hover:bg-[#1B1564]/20 transition"
                        >
                          <LogOut size={12} />
                          Registrar Salida
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rec.id)}
                        title="Eliminar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Attendance Modal */}
      {showRegisterModal && (
        <RegisterModal
          employees={employees}
          onClose={() => setShowRegisterModal(false)}
          onSaved={fetchRecords}
        />
      )}

      {/* Register Salida Modal */}
      {salidaRecord && (
        <SalidaModal
          record={salidaRecord}
          onClose={() => setSalidaRecord(null)}
          onSaved={fetchRecords}
        />
      )}
    </div>
  );
}
