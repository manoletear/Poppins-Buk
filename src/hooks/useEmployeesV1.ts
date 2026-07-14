'use client';

import { useState, useEffect, useCallback } from 'react';

export interface EmployeeV1 {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_ingreso: string;
  estado: 'activo' | 'inactivo' | 'licencia' | 'vacaciones' | 'suspendido';
  puertas_adentro: boolean;
  foto_url: string | null;
  job_position: { id: string; nombre: string } | null;
  department: { id: string; nombre: string } | null;
  contract: {
    id: string;
    tipo_contrato: string;
    sueldo_base: number;
    afp_nombre: string | null;
    salud_tipo: string | null;
    salud_nombre: string | null;
    activo: boolean;
  } | null;
}

export interface EmployeeDetailV1 extends EmployeeV1 {
  segundo_apellido: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  estado_civil: string | null;
  email_personal: string | null;
  telefono_emergencia: string | null;
  contacto_emergencia: string | null;
  comuna: string | null;
  region: string | null;
  puertas_adentro: boolean;
  notas: string | null;
  buk_synced_at: string | null;
  created_at: string;
  updated_at: string;
  contracts: ContractV1[];
}

export interface ContractV1 {
  id: string;
  org_id: string;
  employee_id: string;
  tipo_contrato: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  sueldo_base: number;
  jornada_horas: number | null;
  dias_vacaciones_base: number | null;
  gratificacion_tipo: string | null;
  afp_nombre: string | null;
  afp_tasa: number | null;
  salud_tipo: string | null;
  salud_nombre: string | null;
  plan_salud_uf: number | null;
  mutual: string | null;
  banco: string | null;
  tipo_cuenta_banco: string | null;
  numero_cuenta: string | null;
  activo: boolean;
  motivo_termino: string | null;
  buk_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AbsenceV1 {
  id: string;
  org_id: string;
  employee_id: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  dias: number | null;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  observaciones: string | null;
  documento_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollV1 {
  id: string;
  org_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface VacationBalanceV1 {
  id: string;
  org_id: string;
  employee_id: string;
  dias_legales_totales: number;
  dias_progresivos: number;
  dias_adicionales: number;
  dias_usados: number;
  dias_pendientes: number;
  dias_disponibles: number;
  fecha_corte: string | null;
}

export interface FamilyMemberV1 {
  id: string;
  org_id: string;
  employee_id: string;
  nombre: string;
  apellido: string;
  parentesco: string;
  rut: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  es_carga_familiar: boolean;
  discapacidad: boolean;
}

export interface DocumentV1 {
  id: string;
  org_id: string;
  employee_id: string;
  tipo: string;
  nombre: string;
  storage_path: string | null;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  periodo: string | null;
  firmado: boolean;
  fecha_firma: string | null;
  created_at: string;
  updated_at: string;
}

// ─── useEmployeesV1 ────────────────────────────────────────────────────────────

export function useEmployeesV1() {
  const [data, setData] = useState<EmployeeV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/employees');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar empleadas');
      setData(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── useEmployeeV1 ─────────────────────────────────────────────────────────────

export function useEmployeeV1(id: string | null) {
  const [data, setData] = useState<EmployeeDetailV1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/employees/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar empleada');
      setData(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── useEmployeePayroll ────────────────────────────────────────────────────────

export function useEmployeePayroll(id: string | null) {
  const [data, setData] = useState<PayrollV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/employees/${id}/payroll`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar liquidaciones');
      setData(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── useEmployeeAbsences ───────────────────────────────────────────────────────

export function useEmployeeAbsences(id: string | null) {
  const [data, setData] = useState<AbsenceV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/employees/${id}/absences`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar ausencias');
      setData(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── useEmployeeVacationBalance ────────────────────────────────────────────────

export function useEmployeeVacationBalance(id: string | null) {
  const [data, setData] = useState<VacationBalanceV1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/employees/${id}/vacation-balance`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar saldo de vacaciones');
      setData(json.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── useEmployeeFamily ────────────────────────────────────────────────────────

export function useEmployeeFamily(id: string | null) {
  const [data, setData] = useState<FamilyMemberV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/employees/${id}/family`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar familia');
      setData(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}

// ─── useEmployeeDocuments ─────────────────────────────────────────────────────

export function useEmployeeDocuments(id: string | null) {
  const [data, setData] = useState<DocumentV1[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/employees/${id}/documents`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al cargar documentos');
      setData(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, error, refetch };
}
