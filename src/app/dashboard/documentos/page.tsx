'use client';

import { useState, useEffect, useRef } from 'react';

interface Employee {
  id: string;
  nombre: string;
  apellido: string;
  rut: string;
}

interface Document {
  id: string;
  org_id: string;
  employee_id: string;
  tipo: string;
  nombre: string;
  storage_path: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  periodo: string | null;
  firmado: boolean;
  subido_por_id: string | null;
  created_at: string;
  employee?: {
    id: string;
    nombre: string;
    apellido: string;
    rut: string;
  } | null;
}

const tipoLabels: Record<string, string> = {
  contrato: 'Contrato',
  anexo: 'Anexo',
  liquidacion: 'Liquidación',
  certificado: 'Certificado',
  finiquito: 'Finiquito',
  licencia: 'Licencia',
  otro: 'Otro',
};

const TIPOS = Object.keys(tipoLabels) as Array<keyof typeof tipoLabels>;

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Upload modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form fields
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formTipo, setFormTipo] = useState<string>(TIPOS[0]);
  const [formPeriodo, setFormPeriodo] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function fetchDocuments() {
    setLoading(true);
    setError(null);
    fetch('/api/v1/documents')
      .then(r => r.json())
      .then(json => {
        setDocuments(Array.isArray(json.data) ? json.data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err?.message ?? 'Error desconocido');
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  function openModal() {
    setModalOpen(true);
    setUploadError(null);
    setFormEmployeeId('');
    setFormTipo(TIPOS[0]);
    setFormPeriodo('');
    setFormFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (employees.length === 0) {
      setEmployeesLoading(true);
      fetch('/api/v1/employees')
        .then(r => r.json())
        .then(json => {
          setEmployees(Array.isArray(json.data) ? json.data : []);
          setEmployeesLoading(false);
        })
        .catch(() => setEmployeesLoading(false));
    }
  }

  function closeModal() {
    setModalOpen(false);
    setUploadError(null);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!formFile || !formEmployeeId || !formTipo) {
      setUploadError('Completa todos los campos requeridos.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1: get presigned upload URL
      const urlRes = await fetch('/api/v1/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: formEmployeeId,
          tipo: formTipo,
          filename: formFile.name,
          mime_type: formFile.type,
          file_size: formFile.size,
        }),
      });

      const urlJson = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlJson.error ?? 'Error obteniendo URL de subida');

      const { upload_url, storage_path } = urlJson;

      // Step 2: PUT the file directly to Supabase Storage
      const putRes = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': formFile.type || 'application/octet-stream' },
        body: formFile,
      });

      if (!putRes.ok) throw new Error('Error subiendo archivo al storage');

      // Step 3: register document record
      const nombre = formFile.name.replace(/\.[^.]+$/, '');
      const docRes = await fetch('/api/v1/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: formEmployeeId,
          tipo: formTipo,
          nombre,
          storage_path,
          file_size: formFile.size,
          mime_type: formFile.type || null,
          periodo: formPeriodo || null,
        }),
      });

      const docJson = await docRes.json();
      if (!docRes.ok) throw new Error(docJson.error ?? 'Error registrando documento');

      closeModal();
      fetchDocuments();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(docId: string) {
    try {
      const res = await fetch(`/api/v1/documents/${docId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error');
      const url = json.data?.download_url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      alert('No se pudo obtener el enlace de descarga.');
    }
  }

  async function handleDelete(docId: string, nombre: string) {
    if (!confirm(`¿Eliminar el documento "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/v1/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Error eliminando');
      }
      fetchDocuments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error eliminando documento');
    }
  }

  const filtered = documents.filter(d => {
    if (filterTipo && d.tipo !== filterTipo) return false;
    if (search) {
      const q = search.toLowerCase();
      const empName = d.employee
        ? `${d.employee.nombre} ${d.employee.apellido}`.toLowerCase()
        : '';
      return d.nombre.toLowerCase().includes(q) || empName.includes(q);
    }
    return true;
  });

  const byType = TIPOS.reduce<Record<string, number>>((acc, t) => {
    acc[t] = documents.filter(d => d.tipo === t).length;
    return acc;
  }, {});

  const presentTypes = TIPOS.filter(t => byType[t] > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Documentos</h1>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-[#F0197A] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#d41469] transition"
        >
          + Subir Documento
        </button>
      </div>

      {/* Summary Cards */}
      {presentTypes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {presentTypes.map(tipo => (
            <button
              key={tipo}
              onClick={() => setFilterTipo(filterTipo === tipo ? '' : tipo)}
              className={`bg-white rounded-xl shadow-sm border p-4 text-left transition hover:shadow-md ${
                filterTipo === tipo ? 'border-[#F0197A] ring-1 ring-[#F0197A]' : 'border-gray-100'
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{byType[tipo]}</div>
              <div className="text-xs text-gray-500 font-medium mt-1">{tipoLabels[tipo]}</div>
            </button>
          ))}
        </div>
      )}

      {error && <div className="text-red-500 text-sm">Error: {error}</div>}

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white rounded-lg px-3 h-10 shadow-sm border border-gray-100 flex-1 max-w-sm">
          <span className="text-gray-400 text-sm">&#128269;</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o colaboradora..."
            className="border-none bg-transparent outline-none text-sm text-gray-700 w-full placeholder:text-gray-400"
          />
        </div>
        {filterTipo && (
          <button
            onClick={() => setFilterTipo('')}
            className="text-xs text-[#F0197A] font-medium hover:underline"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400">Cargando documentos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-gray-400">No hay documentos para mostrar.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Empleada</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Nombre</th>
                <th className="px-3 py-3">Período</th>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Firmado</th>
                <th className="px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-800 font-medium">
                    {doc.employee
                      ? `${doc.employee.nombre} ${doc.employee.apellido}`
                      : doc.employee_id}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {tipoLabels[doc.tipo] ?? doc.tipo}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{doc.nombre}</td>
                  <td className="px-3 py-3 text-gray-500">{doc.periodo ?? '-'}</td>
                  <td className="px-3 py-3 text-gray-500">{formatDate(doc.created_at)}</td>
                  <td className="px-3 py-3">
                    {doc.firmado ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Firmado
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="text-xs text-[#F0197A] font-medium hover:underline"
                      >
                        Descargar
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id, doc.nombre)}
                        className="text-xs text-red-400 font-medium hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Subir Documento</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Employee select */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Colaboradora <span className="text-red-400">*</span>
                </label>
                {employeesLoading ? (
                  <div className="text-xs text-gray-400">Cargando colaboradoras...</div>
                ) : (
                  <select
                    value={formEmployeeId}
                    onChange={e => setFormEmployeeId(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#F0197A] focus:ring-1 focus:ring-[#F0197A]"
                  >
                    <option value="">Seleccionar colaboradora...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} {emp.apellido} — {emp.rut}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tipo de documento <span className="text-red-400">*</span>
                </label>
                <select
                  value={formTipo}
                  onChange={e => setFormTipo(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#F0197A] focus:ring-1 focus:ring-[#F0197A]"
                >
                  {TIPOS.map(t => (
                    <option key={t} value={t}>
                      {tipoLabels[t]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Período */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Período{' '}
                  <span className="text-gray-400 font-normal">(opcional, ej: 2024-06)</span>
                </label>
                <input
                  type="month"
                  value={formPeriodo}
                  onChange={e => setFormPeriodo(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#F0197A] focus:ring-1 focus:ring-[#F0197A]"
                />
              </div>

              {/* File */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Archivo <span className="text-red-400">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  required
                  onChange={e => setFormFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F0197A] file:text-white hover:file:bg-[#d41469] cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 mt-1">PDF, DOC, DOCX, JPG o PNG</p>
              </div>

              {uploadError && (
                <div className="text-sm text-red-500">{uploadError}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-2 rounded-lg bg-[#F0197A] text-white text-sm font-semibold hover:bg-[#d41469] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Subiendo...' : 'Subir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
