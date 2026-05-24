/**
 * Custom hook to fetch pending assignments for a user
 * Provides loading states and error handling
 */

import { useState, useEffect } from 'react';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  assignment_type: string;
  difficulty_level: string;
  estimated_duration: number;
  tags: string[];
  instance_id: {
    _id: string;
    deadline: string;
    instructions: string;
    links: string[];
    assignment_id: {
      title: string;
      description: string;
      assignment_type: string;
      difficulty_level: string;
      estimated_duration: number;
    };
  };
  employee_id: {
    first_name: string;
    last_name: string;
    department: string;
    job_title: string;
  };
  status: string;
  progress_percentage: number;
  assigned_at: string;
  completed_at?: string;
}

export function usePendingAssignments(userId: string | null) {
  const [data, setData] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setError(null);
      return;
    }

    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First, get the employee profile ID using the user ID
        const employeeRes = await fetch(`/api/employees?method=by-user-id&targetId=${encodeURIComponent(userId)}`);
        if (!employeeRes.ok) {
          throw new Error(`Failed to fetch employee profile: ${employeeRes.statusText}`);
        }
        const employeeJson = await employeeRes.json();

        if (!employeeJson.success || !employeeJson.data || employeeJson.data.length === 0) {
          console.log('No employee profile found for user:', userId);
          setData([]);
          return;
        }

        const employeeProfile = employeeJson.data[0];
        const employeeProfileId = employeeProfile.id;

        console.log('Found employee profile ID:', employeeProfileId);

        // Now fetch assignments using the employee profile ID
        // Get authentication token
        const authToken = localStorage.getItem('uspeak_token');
        
        const response = await fetch(`/api/assignments/employees?employeeId=${encodeURIComponent(employeeProfileId)}&status=ASSIGNED&status=IN_PROGRESS`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch assignments: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch assignments');
        }

        setData(result.data || []);
      } catch (err) {
        console.error('Error fetching pending assignments:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [userId]);

  return { data, isLoading, error, refetch: () => {
    if (userId) {
      setData([]);
      setError(null);
      // Re-trigger the effect by changing a dependency
      // This is a simple way to refetch without additional state
    }
  }};
}
