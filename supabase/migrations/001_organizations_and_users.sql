-- ============================================================
-- Migration 001: Organizations + Users + JWT Hook
-- Rename employers → organizations, add users table, RLS helpers
-- ============================================================

-- 1. Rename existing table
ALTER TABLE public.employers RENAME TO organizations;
ALTER TABLE public.organizations RENAME COLUMN auth_user_id TO legacy_auth_user_id;

-- 2. Add new columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS slug            text UNIQUE,
  ADD COLUMN IF NOT EXISTS razon_social    text,
  ADD COLUMN IF NOT EXISTS buk_tenant_url  text,
  ADD COLUMN IF NOT EXISTS settings        jsonb NOT NULL DEFAULT '{}';

-- Generate slugs from existing rows
UPDATE public.organizations SET slug = LOWER(REGEXP_REPLACE(nombre, '[^a-zA-Z0-9]', '-', 'g')) WHERE slug IS NULL;
ALTER TABLE public.organizations ALTER COLUMN slug SET NOT NULL;

-- 3. Update FK on dependent tables (employer_id → org_id)
ALTER TABLE public.employees    RENAME COLUMN employer_id TO org_id;
ALTER TABLE public.benefits     RENAME COLUMN employer_id TO org_id;
ALTER TABLE public.buk_sync_log RENAME COLUMN employer_id TO org_id;

-- 4. Add org_id to tables that don't have it
ALTER TABLE public.absences         ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.payroll          ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.documents        ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.employee_benefits ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log        ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Backfill org_id from employee relationship
UPDATE public.absences a
   SET org_id = e.org_id
  FROM public.employees e
 WHERE a.employee_id = e.id AND a.org_id IS NULL;

UPDATE public.payroll p
   SET org_id = e.org_id
  FROM public.employees e
 WHERE p.employee_id = e.id AND p.org_id IS NULL;

UPDATE public.documents d
   SET org_id = e.org_id
  FROM public.employees e
 WHERE d.employee_id = e.id AND d.org_id IS NULL;

UPDATE public.employee_benefits eb
   SET org_id = e.org_id
  FROM public.employees e
 WHERE eb.employee_id = e.id AND eb.org_id IS NULL;

-- 5. Create users table
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
CREATE INDEX IF NOT EXISTS idx_users_email  ON public.users (email);

-- 6. RLS helper functions
CREATE OR REPLACE FUNCTION public.get_org_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT NULLIF((auth.jwt() -> 'app_metadata' ->> 'org_id'), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT NULLIF((auth.jwt() -> 'app_metadata' ->> 'role'), '');
$$;

CREATE OR REPLACE FUNCTION public.is_hr_or_above()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT public.get_user_role() IN ('super_admin','org_admin','hr_manager');
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT public.get_user_role() IN ('super_admin','org_admin');
$$;

-- 7. Custom JWT hook — injects org_id + role into every token
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  claims      jsonb;
  user_rec    record;
BEGIN
  SELECT u.org_id, u.role, u.employee_id
    INTO user_rec
    FROM public.users u
   WHERE u.id = (event ->> 'user_id')::uuid;

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

-- 8. updated_at trigger helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
