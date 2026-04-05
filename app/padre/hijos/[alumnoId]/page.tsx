'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Boleta {
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
  gradoNombre: string;
  seccionNombre: string;
  anioEscolarId: string;
  anioEscolar: number;
  cursos: CursoNotas[];
  promedioGeneral: number | null;
  literalGeneral: string | null;
}

interface CursoNotas {
  cursoId: string;
  cursoNombre: string;
  bimestres: BimestreNota[];
  promedioAnual: number | null;
  literalAnual: string | null;
}

interface BimestreNota {
  bimestreId: string;
  numero: number;
  n1: number | null;
  n2: number | null;
  n3: number | null;
  n4: number | null;
  notaFinal: number | null;
  literal: string | null;
}

interface Bimestre {
  id: string;
  numero: number;
  cerrado: boolean;
}

export default function BoletaPage() {
  const params = useParams();
  const alumnoId = params.alumnoId as string;

  const [boleta, setBoleta] = useState<Boleta | null>(null);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [alumnoId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [boletaRes, bimestresRes] = await Promise.all([
        api.get<Boleta>(`/api/boletas/alumno/${alumnoId}`),
        api.get<Bimestre[]>('/api/bimestres/activos'),
      ]);
      setBoleta(boletaRes.data);
      setBimestres(bimestresRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const getLiteralColor = (literal: string | null): string => {
    switch (literal) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLiteralBgOnly = (literal: string | null): string => {
    switch (literal) {
      case 'A': return 'bg-green-50';
      case 'B': return 'bg-blue-50';
      case 'C': return 'bg-yellow-50';
      case 'D': return 'bg-red-50';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !boleta) {
    return (
      <div>
        <div className="mb-4">
          <Link href="/padre/hijos" className="text-blue-600 hover:text-blue-800 text-sm">
            &larr; Volver a Mis Hijos
          </Link>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error || 'No se encontraron datos'}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back Link */}
      <div className="mb-4">
        <Link href="/padre/hijos" className="text-blue-600 hover:text-blue-800 text-sm">
          &larr; Volver a Mis Hijos
        </Link>
      </div>

      {/* Student Info Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {boleta.alumnoApellidos}, {boleta.alumnoNombres}
            </h1>
            <div className="mt-2 text-gray-600">
              <span className="mr-4">Código: {boleta.alumnoCodigo}</span>
              <span className="mr-4">{boleta.gradoNombre} - Sección {boleta.seccionNombre}</span>
              <span>Año Escolar: {boleta.anioEscolar}</span>
            </div>
          </div>
          
          {/* General Average */}
          {boleta.promedioGeneral !== null && (
            <div className={`mt-4 md:mt-0 px-6 py-4 rounded-lg border ${getLiteralColor(boleta.literalGeneral)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold">{boleta.literalGeneral}</div>
                <div className="text-sm mt-1">Promedio: {boleta.promedioGeneral.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grade Scale Legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-500">Escala de notas:</span>
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">A: Excelente (18-20)</span>
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">B: Bueno (14-17)</span>
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">C: Regular (11-13)</span>
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">D: En proceso (0-10)</span>
      </div>

      {/* Report Card Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Boleta de Notas</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">
                  Curso
                </th>
                {bimestres.map((bimestre) => (
                  <th 
                    key={bimestre.id} 
                    colSpan={5}
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200"
                  >
                    Bimestre {bimestre.numero}
                    {bimestre.cerrado && <span className="ml-1 text-gray-400">(Cerrado)</span>}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-l border-gray-200">
                  Prom. Anual
                </th>
              </tr>
              <tr>
                <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 sticky left-0 bg-gray-50"></th>
                {bimestres.map((bimestre) => (
                  <GradeSubHeaders key={bimestre.id} />
                ))}
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 border-l border-gray-200"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boleta.cursos.map((curso, index) => (
                <tr key={curso.cursoId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit">
                    {curso.cursoNombre}
                  </td>
                  {bimestres.map((bimestre) => {
                    const bimestreNota = curso.bimestres.find(b => b.bimestreId === bimestre.id);
                    return (
                      <GradeCells 
                        key={bimestre.id} 
                        nota={bimestreNota} 
                        getLiteralBgOnly={getLiteralBgOnly}
                      />
                    );
                  })}
                  <td className={`px-4 py-4 text-center border-l border-gray-200 ${getLiteralBgOnly(curso.literalAnual)}`}>
                    {curso.promedioAnual !== null ? (
                      <div>
                        <span className="text-sm font-medium">{curso.promedioAnual.toFixed(2)}</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-bold rounded ${getLiteralColor(curso.literalAnual)}`}>
                          {curso.literalAnual}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Imprimir Boleta
        </button>
      </div>
    </div>
  );
}

function GradeSubHeaders() {
  return (
    <>
      <th className="px-2 py-2 text-center text-xs font-medium text-gray-400 border-l border-gray-200">N1</th>
      <th className="px-2 py-2 text-center text-xs font-medium text-gray-400">N2</th>
      <th className="px-2 py-2 text-center text-xs font-medium text-gray-400">N3</th>
      <th className="px-2 py-2 text-center text-xs font-medium text-gray-400">N4</th>
      <th className="px-2 py-2 text-center text-xs font-medium text-gray-400">Prom</th>
    </>
  );
}

interface GradeCellsProps {
  nota?: BimestreNota;
  getLiteralBgOnly: (literal: string | null) => string;
}

function GradeCells({ nota, getLiteralBgOnly }: GradeCellsProps) {
  const formatGrade = (grade: number | null): string => {
    return grade !== null ? grade.toFixed(1) : '-';
  };

  const getLiteralColor = (literal: string | null): string => {
    switch (literal) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <td className="px-2 py-4 text-center text-sm text-gray-600 border-l border-gray-200">
        {formatGrade(nota?.n1 ?? null)}
      </td>
      <td className="px-2 py-4 text-center text-sm text-gray-600">
        {formatGrade(nota?.n2 ?? null)}
      </td>
      <td className="px-2 py-4 text-center text-sm text-gray-600">
        {formatGrade(nota?.n3 ?? null)}
      </td>
      <td className="px-2 py-4 text-center text-sm text-gray-600">
        {formatGrade(nota?.n4 ?? null)}
      </td>
      <td className={`px-2 py-4 text-center ${getLiteralBgOnly(nota?.literal ?? null)}`}>
        {nota?.notaFinal !== null && nota?.notaFinal !== undefined ? (
          <div className="flex items-center justify-center space-x-1">
            <span className="text-sm font-medium">{nota.notaFinal.toFixed(1)}</span>
            <span className={`px-1 py-0.5 text-xs font-bold rounded ${getLiteralColor(nota.literal)}`}>
              {nota.literal}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </>
  );
}
