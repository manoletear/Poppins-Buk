'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut } from 'lucide-react';

export default function Topbar() {
  const period = 'Marzo 2026';
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-[52px] min-h-[52px] bg-white border-b border-gray-200 flex items-center px-4 gap-[10px] z-50">
      {/* Period */}
      <div className="flex items-center gap-[6px] px-3 py-[5px] border border-gray-200 rounded-[20px] text-[13px] font-medium text-gray-700 cursor-pointer hover:bg-gray-50 whitespace-nowrap">
        📅 {period}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 h-[34px] flex-1 max-w-[380px]">
        <span className="text-gray-400 text-sm">🔍</span>
        <input
          placeholder="Buscar (Ctrl + B)"
          className="border-none bg-transparent outline-none font-inherit text-[13px] text-gray-700 w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex-1" />

      {/* User chip with dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-[10px] py-1 rounded-[20px] cursor-pointer border border-gray-200 hover:bg-gray-50 transition"
        >
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#1B1564] to-[#3730A3] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            RA
          </div>
          <span className="text-xs font-medium text-gray-700">Rene A.</span>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <Link
              href="/dashboard/perfil"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4" />
              Mi Perfil
            </Link>
            <Link
              href="/dashboard/configuracion"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Configuración
            </Link>
            <button
              onClick={() => {
                alert('Sesión cerrada');
                setIsOpen(false);
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
