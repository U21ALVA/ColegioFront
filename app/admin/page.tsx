'use client';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Panel de Administración
      </h1>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Alumnos" value="---" icon="👨‍🎓" color="blue" />
        <StatCard title="Profesores" value="---" icon="👨‍🏫" color="green" />
        <StatCard title="Padres" value="---" icon="👪" color="purple" />
        <StatCard title="Pensiones Pendientes" value="---" icon="💰" color="yellow" />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton label="Gestión de Usuarios" href="/admin/usuarios" />
          <ActionButton label="Matrículas" href="/admin/matriculas" />
          <ActionButton label="Notas" href="/admin/notas" />
          <ActionButton label="Tesorería" href="/admin/tesoreria" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
        <div className="text-gray-500 text-center py-8">
          <p>Las estadísticas y actividad se mostrarán aquí una vez implementados los módulos correspondientes.</p>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
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
    <a
      href={href}
      className="flex items-center justify-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
    >
      {label}
    </a>
  );
}
