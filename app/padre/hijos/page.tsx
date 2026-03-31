'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface ResumenAcademico {
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  gradoNombre: string;
  seccionNombre: string;
  anioEscolar: number;
  promedioGeneral: number | null;
  literalGeneral: string | null;
  totalCursos: number;
  cursosAprobados: number;
  cursosDesaprobados: number;
}

export default function HijosPage() {
  const [hijos, setHijos] = useState<ResumenAcademico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHijos();
  }, []);

  const fetchHijos = async () => {
    try {
      setLoading(true);
      const response = await api.get<ResumenAcademico[]>('/api/boletas/mis-hijos');
      setHijos(response.data);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('No se pudieron cargar los datos de sus hijos');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Hijos</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {hijos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No tiene hijos vinculados a su cuenta.</p>
          <p className="text-sm text-gray-400 mt-2">
            Contacte con la administración del colegio para vincular a sus hijos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grado y Sección
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cursos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hijos.map((hijo) => (
                <tr key={hijo.alumnoId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {hijo.alumnoApellidos}, {hijo.alumnoNombres}
                      </div>
                      <div className="text-xs text-gray-500">{hijo.alumnoCodigo}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {hijo.gradoNombre} - {hijo.seccionNombre}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {hijo.promedioGeneral !== null ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-sm font-medium">{hijo.promedioGeneral.toFixed(2)}</span>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${getLiteralColor(hijo.literalGeneral)}`}>
                          {hijo.literalGeneral}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm">
                      <span className="text-green-600">{hijo.cursosAprobados}</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-gray-600">{hijo.totalCursos}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/padre/hijos/${hijo.alumnoId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver Boleta
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
