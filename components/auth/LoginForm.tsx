'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, Shield, GraduationCap, Users } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
  userRole: 'admin' | 'employee' | 'staff';
}

export function LoginForm({ onSwitchToRegister, userRole }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-8 h-8 text-blue-600" />;
      case 'employee':
        return <GraduationCap className="w-8 h-8 text-green-600" />;
      case 'staff':
        return <Users className="w-8 h-8 text-purple-600" />;
      default:
        return <Shield className="w-8 h-8 text-blue-600" />;
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Corporate Admin Login';
      case 'employee':
        return 'Employee Login';
      case 'staff':
        return 'Support Staff Login';
      default:
        return 'Login';
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', { ...data, role: userRole });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, role: userRole })
      });

      console.log('Login response status:', response.status);
      
      const result = await response.json();
      console.log('Login response:', result);

      if (!response.ok) {
        // Provide more specific error messages based on status codes
        if (response.status === 404) {
          throw new Error('Login service not found. Please try again or contact support.');
        } else if (response.status === 401) {
          throw new Error(result.error || 'Invalid credentials or account suspended');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(result.error || 'Login failed');
        }
      }

      if (result.success && result.token) {
        // Store token and user data in localStorage only
        localStorage.setItem('uspeak_token', result.token);
        localStorage.setItem('uspeak_user', JSON.stringify(result.user));
        // Store the actual role from the API response, not the prop
        localStorage.setItem('uspeak_role', result.user.role);

        console.log('Login successful, redirecting to dashboard...');

        // Redirect based on actual role from API response
        const actualRole = result.user.role.toLowerCase();
        switch (actualRole) {
          case 'admin':
          case 'corporate_admin':
            window.location.href = '/profile';  // Admin dashboard
            break;
          case 'corporate_user':
          case 'employee':
          case 'user':
            window.location.href = '/employee-dashboard';  // Employee dashboard
            break;
          case 'staff':
            window.location.href = '/support-dashboard';
            break;
          default:
            window.location.href = '/profile';  // Default to admin for unknown roles
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          {getRoleIcon(userRole)}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{getRoleTitle(userRole)}</h2>
        <p className="text-gray-600">Sign in to your account</p>
      </div>
      
      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="your.email@company.com"
              className="pl-10 h-12 text-base"
              {...register('email')}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="pl-10 h-12 text-base"
              {...register('password')}
              disabled={isLoading}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Links */}
      <div className="mt-6 space-y-3 text-center">
        <div>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Forgot password?
          </button>
        </div>
        
        <div>
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
