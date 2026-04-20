'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';

interface AnioEscolar {
  id: string;
  anio: number;
  activo: boolean;
}

interface Seccion {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
  gradoNivel: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
}

interface Curso {
  id: string;
  nombre: string;
  nivel: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
}

interface Alumno {
  id: string;
  apellidos: string;
  nombres: string;
  codigoEstudiante: string;
  seccionId?: string;
}

interface Matricula {
  id: string;
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  cursoId: string;
  cursoNombre: string;
  seccionId: string;
  seccionNombre: string;
  anioEscolarId: string;
  anioEscolar: number;
  origen: string;
}

export default function MatriculasPage() {
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    anioEscolarId: '',
    seccionId: '',
    cursoId: '',
    alumnoId: '',
  });

  const selectedSeccion = useMemo(
    () => secciones.find((s) => s.id === filters.seccionId),
    [secciones, filters.seccionId]
  );

  const cursosCompatibles = useMemo(
    () => selectedSeccion ? cursos.filter((c) => c.nivel === selectedSeccion.gradoNivel) : cursos,
    [cursos, selectedSeccion]
  );

  const alumnosSeccion = useMemo(
    () => filters.seccionId ? alumnos.filter((a) => a.seccionId === filters.seccionId) : alumnos,
    [alumnos, filters.seccionId]
  );

  useEffect(() => {
    fetchCatalogs();
  }, []);

  useEffect(() => {
    if (filters.anioEscolarId) {
      fetchMatriculas();
    }
  }, [filters.anioEscolarId, filters.seccionId, filters.cursoId, filters.alumnoId]);

  const fetchCatalogs = async () => {
    try {
      const [aniosRes, seccionesRes, cursosRes, alumnosRes] = await Promise.all([
        api.get<AnioEscolar[]>('/api/anios-escolares'),
        api.get<Seccion[]>('/api/secciones'),
        api.get<Curso[]>('/api/cursos'),
        api.get<Alumno[]>('/api/alumnos'),
      ]);

      setAnios(aniosRes.data);
      setSecciones(seccionesRes.data);
      setCursos(cursosRes.data);
      setAlumnos(alumnosRes.data);

      const activo = aniosRes.data.find((a) => a.activo);
      if (activo) {
        setFilters((prev) => ({ ...prev, anioEscolarId: activo.id }));
      }
    } catch (e) {
      setError('No se pudieron cargar catálogos de matrículas');
    }
  };

  const fetchMatriculas = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('anioEscolarId', filters.anioEscolarId);
      if (filters.seccionId) params.set('seccionId', filters.seccionId);
      if (filters.cursoId) params.set('cursoId', filters.cursoId);
      if (filters.alumnoId) params.set('alumnoId', filters.alumnoId);

      const res = await api.get<Matricula[]>(`/api/matriculas?${params.toString()}`);
      setMatriculas(res.data);
    } catch (e) {
      setError('No se pudieron cargar las matrículas');
    } finally {
      setLoading(false);
    }
  };

  const generarMasivo = async () => {
    if (!filters.anioEscolarId || !filters.seccionId) {
      setError('Seleccioná año escolar y sección para generar matrículas');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const res = await api.post<Matricula[]>('/api/matriculas/generar-seccion', {
        anioEscolarId: filters.anioEscolarId,
        seccionId: filters.seccionId,
      });
      setSuccess(`Se generaron ${res.data.length} matrículas automáticas`);
      await fetchMatriculas();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo generar matrícula masiva');
    } finally {
      setLoading(false);
    }
  };

  const crearManual = async () => {
    if (!filters.anioEscolarId || !filters.seccionId || !filters.cursoId || !filters.alumnoId) {
      setError('Completá año, sección, curso y alumno para matrícula manual');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await api.post('/api/matriculas', {
        anioEscolarId: filters.anioEscolarId,
        seccionId: filters.seccionId,
        cursoId: filters.cursoId,
        alumnoId: filters.alumnoId,
      });
      setSuccess('Matrícula creada correctamente');
      await fetchMatriculas();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'No se pudo crear la matrícula');
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async (id: string) => {
    try {
      await api.delete(`/api/matriculas/${id}`);
      await fetchMatriculas();
    } catch {
      setError('No se pudo eliminar la matrícula');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Matrículas de Cursos</h1>
        <p className="text-sm text-gray-600 mt-1">
          Vinculá alumnos a cursos para habilitar el registro de notas por profesor.
        </p>
      </div>

      {error && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}
      {success && <div className="p-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Gestión de Matrículas</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={filters.anioEscolarId} onChange={(e) => setFilters({ ...filters, anioEscolarId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Año escolar</option>
            {anios.map((a) => <option key={a.id} value={a.id}>{a.anio}{a.activo ? ' (Activo)' : ''}</option>)}
          </select>

          <select value={filters.seccionId} onChange={(e) => setFilters({ ...filters, seccionId: e.target.value, cursoId: '', alumnoId: '' })} className="border rounded px-3 py-2">
            <option value="">Sección</option>
            {secciones.map((s) => <option key={s.id} value={s.id}>{s.gradoNombre} {s.nombre} ({s.gradoNivel})</option>)}
          </select>

          <select value={filters.cursoId} onChange={(e) => setFilters({ ...filters, cursoId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Curso</option>
            {cursosCompatibles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>

          <select value={filters.alumnoId} onChange={(e) => setFilters({ ...filters, alumnoId: e.target.value })} className="border rounded px-3 py-2">
            <option value="">Alumno</option>
            {alumnosSeccion.map((a) => <option key={a.id} value={a.id}>{a.apellidos}, {a.nombres}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={generarMasivo} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
            Generar por sección (automático)
          </button>
          <button onClick={crearManual} disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50">
            Agregar matrícula manual
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-gray-700">Matrículas activas ({matriculas.length})</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left">Alumno</th>
                <th className="px-4 py-2 text-left">Curso</th>
                <th className="px-4 py-2 text-left">Sección</th>
                <th className="px-4 py-2 text-left">Año</th>
                <th className="px-4 py-2 text-left">Origen</th>
                <th className="px-4 py-2 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {matriculas.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-2">{m.alumnoApellidos}, {m.alumnoNombres} <span className="text-xs text-gray-500">({m.alumnoCodigo})</span></td>
                  <td className="px-4 py-2">{m.cursoNombre}</td>
                  <td className="px-4 py-2">{m.seccionNombre}</td>
                  <td className="px-4 py-2">{m.anioEscolar}</td>
                  <td className="px-4 py-2">{m.origen}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => eliminar(m.id)} className="text-red-600 hover:text-red-800">Quitar</button>
                  </td>
                </tr>
              ))}
              {matriculas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">Sin matrículas para los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
