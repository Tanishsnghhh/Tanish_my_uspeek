'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Shield, GraduationCap, BarChart3, Settings } from 'lucide-react';

type UserRole = 'admin' | 'employee' | null;

export default function AuthPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [isLogin, setIsLogin] = useState(true);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsLogin(true);
  };

  const handleBackToRoleSelect = () => {
    setSelectedRole(null);
  };

  // Role Selection Screen - Simple Design
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Building2 className="w-12 h-12 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">USpeak Pro</h1>
              </div>
              <p className="text-gray-600">Corporate Communication Skills Platform</p>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 text-center mb-6">
                Select Your Access Type
              </h2>
              
              {/* Corporate Admin */}
              <Button
                onClick={() => handleRoleSelect('admin')}
                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 border-2 hover:border-blue-300 transition-all duration-200"
              >
                <Shield className="w-5 h-5 mr-3" />
                Corporate Admin
              </Button>

              {/* Corporate Employee */}
              <Button
                onClick={() => handleRoleSelect('employee')}
                className="w-full h-14 text-lg bg-green-600 hover:bg-green-700 border-2 hover:border-green-300 transition-all duration-200"
              >
                <GraduationCap className="w-5 h-5 mr-3" />
                Corporate Employee
              </Button>

              {/* Super Admin */}
              <Button
                onClick={() => window.location.href = '/super-admin/login'}
                className="w-full h-14 text-lg bg-purple-600 hover:bg-purple-700 border-2 hover:border-purple-300 transition-all duration-200"
              >
                <Settings className="w-5 h-5 mr-3" />
                Super Admin Portal
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-sm text-gray-500">
              <p>© 2024 USpeak Pro. All rights reserved.</p>
              <p className="mt-1">Secure • Compliant • Enterprise-ready</p>
            </div>
          </div>
        </div>

        {/* Right Side - Background Image */}
        <div className="hidden lg:block w-1/2 relative" 
             style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center text-white px-8">
              <h2 className="text-5xl font-bold mb-6">Welcome to USpeak Pro</h2>
              <p className="text-2xl mb-8 opacity-90">The complete communication skills platform for corporate teams</p>
              <div className="space-y-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-4">
                  <BarChart3 className="w-8 h-8 text-blue-300" />
                  <span className="text-lg">Advanced Analytics & Reporting</span>
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <GraduationCap className="w-8 h-8 text-green-300" />
                  <span className="text-lg">Custom Learning Paths</span>
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <Users className="w-8 h-8 text-purple-300" />
                  <span className="text-lg">Bulk Employee Management</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authentication Form Screen - Simple Design
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={handleBackToRoleSelect}
            className="mb-6"
          >
            ← Back to Selection
          </Button>

          {/* Form Container */}
          {isLogin ? (
            <LoginForm 
              onSwitchToRegister={() => setIsLogin(false)} 
              userRole={selectedRole}
            />
          ) : (
            <RegisterForm 
              onSwitchToLogin={() => setIsLogin(true)} 
              userRole={selectedRole}
            />
          )}
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:block w-1/2 bg-cover bg-center bg-no-repeat relative" 
           style={{ 
             backgroundImage: 'url(https://app.uspeeknow.com/assets/images/login_bg.png), linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
             backgroundSize: 'cover, cover'
           }}>
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white px-8">
            <h2 className="text-5xl font-bold mb-6">
              {selectedRole === 'admin' ? 'Admin Access' : 
               selectedRole === 'employee' ? 'Employee Portal' : 'Support Tools'}
            </h2>
            <p className="text-2xl opacity-90">
              {selectedRole === 'admin' ? 'Manage your corporate account and employees' :
               selectedRole === 'employee' ? 'Access training modules and track progress' :
               'Support corporate clients and manage accounts'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
