'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface OrgProfile {
  id: string;
  nombre: string;
  rut: string | null;
  razon_social: string | null;
  email: string | null;
  telefono: string | null;
  buk_tenant_url: string | null;
  plan: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  org_admin: 'Administrador',
  hr_manager: 'RRHH',
  employee: 'Empleado',
  super_admin: 'Super Admin',
};

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-9 h-5 rounded-full transition-colors relative ${value ? 'bg-[#F0197A]' : 'bg-gray-200'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function ConfiguracionPage() {
  const [org, setOrg] = useState<OrgProfile | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<OrgProfile>>({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    vencimiento: true,
    vacaciones: true,
    liquidaciones: false,
    cumplimiento: true,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/organization/profile').then(r => r.json()),
      fetch('/api/v1/me').then(r => r.json()),
    ]).then(([orgJson, userJson]) => {
      if (orgJson.data) setOrg(orgJson.data);
      if (userJson.data) setUser(userJson.data);
    }).finally(() => setLoading(false));
  }, []);

  const startEdit = () => {
    if (!org) return;
    setEditForm({
      nombre: org.nombre,
      rut: org.rut ?? '',
      razon_social: org.razon_social ?? '',
      email: org.email ?? '',
      telefono: org.telefono ?? '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/organization/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.data) setOrg(json.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/v1/sync/buk/employees', { method: 'POST' });
      const json = await res.json();
      setSyncMsg(json.message ?? 'Sincronización completada');
    } catch {
      setSyncMsg('Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-40 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Configuración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1 — Conexión BUK */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔗</span>
            <div>
              <div className="font-semibold text-gray-800">Conexión BUK</div>
              <div className="text-xs text-gray-400">Estado de la integración con BUK API</div>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tenant URL</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[180px]">
                {org?.buk_tenant_url ?? 'No configurado'}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Estado</span>
              {org?.buk_tenant_url ? (
                <div className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle size={14} />
                  <span className="text-xs font-semibold">Conectado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-600">
                  <XCircle size={14} />
                  <span className="text-xs font-semibold">Sin configurar</span>
                </div>
              )}
            </div>
          </div>
          <a
            href="/onboarding/buk"
            className="inline-block text-xs text-[#F0197A] font-semibold hover:underline"
          >
            {org?.buk_tenant_url ? 'Reconfigurar BUK →' : 'Configurar BUK →'}
          </a>
        </div>

        {/* Card 2 — Datos de la Empresa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏢</span>
              <div>
                <div className="font-semibold text-gray-800">Datos de la Empresa</div>
                <div className="text-xs text-gray-400">Información de la organización</div>
              </div>
            </div>
            {!editing && (
              <button
                onClick={startEdit}
                className="text-xs text-[#F0197A] font-semibold hover:underline"
              >
                Editar
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              {(['nombre', 'rut', 'email', 'telefono'] as const).map(field => (
                <div key={field}>
                  <label className="text-xs text-gray-500 capitalize">{field}</label>
                  <input
                    type="text"
                    value={(editForm[field] as string) ?? ''}
                    onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full mt-0.5 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F0197A]/20 focus:border-[#F0197A] transition"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 bg-[#F0197A] text-white text-xs font-semibold rounded-lg hover:bg-[#d4166c] transition disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nombre</span>
                <span className="font-medium text-gray-800">{org?.nombre ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RUT</span>
                <span className="font-medium text-gray-800">{org?.rut ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-800">{org?.email ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F0197A]/10 text-[#F0197A] capitalize">
                  {org?.plan ?? '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 3 — Notificaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <div>
              <div className="font-semibold text-gray-800">Notificaciones</div>
              <div className="text-xs text-gray-400">Alertas y recordatorios</div>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-600">Vencimiento de contratos</span>
              <Toggle value={notifications.vencimiento} onChange={() => toggleNotification('vencimiento')} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-600">Solicitudes de vacaciones</span>
              <Toggle value={notifications.vacaciones} onChange={() => toggleNotification('vacaciones')} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-600">Liquidaciones listas</span>
              <Toggle value={notifications.liquidaciones} onChange={() => toggleNotification('liquidaciones')} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-600">Alertas de cumplimiento</span>
              <Toggle value={notifications.cumplimiento} onChange={() => toggleNotification('cumplimiento')} />
            </label>
          </div>
        </div>

        {/* Card 4 — Mi Cuenta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">👤</span>
            <div>
              <div className="font-semibold text-gray-800">Mi Cuenta</div>
              <div className="text-xs text-gray-400">Perfil del usuario actual</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Nombre</span>
              <span className="font-medium text-gray-800">{user?.full_name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800 truncate max-w-[180px]">{user?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rol</span>
              <span className="font-medium text-gray-800">
                {user?.role ? (ROLE_LABELS[user.role] ?? user.role) : '—'}
              </span>
            </div>
          </div>
          <div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar con BUK'}
            </button>
            {syncMsg && (
              <p className="text-xs text-gray-500 mt-1">{syncMsg}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
