'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Mail, Phone, Building, Briefcase, Calendar, 
  Target, BarChart3, Video, BookOpen, Clock, 
  TrendingUp, Award, AlertCircle, CheckCircle, Settings
} from 'lucide-react';

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
  customAttributes: {
    attribute1Value?: string;
    attribute2Value?: string;
    attribute3Value?: string;
  };
  status: string;
  videosAnalyzed: number;
  assignmentsCompleted: number;
  overallScore: number;
  lastActive: string;
  licenseStatus: string;
  licenseType?: string;
  companyName?: string;
  isActive: boolean;
  licenseId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const employeeId = params.id as string;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedInAsEmployee, setIsLoggedInAsEmployee] = useState(false);
  const [employeeUserData, setEmployeeUserData] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeProfile();
    }
  }, [employeeId]);

  useEffect(() => {
    setIsLoggedInAsEmployee(!!localStorage.getItem('employeeToken'));
    setEmployeeUserData(localStorage.getItem('employeeUserData'));
  }, []);

  const fetchEmployeeProfile = async () => {
    try {
      const response = await fetch(`/api/employees/${employeeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee profile');
      }
      
      const data = await response.json();
      if (data.success) {
        setEmployee(data.employee);
      } else {
        throw new Error(data.error || 'Failed to fetch employee profile');
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch employee profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      // This will be implemented to allow admin to login as employee
      console.log('Admin login as employee:', employee?.email);
      // TODO: Implement admin login as employee functionality
    } catch (error) {
      console.error('Error with admin login:', error);
    }
  };

  const handleLogoutFromEmployee = () => {
    // Remove employee session data
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeUserData');
    
    // Show message and redirect back to management
    alert('Logged out from employee session. Returning to management.');
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employee profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error || 'Employee not found'}</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-gray-600 mt-2">{employee.jobTitle} • {employee.department}</p>
              {employee.companyName && (
                <p className="text-sm text-gray-500 mt-1">{employee.companyName}</p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => window.history.back()}>
                Back to Management
              </Button>
              {isLoggedInAsEmployee ? (
                <Button onClick={handleLogoutFromEmployee} className="bg-red-600 hover:bg-red-700">
                  <User className="w-4 h-4 mr-2" />
                  Logout from Employee
                </Button>
              ) : (
                <Button onClick={handleAdminLogin} className="bg-blue-600 hover:bg-blue-700">
                  <User className="w-4 h-4 mr-2" />
                  Login as Employee
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Score</p>
                  <p className="text-2xl font-bold text-gray-900">{employee.overallScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Video className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Videos Analyzed</p>
                  <p className="text-2xl font-bold text-gray-900">{employee.videosAnalyzed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{employee.assignmentsCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Active</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(employee.lastActive).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">First Name</label>
                      <p className="text-gray-900">{employee.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Name</label>
                      <p className="text-gray-900">{employee.lastName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{employee.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{employee.phoneNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Employee ID</label>
                      <p className="text-gray-900">{employee.employeeId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Hire Date</label>
                      <p className="text-gray-900">{new Date(employee.hireDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Work Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Work Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Department</label>
                      <p className="text-gray-900">{employee.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Job Title</label>
                      <p className="text-gray-900">{employee.jobTitle}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Division</label>
                      <p className="text-gray-900">{employee.customAttributes.attribute1Value || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Function</label>
                      <p className="text-gray-900">{employee.customAttributes.attribute2Value || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Role Level</label>
                      <p className="text-gray-900">{employee.customAttributes.attribute3Value || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* License Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>License Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">License Status</label>
                    <Badge className={`mt-1 ${getLicenseStatusColor(employee.licenseStatus)}`}>
                      {employee.licenseStatus}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">License Type</label>
                    <p className="text-gray-900 mt-1">{employee.licenseType || 'Standard'}</p>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Overall Score</label>
                    <span className="text-lg font-bold text-gray-900">{employee.overallScore}%</span>
                  </div>
                  <Progress value={employee.overallScore} className="h-3" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Performance Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Video Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Videos Analyzed</span>
                        <span className="font-medium">{employee.videosAnalyzed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Score</span>
                        <span className="font-medium">{Math.round(employee.overallScore * 0.8)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Learning Progress</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Assignments Completed</span>
                        <span className="font-medium">{employee.assignmentsCompleted}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="font-medium">{Math.round((employee.assignmentsCompleted / 20) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Learning Assignments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Assignment tracking will be implemented here</p>
                  <p className="text-sm">View employee's learning progress and completed assignments</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Account Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Account settings will be implemented here</p>
                  <p className="text-sm">Manage employee account preferences and permissions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
