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
  bimestreActual: number | null;
  promedioGeneral: number | null;
  literalGeneral: string | null;
  totalCursos: number;
  cursosAprobados: number;
  cursosDesaprobados: number;
  cursos: CursoResumen[];
  alertas: Alerta[];
}

interface CursoResumen {
  cursoId: string;
  cursoNombre: string;
  ultimaNota: number | null;
  literal: string | null;
  tendencia: string;
}

interface Alerta {
  tipo: string;
  mensaje: string;
  cursoNombre: string;
}

export default function PadreDashboard() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Portal de Padres
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Mis Hijos" value={hijos.length.toString()} icon="👦" color="blue" />
        <StatCard title="Comunicados Nuevos" value="---" icon="📬" color="green" />
        <StatCard title="Pensiones Pendientes" value="---" icon="💳" color="yellow" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton label="Ver Notas" href="/padre/hijos" />
          <ActionButton label="Pagar Pensión" href="/padre/pagos" />
          <ActionButton label="Comunicados" href="/padre/comunicados" />
          <ActionButton label="Telegram" href="/padre/telegram" />
        </div>
      </div>

      {/* Children Section */}
      {hijos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No tiene hijos vinculados a su cuenta.</p>
          <p className="text-sm text-gray-400 mt-2">
            Contacte con la administración del colegio para vincular a sus hijos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hijos.map((hijo) => (
            <HijoCard key={hijo.alumnoId} hijo={hijo} />
          ))}
        </div>
      )}
    </div>
  );
}

interface HijoCardProps {
  hijo: ResumenAcademico;
}

function HijoCard({ hijo }: HijoCardProps) {
  const getLiteralColor = (literal: string | null): string => {
    switch (literal) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const alertasImportantes = hijo.alertas.filter(a => 
    a.tipo === 'BAJO_RENDIMIENTO' || a.tipo === 'RECUPERACION_PENDIENTE'
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {hijo.alumnoNombres} {hijo.alumnoApellidos}
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              {hijo.gradoNombre} - Sección {hijo.seccionNombre}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Código: {hijo.alumnoCodigo}
            </p>
          </div>
          
          {hijo.literalGeneral && (
            <div className={`px-3 py-2 rounded-lg border ${getLiteralColor(hijo.literalGeneral)}`}>
              <div className="text-2xl font-bold text-center">{hijo.literalGeneral}</div>
              <div className="text-xs text-center mt-1">
                {hijo.promedioGeneral?.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-semibold text-gray-900">{hijo.totalCursos}</div>
            <div className="text-xs text-gray-500">Cursos</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <div className="text-lg font-semibold text-green-600">{hijo.cursosAprobados}</div>
            <div className="text-xs text-gray-500">Aprobados</div>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <div className="text-lg font-semibold text-red-600">{hijo.cursosDesaprobados}</div>
            <div className="text-xs text-gray-500">Por mejorar</div>
          </div>
        </div>

        {/* Alerts */}
        {alertasImportantes.length > 0 && (
          <div className="mt-4 space-y-2">
            {alertasImportantes.slice(0, 2).map((alerta, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg text-sm ${
                  alerta.tipo === 'BAJO_RENDIMIENTO'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {alerta.mensaje}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4">
          <Link
            href={`/padre/hijos/${hijo.alumnoId}`}
            className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Boleta de Notas
          </Link>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'yellow';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  href: string;
}

function ActionButton({ label, href }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
    >
      {label}
    </Link>
  );
}
