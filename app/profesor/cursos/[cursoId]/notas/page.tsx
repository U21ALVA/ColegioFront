'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

interface Alumno {
  id: string;
  dni: string;
  codigoEstudiante: string;
  nombres: string;
  apellidos: string;
}

interface Nota {
  id?: string;
  alumnoId: string;
  alumnoNombres: string;
  alumnoApellidos: string;
  alumnoCodigo: string;
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
  anioEscolarId?: string;
}

interface Curso {
  id: string;
  nombre: string;
}

export default function NotasEntryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cursoId = params.cursoId as string;
  const gradoId = searchParams.get('gradoId');
  const seccionId = searchParams.get('seccionId');
  const bimestreIdParam = searchParams.get('bimestreId');

  const [curso, setCurso] = useState<Curso | null>(null);
  const [bimestres, setBimestres] = useState<Bimestre[]>([]);
  const [selectedBimestre, setSelectedBimestre] = useState<string>(bimestreIdParam || '');
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!gradoId || !seccionId) {
      setError('Faltan parámetros de grado o sección');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [cursoRes, bimestresRes] = await Promise.all([
        api.get<Curso>(`/api/cursos/${cursoId}`),
        api.get<Bimestre[]>('/api/bimestres/activos'),
      ]);

      setCurso(cursoRes.data);
      setBimestres(bimestresRes.data);

      // Set default bimester if not provided
      if (!selectedBimestre && bimestresRes.data.length > 0) {
        const openBimestres = bimestresRes.data.filter((b: Bimestre) => !b.cerrado);
        if (openBimestres.length > 0) {
          setSelectedBimestre(openBimestres[openBimestres.length - 1].id);
        } else {
          setSelectedBimestre(bimestresRes.data[0].id);
        }
      }

      const anioEscolarId = bimestresRes.data[0]?.anioEscolarId;
      if (!anioEscolarId) {
        setNotas([]);
        return;
      }

      const alumnosRes = await api.get<Alumno[]>(
        `/api/matriculas/alumnos?cursoId=${cursoId}&seccionId=${seccionId}&anioEscolarId=${anioEscolarId}`
      );

      const initialNotas: Nota[] = alumnosRes.data.map((alumno: Alumno) => ({
        alumnoId: alumno.id,
        alumnoNombres: alumno.nombres,
        alumnoApellidos: alumno.apellidos,
        alumnoCodigo: alumno.codigoEstudiante,
        n1: null,
        n2: null,
        n3: null,
        n4: null,
        notaFinal: null,
        literal: null,
      }));
      setNotas(initialNotas);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [cursoId, gradoId, seccionId, selectedBimestre]);

  // Fetch grades when bimestre changes
  const fetchNotas = useCallback(async () => {
    if (!selectedBimestre || notas.length === 0) return;

    try {
      const response = await api.get<Nota[]>(`/api/notas/curso/${cursoId}/bimestre/${selectedBimestre}`);
      
      // Merge fetched grades with student list
      const notasMap = new Map(response.data.map((n: Nota) => [n.alumnoId, n]));
      
      setNotas(prevNotas => 
        prevNotas.map(nota => {
          const existingNota = notasMap.get(nota.alumnoId);
          if (existingNota) {
            return {
              ...nota,
              id: existingNota.id,
              n1: existingNota.n1,
              n2: existingNota.n2,
              n3: existingNota.n3,
              n4: existingNota.n4,
              notaFinal: existingNota.notaFinal,
              literal: existingNota.literal,
            };
          }
          return {
            ...nota,
            id: undefined,
            n1: null,
            n2: null,
            n3: null,
            n4: null,
            notaFinal: null,
            literal: null,
          };
        })
      );
    } catch (err) {
      console.error('Error fetching grades:', err);
    }
  }, [cursoId, selectedBimestre, notas.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedBimestre && notas.length > 0) {
      fetchNotas();
    }
  }, [selectedBimestre, fetchNotas]);

  const handleGradeChange = (alumnoId: string, field: 'n1' | 'n2' | 'n3' | 'n4', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    // Validate range
    if (numValue !== null && (numValue < 0 || numValue > 20)) {
      return;
    }

    setNotas(prevNotas =>
      prevNotas.map(nota => {
        if (nota.alumnoId !== alumnoId) return nota;
        
        const updated = { ...nota, [field]: numValue };
        
        // Calculate final grade
        const grades = [updated.n1, updated.n2, updated.n3, updated.n4].filter(g => g !== null) as number[];
        if (grades.length > 0) {
          const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
          updated.notaFinal = Math.round(avg * 100) / 100;
          updated.literal = getLiteral(updated.notaFinal);
        } else {
          updated.notaFinal = null;
          updated.literal = null;
        }
        
        return updated;
      })
    );
  };

  const getLiteral = (nota: number): string => {
    if (nota >= 18) return 'A';
    if (nota >= 14) return 'B';
    if (nota >= 11) return 'C';
    return 'D';
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

  const handleSave = async () => {
    if (!selectedBimestre) {
      setError('Debe seleccionar un bimestre');
      return;
    }

    const bimestre = bimestres.find(b => b.id === selectedBimestre);
    if (bimestre?.cerrado) {
      setError('El bimestre está cerrado. No se pueden guardar cambios.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const notasToSave = notas
        .filter(n => n.n1 !== null || n.n2 !== null || n.n3 !== null || n.n4 !== null)
        .map(n => ({
          alumnoId: n.alumnoId,
          n1: n.n1,
          n2: n.n2,
          n3: n.n3,
          n4: n.n4,
        }));

      await api.post('/api/notas/bulk', {
        cursoId,
        bimestreId: selectedBimestre,
        notas: notasToSave,
      });

      setSuccess('Notas guardadas exitosamente');
      
      // Refresh grades
      await fetchNotas();
    } catch (err) {
      console.error('Error saving grades:', err);
      setError('No se pudieron guardar las notas');
    } finally {
      setSaving(false);
    }
  };

  const currentBimestre = bimestres.find(b => b.id === selectedBimestre);
  const isEditable = currentBimestre && !currentBimestre.cerrado;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registro de Notas</h1>
          {curso && <p className="text-gray-600 mt-1">{curso.nombre}</p>}
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Bimestre:</label>
            <select
              value={selectedBimestre}
              onChange={(e) => setSelectedBimestre(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
            >
              {bimestres.map((bimestre) => (
                <option key={bimestre.id} value={bimestre.id}>
                  Bimestre {bimestre.numero} {bimestre.cerrado ? '(Cerrado)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          {isEditable && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar Notas'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {!isEditable && currentBimestre && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
          El bimestre está cerrado. Las notas son solo de lectura.
        </div>
      )}

      {/* Grade Scale Legend */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-500">Escala:</span>
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">A (18-20)</span>
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">B (14-17)</span>
        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">C (11-13)</span>
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">D (0-10)</span>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alumno
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  N1
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  N2
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  N3
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  N4
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Promedio
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Literal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notas.map((nota, index) => (
                <tr key={nota.alumnoId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {nota.alumnoApellidos}, {nota.alumnoNombres}
                      </div>
                      <div className="text-xs text-gray-500">{nota.alumnoCodigo}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <GradeInput
                      value={nota.n1}
                      onChange={(v) => handleGradeChange(nota.alumnoId, 'n1', v)}
                      disabled={!isEditable}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <GradeInput
                      value={nota.n2}
                      onChange={(v) => handleGradeChange(nota.alumnoId, 'n2', v)}
                      disabled={!isEditable}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <GradeInput
                      value={nota.n3}
                      onChange={(v) => handleGradeChange(nota.alumnoId, 'n3', v)}
                      disabled={!isEditable}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <GradeInput
                      value={nota.n4}
                      onChange={(v) => handleGradeChange(nota.alumnoId, 'n4', v)}
                      disabled={!isEditable}
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium text-gray-900">
                      {nota.notaFinal !== null ? nota.notaFinal.toFixed(2) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {nota.literal && (
                      <span className={`px-2 py-1 text-xs font-bold rounded ${getLiteralColor(nota.literal)}`}>
                        {nota.literal}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface GradeInputProps {
  value: number | null;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function GradeInput({ value, onChange, disabled }: GradeInputProps) {
  return (
    <input
      type="number"
      min="0"
      max="20"
      step="0.5"
      value={value !== null ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-16 px-2 py-1 text-center border rounded-lg text-sm
        ${disabled 
          ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
          : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
        }`}
      placeholder="-"
    />
  );
}
