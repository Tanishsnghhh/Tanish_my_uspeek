'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, User, Mail, Lock, Users, Shield, GraduationCap } from 'lucide-react';

const registerSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  subscriptionPlan: z.enum(['basic', 'professional', 'enterprise']),
  adminFirstName: z.string().min(2, 'First name must be at least 2 characters'),
  adminLastName: z.string().min(2, 'Last name must be at least 2 characters'),
  adminEmail: z.string().email('Please enter a valid email address'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  country: z.string().min(2, 'Country is required'),
  countryCode: z.string().min(2, 'Country code is required'),
  phoneCode: z.string().min(1, 'Phone code is required'),
  location: z.string().min(2, 'Location is required')
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  userRole: 'admin' | 'employee' | 'staff';
}

export function RegisterForm({ onSwitchToLogin, userRole }: RegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      subscriptionPlan: 'basic'
    }
  });

  const subscriptionPlan = watch('subscriptionPlan');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-8 h-8 text-blue-600" />;
      case 'employee':
        return <GraduationCap className="w-8 h-8 text-green-600" />;
      case 'staff':
        return <Users className="w-8 h-8 text-purple-600" />;
      default:
        return <Building2 className="w-8 h-8 text-blue-600" />;
    }
  };

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Create Corporate Account';
      case 'employee':
        return 'Employee Registration';
      case 'staff':
        return 'Staff Registration';
      default:
        return 'Create Account';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Set up your company\'s USpeak Pro account';
      case 'employee':
        return 'Register as a corporate employee';
      case 'staff':
        return 'Register as support staff';
      default:
        return 'Create your account';
    }
  };

  const getPlanDetails = (plan: string) => {
    switch (plan) {
      case 'basic':
        return { maxEmployees: 100, price: '$99/month' };
      case 'professional':
        return { maxEmployees: 1000, price: '$299/month' };
      case 'enterprise':
        return { maxEmployees: 50000, price: 'Custom pricing' };
      default:
        return { maxEmployees: 100, price: '$99/month' };
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, role: userRole })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Only show company registration for admin role
  if (userRole !== 'admin') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {getRoleIcon(userRole)}
            <CardTitle className="text-2xl font-bold ml-2">{getRoleTitle(userRole)}</CardTitle>
          </div>
          <CardDescription className="text-center">
            {getRoleDescription(userRole)}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Employee and Staff registration is managed by Corporate Administrators. 
              Please contact your company's admin to get access.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={onSwitchToLogin}
            className="w-full"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          {getRoleIcon(userRole)}
          <CardTitle className="text-2xl font-bold ml-2">{getRoleTitle(userRole)}</CardTitle>
        </div>
        <CardDescription className="text-center">
          {getRoleDescription(userRole)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  placeholder="Your Company Inc."
                  className="pl-10"
                  {...register('companyName')}
                  disabled={isLoading}
                />
              </div>
              {errors.companyName && (
                <p className="text-sm text-red-600">{errors.companyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
              <Select
                onValueChange={(value) => setValue('subscriptionPlan', value as any)}
                defaultValue="basic"
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic - $99/month (up to 100 employees)</SelectItem>
                  <SelectItem value="professional">Professional - $299/month (up to 1,000 employees)</SelectItem>
                  <SelectItem value="enterprise">Enterprise - Custom pricing (up to 50,000 employees)</SelectItem>
                </SelectContent>
              </Select>
              {subscriptionPlan && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Plan Details:</strong> {getPlanDetails(subscriptionPlan).maxEmployees} employees max • {getPlanDetails(subscriptionPlan).price}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Admin Account</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminFirstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="adminFirstName"
                    placeholder="John"
                    className="pl-10"
                    {...register('adminFirstName')}
                    disabled={isLoading}
                  />
                </div>
                {errors.adminFirstName && (
                  <p className="text-sm text-red-600">{errors.adminFirstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminLastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="adminLastName"
                    placeholder="Doe"
                    className="pl-10"
                    {...register('adminLastName')}
                    disabled={isLoading}
                  />
                </div>
                {errors.adminLastName && (
                  <p className="text-sm text-red-600">{errors.adminLastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@company.com"
                  className="pl-10"
                  {...register('adminEmail')}
                  disabled={isLoading}
                />
              </div>
              {errors.adminEmail && (
                <p className="text-sm text-red-600">{errors.adminEmail.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Minimum 8 characters"
                    className="pl-10"
                    {...register('adminPassword')}
                    disabled={isLoading}
                  />
                </div>
                {errors.adminPassword && (
                  <p className="text-sm text-red-600">{errors.adminPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    className="pl-10"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Location</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    {...register('city')}
                    disabled={isLoading}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    placeholder="Enter state"
                    {...register('state')}
                    disabled={isLoading}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="Enter country"
                    {...register('country')}
                    disabled={isLoading}
                  />
                  {errors.country && (
                    <p className="text-sm text-red-600">{errors.country.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country Code *</Label>
                  <Input
                    id="countryCode"
                    placeholder="e.g., IN, US, UK"
                    {...register('countryCode')}
                    disabled={isLoading}
                  />
                  {errors.countryCode && (
                    <p className="text-sm text-red-600">{errors.countryCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneCode">Phone Code *</Label>
                  <Input
                    id="phoneCode"
                    placeholder="e.g., +91, +1, +44"
                    {...register('phoneCode')}
                    disabled={isLoading}
                  />
                  {errors.phoneCode && (
                    <p className="text-sm text-red-600">{errors.phoneCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    onValueChange={(value) => setValue('location', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North America">North America</SelectItem>
                      <SelectItem value="South America">South America</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="Middle East">Middle East</SelectItem>
                      <SelectItem value="Asia">Asia</SelectItem>
                      <SelectItem value="Africa">Africa</SelectItem>
                      <SelectItem value="Oceania">Oceania</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Create Corporate Account
              </>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
