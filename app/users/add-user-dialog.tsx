'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { User, Mail, Shield, Eye, EyeOff, Building, UserPlus } from 'lucide-react';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyName: string;
  sendWelcomeEmail: boolean;
  generatePassword: boolean;
  customPassword?: string;
}

export function AddUserDialog({ isOpen, onClose, onSuccess }: AddUserDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'EMPLOYEE',
    companyName: '',
    sendWelcomeEmail: true,
    generatePassword: true,
    customPassword: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { toast } = useToast();
  const { token, user } = useAuth();

  const validateForm = () => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Company name required for CORPORATE_ADMIN
    if (formData.role === 'CORPORATE_ADMIN' && !formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required for corporate admin users';
    }

    if (!formData.generatePassword && !formData.customPassword?.trim()) {
      newErrors.customPassword = 'Password is required when not auto-generating';
    }

    if (!formData.generatePassword && formData.customPassword && formData.customPassword.length < 8) {
      newErrors.customPassword = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        role: formData.role,
        companyName: formData.role === 'CORPORATE_ADMIN' ? formData.companyName.trim() : undefined,
        password: formData.generatePassword ? undefined : formData.customPassword,
        sendWelcomeEmail: formData.sendWelcomeEmail
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${formData.firstName} ${formData.lastName} has been created successfully.`
        });

        if (result.tempPassword) {
          setCreatedUser({
            ...result.user,
            tempPassword: result.tempPassword
          });
          setShowSuccessModal(true);
        } else {
          onSuccess();
          onClose();
          resetForm();
        }
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create user',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while creating the user.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'EMPLOYEE',
      companyName: '',
      sendWelcomeEmail: true,
      generatePassword: true,
      customPassword: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const copyPasswordToClipboard = async () => {
    if (createdUser?.tempPassword) {
      try {
        await navigator.clipboard.writeText(createdUser.tempPassword);
        toast({
          title: 'Copied',
          description: 'Password copied to clipboard'
        });
      } catch (err) {
        console.error('Failed to copy password:', err);
        toast({
          title: 'Error',
          description: 'Failed to copy password to clipboard',
          variant: 'destructive'
        });
      }
    }
  };

  // Success modal for displaying generated password
  if (showSuccessModal && createdUser) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <span>User Created Successfully!</span>
            </DialogTitle>
            <DialogDescription>
              The user has been created with a temporary password. Make sure to share this with them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">User Details:</span>
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {createdUser.firstName} {createdUser.lastName}</div>
                <div><span className="font-medium">Email:</span> {createdUser.email}</div>
                <div><span className="font-medium">Role:</span> {createdUser.role}</div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-yellow-800">Temporary Password:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyPasswordToClipboard}
                  className="h-8"
                >
                  Copy
                </Button>
              </div>
              <code className="text-sm font-mono bg-yellow-100 px-2 py-1 rounded">
                {createdUser.tempPassword}
              </code>
              <p className="text-xs text-yellow-700 mt-2">
                The user will be required to change this password on first login.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedUser(null);
                  resetForm();
                }}
              >
                Create Another User
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  setCreatedUser(null);
                  onSuccess();
                  onClose();
                  resetForm();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <span>Add New User</span>
          </DialogTitle>
          <DialogDescription>
            Create a new user account. They will receive login credentials and can access the system based on their assigned role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter first name"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter last name"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@company.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Employee</span>
                  </div>
                </SelectItem>
                {user?.role === 'ADMIN' || user?.role === 'CORPORATE_ADMIN' ? (
                  <SelectItem value="CORPORATE_ADMIN">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <span>Corporate Admin</span>
                    </div>
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          {/* Company Name - required for Corporate Admin */}
          {formData.role === 'CORPORATE_ADMIN' && (
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Enter company name"
                className={errors.companyName ? 'border-red-500' : ''}
              />
              {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>}
              <p className="text-xs text-gray-500 mt-1">
                This will create a new corporate account for the admin user.
              </p>
            </div>
          )}

          {/* Password Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="generatePassword"
                checked={formData.generatePassword}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, generatePassword: checked as boolean, customPassword: '' })
                }
              />
              <Label htmlFor="generatePassword" className="text-sm">
                Generate temporary password automatically
              </Label>
            </div>

            {!formData.generatePassword && (
              <div>
                <Label htmlFor="customPassword">Custom Password</Label>
                <div className="relative">
                  <Input
                    id="customPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.customPassword || ''}
                    onChange={(e) => setFormData({ ...formData, customPassword: e.target.value })}
                    placeholder="Enter password (min 8 characters)"
                    className={errors.customPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.customPassword && <p className="text-sm text-red-500 mt-1">{errors.customPassword}</p>}
              </div>
            )}
          </div>

          {/* Email Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendWelcomeEmail"
              checked={formData.sendWelcomeEmail}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, sendWelcomeEmail: checked as boolean })
              }
            />
            <Label htmlFor="sendWelcomeEmail" className="text-sm">
              Send welcome email with login instructions
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
