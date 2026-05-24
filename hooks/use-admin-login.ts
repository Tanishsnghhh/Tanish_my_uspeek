import { useState } from 'react';

interface AdminLoginAsEmployeeParams {
  employeeId: string;
  employeeName: string;
}

interface AdminLoginAsEmployeeResult {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

export function useAdminLoginAsEmployee() {
  const [isLoading, setIsLoading] = useState(false);

  const loginAsEmployee = async ({ 
    employeeId, 
    employeeName 
  }: AdminLoginAsEmployeeParams): Promise<AdminLoginAsEmployeeResult> => {
    setIsLoading(true);
    
    try {
      // Get admin token and role from localStorage
      const adminToken = localStorage.getItem('uspeak_token');
      const adminRole = localStorage.getItem('uspeak_role');
      
      if (!adminToken) {
        return {
          success: false,
          error: 'Admin authentication required. Please login as admin first.'
        };
      }
      
      if (!adminRole) {
        return {
          success: false,
          error: 'Admin role not found. Please login as admin first.'
        };
      }
      
      // Convert role to uppercase for comparison (case-insensitive check)
      const normalizedRole = adminRole.toUpperCase();
      
      if (normalizedRole !== 'ADMIN' && normalizedRole !== 'CORPORATE_ADMIN' && normalizedRole !== 'CORPORATE_USER') {
        return {
          success: false,
          error: 'Admin or Corporate privileges required. Current role: ' + adminRole
        };
      }

      const response = await fetch('/api/auth/admin-login-as-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          adminToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        
        // Create a more helpful error message
        let errorMessage = errorData.error || `HTTP ${response.status}: Failed to login as employee`;
        
        if (errorData.details) {
          errorMessage += `\n\nDetails: ${errorData.details}`;
        }
        
        if (errorData.solution) {
          errorMessage += `\n\nSolution: ${errorData.solution}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.success) {
        // Store the employee token temporarily
        localStorage.setItem('employeeToken', data.token);
        localStorage.setItem('employeeUserData', JSON.stringify(data.user));
        
        return {
          success: true,
          token: data.token,
          user: data.user
        };
      } else {
        return {
          success: false,
          error: data.error || 'Unknown error occurred'
        };
      }
    } catch (error) {
      console.error('Error logging in as employee:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logoutFromEmployee = () => {
    // Remove employee tokens and data
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeUserData');
  };

  const getEmployeeData = () => {
    const employeeData = localStorage.getItem('employeeUserData');
    return employeeData ? JSON.parse(employeeData) : null;
  };

  const isLoggedInAsEmployee = () => {
    return !!localStorage.getItem('employeeToken');
  };

  return {
    loginAsEmployee,
    logoutFromEmployee,
    getEmployeeData,
    isLoggedInAsEmployee,
    isLoading
  };
}
