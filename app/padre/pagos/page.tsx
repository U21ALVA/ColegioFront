'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Badge } from '@/components';

interface Pension {
  id: string;
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  alumnoGrado: string;
  alumnoSeccion: string;
  anioEscolar: number;
  mes: number;
  nombreMes: string;
  monto: number;
  descuento: number;
  montoFinal: number;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL';
  fechaVencimiento: string;
}

interface Hijo {
  id: string;
  nombres: string;
  apellidos: string;
  codigoEstudiante: string;
  grado: string;
  seccion: string;
}

const ESTADOS = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  PAGADO: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  VENCIDO: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
  PARCIAL: { label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
};

export default function PadrePaymentsPage() {
  const [pensiones, setPensiones] = useState<Pension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPensiones();
  }, []);

  const fetchPensiones = async () => {
    try {
      const response = await api.get<Pension[]>('/api/pensiones');
      setPensiones(response.data);
    } catch (err: any) {
      console.error('Error fetching pensiones:', err);
      setError('Error al cargar las pensiones');
    } finally {
      setLoading(false);
    }
  };

  // Group by alumno
  const pensionsByAlumno = pensiones.reduce((acc, pension) => {
    const key = pension.alumnoId;
    if (!acc[key]) {
      acc[key] = {
        alumno: {
          id: pension.alumnoId,
          nombres: pension.alumnoNombres,
          apellidos: pension.alumnoApellidos,
          codigo: pension.alumnoCodigo,
          grado: pension.alumnoGrado,
          seccion: pension.alumnoSeccion,
        },
        pensiones: [],
      };
    }
    acc[key].pensiones.push(pension);
    return acc;
  }, {} as Record<string, { alumno: any; pensiones: Pension[] }>);

  const totalPendiente = pensiones
    .filter(p => p.estado !== 'PAGADO')
    .reduce((sum, p) => sum + p.montoFinal, 0);

  const totalPagado = pensiones
    .filter(p => p.estado === 'PAGADO')
    .reduce((sum, p) => sum + p.montoFinal, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estado de Cuenta</h1>
        <p className="text-gray-600 mt-1">Consulta y paga las pensiones de tus hijos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <div className="text-3xl font-bold text-red-800">
            S/. {totalPendiente.toFixed(2)}
          </div>
          <div className="text-sm text-red-600">Total Pendiente</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <div className="text-3xl font-bold text-green-800">
            S/. {totalPagado.toFixed(2)}
          </div>
          <div className="text-sm text-green-600">Total Pagado</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
          <div className="text-3xl font-bold text-blue-800">
            {pensiones.filter(p => p.estado !== 'PAGADO').length}
          </div>
          <div className="text-sm text-blue-600">Pensiones Pendientes</div>
        </div>
      </div>

      {/* Pensiones by Alumno */}
      {Object.keys(pensionsByAlumno).length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No hay pensiones registradas
        </div>
      ) : (
        Object.values(pensionsByAlumno).map(({ alumno, pensiones: alumPensiones }) => (
          <div key={alumno.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Alumno Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {alumno.apellidos}, {alumno.nombres}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {alumno.codigo} • {alumno.grado} {alumno.seccion}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Pendiente:</div>
                  <div className="text-xl font-bold text-red-600">
                    S/. {alumPensiones.filter(p => p.estado !== 'PAGADO').reduce((s, p) => s + p.montoFinal, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Pensiones Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Descuento</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alumPensiones
                    .sort((a, b) => a.mes - b.mes)
                    .map((pension) => (
                      <tr key={pension.id} className={pension.estado === 'PAGADO' ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900">{pension.nombreMes}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                          S/. {pension.monto.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-green-600">
                          {pension.descuento > 0 ? `-S/. ${pension.descuento.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <span className="font-bold text-gray-900">S/. {pension.montoFinal.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(pension.fechaVencimiento).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${ESTADOS[pension.estado].color}`}>
                            {ESTADOS[pension.estado].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {pension.estado !== 'PAGADO' ? (
                            <Link
                              href={`/padre/pagos/${pension.id}`}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Pagar
                            </Link>
                          ) : (
                            <span className="text-green-600 text-sm">✓ Pagado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
