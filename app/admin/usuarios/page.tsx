'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { FormField, Modal, Pagination, SearchInput, Select } from '@/components';

type TipoUsuario = 'ADMIN' | 'PROFESOR' | 'PADRE';

interface UsuarioGestion {
  id: string;
  tipo: TipoUsuario;
  usuarioId?: string;
  email?: string;
  dni?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  direccion?: string;
  especialidad?: string;
  fechaNacimiento?: string;
  gradoId?: string;
  gradoNombre?: string;
  nivel?: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
  seccionId?: string;
  seccionNombre?: string;
  hijosCount?: number;
  estado?: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE' | 'ELIMINADO';
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface Grado {
  id: string;
  nombre: string;
  nivel: 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';
}

interface Seccion {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
}

interface HijoVinculado {
  id?: string;
  alumnoId: string;
  alumnoNombres?: string;
  alumnoApellidos?: string;
  alumnoDni?: string;
  gradoNombre?: string;
  parentesco?: string;
  esPrincipal?: boolean;
}

interface ApoderadoDetalle {
  hijos?: HijoVinculado[];
}

interface FormData {
  tipo: TipoUsuario;
  email: string;
  password: string;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  direccion: string;
  especialidad: string;
  crearHijo: boolean;
  hijoDni: string;
  hijoCodigoEstudiante: string;
  hijoNombres: string;
  hijoApellidos: string;
  hijoFechaNacimiento: string;
  hijoGradoId: string;
  hijoSeccionId: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE' | 'ELIMINADO';
}

const defaultFormData: FormData = {
  tipo: 'ADMIN',
  email: '',
  password: '',
  dni: '',
  nombres: '',
  apellidos: '',
  telefono: '',
  direccion: '',
  especialidad: '',
  crearHijo: false,
  hijoDni: '',
  hijoCodigoEstudiante: '',
  hijoNombres: '',
  hijoApellidos: '',
  hijoFechaNacimiento: '',
  hijoGradoId: '',
  hijoSeccionId: '',
  estado: 'ACTIVO',
};

export default function UsuariosPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<UsuarioGestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [gradoFilter, setGradoFilter] = useState<string>('');
  const [seccionFilter, setSeccionFilter] = useState<string>('');
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionesHijo, setSeccionesHijo] = useState<Seccion[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UsuarioGestion | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hijosVinculados, setHijosVinculados] = useState<HijoVinculado[]>([]);
  const [showHijosDetalle, setShowHijosDetalle] = useState(true);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<UsuarioGestion | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchGrados();
  }, []);

  useEffect(() => {
    const tipo = searchParams.get('tipo');
    if (tipo && ['ADMIN', 'PROFESOR', 'PADRE'].includes(tipo.toUpperCase())) {
      setTipoFilter(tipo.toUpperCase());
      setCurrentPage(0);
    }
  }, [searchParams]);

  useEffect(() => {
    if (gradoFilter) {
      fetchSecciones(gradoFilter);
    } else {
      setSecciones([]);
      setSeccionFilter('');
    }
  }, [gradoFilter]);

  useEffect(() => {
    if (formData.tipo === 'PADRE' && formData.crearHijo && formData.hijoGradoId) {
      fetchSeccionesHijo(formData.hijoGradoId);
    } else {
      setSeccionesHijo([]);
    }
  }, [formData.tipo, formData.crearHijo, formData.hijoGradoId]);

  useEffect(() => {
    fetchUsuarios();
  }, [currentPage, search, tipoFilter, estadoFilter, gradoFilter, seccionFilter]);

  const filteredSeccionesForm = useMemo(() => secciones, [secciones]);

  const fetchGrados = async () => {
    try {
      const response = await api.get<Grado[]>('/api/grados/activos');
      setGrados(response.data);
    } catch (err) {
      console.error('Error fetching grados', err);
    }
  };

  const fetchSecciones = async (gradoId: string) => {
    try {
      const response = await api.get<Seccion[]>(`/api/secciones/grado/${gradoId}/activas`);
      setSecciones(response.data);
    } catch (err) {
      console.error('Error fetching secciones', err);
    }
  };

  const fetchSeccionesHijo = async (gradoId: string) => {
    try {
      const response = await api.get<Seccion[]>(`/api/secciones/grado/${gradoId}/activas`);
      setSeccionesHijo(response.data);
    } catch (err) {
      console.error('Error fetching secciones hijo', err);
      setSeccionesHijo([]);
    }
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('size', String(pageSize));
      if (search) params.set('q', search);
      if (tipoFilter) params.set('tipo', tipoFilter);
      if (estadoFilter) params.set('estado', estadoFilter);
      

      const response = await api.get<PageResponse<UsuarioGestion>>(`/api/usuarios?${params.toString()}`);
      setItems(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      console.error('Error fetching usuarios', err);
    } finally {
      setLoading(false);
    }
  };

  const resetModalState = () => {
    setFormData(defaultFormData);
    setEditing(null);
    setError('');
    setHijosVinculados([]);
    setShowHijosDetalle(true);
  };

  const openCreateModal = () => {
    resetModalState();
    setShowModal(true);
  };

  const openEditModal = async (item: UsuarioGestion) => {
    setEditing(item);
    const next: FormData = {
      tipo: item.tipo,
      email: item.email || '',
      password: '',
      dni: item.dni || '',
      nombres: item.nombres || '',
      apellidos: item.apellidos || '',
      telefono: item.telefono || '',
      direccion: item.direccion || '',
      especialidad: item.especialidad || '',
      crearHijo: false,
      hijoDni: '',
      hijoCodigoEstudiante: '',
      hijoNombres: '',
      hijoApellidos: '',
      hijoFechaNacimiento: '',
      hijoGradoId: '',
      hijoSeccionId: '',
      estado: item.estado || 'ACTIVO',
    };

    setFormData(next);

    if (item.tipo === 'PADRE') {
      try {
        const response = await api.get<ApoderadoDetalle>(`/api/apoderados/${item.id}`);
        const hijos = response.data?.hijos || [];
        setHijosVinculados(hijos);
        setShowHijosDetalle(hijos.length > 0);
      } catch (err) {
        console.error('Error loading hijos del apoderado', err);
        setHijosVinculados([]);
        setShowHijosDetalle(false);
      }
    } else {
      setHijosVinculados([]);
      setShowHijosDetalle(false);
    }

    setError('');
    setShowModal(true);
  };

  const handleTipoFormChange = (tipo: TipoUsuario) => {
    setFormData((prev) => ({
      ...prev,
      tipo,
      email: prev.email,
      password: '',
      especialidad: tipo === 'PROFESOR' ? prev.especialidad : '',
      direccion: tipo === 'PADRE' ? prev.direccion : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: any = {
        tipo: formData.tipo,
        dni: formData.dni,
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        telefono: formData.telefono || null,
        estado: formData.estado,
      };

      payload.username = formData.dni;
      payload.email = formData.email;
      if (!editing || formData.password) {
        payload.password = formData.password;
      }

      if (formData.tipo === 'PROFESOR') {
        payload.especialidad = formData.especialidad || null;
      }

      if (formData.tipo === 'PADRE') {
        payload.direccion = formData.direccion || null;
        payload.crearHijo = formData.crearHijo;
        if (formData.crearHijo) {
          payload.hijoDni = formData.hijoDni;
          payload.hijoCodigoEstudiante = formData.hijoCodigoEstudiante;
          payload.hijoNombres = formData.hijoNombres;
          payload.hijoApellidos = formData.hijoApellidos;
          payload.hijoFechaNacimiento = formData.hijoFechaNacimiento || null;
          payload.hijoGradoId = formData.hijoGradoId || null;
          payload.hijoSeccionId = formData.hijoSeccionId || null;
        }
      }

      

      if (editing) {
        await api.put(`/api/usuarios/${editing.id}`, payload);
      } else {
        await api.post('/api/usuarios', payload);
      }

      setShowModal(false);
      resetModalState();
      await fetchUsuarios();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo guardar el registro');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: UsuarioGestion) => {
    if (!window.confirm(`¿Seguro que deseas eliminar este registro de tipo ${item.tipo}?`)) {
      return;
    }
    try {
      await api.delete(`/api/usuarios/${item.id}?tipo=${item.tipo}`);
      await fetchUsuarios();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'No se pudo eliminar');
    }
  };

  const openPasswordModal = (item: UsuarioGestion) => {
    setPasswordTarget(item);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!passwordTarget || !newPassword) return;
    try {
      await api.patch(`/api/usuarios/${passwordTarget.id}/password?tipo=${passwordTarget.tipo}`, {
        newPassword,
      });
      setShowPasswordModal(false);
      setPasswordTarget(null);
      setNewPassword('');
      alert('Contraseña actualizada exitosamente');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'No se pudo actualizar la contraseña');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm font-medium"
        >
          Nuevo registro
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setCurrentPage(0); }} placeholder="Buscar..." />

        <Select
          label="Tipo"
          value={tipoFilter}
          onChange={(e) => {
            setTipoFilter(e.target.value);
            setCurrentPage(0);
            setGradoFilter('');
            setSeccionFilter('');
          }}
          options={[
            { value: '', label: 'Todos' },
            { value: 'ADMIN', label: 'Administradores' },
            { value: 'PROFESOR', label: 'Profesores' },
            { value: 'PADRE', label: 'Padres' },
            
          ]}
        />

        <Select
          label="Estado"
          value={estadoFilter}
          onChange={(e) => { setEstadoFilter(e.target.value); setCurrentPage(0); }}
          options={[
            { value: '', label: 'Todos' },
            { value: 'ACTIVO', label: 'Activo' },
            { value: 'INACTIVO', label: 'Inactivo' },
            { value: 'PENDIENTE', label: 'Pendiente' },
            { value: 'ELIMINADO', label: 'Eliminado' },
          ]}
        />

        <Select
          label="Grado"
          value={gradoFilter}
          onChange={(e) => { setGradoFilter(e.target.value); setCurrentPage(0); }}
          disabled
          options={[
            { value: '', label: 'Todos' },
            ...grados.map((g) => ({ value: g.id, label: `${g.nombre} (${g.nivel})` })),
          ]}
        />

        <Select
          label="Sección"
          value={seccionFilter}
          onChange={(e) => { setSeccionFilter(e.target.value); setCurrentPage(0); }}
          disabled
          options={[
            { value: '', label: 'Todas' },
            ...secciones
              .filter((s) => (gradoFilter ? s.gradoId === gradoFilter : true))
              .map((s) => ({ value: s.id, label: `${s.gradoNombre} ${s.nombre}` })),
          ]}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron resultados</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Persona</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identificación</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={`${item.tipo}-${item.id}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">{item.tipo}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-medium">{item.apellidos || '-'}, {item.nombres || '-'}</div>
                        
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div>DNI: {item.dni || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="text-xs text-gray-500">{item.email || '-'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.estado || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex gap-3">
                          <button className="text-primary-600 hover:text-primary-900" onClick={() => openEditModal(item)}>Editar</button>
                          <button className="text-amber-600 hover:text-amber-800" onClick={() => openPasswordModal(item)}>Reset pass</button>
                          <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(item)}>Eliminar</button>
                        </div>
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

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetModalState();
        }}
        title={editing ? 'Editar registro' : 'Nuevo registro'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo"
              value={formData.tipo}
              onChange={(e) => handleTipoFormChange(e.target.value as TipoUsuario)}
              options={[
                { value: 'ADMIN', label: 'ADMIN' },
                { value: 'PROFESOR', label: 'PROFESOR' },
                { value: 'PADRE', label: 'PADRE' },
                  
              ]}
              disabled={Boolean(editing)}
            />

            <FormField
              label="DNI"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Nombres"
              value={formData.nombres}
              onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
              required
            />
            <FormField
              label="Apellidos"
              value={formData.apellidos}
              onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
            <Select
              label="Estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value as FormData['estado'] })}
              options={[
                { value: 'ACTIVO', label: 'ACTIVO' },
                { value: 'INACTIVO', label: 'INACTIVO' },
                { value: 'PENDIENTE', label: 'PENDIENTE' },
                { value: 'ELIMINADO', label: 'ELIMINADO' },
              ]}
            />
          </div>

          <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  Usuario de acceso: DNI ({formData.dni || '—'})
                </div>
                <FormField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editing}
                />
                <div />
              </div>
            </>

          {formData.tipo === 'PROFESOR' && (
            <FormField
              label="Especialidad"
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
            />
          )}

          {formData.tipo === 'PADRE' && (
            <div className="space-y-4">
              <FormField
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />

              {editing && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      Hijos vinculados: <strong>{hijosVinculados.length || editing.hijosCount || 0}</strong>
                    </span>
                    {(hijosVinculados.length > 0) && (
                      <button
                        type="button"
                        onClick={() => setShowHijosDetalle((v) => !v)}
                        className="text-xs px-2 py-1 rounded border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100"
                      >
                        {showHijosDetalle ? 'Ocultar detalle' : 'Ver detalle'}
                      </button>
                    )}
                  </div>

                  {showHijosDetalle && hijosVinculados.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {hijosVinculados.map((hijo) => (
                        <div key={hijo.id || hijo.alumnoId} className="rounded border border-emerald-200 bg-white px-3 py-2 text-xs text-emerald-900">
                          <div className="font-semibold">
                            {(hijo.alumnoApellidos || '-')}, {(hijo.alumnoNombres || '-')}
                          </div>
                          <div>DNI: {hijo.alumnoDni || '-'}</div>
                          <div>Grado: {hijo.gradoNombre || '-'}</div>
                          <div>Parentesco: {hijo.parentesco || 'PADRE'} {hijo.esPrincipal ? '(Principal)' : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.crearHijo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      crearHijo: e.target.checked,
                      hijoSeccionId: e.target.checked ? formData.hijoSeccionId : '',
                    })
                  }
                />
                Crear hijo y vincularlo a este padre
              </label>

              {formData.crearHijo && (
                <div className="space-y-3 rounded-md border border-gray-200 p-3 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="DNI del hijo"
                      value={formData.hijoDni}
                      onChange={(e) => setFormData({ ...formData, hijoDni: e.target.value })}
                      required
                    />
                    <FormField
                      label="Código estudiante"
                      value={formData.hijoCodigoEstudiante}
                      onChange={(e) => setFormData({ ...formData, hijoCodigoEstudiante: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Nombres del hijo"
                      value={formData.hijoNombres}
                      onChange={(e) => setFormData({ ...formData, hijoNombres: e.target.value })}
                      required
                    />
                    <FormField
                      label="Apellidos del hijo"
                      value={formData.hijoApellidos}
                      onChange={(e) => setFormData({ ...formData, hijoApellidos: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      label="Fecha nacimiento"
                      type="date"
                      value={formData.hijoFechaNacimiento}
                      onChange={(e) => setFormData({ ...formData, hijoFechaNacimiento: e.target.value })}
                    />

                    <Select
                      label="Grado"
                      value={formData.hijoGradoId}
                      onChange={(e) => setFormData({ ...formData, hijoGradoId: e.target.value, hijoSeccionId: '' })}
                      options={[
                        { value: '', label: 'Seleccione grado' },
                        ...grados.map((g) => ({ value: g.id, label: `${g.nombre} (${g.nivel})` })),
                      ]}
                      required
                    />

                    <Select
                      label="Sección"
                      value={formData.hijoSeccionId}
                      onChange={(e) => setFormData({ ...formData, hijoSeccionId: e.target.value })}
                      options={[
                        { value: '', label: 'Seleccione sección' },
                        ...seccionesHijo.map((s) => ({ value: s.id, label: `${s.gradoNombre} ${s.nombre}` })),
                      ]}
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetModalState();
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordTarget(null);
          setNewPassword('');
        }}
        title="Restablecer contraseña"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Usuario: <span className="font-medium">{passwordTarget?.dni || passwordTarget?.email || '-'}</span>
          </p>
          <FormField
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordTarget(null);
                setNewPassword('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
            >
              Actualizar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
