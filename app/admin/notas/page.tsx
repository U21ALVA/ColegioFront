'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { SearchInput, Pagination, Badge, Select } from '@/components';

interface Nota {
  id: string;
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  cursoId: string;
  cursoNombre: string;
  bimestreId: string;
  bimestreNumero: number;
  n1: number | null;
  n2: number | null;
  n3: number | null;
  n4: number | null;
  notaFinal: number | null;
  literal: string | null;
  docenteNombres: string;
  docenteApellidos: string;
}

interface Curso {
  id: string;
  nombre: string;
  nivel: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
}

interface Bimestre {
  id: string;
  numero: number;
  cerrado: boolean;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function AdminNotasPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);

  const [loadingCursos, setLoadingCursos] = useState(true);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [selectedCursoId, setSelectedCursoId] = useState('');

  const [search, setSearch] = useState('');
  const [filterBimestre, setFilterBimestre] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setLoadingCursos(true);
      const [cursosRes, bimestresRes] = await Promise.all([
        api.get<Curso[]>('/api/cursos'),
        api.get<Bimestre[]>('/api/bimestres/activos'),
      ]);
      setCursos(cursosRes.data);
      setBimestres(bimestresRes.data);
    } catch (error) {
      console.error('Error fetching catalogs:', error);
    } finally {
      setLoadingCursos(false);
    }
  };

  const fetchNotas = useCallback(async () => {
    if (!selectedCursoId) {
      return;
    }

    setLoadingNotas(true);
    try {
      let endpoint = `/api/notas?page=${currentPage}&size=${pageSize}&cursoId=${selectedCursoId}`;
      if (filterBimestre) {
        endpoint += `&bimestreId=${filterBimestre}`;
      }

      const response = await api.get<PageResponse<Nota>>(endpoint);
      setNotas(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching notas:', error);
    } finally {
      setLoadingNotas(false);
    }
  }, [selectedCursoId, currentPage, filterBimestre]);

  useEffect(() => {
    if (!selectedCursoId) {
      return;
    }
    fetchNotas();
  }, [selectedCursoId, fetchNotas]);

  const handleSelectCurso = (cursoId: string) => {
    setSelectedCursoId(cursoId);
    setCurrentPage(0);
    setSearch('');
    setFilterBimestre('');
  };

  const handleBackToCursos = () => {
    setSelectedCursoId('');
    setNotas([]);
    setSearch('');
    setFilterBimestre('');
    setCurrentPage(0);
    setTotalPages(0);
    setTotalElements(0);
  };

  const handleDelete = async (nota: Nota) => {
    if (window.confirm(`¿Está seguro de eliminar la nota de ${nota.alumnoNombres} ${nota.alumnoApellidos} en ${nota.cursoNombre}?`)) {
      try {
        await api.delete(`/api/notas/${nota.id}`);
        fetchNotas();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const getLiteralColor = (literal: string | null): string => {
    switch (literal) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedCurso = useMemo(
    () => cursos.find((curso) => curso.id === selectedCursoId) || null,
    [cursos, selectedCursoId]
  );

  const displayedNotas = useMemo(() => {
    if (!search) {
      return notas;
    }
    const term = search.toLowerCase();
    return notas.filter((n) =>
      n.alumnoNombres.toLowerCase().includes(term) ||
      n.alumnoApellidos.toLowerCase().includes(term) ||
      n.alumnoCodigo.toLowerCase().includes(term)
    );
  }, [notas, search]);

  const cursosPorNivel = useMemo(() => {
    const levels: Array<'INICIAL' | 'PRIMARIA' | 'SECUNDARIA'> = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
    return levels
      .map((nivel) => ({ nivel, cursos: cursos.filter((curso) => curso.nivel === nivel) }))
      .filter((grupo) => grupo.cursos.length > 0);
  }, [cursos]);

  const notasPorNivel = useMemo(() => {
    if (!selectedCurso) {
      return [] as Array<{ nivel: string; notas: Nota[] }>;
    }
    return [{ nivel: selectedCurso.nivel, notas: displayedNotas }];
  }, [selectedCurso, displayedNotas]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Notas</h1>
          <p className="text-gray-600 mt-1">
            {selectedCurso ? 'Detalle de notas del curso seleccionado' : 'Seleccione un curso para ver sus alumnos y notas'}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedCurso && (
            <button
              onClick={handleBackToCursos}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              Volver a cursos
            </button>
          )}
          <Link
            href="/admin/notas/historial"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
          >
            Ver Historial de Cambios
          </Link>
        </div>
      </div>

      {!selectedCursoId ? (
        <div className="space-y-4">
          {loadingCursos ? (
            <div className="bg-white rounded-lg shadow flex items-center justify-center h-56">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : cursos.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No hay cursos disponibles</div>
          ) : (
            cursosPorNivel.map((grupo) => (
              <div key={grupo.nivel} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">Nivel {grupo.nivel}</h3>
                  <span className="text-xs text-gray-500">{grupo.cursos.length} cursos</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {grupo.cursos.map((curso) => (
                    <button
                      key={curso.id}
                      onClick={() => handleSelectCurso(curso.id)}
                      className="text-left border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition-colors"
                    >
                      <div className="font-semibold text-gray-900">{curso.nombre}</div>
                      <div className="text-xs text-gray-500 mt-1">Nivel {curso.nivel}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar por alumno o código..."
              />
              <Select
                label="Bimestre"
                value={filterBimestre}
                onChange={(e) => {
                  setFilterBimestre(e.target.value);
                  setCurrentPage(0);
                }}
                options={[
                  { value: '', label: 'Todos los bimestres' },
                  ...bimestres.map((b) => ({
                    value: b.id,
                    label: `Bimestre ${b.numero}${b.cerrado ? ' (Cerrado)' : ''}`,
                  })),
                ]}
              />
              <div className="flex items-end text-sm text-gray-600">
                <div className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50">
                  Curso: <span className="font-semibold text-gray-800">{selectedCurso?.nombre}</span>
                </div>
              </div>
            </div>
          </div>

          {loadingNotas ? (
            <div className="bg-white rounded-lg shadow flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : displayedNotas.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No se encontraron notas para este curso con los filtros aplicados
            </div>
          ) : (
            <div className="space-y-4">
              {notasPorNivel.map((grupo) => (
                <div key={grupo.nivel} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Nivel {grupo.nivel}</h3>
                    <span className="text-xs text-gray-500">{grupo.notas.length} hijos/alumnos</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bimestre</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">N1</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">N2</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">N3</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">N4</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Promedio</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Literal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {grupo.notas.map((nota, index) => (
                          <tr key={nota.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {nota.alumnoApellidos}, {nota.alumnoNombres}
                                </div>
                                <div className="text-xs text-gray-500">{nota.alumnoCodigo}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="info">Bim {nota.bimestreNumero}</Badge>
                            </td>
                            <td className="px-4 py-4 text-center text-sm text-gray-900">{nota.n1 !== null ? nota.n1.toFixed(1) : '-'}</td>
                            <td className="px-4 py-4 text-center text-sm text-gray-900">{nota.n2 !== null ? nota.n2.toFixed(1) : '-'}</td>
                            <td className="px-4 py-4 text-center text-sm text-gray-900">{nota.n3 !== null ? nota.n3.toFixed(1) : '-'}</td>
                            <td className="px-4 py-4 text-center text-sm text-gray-900">{nota.n4 !== null ? nota.n4.toFixed(1) : '-'}</td>
                            <td className="px-4 py-4 text-center">
                              <span className="text-sm font-bold text-gray-900">
                                {nota.notaFinal !== null ? nota.notaFinal.toFixed(2) : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              {nota.literal && (
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${getLiteralColor(nota.literal)}`}>
                                  {nota.literal}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {nota.docenteNombres ? `${nota.docenteApellidos}, ${nota.docenteNombres}` : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <Link
                                  href={`/admin/notas/historial?notaId=${nota.id}`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Historial
                                </Link>
                                <button
                                  onClick={() => handleDelete(nota)}
                                  className="text-red-600 hover:text-red-900"
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
                </div>
              ))}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalElements}
                  pageSize={pageSize}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
