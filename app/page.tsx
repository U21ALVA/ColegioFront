import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Colegio Ricardo Palma
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistema Integral de Gestión Académica y Administrativa
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Iniciar Sesión
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl">
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">Portal Admin</h3>
            <p className="text-sm text-gray-600">
              Gestión completa del sistema, usuarios y configuración.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">Portal Profesor</h3>
            <p className="text-sm text-gray-600">
              Registro de notas y asistencia de sus cursos.
            </p>
          </div>
          
          <div className="p-6 bg-white rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-900 mb-2">Portal Padre</h3>
            <p className="text-sm text-gray-600">
              Consulta de notas, pagos y comunicados.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
