'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { CalendarIcon, PlusIcon, FilterIcon, BarChart3Icon, UsersIcon, ClockIcon, TrendingUpIcon, PieChartIcon } from 'lucide-react';
import AssignmentCharts from '@/components/assignments/assignment-charts';
import { WorkReportDialog } from '@/components/assignments/work-report-dialog';
import { InstanceWorkReportDialog } from '@/components/assignments/instance-work-report-dialog';

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

interface AssignmentInstance {
  _id: string;
  assignment_id: AssignmentMaster;
  assignment_scope: 'INDIVIDUAL' | 'BULK';
  status: string;
  deadline?: string;
  instructions?: string;
  created_at: string;
  assigned_by_user_id: { email: string };
}

interface AssignmentEmployee {
  _id: string;
  instance_id: AssignmentInstance;
  employee_id: { first_name: string; last_name: string; department: string; job_title: string };
  status: string;
  progress_percentage: number;
  assigned_at: string;
  completed_at?: string;
  score?: number;
}

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [assignments, setAssignments] = useState<AssignmentMaster[]>([]);
  const [instances, setInstances] = useState<AssignmentInstance[]>([]);
  const [employeeAssignments, setEmployeeAssignments] = useState<AssignmentEmployee[]>([]);
  const [overviewInstances, setOverviewInstances] = useState<AssignmentInstance[]>([]);
  const [overviewEmployeeAssignments, setOverviewEmployeeAssignments] = useState<AssignmentEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWorkReportDialog, setShowWorkReportDialog] = useState(false);
  const [showInstanceWorkReportDialog, setShowInstanceWorkReportDialog] = useState(false);
  const [selectedAssignmentEmployee, setSelectedAssignmentEmployee] = useState<AssignmentEmployee | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<AssignmentInstance | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, token } = useAuth();
  const router = useRouter();

  // Try to get account ID from multiple sources
  const getAccountId = () => {
    // First try from useAuth hook
    if (user?.corporateAccountId) {
      const cleanId = cleanObjectId(user.corporateAccountId);
      if (cleanId) {
        console.log('Got clean accountId from useAuth:', cleanId);
        return cleanId;
      }
    }
    
    // Fallback: try to decode JWT token
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded?.corporateAccountId) {
        console.log('Got corporateAccountId from JWT:', decoded.corporateAccountId);
        const cleanId = cleanObjectId(decoded.corporateAccountId);
        if (cleanId) {
          console.log('Got clean accountId from JWT:', cleanId);
          return cleanId;
        }
      }
    }
    
    return null;
  };

  // Get the actual account ID and user ID from the authenticated user
  const accountId = getAccountId();
  const userId = user?.id || null;

  // Debug logging to help troubleshoot
  useEffect(() => {
    if (user) {
      console.log('User data:', user);
      console.log('Account ID:', accountId);
      console.log('User ID:', userId);
      console.log('User corporateAccountId:', user.corporateAccountId);
      console.log('User id:', user.id);
    }
    
    if (token) {
      const decoded = decodeJWT(token);
      console.log('JWT decoded:', decoded);
      console.log('JWT corporateAccountId:', decoded?.corporateAccountId);
    }
    
    // Log the final extracted account ID
    console.log('Final extracted accountId:', accountId);
    console.log('Final extracted userId:', userId);
  }, [user, accountId, userId, token]);

  useEffect(() => {
    // Only fetch data if we have the required IDs and user is authenticated
    if (isAuthenticated && accountId && userId && !authLoading) {
      fetchData();
    } else if (isAuthenticated && !authLoading) {
      // Still try to fetch overview data even if account/user IDs are missing
      fetchOverviewData();
    }
  }, [isAuthenticated, accountId, userId, authLoading]);

  const fetchOverviewData = async () => {
    try {
      console.log('Fetching overview data for global statistics...');
      
      // Get authentication token
      const authToken = localStorage.getItem('uspeak_token');
      
      // Fetch overview data (all instances and employee assignments without filtering)
      const [overviewInstancesRes, overviewEmployeeAssignmentsRes, assignmentsRes] = await Promise.all([
        fetch(`/api/assignments/instances?all=true`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }), // Fetch all instances for overview section
        fetch(`/api/assignments/employees?all=true`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }), // Fetch all employee assignments for overview section
        fetch('/api/assignments/master', {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }) // Also fetch assignments for library count
      ]);

      console.log('Overview API responses:', {
        instances: overviewInstancesRes.status,
        employees: overviewEmployeeAssignmentsRes.status,
        assignments: assignmentsRes.status
      });

      if (overviewInstancesRes.ok) {
        const data = await overviewInstancesRes.json();
        console.log('Overview instances data:', data.data?.length, 'items');
        setOverviewInstances(data.data || []);
      }

      if (overviewEmployeeAssignmentsRes.ok) {
        const data = await overviewEmployeeAssignmentsRes.json();
        console.log('Overview employee assignments data:', data.data?.length, 'items');
        setOverviewEmployeeAssignments(data.data || []);
      }

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        console.log('Assignments data:', data.data?.length, 'items');
        setAssignments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
    }
  };

  const fetchData = async () => {
    // Don't proceed if we don't have the required IDs
    if (!accountId || !userId) {
      console.error('Missing accountId or userId for fetching assignments data');
      return;
    }

    try {
      setLoading(true);
      
      // Get authentication token
      const authToken = localStorage.getItem('uspeak_token');
      
      // Fetch assignments, instances (filtered by account), employee assignments (filtered by account),
      // and overview data (all instances and employee assignments without filtering)
      const [assignmentsRes, instancesRes, employeeAssignmentsRes, overviewInstancesRes, overviewEmployeeAssignmentsRes] = await Promise.all([
        fetch('/api/assignments/master', {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }),
        fetch(`/api/assignments/instances?accountId=${accountId}`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }), // Filter by current user's account
        fetch(`/api/assignments/employees?accountId=${accountId}`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }), // Filter by current user's account
        fetch(`/api/assignments/instances?all=true`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }), // Fetch all instances for overview section
        fetch(`/api/assignments/employees?all=true`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        }) // Fetch all employee assignments for overview section
      ]);

      console.log('Full data fetch API responses:', {
        assignments: assignmentsRes.status,
        instances: instancesRes.status,
        employees: employeeAssignmentsRes.status,
        overviewInstances: overviewInstancesRes.status,
        overviewEmployees: overviewEmployeeAssignmentsRes.status
      });

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        console.log('Assignments data:', data.data?.length, 'items');
        setAssignments(data.data || []);
      }

      if (instancesRes.ok) {
        const data = await instancesRes.json();
        console.log('Filtered instances data:', data.data?.length, 'items');
        setInstances(data.data || []);
      }

      if (employeeAssignmentsRes.ok) {
        const data = await employeeAssignmentsRes.json();
        console.log('Filtered employee assignments data:', data.data?.length, 'items');
        setEmployeeAssignments(data.data || []);
      }

      if (overviewInstancesRes.ok) {
        const data = await overviewInstancesRes.json();
        console.log('Overview instances data:', data.data?.length, 'items');
        setOverviewInstances(data.data || []);
      }

      if (overviewEmployeeAssignmentsRes.ok) {
        const data = await overviewEmployeeAssignmentsRes.json();
        console.log('Overview employee assignments data:', data.data?.length, 'items');
        setOverviewEmployeeAssignments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch assignments data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'LESSON': return '📚';
      case 'VIDEO_TASK': return '🎥';
      case 'QUIZ': return '❓';
      case 'PRESENTATION': return '🎤';
      case 'ROLE_PLAY': return '🎭';
      case 'ASSESSMENT': return '📊';
      default: return '📝';
    }
  };

  // Show loading state while auth is loading or while fetching data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access the assignments page.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show message if account ID is not available
  if (!accountId || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Account Information Missing</h1>
          <p className="text-gray-600">
            Unable to load account information. 
            {user && (
              <div className="mt-2 text-sm">
                <p>User ID: {user.id}</p>
                <p>Corporate Account ID: {user.corporateAccountId || 'Not available'}</p>
                <p>Role: {user.role}</p>
              </div>
            )}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            This usually happens when the user account is not properly linked to a corporate account.
          </p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto  space-y-6">
        {/* Header Section with Blue Gradient */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 flex items-center space-x-3">
                <BarChart3Icon className="w-8 h-8 text-blue-600" />
                <span>Assignments Management</span>
              </h1>
              <p className="text-blue-600 mt-2">Manage and track employee assignments with comprehensive analytics</p>
            </div>
            <div className="flex gap-3">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button 
                    disabled={!isAuthenticated || !accountId}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-blue-800">Create New Assignment</DialogTitle>
                    <DialogDescription className="text-blue-600">
                      Create a new assignment that can be assigned to employees.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateAssignmentForm onSuccess={() => {
                    setShowCreateDialog(false);
                    fetchData();
                  }} />
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                disabled={!isAuthenticated || !accountId || !userId} 
                onClick={() => router.push('/assignments/assign')}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                Assign to Employees
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-blue-100 border border-blue-200">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="assignments"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700"
            >
              Assignment Library
            </TabsTrigger>
            <TabsTrigger 
              value="instances"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700"
            >
              Active Assignments
            </TabsTrigger>
            <TabsTrigger 
              value="progress"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-blue-700"
            >
              Progress Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards with Blue Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-blue-700">Total Assignments</CardTitle>
                  <BarChart3Icon className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">{assignments.length}</div>
                  <p className="text-xs text-blue-600 mt-1">
                    In assignment library
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-green-700">Completed</CardTitle>
                  <TrendingUpIcon className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    {overviewEmployeeAssignments.filter(a => a.status === 'COMPLETED').length}
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {overviewEmployeeAssignments.length > 0 
                      ? Math.round((overviewEmployeeAssignments.filter(a => a.status === 'COMPLETED').length / overviewEmployeeAssignments.length) * 100)
                      : 0}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-yellow-700">Assigned</CardTitle>
                  <UsersIcon className="h-5 w-5 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-800">
                    {overviewEmployeeAssignments.filter(a => a.status === 'ASSIGNED').length}
                  </div>
                  <p className="text-xs text-yellow-600 mt-1">
                    Ready to start
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-blue-700">In Progress</CardTitle>
                  <PieChartIcon className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">
                    {overviewEmployeeAssignments.filter(a => a.status === 'IN_PROGRESS').length}
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Active assignments
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-red-700">Overdue</CardTitle>
                  <ClockIcon className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-800">
                    {overviewEmployeeAssignments.filter(a => a.status === 'OVERDUE').length}
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Past deadline
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Charts Section */}
            <AssignmentCharts 
              assignments={assignments}
              instances={overviewInstances}
              employeeAssignments={overviewEmployeeAssignments}
            />

            {/* Recent Assignments and Department Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-blue-800 flex items-center space-x-2">
                    <CalendarIcon className="w-6 h-6 text-blue-600" />
                    <span>Recent Assignments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overviewInstances.slice(0, 5).map((instance) => (
                      <div key={instance._id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getAssignmentTypeIcon(instance.assignment_id?.assignment_type || 'UNKNOWN')}</span>
                          <div>
                            <p className="font-medium text-blue-900">{instance.assignment_id?.title || 'Unknown Assignment'}</p>
                            <p className="text-sm text-blue-600">
                              {instance.assignment_scope} • {instance.status} • 
                              Assigned by {instance.assigned_by_user_id?.email || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-blue-300 text-blue-700">
                          {instance.assignment_id?.assignment_type || 'UNKNOWN'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-blue-800 flex items-center space-x-2">
                    <TrendingUpIcon className="w-6 h-6 text-blue-600" />
                    <span>Department Performance Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(new Set(overviewEmployeeAssignments.map(a => a.employee_id?.department).filter(Boolean))).slice(0, 5).map((dept) => {
                      const deptAssignments = overviewEmployeeAssignments.filter(a => a.employee_id?.department === dept);
                      const completed = deptAssignments.filter(a => a.status === 'COMPLETED').length;
                      const total = deptAssignments.length;
                      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                      
                      return (
                        <div key={dept} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                          <span className="font-medium text-blue-900">{dept}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-blue-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold text-blue-700 min-w-[3rem]">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-blue-800 flex items-center space-x-2">
                  <BarChart3Icon className="w-6 h-6 text-blue-600" />
                  <span>Assignment Library</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment._id} className="bg-white border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{getAssignmentTypeIcon(assignment.assignment_type)}</span>
                          <Badge 
                            variant={assignment.is_active ? "default" : "secondary"}
                            className={assignment.is_active ? "bg-green-600 text-white" : "bg-gray-400 text-white"}
                          >
                            {assignment.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg text-blue-800">{assignment.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-blue-600 mb-3">{assignment.description}</p>
                        <div className="flex items-center justify-between text-sm mb-3">
                          <Badge variant="outline" className="border-blue-300 text-blue-700">{assignment.assignment_type}</Badge>
                          <Badge variant="outline" className="border-blue-300 text-blue-700">{assignment.difficulty_level}</Badge>
                        </div>
                        {assignment.estimated_duration && (
                          <p className="text-sm text-blue-500 mb-3">
                            ⏱️ Estimated: {assignment.estimated_duration} minutes
                          </p>
                        )}
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <span className="text-sm text-blue-600">💡 Use "Assign to Employees" to assign this assignment</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="instances" className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-blue-800 flex items-center space-x-2">
                  <UsersIcon className="w-6 h-6 text-blue-600" />
                  <span>Active Assignment Instances</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instances.map((instance) => (
                    <Card key={instance._id} className="p-4 bg-white border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <span className="text-2xl">{getAssignmentTypeIcon(instance.assignment_id?.assignment_type || 'UNKNOWN')}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-800">{instance.assignment_id?.title || 'Unknown Assignment'}</h3>
                            <p className="text-sm text-blue-600">
                              📋 {instance.assignment_scope} • {instance.status} • 
                              👤 Assigned by {instance.assigned_by_user_id?.email || 'Unknown'}
                            </p>
                            {instance.deadline && (
                              <p className="text-sm text-blue-500 flex items-center space-x-1 mt-1">
                                <CalendarIcon className="w-4 h-4" />
                                <span>Deadline: {new Date(instance.deadline).toLocaleDateString()}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getStatusColor(instance.status)} text-white`}>
                            {instance.status}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                            onClick={() => {
                              setSelectedInstance(instance);
                              setShowInstanceWorkReportDialog(true);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-blue-800 flex items-center space-x-2">
                  <TrendingUpIcon className="w-6 h-6 text-blue-600" />
                  <span>Employee Progress Tracking</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employeeAssignments.map((assignment) => (
                    <Card key={assignment._id} className="p-4 bg-white border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Employee Avatar with Blue Theme */}
                          {(() => {
                            const firstName = assignment.employee_id?.first_name ?? '';
                            const lastName = assignment.employee_id?.last_name ?? '';
                            const initials = (firstName.charAt(0) || lastName.charAt(0) || '?').toUpperCase();
                            return (
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                                <span className="text-sm font-bold text-blue-700">{initials}</span>
                              </div>
                            );
                          })()}

                          <div>
                            <h3 className="font-semibold text-blue-800">
                              {`${assignment.employee_id?.first_name ?? 'Unknown'} ${assignment.employee_id?.last_name ?? ''}`.trim()}
                            </h3>
                            <p className="text-sm text-blue-600">
                              🏢 {assignment.employee_id?.department ?? '—'} • 💼 {assignment.employee_id?.job_title ?? '—'}
                            </p>
                            <p className="text-sm text-blue-500">
                              📋 {assignment.instance_id?.assignment_id?.title ?? ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-blue-800">{assignment.progress_percentage}%</p>
                            <div className="w-28 bg-blue-200 rounded-full h-3">
                              <div 
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                                style={{ width: `${assignment.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(assignment.status)} text-white`}>
                            {assignment.status}
                          </Badge>
                          {assignment.score && (
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              🏆 Score: {assignment.score}
                            </Badge>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                            onClick={() => {
                              setSelectedAssignmentEmployee(assignment);
                              setShowWorkReportDialog(true);
                            }}
                          >
                            Work Reports
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Instance Work Report Dialog */}
        {selectedInstance && (
          <InstanceWorkReportDialog
            isOpen={showInstanceWorkReportDialog}
            onOpenChange={setShowInstanceWorkReportDialog}
            instance={selectedInstance}
            accountId={accountId || ''}
            userId={userId || ''}
          />
        )}
        
        {/* Work Report Dialog */}
        {selectedAssignmentEmployee && (
          <WorkReportDialog
            isOpen={showWorkReportDialog}
            onOpenChange={setShowWorkReportDialog}
            assignmentEmployee={selectedAssignmentEmployee}
            accountId={accountId || ''}
          />
        )}
      </div>
  );
}

// Create Assignment Form Component
function CreateAssignmentForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignment_type: 'LESSON',
    difficulty_level: 'BEGINNER',
    estimated_duration: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get authentication token
      const authToken = localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/assignments/master', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          ...formData,
          estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : undefined,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Assignment created successfully'
        });
        onSuccess();
      } else {
        throw new Error('Failed to create assignment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assignment_type">Assignment Type</Label>
          <Select
            value={formData.assignment_type}
            onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LESSON">Lesson</SelectItem>
              <SelectItem value="VIDEO_TASK">Video Task</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="PRESENTATION">Presentation</SelectItem>
              <SelectItem value="ROLE_PLAY">Role Play</SelectItem>
              <SelectItem value="ASSESSMENT">Assessment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="difficulty_level">Difficulty Level</Label>
          <Select
            value={formData.difficulty_level}
            onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
        <Input
          id="estimated_duration"
          type="number"
          value={formData.estimated_duration}
          onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="communication, leadership, sales"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Assignment'}
        </Button>
      </div>
    </form>
  );
}


