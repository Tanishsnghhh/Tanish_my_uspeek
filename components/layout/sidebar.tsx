'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { 
  LayoutDashboard, 
  Video, 
  BookOpen, 
  Users, 
  Download, 
  CreditCard, 
  User, 
  LogOut,
  BarChart3,
  Crown,
  Sparkles,
  Settings,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  Target,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const [isUserExpanded, setIsUserExpanded] = useState(false);
  const { logout, user } = useAuth();

  // Debug: Log user data to see what's available
  console.log('Sidebar - User data:', user);
  console.log('Sidebar - User role:', user?.role);
  console.log('Sidebar - User department:', user?.department);
  console.log('Sidebar - User jobTitle:', user?.jobTitle);
  console.log('Sidebar - Is Admin:', user?.role === 'ADMIN' || user?.role === 'CORPORATE_ADMIN');

  // Define navigation items based on user role
  const getNavigationItems = () => {
    // Check if user is admin (ADMIN or CORPORATE_ADMIN roles)
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'CORPORATE_ADMIN';
    
    // Determine the profile link based on user role
    const profileHref = isAdmin ? '/profile' : '/employee-dashboard';

    // Determine assignments link based on role (employees -> new page)
    const assignmentsHref = isAdmin ? '/assignments' : '/employeeassignmnetpage';

    // Base navigation items for all users (both admins and employees)
    const baseItems = [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', badge: null },
      { name: 'Videos', icon: Video, href: '/videos', badge: null },
      { name: 'Assignments', icon: ClipboardList, href: assignmentsHref, badge: 'New' },
    ];

    // Employee-only navigation items (hidden from admins)
    const employeeItems = [
      { name: 'Learning Lessons', icon: BookOpen, href: '/learning-lessons', badge: 'New' },
    ];

    // Admin-only navigation items (hidden from regular employees)
    const adminItems = [
      { name: 'Users', icon: Users, href: '/users', badge: null },
      { name: 'Export Data', icon: Download, href: '/export-data', badge: null },
      { name: 'Subscriptions', icon: CreditCard, href: '/subscriptions', badge: null },
    ];

    // Profile item (always shown but with different link based on role)
    const profileItem = { name: 'Profile', icon: User, href: profileHref, badge: null };

    // Return filtered navigation items based on user role
    // Admins see base items + admin items + profile
    // Employees see base items + employee items + profile
    if (isAdmin) {
      return [...baseItems, ...adminItems, profileItem];
    } else {
      return [...baseItems, ...employeeItems, profileItem];
    }
  };

  const navigationItems = getNavigationItems();

  const toggleUserSection = () => {
    setIsUserExpanded(!isUserExpanded);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-white via-gray-50/50 to-gray-100/30 border-r border-gray-200/60 backdrop-blur-sm flex flex-col shadow-xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1565D8] via-[#1565D8] to-[#1565D8] rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1565D8]/10 to-[#1565D8]/10 rounded-2xl"></div>
              <img 
                src="/logo.png" 
                alt="uSpeek Logo" 
                className="h-10 w-auto object-contain mx-auto filter hover:brightness-110 transition-all duration-300 relative z-10" 
                style={{maxWidth: '160px'}} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* User Info Section */}
      <div className="px-4 py-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1565D8]/20 to-[#1565D8]/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
          <div 
            className={cn(
              "relative bg-gradient-to-br from-white to-gray-50/80 p-4 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-[1.02] cursor-pointer",
              isUserExpanded && "shadow-lg border-[#1565D8]/30"
            )}
            onClick={toggleUserSection}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1565D8] to-[#1565D8] rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Crown className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900 text-sm">
                  {user ? 
                    (user.firstName && user.lastName ? 
                      `${user.firstName} ${user.lastName}` : 
                      user.email?.split('@')[0] || 'User'
                    ) : 'Loading...'}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {user?.role === 'ADMIN' ? 'Administrator' : 
                   user?.role === 'CORPORATE_ADMIN' ? 'Corporate Admin' :
                   user?.role === 'EMPLOYEE' ? (user?.department || 'Employee') :
                   user?.role === 'USER' ? 'User' : 'Unknown Role'}
                </div>
              </div>
              <div className="transition-transform duration-300">
                {isUserExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Expanded User Information */}
            <div className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              isUserExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="mt-4 pt-4 border-t border-gray-200/60 space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user?.email || 'No email'}</span>
                </div>
                <Link 
                  href={user?.role === 'EMPLOYEE' || user?.role === 'CORPORATE_USER' ? '/employee-settings' : '/settings'}
                  className="flex items-center space-x-3 text-sm hover:bg-gray-100/50 rounded-lg p-2 -m-2 transition-colors duration-200"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 hover:text-gray-900">Account Settings</span>
                </Link>
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Account Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      {user ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-2 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <div key={item.name} className="relative group">
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#1565D8]/10 to-[#1565D8]/10 rounded-xl border border-[#1565D8]/50"></div>
              )}
              <Link
                href={item.href}
                className={cn(
                  "relative w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 no-underline group-hover:scale-[1.02]",
                  isActive
                    ? "bg-gradient-to-r from-[#1565D8] to-[#1565D8] text-white shadow-lg shadow-[#1565D8]/25"
                    : "text-gray-600 hover:bg-white/80 hover:text-gray-900 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-300",
                  isActive 
                    ? "bg-white/20" 
                    : "group-hover:bg-gray-100/80"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                </div>
                <span className="font-semibold text-sm">{item.name}</span>
                {item.badge && (
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {item.badge}
                    </span>
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-200/60 bg-white/50 backdrop-blur-sm">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
          <button className="relative w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:shadow-md group-hover:scale-[1.02]" onClick={logout}>
            <div className="p-2 rounded-lg bg-red-100/50 group-hover:bg-red-100/80 transition-all duration-300">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-semibold text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}