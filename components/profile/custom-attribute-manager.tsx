'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, Save, Plus, X, AlertCircle, CheckCircle, 
  Edit, Trash2, Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { extractAccountIdFromUser } from '@/lib/account-id-utils';

interface CustomAttributeDefinition {
  _id: string;
  position: 1 | 2 | 3 | 4;
  name: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  customAttributes?: { [key: string]: string };
}

interface CustomAttributeManagerProps {
  employee: Employee;
  onClose: () => void;
  onUpdate: () => void;
}

export function CustomAttributeManager({ employee, onClose, onUpdate }: CustomAttributeManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [definitions, setDefinitions] = useState<CustomAttributeDefinition[]>([]);
  const [values, setValues] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isManagingDefinitions, setIsManagingDefinitions] = useState(false);
  const [newDefinitions, setNewDefinitions] = useState<{ position: number; name: string }[]>([
    { position: 1, name: '' },
    { position: 2, name: '' },
    { position: 3, name: '' },
    { position: 4, name: '' }
  ]);

  useEffect(() => {
    fetchCustomAttributeDefinitions();
    loadEmployeeAttributeValues();
  }, []);

  const loadEmployeeValues = () => {
    if (employee.customAttributes) {
      setValues(employee.customAttributes);
    } else {
      setValues({});
    }
  };

  const loadEmployeeAttributeValues = async () => {
    try {
      // Accept either employee.id or employee._id depending on where the component is used
      const employeeId = (employee as any).id || (employee as any)._id;
      if (!employeeId) {
        console.warn('No employee id available for loading attribute values');
        loadEmployeeValues();
        return;
      }

      const response = await fetch(`/api/employee-attribute-values?employeeId=${encodeURIComponent(String(employeeId))}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.attribute_values) {
          // Convert the attribute values to the position-based format for UI compatibility
          const newValues: { [key: string]: string } = {};
          data.attribute_values.forEach((attrValue: any) => {
            // attribute_position may be stored as number or string
            const pos = Number(attrValue.attribute_position);
            if (!Number.isNaN(pos) && pos >= 1 && pos <= 4) {
              newValues[`position_${pos}`] = attrValue.value || '';
            }
          });
          setValues(newValues);
        } else {
          // fallback
          loadEmployeeValues();
        }
      } else {
        // Fallback to old method if new API fails
        loadEmployeeValues();
      }
    } catch (error) {
      console.error('Error loading employee attribute values:', error);
      // Fallback to old method
      loadEmployeeValues();
    }
  };

  const fetchCustomAttributeDefinitions = async () => {
    if (!user?.corporateAccountId && !user?.id) {
      console.log('No user account ID available');
      setIsLoading(false);
      return;
    }

    try {
      let accountId = user.corporateAccountId || user.id;
      
      // Handle case where corporateAccountId might be a serialized object string
      if (typeof accountId === 'string' && accountId.length > 24) {
        // Try to extract ObjectId from serialized object string
        const objectIdMatch = accountId.match(/ObjectId\('([0-9a-fA-F]{24})'\)/);
        if (objectIdMatch && objectIdMatch[1]) {
          accountId = objectIdMatch[1];
        } else {
          // If corporateAccountId is corrupted, fall back to user.id
          accountId = user.id;
        }
      }
      
      // Clean the account ID (trim whitespace only)
      accountId = String(accountId).trim();
      
      // Validate ObjectId format before making request
      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(accountId)) {
        throw new Error(`Invalid account ID format: "${accountId}" (${accountId.length} chars). Expected 24 hex characters.`);
      }
      
      const url = `/api/custom-attributes?accountId=${encodeURIComponent(accountId)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch custom attribute definitions: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setDefinitions(data.definitions || []);
        
        // Initialize newDefinitions with existing data
        const initDefinitions = [
          { position: 1, name: '' },
          { position: 2, name: '' },
          { position: 3, name: '' },
          { position: 4, name: '' }
        ];
        
        data.definitions?.forEach((def: CustomAttributeDefinition) => {
          if (def.position >= 1 && def.position <= 4) {
            initDefinitions[def.position - 1].name = def.name;
          }
        });
        
        setNewDefinitions(initDefinitions);
      }
    } catch (error) {
      console.error('Error fetching custom attribute definitions:', error);
      toast({
        title: 'Error',
        description: `Failed to load custom attribute definitions: ${error}`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDefinitions = async () => {
    if (!user?.corporateAccountId && !user?.id) {
      toast({
        title: 'Error',
        description: 'User account information not available',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const accountId = extractAccountIdFromUser(user);
      
      const attributesToSave = newDefinitions
        .filter(def => def.name.trim())
        .map(def => ({
          position: def.position,
          name: def.name.trim()
        }));
      
      const requestBody = {
        accountId,
        attributes: attributesToSave
      };

      const response = await fetch('/api/custom-attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || 'Failed to save custom attribute definitions');
      }

      const data = await response.json();
      
      if (data.success) {
        setDefinitions(data.definitions || []);
        setIsManagingDefinitions(false);
        toast({
          title: 'Success',
          description: 'Custom attribute definitions saved successfully'
        });
      }
    } catch (error: any) {
      console.error('Error saving custom attribute definitions:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save custom attribute definitions',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmployeeAttributes = async () => {
    setIsSaving(true);
    try {
      // Ensure we send only definitions that actually exist and map positions safely
      const defs = definitions || [];

      const attributeValues = defs.map(def => ({
        attributeId: def._id,
        attribute_position: def.position,
        value: values[`position_${def.position}`] || ''
      }));

      const employeeId = (employee as any).id || (employee as any)._id;

      const response = await fetch('/api/employee-attribute-values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employeeId,
          attributeValues
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee attributes');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: `Custom attributes updated for ${employee.firstName} ${employee.lastName}`
        });
        onUpdate();
        onClose();
      }
    } catch (error: any) {
      console.error('Error saving employee custom attributes:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update employee attributes',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDefinitionChange = (position: number, name: string) => {
    setNewDefinitions(prev => 
      prev.map(def => 
        def.position === position ? { ...def, name } : def
      )
    );
  };

  const handleValueChange = (position: number, value: string) => {
    const key = `position_${position}`;
    setValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading custom attributes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5" />
              <span>Custom Attributes - {employee.firstName} {employee.lastName}</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {!isManagingDefinitions ? (
            <div className="space-y-6">
              {/* Employee Attribute Values */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Assign Custom Attributes</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsManagingDefinitions(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Definitions
                  </Button>
                </div>

                {definitions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No Custom Attributes Defined</p>
                    <p className="text-sm">Create custom attribute definitions first to assign values to employees.</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setIsManagingDefinitions(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Definitions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {definitions.map((definition) => (
                      <div key={definition._id} className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {definition.name} (Position {definition.position})
                        </Label>
                        <Input
                          value={values[`position_${definition.position}`] || ''}
                          onChange={(e) => handleValueChange(definition.position, e.target.value)}
                          placeholder={`Enter ${definition.name.toLowerCase()}`}
                          className="w-full"
                        />
                      </div>
                    ))}

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button variant="outline" onClick={onClose}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEmployeeAttributes} disabled={isSaving}>
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Attributes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Manage Attribute Definitions */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Manage Custom Attribute Definitions</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsManagingDefinitions(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Back to Values
                  </Button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Custom Attribute Definitions</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Define up to 4 custom attributes that can be assigned to employees. 
                        Examples: Region, Zone, Batch, Branch, Team, etc.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {newDefinitions.map((definition, index) => (
                    <div key={definition.position} className="flex items-center space-x-3 p-4 border rounded-lg">
                      <Badge variant="outline" className="min-w-[80px] justify-center">
                        Position {definition.position}
                      </Badge>
                      <div className="flex-1">
                        <Input
                          value={definition.name}
                          onChange={(e) => handleDefinitionChange(definition.position, e.target.value)}
                          placeholder={`Attribute name (e.g., ${definition.position === 1 ? 'Region' : definition.position === 2 ? 'Zone' : definition.position === 3 ? 'Batch' : 'Branch'})`}
                          className="w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsManagingDefinitions(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDefinitions} disabled={isSaving}>
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Definitions
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
