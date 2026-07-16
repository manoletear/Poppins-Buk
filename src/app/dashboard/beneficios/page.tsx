'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, TrendingUp, Tag, Pencil, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Benefit {
  id: string;
  org_id: string;
  nombre: string;
  descripcion: string | null;
  monto: number;
  tipo: 'mensual' | 'anual' | 'unico' | 'variable';
  categoria: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

interface EmployeeBenefit {
  id: string;
  employee_id: string;
  benefit_id: string;
  monto_override: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
  employee: { id: string; nombre: string; apellido: string } | null;
  benefit: { id: string; nombre: string; tipo: string; monto: number } | null;
}

interface Employee {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
  estado: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-CL');
}

function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00').toLocaleDateString('es-CL');
}

// ─── Shared UI ───────────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: string }) {
  const styles: Record<string, string> = {
    mensual: 'bg-blue-100 text-blue-700',
    anual: 'bg-purple-100 text-purple-700',
    unico: 'bg-amber-100 text-amber-700',
    variable: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    mensual: 'Mensual',
    anual: 'Anual',
    unico: 'Único',
    variable: 'Variable',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles[tipo] ?? 'bg-gray-100 text-gray-500'}`}>
      {labels[tipo] ?? tipo}
    </span>
  );
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Activo</span>
  ) : (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactivo</span>
  );
}

// ─── Benefit Modal (create / edit) ───────────────────────────────────────────

interface BenefitModalProps {
  initial?: Partial<Benefit>;
  onClose: () => void;
  onSave: () => void;
}

function BenefitModal({ initial, onClose, onSave }: BenefitModalProps) {
  const [form, setForm] = useState({
    nombre: initial?.nombre ?? '',
    descripcion: initial?.descripcion ?? '',
    monto: initial?.monto ?? 0,
    tipo: initial?.tipo ?? 'mensual',
    categoria: initial?.categoria ?? '',
    activo: initial?.activo !== undefined ? initial.activo : true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isEdit = Boolean(initial?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const url = isEdit ? `/api/v1/benefits/${initial!.id}` : '/api/v1/benefits';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          descripcion: form.descripcion || null,
          monto: Number(form.monto),
          tipo: form.tipo,
          categoria: form.categoria || null,
          activo: form.activo,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar');
      onSave();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">
            {isEdit ? 'Editar Beneficio' : 'Nuevo Beneficio'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
            <input
              required
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              placeholder="Ej: Bono de alimentación"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30 resize-none"
              placeholder="Descripción opcional"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Monto ($) *</label>
              <input
                required
                type="number"
                min={0}
                value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo *</label>
              <select
                required
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value as Benefit['tipo'] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              >
                <option value="mensual">Mensual</option>
                <option value="anual">Anual</option>
                <option value="unico">Único</option>
                <option value="variable">Variable</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoría</label>
            <input
              value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              placeholder="Ej: Alimentación, Salud, Transporte..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="benefit-activo"
              checked={form.activo}
              onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
              className="accent-[#F0197A]"
            />
            <label htmlFor="benefit-activo" className="text-sm text-gray-700">Activo</label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#F0197A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4166c] transition disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

interface AssignModalProps {
  benefits: Benefit[];
  employees: Employee[];
  onClose: () => void;
  onSave: () => void;
}

function AssignModal({ benefits, employees, onClose, onSave }: AssignModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const activeBenefits = benefits.filter(b => b.activo);

  const [form, setForm] = useState({
    employee_id: '',
    benefit_id: '',
    monto_override: '',
    fecha_inicio: today,
    fecha_fin: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedBenefit = activeBenefits.find(b => b.id === form.benefit_id) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch('/api/v1/employee-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: form.employee_id,
          benefit_id: form.benefit_id,
          monto_override: form.monto_override !== '' ? Number(form.monto_override) : null,
          fecha_inicio: form.fecha_inicio || today,
          fecha_fin: form.fecha_fin || null,
          notas: form.notas || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al asignar');
      onSave();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Asignar Beneficio</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        {err && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Colaboradora *</label>
            <select
              required
              value={form.employee_id}
              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
            >
              <option value="">Seleccionar colaboradora...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} {emp.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Beneficio *</label>
            <select
              required
              value={form.benefit_id}
              onChange={e =>
                setForm(f => ({ ...f, benefit_id: e.target.value, monto_override: '' }))
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
            >
              <option value="">Seleccionar beneficio...</option>
              {activeBenefits.map(b => (
                <option key={b.id} value={b.id}>
                  {b.nombre} — {fmt(b.monto)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Monto Personalizado ($)
              {selectedBenefit && (
                <span className="ml-1 font-normal text-gray-400">
                  (por defecto: {fmt(selectedBenefit.monto)})
                </span>
              )}
            </label>
            <input
              type="number"
              min={0}
              value={form.monto_override}
              onChange={e => setForm(f => ({ ...f, monto_override: e.target.value }))}
              placeholder={selectedBenefit ? String(selectedBenefit.monto) : 'Sin personalización'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Inicio *</label>
              <input
                required
                type="date"
                value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={form.fecha_fin}
                onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30 resize-none"
              placeholder="Observaciones opcionales"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#F0197A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4166c] transition disabled:opacity-60"
            >
              {saving ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BeneficiosPage() {
  const [tab, setTab] = useState<'catalogo' | 'asignaciones'>('catalogo');

  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [assignments, setAssignments] = useState<EmployeeBenefit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [editBenefit, setEditBenefit] = useState<Benefit | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Inline delete error banner
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Filters for Asignaciones tab
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterBenefit, setFilterBenefit] = useState('');

  const fetchBenefits = useCallback(async () => {
    const res = await fetch('/api/v1/benefits');
    const json = await res.json();
    setBenefits(json.data ?? []);
  }, []);

  const fetchAssignments = useCallback(async () => {
    const res = await fetch('/api/v1/employee-benefits');
    const json = await res.json();
    setAssignments(json.data ?? []);
  }, []);

  const fetchEmployees = useCallback(async () => {
    const res = await fetch('/api/v1/employees');
    const json = await res.json();
    setEmployees(json.data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchBenefits(), fetchAssignments(), fetchEmployees()])
      .catch(() => setError('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, [fetchBenefits, fetchAssignments, fetchEmployees]);

  // ── Derived stats (Catálogo) ──
  const activeBenefitsCount = benefits.filter(b => b.activo).length;
  const monthlyTotal = benefits
    .filter(b => b.activo && b.tipo === 'mensual')
    .reduce((sum, b) => sum + b.monto, 0);
  const categoryCount = new Set(
    benefits.filter(b => b.categoria != null).map(b => b.categoria!)
  ).size;

  // ── Filtered assignments ──
  const filteredAssignments = assignments.filter(a => {
    if (filterEmployee && a.employee_id !== filterEmployee) return false;
    if (filterBenefit && a.benefit_id !== filterBenefit) return false;
    return true;
  });

  // ── Actions ──
  const handleDeleteBenefit = async (id: string) => {
    setDeleteError(null);
    const res = await fetch(`/api/v1/benefits/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) {
      setDeleteError(json.error ?? 'Error al eliminar');
      return;
    }
    fetchBenefits();
  };

  const handleDeleteAssignment = async (id: string) => {
    await fetch(`/api/v1/employee-benefits/${id}`, { method: 'DELETE' });
    fetchAssignments();
  };

  const handleToggleAssignment = async (a: EmployeeBenefit) => {
    await fetch(`/api/v1/employee-benefits/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !a.activo }),
    });
    fetchAssignments();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Beneficios</h1>
        {tab === 'catalogo' ? (
          <button
            onClick={() => { setEditBenefit(null); setShowBenefitModal(true); }}
            className="px-4 py-2 bg-[#F0197A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4166c] transition"
          >
            + Nuevo Beneficio
          </button>
        ) : (
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2 bg-[#F0197A] text-white text-sm font-semibold rounded-lg hover:bg-[#d4166c] transition"
          >
            + Asignar Beneficio
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('catalogo')}
          className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition ${
            tab === 'catalogo'
              ? 'bg-white text-[#1B1564] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Catálogo
        </button>
        <button
          onClick={() => setTab('asignaciones')}
          className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition ${
            tab === 'asignaciones'
              ? 'bg-white text-[#1B1564] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Asignaciones
        </button>
      </div>

      {/* Global error */}
      {error && <div className="text-red-500 text-sm">Error: {error}</div>}

      {/* Delete error banner */}
      {deleteError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError(null)}
            className="ml-4 text-red-400 hover:text-red-600 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando...</div>
      ) : (
        <>
          {/* ══════════════ TAB: CATÁLOGO ══════════════ */}
          {tab === 'catalogo' && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-gray-500 text-sm font-medium">Beneficios Activos</div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        {activeBenefitsCount}
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#F0197A]/10 rounded-lg">
                      <Gift size={20} className="text-[#F0197A]" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-gray-500 text-sm font-medium">Costo Mensual Estimado</div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        {fmt(monthlyTotal)}
                      </div>
                    </div>
                    <div className="p-2.5 bg-emerald-100 rounded-lg">
                      <TrendingUp size={20} className="text-emerald-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-gray-500 text-sm font-medium">Categorías</div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        {categoryCount}
                      </div>
                    </div>
                    <div className="p-2.5 bg-blue-100 rounded-lg">
                      <Tag size={20} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits table */}
              {benefits.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    Sin beneficios configurados. Crea el primero con el botón de arriba.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <th className="px-5 py-3">Nombre</th>
                        <th className="px-3 py-3">Categoría</th>
                        <th className="px-3 py-3">Tipo</th>
                        <th className="px-3 py-3">Monto</th>
                        <th className="px-3 py-3">Estado</th>
                        <th className="px-3 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benefits.map(b => (
                        <tr
                          key={b.id}
                          className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-800">{b.nombre}</div>
                            {b.descripcion && (
                              <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                {b.descripcion}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-500">
                            {b.categoria ?? <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-3">
                            <TipoBadge tipo={b.tipo} />
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-800">{fmt(b.monto)}</td>
                          <td className="px-3 py-3">
                            <EstadoBadge activo={b.activo} />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditBenefit(b); setShowBenefitModal(true); }}
                                title="Editar"
                                className="p-1.5 text-gray-400 hover:text-[#1B1564] hover:bg-gray-100 rounded-lg transition"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteBenefit(b.id)}
                                title="Eliminar"
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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
            </div>
          )}

          {/* ══════════════ TAB: ASIGNACIONES ══════════════ */}
          {tab === 'asignaciones' && (
            <div className="space-y-5">
              {/* Filter bar */}
              <div className="flex gap-3 flex-wrap">
                <select
                  value={filterEmployee}
                  onChange={e => setFilterEmployee(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30 bg-white min-w-[200px]"
                >
                  <option value="">Todas las colaboradoras</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre} {emp.apellido}
                    </option>
                  ))}
                </select>

                <select
                  value={filterBenefit}
                  onChange={e => setFilterBenefit(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F0197A]/30 bg-white min-w-[200px]"
                >
                  <option value="">Todos los beneficios</option>
                  {benefits.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nombre}
                    </option>
                  ))}
                </select>

                {(filterEmployee || filterBenefit) && (
                  <button
                    onClick={() => { setFilterEmployee(''); setFilterBenefit(''); }}
                    className="text-xs text-gray-500 hover:text-gray-800 underline transition"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>

              {/* Assignments table */}
              {filteredAssignments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <p className="text-gray-500 text-sm">
                    {filterEmployee || filterBenefit
                      ? 'Sin asignaciones para los filtros seleccionados.'
                      : 'Sin asignaciones. Usa el botón de arriba para asignar un beneficio.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <th className="px-5 py-3">Colaboradora</th>
                        <th className="px-3 py-3">Beneficio</th>
                        <th className="px-3 py-3">Monto Real</th>
                        <th className="px-3 py-3">Período</th>
                        <th className="px-3 py-3">Estado</th>
                        <th className="px-3 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map(a => {
                        const montoReal =
                          a.monto_override !== null
                            ? a.monto_override
                            : (a.benefit?.monto ?? 0);
                        const empName = a.employee
                          ? `${a.employee.nombre} ${a.employee.apellido}`
                          : '—';
                        const periodo = `${formatDate(a.fecha_inicio)} → ${
                          a.fecha_fin ? formatDate(a.fecha_fin) : 'indefinido'
                        }`;

                        return (
                          <tr
                            key={a.id}
                            className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                          >
                            <td className="px-5 py-3 font-medium text-gray-800">{empName}</td>
                            <td className="px-3 py-3">
                              <div className="text-gray-800">{a.benefit?.nombre ?? '—'}</div>
                              {a.benefit && (
                                <div className="mt-0.5">
                                  <TipoBadge tipo={a.benefit.tipo} />
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-gray-800">{fmt(montoReal)}</div>
                              {a.monto_override !== null && (
                                <div className="text-[11px] text-[#F0197A] font-medium">
                                  Personalizado
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-gray-500 text-xs">{periodo}</td>
                            <td className="px-3 py-3">
                              <EstadoBadge activo={a.activo} />
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleToggleAssignment(a)}
                                  title={a.activo ? 'Desactivar' : 'Activar'}
                                  className="p-1.5 text-gray-400 hover:text-[#1B1564] hover:bg-gray-100 rounded-lg transition"
                                >
                                  {a.activo ? (
                                    <ToggleRight size={16} className="text-emerald-500" />
                                  ) : (
                                    <ToggleLeft size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteAssignment(a.id)}
                                  title="Eliminar"
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {showBenefitModal && (
        <BenefitModal
          initial={editBenefit ?? undefined}
          onClose={() => { setShowBenefitModal(false); setEditBenefit(null); }}
          onSave={() => {
            setShowBenefitModal(false);
            setEditBenefit(null);
            fetchBenefits();
          }}
        />
      )}

      {showAssignModal && (
        <AssignModal
          benefits={benefits}
          employees={employees}
          onClose={() => setShowAssignModal(false)}
          onSave={() => {
            setShowAssignModal(false);
            fetchAssignments();
          }}
        />
      )}
    </div>
  );
}
