'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, Download, FileText, CheckCircle, AlertCircle, 
  Users, X, Eye, ArrowRight, Settings, RefreshCw, Key
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
  jobTitle: string;
  attribute1Value: string;
  attribute2Value: string;
  attribute3Value: string;
  attribute4Value: string;
  employeeId: string;
  hireDate: string;
  isActive: string;
}

interface CSVMapping {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  department: string;
  jobTitle: string;
  attribute1Value: string;
  attribute2Value: string;
  attribute3Value: string;
  attribute4Value: string;
  employeeId: string;
  hireDate: string;
  isActive: string;
}

interface CSVRow {
  [key: string]: string;
}

interface UploadResult {
  success: number;
  failed: number;
  created: number;
  updated: number;
  errors: string[];
  createdEmployees?: Array<{
    firstName: string;
    lastName: string;
    email: string;
    tempPassword: string;
    employeeId: string;
  }>;
}

export function CSVUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CSVMapping>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    department: '',
    jobTitle: '',
    attribute1Value: '',
    attribute2Value: '',
    attribute3Value: '',
    attribute4Value: '',
    employeeId: '',
    hireDate: '',
    isActive: ''
  });
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [step, setStep] = useState<'upload' | 'mapping' | 'review' | 'complete'>('upload');
  const [updateExisting, setUpdateExisting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: '❌ Invalid File Type',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').filter(row => row.trim());
      const csvHeaders = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const csvRows = rows.slice(1).map(row => {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
        const rowData: CSVRow = {};
        csvHeaders.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });
        return rowData;
      });

      setHeaders(csvHeaders);
      setCsvData(csvRows);
      setIsUploading(false);
      setStep('mapping');
      
      toast({
        title: '📁 File Uploaded Successfully',
        description: `Found ${csvRows.length} rows in the CSV file`,
        variant: 'default'
      });
    };

    reader.readAsText(file);
  };

  const handleMappingChange = (field: keyof CSVMapping, value: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateMapping = () => {
    const requiredFields = ['firstName', 'lastName', 'email'];
    const missingFields = requiredFields.filter(field => !mapping[field as keyof CSVMapping]);
    
    if (missingFields.length > 0) {
      toast({
        title: '❌ Missing Required Fields',
        description: `Please map the following required fields: ${missingFields.join(', ')}`,
        variant: 'destructive'
      });
      return false;
    }
    
    return true;
  };

  const proceedToReview = () => {
    if (validateMapping()) {
      setStep('review');
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    
    try {
      // Transform CSV data to match API format
      const employees = csvData.map(row => ({
        firstName: row[mapping.firstName] || '',
        lastName: row[mapping.lastName] || '',
        email: row[mapping.email] || '',
        phoneNumber: row[mapping.phoneNumber] || '',
        department: row[mapping.department] || '',
        jobTitle: row[mapping.jobTitle] || '',
        attribute1Value: row[mapping.attribute1Value] || '',
        attribute2Value: row[mapping.attribute2Value] || '',
        attribute3Value: row[mapping.attribute3Value] || '',
        attribute4Value: row[mapping.attribute4Value] || '',
        employeeId: row[mapping.employeeId] || '',
        hireDate: row[mapping.hireDate] || '',
        isActive: row[mapping.isActive] || 'true'
      }));

      // Call bulk upload API
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/employees/bulk-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employees,
          updateExisting
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult(result.results);
        setStep('complete');
        
        // Show success dialog if employees were created
        if (result.results.createdEmployees && result.results.createdEmployees.length > 0) {
          setShowSuccessDialog(true);
        }
        
        toast({
          title: '✅ Bulk Upload Successful',
          description: `Created: ${result.results.created}, Updated: ${result.results.updated}, Failed: ${result.results.failed}`,
          variant: 'default'
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during upload';
      toast({
        title: '❌ Upload Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Download the template file from public folder
    const a = document.createElement('a');
    a.href = '/employee_template.csv';
    a.download = 'employee_template.csv';
    a.click();
    
    toast({
      title: '📥 Template Downloaded',
      description: 'Employee CSV template has been downloaded',
      variant: 'default'
    });
  };

  const resetUpload = () => {
    setCsvData([]);
    setHeaders([]);
    setMapping({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      department: '',
      jobTitle: '',
      attribute1Value: '',
      attribute2Value: '',
      attribute3Value: '',
      attribute4Value: '',
      employeeId: '',
      hireDate: '',
      isActive: ''
    });
    setUploadResult(null);
    setUpdateExisting(false);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (step === 'complete') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">Upload Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-gray-600">Successfully processed {uploadResult?.success} employees</p>
            {uploadResult?.created && uploadResult.created > 0 && (
              <p className="text-green-600 font-medium">✅ Created: {uploadResult.created} new employees</p>
            )}
            {uploadResult?.updated && uploadResult.updated > 0 && (
              <p className="text-blue-600 font-medium">🔄 Updated: {uploadResult.updated} existing employees</p>
            )}
            {uploadResult?.failed && uploadResult.failed > 0 && (
              <p className="text-red-600 font-medium">❌ Failed: {uploadResult.failed} records</p>
            )}
          </div>
          
          {uploadResult?.errors && uploadResult.errors.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Errors encountered:</p>
                  <div className="max-h-32 overflow-y-auto">
                    <ul className="list-disc list-inside space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex space-x-3 pt-4">
            <Button onClick={resetUpload} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Upload Another File
            </Button>
            <Button onClick={() => setStep('upload')} className="flex-1">
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5" />
          <span>Bulk Employee Upload</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="hidden sm:inline">Upload CSV</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center space-x-2 ${step === 'mapping' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'mapping' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="hidden sm:inline">Map Fields</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center space-x-2 ${step === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="hidden sm:inline">Review & Upload</span>
          </div>
        </div>

        {/* Step 1: File Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">Upload your employee CSV file</p>
                <p className="text-gray-500">Drag and drop or click to browse</p>
                <p className="text-sm text-gray-400">Supports .csv files up to 5MB</p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-4 max-w-xs mx-auto"
                disabled={isUploading}
              />
            </div>
            
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Field Mapping */}
        {step === 'mapping' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">First Name *</Label>
                <select
                  value={mapping.firstName}
                  onChange={(e) => handleMappingChange('firstName', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Last Name *</Label>
                <select
                  value={mapping.lastName}
                  onChange={(e) => handleMappingChange('lastName', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Email *</Label>
                <select
                  value={mapping.email}
                  onChange={(e) => handleMappingChange('email', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                <select
                  value={mapping.phoneNumber}
                  onChange={(e) => handleMappingChange('phoneNumber', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Department</Label>
                <select
                  value={mapping.department}
                  onChange={(e) => handleMappingChange('department', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Job Title</Label>
                <select
                  value={mapping.jobTitle}
                  onChange={(e) => handleMappingChange('jobTitle', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Region</Label>
                <select
                  value={mapping.attribute1Value}
                  onChange={(e) => handleMappingChange('attribute1Value', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Zone</Label>
                <select
                  value={mapping.attribute2Value}
                  onChange={(e) => handleMappingChange('attribute2Value', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Batch</Label>
                <select
                  value={mapping.attribute3Value}
                  onChange={(e) => handleMappingChange('attribute3Value', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Branch</Label>
                <select
                  value={mapping.attribute4Value}
                  onChange={(e) => handleMappingChange('attribute4Value', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Hire Date</Label>
                <select
                  value={mapping.hireDate}
                  onChange={(e) => handleMappingChange('hireDate', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Is Active</Label>
                <select
                  value={mapping.isActive}
                  onChange={(e) => handleMappingChange('isActive', e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select CSV column</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={resetUpload}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={proceedToReview}>
                Review Data
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Upload */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Preview (showing first 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Email</th>
                      <th className="text-left py-2 px-2">Department</th>
                      <th className="text-left py-2 px-2">Job Title</th>
                      <th className="text-left py-2 px-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-2">
                          {row[mapping.firstName]} {row[mapping.lastName]}
                        </td>
                        <td className="py-2 px-2">{row[mapping.email]}</td>
                        <td className="py-2 px-2">{row[mapping.department]}</td>
                        <td className="py-2 px-2">{row[mapping.jobTitle]}</td>
                        <td className="py-2 px-2">{row[mapping.phoneNumber]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... and {csvData.length - 5} more rows
                </p>
              )}
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Ready to upload {csvData.length} employees</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This will create new employee accounts and assign USpeak Pro licenses automatically.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="updateExisting"
                checked={updateExisting}
                onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
              />
              <Label htmlFor="updateExisting" className="text-sm">
                Update existing employees if email already exists
              </Label>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back to Mapping
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Employees'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Success Dialog */}
    {showSuccessDialog && uploadResult?.createdEmployees && uploadResult.createdEmployees.length > 0 && (
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
                    <h4 className="font-medium text-green-900">Bulk CSV Upload Complete</h4>
                    <p className="text-sm text-green-700 mt-1">
                      {uploadResult.createdEmployees.length} employee(s) have been successfully created from your CSV file.
                      Below are their temporary passwords. Please save these passwords securely as they will be needed for the employees to log in.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Employee Credentials</h4>
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {uploadResult.createdEmployees.map((employee, index) => (
                    <Card key={index} className="p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{employee.email}</div>
                          <div className="text-xs text-gray-500">ID: {employee.employeeId}</div>
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
                  resetUpload();
                }}>
                  Upload Another File
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
