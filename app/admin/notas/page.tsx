'use client';

import { useState, useEffect, useCallback } from 'react';
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
  docenteId: string;
  docenteNombres: string;
  docenteApellidos: string;
}

interface Curso {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
}

interface Bimestre {
  id: string;
  numero: number;
  cerrado: boolean;
}

interface Seccion {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
  gradoNivel: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function AdminNotasPage() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCurso, setFilterCurso] = useState('');
  const [filterBimestre, setFilterBimestre] = useState('');
  const [filterNivel, setFilterNivel] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchNotas();
  }, [currentPage, filterCurso, filterBimestre]);

  const fetchFilters = async () => {
    try {
      const [cursosRes, bimestresRes, seccionesRes] = await Promise.all([
        api.get<Curso[]>('/api/cursos'),
        api.get<Bimestre[]>('/api/bimestres/activos'),
        api.get<Seccion[]>('/api/secciones'),
      ]);
      setCursos(cursosRes.data);
      setBimestres(bimestresRes.data);
      setSecciones(seccionesRes.data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchNotas = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/api/notas?page=${currentPage}&size=${pageSize}`;
      
      if (filterCurso) {
        endpoint += `&cursoId=${filterCurso}`;
      }
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
      setLoading(false);
    }
  }, [currentPage, filterCurso, filterBimestre]);

  const handleCursoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCurso(e.target.value);
    setCurrentPage(0);
  };

  const handleBimestreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterBimestre(e.target.value);
    setCurrentPage(0);
  };

  const handleNivelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterNivel(e.target.value);
    setFilterCurso('');
    setCurrentPage(0);
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

  const filteredCursos = filterNivel
    ? cursos.filter(c => {
        const seccion = secciones.find(s => s.gradoId === c.gradoId);
        return seccion?.gradoNivel === filterNivel;
      })
    : cursos;

  // Filter notas by search
  const displayedNotas = search
    ? notas.filter(n =>
        n.alumnoNombres.toLowerCase().includes(search.toLowerCase()) ||
        n.alumnoApellidos.toLowerCase().includes(search.toLowerCase()) ||
        n.alumnoCodigo.toLowerCase().includes(search.toLowerCase()) ||
        n.cursoNombre.toLowerCase().includes(search.toLowerCase())
      )
    : notas;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Notas</h1>
          <p className="text-gray-600 mt-1">Visualización y gestión de todas las notas del sistema</p>
        </div>
        <Link
          href="/admin/notas/historial"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
        >
          Ver Historial de Cambios
        </Link>
      </div>

      {/* Grade Scale Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Escala de Notas:</span>
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">A (18-20) Excelente</span>
          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">B (14-17) Bueno</span>
          <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">C (11-13) Regular</span>
          <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">D (0-10) Deficiente</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar por alumno o curso..."
            />
          </div>
          <Select
            label="Nivel"
            value={filterNivel}
            onChange={handleNivelChange}
            options={[
              { value: '', label: 'Todos los niveles' },
              { value: 'INICIAL', label: 'Inicial' },
              { value: 'PRIMARIA', label: 'Primaria' },
              { value: 'SECUNDARIA', label: 'Secundaria' },
            ]}
          />
          <Select
            label="Curso"
            value={filterCurso}
            onChange={handleCursoChange}
            options={[
              { value: '', label: 'Todos los cursos' },
              ...filteredCursos.map(c => ({ 
                value: c.id, 
                label: `${c.nombre} (${c.gradoNombre})` 
              })),
            ]}
          />
          <Select
            label="Bimestre"
            value={filterBimestre}
            onChange={handleBimestreChange}
            options={[
              { value: '', label: 'Todos los bimestres' },
              ...bimestres.map(b => ({ 
                value: b.id, 
                label: `Bimestre ${b.numero}${b.cerrado ? ' (Cerrado)' : ''}` 
              })),
            ]}
          />
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && displayedNotas.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Notas"
            value={totalElements}
            color="bg-gray-100 text-gray-800"
          />
          <StatCard
            label="Promedio A"
            value={displayedNotas.filter(n => n.literal === 'A').length}
            color="bg-green-100 text-green-800"
          />
          <StatCard
            label="Promedio B"
            value={displayedNotas.filter(n => n.literal === 'B').length}
            color="bg-blue-100 text-blue-800"
          />
          <StatCard
            label="En Riesgo (D)"
            value={displayedNotas.filter(n => n.literal === 'D').length}
            color="bg-red-100 text-red-800"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : displayedNotas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search || filterCurso || filterBimestre ? 'No se encontraron notas con los filtros aplicados' : 'No hay notas registradas'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alumno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Curso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bimestre
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N1
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N2
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N3
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N4
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Promedio
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Literal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Docente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedNotas.map((nota, index) => (
                    <tr key={nota.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {nota.alumnoApellidos}, {nota.alumnoNombres}
                          </div>
                          <div className="text-xs text-gray-500">{nota.alumnoCodigo}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {nota.cursoNombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">Bim {nota.bimestreNumero}</Badge>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {nota.n1 !== null ? nota.n1.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {nota.n2 !== null ? nota.n2.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {nota.n3 !== null ? nota.n3.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-900">
                        {nota.n4 !== null ? nota.n4.toFixed(1) : '-'}
                      </td>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalElements}
                pageSize={pageSize}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}
