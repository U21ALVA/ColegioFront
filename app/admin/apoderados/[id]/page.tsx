'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { FormField, Badge } from '@/components';

interface Apoderado {
  id?: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  crearUsuario?: boolean;
  password?: string;
}

interface HijoVinculado {
  id: string;
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigoEstudiante: string;
  gradoNombre: string;
  seccionNombre: string;
  parentesco: string;
  esContactoEmergencia: boolean;
}

export default function ApoderadoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'nuevo';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hijos, setHijos] = useState<HijoVinculado[]>([]);
  const [formData, setFormData] = useState<Apoderado>({
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    crearUsuario: false,
    password: '',
  });

  useEffect(() => {
    if (!isNew) {
      fetchApoderado();
      fetchHijos();
    }
  }, [params.id, isNew]);

  const fetchApoderado = async () => {
    try {
      const response = await api.get<Apoderado>(`/api/apoderados/${params.id}`);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching apoderado:', error);
      setError('Error al cargar el apoderado');
    } finally {
      setLoading(false);
    }
  };

  const fetchHijos = async () => {
    try {
      const response = await api.get<HijoVinculado[]>(`/api/apoderados/${params.id}/alumnos`);
      setHijos(response.data);
    } catch (error) {
      console.error('Error fetching hijos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isNew) {
        await api.post('/api/apoderados', formData);
      } else {
        await api.put(`/api/apoderados/${params.id}`, formData);
      }
      router.push('/admin/apoderados');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Apoderado, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {isNew ? 'Nuevo Apoderado' : 'Editar Apoderado'}
            </h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="DNI"
                  type="text"
                  value={formData.dni}
                  onChange={(e) => handleChange('dni', e.target.value)}
                  required
                  maxLength={15}
                  minLength={8}
                />

                <FormField
                  label="Nombres"
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => handleChange('nombres', e.target.value)}
                  required
                  maxLength={100}
                />

                <FormField
                  label="Apellidos"
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => handleChange('apellidos', e.target.value)}
                  required
                  maxLength={100}
                />

                <FormField
                  label="Email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  maxLength={100}
                />

                <FormField
                  label="Teléfono"
                  type="text"
                  value={formData.telefono || ''}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  maxLength={20}
                />

                <div className="md:col-span-2">
                  <FormField
                    label="Dirección"
                    type="text"
                    value={formData.direccion || ''}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    maxLength={255}
                  />
                </div>
              </div>

              {/* Create user option */}
              {isNew && (
                <div className="border-t pt-6">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="crearUsuario"
                      checked={formData.crearUsuario}
                      onChange={(e) => handleChange('crearUsuario', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="crearUsuario" className="ml-2 block text-sm text-gray-900">
                      Crear cuenta de usuario
                    </label>
                  </div>

                  {formData.crearUsuario && (
                    <FormField
                      label="Contraseña"
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required={formData.crearUsuario}
                      hint="Se creará un usuario con rol PADRE"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
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
          </div>
        </div>

        {/* Sidebar: Hijos vinculados */}
        {!isNew && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Hijos Vinculados</h2>
                <button
                  onClick={() => router.push(`/admin/apoderados/${params.id}/hijos`)}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Gestionar
                </button>
              </div>

              {hijos.length === 0 ? (
                <p className="text-sm text-gray-500">No hay alumnos vinculados</p>
              ) : (
                <ul className="space-y-3">
                  {hijos.map((hijo) => (
                    <li key={hijo.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link
                            href={`/admin/alumnos/${hijo.alumnoId}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-800"
                          >
                            {hijo.alumnoApellidos}, {hijo.alumnoNombres}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {hijo.gradoNombre} {hijo.seccionNombre}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{hijo.parentesco}</p>
                        </div>
                        {hijo.esContactoEmergencia && (
                          <Badge variant="warning" size="sm">
                            Emergencia
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
