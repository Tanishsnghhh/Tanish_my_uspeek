'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EmployeeRedirect() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  useEffect(() => {
    if (employeeId) {
      // Redirect to the main profile page with employee ID as a query parameter
      router.replace(`/profile?employeeId=${employeeId}`);
    }
  }, [employeeId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading employee profile...</p>
      </div>
    </div>
  );
}
