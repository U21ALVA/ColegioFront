'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { SearchInput, Pagination, Badge, getStatusBadge } from '@/components';

interface Docente {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  especialidad: string;
  estado: string;
  username?: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export default function DocentesPage() {
  const router = useRouter();
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchDocentes();
  }, [currentPage, search]);

  const fetchDocentes = async () => {
    setLoading(true);
    try {
      const endpoint = search
        ? `/api/docentes/search?q=${encodeURIComponent(search)}&page=${currentPage}&size=${pageSize}`
        : `/api/docentes/paginated?page=${currentPage}&size=${pageSize}`;
      
      const response = await api.get<PageResponse<Docente>>(endpoint);
      setDocentes(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching docentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const handleDelete = async (docente: Docente) => {
    if (window.confirm(`¿Está seguro de eliminar al docente ${docente.nombres} ${docente.apellidos}?`)) {
      try {
        await api.delete(`/api/docentes/${docente.id}`);
        fetchDocentes();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Docentes</h1>
        <Link
          href="/admin/docentes/nuevo"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
        >
          Nuevo Docente
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="max-w-md">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, DNI o email..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : docentes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {search ? 'No se encontraron docentes' : 'No hay docentes registrados'}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Docente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {docentes.map((docente) => (
                  <tr
                    key={docente.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/docentes/${docente.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {docente.apellidos}, {docente.nombres}
                        </div>
                        {docente.username && (
                          <div className="text-sm text-gray-500">@{docente.username}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {docente.dni}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{docente.email || '-'}</div>
                      <div className="text-sm text-gray-500">{docente.telefono || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {docente.especialidad || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(docente.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/docentes/${docente.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(docente)}
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
