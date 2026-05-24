'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeftIcon, UserPlus, Users, CheckCircle, Calendar, AlertCircle, Briefcase, Target, Clock, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Simple JWT decoder (base64 decode only - no signature verification)
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

// Validate and clean MongoDB ObjectId
function cleanObjectId(id: any): string | null {
  if (!id) return null;

  // If it's already a clean 24-character hex string, return it
  if (typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)) {
    return id;
  }

  // If it's an object with _id, extract the _id
  if (typeof id === 'object' && id._id) {
    const objectId = id._id.toString();
    if (/^[a-f0-9]{24}$/i.test(objectId)) {
      return objectId;
    }
  }

  // If it's a string that might contain an ObjectId, try to extract it
  if (typeof id === 'string') {
    const match = id.match(/[a-f0-9]{24}/i);
    if (match) {
      return match[0];
    }
  }

  return null;
}

interface AssignmentMaster {
  _id: string;
  title: string;
  description: string;
  assignment_type: string;
  difficulty_level: string;
  estimated_duration?: number;
  tags?: string[];
  is_active: boolean;
}

export default function AssignEmployeesPage() {
  const [assignments, setAssignments] = useState<AssignmentMaster[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableJobTitles, setAvailableJobTitles] = useState<string[]>([]);
  const [businessUnits, setBusinessUnits] = useState<any[]>([]);
  const { toast } = useToast();
  const { user, isAuthenticated, token } = useAuth();
  const router = useRouter();

  // Try to get account ID from multiple sources
  const getAccountId = () => {
    // First try from useAuth hook
    if (user?.corporateAccountId) {
      const cleanId = cleanObjectId(user.corporateAccountId);
      if (cleanId) {
        return cleanId;
      }
    }

    // Fallback: try to decode JWT token
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.corporateAccountId) {
        const cleanId = cleanObjectId(decoded.corporateAccountId);
        if (cleanId) {
          return cleanId;
        }
      }
    }

    return null;
  };

  const accountId = getAccountId();
  const userId = user?.id || null;

  useEffect(() => {
    if (isAuthenticated && accountId && userId) {
      fetchAssignments();
      fetchEmployees();
      fetchBusinessUnits();
    }
  }, [isAuthenticated, accountId, userId]);

  const fetchEmployees = async () => {
    try {
      // Fetch all employees regardless of account
      const response = await fetch(`/api/employees?method=by-account&accountId=${accountId}&all=true`);
      if (response.ok) {
        const data = await response.json();
        const employeesData = Array.isArray(data.data) ? data.data : [];
        setEmployees(employeesData);

        // Extract unique departments and job titles for the dropdowns
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
      const authToken = localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/assignments/master', {
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });
      if (response.ok) {
        const data = await response.json();
        const filteredAssignments = Array.isArray(data.data) 
          ? data.data.filter((assignment: AssignmentMaster) => assignment.is_active)
          : [];
        setAssignments(filteredAssignments);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
    }
  };

  const fetchBusinessUnits = async () => {
    try {
      const response = await fetch('/api/business-units');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.businessUnits)) {
          setBusinessUnits(data.businessUnits);
        } else {
          setBusinessUnits([]);
        }
      } else {
        setBusinessUnits([]);
      }
    } catch (error) {
      console.error('Error fetching business units:', error);
      setBusinessUnits([]);
    }
  };

  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Assignment has been successfully assigned to employees.',
      variant: 'default'
    });
    router.push('/assignments');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to assign assignments to employees.</p>
          <Button onClick={() => router.push('/auth')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-blue-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="outline"
                onClick={() => router.push('/assignments')}
                className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Assignments
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">Assign to Employees</h1>
                </div>
                <p className="text-gray-600 text-lg">Create and distribute assignments to your team members</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Total Employees:</span>
                  <span className="font-semibold text-blue-700">{employees.length}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Assignments Available:</span>
                  <span className="font-semibold text-blue-700">{assignments.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <AssignToEmployeesForm
          assignments={assignments}
          employees={employees}
          availableDepartments={availableDepartments}
          availableJobTitles={availableJobTitles}
          businessUnits={businessUnits}
          accountId={accountId}
          userId={userId}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}

// Assign to Employees Form Component
function AssignToEmployeesForm({
  assignments,
  employees,
  availableDepartments,
  availableJobTitles,
  businessUnits,
  accountId,
  userId,
  onSuccess
}: {
  assignments: AssignmentMaster[];
  employees: any[];
  availableDepartments: string[];
  availableJobTitles: string[];
  businessUnits: any[];
  accountId: string | null;
  userId: string | null;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    assignment_id: '',
    assignment_scope: 'INDIVIDUAL' as 'INDIVIDUAL' | 'BULK',
    employee_ids: [] as string[],
    filters: {
      department: '',
      job_title: '',
      business_unit: '',
      customAttributes: {},
      allowAll: false
    },
    deadline: '',
    instructions: '',
    links: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSED',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    internal_notes: '',
    // Additional fields for Uspeek
    notification_settings: {
      email_reminders: true,
      push_notifications: true,
      reminder_frequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'NONE'
    },
    tags: [] as string[],
    estimated_completion_time: '',
    max_attempts: '3',
    grading_type: 'AUTO' as 'AUTO' | 'MANUAL' | 'NONE',
    passing_score: '70'
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check that we have valid IDs before submitting
    if (!accountId || !userId) {
      toast({
        title: 'Error',
        description: 'Account information is missing. Please try logging in again.',
        variant: 'destructive'
      });
      return;
    }

    // Validate assignment selection
    if (!formData.assignment_id) {
      toast({
        title: 'Error',
        description: 'Please select an assignment to assign.',
        variant: 'destructive'
      });
      return;
    }

    // Validate that employees are selected for individual assignments
    if (formData.assignment_scope === 'INDIVIDUAL' && formData.employee_ids.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one employee for individual assignment.',
        variant: 'destructive'
      });
      return;
    }

    // Add validation for large selections
    if (formData.assignment_scope === 'INDIVIDUAL' && formData.employee_ids.length > 1000) {
      toast({
        title: 'Large Selection Warning',
        description: `You're assigning to ${formData.employee_ids.length} employees. This may take a moment to process.`,
        variant: 'default'
      });
    }

    // Validate bulk assignment criteria
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

      // Add performance optimization for large individual assignments
      if (formData.assignment_scope === 'INDIVIDUAL' && formData.employee_ids.length > 500) {
        toast({
          title: 'Processing Large Assignment',
          description: `Creating assignments for ${formData.employee_ids.length} employees. This may take a moment...`,
          variant: 'default'
        });
      }

      // Process special values for bulk assignments
      if (formData.assignment_scope === 'BULK') {
        // Convert _all to empty string for API
        if (requestBody.filters.department === '_all') {
          requestBody.filters.department = '';
        }
        if (requestBody.filters.job_title === '_all') {
          requestBody.filters.job_title = '';
        }
      }

      // Get authentication token from localStorage
      const authToken = localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/assignments/instances', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Enhanced success message with assignment details
        let successMessage = 'Assignment assigned successfully';
        if (responseData.data) {
          const { assignedEmployees, instance } = responseData.data;
          if (typeof assignedEmployees === 'number') {
            successMessage = `Assignment "${assignments.find(a => a._id === formData.assignment_id)?.title || 'Unknown'}" assigned to ${assignedEmployees} employee${assignedEmployees !== 1 ? 's' : ''} successfully!`;
          }
        }
        
        toast({
          title: 'Success',
          description: successMessage,
          variant: 'default'
        });
        
        onSuccess();
      } else {
        // Try to get more detailed error message
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

  return (
    <Card className="shadow-lg border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-blue-200">
        <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
          <Target className="w-6 h-6" />
          Assignment Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Selection */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Label htmlFor="assignment_id" className="text-blue-800 font-semibold flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4" />
              Select Assignment
            </Label>
            <Select
              value={formData.assignment_id}
              onValueChange={(value) => setFormData({ ...formData, assignment_id: value })}
            >
              <SelectTrigger className="bg-white border-blue-200 focus:border-blue-400">
                <SelectValue placeholder="Choose an assignment to distribute" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment._id} value={assignment._id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{assignment.title}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {assignment.assignment_type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.assignment_id && (
              <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                {(() => {
                  const selectedAssignment = assignments.find(a => a._id === formData.assignment_id);
                  return selectedAssignment ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700"><strong>Description:</strong> {selectedAssignment.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {selectedAssignment.difficulty_level}
                        </span>
                        {selectedAssignment.estimated_duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {selectedAssignment.estimated_duration} min
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Assignment Scope and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <Label htmlFor="assignment_scope" className="text-blue-800 font-semibold flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" />
                Assignment Scope
              </Label>
              <Select
                value={formData.assignment_scope}
                onValueChange={(value) => setFormData({ ...formData, assignment_scope: value as 'INDIVIDUAL' | 'BULK' })}
              >
                <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Individual Assignment
                    </div>
                  </SelectItem>
                  <SelectItem value="BULK">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Bulk Assignment
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <Label htmlFor="priority" className="text-blue-800 font-semibold flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4" />
                Priority Level
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' })}
              >
                <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <Badge variant="outline" className="text-green-600 border-green-300">Low</Badge>
                  </SelectItem>
                  <SelectItem value="NORMAL">
                    <Badge variant="outline" className="text-blue-600 border-blue-300">Normal</Badge>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <Badge variant="outline" className="text-orange-600 border-orange-300">High</Badge>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <Badge variant="outline" className="text-red-600 border-red-300">Urgent</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Label htmlFor="status" className="text-blue-800 font-semibold flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4" />
              Initial Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as 'ACTIVE' | 'PAUSED' })}
            >
              <SelectTrigger className="bg-white border-blue-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="PAUSED">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    Paused
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-blue-600 mt-2 bg-blue-100 p-2 rounded border border-blue-200">
              Set the initial status for this assignment instance
            </p>
          </div>

          {/* Employee Selection */}
          {formData.assignment_scope === 'INDIVIDUAL' ? (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <Label htmlFor="employee_ids" className="text-blue-800 font-semibold flex items-center gap-2 mb-3">
                <UserPlus className="w-4 h-4" />
                Select Individual Employees
              </Label>
              <div className="text-sm text-blue-600 mb-3 bg-blue-100 p-2 rounded border border-blue-200">
                Choose specific employees to assign this task to. You can select multiple employees.
              </div>
              {employees.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  No employees found. Please check if employees have been added to your organization.
                </div>
              ) : (
                <div className="space-y-4">
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
                    <SelectTrigger className="bg-white border-blue-200">
                      <SelectValue placeholder="Choose employees to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-blue-600" />
                            <span>{employee.firstName} {employee.lastName}</span>
                            <Badge variant="outline" className="text-xs">{employee.department}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Display selected employees */}
                  {formData.employee_ids.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-blue-800 font-semibold">
                          Selected Employees ({formData.employee_ids.length})
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, employee_ids: [] })}
                          className="text-red-600 hover:text-red-700 border-red-200"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear All
                        </Button>
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-blue-200 rounded-lg bg-white">
                        {formData.employee_ids.map((employeeId) => {
                          const employee = employees.find(emp => emp.id === employeeId);
                          return (
                            <div key={employeeId} className="flex items-center justify-between p-3 border-b border-blue-100 last:border-b-0 hover:bg-blue-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <UserPlus className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {employee ? `${employee.firstName} ${employee.lastName}` : employeeId}
                                  </span>
                                  {employee && (
                                    <div className="text-sm text-gray-500">
                                      {employee.department} • {employee.jobTitle || 'No title'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFormData({
                                  ...formData,
                                  employee_ids: formData.employee_ids.filter(id => id !== employeeId)
                                })}
                                className="text-red-600 hover:text-red-700 border-red-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <Label className="text-blue-800 font-semibold flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" />
                Bulk Employee Assignment
              </Label>
              
              <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Select filter criteria to assign to multiple employees at once.
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    id="allowAll"
                    checked={formData.filters.allowAll}
                    onChange={(e) => setFormData({
                      ...formData,
                      filters: { ...formData.filters, allowAll: e.target.checked }
                    })}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="allowAll" className="text-blue-800 font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assign to all employees in the organization
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department" className="text-blue-800 font-semibold flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4" />
                      Department Filter
                    </Label>
                    <Select
                      value={formData.filters.department}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, department: value }
                      })}
                      disabled={formData.filters.allowAll}
                    >
                      <SelectTrigger className={`bg-white border-blue-200 ${formData.filters.allowAll ? 'opacity-50' : ''}`}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">All Departments</SelectItem>
                        {availableDepartments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3 h-3" />
                              {dept}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="job_title" className="text-blue-800 font-semibold flex items-center gap-2 mb-2">
                      <UserPlus className="w-4 h-4" />
                      Job Title Filter
                    </Label>
                    <Select
                      value={formData.filters.job_title}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, job_title: value }
                      })}
                      disabled={formData.filters.allowAll}
                    >
                      <SelectTrigger className={`bg-white border-blue-200 ${formData.filters.allowAll ? 'opacity-50' : ''}`}>
                        <SelectValue placeholder="Select job title" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">All Job Titles</SelectItem>
                        {availableJobTitles.map((title) => (
                          <SelectItem key={title} value={title}>
                            <div className="flex items-center gap-2">
                              <UserPlus className="w-3 h-3" />
                              {title}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="business_unit" className="text-blue-800 font-semibold flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4" />
                    Business Unit Filter
                  </Label>
                  <Select
                    value={formData.filters.business_unit}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      filters: { ...formData.filters, business_unit: value }
                    })}
                    disabled={formData.filters.allowAll}
                  >
                    <SelectTrigger className={`bg-white border-blue-200 ${formData.filters.allowAll ? 'opacity-50' : ''}`}>
                      <SelectValue placeholder="Select business unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All Business Units</SelectItem>
                      {businessUnits.map((unit) => (
                        <SelectItem key={unit._id} value={unit._id}>
                          <div className="flex items-center gap-2">
                            <Target className="w-3 h-3" />
                            {unit.businessName} ({unit.businessCode})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-white border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Assignment Target Summary
                  </h4>
                  <div className="text-sm text-blue-700">
                    {formData.filters.allowAll ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">All employees will be assigned this task</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3 h-3" />
                          <span>Department: <strong>{formData.filters.department === '_all' ? "Any" : formData.filters.department || "Any"}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-3 h-3" />
                          <span>Job Title: <strong>{formData.filters.job_title === '_all' ? "Any" : formData.filters.job_title || "Any"}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Settings */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Label className="text-blue-800 font-semibold flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4" />
              Additional Assignment Settings
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="deadline" className="text-blue-700 font-medium mb-2 block">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-white border-blue-200"
                />
              </div>
              
              <div>
                <Label htmlFor="internal_notes" className="text-blue-700 font-medium mb-2 block">Internal Notes (optional)</Label>
                <Textarea
                  id="internal_notes"
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  placeholder="Internal notes for administrators (not visible to employees)"
                  className="bg-white border-blue-200 min-h-[80px]"
                />
                <p className="text-xs text-blue-600 mt-1">
                  These notes are for internal tracking and are not visible to employees
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Instructions textarea (left, larger) */}
              <div className="md:col-span-2">
                <Label htmlFor="instructions" className="text-blue-700 font-medium mb-2 block">Additional Instructions (optional)</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Any special instructions for employees..."
                  className="bg-white border-blue-200 min-h-[120px]"
                />
              </div>

              {/* Links editor (right, compact) */}
              <div className="md:col-span-1">
                <Label htmlFor="links" className="text-blue-700 font-medium mb-2 block text-sm">Links (optional)</Label>
                <Textarea
                  id="links"
                  placeholder="Paste links here — one per line (http/https)"
                  className="bg-white border-blue-200 min-h-[120px] text-sm"
                  onChange={(e) => {
                    const text = e.target.value || '';
                    // Extract lines, validate, dedupe
                    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                    const valid = lines.filter(l => /^https?:\/\//i.test(l));
                    const combined = Array.from(new Set([...(formData.links || []), ...valid]));
                    setFormData({ ...formData, links: combined });
                  }}
                />

                {/* Render parsed links with remove buttons */}
                {formData.links && formData.links.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.links.map((link, idx) => (
                      <div key={link + idx} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                        <a href={link} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 text-xs mr-2">
                          {link}
                        </a>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newLinks = (formData.links || []).filter((_, i) => i !== idx);
                            setFormData({ ...formData, links: newLinks });
                          }}
                          className="text-red-600 hover:text-red-700 border-red-200 h-6 px-2"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Advanced Assignment Settings */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Label className="text-blue-800 font-semibold flex items-center gap-2 mb-4">
              <Target className="w-4 h-4" />
              Advanced Assignment Settings
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="passing_score" className="text-blue-700 font-medium mb-2 block">Passing Score (%)</Label>
                <Input
                  id="passing_score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: e.target.value })}
                  placeholder="70"
                  className="bg-white border-blue-200"
                />
                <p className="text-xs text-blue-600 mt-1">
                  Minimum score required to pass (0-100%)
                </p>
              </div>

              <div>
                <Label htmlFor="estimated_completion_time" className="text-blue-700 font-medium mb-2 block">Estimated Completion Time (minutes)</Label>
                <Input
                  id="estimated_completion_time"
                  type="number"
                  min="1"
                  value={formData.estimated_completion_time}
                  onChange={(e) => setFormData({ ...formData, estimated_completion_time: e.target.value })}
                  placeholder="e.g., 60"
                  className="bg-white border-blue-200"
                />
                <p className="text-xs text-blue-600 mt-1">
                  Expected time for employees to complete this assignment
                </p>
              </div>

              <div>
                <Label htmlFor="max_attempts" className="text-blue-700 font-medium mb-2 block">Maximum Attempts</Label>
                <Select
                  value={formData.max_attempts}
                  onValueChange={(value) => setFormData({ ...formData, max_attempts: value })}
                >
                  <SelectTrigger className="bg-white border-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 attempt</SelectItem>
                    <SelectItem value="2">2 attempts</SelectItem>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                    <SelectItem value="10">10 attempts</SelectItem>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600 mt-1">
                  How many times employees can attempt this assignment
                </p>
              </div>

              <div>
                <Label htmlFor="grading_type" className="text-blue-700 font-medium mb-2 block">Grading Type</Label>
                <Select
                  value={formData.grading_type}
                  onValueChange={(value) => setFormData({ ...formData, grading_type: value as 'AUTO' | 'MANUAL' | 'NONE' })}
                >
                  <SelectTrigger className="bg-white border-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">Automatic</SelectItem>
                    <SelectItem value="MANUAL">Manual Review</SelectItem>
                    <SelectItem value="NONE">No Grading</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600 mt-1">
                  How assignment results will be graded
                </p>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
              <Label className="text-blue-800 font-semibold mb-3 block">Notification Settings</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="email_reminders"
                    checked={formData.notification_settings.email_reminders}
                    onChange={(e) => setFormData({
                      ...formData,
                      notification_settings: {
                        ...formData.notification_settings,
                        email_reminders: e.target.checked
                      }
                    })}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="email_reminders" className="text-sm text-blue-700">
                    Send email reminders
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="push_notifications"
                    checked={formData.notification_settings.push_notifications}
                    onChange={(e) => setFormData({
                      ...formData,
                      notification_settings: {
                        ...formData.notification_settings,
                        push_notifications: e.target.checked
                      }
                    })}
                    className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="push_notifications" className="text-sm text-blue-700">
                    Send push notifications
                  </Label>
                </div>

                <div>
                  <Label htmlFor="reminder_frequency" className="text-sm text-blue-700 mb-2 block">Reminder Frequency</Label>
                  <Select
                    value={formData.notification_settings.reminder_frequency}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      notification_settings: {
                        ...formData.notification_settings,
                        reminder_frequency: value as 'DAILY' | 'WEEKLY' | 'NONE'
                      }
                    })}
                  >
                    <SelectTrigger className="bg-white border-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="NONE">No reminders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
              <Label htmlFor="tags" className="text-blue-800 font-semibold mb-2 block">Tags (optional)</Label>
              <Input
                id="tags"
                type="text"
                placeholder="Enter tags separated by commas (e.g., training, compliance, quarterly)"
                className="bg-white border-blue-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const input = e.currentTarget;
                    const newTag = input.value.trim();
                    if (newTag && !formData.tags.includes(newTag)) {
                      setFormData({
                        ...formData,
                        tags: [...formData.tags, newTag]
                      });
                      input.value = '';
                    }
                  }
                }}
                onBlur={(e) => {
                  const newTag = e.target.value.trim();
                  if (newTag && !formData.tags.includes(newTag)) {
                    setFormData({
                      ...formData,
                      tags: [...formData.tags, newTag]
                    });
                    e.target.value = '';
                  }
                }}
              />
              <p className="text-xs text-blue-600 mt-1">
                Press Enter or comma to add tags for better organization and filtering
              </p>

              {/* Display tags */}
              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          tags: formData.tags.filter((_, i) => i !== index)
                        })}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-blue-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Assigning...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Assign Assignment
                </div>
              )}
            </Button>
          </div>

          {/* Assignment Summary */}
          {formData.assignment_id && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-100 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Assignment Summary
              </h3>
              <div className="text-sm text-blue-800 space-y-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p><strong>Assignment:</strong> {assignments.find(a => a._id === formData.assignment_id)?.title || 'Unknown'}</p>
                  <p><strong>Scope:</strong> {formData.assignment_scope}</p>
                  <p><strong>Status:</strong> {formData.status}</p>
                  <p><strong>Priority:</strong> {formData.priority}</p>
                  {formData.assignment_scope === 'INDIVIDUAL' && (
                    <p><strong>Employees:</strong> {formData.employee_ids.length} selected</p>
                  )}
                  {formData.assignment_scope === 'BULK' && (
                    <p><strong>Filter:</strong> {formData.filters.allowAll ? 'All employees' : `${formData.filters.department || 'Any'} department, ${formData.filters.job_title || 'Any'} job title, ${businessUnits.find(u => u._id === formData.filters.business_unit)?.businessName || 'Any'} business unit`}</p>
                  )}
                </div>
                <div className="space-y-1">
                  {formData.deadline && (
                    <p><strong>Deadline:</strong> {new Date(formData.deadline).toLocaleDateString()}</p>
                  )}
                  {formData.links && formData.links.length > 0 && (
                    <p><strong>Links:</strong> {formData.links.length} provided</p>
                  )}
                  {formData.passing_score && (
                    <p><strong>Passing Score:</strong> {formData.passing_score}%</p>
                  )}
                  {formData.estimated_completion_time && (
                    <p><strong>Estimated Time:</strong> {formData.estimated_completion_time} minutes</p>
                  )}
                  <p><strong>Max Attempts:</strong> {formData.max_attempts}</p>
                  <p><strong>Grading Type:</strong> {formData.grading_type}</p>
                  {formData.tags.length > 0 && (
                    <p><strong>Tags:</strong> {formData.tags.join(', ')}</p>
                  )}
                  <p><strong>Notifications:</strong> {formData.notification_settings.email_reminders ? 'Email' : 'No email'}, {formData.notification_settings.push_notifications ? 'Push' : 'No push'}, {formData.notification_settings.reminder_frequency.toLowerCase()} reminders</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
