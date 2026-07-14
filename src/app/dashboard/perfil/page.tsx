'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Users, DollarSign, Calendar, ArrowLeft } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

interface OrgProfile {
  id: string;
  nombre: string;
  plan: string;
  buk_tenant_url: string | null;
}

interface ReportSummary {
  headcount: { total: number; activos: number };
  payroll: { total_liquido: number; periodo: string };
}

const ROLE_LABELS: Record<string, string> = {
  org_admin: 'Administrador',
  hr_manager: 'RRHH',
  employee: 'Empleado',
  super_admin: 'Super Admin',
};

const PLAN_LABELS: Record<string, string> = {
  premium: 'Plan Premium',
  free: 'Plan Gratuito',
  enterprise: 'Plan Enterprise',
};

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-CL');
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PerfilPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/me').then(r => r.json()),
      fetch('/api/v1/organization/profile').then(r => r.json()),
      fetch('/api/v1/reports/summary').then(r => r.json()),
    ]).then(([userJson, orgJson, sumJson]) => {
      if (userJson.data) setUser(userJson.data);
      if (orgJson.data) setOrg(orgJson.data);
      if (sumJson.data) setSummary(sumJson.data);
    }).finally(() => setLoading(false));
  }, []);

  const initials = user?.full_name ? getInitials(user.full_name) : '??';
  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '—';
  const planLabel = org?.plan ? (PLAN_LABELS[org.plan] ?? org.plan) : '—';

  const periodLabel = summary?.payroll.periodo
    ? new Date(summary.payroll.periodo + '-01').toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
    : '—';

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1B1564] to-[#3730A3] flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name ?? '—'}</h2>
            <p className="text-sm text-gray-500 mt-1">{roleLabel}</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-[#F0197A]" />
                {user?.email ?? '—'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</div>
            <div className="text-sm font-bold text-[#F0197A] mt-1">{planLabel}</div>
            {org && (
              <div className="text-xs text-gray-400 mt-1">{org.nombre}</div>
            )}
          </div>
        </div>
      </div>

      {/* Mi Empresa Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Mi Empresa</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-500 text-sm font-medium">Colaboradoras Activas</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {summary?.headcount.activos ?? '—'}
                </div>
              </div>
              <div className="p-2.5 bg-emerald-100 rounded-lg">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-500 text-sm font-medium">Costo Mensual</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">
                  {summary ? fmt(summary.payroll.total_liquido) : '—'}
                </div>
              </div>
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-gray-500 text-sm font-medium">Período Activo</div>
                <div className="text-lg font-bold text-gray-900 mt-2 capitalize">{periodLabel}</div>
              </div>
              <div className="p-2.5 bg-[#F0197A]/10 rounded-lg">
                <Calendar className="w-5 h-5 text-[#F0197A]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-800">Plan Actual</div>
            <div className="text-xs text-gray-500 mt-1">{planLabel}</div>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F0197A]/10 text-[#F0197A] capitalize">
            {org?.plan ?? '—'}
          </span>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h3 className="font-semibold text-gray-900">¿Necesitas ayuda?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Accede a nuestro centro de ayuda, contacta al soporte o consulta la documentación.
            </p>
            <div className="flex gap-3 mt-3">
              <button className="text-sm font-medium text-blue-600 hover:underline">Centro de Ayuda</button>
              <span className="text-gray-300">•</span>
              <button className="text-sm font-medium text-blue-600 hover:underline">Contactar Soporte</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
