'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { FormField, Select, Badge } from '@/components';

interface Alumno {
  id?: string;
  codigoEstudiante: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  direccion: string;
  seccionId: string;
}

interface Seccion {
  id: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
  gradoNivel: string;
}

interface ApoderadoVinculado {
  id: string;
  apoderadoId: string;
  apoderadoNombres: string;
  apoderadoApellidos: string;
  apoderadoDni: string;
  parentesco: string;
  esContactoEmergencia: boolean;
}

export default function AlumnoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'nuevo';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [apoderados, setApoderados] = useState<ApoderadoVinculado[]>([]);
  const [formData, setFormData] = useState<Alumno>({
    codigoEstudiante: '',
    dni: '',
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    genero: 'M',
    direccion: '',
    seccionId: '',
  });

  useEffect(() => {
    fetchSecciones();
    if (!isNew) {
      fetchAlumno();
      fetchApoderados();
    }
  }, [params.id, isNew]);

  const fetchSecciones = async () => {
    try {
      const response = await api.get<Seccion[]>('/api/secciones');
      setSecciones(response.data);
    } catch (error) {
      console.error('Error fetching secciones:', error);
    }
  };

  const fetchAlumno = async () => {
    try {
      const response = await api.get<Alumno>(`/api/alumnos/${params.id}`);
      setFormData({
        ...response.data,
        fechaNacimiento: response.data.fechaNacimiento
          ? response.data.fechaNacimiento.split('T')[0]
          : '',
      });
    } catch (error) {
      console.error('Error fetching alumno:', error);
      setError('Error al cargar el alumno');
    } finally {
      setLoading(false);
    }
  };

  const fetchApoderados = async () => {
    try {
      const response = await api.get<ApoderadoVinculado[]>(`/api/alumnos/${params.id}/apoderados`);
      setApoderados(response.data);
    } catch (error) {
      console.error('Error fetching apoderados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isNew) {
        await api.post('/api/alumnos', formData);
      } else {
        await api.put(`/api/alumnos/${params.id}`, formData);
      }
      router.push('/admin/alumnos');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Alumno, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Group secciones by nivel for better UX
  const groupedSecciones = secciones.reduce(
    (acc, s) => {
      const nivel = s.gradoNivel;
      if (!acc[nivel]) acc[nivel] = [];
      acc[nivel].push(s);
      return acc;
    },
    {} as Record<string, Seccion[]>
  );

  const seccionOptions = [
    { value: '', label: 'Seleccione una sección' },
    ...Object.entries(groupedSecciones).flatMap(([nivel, secs]) =>
      secs.map((s) => ({
        value: s.id,
        label: `${s.gradoNombre} ${s.nombre} (${nivel})`,
      }))
    ),
  ];

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
              {isNew ? 'Nuevo Alumno' : 'Editar Alumno'}
            </h1>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Código de Estudiante"
                  type="text"
                  value={formData.codigoEstudiante}
                  onChange={(e) => handleChange('codigoEstudiante', e.target.value)}
                  required
                  maxLength={20}
                  hint="Ej: 2024-0001"
                />

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
                  label="Fecha de Nacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                  required
                />

                <Select
                  label="Género"
                  value={formData.genero}
                  onChange={(e) => handleChange('genero', e.target.value)}
                  options={[
                    { value: 'M', label: 'Masculino' },
                    { value: 'F', label: 'Femenino' },
                  ]}
                  required
                />

                <div className="md:col-span-2">
                  <Select
                    label="Grado y Sección"
                    value={formData.seccionId}
                    onChange={(e) => handleChange('seccionId', e.target.value)}
                    options={seccionOptions}
                    required
                  />
                </div>

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

        {/* Sidebar: Apoderados */}
        {!isNew && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Apoderados</h2>
                <button
                  onClick={() => router.push(`/admin/alumnos/${params.id}/apoderados`)}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Gestionar
                </button>
              </div>

              {apoderados.length === 0 ? (
                <p className="text-sm text-gray-500">No hay apoderados vinculados</p>
              ) : (
                <ul className="space-y-3">
                  {apoderados.map((ap) => (
                    <li key={ap.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {ap.apoderadoApellidos}, {ap.apoderadoNombres}
                          </p>
                          <p className="text-xs text-gray-500">DNI: {ap.apoderadoDni}</p>
                          <p className="text-xs text-gray-500 capitalize">{ap.parentesco}</p>
                        </div>
                        {ap.esContactoEmergencia && (
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
