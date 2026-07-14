-- ============================================================
-- Migration 003: New tables — departments, job_positions,
-- contracts, family_members, vacation_balances, overtime_requests
-- ============================================================

-- departments
CREATE TABLE IF NOT EXISTS public.departments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  buk_id                integer,
  nombre                text NOT NULL,
  descripcion           text,
  parent_id             uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  manager_employee_id   uuid,
  cost_center_code      text,
  depth                 integer NOT NULL DEFAULT 0,
  active                boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, buk_id)
);

CREATE INDEX IF NOT EXISTS idx_departments_org    ON public.departments (org_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON public.departments (parent_id);

-- job_positions
CREATE TABLE IF NOT EXISTS public.job_positions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  buk_id        integer,
  nombre        text NOT NULL,
  descripcion   text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, buk_id)
);

CREATE INDEX IF NOT EXISTS idx_job_positions_org  ON public.job_positions (org_id);
CREATE INDEX IF NOT EXISTS idx_job_positions_dept ON public.job_positions (department_id);

-- Add normalized columns to employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS department_id    uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS job_position_id  uuid REFERENCES public.job_positions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS manager_id       uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS segundo_apellido text,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date,
  ADD COLUMN IF NOT EXISTS genero           text CHECK (genero IN ('M','F','otro')),
  ADD COLUMN IF NOT EXISTS estado_civil     text,
  ADD COLUMN IF NOT EXISTS email_personal   text,
  ADD COLUMN IF NOT EXISTS telefono_emergencia text,
  ADD COLUMN IF NOT EXISTS contacto_emergencia text,
  ADD COLUMN IF NOT EXISTS foto_url         text;

-- Add FK from departments.manager_employee_id
ALTER TABLE public.departments
  ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_employee_id)
  REFERENCES public.employees(id) ON DELETE SET NULL;

-- contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id          uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  buk_id               integer,
  tipo_contrato        text NOT NULL DEFAULT 'indefinido'
                         CHECK (tipo_contrato IN ('indefinido','plazo_fijo','obra_faena','honorarios','part_time')),
  fecha_inicio         date NOT NULL,
  fecha_termino        date,
  sueldo_base          integer NOT NULL DEFAULT 0,
  jornada_horas        integer NOT NULL DEFAULT 45,
  dias_vacaciones_base integer NOT NULL DEFAULT 15,
  gratificacion_tipo   text NOT NULL DEFAULT 'mensual_garantizada',
  afp_nombre           text,
  afp_tasa             numeric(6,4),
  salud_tipo           text DEFAULT 'fonasa' CHECK (salud_tipo IN ('fonasa','isapre')),
  salud_nombre         text,
  plan_salud_uf        numeric(10,4),
  mutual               text,
  banco                text,
  tipo_cuenta_banco    text CHECK (tipo_cuenta_banco IN ('corriente','vista','ahorro','rut')),
  numero_cuenta        text,
  activo               boolean NOT NULL DEFAULT true,
  motivo_termino       text,
  buk_synced_at        timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_employee ON public.contracts (employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org      ON public.contracts (org_id);
CREATE INDEX IF NOT EXISTS idx_contracts_activo   ON public.contracts (employee_id, activo) WHERE activo = true;

-- family_members
CREATE TABLE IF NOT EXISTS public.family_members (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id        uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  buk_id             integer,
  nombre             text NOT NULL,
  apellido           text NOT NULL,
  parentesco         text NOT NULL
                       CHECK (parentesco IN ('conyuge','conviviente','hijo','hija','padre','madre','hermano','hermana','otro')),
  rut                text,
  fecha_nacimiento   date,
  genero             text CHECK (genero IN ('M','F','otro')),
  es_carga_familiar  boolean NOT NULL DEFAULT false,
  discapacidad       boolean NOT NULL DEFAULT false,
  buk_synced_at      timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_family_employee ON public.family_members (employee_id);
CREATE INDEX IF NOT EXISTS idx_family_org      ON public.family_members (org_id);

-- vacation_balances
CREATE TABLE IF NOT EXISTS public.vacation_balances (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id           uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  dias_legales_totales  integer NOT NULL DEFAULT 15,
  dias_progresivos      integer NOT NULL DEFAULT 0,
  dias_adicionales      integer NOT NULL DEFAULT 0,
  dias_usados           integer NOT NULL DEFAULT 0,
  dias_pendientes       integer NOT NULL DEFAULT 0,
  dias_disponibles      integer NOT NULL DEFAULT 15,
  fecha_corte           date NOT NULL DEFAULT CURRENT_DATE,
  buk_synced_at         timestamptz,
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id)
);

CREATE INDEX IF NOT EXISTS idx_vac_balance_org      ON public.vacation_balances (org_id);
CREATE INDEX IF NOT EXISTS idx_vac_balance_employee ON public.vacation_balances (employee_id);

-- overtime_requests
CREATE TABLE IF NOT EXISTS public.overtime_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id      uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  buk_id           integer,
  fecha            date NOT NULL,
  horas            numeric(5,2) NOT NULL CHECK (horas > 0 AND horas <= 24),
  tipo             text NOT NULL DEFAULT '50%' CHECK (tipo IN ('50%','100%','otro')),
  monto            integer,
  estado           text NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente','aprobada','rechazada','pagada')),
  aprobado_por_id  uuid REFERENCES public.users(id),
  fecha_aprobacion timestamptz,
  observaciones    text,
  buk_synced_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_overtime_org      ON public.overtime_requests (org_id);
CREATE INDEX IF NOT EXISTS idx_overtime_employee ON public.overtime_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_estado   ON public.overtime_requests (org_id, estado);

-- Enable RLS on new tables
ALTER TABLE public.departments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_balances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_requests   ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables (org-scoped + HR-gated writes)
CREATE POLICY "dept_select"  ON public.departments FOR SELECT USING (org_id = public.get_org_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "dept_write"   ON public.departments FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

CREATE POLICY "pos_select"   ON public.job_positions FOR SELECT USING (org_id = public.get_org_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "pos_write"    ON public.job_positions FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

CREATE POLICY "contracts_select" ON public.contracts
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR (org_id = public.get_org_id() AND employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid()))
  );
CREATE POLICY "contracts_write" ON public.contracts FOR ALL USING (org_id = public.get_org_id() AND public.is_hr_or_above());

CREATE POLICY "family_select" ON public.family_members
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR (org_id = public.get_org_id() AND employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid()))
  );
CREATE POLICY "family_write"  ON public.family_members FOR ALL USING (org_id = public.get_org_id() AND public.is_hr_or_above());

CREATE POLICY "vac_balance_select" ON public.vacation_balances
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR (org_id = public.get_org_id() AND employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid()))
  );
CREATE POLICY "vac_balance_write"  ON public.vacation_balances FOR ALL USING (org_id = public.get_org_id() AND public.is_hr_or_above());

CREATE POLICY "overtime_select" ON public.overtime_requests
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR (org_id = public.get_org_id() AND employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid()))
  );
CREATE POLICY "overtime_insert" ON public.overtime_requests
  FOR INSERT WITH CHECK (
    org_id = public.get_org_id()
    AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid()))
  );
CREATE POLICY "overtime_update" ON public.overtime_requests FOR UPDATE USING (org_id = public.get_org_id() AND public.is_hr_or_above());
