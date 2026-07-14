'use client';

import { useRouter } from 'next/navigation';
import { Building2, Zap, CheckCircle } from 'lucide-react';

const STEPS = [
  { icon: Building2, label: 'Tu empresa',    href: '/onboarding/empresa'  },
  { icon: Zap,        label: 'Conexión BUK',  href: '/onboarding/buk'     },
  { icon: CheckCircle, label: 'Listo',        href: '/onboarding/completar' },
];

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1B1564] to-[#F0197A] mb-6">
          <span className="text-white text-3xl font-bold">P</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Bienvenida a Poppins HR</h1>
        <p className="text-gray-500 mb-10">
          Configura tu organización en 3 pasos rápidos y empieza a gestionar a tu equipo.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-16 h-px bg-gray-200 mb-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => router.push('/onboarding/empresa')}
          className="w-full py-3 px-6 bg-[#1B1564] text-white font-medium rounded-xl hover:bg-[#15104e] transition"
        >
          Comenzar configuración →
        </button>
      </div>
    </div>
  );
}
