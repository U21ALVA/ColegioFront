'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Pagination, Badge, Select } from '@/components';

interface Pago {
  id: string;
  pensionId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  mes: number;
  stripePaymentIntentId: string;
  stripeCheckoutSessionId: string;
  monto: number;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO' | 'REEMBOLSADO';
  metodoPago: string;
  fechaPago: string;
  createdAt: string;
}

interface AnioEscolar {
  id: string;
  anio: number;
  activo: boolean;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface Stats {
  totalRecaudado: number;
  cantidadPagos: number;
}

const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'COMPLETADO', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'FALLIDO', label: 'Fallido', color: 'bg-red-100 text-red-800' },
  { value: 'REEMBOLSADO', label: 'Reembolsado', color: 'bg-purple-100 text-purple-800' },
];

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [aniosEscolares, setAniosEscolares] = useState<AnioEscolar[]>([]);
  const [stats, setStats] = useState<Stats>({ totalRecaudado: 0, cantidadPagos: 0 });
  const [loading, setLoading] = useState(true);

  const [filterEstado, setFilterEstado] = useState('');
  const [selectedAnioEscolar, setSelectedAnioEscolar] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchAnios();
  }, []);

  useEffect(() => {
    fetchPagos();
    if (selectedAnioEscolar) {
      fetchStats();
    }
  }, [currentPage, filterEstado, selectedAnioEscolar]);

  const fetchAnios = async () => {
    try {
      const response = await api.get<AnioEscolar[]>('/api/anios-escolares');
      setAniosEscolares(response.data);
      const activeYear = response.data.find(a => a.activo);
      if (activeYear) {
        setSelectedAnioEscolar(activeYear.id);
      }
    } catch (error) {
      console.error('Error fetching años escolares:', error);
    }
  };

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/api/pagos?page=${currentPage}&size=${pageSize}`;
      if (filterEstado) endpoint += `&estado=${filterEstado}`;

      const response = await api.get<PageResponse<Pago>>(endpoint);
      setPagos(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching pagos:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterEstado]);

  const fetchStats = async () => {
    try {
      const response = await api.get<Stats>(`/api/pagos/stats?anioEscolarId=${selectedAnioEscolar}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const config = ESTADOS.find(e => e.value === estado);
    return config ? (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    ) : estado;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporte de Pagos</h1>
        <p className="text-gray-600 mt-1">Historial de todos los pagos recibidos vía Stripe</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-800">
            S/. {stats.totalRecaudado.toFixed(2)}
          </div>
          <div className="text-sm text-green-600">Total Recaudado</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-800">{stats.cantidadPagos}</div>
          <div className="text-sm text-blue-600">Pagos Completados</div>
        </div>
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-gray-800">{totalElements}</div>
          <div className="text-sm text-gray-600">Total Transacciones</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Año Escolar"
            value={selectedAnioEscolar}
            onChange={(e) => setSelectedAnioEscolar(e.target.value)}
            options={[
              { value: '', label: 'Todos' },
              ...aniosEscolares.map(a => ({ value: a.id, label: a.anio.toString() })),
            ]}
          />
          <Select
            label="Estado"
            value={filterEstado}
            onChange={(e) => { setFilterEstado(e.target.value); setCurrentPage(0); }}
            options={[
              { value: '', label: 'Todos los estados' },
              ...ESTADOS.map(e => ({ value: e.value, label: e.label })),
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : pagos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay pagos registrados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Stripe</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagos.map((pago, idx) => (
                    <tr key={pago.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pago.fechaPago 
                          ? new Date(pago.fechaPago).toLocaleString('es-PE')
                          : new Date(pago.createdAt).toLocaleString('es-PE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pago.alumnoApellidos}, {pago.alumnoNombres}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{MESES[pago.mes]}</Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">S/. {pago.monto.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getEstadoBadge(pago.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pago.metodoPago || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {pago.stripePaymentIntentId ? (
                          <span className="text-xs">{pago.stripePaymentIntentId.substring(0, 20)}...</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
