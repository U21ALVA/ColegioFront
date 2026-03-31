'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FormField, Select } from '@/components';

interface ConfiguracionPension {
  id: string;
  anioEscolarId: string;
  anioEscolar: number;
  montoBase: number;
  fechaVencimientoDia: number;
  porcentajeMora: number;
}

interface AnioEscolar {
  id: string;
  anio: number;
  activo: boolean;
}

export default function ConfiguracionPensionPage() {
  const [config, setConfig] = useState<ConfiguracionPension | null>(null);
  const [aniosEscolares, setAniosEscolares] = useState<AnioEscolar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [form, setForm] = useState({
    anioEscolarId: '',
    montoBase: '',
    fechaVencimientoDia: '15',
    porcentajeMora: '0',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aniosRes, configRes] = await Promise.all([
        api.get<AnioEscolar[]>('/api/anios-escolares'),
        api.get<ConfiguracionPension>('/api/configuracion-pension/activo').catch(() => ({ data: null })),
      ]);
      
      setAniosEscolares(aniosRes.data);
      
      if (configRes.data) {
        setConfig(configRes.data);
        setForm({
          anioEscolarId: configRes.data.anioEscolarId,
          montoBase: configRes.data.montoBase.toString(),
          fechaVencimientoDia: configRes.data.fechaVencimientoDia.toString(),
          porcentajeMora: configRes.data.porcentajeMora.toString(),
        });
      } else {
        // Set default year to active one
        const activeYear = aniosRes.data.find(a => a.activo);
        if (activeYear) {
          setForm(prev => ({ ...prev, anioEscolarId: activeYear.id }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        anioEscolarId: form.anioEscolarId,
        montoBase: parseFloat(form.montoBase),
        fechaVencimientoDia: parseInt(form.fechaVencimientoDia),
        porcentajeMora: parseFloat(form.porcentajeMora),
      };

      if (config) {
        // Update existing
        const response = await api.put<ConfiguracionPension>(`/api/configuracion-pension/${config.id}`, payload);
        setConfig(response.data);
        setMessage({ type: 'success', text: 'Configuración actualizada exitosamente' });
      } else {
        // Create new
        const response = await api.post<ConfiguracionPension>('/api/configuracion-pension', payload);
        setConfig(response.data);
        setMessage({ type: 'success', text: 'Configuración creada exitosamente' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al guardar la configuración' 
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Pensiones</h1>
        <p className="text-gray-600 mt-1">Configure el monto base, día de vencimiento y mora por año escolar</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Año Escolar"
              value={form.anioEscolarId}
              onChange={(e) => setForm({ ...form, anioEscolarId: e.target.value })}
              options={[
                { value: '', label: 'Seleccione un año' },
                ...aniosEscolares.map(a => ({ 
                  value: a.id, 
                  label: `${a.anio}${a.activo ? ' (Activo)' : ''}` 
                })),
              ]}
              disabled={!!config}
            />

            <FormField
              label="Monto Base (S/.)"
              type="number"
              value={form.montoBase}
              onChange={(e) => setForm({ ...form, montoBase: e.target.value })}
              placeholder="Ej: 450.00"
              step="0.01"
              min="0"
              required
            />

            <FormField
              label="Día de Vencimiento"
              type="number"
              value={form.fechaVencimientoDia}
              onChange={(e) => setForm({ ...form, fechaVencimientoDia: e.target.value })}
              placeholder="Día del mes (1-28)"
              min="1"
              max="28"
              required
            />

            <FormField
              label="Porcentaje de Mora (%)"
              type="number"
              value={form.porcentajeMora}
              onChange={(e) => setForm({ ...form, porcentajeMora: e.target.value })}
              placeholder="Ej: 5"
              step="0.01"
              min="0"
              max="100"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : config ? 'Actualizar Configuración' : 'Crear Configuración'}
            </button>
          </div>
        </form>
      </div>

      {/* Current Configuration Summary */}
      {config && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Configuración Actual</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-blue-600">Año Escolar</span>
              <p className="text-lg font-semibold text-blue-900">{config.anioEscolar}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Monto Base</span>
              <p className="text-lg font-semibold text-blue-900">S/. {config.montoBase.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Vencimiento</span>
              <p className="text-lg font-semibold text-blue-900">Día {config.fechaVencimientoDia}</p>
            </div>
            <div>
              <span className="text-sm text-blue-600">Mora</span>
              <p className="text-lg font-semibold text-blue-900">{config.porcentajeMora}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
