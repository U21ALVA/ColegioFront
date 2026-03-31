'use client';

interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'default';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

const variantClasses = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  default: 'bg-gray-100 text-gray-800',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

export function Badge({ variant, children, size = 'md' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </span>
  );
}

// Helper function to map status to badge variant
export function getStatusBadge(estado: string) {
  switch (estado) {
    case 'ACTIVO':
      return <Badge variant="success">Activo</Badge>;
    case 'INACTIVO':
      return <Badge variant="warning">Inactivo</Badge>;
    case 'PENDIENTE':
      return <Badge variant="info">Pendiente</Badge>;
    case 'ELIMINADO':
      return <Badge variant="error">Eliminado</Badge>;
    default:
      return <Badge variant="default">{estado}</Badge>;
  }
}
