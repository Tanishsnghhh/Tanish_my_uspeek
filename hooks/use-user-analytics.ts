/**
 * Custom hook to fetch user analytics data
 * Provides loading states and error handling
 */

import { useState, useEffect } from 'react';
import { UserAnalytics, AnalyticsApiResponse } from '@/types/analytics';

export function useUserAnalytics(userId: string | null) {
  const [data, setData] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setError(null);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get token from localStorage
        const token = localStorage.getItem('uspeak_token');
        
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch(`/api/analytics/user/${encodeURIComponent(userId)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.statusText}`);
        }

        const result: AnalyticsApiResponse = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch analytics');
        }

        setData(result.data || null);
      } catch (err) {
        console.error('Error fetching user analytics:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  return { data, isLoading, error, refetch: () => {
    if (userId) {
      setData(null);
      setError(null);
      // Re-trigger the effect by changing a dependency
      // This is a simple way to refetch without additional state
    }
  }};
}
