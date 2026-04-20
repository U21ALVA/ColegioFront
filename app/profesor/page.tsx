'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface DocenteCurso {
  id: string;
  cursoId: string;
  cursoNombre: string;
  gradoId: string;
  gradoNombre: string;
  seccionId: string;
  seccionNombre: string;
  anio: number;
}

interface DashboardStats {
  totalCursos: number;
  totalAlumnos: number;
  notasPendientes: number;
}

export default function ProfesorDashboard() {
  const [cursos, setCursos] = useState<DocenteCurso[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalCursos: 0, totalAlumnos: 0, notasPendientes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get<DocenteCurso[]>('/api/profesor/cursos');
      setCursos(response.data);
      setStats({
        totalCursos: response.data.length,
        totalAlumnos: 0, // TODO: Calculate from enrolled students
        notasPendientes: 0, // TODO: Calculate pending grades
      });
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('No se pudieron cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Panel del Profesor
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Mis Cursos" value={stats.totalCursos.toString()} icon="📚" color="blue" />
        <StatCard title="Alumnos Asignados" value={stats.totalAlumnos.toString()} icon="👨‍🎓" color="green" />
        <StatCard title="Notas Pendientes" value={stats.notasPendientes.toString()} icon="✏️" color="yellow" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <ActionButton label="Registrar Notas" href="/profesor/cursos" />
          <ActionButton label="Ver Mis Cursos" href="/profesor/cursos" />
        </div>
      </div>

      {/* Current Courses */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Mis Cursos Activos</h2>
        {cursos.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <p>No tiene cursos asignados para el año escolar actual.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cursos.map((curso) => (
              <Link
                key={curso.id}
                href={`/profesor/cursos/${curso.cursoId}/notas?gradoId=${curso.gradoId}&seccionId=${curso.seccionId}`}
                className="block p-4 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{curso.cursoNombre}</h3>
                <p className="text-sm text-gray-500">
                  {curso.gradoNombre} - {curso.seccionNombre}
                </p>
              </Link>
            ))}
          </div>
        )}
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
