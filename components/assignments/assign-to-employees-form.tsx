'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface AssignmentMaster {
  _id: string;
  title: string;
  assignment_type: string;
}

interface AssignToEmployeesFormProps {
  onSuccess: () => void;
  accountId: string;
  userId: string;
}

export function AssignToEmployeesForm({ onSuccess, accountId, userId }: AssignToEmployeesFormProps) {
  const [formData, setFormData] = useState({
    assignment_id: '',
    assignment_scope: 'INDIVIDUAL',
    employee_ids: [] as string[],
    filters: {
      department: '',
      job_title: '',
      customAttributes: {},
      allowAll: false
    },
    deadline: '',
    instructions: '',
    links: [] as string[]
  });
  const [assignments, setAssignments] = useState<AssignmentMaster[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableJobTitles, setAvailableJobTitles] = useState<string[]>([]);
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    fetchAssignments();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`/api/employees?method=by-account&accountId=${accountId}&all=true`);
      if (response.ok) {
        const data = await response.json();
        const employeesData = Array.isArray(data.data) ? data.data : [];
        setEmployees(employeesData);
        
        const departments = Array.from(
          new Set(employeesData.map((emp: {department?: string}) => emp.department).filter(Boolean))
        ) as string[];
        
        const jobTitles = Array.from(
          new Set(employeesData.map((emp: {jobTitle?: string}) => emp.jobTitle).filter(Boolean))
        ) as string[];
        
        setAvailableDepartments(departments);
        setAvailableJobTitles(jobTitles);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      // Get authentication token
      const authToken = token || localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/assignments/master', {
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountId || !userId) {
      toast({
        title: 'Error',
        description: 'Account information is missing. Please try logging in again.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.assignment_id) {
      toast({
        title: 'Error',
        description: 'Please select an assignment to assign.',
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.assignment_scope === 'INDIVIDUAL' && formData.employee_ids.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one employee for individual assignment.',
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.assignment_scope === 'BULK') {
      const hasDepartment = !!formData.filters.department && formData.filters.department !== '_all';
      const hasJobTitle = !!formData.filters.job_title && formData.filters.job_title !== '_all';
      const hasAllowAll = formData.filters.allowAll;
      
      if (!hasDepartment && !hasJobTitle && !hasAllowAll) {
        toast({
          title: 'Error',
          description: 'Please specify a department, job title, or enable "Assign to all employees" for bulk assignment.',
          variant: 'destructive'
        });
        return;
      }
    }
    
    setLoading(true);

    try {
      const requestBody = {
        ...formData,
        account_id: accountId,
        assigned_by_user_id: userId
      };
      
      if (formData.assignment_scope === 'BULK') {
        if (requestBody.filters.department === '_all') {
          requestBody.filters.department = '';
        }
        if (requestBody.filters.job_title === '_all') {
          requestBody.filters.job_title = '';
        }
      }
      
      // Get authentication token
      const authToken = token || localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/assignments/instances', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Assignment assigned successfully'
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign assignment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign assignment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!accountId || !userId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Please log in to assign assignments.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="assignment_id">Assignment</Label>
        <Select
          value={formData.assignment_id}
          onValueChange={(value) => setFormData({ ...formData, assignment_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an assignment" />
          </SelectTrigger>
          <SelectContent>
            {assignments.map((assignment) => (
              <SelectItem key={assignment._id} value={assignment._id}>
                {assignment.title} ({assignment.assignment_type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="assignment_scope">Assignment Scope</Label>
        <Select
          value={formData.assignment_scope}
          onValueChange={(value) => setFormData({ ...formData, assignment_scope: value as 'INDIVIDUAL' | 'BULK' })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
            <SelectItem value="BULK">Bulk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.assignment_scope === 'INDIVIDUAL' ? (
        <div>
          <Label htmlFor="employee_ids">Select Employees</Label>
          {employees.length === 0 ? (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              No employees found. Please check if employees have been added.
            </div>
          ) : (
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !formData.employee_ids.includes(value)) {
                  setFormData({
                    ...formData,
                    employee_ids: [...formData.employee_ids, value]
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employees to assign" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} ({employee.department})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {formData.employee_ids.length > 0 && (
            <div className="mt-2 space-y-2">
              <Label>Selected Employees:</Label>
              {formData.employee_ids.map((employeeId) => {
                const employee = employees.find(emp => emp.id === employeeId);
                return (
                  <div key={employeeId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>
                      {employee ? `${employee.firstName} ${employee.lastName}` : employeeId}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({
                        ...formData,
                        employee_ids: formData.employee_ids.filter(id => id !== employeeId)
                      })}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Label>Bulk Assignment Filters</Label>
          
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="allowAll"
              checked={formData.filters.allowAll}
              onChange={(e) => setFormData({
                ...formData,
                filters: { ...formData.filters, allowAll: e.target.checked }
              })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="allowAll" className="text-sm font-medium">
              Assign to all employees
            </Label>
          </div>
          
          <div>
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.filters.department}
              onValueChange={(value) => setFormData({
                ...formData,
                filters: { ...formData.filters, department: value }
              })}
              disabled={formData.filters.allowAll}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Departments</SelectItem>
                {availableDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="job_title">Job Title</Label>
            <Select
              value={formData.filters.job_title}
              onValueChange={(value) => setFormData({
                ...formData,
                filters: { ...formData.filters, job_title: value }
              })}
              disabled={formData.filters.allowAll}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job title" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Job Titles</SelectItem>
                {availableJobTitles.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="deadline">Deadline (optional)</Label>
        <Input
          id="deadline"
          type="datetime-local"
          value={formData.deadline}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="instructions">Additional Instructions (optional)</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Any special instructions for employees..."
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Assigning...' : 'Assign Assignment'}
        </Button>
      </div>
    </form>
  );
}
