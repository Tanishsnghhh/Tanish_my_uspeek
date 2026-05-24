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
  Mail, Phone, MapPin, Briefcase, Users, Key, Upload, Plus, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface BulkEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  jobTitle: string;
  region?: string;
  zone?: string;
  batch?: string;
}

interface BulkEmployeeFormData {
  employees: BulkEmployeeData[];
  sharedDepartment: string;
  sharedJobTitle: string;
  sharedRegion: string;
  sharedZone: string;
  sharedBatch: string;
  licenseType: string;
  sendWelcomeEmail: boolean;
  assignLearningPath: boolean;
}

export function BulkAddEmployee({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'setup' | 'employees' | 'review'>('setup');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdEmployees, setCreatedEmployees] = useState<Array<{
    firstName: string;
    lastName: string;
    email: string;
    tempPassword: string;
  }>>([]);

  const [formData, setFormData] = useState<BulkEmployeeFormData>({
    employees: [
      { firstName: '', lastName: '', email: '', phone: '', department: '', jobTitle: '', region: '', zone: '', batch: '' },
      { firstName: '', lastName: '', email: '', phone: '', department: '', jobTitle: '', region: '', zone: '', batch: '' },
      { firstName: '', lastName: '', email: '', phone: '', department: '', jobTitle: '', region: '', zone: '', batch: '' }
    ],
    sharedDepartment: '',
    sharedJobTitle: '',
    sharedRegion: '',
    sharedZone: '',
    sharedBatch: '',
    licenseType: '',
    sendWelcomeEmail: true,
    assignLearningPath: true
  });

  const licenseOptions = [
    { id: '', type: 'No License (Assign Later)', description: 'No license assigned - can be assigned individually later' },
    { id: 'USPEAK_BASIC', type: 'USpeak Pro Basic', description: 'Core communication training' },
    { id: 'USPEAK_PRO', type: 'USpeak Pro Advanced', description: 'Advanced skills + leadership' },
    { id: 'USPEAK_ENTERPRISE', type: 'USpeak Pro Enterprise', description: 'Full platform access + coaching' }
  ];

  const handleInputChange = (field: keyof BulkEmployeeFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const handleEmployeeChange = (index: number, field: keyof BulkEmployeeData, value: string) => {
    setFormData(prev => ({
      ...prev,
      employees: prev.employees.map((emp, i) =>
        i === index ? { ...emp, [field]: value } : emp
      )
    }));
  };

  const addEmployee = () => {
    setFormData(prev => ({
      ...prev,
      employees: [...prev.employees, {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: prev.sharedDepartment,
        jobTitle: prev.sharedJobTitle,
        region: prev.sharedRegion,
        zone: prev.sharedZone,
        batch: prev.sharedBatch
      }]
    }));
  };

  const removeEmployee = (index: number) => {
    if (formData.employees.length > 1) {
      setFormData(prev => ({
        ...prev,
        employees: prev.employees.filter((_, i) => i !== index)
      }));
    }
  };

  const applySharedValues = () => {
    setFormData(prev => ({
      ...prev,
      employees: prev.employees.map(emp => ({
        ...emp,
        department: prev.sharedDepartment || emp.department,
        jobTitle: prev.sharedJobTitle || emp.jobTitle,
        region: prev.sharedRegion || emp.region,
        zone: prev.sharedZone || emp.zone,
        batch: prev.sharedBatch || emp.batch
      }))
    }));
  };

  const validateStep = (currentStep: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'setup') {
      if (!formData.sharedDepartment.trim()) newErrors.sharedDepartment = 'Department is required';
      if (!formData.sharedJobTitle.trim()) newErrors.sharedJobTitle = 'Job title is required';
    }

    if (currentStep === 'employees') {
      formData.employees.forEach((emp, index) => {
        if (!emp.firstName.trim()) newErrors[`employees[${index}].firstName`] = 'First name is required';
        if (!emp.lastName.trim()) newErrors[`employees[${index}].lastName`] = 'Last name is required';
        if (!emp.email.trim()) newErrors[`employees[${index}].email`] = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
          newErrors[`employees[${index}].email`] = 'Please enter a valid email address';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      switch (step) {
        case 'setup':
          setStep('employees');
          break;
        case 'employees':
          setStep('review');
          break;
      }
    }
  };

  const prevStep = () => {
    switch (step) {
      case 'employees':
        setStep('setup');
        break;
      case 'review':
        setStep('employees');
        break;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    try {
      if (!user) {
        toast({
          title: 'Error',
          description: 'Please log in to create employees.',
          variant: 'destructive'
        });
        return;
      }

      // Prepare bulk employee data
      const employeesToCreate = formData.employees.map(emp => ({
        ...emp,
        department: emp.department || formData.sharedDepartment,
        jobTitle: emp.jobTitle || formData.sharedJobTitle,
        region: emp.region || formData.sharedRegion,
        zone: emp.zone || formData.sharedZone,
        batch: emp.batch || formData.sharedBatch,
        licenseType: formData.licenseType,
        sendWelcomeEmail: formData.sendWelcomeEmail,
        assignLearningPath: formData.assignLearningPath,
        corporateAccountId: user.corporateAccountId || user.id,
        // Include custom attributes
        customAttributes: {
          region: emp.region || formData.sharedRegion,
          zone: emp.zone || formData.sharedZone,
          batch: emp.batch || formData.sharedBatch
        }
      }));

      // Create employees one by one (could be optimized with batch API)
      const results = [];
      const successfulCreations = [];
      for (const employeeData of employeesToCreate) {
        try {
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
            throw new Error(errorData.error || 'Failed to create employee');
          }

          const result = await response.json();
          results.push(result);
          
          // Collect successful creations with temp passwords
          if (result.success && result.employee) {
            successfulCreations.push({
              firstName: result.employee.firstName,
              lastName: result.employee.lastName,
              email: result.employee.email,
              tempPassword: result.employee.tempPassword
            });
          }
        } catch (error) {
          console.error('Error creating employee:', employeeData.email, error);
          results.push({ error: error instanceof Error ? error.message : 'Unknown error', email: employeeData.email });
        }
      }

      const successCount = results.filter(r => !r.error).length;
      const errorCount = results.filter(r => r.error).length;

      if (successCount > 0) {
        // Set the created employees for the success dialog
        setCreatedEmployees(successfulCreations);
        setShowSuccessDialog(true);
        
        toast({
          title: 'Bulk Employee Creation',
          description: `Successfully created ${successCount} employee(s). ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
          variant: errorCount > 0 ? 'default' : 'default'
        });
        
        if (errorCount === 0) {
          onSuccess();
        }
      } else {
        toast({
          title: 'Bulk Creation Failed',
          description: 'Failed to create any employees. Please check the data and try again.',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Error in bulk employee creation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create employees. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (stepName: string) => {
    if (step === stepName) return 'current';
    if (['setup', 'employees', 'review'].indexOf(stepName) < ['setup', 'employees', 'review'].indexOf(step)) {
      return 'completed';
    }
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="bg-white shadow-xl">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Bulk Add Employees</span>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              {['setup', 'employees', 'review'].map((stepName, index) => (
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
                    {stepName === 'setup' ? 'Shared Settings' :
                     stepName === 'employees' ? 'Employee Details' : 'Review'}
                  </span>
                  {index < 2 && (
                    <div className={`w-16 h-0.5 ${
                      getStepStatus(stepName) === 'completed' ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Shared Settings */}
            {step === 'setup' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Bulk Employee Creation</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Set up shared attributes that will be applied to all employees. You can override these for individual employees in the next step.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="sharedDepartment" className="text-sm font-medium text-gray-700">
                      Department *
                    </Label>
                    <Input
                      id="sharedDepartment"
                      value={formData.sharedDepartment}
                      onChange={(e) => handleInputChange('sharedDepartment', e.target.value)}
                      className={`mt-1 ${errors.sharedDepartment ? 'border-red-500' : ''}`}
                      placeholder="e.g., Sales, Marketing, Engineering"
                    />
                    {errors.sharedDepartment && (
                      <p className="text-red-500 text-sm mt-1">{errors.sharedDepartment}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="sharedJobTitle" className="text-sm font-medium text-gray-700">
                      Job Title *
                    </Label>
                    <Input
                      id="sharedJobTitle"
                      value={formData.sharedJobTitle}
                      onChange={(e) => handleInputChange('sharedJobTitle', e.target.value)}
                      className={`mt-1 ${errors.sharedJobTitle ? 'border-red-500' : ''}`}
                      placeholder="e.g., Sales Representative"
                    />
                    {errors.sharedJobTitle && (
                      <p className="text-red-500 text-sm mt-1">{errors.sharedJobTitle}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="sharedRegion" className="text-sm font-medium text-gray-700">
                      Region
                    </Label>
                    <Input
                      id="sharedRegion"
                      value={formData.sharedRegion}
                      onChange={(e) => handleInputChange('sharedRegion', e.target.value)}
                      className="mt-1"
                      placeholder="e.g., North America"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sharedZone" className="text-sm font-medium text-gray-700">
                      Zone
                    </Label>
                    <Input
                      id="sharedZone"
                      value={formData.sharedZone}
                      onChange={(e) => handleInputChange('sharedZone', e.target.value)}
                      className="mt-1"
                      placeholder="e.g., Eastern Zone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sharedBatch" className="text-sm font-medium text-gray-700">
                      Batch
                    </Label>
                    <Input
                      id="sharedBatch"
                      value={formData.sharedBatch}
                      onChange={(e) => handleInputChange('sharedBatch', e.target.value)}
                      className="mt-1"
                      placeholder="e.g., Batch 2024-Q1"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">License Type</Label>
                    <select
                      value={formData.licenseType}
                      onChange={(e) => handleInputChange('licenseType', e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      {licenseOptions.map(license => (
                        <option key={license.id} value={license.id}>{license.type}</option>
                      ))}
                    </select>
                  </div>

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

            {/* Step 2: Employee Details */}
            {step === 'employees' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Employee Details</h3>
                    <p className="text-sm text-gray-600">Add details for each employee. Fields marked with * are required.</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={applySharedValues}>
                      Apply Shared Values
                    </Button>
                    <Button variant="outline" size="sm" onClick={addEmployee}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {formData.employees.map((employee, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Employee {index + 1}</h4>
                        {formData.employees.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmployee(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">First Name *</Label>
                          <Input
                            value={employee.firstName}
                            onChange={(e) => handleEmployeeChange(index, 'firstName', e.target.value)}
                            className={`mt-1 ${errors[`employees[${index}].firstName`] ? 'border-red-500' : ''}`}
                            placeholder="Enter first name"
                          />
                          {errors[`employees[${index}].firstName`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`employees[${index}].firstName`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Last Name *</Label>
                          <Input
                            value={employee.lastName}
                            onChange={(e) => handleEmployeeChange(index, 'lastName', e.target.value)}
                            className={`mt-1 ${errors[`employees[${index}].lastName`] ? 'border-red-500' : ''}`}
                            placeholder="Enter last name"
                          />
                          {errors[`employees[${index}].lastName`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`employees[${index}].lastName`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Email *</Label>
                          <Input
                            type="email"
                            value={employee.email}
                            onChange={(e) => handleEmployeeChange(index, 'email', e.target.value)}
                            className={`mt-1 ${errors[`employees[${index}].email`] ? 'border-red-500' : ''}`}
                            placeholder="employee@company.com"
                          />
                          {errors[`employees[${index}].email`] && (
                            <p className="text-red-500 text-sm mt-1">{errors[`employees[${index}].email`]}</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Phone</Label>
                          <Input
                            value={employee.phone}
                            onChange={(e) => handleEmployeeChange(index, 'phone', e.target.value)}
                            className="mt-1"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Department (Override)</Label>
                          <Input
                            value={employee.department}
                            onChange={(e) => handleEmployeeChange(index, 'department', e.target.value)}
                            className="mt-1"
                            placeholder="Leave empty to use shared department"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Job Title (Override)</Label>
                          <Input
                            value={employee.jobTitle}
                            onChange={(e) => handleEmployeeChange(index, 'jobTitle', e.target.value)}
                            className="mt-1"
                            placeholder="Leave empty to use shared job title"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Review Bulk Employee Creation</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Please review all employee details before creating the accounts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Shared Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Department:</span> {formData.sharedDepartment}</div>
                      <div><span className="font-medium">Job Title:</span> {formData.sharedJobTitle}</div>
                      <div><span className="font-medium">Region:</span> {formData.sharedRegion || 'Not set'}</div>
                      <div><span className="font-medium">Zone:</span> {formData.sharedZone || 'Not set'}</div>
                      <div><span className="font-medium">Batch:</span> {formData.sharedBatch || 'Not set'}</div>
                      <div><span className="font-medium">License:</span> {formData.licenseType ? licenseOptions.find(l => l.id === formData.licenseType)?.type : 'No License (Assign Later)'}</div>
                      <div><span className="font-medium">Welcome Email:</span> {formData.sendWelcomeEmail ? 'Yes' : 'No'}</div>
                      <div><span className="font-medium">Learning Path:</span> {formData.assignLearningPath ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Employees to Create ({formData.employees.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {formData.employees.map((emp, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                          <div className="text-sm text-gray-600">{emp.email}</div>
                          <div className="text-xs text-gray-500">
                            {emp.department || formData.sharedDepartment} • {emp.jobTitle || formData.sharedJobTitle}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <div>
                {step !== 'setup' && (
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
                      ? `Creating ${formData.employees.length} Employees...`
                      : `Create ${formData.employees.length} Employees`
                    }
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && createdEmployees.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <Card className="bg-white shadow-xl">
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Employees Created Successfully</span>
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowSuccessDialog(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Bulk Employee Creation Complete</h4>
                      <p className="text-sm text-green-700 mt-1">
                        {createdEmployees.length} employee(s) have been successfully created. Below are their temporary passwords.
                        Please save these passwords securely as they will be needed for the employees to log in.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Employee Credentials</h4>
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {createdEmployees.map((employee, index) => (
                      <Card key={index} className="p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{employee.email}</div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-xs text-gray-500 mb-1">Temporary Password</div>
                              <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border">
                                {employee.tempPassword}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(employee.tempPassword);
                                toast({
                                  title: 'Copied!',
                                  description: 'Password copied to clipboard',
                                });
                              }}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setShowSuccessDialog(false);
                    onClose();
                  }}>
                    Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
