'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { SearchInput, Pagination, Badge, Select } from '@/components';

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

interface AnioEscolar {
  id: string;
  anio: number;
  activo: boolean;
}

interface Grado {
  id: string;
  nombre: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const MESES = [
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const ESTADOS = [
  { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PAGADO', label: 'Pagado', color: 'bg-green-100 text-green-800' },
  { value: 'VENCIDO', label: 'Vencido', color: 'bg-red-100 text-red-800' },
  { value: 'PARCIAL', label: 'Parcial', color: 'bg-blue-100 text-blue-800' },
];

export default function PensionesPage() {
  const [pensiones, setPensiones] = useState<Pension[]>([]);
  const [aniosEscolares, setAniosEscolares] = useState<AnioEscolar[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [filterMes, setFilterMes] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterGrado, setFilterGrado] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedAnioEscolar, setSelectedAnioEscolar] = useState<string>('');
  const pageSize = 20;

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (selectedAnioEscolar) {
      fetchPensiones();
    }
  }, [currentPage, filterMes, filterEstado, filterGrado, selectedAnioEscolar]);

  const fetchFilters = async () => {
    try {
      const [aniosRes, gradosRes] = await Promise.all([
        api.get<AnioEscolar[]>('/api/anios-escolares'),
        api.get<Grado[]>('/api/grados'),
      ]);
      setAniosEscolares(aniosRes.data);
      setGrados(gradosRes.data);
      
      const activeYear = aniosRes.data.find(a => a.activo);
      if (activeYear) {
        setSelectedAnioEscolar(activeYear.id);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchPensiones = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = `/api/pensiones?page=${currentPage}&size=${pageSize}`;
      if (filterMes) endpoint += `&mes=${filterMes}`;
      if (filterEstado) endpoint += `&estado=${filterEstado}`;
      if (filterGrado) endpoint += `&gradoId=${filterGrado}`;

      const response = await api.get<PageResponse<Pension>>(endpoint);
      setPensiones(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error) {
      console.error('Error fetching pensiones:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterMes, filterEstado, filterGrado]);

  const handleGenerarPensiones = async (mes?: number) => {
    if (!selectedAnioEscolar) {
      setMessage({ type: 'error', text: 'Seleccione un año escolar' });
      return;
    }

    const confirmMsg = mes 
      ? `¿Generar pensiones para ${MESES.find(m => m.value === mes)?.label}?`
      : '¿Generar pensiones para TODO el año escolar? Esto creará pensiones de Marzo a Diciembre.';
    
    if (!window.confirm(confirmMsg)) return;

    setGenerating(true);
    setMessage(null);

    try {
      let endpoint = `/api/pensiones/generar?anioEscolarId=${selectedAnioEscolar}`;
      if (mes) endpoint += `&mes=${mes}`;

      const response = await api.post<{ cantidad: number }>(endpoint);
      setMessage({ type: 'success', text: `Se generaron ${response.data.cantidad} pensiones exitosamente` });
      fetchPensiones();
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al generar pensiones' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateEstado = async (pension: Pension, nuevoEstado: string) => {
    try {
      await api.put(`/api/pensiones/${pension.id}/estado?estado=${nuevoEstado}`);
      fetchPensiones();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al actualizar estado');
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

  const displayedPensiones = search
    ? pensiones.filter(p =>
        p.alumnoNombres.toLowerCase().includes(search.toLowerCase()) ||
        p.alumnoApellidos.toLowerCase().includes(search.toLowerCase()) ||
        p.alumnoCodigo?.toLowerCase().includes(search.toLowerCase())
      )
    : pensiones;

  // Stats
  const stats = {
    total: totalElements,
    pendientes: pensiones.filter(p => p.estado === 'PENDIENTE').length,
    pagados: pensiones.filter(p => p.estado === 'PAGADO').length,
    vencidos: pensiones.filter(p => p.estado === 'VENCIDO').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pensiones</h1>
          <p className="text-gray-600 mt-1">Administrar pensiones mensuales de todos los alumnos</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterMes}
            onChange={(e) => handleGenerarPensiones(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            disabled={generating}
          >
            <option value="">Generar mes específico...</option>
            {MESES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <button
            onClick={() => handleGenerarPensiones()}
            disabled={generating}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {generating ? 'Generando...' : 'Generar Año Completo'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Pensiones</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-800">{stats.pendientes}</div>
          <div className="text-sm text-yellow-600">Pendientes</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-800">{stats.pagados}</div>
          <div className="text-sm text-green-600">Pagados</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-800">{stats.vencidos}</div>
          <div className="text-sm text-red-600">Vencidos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por alumno..."
          />
          <Select
            label="Mes"
            value={filterMes}
            onChange={(e) => { setFilterMes(e.target.value); setCurrentPage(0); }}
            options={[
              { value: '', label: 'Todos los meses' },
              ...MESES.map(m => ({ value: m.value.toString(), label: m.label })),
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
          <Select
            label="Grado"
            value={filterGrado}
            onChange={(e) => { setFilterGrado(e.target.value); setCurrentPage(0); }}
            options={[
              { value: '', label: 'Todos los grados' },
              ...grados.map(g => ({ value: g.id, label: g.nombre })),
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
        ) : displayedPensiones.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay pensiones registradas. Use el botón &quot;Generar&quot; para crear pensiones.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumno</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Descuento</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedPensiones.map((pension, idx) => (
                    <tr key={pension.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {pension.alumnoApellidos}, {pension.alumnoNombres}
                        </div>
                        <div className="text-xs text-gray-500">{pension.alumnoCodigo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pension.alumnoGrado} {pension.alumnoSeccion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="info">{pension.nombreMes}</Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        S/. {pension.monto.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-green-600">
                        {pension.descuento > 0 ? `-S/. ${pension.descuento.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">S/. {pension.montoFinal.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getEstadoBadge(pension.estado)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pension.fechaVencimiento).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={pension.estado}
                          onChange={(e) => handleUpdateEstado(pension, e.target.value)}
                          className="text-sm border-gray-300 rounded"
                          disabled={pension.estado === 'PAGADO'}
                        >
                          {ESTADOS.map(e => (
                            <option key={e.value} value={e.value}>{e.label}</option>
                          ))}
                        </select>
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
