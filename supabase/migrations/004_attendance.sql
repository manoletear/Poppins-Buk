-- ============================================================
-- Migration 004: attendance table + RLS policies
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id      uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  fecha            date NOT NULL,
  hora_entrada     time,
  hora_salida      time,
  horas_trabajadas numeric(4,2),
  tipo             text NOT NULL DEFAULT 'normal'
                     CHECK (tipo IN ('normal','feriado','turno_extra')),
  estado           text NOT NULL DEFAULT 'presente'
                     CHECK (estado IN ('presente','ausente','tardanza','media_jornada')),
  observaciones    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, employee_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_attendance_org      ON public.attendance (org_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance (employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_fecha    ON public.attendance (org_id, fecha DESC);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "att_select" ON public.attendance
  FOR SELECT USING (org_id = public.get_org_id());

CREATE POLICY "att_write" ON public.attendance
  FOR ALL USING (org_id = public.get_org_id() AND public.is_hr_or_above());

CREATE OR REPLACE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
