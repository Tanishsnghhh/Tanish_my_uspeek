'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Plus, Search, Filter, Download, Eye, Edit, Trash2, 
  MoreHorizontal, UserPlus, Settings, BarChart3, Target, X, User, Tag, Video, BookOpen, Clock, Key, Copy, Upload
} from 'lucide-react';
import Papa from 'papaparse';
import { AddEmployee } from './add-employee';
import { CustomAttributeManager } from './custom-attribute-manager';
import { BulkAddEmployee } from './bulk-add-employee';
import { useAdminLoginAsEmployee } from '@/hooks/use-admin-login';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department: string;
  jobTitle: string;
  employeeId: string;
  hireDate: string;
  status: 'ACTIVE' | 'DEACTIVATED';
  videosAnalyzed: number;
  assignmentsCompleted: number;
  overallScore: number;
  lastActive: string;
  licenseStatus: 'ASSIGNED' | 'AVAILABLE' | 'EXPIRED' | 'UNASSIGNED';
  licenseType?: string;
  companyName?: string;
  isActive: boolean;
  licenseId?: string;
  createdAt: string;
  updatedAt: string;
  customAttributes?: { [key: string]: string };
  tempPassword?: string;
  passwordChanged?: boolean;
}

interface FilterOptions {
  department: string;
  status: string;
  scoreRange: string;
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    department: '',
    status: '',
    scoreRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showBulkAddEmployee, setShowBulkAddEmployee] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [fullProfileData, setFullProfileData] = useState<Employee | null>(null);
  const [showEditEmployee, setShowEditEmployee] = useState(false);
  const [showCustomAttributes, setShowCustomAttributes] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Employee>>({});
  const [customAttributeDefinitions, setCustomAttributeDefinitions] = useState<any[]>([]);
  const [availableLicenses, setAvailableLicenses] = useState<any[]>([]);
  const [showLicenseAssignment, setShowLicenseAssignment] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showBulkEditAttributes, setShowBulkEditAttributes] = useState(false);
  const [bulkEditAttributes, setBulkEditAttributes] = useState<{ [key: string]: string }>({});
  const [showImportAttributes, setShowImportAttributes] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showBulkAssignAttributes, setShowBulkAssignAttributes] = useState(false);
  const [bulkAssignAttributes, setBulkAssignAttributes] = useState<{ [key: string]: string }>({});
  const [bulkAssignFilters, setBulkAssignFilters] = useState({
    department: '',
    status: '',
    scoreRange: ''
  });
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Start with 50 employees per page
  const [totalEmployees, setTotalEmployees] = useState(0);
  
  const { loginAsEmployee, isLoading: isLoginLoading } = useAdminLoginAsEmployee();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Refetch when user (and thus corporate account) becomes available
    fetchEmployees(currentPage, pageSize);
    fetchCustomAttributeDefinitions();
    fetchAvailableLicenses();
  }, [user, currentPage, pageSize]);

  useEffect(() => {
    applyFilters();
  }, [employees, searchTerm, filters]);

  const fetchEmployees = async (page: number = currentPage, size: number = pageSize) => {
    try {
      setIsLoading(true);
      // Fetch employees with pagination
      const apiUrl = `/api/employees?page=${page}&limit=${size}&method=all`;

      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();

      if (!data.success) throw new Error(data.error || 'Failed to fetch employees');

      const rawEmployees = Array.isArray(data.data) ? data.data : [];
      setTotalEmployees(data.pagination?.total || rawEmployees.length); // Set total count from API pagination
      
      if (rawEmployees.length === 0) {
        setEmployees([]);
        setIsLoading(false);
        return;
      }

      const transformed: Employee[] = rawEmployees.map((emp: any) => {
        const lastActiveRaw = emp.lastActive || emp.lastLoginAt || emp.created_at;
        const lastActiveDate = lastActiveRaw ? new Date(lastActiveRaw) : new Date();
        return {
          id: emp.id,
          firstName: emp.firstName || emp.first_name || 'Unknown',
          lastName: emp.lastName || emp.last_name || 'Unknown',
          email: emp.email || emp.userInfo?.userEmail || 'no-email@example.com',
          department: emp.department || 'Unknown',
          jobTitle: emp.jobTitle || emp.job_title || 'Unknown',
          status: emp.status === true || emp.status === 'ACTIVE' ? 'ACTIVE' : 'DEACTIVATED',
          videosAnalyzed: emp.videosAnalyzed || 0,
          assignmentsCompleted: emp.assignmentsCompleted || 0,
          overallScore: emp.overallScore || 0,
          lastActive: isNaN(lastActiveDate.getTime()) ? new Date() : lastActiveDate,
          licenseStatus: emp.licenseStatus || (emp.licenseId ? 'ASSIGNED' : 'UNASSIGNED'),
          licenseType: emp.license?.license_type || null,
          customAttributes: emp.customAttributes || {},
          tempPassword: emp.tempPassword,
          passwordChanged: emp.passwordChanged
        };
      });

      const withAttributes = await Promise.all(
        // Process employees in batches to avoid overwhelming the API
        (() => {
          const batchSize = 50; // Process 50 employees at a time
          const batches = [];
          
          for (let i = 0; i < transformed.length; i += batchSize) {
            const batch = transformed.slice(i, i + batchSize);
            batches.push(batch);
          }
          
          return batches.map(async (batch) => {
            try {
              // Fetch attributes for all employees in this batch
              const employeeIds = batch.map(emp => emp.id).join(',');
              const attrRes = await fetch(`/api/employee-attribute-values?employeeIds=${employeeIds}`);
              
              if (attrRes.ok) {
                const attrData = await attrRes.json();
                if (attrData.success) {
                  const employeesData = Array.isArray(attrData.employees) ? attrData.employees : [attrData.employees];
                  
                  // Create a map of employee_id to attributes
                  const attributesMap: { [key: string]: any[] } = {};
                  employeesData.forEach((empData: any) => {
                    attributesMap[empData.employee_id] = empData.attribute_values || [];
                  });
                  
                  // Apply attributes to employees in this batch
                  return batch.map(emp => {
                    const empAttributes = attributesMap[emp.id] || [];
                    if (empAttributes.length > 0) {
                      const customAttributes: { [k: string]: string } = {};
                      empAttributes.forEach((v: any) => {
                        customAttributes[`position_${v.attribute_position}`] = v.value;
                      });
                      emp.customAttributes = customAttributes;
                    }
                    return emp;
                  });
                }
              }
              
              // If batch fetch fails, return employees without attributes
              console.warn('Batch attribute fetch failed, returning employees without attributes');
              return batch;
              
            } catch (e) {
              console.error('Batch attribute fetch failed:', e);
              // Return employees without attributes if fetch fails
              return batch;
            }
          });
        })()
      );

      // Flatten the batched results
      const employeesWithAttributes: Employee[] = withAttributes.flat();

      setEmployees(employeesWithAttributes);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(emp => emp.department === filters.department);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(emp => emp.status === filters.status);
    }

    // Score range filter
    if (filters.scoreRange) {
      const [min, max] = filters.scoreRange.split('-').map(Number);
      filtered = filtered.filter(emp => emp.overallScore >= min && emp.overallScore <= max);
    }

    setFilteredEmployees(filtered);
  };

  const getUniqueValues = (field: keyof Employee) => {
    const values: string[] = [];
    employees.forEach(emp => {
      const value = emp[field as keyof Employee] as string;
      if (!values.includes(value)) {
        values.push(value);
      }
    });
    return values;
  };

  const exportEmployees = () => {
    const csvContent = [
      ['Name', 'Email', 'Department', 'Job Title', 'Status', 'Score', 'Videos', 'Assignments'],
      ...filteredEmployees.map(emp => [
        `${emp.firstName} ${emp.lastName}`,
        emp.email,
        emp.department,
        emp.jobTitle,
        emp.status,
        emp.overallScore.toString(),
        emp.videosAnalyzed.toString(),
        emp.assignmentsCompleted.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAdminLoginAsEmployee = async (employee: Employee) => {
    try {
      const result = await loginAsEmployee({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`
      });

      if (result.success) {
        // Show success message
        alert(`Successfully logged in as ${employee.firstName} ${employee.lastName}. Opening employee dashboard in new tab...`);
        
        // Generate a session ID for this admin login as employee
        const sessionId = `admin_emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create URL with session parameters (more secure than embedding full data)
        const employeeUrl = `/employee-dashboard?employeeId=${employee.id}&sessionId=${sessionId}&adminToken=${result.token}`;
        
        // Open employee dashboard in new tab
        const newTab = window.open(employeeUrl, '_blank');
        
        if (newTab) {
          setTimeout(() => {
            newTab.focus();
          }, 100);
        }
      } else {
        alert(result.error || 'Failed to login as employee');
      }
    } catch (error) {
      console.error('Error logging in as employee:', error);
      alert('Failed to login as employee. Please try again.');
    }
  };

  const handleOpenFullProfile = async (employee: Employee) => {
    try {
      // Fetch detailed employee profile data
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/employees/${employee.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFullProfileData(data.employee);
          setShowFullProfile(true);
        } else {
          alert('Failed to fetch employee profile data');
        }
      } else {
        alert('Failed to fetch employee profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to fetch employee profile data');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phoneNumber: employee.phoneNumber || '',
      department: employee.department,
      jobTitle: employee.jobTitle,
      status: employee.status,
      licenseStatus: employee.licenseStatus,
    });
    setShowEditEmployee(true);
  };

  const handleSaveEmployee = async () => {
    if (!editingEmployee) return;

    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('uspeak_token');
      
      const response = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('Employee updated successfully');
          setShowEditEmployee(false);
          setEditingEmployee(null);
          fetchEmployees(); // Refresh the employee list
        } else {
          alert('Failed to update employee: ' + data.error);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert('Failed to update employee: ' + (errorData.error || `HTTP ${response.status}`));
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DEACTIVATED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'AVAILABLE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'UNASSIGNED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchCustomAttributeDefinitions = async () => {
    if (!user?.corporateAccountId && !user?.id) return;
    
    try {
      let accountId = user.corporateAccountId || user.id;
      
      // Handle case where corporateAccountId might be a serialized object string
      if (typeof accountId === 'string' && accountId.length > 24) {
        // Try to extract ObjectId from serialized object string
        const objectIdMatch = accountId.match(/ObjectId\('([0-9a-fA-F]{24})'\)/);
        if (objectIdMatch && objectIdMatch[1]) {
          accountId = objectIdMatch[1];
        } else {
          // If corporateAccountId is corrupted, fall back to user.id
          accountId = user.id;
        }
      }
      
      // Clean the account ID (trim whitespace only)
      accountId = String(accountId).trim();
      
      // Validate ObjectId format before making request
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(accountId)) {
        throw new Error(`Invalid account ID format: "${accountId}" (${accountId.length} chars). Expected 24 hex characters.`);
      }
      
      const url = `/api/custom-attributes?accountId=${encodeURIComponent(accountId)}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomAttributeDefinitions(data.definitions || []);
        }
      }
    } catch (error) {
      console.error('Error fetching custom attribute definitions:', error);
    }
  };

  const fetchAvailableLicenses = async () => {
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/licenses?available=true', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableLicenses(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching available licenses:', error);
    }
  };

  const assignLicenseToEmployee = async (employeeId: string, licenseId: string) => {
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          employeeId,
          licenseId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'License Assigned',
            description: 'License has been successfully assigned to the employee.',
          });
          fetchEmployees(); // Refresh employee list
          fetchAvailableLicenses(); // Refresh available licenses
          setShowLicenseAssignment(false);
        } else {
          toast({
            title: 'Assignment Failed',
            description: data.error || 'Failed to assign license.',
            variant: 'destructive'
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Assignment Failed',
          description: errorData.error || 'Failed to assign license.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error assigning license:', error);
      toast({
        title: 'Assignment Failed',
        description: 'An error occurred while assigning the license.',
        variant: 'destructive'
      });
    }
  };

  const createAndAssignLicense = async (licenseType: string, employeeId: string) => {
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/licenses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          licenseType,
          employeeId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'License Created & Assigned',
            description: `${licenseType} license has been created and assigned to the employee.`,
          });
          fetchEmployees(); // Refresh employee list
          fetchAvailableLicenses(); // Refresh available licenses
          setShowLicenseAssignment(false);
        } else {
          toast({
            title: 'Creation Failed',
            description: data.error || 'Failed to create and assign license.',
            variant: 'destructive'
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Creation Failed',
          description: errorData.error || 'Failed to create and assign license.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating and assigning license:', error);
      toast({
        title: 'Creation Failed',
        description: 'An error occurred while creating and assigning the license.',
        variant: 'destructive'
      });
    }
  };

  const unassignLicenseFromEmployee = async (employeeId: string) => {
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/licenses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          employeeId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'License Unassigned',
            description: 'License has been successfully unassigned from the employee.',
          });
          fetchEmployees(); // Refresh employee list
          fetchAvailableLicenses(); // Refresh available licenses
        } else {
          toast({
            title: 'Unassignment Failed',
            description: data.error || 'Failed to unassign license.',
            variant: 'destructive'
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Unassignment Failed',
          description: errorData.error || 'Failed to unassign license.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error unassigning license:', error);
      toast({
        title: 'Unassignment Failed',
        description: 'An error occurred while unassigning the license.',
        variant: 'destructive'
      });
    }
  };

  const handleImportAttributes = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      Papa.parse(importFile as any, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: Papa.ParseResult<any>) => {
          // Handle parsing errors if any
          if (results.errors && results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
            toast({
              title: 'Import Failed',
              description: 'Failed to parse CSV file. Check the file format.',
              variant: 'destructive'
            });
            setIsImporting(false);
            return;
          }

          const data = results.data as any[];
          const updates: { employeeId: string; attributes: { [key: string]: string } }[] = [];
          const errors: string[] = [];

          for (const row of data) {
            const employeeId = row.EmployeeID || row.employeeId || row.id;
            if (!employeeId) {
              errors.push(`Row ${data.indexOf(row) + 1}: Missing EmployeeID`);
              continue;
            }

            const attributes: { [key: string]: string } = {};
            customAttributeDefinitions.forEach((def: any) => {
              const value = row[def.name] || row[`position_${def.position}`];
              if (value) {
                attributes[`position_${def.position}`] = value;
              }
            });

            if (Object.keys(attributes).length > 0) {
              updates.push({ employeeId, attributes });
            }
          }

          if (errors.length > 0) {
            toast({
              title: 'Import Errors',
              description: `Found ${errors.length} errors. Check console for details.`,
              variant: 'destructive'
            });
            console.error('Import errors:', errors);
          }

          if (updates.length > 0) {
            // Process in batches
            const batchSize = 50;
            for (let i = 0; i < updates.length; i += batchSize) {
              const batch = updates.slice(i, i + batchSize);
              try {
                const response = await fetch('/api/custom-attributes/bulk-update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    updates: batch,
                    accountId: user?.corporateAccountId || user?.id
                  })
                });

                if (!response.ok) {
                  throw new Error(`Batch ${Math.floor(i / batchSize) + 1} failed`);
                }
              } catch (error) {
                console.error('Batch update error:', error);
                toast({
                  title: 'Import Failed',
                  description: `Failed to update batch ${Math.floor(i / batchSize) + 1}`,
                  variant: 'destructive'
                });
              }
            }

            toast({
              title: 'Import Successful',
              description: `Updated ${updates.length} employees`,
            });
            fetchEmployees();
          }

          setShowImportAttributes(false);
          setImportFile(null);
          setIsImporting(false);
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred during import',
        variant: 'destructive'
      });
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['EmployeeID', ...customAttributeDefinitions.map((def: any) => def.name)];
    const csvContent = [headers.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-attributes-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkEditAttributes = async () => {
    if (selectedEmployees.length === 0 || Object.keys(bulkEditAttributes).length === 0) return;

    try {
      const updates = selectedEmployees.map(employeeId => ({
        employeeId,
        attributes: bulkEditAttributes
      }));

      const response = await fetch('/api/custom-attributes/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          updates,
          accountId: user?.corporateAccountId || user?.id
        })
      });

      if (response.ok) {
        toast({
          title: 'Bulk Update Successful',
          description: `Updated ${selectedEmployees.length} employees`,
        });
        setShowBulkEditAttributes(false);
        setSelectedEmployees([]);
        setBulkEditAttributes({});
        fetchEmployees();
      } else {
        toast({
          title: 'Bulk Update Failed',
          description: 'Failed to update custom attributes',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Bulk edit error:', error);
      toast({
        title: 'Bulk Update Failed',
        description: 'An error occurred during bulk update',
        variant: 'destructive'
      });
    }
  };

  const handleBulkAssignAttributes = async () => {
    // Check if any attribute values have been entered
    const hasValues = Object.values(bulkAssignAttributes).some(value => value && value.trim() !== '');
    
    if (!hasValues) {
      toast({
        title: 'No Values Entered',
        description: 'Please enter at least one attribute value to assign',
        variant: 'destructive'
      });
      return;
    }

    setIsBulkAssigning(true);
    try {
      // Filter employees based on the selected filters
      const filteredEmployees = employees.filter(emp => {
        const deptMatch = !bulkAssignFilters.department || emp.department === bulkAssignFilters.department;
        const statusMatch = !bulkAssignFilters.status || emp.status === bulkAssignFilters.status;
        return deptMatch && statusMatch;
      });

      if (filteredEmployees.length === 0) {
        toast({
          title: 'No Employees Found',
          description: 'No employees match the selected filters',
          variant: 'destructive'
        });
        setIsBulkAssigning(false);
        return;
      }

      const updates = filteredEmployees.map(employee => ({
        employeeId: employee.id,
        attributes: bulkAssignAttributes
      }));

      // Process in batches for better performance
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        try {
          const response = await fetch('/api/custom-attributes/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              updates: batch,
              accountId: user?.corporateAccountId || user?.id
            })
          });

          if (response.ok) {
            successCount += batch.length;
          } else {
            errorCount += batch.length;
            console.error(`Batch ${Math.floor(i / batchSize) + 1} failed`);
          }
        } catch (error) {
          errorCount += batch.length;
          console.error('Batch update error:', error);
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Bulk Assign Successful',
          description: `Successfully updated ${successCount} employees`,
        });
        setShowBulkAssignAttributes(false);
        setBulkAssignAttributes({});
        setBulkAssignFilters({ department: '', status: '', scoreRange: '' });
        fetchEmployees();
      }

      if (errorCount > 0) {
        toast({
          title: 'Partial Success',
          description: `Updated ${successCount} employees, ${errorCount} failed`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Bulk assign error:', error);
      toast({
        title: 'Bulk Assign Failed',
        description: 'An error occurred during bulk assignment',
        variant: 'destructive'
      });
    } finally {
      setIsBulkAssigning(false);
    }
  };

  if (isLoading) {
    return <div>Loading employees...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Manage your team members and track their progress</p>
          {user && (
            <p className="text-sm text-gray-500 mt-1">
              Logged in as: {user.firstName} {user.lastName} ({user.role})
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={exportEmployees}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowImportAttributes(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Attributes
          </Button>
          <Button variant="outline" onClick={() => setShowBulkAssignAttributes(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Bulk Assign Attributes
          </Button>
          {selectedEmployees.length > 0 && (
            <Button variant="outline" onClick={() => {
              // Initialize bulkEditAttributes with common values from selected employees
              const selectedEmps = employees.filter(emp => selectedEmployees.includes(emp.id));
              const commonAttributes: { [key: string]: string } = {};
              
              // Check each position for common values
              for (let pos = 1; pos <= 4; pos++) {
                const values = selectedEmps
                  .map(emp => emp.customAttributes?.[`position_${pos}`])
                  .filter((val): val is string => val !== undefined && val !== null && val.trim() !== '');
                
                // If all selected employees have the same value for this position, use it
                if (values.length === selectedEmployees.length && values.length > 0 && values.every(val => val === values[0])) {
                  commonAttributes[`position_${pos}`] = values[0];
                }
              }
              
              setBulkEditAttributes(commonAttributes);
              setShowBulkEditAttributes(true);
            }}>
              <Tag className="w-4 h-4 mr-2" />
              Bulk Edit Attributes ({selectedEmployees.length})
            </Button>
          )}
          <Button onClick={() => setShowBulkAddEmployee(true)}>
            <Users className="w-4 h-4 mr-2" />
            Bulk Add
          </Button>
          <Button onClick={() => setShowAddEmployee(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search and Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-xl font-bold">{totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-xl font-bold">{employees.filter(e => e.status === 'ACTIVE').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-xl font-bold">
                  {employees.length > 0 ? Math.round(employees.reduce((sum, emp) => sum + emp.overallScore, 0) / employees.length) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Licenses Used</p>
                <p className="text-xl font-bold">{employees.filter(e => e.licenseStatus === 'ASSIGNED').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search employees by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Department</Label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">All Departments</option>
                  {getUniqueValues('department').map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium">Score Range</Label>
                <select
                  value={filters.scoreRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, scoreRange: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">All Scores</option>
                  <option value="0-25">0-25%</option>
                  <option value="26-50">26-50%</option>
                  <option value="51-75">51-75%</option>
                  <option value="76-100">76-100%</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employees ({filteredEmployees.length})</span>
            <div className="text-sm text-gray-500">
              Showing {filteredEmployees.length} of {employees.length} employees
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees(filteredEmployees.map(emp => emp.id));
                        } else {
                          setSelectedEmployees([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">License</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr 
                    key={employee.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => setSelectedEmployee(employee)}
                    title="Click anywhere on this row to view employee details"
                  >
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees(prev => [...prev, employee.id]);
                          } else {
                            setSelectedEmployees(prev => prev.filter(id => id !== employee.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                        <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                        <div className="text-xs text-gray-400">{employee.jobTitle}</div>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{employee.department}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{employee.overallScore}/100</span>
                          <Progress value={employee.overallScore} className="w-16 h-2" />
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.videosAnalyzed} videos • {employee.assignmentsCompleted} assignments
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getLicenseStatusColor(employee.licenseStatus)}>
                        {employee.licenseStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditEmployee(employee)}
                          disabled={!user || (user.role?.toUpperCase() !== 'ADMIN' && user.role?.toUpperCase() !== 'CORPORATE_ADMIN')}
                          title={!user || (user.role?.toUpperCase() !== 'ADMIN' && user.role?.toUpperCase() !== 'CORPORATE_ADMIN') 
                            ? 'Admin privileges required to edit employees' 
                            : 'Edit employee details'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {employees.length === 0 ? (
                <div>
                  <p className="text-lg font-medium mb-2">No employees found</p>
                  <p className="text-sm">The employee list is empty. This could mean:</p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• No employees have been added yet</li>
                    <li>• The database connection failed</li>
                    <li>• There's an issue with the API</li>
                  </ul>
                  <p className="text-sm mt-2">Check the browser console for more details.</p>
                </div>
              ) : (
                'No employees found matching your criteria.'
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalEmployees > pageSize && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalEmployees)}</span> of{' '}
              <span className="font-medium">{totalEmployees}</span> employees
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            {(() => {
              const totalPages = Math.ceil(totalEmployees / pageSize);
              const startPage = Math.max(1, currentPage - 2);
              const endPage = Math.min(totalPages, currentPage + 2);
              
              const pages = [];
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <Button
                    key={i}
                    variant={i === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i)}
                    className="w-8 h-8 p-0"
                  >
                    {i}
                  </Button>
                );
              }
              
              return pages;
            })()}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalEmployees / pageSize), prev + 1))}
              disabled={currentPage === Math.ceil(totalEmployees / pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && selectedEmployee.firstName && selectedEmployee.lastName && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex justify-between items-start">
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Employee Details - {selectedEmployee.firstName} {selectedEmployee.lastName}</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Actions */}
              <div className="flex space-x-3 mb-6">
                <Button 
                  onClick={() => selectedEmployee && handleOpenFullProfile(selectedEmployee)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  View Full Profile
                </Button>
                {/* 
                <Button 
                  onClick={() => handleAdminLoginAsEmployee(selectedEmployee)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                      disabled={isLoginLoading || !user || (user.role?.toUpperCase() !== 'ADMIN' && user.role?.toUpperCase() !== 'CORPORATE_ADMIN' && user.role?.toUpperCase() !== 'CORPORATE_USER')}
                >
                  {isLoginLoading ? (
                    <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  Login as Employee
                </Button>
                */}
                <Button 
                  onClick={() => setShowCustomAttributes(true)}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Custom Attributes
                </Button>
              </div>

              {/* Personal & Work Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Personal Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Full Name:</span>
                      <span className="text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Email:</span>
                      <span className="text-gray-900">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Employee ID:</span>
                      <span className="text-gray-900">EMP-{selectedEmployee.id.slice(-6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <Badge className={getStatusColor(selectedEmployee.status)}>
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Work Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Department:</span>
                      <span className="text-gray-900">{selectedEmployee.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Job Title:</span>
                      <span className="text-gray-900">{selectedEmployee.jobTitle}</span>
                    </div>
                </div>
                </div>
                </div>

              {/* Custom Attributes Section */}
              {selectedEmployee.customAttributes && Object.keys(selectedEmployee.customAttributes).length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Custom Attributes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(selectedEmployee.customAttributes || {}).map(([key, value]) => {
                      const position = key.replace('position_', '');
                      const definition = customAttributeDefinitions.find((def: any) => def.position === parseInt(position));
                      
                      // Use proper names for each position as fallback
                      const getPositionName = (pos: string) => {
                        const posNum = parseInt(pos);
                        switch (posNum) {
                          case 1: return 'Region';
                          case 2: return 'Zone';
                          case 3: return 'Batch';
                          case 4: return 'Branch';
                          default: return `Position ${pos}`;
                        }
                      };
                      
                      const attributeName = definition ? definition.name : getPositionName(position);
                      return value ? (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-sm font-medium text-gray-700">{attributeName}</label>
                          <p className="text-gray-900 mt-1">{value}</p>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{selectedEmployee.overallScore}%</div>
                    <div className="text-sm text-gray-600 mb-2">Overall Score</div>
                    <Progress value={selectedEmployee.overallScore} className="h-2" />
                </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">{selectedEmployee.videosAnalyzed}</div>
                    <div className="text-sm text-gray-600">Videos Analyzed</div>
                </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">{selectedEmployee.assignmentsCompleted}</div>
                    <div className="text-sm text-gray-600">Assignments Completed</div>
                </div>
                </div>
              </div>
              
              {/* License Information */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">License Information</h4>
                  {selectedEmployee.licenseStatus === 'UNASSIGNED' && (
                    <Button
                      onClick={() => setShowLicenseAssignment(true)}
                      variant="outline"
                      size="sm"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Assign License
                    </Button>
                  )}
                  {selectedEmployee.licenseStatus === 'ASSIGNED' && (
                    <Button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to unassign this license?')) {
                          unassignLicenseFromEmployee(selectedEmployee.id);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Unassign License
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">License Status</label>
                    <Badge className={`mt-1 ${getLicenseStatusColor(selectedEmployee.licenseStatus)}`}>
                      {selectedEmployee.licenseStatus}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">License Type</label>
                    <p className="text-gray-900 mt-1">{selectedEmployee.licenseType || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Features</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">Video Analysis</Badge>
                      <Badge variant="outline" className="text-xs">Learning Lessons</Badge>
                      <Badge variant="outline" className="text-xs">Progress Tracking</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Temporary Password Section */}
              {selectedEmployee.tempPassword && !selectedEmployee.passwordChanged && (
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Temporary Password</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Key className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Temporary Password</span>
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">
                          This employee has not changed their temporary password yet. Please share this password with them securely.
                        </p>
                        <div className="bg-white border border-yellow-300 rounded px-3 py-2 font-mono text-sm">
                          {selectedEmployee.tempPassword}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (selectedEmployee.tempPassword) {
                              navigator.clipboard.writeText(selectedEmployee.tempPassword);
                              toast({
                                title: 'Copied!',
                                description: 'Temporary password copied to clipboard',
                              });
                            }
                          }}
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Add Employee Modal */}
      {showBulkAddEmployee && (
        <BulkAddEmployee
          onClose={() => setShowBulkAddEmployee(false)}
          onSuccess={() => {
            setShowBulkAddEmployee(false);
            fetchEmployees(); // Refresh the employee list
          }}
        />
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployee
          onClose={() => setShowAddEmployee(false)}
          onSuccess={() => {
            setShowAddEmployee(false);
            fetchEmployees(); // Refresh the employee list
          }}
        />
      )}

      {/* Custom Attribute Manager Modal */}
      {showCustomAttributes && selectedEmployee && (
        <CustomAttributeManager
          employee={selectedEmployee}
          onClose={() => setShowCustomAttributes(false)}
          onUpdate={() => {
            setShowCustomAttributes(false);
            fetchEmployees(); // Refresh the employee list
          }}
        />
      )}

      {/* Full Profile Modal */}
      {showFullProfile && fullProfileData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto bg-white rounded-lg">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {fullProfileData.firstName} {fullProfileData.lastName}
                  </h2>
                  <p className="text-gray-600">{fullProfileData.jobTitle} • {fullProfileData.department}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowFullProfile(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Overall Score</p>
                        <p className="text-xl font-bold">{fullProfileData.overallScore}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Video className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Videos Analyzed</p>
                        <p className="text-xl font-bold">{fullProfileData.videosAnalyzed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Assignments</p>
                        <p className="text-xl font-bold">{fullProfileData.assignmentsCompleted}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Last Active</p>
                        <p className="text-sm font-medium">
                          {new Date(fullProfileData.lastActive).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Personal & Work Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Personal Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Full Name:</span>
                      <span className="text-gray-900">{fullProfileData.firstName} {fullProfileData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Email:</span>
                      <span className="text-gray-900">{fullProfileData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Phone:</span>
                      <span className="text-gray-900">{fullProfileData.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Employee ID:</span>
                      <span className="text-gray-900">{fullProfileData.employeeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Hire Date:</span>
                      <span className="text-gray-900">{new Date(fullProfileData.hireDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">Work Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Department:</span>
                      <span className="text-gray-900">{fullProfileData.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Job Title:</span>
                      <span className="text-gray-900">{fullProfileData.jobTitle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <Badge className={getStatusColor(fullProfileData.status)}>
                        {fullProfileData.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* License Information */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">License Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">License Status</label>
                    <Badge className={`mt-1 ${getLicenseStatusColor(fullProfileData.licenseStatus)}`}>
                      {fullProfileData.licenseStatus}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">License Type</label>
                    <p className="text-gray-900 mt-1">{fullProfileData.licenseType || 'Standard'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Features</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">Video Analysis</Badge>
                      <Badge variant="outline" className="text-xs">Learning Lessons</Badge>
                      <Badge variant="outline" className="text-xs">Progress Tracking</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* License Assignment Modal */}
      {showLicenseAssignment && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex justify-between items-start">
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Assign License to {selectedEmployee.firstName} {selectedEmployee.lastName}</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowLicenseAssignment(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Available Licenses</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Select a license to assign to this employee. Only unassigned licenses are shown.
                    </p>
                  </div>
                </div>
              </div>

              {availableLicenses.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4 text-gray-500">
                    <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2">No Available Licenses</p>
                    <p className="text-sm mb-4">Create a new license to assign to this employee.</p>
                  </div>
                  
                  <h4 className="font-medium text-gray-900">Create New License</h4>
                  <div className="grid gap-4">
                    {[
                      { 
                        id: 'USPEAK_BASIC', 
                        type: 'USpeak Pro Basic', 
                        description: 'Core communication training',
                        features: ['Video Analysis', 'Learning Lessons']
                      },
                      { 
                        id: 'USPEAK_PRO', 
                        type: 'USpeak Pro Advanced', 
                        description: 'Advanced skills + leadership',
                        features: ['Video Analysis', 'Learning Lessons', 'Progress Tracking']
                      },
                      { 
                        id: 'USPEAK_ENTERPRISE', 
                        type: 'USpeak Pro Enterprise', 
                        description: 'Full platform access + coaching',
                        features: ['Video Analysis', 'Learning Lessons', 'Progress Tracking', 'Advanced Analytics']
                      }
                    ].map((licenseType) => (
                      <Card key={licenseType.id} className="p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Key className="w-5 h-5 text-blue-600" />
                              <div>
                                <h4 className="font-medium text-gray-900">{licenseType.type}</h4>
                                <p className="text-sm text-gray-600">{licenseType.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-blue-100 text-blue-800">New License</Badge>
                            <Button
                              onClick={() => createAndAssignLicense(licenseType.id, selectedEmployee.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Create & Assign
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-700">Features:</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {licenseType.features.map((feature: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Select a License</h4>
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {availableLicenses.map((license) => (
                      <Card key={license._id} className="p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <Key className="w-5 h-5 text-blue-600" />
                              <div>
                                <h4 className="font-medium text-gray-900">{license.license_type}</h4>
                                <p className="text-sm text-gray-600">License Key: {license.license_key}</p>
                                <p className="text-xs text-gray-500">
                                  Created: {new Date(license.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className="bg-green-100 text-green-800">Available</Badge>
                            <Button
                              onClick={() => assignLicenseToEmployee(selectedEmployee.id, license._id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Assign
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-700">Features:</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {license.features.map((feature: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowLicenseAssignment(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Attributes Modal */}
      {showImportAttributes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="flex justify-between items-start">
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Import Custom Attributes</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowImportAttributes(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">CSV Import Instructions</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Upload a CSV file with EmployeeID and custom attribute columns. Download the template for correct formatting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>

                <div>
                  <Label className="text-sm font-medium">Select CSV File</Label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowImportAttributes(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImportAttributes}
                  disabled={!importFile || isImporting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Assign Attributes Modal */}
      {showBulkAssignAttributes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="flex justify-between items-start">
              <CardTitle className="flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Bulk Assign Custom Attributes</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBulkAssignAttributes(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Tag className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Bulk Assign Instructions</h4>
                    <p className="text-sm text-purple-700 mt-1">
                      Set custom attribute values and apply them to employees based on filters. No individual selection required.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Set Attribute Values</h4>
                {/* If there are no account-specific custom attribute definitions, show up to 4 default slots so users can enter values. */}
                {customAttributeDefinitions && customAttributeDefinitions.length > 0 ? (
                  customAttributeDefinitions.map((def: any) => (
                    <div key={def.position}>
                      <Label className="text-sm font-medium">{def.name}</Label>
                      <Input
                        value={bulkAssignAttributes[`position_${def.position}`] || ''}
                        onChange={(e) => setBulkAssignAttributes(prev => ({
                          ...prev,
                          [`position_${def.position}`]: e.target.value
                        }))}
                        placeholder={`Enter ${def.name}`}
                        className="mt-1"
                      />
                    </div>
                  ))
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">No custom attribute definitions found for this account — enter values and they will be saved to attribute positions 1-4.</p>
                    {Array.from({ length: 4 }).map((_, idx) => {
                      const pos = idx + 1;
                      const label = (() => {
                        switch (pos) {
                          case 1: return 'Region';
                          case 2: return 'Zone';
                          case 3: return 'Batch';
                          case 4: return 'Branch';
                          default: return `Position ${pos}`;
                        }
                      })();
                      return (
                        <div key={pos}>
                          <Label className="text-sm font-medium">{label} (position_{pos})</Label>
                          <Input
                            value={bulkAssignAttributes[`position_${pos}`] || ''}
                            onChange={(e) => setBulkAssignAttributes(prev => ({
                              ...prev,
                              [`position_${pos}`]: e.target.value
                            }))}
                            placeholder={`Enter ${label}`}
                            className="mt-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Apply to Employees by Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <select
                      value={bulkAssignFilters.department}
                      onChange={(e) => setBulkAssignFilters(prev => ({ ...prev, department: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">All Departments</option>
                      {getUniqueValues('department').map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <select
                      value={bulkAssignFilters.status}
                      onChange={(e) => setBulkAssignFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="">All Statuses</option>
                      <option value="ACTIVE">Active</option>
                      <option value="DEACTIVATED">Deactivated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview affected employees */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Employees to be Updated</h4>
                {(() => {
                  const filtered = employees.filter(emp => {
                    const deptMatch = !bulkAssignFilters.department || emp.department === bulkAssignFilters.department;
                    const statusMatch = !bulkAssignFilters.status || emp.status === bulkAssignFilters.status;
                    return deptMatch && statusMatch;
                  });

                  if (filtered.length === 0) {
                    return <p className="text-sm text-gray-600">No employees match the selected filters.</p>;
                  }

                  // Show custom attributes being assigned
                  const attributesToAssign = Object.entries(bulkAssignAttributes)
                    .filter(([key, value]) => value && value.trim() !== '')
                    .map(([key, value]) => {
                      const position = parseInt(key.replace('position_', ''));
                      const definition = customAttributeDefinitions.find(def => def.position === position);
                      return {
                        name: definition ? definition.name : `Position ${position}`,
                        value: value
                      };
                    });

                  return (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <strong>{filtered.length} employees</strong> will be updated
                      </div>

                      {/* Show attributes being assigned */}
                      {attributesToAssign.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Attributes to assign:</p>
                          <div className="flex flex-wrap gap-2">
                            {attributesToAssign.map((attr, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {attr.name}: {attr.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show employee list */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Employees:</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {filtered.slice(0, 10).map((emp) => (
                            <div key={emp.id} className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                              {emp.firstName} {emp.lastName} • {emp.department} • {emp.status}
                            </div>
                          ))}
                          {filtered.length > 10 && (
                            <div className="text-sm text-gray-500 italic">
                              ... and {filtered.length - 10} more employees
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowBulkAssignAttributes(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkAssignAttributes}
                  disabled={isBulkAssigning}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isBulkAssigning ? 'Assigning...' : 'Assign to Filtered Employees'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Edit Attributes Modal */}
      {showBulkEditAttributes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="flex justify-between items-start">
              <CardTitle className="flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Bulk Edit Custom Attributes</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBulkEditAttributes(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Tag className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Bulk Edit Instructions</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Set custom attribute values for the selected employees. All selected employees will get the same attribute values.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Set Attribute Values</h4>
                {/* If there are no account-specific custom attribute definitions, show up to 4 default slots so users can enter values. */}
                {customAttributeDefinitions && customAttributeDefinitions.length > 0 ? (
                  customAttributeDefinitions.map((def: any) => {
                    // Get common values for this attribute across selected employees
                    const getCommonValue = () => {
                      if (selectedEmployees.length === 0) return '';
                      
                      const selectedEmps = employees.filter(emp => selectedEmployees.includes(emp.id));
                      const values = selectedEmps.map(emp => emp.customAttributes?.[`position_${def.position}`]).filter(val => val);
                      
                      // If all selected employees have the same value, return it
                      if (values.length === selectedEmployees.length && values.every(val => val === values[0])) {
                        return values[0];
                      }
                      return '';
                    };
                    
                    const commonValue = getCommonValue();
                    
                    return (
                      <div key={def.position}>
                        <Label className="text-sm font-medium">{def.name}</Label>
                        <Input
                          value={bulkEditAttributes[`position_${def.position}`] !== undefined ? bulkEditAttributes[`position_${def.position}`] : commonValue}
                          onChange={(e) => setBulkEditAttributes(prev => ({
                            ...prev,
                            [`position_${def.position}`]: e.target.value
                          }))}
                          placeholder={commonValue ? `Current: ${commonValue}` : `Enter ${def.name}`}
                          className="mt-1"
                        />
                        {commonValue && (
                          <p className="text-xs text-gray-500 mt-1">
                            All selected employees currently have this value
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">No custom attribute definitions found for this account — enter values and they will be saved to attribute positions 1-4.</p>
                    {Array.from({ length: 4 }).map((_, idx) => {
                      const pos = idx + 1;
                      const label = (() => {
                        switch (pos) {
                          case 1: return 'Region';
                          case 2: return 'Zone';
                          case 3: return 'Batch';
                          case 4: return 'Branch';
                          default: return `Position ${pos}`;
                        }
                      })();
                      
                      // Get common values for this position across selected employees
                      const getCommonValue = () => {
                        if (selectedEmployees.length === 0) return '';
                        
                        const selectedEmps = employees.filter(emp => selectedEmployees.includes(emp.id));
                        const values = selectedEmps.map(emp => emp.customAttributes?.[`position_${pos}`]).filter(val => val);
                        
                        // If all selected employees have the same value, return it
                        if (values.length === selectedEmployees.length && values.every(val => val === values[0])) {
                          return values[0];
                        }
                        return '';
                      };
                      
                      const commonValue = getCommonValue();
                      
                      return (
                        <div key={pos}>
                          <Label className="text-sm font-medium">{label} (position_{pos})</Label>
                          <Input
                            value={bulkEditAttributes[`position_${pos}`] !== undefined ? bulkEditAttributes[`position_${pos}`] : commonValue}
                            onChange={(e) => setBulkEditAttributes(prev => ({
                              ...prev,
                              [`position_${pos}`]: e.target.value
                            }))}
                            placeholder={commonValue ? `Current: ${commonValue}` : `Enter ${label}`}
                            className="mt-1"
                          />
                          {commonValue && (
                            <p className="text-xs text-gray-500 mt-1">
                              All selected employees currently have this value
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Preview selected employees */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Selected Employees</h4>
                {(() => {
                  if (selectedEmployees.length === 0) {
                    return <p className="text-sm text-gray-600">No employees selected.</p>;
                  }

                  // Show custom attributes being assigned
                  const attributesToAssign = Object.entries(bulkEditAttributes)
                    .filter(([key, value]) => value && value.trim() !== '')
                    .map(([key, value]) => {
                      const position = parseInt(key.replace('position_', ''));
                      const definition = customAttributeDefinitions.find(def => def.position === position);
                      return {
                        name: definition ? definition.name : `Position ${position}`,
                        value: value
                      };
                    });

                  return (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <strong>{selectedEmployees.length} employees</strong> will be updated
                      </div>

                      {/* Show attributes being assigned */}
                      {attributesToAssign.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Attributes to assign:</p>
                          <div className="flex flex-wrap gap-2">
                            {attributesToAssign.map((attr, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {attr.name}: {attr.value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show employee list */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Employees:</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {selectedEmployees.slice(0, 10).map((empId) => {
                            const emp = employees.find(e => e.id === empId);
                            return emp ? (
                              <div key={emp.id} className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                                {emp.firstName} {emp.lastName} • {emp.department} • {emp.status}
                              </div>
                            ) : null;
                          })}
                          {selectedEmployees.length > 10 && (
                            <div className="text-sm text-gray-500 italic">
                              ... and {selectedEmployees.length - 10} more employees
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowBulkEditAttributes(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkEditAttributes}
                  disabled={selectedEmployees.length === 0 || Object.keys(bulkEditAttributes).filter(key => bulkEditAttributes[key] && bulkEditAttributes[key].trim() !== '').length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Update Selected Employees
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
