'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Pagination, Badge, Select } from '@/components';

interface NotaHistorial {
  id: string;
  notaId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  cursoNombre: string;
  bimestreNumero: number;
  campo: string;
  valorAnterior: string | null;
  valorNuevo: string;
  usuarioId: string;
  usuarioUsername: string;
  docenteNombres: string | null;
  docenteApellidos: string | null;
  createdAt: string;
}

interface Curso {
  id: string;
  nombre: string;
  gradoNombre: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function NotaHistorialPage() {
  const searchParams = useSearchParams();
  const notaIdParam = searchParams.get('notaId');

  const [historial, setHistorial] = useState<NotaHistorial[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCurso, setFilterCurso] = useState('');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchCursos();
  }, []);

  useEffect(() => {
    fetchHistorial();
  }, [currentPage, filterCurso, filterDesde, filterHasta, notaIdParam]);

  const fetchCursos = async () => {
    try {
      const response = await api.get<Curso[]>('/api/cursos');
      setCursos(response.data);
    } catch (error) {
      console.error('Error fetching cursos:', error);
    }
  };

  const fetchHistorial = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/api/notas/historial?page=${currentPage}&size=${pageSize}`;
      
      if (notaIdParam) {
        endpoint += `&notaId=${notaIdParam}`;
      }
      if (filterCurso) {
        endpoint += `&cursoId=${filterCurso}`;
      }
      if (filterDesde) {
        endpoint += `&desde=${filterDesde}`;
      }
      if (filterHasta) {
        endpoint += `&hasta=${filterHasta}`;
      }
      
      const response = await api.get<PageResponse<NotaHistorial>>(endpoint);
      setHistorial(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching historial:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterCurso, filterDesde, filterHasta, notaIdParam]);

  const handleCursoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCurso(e.target.value);
    setCurrentPage(0);
  };

  const handleDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDesde(e.target.value);
    setCurrentPage(0);
  };

  const handleHastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterHasta(e.target.value);
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilterCurso('');
    setFilterDesde('');
    setFilterHasta('');
    setCurrentPage(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCampoLabel = (campo: string) => {
    const labels: Record<string, string> = {
      n1: 'Nota 1',
      n2: 'Nota 2',
      n3: 'Nota 3',
      n4: 'Nota 4',
      notaFinal: 'Nota Final',
      literal: 'Literal',
    };
    return labels[campo] || campo;
  };

  const getChangeColor = (campo: string) => {
    switch (campo) {
      case 'n1': return 'bg-purple-100 text-purple-800';
      case 'n2': return 'bg-indigo-100 text-indigo-800';
      case 'n3': return 'bg-cyan-100 text-cyan-800';
      case 'n4': return 'bg-teal-100 text-teal-800';
      case 'notaFinal': return 'bg-orange-100 text-orange-800';
      case 'literal': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Cambios de Notas</h1>
          <p className="text-gray-600 mt-1">Registro de auditoría de todas las modificaciones de notas</p>
        </div>
        <Link
          href="/admin/notas"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
        >
          Volver a Notas
        </Link>
      </div>

      {/* Info Banner */}
      {notaIdParam && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-blue-800">
              Mostrando historial de una nota específica.
            </p>
            <Link
              href="/admin/notas/historial"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todo el historial
            </Link>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Curso"
            value={filterCurso}
            onChange={handleCursoChange}
            options={[
              { value: '', label: 'Todos los cursos' },
              ...cursos.map(c => ({ 
                value: c.id, 
                label: `${c.nombre} (${c.gradoNombre})` 
              })),
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filterDesde}
              onChange={handleDesdeChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filterHasta}
              onChange={handleHastaChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total de cambios registrados: <span className="font-bold text-gray-900">{totalElements}</span>
            </span>
            {(filterDesde || filterHasta) && (
              <span className="text-sm text-gray-600">
                Rango: {filterDesde || 'inicio'} - {filterHasta || 'hoy'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : historial.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay registros de cambios con los filtros aplicados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alumno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Curso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bimestre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cambio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historial.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.alumnoApellidos}, {item.alumnoNombres}
                          </div>
                          <div className="text-xs text-gray-500">{item.alumnoCodigo}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.cursoNombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">Bim {item.bimestreNumero}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getChangeColor(item.campo)}`}>
                          {getCampoLabel(item.campo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400 line-through">
                            {item.valorAnterior || '-'}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="font-medium text-gray-900">
                            {item.valorNuevo}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            @{item.usuarioUsername}
                          </div>
                          {item.docenteNombres && (
                            <div className="text-xs text-gray-500">
                              {item.docenteApellidos}, {item.docenteNombres}
                            </div>
                          )}
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
