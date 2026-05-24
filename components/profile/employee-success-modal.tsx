'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, Copy, Mail, Key, User, ArrowRight, X
} from 'lucide-react';
import { useState } from 'react';

interface EmployeeSuccessModalProps {
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    tempPassword: string;
  };
  onClose: () => void;
  onContinue: () => void;
}

export function EmployeeSuccessModal({ employee, onClose, onContinue }: EmployeeSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(employee.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl mx-4">
        <Card className="bg-white shadow-xl">
          <CardHeader className="text-center border-b">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">Employee Created Successfully!</CardTitle>
            <p className="text-gray-600 mt-2">
              {employee.firstName} {employee.lastName} now has access to the USpeak Pro platform
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Employee Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Employee Account Created</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Email: <span className="font-mono">{employee.email}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Temporary Password */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900">Temporary Password</h4>
                  <p className="text-sm text-yellow-700 mt-1 mb-3">
                    This password has been sent to the employee's email. They must change it on first login.
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-white border border-yellow-200 rounded px-3 py-2 font-mono text-sm">
                      {employee.tempPassword}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="whitespace-nowrap"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3">What Happens Next?</h4>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Welcome email sent to {employee.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Employee can login with email and temporary password</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Password change required on first login</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Learning path and assignments assigned automatically</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
              <Button onClick={onContinue} className="flex-1">
                Add Another Employee
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
