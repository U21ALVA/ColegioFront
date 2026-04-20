'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PadreNotasRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/padre/hijos');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600">Redirigiendo a notas de tus hijos...</div>
    </div>
  );
}
