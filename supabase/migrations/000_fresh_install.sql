-- ============================================================
-- Migration 000: Fresh install — creates everything from scratch
-- Use this if the Supabase project is brand new (no prior schema)
-- ============================================================

-- ── Core: organizations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     text UNIQUE NOT NULL,
  nombre                   text NOT NULL,
  rut                      text,
  razon_social             text,
  email                    text,
  telefono                 text,
  direccion                text,
  comuna                   text,
  region                   text,
  plan                     text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium','enterprise')),
  buk_company_id           text,
  buk_tenant_url           text,
  buk_api_token_encrypted  text,
  settings                 jsonb NOT NULL DEFAULT '{}',
  active                   boolean NOT NULL DEFAULT true,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id   uuid,
  role          text NOT NULL DEFAULT 'employee'
                  CHECK (role IN ('super_admin','org_admin','hr_manager','employee')),
  full_name     text NOT NULL DEFAULT '',
  avatar_url    text,
  email         text NOT NULL DEFAULT '',
  active        boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users (org_id);
CREATE INDEX IF NOT EXISTS idx_users_role   ON public.users (org_id, role);

-- ── Departments ───────────────────────────────────────────────
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

-- ── Job Positions ─────────────────────────────────────────────
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

-- ── Employees ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  buk_id               integer,
  rut                  text NOT NULL,
  nombre               text NOT NULL,
  apellido             text NOT NULL,
  segundo_apellido     text,
  fecha_nacimiento     date,
  genero               text CHECK (genero IN ('M','F','otro')),
  estado_civil         text,
  email                text,
  email_personal       text,
  telefono             text,
  telefono_emergencia  text,
  contacto_emergencia  text,
  direccion            text,
  comuna               text,
  region               text,
  department_id        uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  job_position_id      uuid REFERENCES public.job_positions(id) ON DELETE SET NULL,
  manager_id           uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  fecha_ingreso        date NOT NULL,
  estado               text NOT NULL DEFAULT 'activo'
                         CHECK (estado IN ('activo','inactivo','licencia','vacaciones','suspendido')),
  puertas_adentro      boolean NOT NULL DEFAULT false,
  foto_url             text,
  notas                text,
  buk_synced_at        timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, rut)
);

CREATE INDEX IF NOT EXISTS idx_employees_org    ON public.employees (org_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees (org_id, estado);

-- Back-ref FK on departments
ALTER TABLE public.departments
  ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_employee_id)
  REFERENCES public.employees(id) ON DELETE SET NULL;

-- ── Contracts ─────────────────────────────────────────────────
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
  gratificacion_tipo   text NOT NULL DEFAULT 'proporcional',
  afp_nombre           text,
  afp_tasa             numeric(6,4),
  salud_tipo           text DEFAULT 'fonasa' CHECK (salud_tipo IN ('fonasa','isapre')),
  salud_nombre         text,
  plan_salud_uf        numeric(10,4),
  mutual               text,
  banco                text,
  tipo_cuenta_banco    text,
  numero_cuenta        text,
  activo               boolean NOT NULL DEFAULT true,
  motivo_termino       text,
  buk_synced_at        timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_employee ON public.contracts (employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_activo   ON public.contracts (employee_id, activo) WHERE activo = true;

-- ── Payroll ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payroll (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id       uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  buk_id            integer,
  periodo           text NOT NULL,
  dias_trabajados   integer NOT NULL DEFAULT 30,
  sueldo_base       integer NOT NULL DEFAULT 0,
  gratificacion     integer NOT NULL DEFAULT 0,
  horas_extra       numeric(5,2) NOT NULL DEFAULT 0,
  monto_horas_extra integer NOT NULL DEFAULT 0,
  bonos             integer NOT NULL DEFAULT 0,
  colacion          integer NOT NULL DEFAULT 0,
  movilizacion      integer NOT NULL DEFAULT 0,
  otros_haberes     integer NOT NULL DEFAULT 0,
  total_haberes     integer NOT NULL DEFAULT 0,
  desc_afp          integer NOT NULL DEFAULT 0,
  desc_salud        integer NOT NULL DEFAULT 0,
  desc_cesantia     integer NOT NULL DEFAULT 0,
  impuesto_unico    integer NOT NULL DEFAULT 0,
  otros_descuentos  integer NOT NULL DEFAULT 0,
  total_descuentos  integer NOT NULL DEFAULT 0,
  sueldo_liquido    integer NOT NULL DEFAULT 0,
  estado            text NOT NULL DEFAULT 'borrador'
                      CHECK (estado IN ('borrador','calculado','aprobado','pagado')),
  fecha_pago        date,
  pdf_url           text,
  buk_synced_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_payroll_org     ON public.payroll (org_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periodo ON public.payroll (org_id, periodo);

-- ── Absences ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.absences (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id      uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  buk_id           integer,
  tipo             text NOT NULL,
  fecha_inicio     date NOT NULL,
  fecha_fin        date NOT NULL,
  dias             integer NOT NULL,
  estado           text NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente','aprobada','rechazada','cancelada')),
  aprobado_por     uuid REFERENCES public.users(id),
  fecha_aprobacion timestamptz,
  observaciones    text,
  documento_url    text,
  buk_synced_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_absences_org      ON public.absences (org_id);
CREATE INDEX IF NOT EXISTS idx_absences_employee ON public.absences (employee_id);

-- ── Vacation Balances ─────────────────────────────────────────
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

-- ── Overtime Requests ─────────────────────────────────────────
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
                     CHECK (estado IN ('pendiente','aprobada','rechazada','cancelada')),
  aprobado_por_id  uuid REFERENCES public.users(id),
  fecha_aprobacion timestamptz,
  observaciones    text,
  buk_synced_at    timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_overtime_org      ON public.overtime_requests (org_id);
CREATE INDEX IF NOT EXISTS idx_overtime_employee ON public.overtime_requests (employee_id);

-- ── Benefits ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.benefits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nombre      text NOT NULL,
  descripcion text,
  monto       integer NOT NULL DEFAULT 0,
  tipo        text NOT NULL DEFAULT 'mensual' CHECK (tipo IN ('mensual','anual','unico','variable')),
  categoria   text,
  activo      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Employee Benefits ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employee_benefits (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id    uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  benefit_id     uuid NOT NULL REFERENCES public.benefits(id) ON DELETE CASCADE,
  monto_override integer,
  fecha_inicio   date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin      date,
  activo         boolean NOT NULL DEFAULT true,
  notas          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── Documents ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id    uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tipo           text NOT NULL CHECK (tipo IN ('contrato','anexo','liquidacion','certificado','finiquito','licencia','otro')),
  nombre         text NOT NULL,
  storage_path   text NOT NULL,
  file_url       text,
  file_size      integer,
  mime_type      text,
  periodo        text,
  firmado        boolean NOT NULL DEFAULT false,
  fecha_firma    timestamptz,
  firmado_por_id uuid REFERENCES public.users(id),
  subido_por_id  uuid REFERENCES public.users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_org      ON public.documents (org_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON public.documents (employee_id);

-- ── Family Members ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_members (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id       uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  buk_id            integer,
  nombre            text NOT NULL,
  apellido          text NOT NULL,
  parentesco        text NOT NULL,
  rut               text,
  fecha_nacimiento  date,
  genero            text CHECK (genero IN ('M','F','otro')),
  es_carga_familiar boolean NOT NULL DEFAULT false,
  discapacidad      boolean NOT NULL DEFAULT false,
  buk_synced_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ── Sync Log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.buk_sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  endpoint        text NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('pull','push')),
  records_synced  integer NOT NULL DEFAULT 0,
  records_failed  integer NOT NULL DEFAULT 0,
  status          text NOT NULL CHECK (status IN ('success','partial','error')),
  error_message   text,
  error_details   jsonb,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

-- ── Audit Log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tabla       text NOT NULL,
  registro_id text NOT NULL,
  accion      text NOT NULL CHECK (accion IN ('create','update','delete','login','logout','sync','approve','reject','download')),
  cambios     jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── RLS helper functions ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NULLIF((auth.jwt() -> 'app_metadata' ->> 'org_id'), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT NULLIF((auth.jwt() -> 'app_metadata' ->> 'role'), '');
$$;

CREATE OR REPLACE FUNCTION public.is_hr_or_above()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT public.get_user_role() IN ('super_admin','org_admin','hr_manager');
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT public.get_user_role() IN ('super_admin','org_admin');
$$;

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT unnest(ARRAY['organizations','users','employees','contracts','payroll','absences','departments','job_positions','overtime_requests','benefits','employee_benefits'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%s', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

-- ── JWT custom hook ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE claims jsonb; user_rec record; BEGIN
  SELECT u.org_id, u.role, u.employee_id INTO user_rec
    FROM public.users u WHERE u.id = (event ->> 'user_id')::uuid;
  claims := event -> 'claims';
  IF user_rec IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata,org_id}',      to_jsonb(user_rec.org_id::text));
    claims := jsonb_set(claims, '{app_metadata,role}',        to_jsonb(user_rec.role));
    claims := jsonb_set(claims, '{app_metadata,employee_id}', to_jsonb(COALESCE(user_rec.employee_id::text, '')));
    claims := jsonb_set(claims, '{app_metadata,needs_onboarding}', 'false'::jsonb);
  ELSE
    claims := jsonb_set(claims, '{app_metadata,needs_onboarding}', 'true'::jsonb);
  END IF;
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC, anon, authenticated;

-- ── Enable RLS ────────────────────────────────────────────────
ALTER TABLE public.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_balances  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_benefits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buk_sync_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──────────────────────────────────────────────
-- organizations
CREATE POLICY "org_select" ON public.organizations FOR SELECT USING (id = public.get_org_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "org_update" ON public.organizations FOR UPDATE USING (id = public.get_org_id() AND public.is_org_admin());

-- users
CREATE POLICY "users_select"  ON public.users FOR SELECT  USING (org_id = public.get_org_id() OR id = auth.uid() OR public.get_user_role() = 'super_admin');
CREATE POLICY "users_insert"  ON public.users FOR INSERT  WITH CHECK (org_id = public.get_org_id());
CREATE POLICY "users_update"  ON public.users FOR UPDATE  USING (org_id = public.get_org_id() AND (public.is_org_admin() OR id = auth.uid()));

-- employees
CREATE POLICY "emp_select"  ON public.employees FOR SELECT USING (org_id = public.get_org_id() OR public.get_user_role() = 'super_admin');
CREATE POLICY "emp_insert"  ON public.employees FOR INSERT WITH CHECK (org_id = public.get_org_id() AND public.is_hr_or_above());
CREATE POLICY "emp_update"  ON public.employees FOR UPDATE USING (org_id = public.get_org_id() AND public.is_hr_or_above());
CREATE POLICY "emp_delete"  ON public.employees FOR DELETE USING (org_id = public.get_org_id() AND public.is_org_admin());

-- departments & positions
CREATE POLICY "dept_select" ON public.departments FOR SELECT USING (org_id = public.get_org_id());
CREATE POLICY "dept_write"  ON public.departments FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());
CREATE POLICY "pos_select"  ON public.job_positions FOR SELECT USING (org_id = public.get_org_id());
CREATE POLICY "pos_write"   ON public.job_positions FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- contracts
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT USING (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "contracts_write"  ON public.contracts FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- payroll
CREATE POLICY "payroll_select" ON public.payroll FOR SELECT USING (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "payroll_write"  ON public.payroll FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- absences
CREATE POLICY "abs_select" ON public.absences FOR SELECT USING (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "abs_insert" ON public.absences FOR INSERT WITH CHECK (org_id = public.get_org_id());
CREATE POLICY "abs_update" ON public.absences FOR UPDATE USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- vacation_balances
CREATE POLICY "vac_select" ON public.vacation_balances FOR SELECT USING (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "vac_write"  ON public.vacation_balances FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- overtime
CREATE POLICY "ot_select" ON public.overtime_requests FOR SELECT USING (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "ot_insert" ON public.overtime_requests FOR INSERT WITH CHECK (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "ot_update" ON public.overtime_requests FOR UPDATE USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- documents
CREATE POLICY "doc_select" ON public.documents FOR SELECT USING (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "doc_insert" ON public.documents FOR INSERT WITH CHECK (org_id = public.get_org_id() AND public.is_hr_or_above());
CREATE POLICY "doc_delete" ON public.documents FOR DELETE USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- family_members
CREATE POLICY "fam_select" ON public.family_members FOR SELECT USING (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "fam_write"  ON public.family_members FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- benefits
CREATE POLICY "ben_select" ON public.benefits FOR SELECT USING (org_id = public.get_org_id());
CREATE POLICY "ben_write"  ON public.benefits FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- employee_benefits
CREATE POLICY "empben_select" ON public.employee_benefits FOR SELECT USING (org_id = public.get_org_id() AND (public.is_hr_or_above() OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())));
CREATE POLICY "empben_write"  ON public.employee_benefits FOR ALL   USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- sync_log & audit
CREATE POLICY "sync_select" ON public.buk_sync_log FOR SELECT USING (org_id = public.get_org_id() AND public.is_hr_or_above());
CREATE POLICY "sync_insert" ON public.buk_sync_log FOR INSERT WITH CHECK (org_id = public.get_org_id());
CREATE POLICY "audit_select" ON public.audit_log FOR SELECT USING (org_id = public.get_org_id() AND public.is_org_admin());
CREATE POLICY "audit_insert" ON public.audit_log FOR INSERT WITH CHECK (true);
