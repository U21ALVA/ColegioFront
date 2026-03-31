'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { FormField } from '@/components';

interface Docente {
  id?: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  especialidad: string;
  crearUsuario?: boolean;
  password?: string;
}

export default function DocenteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'nuevo';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Docente>({
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    especialidad: '',
    crearUsuario: false,
    password: '',
  });

  useEffect(() => {
    if (!isNew) {
      fetchDocente();
    }
  }, [params.id, isNew]);

  const fetchDocente = async () => {
    try {
      const response = await api.get<Docente>(`/api/docentes/${params.id}`);
      setFormData(response.data);
    } catch (error) {
      console.error('Error fetching docente:', error);
      setError('Error al cargar el docente');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isNew) {
        await api.post('/api/docentes', formData);
      } else {
        await api.put(`/api/docentes/${params.id}`, formData);
      }
      router.push('/admin/docentes');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Docente, value: string | boolean) => {
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
    <div className="max-w-2xl mx-auto">
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

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isNew ? 'Nuevo Docente' : 'Editar Docente'}
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

            <FormField
              label="Especialidad"
              type="text"
              value={formData.especialidad || ''}
              onChange={(e) => handleChange('especialidad', e.target.value)}
              maxLength={100}
            />
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
                  hint="Se creará un usuario con rol PROFESOR"
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
  );
}
