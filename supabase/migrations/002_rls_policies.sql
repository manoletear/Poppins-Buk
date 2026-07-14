-- ============================================================
-- Migration 002: Enable RLS + all policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefits           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_benefits  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buk_sync_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log          ENABLE ROW LEVEL SECURITY;

-- ── organizations ──
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (
    id = public.get_org_id()
    OR public.get_user_role() = 'super_admin'
  );

CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE USING (
    id = public.get_org_id()
    AND public.is_org_admin()
  );

-- ── users ──
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR id = auth.uid()
  );

CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (
    org_id = public.get_org_id()
    AND public.is_org_admin()
  );

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_org_admin())
    OR id = auth.uid()
  );

-- ── employees ──
CREATE POLICY "employees_select" ON public.employees
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR org_id = public.get_org_id()
  );

CREATE POLICY "employees_insert" ON public.employees
  FOR INSERT WITH CHECK (
    org_id = public.get_org_id()
    AND public.is_hr_or_above()
  );

CREATE POLICY "employees_update" ON public.employees
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
  );

CREATE POLICY "employees_delete" ON public.employees
  FOR DELETE USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_org_admin())
  );

-- ── payroll (datos sensibles) ──
CREATE POLICY "payroll_select" ON public.payroll
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR (
      org_id = public.get_org_id()
      AND employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "payroll_write" ON public.payroll
  FOR ALL USING (
    org_id = public.get_org_id()
    AND public.is_hr_or_above()
  );

-- ── absences ──
CREATE POLICY "absences_select" ON public.absences
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR (
      org_id = public.get_org_id()
      AND employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "absences_insert" ON public.absences
  FOR INSERT WITH CHECK (
    org_id = public.get_org_id()
    AND (
      public.is_hr_or_above()
      OR employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "absences_update" ON public.absences
  FOR UPDATE USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
  );

-- ── documents ──
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR (
      org_id = public.get_org_id()
      AND employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "documents_write" ON public.documents
  FOR ALL USING (
    org_id = public.get_org_id()
    AND public.is_hr_or_above()
  );

-- ── benefits ──
CREATE POLICY "benefits_select" ON public.benefits
  FOR SELECT USING (org_id = public.get_org_id() OR public.get_user_role() = 'super_admin');

CREATE POLICY "benefits_write" ON public.benefits
  FOR ALL USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- ── employee_benefits ──
CREATE POLICY "emp_benefits_select" ON public.employee_benefits
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_hr_or_above())
    OR (
      org_id = public.get_org_id()
      AND employee_id = (SELECT employee_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "emp_benefits_write" ON public.employee_benefits
  FOR ALL USING (org_id = public.get_org_id() AND public.is_hr_or_above());

-- ── buk_sync_log ──
CREATE POLICY "sync_log_select" ON public.buk_sync_log
  FOR SELECT USING (org_id = public.get_org_id() AND public.is_hr_or_above());

CREATE POLICY "sync_log_insert" ON public.buk_sync_log
  FOR INSERT WITH CHECK (org_id = public.get_org_id());

-- ── audit_log ──
CREATE POLICY "audit_select" ON public.audit_log
  FOR SELECT USING (
    public.get_user_role() = 'super_admin'
    OR (org_id = public.get_org_id() AND public.is_org_admin())
  );

CREATE POLICY "audit_insert" ON public.audit_log
  FOR INSERT WITH CHECK (true);
