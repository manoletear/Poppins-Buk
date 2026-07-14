// ============================================
// Poppins HR — Database Types (Supabase/PostgreSQL)
// 17 tables — Phase 1 schema
// ============================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'super_admin' | 'org_admin' | 'hr_manager' | 'employee';
export type ContractType = 'indefinido' | 'plazo_fijo' | 'obra_faena' | 'honorarios' | 'part_time';
export type SaludType = 'fonasa' | 'isapre';
export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
export type PayrollStatus = 'borrador' | 'calculado' | 'aprobado' | 'pagado';
export type SyncStatus = 'success' | 'partial' | 'error';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          slug: string;
          nombre: string;
          rut: string | null;
          razon_social: string | null;
          email: string | null;
          telefono: string | null;
          direccion: string | null;
          comuna: string | null;
          region: string | null;
          plan: 'free' | 'premium' | 'enterprise';
          buk_company_id: string | null;
          buk_tenant_url: string | null;
          buk_api_token_encrypted: string | null;
          settings: Json;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nombre: string;
          rut?: string | null;
          razon_social?: string | null;
          email?: string | null;
          telefono?: string | null;
          direccion?: string | null;
          comuna?: string | null;
          region?: string | null;
          plan?: 'free' | 'premium' | 'enterprise';
          buk_company_id?: string | null;
          buk_tenant_url?: string | null;
          buk_api_token_encrypted?: string | null;
          settings?: Json;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };

      users: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string | null;
          role: UserRole;
          full_name: string;
          avatar_url: string | null;
          email: string;
          active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          org_id: string;
          employee_id?: string | null;
          role?: UserRole;
          full_name?: string;
          avatar_url?: string | null;
          email?: string;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };

      departments: {
        Row: {
          id: string;
          org_id: string;
          buk_id: number | null;
          nombre: string;
          descripcion: string | null;
          parent_id: string | null;
          manager_employee_id: string | null;
          cost_center_code: string | null;
          depth: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          buk_id?: number | null;
          nombre: string;
          descripcion?: string | null;
          parent_id?: string | null;
          manager_employee_id?: string | null;
          cost_center_code?: string | null;
          depth?: number;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };

      job_positions: {
        Row: {
          id: string;
          org_id: string;
          buk_id: number | null;
          nombre: string;
          descripcion: string | null;
          department_id: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          buk_id?: number | null;
          nombre: string;
          descripcion?: string | null;
          department_id?: string | null;
          activo?: boolean;
        };
        Update: Partial<Database['public']['Tables']['job_positions']['Insert']>;
      };

      employees: {
        Row: {
          id: string;
          org_id: string;
          buk_id: number | null;
          rut: string;
          nombre: string;
          apellido: string;
          segundo_apellido: string | null;
          fecha_nacimiento: string | null;
          genero: 'M' | 'F' | 'otro' | null;
          estado_civil: string | null;
          email: string | null;
          email_personal: string | null;
          telefono: string | null;
          telefono_emergencia: string | null;
          contacto_emergencia: string | null;
          direccion: string | null;
          comuna: string | null;
          region: string | null;
          department_id: string | null;
          job_position_id: string | null;
          manager_id: string | null;
          fecha_ingreso: string;
          estado: 'activo' | 'inactivo' | 'licencia' | 'vacaciones' | 'suspendido';
          puertas_adentro: boolean;
          foto_url: string | null;
          notas: string | null;
          buk_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          buk_id?: number | null;
          rut: string;
          nombre: string;
          apellido: string;
          segundo_apellido?: string | null;
          fecha_nacimiento?: string | null;
          genero?: 'M' | 'F' | 'otro' | null;
          estado_civil?: string | null;
          email?: string | null;
          email_personal?: string | null;
          telefono?: string | null;
          telefono_emergencia?: string | null;
          contacto_emergencia?: string | null;
          direccion?: string | null;
          comuna?: string | null;
          region?: string | null;
          department_id?: string | null;
          job_position_id?: string | null;
          manager_id?: string | null;
          fecha_ingreso: string;
          estado?: 'activo' | 'inactivo' | 'licencia' | 'vacaciones' | 'suspendido';
          puertas_adentro?: boolean;
          foto_url?: string | null;
          notas?: string | null;
        };
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };

      contracts: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          buk_id: number | null;
          tipo_contrato: ContractType;
          fecha_inicio: string;
          fecha_termino: string | null;
          sueldo_base: number;
          jornada_horas: number;
          dias_vacaciones_base: number;
          gratificacion_tipo: string;
          afp_nombre: string | null;
          afp_tasa: number | null;
          salud_tipo: SaludType | null;
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
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          buk_id?: number | null;
          tipo_contrato?: ContractType;
          fecha_inicio: string;
          fecha_termino?: string | null;
          sueldo_base: number;
          jornada_horas?: number;
          dias_vacaciones_base?: number;
          gratificacion_tipo?: string;
          afp_nombre?: string | null;
          afp_tasa?: number | null;
          salud_tipo?: SaludType | null;
          salud_nombre?: string | null;
          plan_salud_uf?: number | null;
          mutual?: string | null;
          banco?: string | null;
          tipo_cuenta_banco?: string | null;
          numero_cuenta?: string | null;
          activo?: boolean;
          motivo_termino?: string | null;
        };
        Update: Partial<Database['public']['Tables']['contracts']['Insert']>;
      };

      payroll: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          buk_id: number | null;
          periodo: string;
          dias_trabajados: number;
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
          estado: PayrollStatus;
          fecha_pago: string | null;
          pdf_url: string | null;
          buk_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          buk_id?: number | null;
          periodo: string;
          dias_trabajados?: number;
          sueldo_base: number;
          gratificacion?: number;
          horas_extra?: number;
          monto_horas_extra?: number;
          bonos?: number;
          colacion?: number;
          movilizacion?: number;
          otros_haberes?: number;
          total_haberes: number;
          desc_afp?: number;
          desc_salud?: number;
          desc_cesantia?: number;
          impuesto_unico?: number;
          otros_descuentos?: number;
          total_descuentos: number;
          sueldo_liquido: number;
          estado?: PayrollStatus;
          fecha_pago?: string | null;
          pdf_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['payroll']['Insert']>;
      };

      absences: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          buk_id: number | null;
          tipo: string;
          fecha_inicio: string;
          fecha_fin: string;
          dias: number;
          estado: RequestStatus;
          aprobado_por: string | null;
          fecha_aprobacion: string | null;
          observaciones: string | null;
          documento_url: string | null;
          buk_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          buk_id?: number | null;
          tipo: string;
          fecha_inicio: string;
          fecha_fin: string;
          dias: number;
          estado?: RequestStatus;
          aprobado_por?: string | null;
          observaciones?: string | null;
          documento_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['absences']['Insert']>;
      };

      vacation_balances: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          dias_legales_totales: number;
          dias_progresivos: number;
          dias_adicionales: number;
          dias_usados: number;
          dias_pendientes: number;
          dias_disponibles: number;
          fecha_corte: string;
          buk_synced_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          dias_legales_totales?: number;
          dias_progresivos?: number;
          dias_adicionales?: number;
          dias_usados?: number;
          dias_pendientes?: number;
          dias_disponibles?: number;
          fecha_corte?: string;
        };
        Update: Partial<Database['public']['Tables']['vacation_balances']['Insert']>;
      };

      overtime_requests: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          buk_id: number | null;
          fecha: string;
          horas: number;
          tipo: '50%' | '100%' | 'otro';
          monto: number | null;
          estado: RequestStatus;
          aprobado_por_id: string | null;
          fecha_aprobacion: string | null;
          observaciones: string | null;
          buk_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          buk_id?: number | null;
          fecha: string;
          horas: number;
          tipo?: '50%' | '100%' | 'otro';
          monto?: number | null;
          estado?: RequestStatus;
          observaciones?: string | null;
        };
        Update: Partial<Database['public']['Tables']['overtime_requests']['Insert']>;
      };

      benefits: {
        Row: {
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
        };
        Insert: {
          id?: string;
          org_id: string;
          nombre: string;
          descripcion?: string | null;
          monto?: number;
          tipo?: 'mensual' | 'anual' | 'unico' | 'variable';
          categoria?: string | null;
          activo?: boolean;
        };
        Update: Partial<Database['public']['Tables']['benefits']['Insert']>;
      };

      employee_benefits: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          benefit_id: string;
          monto_override: number | null;
          fecha_inicio: string;
          fecha_fin: string | null;
          activo: boolean;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          benefit_id: string;
          monto_override?: number | null;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          activo?: boolean;
          notas?: string | null;
        };
        Update: Partial<Database['public']['Tables']['employee_benefits']['Insert']>;
      };

      documents: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          tipo: 'contrato' | 'anexo' | 'liquidacion' | 'certificado' | 'finiquito' | 'licencia' | 'otro';
          nombre: string;
          storage_path: string;
          file_url: string | null;
          file_size: number | null;
          mime_type: string | null;
          periodo: string | null;
          firmado: boolean;
          fecha_firma: string | null;
          firmado_por_id: string | null;
          subido_por_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          tipo: 'contrato' | 'anexo' | 'liquidacion' | 'certificado' | 'finiquito' | 'licencia' | 'otro';
          nombre: string;
          storage_path: string;
          file_url?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          periodo?: string | null;
          firmado?: boolean;
          subido_por_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };

      family_members: {
        Row: {
          id: string;
          org_id: string;
          employee_id: string;
          buk_id: number | null;
          nombre: string;
          apellido: string;
          parentesco: string;
          rut: string | null;
          fecha_nacimiento: string | null;
          genero: 'M' | 'F' | 'otro' | null;
          es_carga_familiar: boolean;
          discapacidad: boolean;
          buk_synced_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          employee_id: string;
          buk_id?: number | null;
          nombre: string;
          apellido: string;
          parentesco: string;
          rut?: string | null;
          fecha_nacimiento?: string | null;
          genero?: 'M' | 'F' | 'otro' | null;
          es_carga_familiar?: boolean;
          discapacidad?: boolean;
        };
        Update: Partial<Database['public']['Tables']['family_members']['Insert']>;
      };

      buk_sync_log: {
        Row: {
          id: string;
          org_id: string;
          endpoint: string;
          direction: 'pull' | 'push';
          records_synced: number;
          records_failed: number;
          status: SyncStatus;
          error_message: string | null;
          error_details: Json | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          endpoint: string;
          direction: 'pull' | 'push';
          records_synced?: number;
          records_failed?: number;
          status: SyncStatus;
          error_message?: string | null;
          error_details?: Json | null;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['buk_sync_log']['Insert']>;
      };

      audit_log: {
        Row: {
          id: string;
          org_id: string | null;
          user_id: string | null;
          tabla: string;
          registro_id: string;
          accion: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'sync' | 'approve' | 'reject' | 'download';
          cambios: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          user_id?: string | null;
          tabla: string;
          registro_id: string;
          accion: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'sync' | 'approve' | 'reject' | 'download';
          cambios?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_org_id: { Args: Record<never, never>; Returns: string };
      get_user_role: { Args: Record<never, never>; Returns: string };
      is_hr_or_above: { Args: Record<never, never>; Returns: boolean };
      is_org_admin: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

// ── Shortcuts ──
export type Organization   = Database['public']['Tables']['organizations']['Row'];
export type User           = Database['public']['Tables']['users']['Row'];
export type Department     = Database['public']['Tables']['departments']['Row'];
export type JobPosition    = Database['public']['Tables']['job_positions']['Row'];
export type Employee       = Database['public']['Tables']['employees']['Row'];
export type Contract       = Database['public']['Tables']['contracts']['Row'];
export type Payroll        = Database['public']['Tables']['payroll']['Row'];
export type Absence        = Database['public']['Tables']['absences']['Row'];
export type VacationBalance = Database['public']['Tables']['vacation_balances']['Row'];
export type OvertimeRequest = Database['public']['Tables']['overtime_requests']['Row'];
export type Benefit        = Database['public']['Tables']['benefits']['Row'];
export type EmployeeBenefit = Database['public']['Tables']['employee_benefits']['Row'];
export type Document       = Database['public']['Tables']['documents']['Row'];
export type FamilyMember   = Database['public']['Tables']['family_members']['Row'];
export type BukSyncLog     = Database['public']['Tables']['buk_sync_log']['Row'];
export type AuditLog       = Database['public']['Tables']['audit_log']['Row'];
