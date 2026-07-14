'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle, Users, FileText, Calendar } from 'lucide-react';

const FEATURES = [
  { icon: Users,    label: 'Gestión de colaboradoras' },
  { icon: FileText, label: 'Liquidaciones y payroll' },
  { icon: Calendar, label: 'Vacaciones y asistencia' },
];

export default function OnboardingCompletarPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">¡Todo listo!</h1>
        <p className="text-gray-500 mb-8">
          Tu organización está configurada. Ya puedes empezar a gestionar a tu equipo.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 text-left">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Disponible desde hoy:</h3>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#1B1564]/10 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#1B1564]" />
                </div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 bg-[#1B1564] text-white font-medium rounded-xl hover:bg-[#15104e] transition"
        >
          Ir al dashboard →
        </button>
      </div>
    </div>
  );
}
