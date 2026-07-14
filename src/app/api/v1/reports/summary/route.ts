import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const supabase = await createClient();

  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-07"

  const [empRes, payRes, absRes, otRes] = await Promise.all([
    supabase.from('employees').select('id, estado, fecha_ingreso'),
    supabase.from('payroll').select('sueldo_base, total_haberes, total_descuentos, sueldo_liquido, periodo').eq('periodo', currentMonth),
    supabase.from('absences').select('id, estado, tipo').order('created_at', { ascending: false }),
    supabase.from('overtime_requests').select('id, horas, monto, tipo, estado, fecha'),
  ]);

  const employees = empRes.data ?? [];
  const payroll = payRes.data ?? [];
  const absences = absRes.data ?? [];
  const overtime = otRes.data ?? [];

  const thisMonthOt = overtime.filter((o: { fecha?: string }) => o.fecha?.startsWith(currentMonth));

  return NextResponse.json({
    data: {
      headcount: {
        total: employees.length,
        activos: employees.filter((e: { estado: string }) => e.estado === 'activo').length,
        inactivos: employees.filter((e: { estado: string }) => e.estado === 'inactivo').length,
        licencia: employees.filter((e: { estado: string }) => e.estado === 'licencia').length,
        vacaciones: employees.filter((e: { estado: string }) => e.estado === 'vacaciones').length,
      },
      payroll: {
        periodo: currentMonth,
        total_haberes: payroll.reduce((s: number, p: { total_haberes?: number }) => s + (p.total_haberes ?? 0), 0),
        total_descuentos: payroll.reduce((s: number, p: { total_descuentos?: number }) => s + (p.total_descuentos ?? 0), 0),
        total_liquido: payroll.reduce((s: number, p: { sueldo_liquido?: number }) => s + (p.sueldo_liquido ?? 0), 0),
        count: payroll.length,
      },
      absences: {
        total: absences.length,
        pendientes: absences.filter((a: { estado: string }) => a.estado === 'pendiente').length,
        aprobadas: absences.filter((a: { estado: string }) => a.estado === 'aprobada').length,
        rechazadas: absences.filter((a: { estado: string }) => a.estado === 'rechazada').length,
      },
      overtime: {
        mes_actual: currentMonth,
        total_horas: thisMonthOt.reduce((s: number, o: { horas?: number }) => s + (o.horas ?? 0), 0),
        pendientes: overtime.filter((o: { estado: string }) => o.estado === 'pendiente').length,
        costo_estimado: thisMonthOt.reduce((s: number, o: { monto?: number; horas?: number; tipo?: string }) => {
          if (o.monto) return s + o.monto;
          return s + ((o.horas ?? 0) * (o.tipo === '100%' ? 20000 : 15000));
        }, 0),
      },
    },
  });
}
