'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';

interface AnioEscolar {
  id: string;
  anio: number;
  activo: boolean;
}

interface Curso {
  id: string;
  nombre: string;
  nivel: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
}

interface Matricula {
  id: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  cursoId: string;
  cursoNombre: string;
  seccionId: string;
  seccionNombre: string;
  anioEscolarId: string;
  anioEscolar: number;
}

interface SeccionGrupo {
  seccionId: string;
  seccionNombre: string;
  matriculas: Matricula[];
}

export default function MatriculadosPorCursoPage() {
  const searchParams = useSearchParams();
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    anioEscolarId: '',
    cursoId: '',
  });

  useEffect(() => {
    fetchCatalogos();
  }, []);

  useEffect(() => {
    const cursoId = searchParams.get('cursoId') || '';
    const anioEscolarId = searchParams.get('anioEscolarId') || '';

    if (!cursoId && !anioEscolarId) {
      return;
    }

    setFilters((prev) => ({
      anioEscolarId: anioEscolarId || prev.anioEscolarId,
      cursoId: cursoId || prev.cursoId,
    }));
  }, [searchParams]);

  useEffect(() => {
    if (filters.anioEscolarId && filters.cursoId) {
      const fetchMatriculasPorCurso = async () => {
        try {
          setLoading(true);
          setError(null);

          const params = new URLSearchParams();
          params.set('anioEscolarId', filters.anioEscolarId);
          params.set('cursoId', filters.cursoId);

          const res = await api.get<Matricula[]>(`/api/matriculas?${params.toString()}`);
          setMatriculas(res.data);
        } catch {
          setError('No se pudieron cargar los matriculados del curso');
        } finally {
          setLoading(false);
        }
      };

      fetchMatriculasPorCurso();
      return;
    }
    setMatriculas([]);
  }, [filters.anioEscolarId, filters.cursoId]);

  const gruposPorSeccion = useMemo<SeccionGrupo[]>(() => {
    const seccionesMap = new Map<string, SeccionGrupo>();

    matriculas.forEach((m) => {
      const existente = seccionesMap.get(m.seccionId);
      if (existente) {
        existente.matriculas.push(m);
        return;
      }

      seccionesMap.set(m.seccionId, {
        seccionId: m.seccionId,
        seccionNombre: m.seccionNombre,
        matriculas: [m],
      });
    });

    return Array.from(seccionesMap.values()).sort((a, b) =>
      a.seccionNombre.localeCompare(b.seccionNombre)
    );
  }, [matriculas]);

  const fetchCatalogos = async () => {
    try {
      setError(null);
      const [aniosRes, cursosRes] = await Promise.all([
        api.get<AnioEscolar[]>('/api/anios-escolares'),
        api.get<Curso[]>('/api/cursos'),
      ]);

      setAnios(aniosRes.data);
      setCursos(cursosRes.data);

      const anioActivo = aniosRes.data.find((a) => a.activo);
      if (anioActivo) {
        setFilters((prev) => ({ ...prev, anioEscolarId: anioActivo.id }));
      }
    } catch {
      setError('No se pudieron cargar catálogos de matrículas');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Matriculados por Curso</h1>
        <p className="text-sm text-gray-600 mt-1">
          Seleccioná un curso para ver alumnos matriculados agrupados por sección.
        </p>
        <Link
          href="/admin/matriculas"
          className="inline-flex mt-3 text-sm font-medium text-primary-700 hover:text-primary-800"
        >
          Volver a gestión de matrículas
        </Link>
      </div>

      {error && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={filters.anioEscolarId}
            onChange={(e) => setFilters({ ...filters, anioEscolarId: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Año escolar</option>
            {anios.map((a) => (
              <option key={a.id} value={a.id}>
                {a.anio}
                {a.activo ? ' (Activo)' : ''}
              </option>
            ))}
          </select>

          <select
            value={filters.cursoId}
            onChange={(e) => setFilters({ ...filters, cursoId: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">Curso</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.nivel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {filters.cursoId && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {loading
              ? 'Cargando matriculados...'
              : `${matriculas.length} matriculados en ${gruposPorSeccion.length} secciones`}
          </div>

          {!loading && gruposPorSeccion.length === 0 && (
            <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
              No hay alumnos matriculados para el curso y año seleccionados.
            </div>
          )}

          {!loading &&
            gruposPorSeccion.map((grupo) => (
              <div key={grupo.seccionId} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Sección {grupo.seccionNombre}</h2>
                  <span className="text-xs text-gray-500">{grupo.matriculas.length} alumnos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Alumno</th>
                        <th className="px-4 py-2 text-left">Código</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.matriculas.map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="px-4 py-2">
                            {m.alumnoApellidos}, {m.alumnoNombres}
                          </td>
                          <td className="px-4 py-2">{m.alumnoCodigo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
