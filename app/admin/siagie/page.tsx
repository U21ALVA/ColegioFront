'use client';

import { useState, useEffect, useCallback } from 'react';
import { FormField, Select, Pagination } from '@/components';
import {
  siagieApi,
  ConfiguracionSiagieDto,
  SiagieFiltrosResponse,
  CursoDto,
  ExportacionSiagieDto,
  PageResponse,
  BimestreDto,
} from '@/lib/api';

type TabType = 'config' | 'export';

export default function SiagiePage() {
  const [activeTab, setActiveTab] = useState<TabType>('config');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exportar SIAGIE</h1>
        <p className="text-gray-600 mt-1">Configure y exporte datos al formato SIAGIE</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuracion
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Exportar
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' ? <ConfiguracionTab /> : <ExportarTab />}
    </div>
  );
}

function ConfiguracionTab() {
  const [config, setConfig] = useState<ConfiguracionSiagieDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    institucionEducativa: '',
    codigoModularAnexo: '',
    nivel: '',
    nombreReporte: '',
    anioAcademico: new Date().getFullYear().toString(),
    disenoModular: '',
    periodo: '',
    grado: '',
    seccion: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await siagieApi.getConfiguracion();
      setConfig(data);
      setForm({
        institucionEducativa: data.institucionEducativa || '',
        codigoModularAnexo: data.codigoModularAnexo || '',
        nivel: data.nivel || '',
        nombreReporte: data.nombreReporte || '',
        anioAcademico: data.anioAcademico?.toString() || new Date().getFullYear().toString(),
        disenoModular: data.disenoModular || '',
        periodo: data.periodo || '',
        grado: data.grado || '',
        seccion: data.seccion || '',
      });
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('Error fetching config:', error);
        setMessage({ type: 'error', text: 'Error al cargar la configuracion' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload: ConfiguracionSiagieDto = {
        id: config?.id,
        institucionEducativa: form.institucionEducativa,
        codigoModularAnexo: form.codigoModularAnexo,
        nivel: form.nivel,
        nombreReporte: form.nombreReporte,
        anioAcademico: parseInt(form.anioAcademico),
        disenoModular: form.disenoModular || undefined,
        periodo: form.periodo || undefined,
        grado: form.grado || undefined,
        seccion: form.seccion || undefined,
      };

      const result = await siagieApi.upsertConfiguracion(payload);
      setConfig(result);
      setMessage({ type: 'success', text: 'Configuracion guardada exitosamente' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al guardar la configuracion',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Datos de la Institucion Educativa</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Institucion Educativa"
              value={form.institucionEducativa}
              onChange={(e) => setForm({ ...form, institucionEducativa: e.target.value })}
              placeholder="Ej: COLEGIO RICARDO PALMA"
              required
            />

            <FormField
              label="Codigo Modular Anexo"
              value={form.codigoModularAnexo}
              onChange={(e) => setForm({ ...form, codigoModularAnexo: e.target.value })}
              placeholder="Ej: 0123456"
              required
            />

            <Select
              label="Nivel"
              value={form.nivel}
              onChange={(e) => setForm({ ...form, nivel: e.target.value })}
              options={[
                { value: '', label: 'Seleccione un nivel' },
                { value: 'INICIAL', label: 'Inicial' },
                { value: 'PRIMARIA', label: 'Primaria' },
                { value: 'SECUNDARIA', label: 'Secundaria' },
              ]}
              required
            />

            <FormField
              label="Nombre del Reporte"
              value={form.nombreReporte}
              onChange={(e) => setForm({ ...form, nombreReporte: e.target.value })}
              placeholder="Ej: Reporte de Notas"
              required
            />

            <FormField
              label="Anio Academico"
              type="number"
              value={form.anioAcademico}
              onChange={(e) => setForm({ ...form, anioAcademico: e.target.value })}
              min="2020"
              max="2030"
              required
            />

            <FormField
              label="Diseno Modular (opcional)"
              value={form.disenoModular}
              onChange={(e) => setForm({ ...form, disenoModular: e.target.value })}
              placeholder="Opcional"
            />

            <FormField
              label="Periodo (opcional)"
              value={form.periodo}
              onChange={(e) => setForm({ ...form, periodo: e.target.value })}
              placeholder="Opcional"
            />

            <FormField
              label="Grado (opcional)"
              value={form.grado}
              onChange={(e) => setForm({ ...form, grado: e.target.value })}
              placeholder="Opcional"
            />

            <FormField
              label="Seccion (opcional)"
              value={form.seccion}
              onChange={(e) => setForm({ ...form, seccion: e.target.value })}
              placeholder="Opcional"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : config ? 'Actualizar Configuracion' : 'Guardar Configuracion'}
            </button>
          </div>
        </form>
      </div>

      {config && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Configuracion Actual</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-blue-600">Institucion</span>
              <p className="text-sm font-semibold text-blue-900">{config.institucionEducativa}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Codigo Modular</span>
              <p className="text-sm font-semibold text-blue-900">{config.codigoModularAnexo}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Nivel</span>
              <p className="text-sm font-semibold text-blue-900">{config.nivel}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Anio Academico</span>
              <p className="text-sm font-semibold text-blue-900">{config.anioAcademico}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Nombre Reporte</span>
              <p className="text-sm font-semibold text-blue-900">{config.nombreReporte}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportarTab() {
  const [filtros, setFiltros] = useState<SiagieFiltrosResponse | null>(null);
  const [cursos, setCursos] = useState<CursoDto[]>([]);
  const [exportaciones, setExportaciones] = useState<ExportacionSiagieDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastExport, setLastExport] = useState<{ fileName: string; downloadUrl: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Form state
  const [form, setForm] = useState({
    anioEscolarId: '',
    bimestreId: '',
    gradoId: '',
    seccionId: '',
    cursoIds: [] as string[],
  });

  // Filtered bimestres based on selected year
  const [filteredBimestres, setFilteredBimestres] = useState<BimestreDto[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filtros && form.anioEscolarId) {
      const bimestresDelAnio = filtros.bimestres.filter((b) => b.anioEscolarId === form.anioEscolarId);
      setFilteredBimestres(bimestresDelAnio);
      // Reset bimestre if it doesn't belong to the selected year
      if (form.bimestreId && !bimestresDelAnio.some((b) => b.id === form.bimestreId)) {
        setForm((prev) => ({ ...prev, bimestreId: '' }));
      }
    } else {
      setFilteredBimestres([]);
    }
  }, [form.anioEscolarId, filtros]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [filtrosData, cursosData, exportacionesData] = await Promise.all([
        siagieApi.filtros(),
        siagieApi.cursosDisponibles(),
        siagieApi.listExportaciones(0, pageSize),
      ]);

      setFiltros(filtrosData);
      setCursos(cursosData);
      setExportaciones(exportacionesData.content);
      setTotalPages(exportacionesData.totalPages);
      setTotalElements(exportacionesData.totalElements);

      // Set default year to active one
      const activeYear = filtrosData.anios.find((a) => a.activo);
      if (activeYear) {
        setForm((prev) => ({ ...prev, anioEscolarId: activeYear.id }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Error al cargar los datos' });
    } finally {
      setLoading(false);
    }
  };

  const fetchExportaciones = useCallback(async () => {
    try {
      const data = await siagieApi.listExportaciones(currentPage, pageSize);
      setExportaciones(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error('Error fetching exportaciones:', error);
    }
  }, [currentPage]);

  useEffect(() => {
    if (!loading) {
      fetchExportaciones();
    }
  }, [currentPage, fetchExportaciones, loading]);

  const handleCursoToggle = (cursoId: string) => {
    setForm((prev) => {
      const isSelected = prev.cursoIds.includes(cursoId);
      if (isSelected) {
        return { ...prev, cursoIds: prev.cursoIds.filter((id) => id !== cursoId) };
      }
      // Max 3 courses
      if (prev.cursoIds.length >= 3) {
        return prev;
      }
      return { ...prev, cursoIds: [...prev.cursoIds, cursoId] };
    });
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.anioEscolarId || !form.bimestreId) {
      setMessage({ type: 'error', text: 'Debe seleccionar anio escolar y bimestre' });
      return;
    }

    setExporting(true);
    setMessage(null);
    setLastExport(null);

    try {
      const result = await siagieApi.exportar({
        tipo: 'NOTAS',
        anioEscolarId: form.anioEscolarId,
        bimestreId: form.bimestreId,
        gradoId: form.gradoId || undefined,
        seccionId: form.seccionId || undefined,
        cursoIds: form.cursoIds.length > 0 ? form.cursoIds : undefined,
      });

      setLastExport({ fileName: result.fileName, downloadUrl: result.downloadUrl });
      setMessage({ type: 'success', text: 'Exportacion generada exitosamente' });

      // Refresh exportaciones list
      await fetchExportaciones();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al generar la exportacion',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async (exportacion: ExportacionSiagieDto) => {
    try {
      setDownloading(exportacion.id);
      await siagieApi.descargarExportacion(exportacion.id, `siagie_${exportacion.periodo}.xlsx`);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al descargar el archivo',
      });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Export Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Generar Exportacion</h2>
        <form onSubmit={handleExport} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Anio Escolar"
              value={form.anioEscolarId}
              onChange={(e) => setForm({ ...form, anioEscolarId: e.target.value })}
              options={[
                { value: '', label: 'Seleccione un anio' },
                ...(filtros?.anios.map((a) => ({
                  value: a.id,
                  label: `${a.anio}${a.activo ? ' (Activo)' : ''}`,
                })) || []),
              ]}
              required
            />

            <Select
              label="Bimestre"
              value={form.bimestreId}
              onChange={(e) => setForm({ ...form, bimestreId: e.target.value })}
              options={[
                { value: '', label: 'Seleccione un bimestre' },
                ...filteredBimestres.map((b) => ({
                  value: b.id,
                  label: `Bimestre ${b.numero}${b.cerrado ? ' (Cerrado)' : ''}`,
                })),
              ]}
              required
            />

            <Select
              label="Grado (opcional)"
              value={form.gradoId}
              onChange={(e) => setForm({ ...form, gradoId: e.target.value, seccionId: '' })}
              options={[
                { value: '', label: 'Todos los grados' },
                ...(filtros?.grados.map((g) => ({
                  value: g.id,
                  label: `${g.nombre} - ${g.nivel}`,
                })) || []),
              ]}
            />

            <Select
              label="Seccion (opcional)"
              value={form.seccionId}
              onChange={(e) => setForm({ ...form, seccionId: e.target.value })}
              options={[
                { value: '', label: 'Todas las secciones' },
                ...(filtros?.secciones
                  .filter((s) => !form.gradoId || s.gradoId === form.gradoId)
                  .map((s) => ({
                    value: s.id,
                    label: s.gradoNombre ? `${s.nombre} (${s.gradoNombre})` : s.nombre,
                  })) || []),
              ]}
              disabled={!form.gradoId}
            />
          </div>

          {/* Course Multi-select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cursos (opcional, maximo 3)
            </label>
            <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
              {cursos.length === 0 ? (
                <p className="text-sm text-gray-500">No hay cursos disponibles</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {cursos.map((curso) => {
                    const isSelected = form.cursoIds.includes(curso.id);
                    const isDisabled = !isSelected && form.cursoIds.length >= 3;
                    return (
                      <label
                        key={curso.id}
                        className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary-50 border-primary-300'
                            : isDisabled
                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCursoToggle(curso.id)}
                          disabled={isDisabled}
                          className="mr-2"
                        />
                        <span className="text-sm">{curso.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            {form.cursoIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {form.cursoIds.length}/3 cursos seleccionados
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              {lastExport && (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Archivo generado: {lastExport.fileName}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={exporting || !form.anioEscolarId || !form.bimestreId}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Exportar
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Export History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">Historial de Exportaciones</h3>
        </div>

        {exportaciones.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No hay exportaciones registradas</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Periodo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exportaciones.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(exp.fecha).toLocaleString('es-PE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exp.tipo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exp.periodo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exp.usuarioUsername}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleDownload(exp)}
                          disabled={downloading === exp.id}
                          className="text-primary-600 hover:text-primary-900 disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {downloading === exp.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600"></div>
                          ) : (
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                          )}
                          Descargar
                        </button>
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
