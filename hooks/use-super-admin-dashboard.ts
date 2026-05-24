import { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  b2bAccounts: number;
  b2bUsers: number;
  directUsers: number;
  totalVideos: number;
  videoUploadTrends: Array<{
    month: string;
    count: number;
    formattedMonth: string;
  }>;
  scoreDistribution: Array<{
    score: string;
    count: number;
  }>;
  videoTimeline: Array<{
    date: string;
    count: number;
  }>;
}

interface UseSuperAdminDashboardReturn {
  data: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSuperAdminDashboard(): UseSuperAdminDashboardReturn {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching dashboard data...');

      const response = await fetch('/api/super-admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch dashboard data`);
      }

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}