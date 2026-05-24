'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  User, Camera, Save, TrendingUp, Video, BookOpen, Award, Target, BarChart3,
  Users, Upload, FileText, Settings, Building, Bell, Plus,
  Download, Filter, Eye, Edit, Trash2, CheckCircle, AlertCircle, X, Calendar, Star, Flame
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EmployeeManagement } from '@/components/profile/employee-management';
import { CSVUpload } from '@/components/profile/csv-upload';
import { BusinessManagement } from '@/components/profile/business-management';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  customAttributes: {
    attribute1?: string;
    attribute2?: string;
    attribute3?: string;
  };
  status: 'ACTIVE' | 'DEACTIVATED';
  videosAnalyzed: number;
  assignmentsCompleted: number;
  overallScore: number;
  lastActive: Date;
}

interface CorporateStats {
  totalEmployees: number;
  activeEmployees: number;
  totalVideos: number;
  averageScore: number;
  licensesAssigned: number;
  licensesAvailable: number;
}

// Component that uses searchParams
function ProfilePageContent() {
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [corporateStats, setCorporateStats] = useState<CorporateStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalVideos: 0,
    averageScore: 0,
    licensesAssigned: 0,
    licensesAvailable: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  // Check if we're viewing a specific employee profile
  const queryEmployeeId = searchParams.get('employeeId');
  const isViewingEmployee = !!queryEmployeeId;

  // Admin profile page should NEVER show employee dashboard UI
  // Remove all employee session detection from this page

  // Employee-specific state
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [employeeStats, setEmployeeStats] = useState<any>({
    totalVideosAnalyzed: 0,
    averageScore: 0,
    assignmentsCompleted: 0,
    streakDays: 0,
    lastActive: new Date(),
    overallRating: 0
  });

  // Admin profile page - no employee session detection needed

  // Initialize with default values for UI display
  useEffect(() => {
    if (isViewingEmployee && queryEmployeeId) {
      // Fetch specific employee data
      fetchSpecificEmployeeData(queryEmployeeId);
    }
    // Note: Removed employee dashboard logic - employees should use /employee-dashboard
  }, [user]);

  // Local controlled state for profile form
  const [firstNameInput, setFirstNameInput] = useState<string>(user?.firstName || '');
  const [lastNameInput, setLastNameInput] = useState<string>(user?.lastName || '');
  const [companyNameInput, setCompanyNameInput] = useState<string>(user?.companyName || '');
  const [bioInput, setBioInput] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Keep inputs in sync when the auth `user` object changes (e.g. after reload)
  useEffect(() => {
    if (user) {
      setFirstNameInput(user.firstName || '');
      setLastNameInput(user.lastName || '');
      setCompanyNameInput(user.companyName || '');
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Profile page - User authenticated:', user);
      console.log('Profile page - User role:', user.role);

      // This page is for admins only - employees are redirected at login
      if (user.role === 'ADMIN' || user.role === 'CORPORATE_ADMIN') {
        console.log('Profile page - Fetching admin data');
        fetchAdminData();

        // Show welcome toast for admin
        toast({
          title: '👋 Welcome Back!',
          description: `Hello ${user.firstName}! Your admin profile is ready.`,
          variant: 'success'
        });
      } else {
        // This shouldn't happen with proper login routing, but just in case
        console.warn('Non-admin user accessed profile page, this should not happen');
      }
    } else {
      console.log('Profile page - Not authenticated or no user:', { isAuthenticated, user });
    }
  }, [isAuthenticated, user, searchParams]);

  const fetchAdminData = async () => {
    try {
      console.log('fetchAdminData - Starting...');
      // TODO: Replace with actual API calls
      // const response = await fetch('/api/admin/stats');
      // const data = await response.json();
      // setEmployees(data.employees);
      // setCorporateStats(data.stats);

      // For now, just set loading to false
      console.log('fetchAdminData - Setting loading to false');
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setIsLoading(false);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      console.log('fetchEmployeeData - Starting...');
      // TODO: Replace with actual API calls
      // const response = await fetch('/api/employee/stats');
      // const data = await response.json();
      // setDailyReports(data.dailyReports);
      // setDailyReports(data.dailyReports);
      // setEmployeeStats(data.stats);

      // For now, just set loading to false
      console.log('fetchEmployeeData - Setting loading to false');
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      setIsLoading(false);
    }
  };

  const fetchSpecificEmployeeData = async (id: string) => {
    try {
      console.log('fetchSpecificEmployeeData - Starting for employee:', id);
      const response = await fetch(`/api/employees/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee data');
      }

      const data = await response.json();
      if (data.success) {
        // Set employee data for display
        setEmployeeStats({
          totalVideosAnalyzed: data.employee.videosAnalyzed || 0,
          averageScore: data.employee.overallScore || 0,
          assignmentsCompleted: data.employee.assignmentsCompleted || 0,
          streakDays: 5, // Default value
          lastActive: new Date(data.employee.lastActive || new Date()),
          overallRating: 4.2 // Default value
        });
      } else {
        throw new Error(data.error || 'Failed to fetch employee data');
      }
    } catch (error) {
      console.error('Error fetching specific employee data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Admin profile page - no employee data fetching needed

  if (!isAuthenticated) {
    return <div>Please log in to access your profile.</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section with Integrated Profile */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl overflow-hidden mb-8 shadow-2xl">
          {/* Enhanced Background Patterns */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 transform rotate-45 -translate-x-24 -translate-y-24 rounded-full"></div>
            <div className="absolute top-16 right-0 w-40 h-40 bg-white/5 transform rotate-45 translate-x-20 -translate-y-20 rounded-full"></div>
            <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 transform rotate-45 translate-y-16 rounded-full"></div>
            <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-white/3 transform rotate-12"></div>
          </div>

          <div className="relative p-8 md:p-10">
            {/* Integrated Title and Profile Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  {isViewingEmployee
                    ? `${employees.find(emp => emp.id === queryEmployeeId)?.firstName || 'Employee'} ${employees.find(emp => emp.id === queryEmployeeId)?.lastName || 'Name'}`
                    : `${firstNameInput || user?.firstName || 'Admin'} ${lastNameInput || user?.lastName || 'Name'}`
                  }
                </h1>


                <p className="text-blue-200 text-sm">
                  {isViewingEmployee
                    ? employees.find(emp => emp.id === queryEmployeeId)?.email || 'employee@company.com'
                    : user?.email || 'admin@company.com'
                  }
                </p>
              </div>

              {/* Profile Picture and Action Buttons */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-3 py-1.5"
                    onClick={() => {
                      toast({
                        title: '📸 Photo Upload',
                        description: 'Photo upload feature coming soon!',
                        variant: 'info'
                      });
                    }}
                  >
                    <Camera className="w-3 h-3 mr-1.5" />
                    Change Photo
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-3 py-1.5"
                    onClick={() => setShowProfileDetails(!showProfileDetails)}
                  >
                    {showProfileDetails ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>


              </div>
            </div>

            {/* Expandable Details */}
            {showProfileDetails && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded border border-white/20 h-16">
                    <span className="text-sm text-blue-100">Total Employees</span>
                    <span className="text-white font-bold">{corporateStats.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded border border-white/20 h-16">
                    <span className="text-sm text-blue-100">Active Licenses</span>
                    <span className="text-white font-bold">{corporateStats.licensesAssigned}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded border border-white/20 h-16">
                    <span className="text-sm text-blue-100">Available Licenses</span>
                    <span className="text-white font-bold">{corporateStats.licensesAvailable}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded border border-white/20 h-16">
                    <span className="text-sm text-blue-100">Notifications</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-xs px-2 py-1"
                      onClick={() => {
                        toast({
                          title: '🔔 Notifications',
                          description: 'Notification settings coming soon!',
                          variant: 'info'
                        });
                      }}
                    >
                      <Bell className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {/* Main Content Area - Full Width */}
          <div className="w-full">
            <Card className="bg-white shadow-xl border-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col space-y-1.5 p-4 md:p-6 border-b border-gray-100">
                  <TabsList className="h-9 md:h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground grid w-full grid-cols-4">
                    <TabsTrigger value="account" className="text-xs md:text-sm">Account</TabsTrigger>
                    <TabsTrigger value="employees" className="text-xs md:text-sm">Employees</TabsTrigger>
                    <TabsTrigger value="business" className="text-xs md:text-sm">Business</TabsTrigger>
                    <TabsTrigger value="csv-report" className="text-xs md:text-sm">CSV Report</TabsTrigger>
                  </TabsList>
                </div>
                <div className="p-4 md:p-8">
                  {/* Admin Tabs Only */}
                  <TabsContent value="account" className="space-y-6">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}>
                      {/* Personal Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</Label>
                          <Input
                            id="firstName"
                            value={firstNameInput}
                            onChange={(e) => {
                              setFirstNameInput(e.target.value);
                              if (e.target.value.trim() !== (user?.firstName || '')) {
                                toast({
                                  title: '✏️ First Name Changed',
                                  description: 'First name has been updated. Click "Update Profile" to save changes.',
                                  variant: 'info'
                                });
                              }
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</Label>
                          <Input
                            id="lastName"
                            value={lastNameInput}
                            onChange={(e) => {
                              setLastNameInput(e.target.value);
                              if (e.target.value.trim() !== (user?.lastName || '')) {
                                toast({
                                  title: '✏️ Last Name Changed',
                                  description: 'Last name has been updated. Click "Update Profile" to save changes.',
                                  variant: 'info'
                                });
                              }
                            }}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                          <Input id="email" type="email" defaultValue={user?.email || ''} className="mt-1" readOnly />
                        </div>
                        <div>
                          <Label htmlFor="role" className="text-sm font-medium text-gray-700">Role</Label>
                          <Input id="role" defaultValue="Administrator" className="mt-1" readOnly />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
                        <Textarea
                          id="bio"
                          rows={4}
                          defaultValue="Corporate administrator with full access to employee management, reporting, and company settings."
                          className="mt-1"
                          onChange={(e) => {
                            // Show a subtle toast when bio is being edited
                            if (e.target.value.length > 0) {
                              toast({
                                title: '✏️ Bio Updated',
                                description: 'Your bio has been updated. Click "Update Profile" to save changes.',
                                variant: 'info'
                              });
                            }
                          }}
                        />
                      </div>

                      {/* Company Settings Section */}
                      <div className="pt-6 border-t border-gray-100">
                        <h4 className="text-lg font-semibold mb-4 text-gray-800">Company Settings</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">Company Name</Label>
                            <Input
                              id="companyName"
                              value={companyNameInput}
                              onChange={(e) => {
                                setCompanyNameInput(e.target.value);
                                if (e.target.value.trim() !== (user?.companyName || '')) {
                                  toast({
                                    title: '🏢 Company Name Changed',
                                    description: 'Company name has been updated. Click "Update Profile" to save.',
                                    variant: 'info'
                                  });
                                }
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="subscriptionPlan" className="text-sm font-medium text-gray-700">Subscription Plan</Label>
                            <Input id="subscriptionPlan" defaultValue="Enterprise" className="mt-1" readOnly />
                          </div>
                        </div>

                        <div className="mb-6">
                          <Label htmlFor="maxEmployees" className="text-sm font-medium text-gray-700">Maximum Employees</Label>
                          <Input id="maxEmployees" defaultValue="50,000" className="mt-1" readOnly />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                        <Button
                          type="button"
                          className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Show immediate feedback toast
                            if (!updateLoading) {
                              toast({
                                title: '⏳ Updating Profile...',
                                description: 'Please wait while we save your changes.',
                                variant: 'loading'
                              });
                            }
                            // delegated to named handler below to keep JSX clean
                            await handleUpdateProfile();
                          }}
                          disabled={updateLoading}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateLoading ? 'Saving...' : 'Update Profile'}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="employees" className="space-y-6">
                    <EmployeeManagement />
                  </TabsContent>

                  <TabsContent value="business" className="space-y-6">
                    <BusinessManagement />
                  </TabsContent>

                  <TabsContent value="csv-report" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">CSV Report Section</h3>
                        <p className="text-sm text-gray-600">Bulk upload and manage employee data</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            // Check if token is available
                            const token = localStorage.getItem('uspeak_token');

                            if (!token) {
                              toast({
                                title: '❌ Authentication Error',
                                description: 'Please log in again to export data',
                                variant: 'destructive'
                              });
                              return;
                            }

                            toast({
                              title: '📊 Exporting Data',
                              description: 'Generating and downloading your report...',
                              variant: 'info'
                            });

                            // Call the export API with authorization
                            const response = await fetch('/api/employees/export', {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              }
                            });

                            if (response.ok) {
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;
                              a.click();
                              window.URL.revokeObjectURL(url);

                              toast({
                                title: '✅ Export Successful',
                                description: 'Employee data has been downloaded',
                                variant: 'default'
                              });
                            } else {
                              // Get error message from response
                              const errorData = await response.json().catch(() => ({}));
                              const errorMessage = errorData.error || `HTTP ${response.status}: Export failed`;
                              throw new Error(errorMessage);
                            }
                          } catch (error) {
                            console.error('Export error:', error);
                            toast({
                              title: '❌ Export Failed',
                              description: error instanceof Error ? error.message : 'Failed to export employee data',
                              variant: 'destructive'
                            });
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                    <CSVUpload />
                  </TabsContent>


                  <TabsContent value="daily-reports" className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Daily Work Reports</h3>
                      <Button onClick={() => {
                        toast({
                          title: '📝 New Report',
                          description: 'Creating new daily report...',
                          variant: 'info'
                        });
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Report
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {dailyReports.map((report) => (
                        <Card key={report.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                Daily Report - {report.date.toLocaleDateString()}
                              </CardTitle>
                              <div className="flex items-center space-x-2">
                                <Badge variant={report.submitted ? "default" : "secondary"}>
                                  {report.submitted ? "Submitted" : "Pending"}
                                </Badge>
                                <Badge variant="outline">
                                  {report.hoursWorked}h worked
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Tasks Completed</h4>
                                <ul className="space-y-1">
                                  {report.tasksCompleted.map((task: string, index: number) => (
                                    <li key={index} className="flex items-center space-x-2 text-sm">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      <span>{task}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Next Day Plan</h4>
                                <ul className="space-y-1">
                                  {report.nextDayPlan.map((plan: string, index: number) => (
                                    <li key={index} className="flex items-center space-x-2 text-sm">
                                      <Target className="w-4 h-4 text-blue-500" />
                                      <span>{plan}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {report.challenges.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Challenges Faced</h4>
                                <ul className="space-y-1">
                                  {report.challenges.map((challenge: string, index: number) => (
                                    <li key={index} className="flex items-center space-x-2 text-sm">
                                      <AlertCircle className="w-4 h-4 text-orange-500" />
                                      <span>{challenge}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Mood:</span>
                                <Badge variant="outline" className="capitalize">
                                  {report.mood}
                                </Badge>
                              </div>
                              {!report.submitted && (
                                <Button
                                  onClick={() => {
                                    setDailyReports(prev => prev.map(r =>
                                      r.id === report.id ? { ...r, submitted: true } : r
                                    ));
                                    toast({
                                      title: '📝 Daily Report Submitted',
                                      description: 'Your daily report has been submitted successfully!',
                                      variant: 'success'
                                    });
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Submit Report
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="progress" className="space-y-6">
                    <h3 className="text-lg font-semibold">Learning Progress</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Current Module</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Communication Skills</span>
                                <span className="text-sm font-bold text-green-600">75%</span>
                              </div>
                              <Progress value={75} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Public Speaking</span>
                                <span className="text-sm font-bold text-blue-600">60%</span>
                              </div>
                              <Progress value={60} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Achievements</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Award className="w-5 h-5 text-yellow-500" />
                              <span className="text-sm">First Video Analysis</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-5 h-5 text-green-500" />
                              <span className="text-sm">5 Day Streak</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Target className="w-5 h-5 text-blue-500" />
                              <span className="text-sm">Completed 3 Modules</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="assignments" className="space-y-6">
                    <h3 className="text-lg font-semibold">Current Assignments</h3>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Video Analysis Practice</CardTitle>
                          <CardDescription>Record and analyze your communication skills</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Due Date</span>
                              <Badge variant="outline">Tomorrow</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Status</span>
                              <Badge variant="secondary">In Progress</Badge>
                            </div>
                            <Button className="w-full">Start Assignment</Button>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Communication Workshop</CardTitle>
                          <CardDescription>Attend the weekly communication skills workshop</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Date</span>
                              <Badge variant="outline">Friday</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Status</span>
                              <Badge variant="default">Scheduled</Badge>
                            </div>
                            <Button variant="outline" className="w-full">View Details</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="feedback" className="space-y-6">
                    <h3 className="text-lg font-semibold">Feedback & Reviews</h3>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-2xl font-semibold flex items-center justify-between">
                            <span>Video Analysis Feedback</span>
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-medium">4.5/5</span>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-4">"Excellent improvement in eye contact and body language. Your confidence has grown significantly."</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Coach: Sarah Johnson</span>
                            <span>2 days ago</span>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-2xl font-semibold flex items-center justify-between">
                            <span>Communication Skills Assessment</span>
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-medium">4.0/5</span>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-4">"Great work on eliminating filler words. Continue practicing active listening skills."</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Coach: Mike Chen</span>
                            <span>1 week ago</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="learning" className="space-y-6">
                    <h3 className="text-lg font-semibold">Learning Resources</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Available Courses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium">Communication Basics</h4>
                                <p className="text-sm text-gray-600">Learn fundamental communication skills</p>
                              </div>
                              <Button size="sm">Start</Button>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium">Public Speaking</h4>
                                <p className="text-sm text-gray-600">Master public speaking techniques</p>
                              </div>
                              <Button size="sm">Start</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Recommended for You</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="p-3 border rounded-lg">
                              <h4 className="font-medium text-green-600">Advanced Communication</h4>
                              <p className="text-sm text-gray-600">Based on your progress</p>
                            </div>
                            <div className="p-3 border rounded-lg">
                              <h4 className="font-medium text-blue-600">Team Collaboration</h4>
                              <p className="text-sm text-gray-600">Popular with your department</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Admin Stats Cards - REMOVED */}

      </div>


    </DashboardLayout>
  );

  // Update profile handler (defined inside component)
  async function handleUpdateProfile() {
    try {
      setUpdateLoading(true);

      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to update your profile.',
          variant: 'destructive'
        });
        setUpdateLoading(false);
        return;
      }

      // Validate inputs
      if (!firstNameInput.trim() || !lastNameInput.trim()) {
        toast({
          title: 'Validation Error',
          description: 'First name and last name are required.',
          variant: 'destructive'
        });
        setUpdateLoading(false);
        return;
      }

      const payload: any = {
        firstName: firstNameInput.trim(),
        lastName: lastNameInput.trim()
      };

      // Include companyName if provided (backend will check admin role)
      if (companyNameInput && companyNameInput.trim().length > 0) {
        payload.companyName = companyNameInput.trim();
      }

      const resp = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();

      if (!resp.ok) {
        console.error('Profile update failed:', result);
        toast({
          title: 'Update Failed',
          description: result.error || 'Failed to update profile. Please try again.',
          variant: 'destructive'
        });
        setUpdateLoading(false);
        return;
      }

      if (result.user) {
        // Update localStorage with the new user data
        const existingUserData = JSON.parse(localStorage.getItem('uspeak_user') || '{}');
        const updatedUserData = {
          ...existingUserData,
          ...result.user
        };
        localStorage.setItem('uspeak_user', JSON.stringify(updatedUserData));

        // Also update role storage if present
        if (result.user.role) {
          localStorage.setItem('uspeak_role', result.user.role);
        }

        // Update the local state to immediately reflect changes
        // Force re-render by updating the key state variables
        setFirstNameInput(result.user.firstName || '');
        setLastNameInput(result.user.lastName || '');
        setCompanyNameInput(result.user.companyName || '');
      }

      // Show success toast
      toast({
        title: '✅ Profile Updated Successfully!',
        description: 'Your profile changes have been saved and are now visible.',
        variant: 'success'
      });

      setUpdateLoading(false);

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: '❌ Unexpected Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
      setUpdateLoading(false);
    }
  }
}

// Main component with Suspense wrapper
export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>}>
      <ProfilePageContent />
    </Suspense>
  );
}