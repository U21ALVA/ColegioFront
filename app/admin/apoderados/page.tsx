'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApoderadosLegacyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/usuarios?tipo=PADRE');
  }, [router]);

  return <div className="p-6 text-sm text-gray-500">Redirigiendo a Usuarios...</div>;
}
