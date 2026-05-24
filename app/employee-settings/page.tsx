'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Settings,
  User,
  Shield,
  Key,
  Eye,
  EyeOff,
  Save,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Crown,
  Users,
  CreditCard,
  Globe,
  Bell,
  Lock,
  Trash2,
  AlertTriangle,
  Building
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

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

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

export default function EmployeeSettingsPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginAlerts: true
  });

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
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      console.log('Employee Settings - fetchUserProfile called');
      console.log('Employee Settings - User from auth:', user);
      console.log('Employee Settings - Token available:', !!token);

      // First, try to use data from auth context (this is the primary source)
      if (user) {
        console.log('Employee Settings - Using auth context data');
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
        console.log('Employee Settings - Profile set from auth context:', {
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
      console.log('Employee Settings - fetchEmployeeProfile called');

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
            console.log('Employee Settings - Employee profile loaded:', data.employee);
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
        if (data.security) setSecurity(data.security);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

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

  const updateSettings = async (type: 'notifications' | 'security') => {
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
          settings: type === 'notifications' ? notifications : security
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${type === 'notifications' ? 'Notification' : 'Security'} settings updated successfully`
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || `Failed to update ${type} settings`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error(`Error updating ${type} settings:`, error);
      toast({
        title: 'Error',
        description: `Failed to update ${type} settings`,
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading employee settings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Settings</h1>
            <p className="text-gray-600">Manage your employee profile and account preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
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

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Assignment Notifications</h4>
                    <p className="text-sm text-gray-600">Get notified about new assignments and deadlines</p>
                  </div>
                  <Switch
                    checked={notifications.assignmentNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, assignmentNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Report Notifications</h4>
                    <p className="text-sm text-gray-600">Get notified about report updates and analytics</p>
                  </div>
                  <Switch
                    checked={notifications.reportNotifications}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, reportNotifications: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-gray-600">Receive updates about new features and tips</p>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => updateSettings('notifications')} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
