'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Crown,
  Shield,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUserAnalytics } from '@/hooks/use-user-analytics';
import { ScoreCards } from '@/components/dashboard/score-cards';
import { OverallScore } from '@/components/dashboard/overall-score';

interface UserDetail {
  id: string;
  email: string;
  role: 'CORPORATE_ADMIN' | 'CORPORATE_USER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'DEACTIVATED' | 'DELETED';
  accountId: string;
  accountName: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  firstName: string | null;
  lastName: string | null;
  employeeProfile?: {
    employeeId: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    department: string;
    jobTitle: string;
    hireDate: string;
    isActive: boolean;
    manager?: {
      id: string;
      name: string;
      employeeId: string;
    } | null;
    license?: {
      id: string;
      type: string;
    } | null;
    customAttributes: { [key: string]: string };
  };
  assignmentStats?: {
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    inProgressAssignments: number;
  };
  accountManagement?: {
    totalUsers: number;
    totalEmployees: number;
    accountId: string;
    accountName: string | null;
  };
}

interface UserDetailDialogProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    case 'DEACTIVATED':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'DELETED':
      return 'bg-red-100 text-red-800 hover:bg-red-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'CORPORATE_ADMIN':
      return <Crown className="w-5 h-5 text-yellow-600" />;
    case 'CORPORATE_USER':
      return <Shield className="w-5 h-5 text-blue-600" />;
    case 'EMPLOYEE':
      return <User className="w-5 h-5 text-gray-600" />;
    default:
      return <User className="w-5 h-5 text-gray-600" />;
  }
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'CORPORATE_ADMIN':
      return 'Corporate Admin';
    case 'CORPORATE_USER':
      return 'Corporate User';
    case 'EMPLOYEE':
      return 'Employee';
    default:
      return role;
  }
};

export function UserDetailDialog({ userId, isOpen, onClose }: UserDetailDialogProps) {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (userId && isOpen) {
      fetchUserDetail();
    }
  }, [userId, isOpen]);

  const fetchUserDetail = async () => {
    if (!token || !userId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetail(data.data);
      } else {
        setError('Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => {
    if (!userDetail) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getRoleIcon(userDetail.role)}
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{userDetail.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Name</p>
                <p className="text-sm text-gray-600">
                  {userDetail.firstName && userDetail.lastName
                    ? `${userDetail.firstName} ${userDetail.lastName}`
                    : 'Not provided'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Account</p>
                <p className="text-sm text-gray-600">
                  {userDetail.accountName || userDetail.accountId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Status</p>
                <Badge className={getStatusColor(userDetail.status)}>
                  {userDetail.status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">Created</p>
              <p className="text-gray-600">{formatDate(userDetail.createdAt)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Last Updated</p>
              <p className="text-gray-600">{formatDate(userDetail.updatedAt)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Last Login</p>
              <p className="text-gray-600">
                {userDetail.lastLoginAt ? formatDate(userDetail.lastLoginAt) : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEmployeeDetails = () => {
    if (!userDetail?.employeeProfile) return null;

    const profile = userDetail.employeeProfile;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Employee Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Employee ID</p>
                <p className="text-sm text-gray-600">{profile.employeeId}</p>
              </div>
            </div>

            {profile.phoneNumber && (
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{profile.phoneNumber}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Department</p>
                <p className="text-sm text-gray-600">{profile.department}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Job Title</p>
                <p className="text-sm text-gray-600">{profile.jobTitle}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Hire Date</p>
                <p className="text-sm text-gray-600">{formatDate(profile.hireDate)}</p>
              </div>
            </div>

            {profile.manager && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Manager</p>
                  <p className="text-sm text-gray-600">{profile.manager.name}</p>
                  <p className="text-xs text-gray-500">ID: {profile.manager.employeeId}</p>
                </div>
              </div>
            )}
          </div>

          {profile.license && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">License Information</p>
                <Badge variant="outline">{profile.license.type}</Badge>
              </div>
            </>
          )}

          {Object.keys(profile.customAttributes).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Custom Attributes</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(profile.customAttributes).map(([key, value]) => {
                    const position = key.replace('position_', '');
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
                    const attributeName = getPositionName(position);
                    return (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-gray-700">{attributeName}:</span>
                        <span className="text-gray-600 ml-1">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAssignmentStats = () => {
    if (!userDetail?.assignmentStats) return null;

    const stats = userDetail.assignmentStats;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-green-600" />
            <span>Assignment Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAssignments}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completedAssignments}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingAssignments}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.inProgressAssignments}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAdminDetails = () => {
    if (!userDetail?.accountManagement) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <span>License Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">License Type</p>
                <p className="text-sm text-gray-600">USPEAK_PRO</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Status</p>
                <p className="text-sm text-gray-600">ASSIGNED</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">License Key</p>
                <p className="text-sm text-gray-600 font-mono">USP-PD4EXR574</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Max Users</p>
                <p className="text-sm text-gray-600">1</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Features</p>
              <p className="text-sm text-gray-600">3 features included</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900">Assigned Date</p>
              <p className="text-sm text-gray-600">{formatDate('2025-08-28T11:20:40.631+00:00')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Loading User Details</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading user details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Error</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchUserDetail} className="mt-4">
              Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!userDetail) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getRoleIcon(userDetail.role)}
            <span>
              {userDetail.firstName && userDetail.lastName
                ? `${userDetail.firstName} ${userDetail.lastName}`
                : userDetail.email
              }
            </span>
            <Badge variant="outline">
              {getRoleDisplayName(userDetail.role)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information - Always shown */}
          {renderBasicInfo()}

          {/* Role-specific information */}
          {userDetail.role === 'EMPLOYEE' && (
            <>
              {renderEmployeeDetails()}
              {renderAssignmentStats()}
            </>
          )}

          {userDetail.role === 'CORPORATE_ADMIN' && renderAdminDetails()}
        </div>
      </DialogContent>
    </Dialog>
  );
}