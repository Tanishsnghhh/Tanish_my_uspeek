'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, MoreHorizontal, Shield, User, Crown, Activity, Clock, CheckCircle, AlertCircle, Building, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserDetailDialog } from './user-detail-dialog';
import { AddUserDialog } from './add-user-dialog';

interface User {
  id: string;
  email: string;
  role: 'CORPORATE_ADMIN' | 'CORPORATE_USER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'DEACTIVATED' | 'DELETED';
  accountId: string;
  accountName: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Utility functions
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
      return <Crown className="w-4 h-4 text-yellow-600" />;
    case 'CORPORATE_USER':
      return <Shield className="w-4 h-4 text-blue-600" />;
    case 'EMPLOYEE':
      return <User className="w-4 h-4 text-gray-600" />;
    default:
      return <User className="w-4 h-4 text-gray-600" />;
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

// Utility function to format time difference in human-readable way
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return formatDate(dateString);
};

// Dynamic status utility functions
const getDynamicStatus = (lastLoginAt: string | undefined, status: string) => {
  if (status !== 'ACTIVE') return status;

  if (!lastLoginAt) return 'OFFLINE';

  const lastLogin = new Date(lastLoginAt);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);

  // More reasonable timeframes for admin dashboard
  if (diffInMinutes < 120) return 'ONLINE'; // Last 2 hours
  if (diffInMinutes < 1440) return 'AWAY'; // Last 24 hours
  return 'OFFLINE'; // More than 24 hours
};

const getDynamicStatusColor = (dynamicStatus: string) => {
  switch (dynamicStatus) {
    case 'ONLINE':
      return 'bg-green-100 text-green-800 border-green-300 shadow-sm';
    case 'AWAY':
      return 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm';
    case 'OFFLINE':
      return 'bg-slate-100 text-slate-600 border-slate-300';
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

const getDynamicStatusIcon = (dynamicStatus: string) => {
  switch (dynamicStatus) {
    case 'ONLINE':
      return <CheckCircle className="w-3 h-3 text-green-600" />;
    case 'AWAY':
      return <Clock className="w-3 h-3 text-yellow-600" />;
    case 'OFFLINE':
      return <AlertCircle className="w-3 h-3 text-gray-600" />;
    default:
      return null;
  }
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { token, user } = useAuth();

  // Check if current user is an employee (not admin)
  const isEmployee = user?.role === 'EMPLOYEE' || user?.role === 'CORPORATE_USER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'CORPORATE_ADMIN';

  // Fetch users from API
  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  useEffect(() => {
    // Format dates on the client side to avoid hydration mismatch
    const dates: Record<string, string> = {};
    users.forEach(user => {
      dates[user.id] = formatDate(user.lastLoginAt || user.updatedAt);
    });
    setFormattedDates(dates);
  }, [users]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoleDisplayName(user.role).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.accountName && user.accountName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.accountId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle opening user detail dialog
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserDetailOpen(true);
  };

  // Handle closing user detail dialog
  const handleCloseDetailDialog = () => {
    setIsUserDetailOpen(false);
    setSelectedUserId(null);
  };

  // Separate users by role - Corporate Admins in one column, others in another
  const adminUsers = filteredUsers.filter(user => user.role === 'CORPORATE_ADMIN');
  const employeeUsers = filteredUsers.filter(user => user.role !== 'CORPORATE_ADMIN');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <Badge variant="secondary" className="ml-2">
              {isEmployee ? employeeUsers.length : users.length} total
            </Badge>
          </div>
          {isAdmin && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsAddUserDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users by email, role, or account..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className={`grid grid-cols-1 ${isEmployee ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
          {/* Corporate Admins Column - Only show for admins */}
          {!isEmployee && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-yellow-600" />
                    <span>Corporate Admins</span>
                    <Badge variant="secondary">{adminUsers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {adminUsers.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No corporate admins found</p>
                    ) : (
                      adminUsers.map((user) => {
                        const dynamicStatus = getDynamicStatus(user.lastLoginAt, user.status);
                        return (
                          <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer group" onClick={() => handleUserClick(user.id)}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {/* Header with name and dynamic status */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    {getRoleIcon(user.role)}
                                    <div>
                                      <span className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{user.email}</span>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {getRoleDisplayName(user.role)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                      {getDynamicStatusIcon(dynamicStatus)}
                                      <Badge className={`${getDynamicStatusColor(dynamicStatus)} text-xs px-2 py-1 border`}>
                                        {dynamicStatus}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Activity Information */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <Activity className="w-3 h-3" />
                                    <span>
                                      {dynamicStatus === 'ONLINE' ? 'Active now' :
                                       dynamicStatus === 'AWAY' ? 'Recently active' :
                                       user.lastLoginAt ? `Last seen ${formattedDates[user.id]}` : 'Never logged in'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                                    <span>Full access</span>
                                    <span>Joined {formatDate(user.createdAt)}</span>
                                  </div>
                                </div>

                                {/* Quick Stats for Corporate Admins */}
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="grid grid-cols-1 gap-2 text-xs">
                                    <div className="flex items-center space-x-1">
                                      <Users className="w-3 h-3 text-blue-500" />
                                      <span className="text-gray-600">Managing account</span>
                                    </div>
                                  </div>
                                  {/* Last seen info */}
                                  <div className="mt-2 pt-2 border-t border-gray-50">
                                    <div className="flex items-center space-x-2 text-xs">
                                      <span className="text-gray-500">Last seen:</span>
                                      <span className={`font-medium ${
                                        dynamicStatus === 'ONLINE' ? 'text-green-600' :
                                        dynamicStatus === 'AWAY' ? 'text-amber-600' :
                                        'text-gray-500'
                                      }`}>
                                        {user.lastLoginAt ? formatTimeAgo(user.lastLoginAt) : 'Never'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                onClick={(e) => { e.stopPropagation(); }}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                              {/* Click indicator */}
                              <ChevronRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Employees Column */}
          <div className={isEmployee ? 'lg:col-span-1' : 'lg:col-span-2'}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Employees & Corporate Users</span>
                  <Badge variant="secondary">{employeeUsers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-3 font-medium text-gray-600">User</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-600">Role</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-600">Account</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-600">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        employeeUsers.map((user) => (
                          <tr 
                            key={user.id} 
                            className="border-b border-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer group" 
                            onClick={() => handleUserClick(user.id)}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                {getRoleIcon(user.role)}
                                <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{user.email}</div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-sm text-gray-700">{getRoleDisplayName(user.role)}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-sm text-gray-600">
                                <div>{user.accountName || user.accountId}</div>
                                {user.accountName && (
                                  <div className="text-xs text-gray-500 mt-1">ID: {user.accountId}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <Badge className={getDynamicStatusColor(getDynamicStatus(user.lastLoginAt, user.status))}>
                                {getDynamicStatus(user.lastLoginAt, user.status)}
                              </Badge>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-sm text-gray-600">
                                {formattedDates[user.id] || 'No activity'}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* User Detail Dialog */}
      <UserDetailDialog
        userId={selectedUserId}
        isOpen={isUserDetailOpen}
        onClose={handleCloseDetailDialog}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        isOpen={isAddUserDialogOpen}
        onClose={() => setIsAddUserDialogOpen(false)}
        onSuccess={() => {
          fetchUsers(); // Refresh the users list
        }}
      />
    </DashboardLayout>
  );
}