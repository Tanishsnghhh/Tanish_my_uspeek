'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, Save, X, CheckCircle, AlertCircle, Building, 
  Mail, Phone, MapPin, Briefcase, Users, Key
} from 'lucide-react';
import { EmployeeSuccessModal } from './employee-success-modal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  city: string;
  state: string;
  country: string;
  bio: string;
  licenseType: string;
  region: string;
  zone: string;
  batch: string;
  sendWelcomeEmail: boolean;
  assignLearningPath: boolean;
  updateExisting: boolean; // New field to handle existing records
}

interface LicenseOption {
  id: string;
  type: string;
  description: string;
  available: boolean;
}

interface DepartmentOption {
  id: string;
  name: string;
  description: string;
}

export function AddEmployee({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    jobTitle: '',
    city: '',
    state: '',
    country: '',
    bio: '',
    licenseType: '',
    region: '',
    zone: '',
    batch: '',
    sendWelcomeEmail: true,
    assignLearningPath: true,
    updateExisting: false // Initialize new field
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'basic' | 'details' | 'license' | 'review'>('basic');
  const [errors, setErrors] = useState<Partial<EmployeeFormData>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);

  // Mock data - replace with actual API calls
  const licenseOptions: LicenseOption[] = [
    { id: '', type: 'No License (Assign Later)', description: 'No license assigned - can be assigned individually later', available: true },
    { id: 'USPEAK_BASIC', type: 'USpeak Pro Basic', description: 'Core communication training', available: true },
    { id: 'USPEAK_PRO', type: 'USpeak Pro Advanced', description: 'Advanced skills + leadership', available: true },
    { id: 'USPEAK_ENTERPRISE', type: 'USpeak Pro Enterprise', description: 'Full platform access + coaching', available: false }
  ];

  const departmentOptions: DepartmentOption[] = [
    { id: 'Sales', name: 'Sales', description: 'Sales and business development' },
    { id: 'Marketing', name: 'Marketing', description: 'Marketing and communications' },
    { id: 'Engineering', name: 'Engineering', description: 'Product development and engineering' },
    { id: 'HR', name: 'HR', description: 'Human resources and people operations' },
    { id: 'Finance', name: 'Finance', description: 'Financial planning and accounting' },
    { id: 'Operations', name: 'Operations', description: 'Business operations and support' }
  ];

  const handleInputChange = (field: keyof EmployeeFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (currentStep: string): boolean => {
    const newErrors: Partial<EmployeeFormData> = {};

    if (currentStep === 'basic') {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.department) newErrors.department = 'Department is required';
      if (!formData.jobTitle.trim()) newErrors.jobTitle = 'Job title is required';
    }

    if (currentStep === 'details') {
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State/Province is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
    }

    if (currentStep === 'license') {
      // License type is now optional - no validation required
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    console.log('Next Step button clicked, current step:', step);
    const isValid = validateStep(step);
    console.log('Validation result:', isValid);
    if (!isValid) {
      console.log('Validation errors:', errors);
    }
    if (isValid) {
      switch (step) {
        case 'basic':
          setStep('details');
          console.log('Moving to details step');
          break;
        case 'details':
          setStep('license');
          console.log('Moving to license step');
          break;
        case 'license':
          setStep('review');
          console.log('Moving to review step');
          break;
      }
    }
  };

  const prevStep = () => {
    switch (step) {
      case 'details':
        setStep('basic');
        break;
      case 'license':
        setStep('details');
        break;
      case 'review':
        setStep('license');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      // Check if user is authenticated
      if (!user) {
        toast({ 
          title: 'Error', 
          description: 'Please log in to create employees.', 
          variant: 'destructive' 
        });
        return;
      }

      // Debug: Check the user object structure
      console.log('Full user object:', JSON.stringify(user, null, 2));
      console.log('user.id:', user.id);
      console.log('user.corporateAccountId:', user.corporateAccountId);
      console.log('typeof user.id:', typeof user.id);
      console.log('typeof user.corporateAccountId:', typeof user.corporateAccountId);
      
      // Clean and validate the corporate account ID
      const rawCorporateAccountId = user.corporateAccountId || user.id;
      console.log('rawCorporateAccountId before string conversion:', rawCorporateAccountId);
      
      let cleanCorporateAccountId;
      try {
        cleanCorporateAccountId = String(rawCorporateAccountId).trim();
      } catch (error) {
        console.error('Error converting to string:', error);
        toast({ 
          title: 'Error', 
          description: 'Invalid user data. Please log out and log in again.', 
          variant: 'destructive' 
        });
        return;
      }
      
      // Check if the ID looks like a valid ObjectId (24 hex characters)
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      
      let corporateAccountId;
      if (objectIdRegex.test(cleanCorporateAccountId)) {
        corporateAccountId = cleanCorporateAccountId;
      } else {
        // Try to extract a valid ObjectId from the string
        const objectIdMatch = cleanCorporateAccountId.match(/[0-9a-fA-F]{24}/);
        if (objectIdMatch) {
          corporateAccountId = objectIdMatch[0];
        } else {
          console.error('No valid ObjectId found in:', cleanCorporateAccountId);
          console.log('=== DEBUGGING INFO ===');
          console.log('localStorage uspeak_user:', localStorage.getItem('uspeak_user'));
          console.log('localStorage uspeak_token:', localStorage.getItem('uspeak_token'));
          console.log('localStorage uspeak_role:', localStorage.getItem('uspeak_role'));
          console.log('=== END DEBUGGING INFO ===');
          console.log('To fix this issue, run: localStorage.clear(); then refresh and log in again');
          
          toast({ 
            title: 'Corrupted User Data', 
            description: 'Your login data is corrupted. Please log out and log in again, or refresh the page.', 
            variant: 'destructive',
            duration: 10000
          });
          return;
        }
      }
      
      // Prepare employee data
      const employeeData = {
        ...formData,
        licenseType: formData.licenseType,
        corporateAccountId: corporateAccountId,
        // Include custom attributes
        customAttributes: {
          region: formData.region,
          zone: formData.zone,
          batch: formData.batch
        }
      };

      console.log('Creating employee with data:', employeeData);
      console.log('Raw corporate account ID:', rawCorporateAccountId);
      console.log('Raw length:', rawCorporateAccountId?.length);
      console.log('Clean corporate account ID:', cleanCorporateAccountId);
      console.log('Clean length:', cleanCorporateAccountId?.length);
      console.log('Final corporate account ID:', corporateAccountId);
      console.log('Final length:', corporateAccountId?.length);
      console.log('User object keys:', Object.keys(user));

      // Call API to create employee
      const token = localStorage.getItem('uspeak_token');
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(employeeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle email already exists error with better messaging
        if (response.status === 409 && errorData.error === 'Email already exists') {
          let errorMessage = errorData.error;
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
          if (errorData.suggestion) {
            errorMessage += `\n\n${errorData.suggestion}`;
          }
          
          // Show detailed error with existing record info
          toast({ 
            title: 'Email Already Exists', 
            description: errorMessage, 
            variant: 'destructive',
            duration: 8000 // Show longer for complex errors
          });
          
          // Log existing record details for debugging
          if (errorData.existingRecord) {
            console.log('Existing record details:', errorData.existingRecord);
          }

          // Stop processing further to avoid reading response body again
          return;
        } else {
          // Handle other types of errors
          const errorMessage = errorData.error || 'Failed to create employee';
          const errorDetails = errorData.details || '';
          const fullMessage = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
          
          toast({ 
            title: 'Error Creating Employee', 
            description: fullMessage, 
            variant: 'destructive',
            duration: 8000
          });
          
          console.error('Employee creation error:', errorData);
          return; // Don't proceed with success flow
        }
      }

      const result = await response.json();

      // If the backend indicates the record already exists, surface it and stop
      if (result && result.existing) {
        toast({
          title: 'Employee Exists',
          description: result.message || 'A user and employee profile already exist for this email.',
          variant: 'default',
        });
        console.log('Existing record returned from API:', result.existingRecord);
        // call onSuccess if you want to refresh lists
        onSuccess();
        return;
      }

      // Notify success to user
      const action = formData.updateExisting ? 'updated' : 'created';
      toast({ 
        title: `Employee ${action}`, 
        description: `${formData.firstName} ${formData.lastName} was ${action}.` 
      });
       
      // Show success modal
      if (result.employee?.tempPassword) {
        setCreatedEmployee(result.employee);
        setShowSuccessModal(true);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({ 
        title: 'Error Creating Employee', 
        description: errorMessage, 
        variant: 'destructive',
        duration: 8000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const getStepStatus = (stepName: string) => {
    if (step === stepName) return 'current';
    if (['basic', 'details', 'license', 'review'].indexOf(stepName) < ['basic', 'details', 'license', 'review'].indexOf(step)) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="bg-white shadow-xl">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Add New Employee</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              {['basic', 'details', 'license', 'review'].map((stepName, index) => (
                <div key={stepName} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    getStepStatus(stepName) === 'completed' ? 'bg-green-600 text-white' :
                    getStepStatus(stepName) === 'current' ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {getStepStatus(stepName) === 'completed' ? '✓' : index + 1}
                  </div>
                  <span className={`text-sm ${
                    getStepStatus(stepName) === 'completed' ? 'text-green-600' :
                    getStepStatus(stepName) === 'current' ? 'text-blue-600' :
                    'text-gray-500'
                  }`}>
                    {stepName === 'basic' ? 'Basic Info' :
                     stepName === 'details' ? 'Location' :
                     stepName === 'license' ? 'License' : 'Review'}
                  </span>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 ${
                      getStepStatus(stepName) === 'completed' ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Basic Information */}
            {step === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`mt-1 ${errors.firstName ? 'border-red-500' : ''}`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`mt-1 ${errors.lastName ? 'border-red-500' : ''}`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="employee@company.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-1"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Update Existing Record Option */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="updateExisting"
                    checked={formData.updateExisting}
                    onChange={(e) => handleInputChange('updateExisting', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="updateExisting" className="text-sm text-gray-700">
                    Update existing employee record if email already exists
                  </Label>
                </div>
                {formData.updateExisting && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-sm text-yellow-700">
                      ⚠️ This will update the existing employee record instead of creating a new one.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                      Department *
                    </Label>
                    <select
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`mt-1 w-full rounded-md border border-gray-300 px-3 py-2 ${errors.department ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Department</option>
                      {departmentOptions.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
                      Job Title *
                    </Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className={`mt-1 ${errors.jobTitle ? 'border-red-500' : ''}`}
                      placeholder="Enter job title"
                    />
                    {errors.jobTitle && (
                      <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="batch" className="text-sm font-medium text-gray-700">
                    Batch
                  </Label>
                  <Input
                    id="batch"
                    value={formData.batch}
                    onChange={(e) => handleInputChange('batch', e.target.value)}
                    className="mt-1"
                    placeholder="e.g., Batch 2024-Q1"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location Details */}
            {step === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City *
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`mt-1 ${errors.city ? 'border-red-500' : ''}`}
                      placeholder="Enter city"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                      State/Province *
                    </Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={`mt-1 ${errors.state ? 'border-red-500' : ''}`}
                      placeholder="Enter state"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Country *
                    </Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`mt-1 ${errors.country ? 'border-red-500' : ''}`}
                      placeholder="Enter country"
                    />
                    {errors.country && (
                      <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                    Bio/Description
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="mt-1"
                    placeholder="Brief description of the employee's role and responsibilities..."
                  />
                </div>
              </div>
            )}

            {/* Step 3: License Assignment */}
            {step === 'license' && (
              <div className="space-y-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Key className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">License Assignment</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Assign a USpeak Pro license to give this employee access to the platform.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {licenseOptions.map(license => (
                    <div
                      key={license.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        formData.licenseType === license.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${!license.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => license.available && handleInputChange('licenseType', license.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="licenseType"
                            value={license.id}
                            checked={formData.licenseType === license.id}
                            onChange={() => license.available && handleInputChange('licenseType', license.id)}
                            disabled={!license.available}
                            className="text-blue-600"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{license.type}</h4>
                            <p className="text-sm text-gray-600">{license.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {license.available ? (
                            <Badge className="bg-green-100 text-green-800">Available</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Unavailable</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.licenseType && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.licenseType}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="sendWelcomeEmail"
                      checked={formData.sendWelcomeEmail}
                      onChange={(e) => handleInputChange('sendWelcomeEmail', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="sendWelcomeEmail" className="text-sm text-gray-700">
                      Send welcome email with login credentials
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="assignLearningPath"
                      checked={formData.assignLearningPath}
                      onChange={(e) => handleInputChange('assignLearningPath', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="assignLearningPath" className="text-sm text-gray-700">
                      Assign initial learning path and assignments
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Review Employee Details</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Please review all information before creating the employee account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</div>
                      <div><span className="font-medium">Email:</span> {formData.email}</div>
                      <div><span className="font-medium">Phone:</span> {formData.phone || 'Not provided'}</div>
                      <div><span className="font-medium">Department:</span> {departmentOptions.find(d => d.id === formData.department)?.name}</div>
                      <div><span className="font-medium">Job Title:</span> {formData.jobTitle}</div>
                      <div><span className="font-medium">Region:</span> {formData.region || 'Not specified'}</div>
                      <div><span className="font-medium">Zone:</span> {formData.zone || 'Not specified'}</div>
                      <div><span className="font-medium">Batch:</span> {formData.batch || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Location Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Location:</span> {formData.city}, {formData.state}, {formData.country}</div>
                      <div><span className="font-medium">Bio:</span> {formData.bio || 'Not provided'}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">License & Access</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">License Type:</span> {formData.licenseType ? licenseOptions.find(l => l.id === formData.licenseType)?.type : 'No License (Assign Later)'}</div>
                    <div><span className="font-medium">Welcome Email:</span> {formData.sendWelcomeEmail ? 'Yes' : 'No'}</div>
                    <div><span className="font-medium">Learning Path:</span> {formData.assignLearningPath ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Account Creation</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        A temporary password will be generated and sent to the employee's email address. 
                        They will be required to change it on their first login.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <div>
                {step !== 'basic' && (
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex space-x-3">
                {step !== 'review' ? (
                  <Button onClick={nextStep}>
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting 
                      ? (formData.updateExisting ? 'Updating Employee...' : 'Creating Employee...') 
                      : (formData.updateExisting ? 'Update Employee' : 'Create Employee')
                    }
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdEmployee && (
        <EmployeeSuccessModal
          employee={createdEmployee}
          onClose={() => {
            setShowSuccessModal(false);
            onSuccess();
          }}
          onContinue={() => {
            setShowSuccessModal(false);
            // Reset form and start over
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              department: '',
              jobTitle: '',
              city: '',
              state: '',
              country: '',
              bio: '',
              licenseType: '',
              region: '',
              zone: '',
              batch: '',
              sendWelcomeEmail: true,
              assignLearningPath: true,
              updateExisting: false // Reset updateExisting
            });
            setStep('basic');
            setErrors({});
          }}
        />
      )}
    </div>
  );
}
