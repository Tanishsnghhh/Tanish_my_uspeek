'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  User, Camera, Bell, Star, Settings, Shield, Key, Eye, EyeOff, Save, Mail, Phone, MapPin, Briefcase, Calendar, Crown, Users, CreditCard, Globe, Lock, Trash2, AlertTriangle, Building
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface EmployeeProfile {
  _id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  department: string;
  job_title: string;
  custom_attributes?: {
    employeeId?: string;
    hireDate?: string;
    isActive?: boolean;
    [key: string]: any;
  };
  employeeId?: string;
  hireDate?: string;
  isActive?: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyName?: string;
  department?: string;
  jobTitle?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  assignmentNotifications: boolean;
  reportNotifications: boolean;
  marketingEmails: boolean;
}
import { useToast } from '@/hooks/use-toast';



export default function EmployeeDashboardPage() {
  const { user: adminUser, isAuthenticated: isAdminAuthenticated } = useAuth();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const [isLoading, setIsLoading] = useState(true);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  
  // Check if we're logged in as an employee (admin login as employee)
  const [isLoggedInAsEmployee, setIsLoggedInAsEmployee] = useState(false);
  const [employeeUserData, setEmployeeUserData] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
  // Track the current user context (admin or employee)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Employee-specific state
  const [employeeStats, setEmployeeStats] = useState<any>({
    totalVideosAnalyzed: 0,
    averageScore: 0,
    assignmentsCompleted: 0,
    streakDays: 0,
    lastActive: new Date(),
    overallRating: 0
  });

  // Settings state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    assignmentNotifications: true,
    reportNotifications: true,
    marketingEmails: false
  });

  // Check for employee session on mount (support both direct login and admin login as employee)
  useEffect(() => {
    // Skip if not on client side
    if (typeof window === 'undefined') return;
    
    // First, check for existing employee session in sessionStorage
    const existingSession = sessionStorage.getItem('employeeSession');
    if (existingSession) {
      try {
        const sessionData = JSON.parse(existingSession);
        console.log('Existing employee session found:', sessionData);
        
        setIsLoggedInAsEmployee(sessionData.isLoggedInAsEmployee);
        setEmployeeUserData(sessionData.employeeUserData);
        setEmployeeId(sessionData.employeeId);
        setCurrentUser(sessionData.employeeUserData);
        setIsAuthenticated(true);
        
        // Set employee stats from session data
        setEmployeeStats({
          totalVideosAnalyzed: sessionData.employeeUserData.videosAnalyzed || 12,
          averageScore: sessionData.employeeUserData.overallScore || 85,
          assignmentsCompleted: sessionData.employeeUserData.assignmentsCompleted || 8,
          streakDays: 5,
          lastActive: new Date(),
          overallRating: 4.2
        });
        
        setIsLoading(false);
        return; // Exit early if session exists
      } catch (error) {
        console.error('Error parsing existing session:', error);
        sessionStorage.removeItem('employeeSession');
      }
    }
    
    // Get URL parameters to check for admin login as employee
    const urlParams = new URLSearchParams(window.location.search);
    const employeeIdParam = urlParams.get('employeeId');
    const sessionIdParam = urlParams.get('sessionId');
    const adminTokenParam = urlParams.get('adminToken');
    
    if (employeeIdParam && sessionIdParam && adminTokenParam) {
      // Admin login as employee - fetch employee data directly
      console.log('Admin login as employee detected, fetching employee data...');
      
      const fetchEmployeeData = async () => {
        try {
          // Use existing employee API
          const response = await fetch(`/api/employees/${employeeIdParam}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch employee data');
          }
          
          const result = await response.json();
          
          if (result.success && result.employee) {
            console.log('Admin login as employee - employee data loaded:', result.employee);
            setIsLoggedInAsEmployee(true);
            setEmployeeUserData(result.employee);
            setEmployeeId(result.employee.id);
            
            // Set the current user context to the employee
            setCurrentUser(result.employee);
            setIsAuthenticated(true);
            
            // Store employee session in sessionStorage to persist across tab switches
            sessionStorage.setItem('employeeSession', JSON.stringify({
              isLoggedInAsEmployee: true,
              employeeUserData: result.employee,
              employeeId: result.employee.id,
              sessionId: sessionIdParam,
              adminToken: adminTokenParam
            }));
            
            // Set employee stats from MongoDB data
            setEmployeeStats({
              totalVideosAnalyzed: result.employee.videosAnalyzed || 12,
              averageScore: result.employee.overallScore || 85,
              assignmentsCompleted: result.employee.assignmentsCompleted || 8,
              streakDays: 5,
              lastActive: new Date(),
              overallRating: 4.2
            });
            
            // Clean up URL parameters after processing
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } else {
            throw new Error('Invalid employee data');
          }
        } catch (error) {
          console.error('Error fetching employee data:', error);
          toast({
            title: 'Session Error',
            description: 'Failed to load employee data. Please try logging in again.',
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchEmployeeData();
    } else if (adminUser && adminUser.role !== 'ADMIN' && adminUser.role !== 'CORPORATE_ADMIN') {
      // Direct employee login - use auth context user data
      console.log('Direct employee login detected:', adminUser);
      setIsLoggedInAsEmployee(false); // This is direct login, not admin login as employee
      setEmployeeUserData(adminUser);
      setEmployeeId(adminUser.id);
      setCurrentUser(adminUser);
      setIsAuthenticated(isAdminAuthenticated);
      
      // Set employee stats for direct login
      setEmployeeStats({
        totalVideosAnalyzed: 12,
        averageScore: 85,
        assignmentsCompleted: 8,
        streakDays: 5,
        lastActive: new Date(),
        overallRating: 4.2
      });
      
      setIsLoading(false);
    } else {
      // No employee session and not an employee user
      setIsLoading(false);
    }
  }, [adminUser, toast, isAdminAuthenticated]);

  // Initialize with default values for UI display
  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && !isLoggedInAsEmployee) {
      // Set default values for employee stats (for UI display only)
      setEmployeeStats({
        totalVideosAnalyzed: 12,
        averageScore: 85,
        assignmentsCompleted: 8,
        streakDays: 5,
        lastActive: new Date(),
        overallRating: 4.2
      });
    }
  }, [currentUser, isLoggedInAsEmployee]);

  // Settings functions
  const fetchUserProfile = async () => {
    try {
      console.log('Employee Dashboard - fetchUserProfile called');
      console.log('Employee Dashboard - User from auth:', user);
      console.log('Employee Dashboard - Token available:', !!token);

      // First, try to use data from auth context (this is the primary source)
      if (user) {
        console.log('Employee Dashboard - Using auth context data');
        setProfile({
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          role: user.role,
          companyName: user.companyName || '',
          department: user.department || '',
          jobTitle: user.jobTitle || '',
          phoneNumber: '',
          location: '',
          bio: '',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        console.log('Employee Dashboard - Profile set from auth context:', {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          role: user.role
        });
      }

      // Then try to fetch additional data from API if token is available
      if (token) {
        const response = await fetch('/api/accountsetting/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Merge API data with existing profile data
          if (data.user) {
            setProfile(prevProfile => ({
              ...prevProfile,
              ...data.user,
              firstName: data.user.firstName || prevProfile?.firstName || '',
              lastName: data.user.lastName || prevProfile?.lastName || '',
              email: data.user.email || prevProfile?.email || '',
              role: data.user.role || prevProfile?.role || '',
              companyName: data.user.companyName || prevProfile?.companyName || '',
              department: data.user.department || prevProfile?.department || '',
              jobTitle: data.user.jobTitle || prevProfile?.jobTitle || '',
              phoneNumber: data.user.phoneNumber || prevProfile?.phoneNumber || '',
              location: data.user.location || prevProfile?.location || '',
              bio: data.user.bio || prevProfile?.bio || '',
              lastLoginAt: data.user.lastLoginAt || prevProfile?.lastLoginAt || new Date().toISOString(),
              createdAt: data.user.createdAt || prevProfile?.createdAt || new Date().toISOString()
            }));
          }
        } else {
          console.log('API call failed, using auth context data only');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // If everything fails, still try to use auth context data
      if (user) {
        setProfile({
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          role: user.role,
          companyName: user.companyName || '',
          department: user.department || '',
          jobTitle: user.jobTitle || '',
          phoneNumber: '',
          location: '',
          bio: '',
          lastLoginAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }
      toast({
        title: 'Error',
        description: 'Failed to load profile information',
        variant: 'destructive'
      });
    }
  };

  const fetchEmployeeProfile = async () => {
    try {
      console.log('Employee Dashboard - fetchEmployeeProfile called');

      if (token) {
        const response = await fetch('/api/employee/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.employee) {
            setEmployeeProfile(data.employee);
            console.log('Employee Dashboard - Employee profile loaded:', data.employee);
          }
        } else {
          console.log('Employee profile API call failed');
        }
      }
    } catch (error) {
      console.error('Error fetching employee profile:', error);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/accountsetting/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.notifications) setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Load settings data
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        try {
          await Promise.all([
            fetchUserProfile(),
            fetchEmployeeProfile(),
            fetchUserSettings()
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      loadData();
    }
  }, [user]);

  const updateProfile = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);

      const response = await fetch('/api/accountsetting/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Profile updated successfully'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to update profile',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/accountsetting/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password changed successfully'
        });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to change password',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = async (type: 'notifications') => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/accountsetting/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          settings: notifications
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Notification settings updated successfully`
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || `Failed to update notification settings`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error(`Error updating notification settings:`, error);
      toast({
        title: 'Error',
        description: `Failed to update notification settings`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };



  // Function to clear employee session and return to admin mode
  const returnToAdminMode = () => {
    sessionStorage.removeItem('employeeSession');
    localStorage.removeItem('employeeToken');
    localStorage.removeItem('employeeUserData');
    
    toast({
      title: 'Session Ended',
      description: 'Returned to admin mode. Closing employee dashboard.',
      variant: 'default'
    });
    
    // Close this tab and return focus to the original admin tab
    window.close();
  };

  const fetchEmployeeDataFromMongoDB = async (id: string) => {
    try {
      console.log('fetchEmployeeDataFromMongoDB - Starting for employee:', id);
      const response = await fetch(`/api/employees/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employee data from MongoDB');
      }
      
      const data = await response.json();
      console.log('MongoDB response:', data);
      
      if (data.success && data.employee) {
        // Set fresh employee data from MongoDB
        setEmployeeStats({
          totalVideosAnalyzed: data.employee.videosAnalyzed || 12,
          averageScore: data.employee.overallScore || 85,
          assignmentsCompleted: data.employee.assignmentsCompleted || 8,
          streakDays: 5, // Default value
          lastActive: new Date(data.employee.lastActive || new Date()),
          overallRating: 4.2 // Default value
        });
        
        // Also update the employee user data with fresh info
        if (employeeUserData) {
          const updatedEmployeeData = {
            ...employeeUserData,
            videosAnalyzed: data.employee.videosAnalyzed || 12,
            overallScore: data.employee.overallScore || 85,
            assignmentsCompleted: data.employee.assignmentsCompleted || 8,
            jobTitle: data.employee.jobTitle || employeeUserData.jobTitle,
            department: data.employee.department || employeeUserData.department
          };
          setEmployeeUserData(updatedEmployeeData);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch employee data from MongoDB');
      }
    } catch (error) {
      console.error('Error fetching employee data from MongoDB:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data from database',
        variant: 'destructive'
      });
    }
  };

  // Allow access if authenticated (either direct employee login or admin login as employee)
  if (!isAuthenticated) {
    return <div>Please log in to access the employee dashboard.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employee dashboard...</p>
        </div>
      </div>
    );
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
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Welcome back, {employeeUserData?.firstName || currentUser?.firstName || 'Employee'}!
                  </h1>
                  <p className="text-blue-200 text-sm">
                    {employeeUserData?.email || currentUser?.email || 'employee@company.com'}
                  </p>
                </div>
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
                    <span className="text-sm text-blue-100">Videos Analyzed</span>
                    <span className="text-white font-bold">{employeeStats.totalVideosAnalyzed}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded border border-white/20 h-16">
                    <span className="text-sm text-blue-100">Average Score</span>
                    <span className="text-white font-bold">{employeeStats.averageScore}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded border border-white/20 h-16">
                    <span className="text-sm text-blue-100">Assignments</span>
                    <span className="text-white font-bold">{employeeStats.assignmentsCompleted}</span>
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
                  <TabsList className="h-9 md:h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground grid w-full grid-cols-3">
                    <TabsTrigger value="profile" className="text-xs md:text-sm">Profile</TabsTrigger>
                    <TabsTrigger value="security" className="text-xs md:text-sm">Security</TabsTrigger>
                    <TabsTrigger value="feedback" className="text-xs md:text-sm">Feedback</TabsTrigger>
                  </TabsList>
                </div>
                <div className="p-4 md:p-8">
                  <TabsContent value="profile">
                    <div className="space-y-6">
                      {/* User Profile Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <User className="w-5 h-5" />
                            <span>Personal Information</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {profile && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label htmlFor="firstName">First Name</Label>
                                  <Input
                                    id="firstName"
                                    value={profile.firstName}
                                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                    placeholder="Enter your first name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="lastName">Last Name</Label>
                                  <Input
                                    id="lastName"
                                    value={profile.lastName}
                                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                    placeholder="Enter your last name"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                  <Input
                                    id="email"
                                    type="email"
                                    value={profile.email}
                                    className="pl-10"
                                    disabled
                                  />
                                </div>
                                <p className="text-xs text-gray-500">Email cannot be changed. Contact support if needed.</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label htmlFor="role">Role</Label>
                                  <div className="relative">
                                    {profile.role === 'CORPORATE_ADMIN' && <Crown className="absolute left-3 top-3 w-4 h-4 text-yellow-500" />}
                                    {profile.role === 'EMPLOYEE' && <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />}
                                    {profile.role === 'CORPORATE_USER' && <Shield className="absolute left-3 top-3 w-4 h-4 text-blue-500" />}
                                    <Input
                                      id="role"
                                      value={profile.role.replace('_', ' ')}
                                      className="pl-10"
                                      disabled
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="phoneNumber">Phone Number</Label>
                                  <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                      id="phoneNumber"
                                      value={profile.phoneNumber || ''}
                                      onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                                      placeholder="Enter your phone number"
                                      className="pl-10"
                                    />
                                  </div>
                                </div>
                              </div>

                              {profile.companyName && (
                                <div className="space-y-2">
                                  <Label htmlFor="companyName">Company</Label>
                                  <div className="relative">
                                    <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                      id="companyName"
                                      value={profile.companyName}
                                      className="pl-10"
                                      disabled
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex justify-end">
                                <Button onClick={updateProfile} disabled={isSaving}>
                                  <Save className="w-4 h-4 mr-2" />
                                  {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      {/* Employee Profile Card */}
                      {employeeProfile && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                              <Briefcase className="w-5 h-5" />
                              <span>Employee Details</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="employeeId">Employee ID</Label>
                                <div className="relative">
                                  <Badge variant="outline" className="w-full justify-start pl-3 py-2">
                                    {employeeProfile.employeeId || employeeProfile.custom_attributes?.employeeId || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <div className="relative">
                                  <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                  <Input
                                    id="department"
                                    value={employeeProfile.department}
                                    className="pl-10"
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="jobTitle">Job Title</Label>
                                <div className="relative">
                                  <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                  <Input
                                    id="jobTitle"
                                    value={employeeProfile.job_title}
                                    className="pl-10"
                                    disabled
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="hireDate">Hire Date</Label>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                  <Input
                                    id="hireDate"
                                    value={employeeProfile.hireDate ? new Date(employeeProfile.hireDate).toLocaleDateString() :
                                      employeeProfile.custom_attributes?.hireDate ? new Date(employeeProfile.custom_attributes.hireDate).toLocaleDateString() : 'N/A'}
                                    className="pl-10"
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="isActive">Status</Label>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={employeeProfile.isActive || employeeProfile.custom_attributes?.isActive ? "default" : "secondary"}>
                                    {employeeProfile.isActive || employeeProfile.custom_attributes?.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="createdAt">Member Since</Label>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                  <Input
                                    id="createdAt"
                                    value={new Date(employeeProfile.created_at).toLocaleDateString()}
                                    className="pl-10"
                                    disabled
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Custom Attributes Section */}
                            {employeeProfile.custom_attributes && (() => {
                              // Filter out MongoDB internal fields and standard fields
                              const filteredAttributes = Object.entries(employeeProfile.custom_attributes).filter(([key, value]) => {
                                // Exclude MongoDB internal fields, standard fields, and empty values
                                return !key.startsWith('$') && 
                                       !key.startsWith('_') && 
                                       key !== 'employeeId' && 
                                       key !== 'hireDate' && 
                                       key !== 'isActive' &&
                                       value !== null &&
                                       value !== undefined &&
                                       value !== '';
                              });
                              
                              return filteredAttributes.length > 0;
                            })() && (
                              <div className="space-y-4">
                                <Separator />
                                <h4 className="font-medium text-gray-900">Additional Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.entries(employeeProfile.custom_attributes)
                                    .filter(([key, value]) => {
                                      // Same filtering logic
                                      return !key.startsWith('$') && 
                                             !key.startsWith('_') && 
                                             key !== 'employeeId' && 
                                             key !== 'hireDate' && 
                                             key !== 'isActive' &&
                                             value !== null &&
                                             value !== undefined &&
                                             value !== '';
                                    })
                                    .map(([key, value]) => (
                                      <div key={key} className="space-y-2">
                                        <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                        <Input
                                          value={typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
                                                 typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                          disabled
                                        />
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security">
                    <div className="space-y-6">
                      {/* Change Password */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Key className="w-5 h-5" />
                            <span>Change Password</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                placeholder="Enter your current password"
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                placeholder="Enter your new password (min 8 characters)"
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                placeholder="Confirm your new password"
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button onClick={changePassword} disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}>
                              <Lock className="w-4 h-4 mr-2" />
                              {isSaving ? 'Changing...' : 'Change Password'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>



                  {/* Feedback Tab */}
                  <TabsContent value="feedback" className="space-y-6">
                    <h3 className="text-lg font-semibold">Feedback & Reviews</h3>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center justify-between">
                            <span>Video Analysis Feedback</span>
                            <div className="flex items-center space-x-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="font-medium">4.5/5</span>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-4">&ldquo;Excellent improvement in eye contact and body language. Your confidence has grown significantly.&rdquo;</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>Coach: Sarah Johnson</span>
                            <span>2 days ago</span>
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

        {/* Welcome Message */}
        <div className="mt-8">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <p className="text-green-800 text-center">
                <strong>Welcome Back!</strong> Hello {isLoggedInAsEmployee ? (employeeUserData?.firstName || 'Employee') : (currentUser?.firstName || 'User')}! Ready to track your progress?
              </p>
              {/* Debug info */}
              {isLoggedInAsEmployee && (
                <div className="mt-2 text-xs text-gray-600">
                  Debug: Employee ID: {employeeId}, Videos: {employeeStats.totalVideosAnalyzed}, Score: {employeeStats.averageScore}%
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
