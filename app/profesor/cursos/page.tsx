'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface DocenteCurso {
  id: string;
  cursoId: string;
  cursoNombre: string;
  cursoNivel: string;
  gradoId: string;
  gradoNombre: string;
  seccionId: string;
  seccionNombre: string;
  anio: number;
}

interface Bimestre {
  id: string;
  numero: number;
  cerrado: boolean;
}

export default function ProfesorCursosPage() {
  const [cursos, setCursos] = useState<DocenteCurso[]>([]);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [selectedBimestre, setSelectedBimestre] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cursosRes, bimestresRes] = await Promise.all([
        api.get<DocenteCurso[]>('/api/profesor/cursos'),
        api.get<Bimestre[]>('/api/bimestres/activos'),
      ]);
      setCursos(cursosRes.data);
      setBimestres(bimestresRes.data);
      
      // Select the last open bimester by default
      const openBimestres = bimestresRes.data.filter((b: Bimestre) => !b.cerrado);
      if (openBimestres.length > 0) {
        setSelectedBimestre(openBimestres[openBimestres.length - 1].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los datos');
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Cursos</h1>
        
        {/* Bimestre Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Bimestre:</label>
          <select
            value={selectedBimestre}
            onChange={(e) => setSelectedBimestre(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Todos</option>
            {bimestres.map((bimestre) => (
              <option key={bimestre.id} value={bimestre.id}>
                Bimestre {bimestre.numero} {bimestre.cerrado ? '(Cerrado)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {cursos.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No tiene cursos asignados para el año escolar actual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((curso) => (
            <CourseCard 
              key={curso.id} 
              curso={curso} 
              bimestreId={selectedBimestre}
              bimestreCerrado={bimestres.find(b => b.id === selectedBimestre)?.cerrado ?? false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CourseCardProps {
  curso: DocenteCurso;
  bimestreId: string;
  bimestreCerrado: boolean;
}

function CourseCard({ curso, bimestreId, bimestreCerrado }: CourseCardProps) {
  const levelColors: Record<string, string> = {
    INICIAL: 'bg-pink-100 text-pink-800',
    PRIMARIA: 'bg-blue-100 text-blue-800',
    SECUNDARIA: 'bg-purple-100 text-purple-800',
  };

  const href = bimestreId
    ? `/profesor/cursos/${curso.cursoId}/notas?gradoId=${curso.gradoId}&seccionId=${curso.seccionId}&bimestreId=${bimestreId}`
    : `/profesor/cursos/${curso.cursoId}/notas?gradoId=${curso.gradoId}&seccionId=${curso.seccionId}`;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{curso.cursoNombre}</h3>
            <p className="text-gray-500 mt-1">
              {curso.gradoNombre} - Sección {curso.seccionNombre}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${levelColors[curso.cursoNivel] || 'bg-gray-100 text-gray-800'}`}>
            {curso.cursoNivel}
          </span>
        </div>
        
        <div className="mt-4">
          <Link
            href={href}
            className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              bimestreCerrado
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {bimestreCerrado ? 'Ver Notas' : 'Registrar Notas'}
          </Link>
        </div>
      </div>
    </div>
  );
}
