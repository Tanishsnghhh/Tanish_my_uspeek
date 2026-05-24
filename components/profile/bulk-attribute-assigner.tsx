'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tag, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { extractAccountIdFromUser } from '@/lib/account-id-utils';

interface EmployeeMinimal {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  department?: string;
  status?: string;
}

interface AttributeField {
  position: number;
  name: string;
  value: string;
}

interface BulkAttributeAssignerProps {
  employees: EmployeeMinimal[]; // employees that will be updated (preview)
  onClose?: () => void;
  onDone?: () => void;
}

const DEFAULT_SUGGESTIONS = ['Division', 'Function', 'Role'];

export default function BulkAttributeAssigner({ employees, onClose, onDone }: BulkAttributeAssignerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [definitions, setDefinitions] = useState<AttributeField[]>([
    { position: 1, name: DEFAULT_SUGGESTIONS[0], value: '' },
    { position: 2, name: DEFAULT_SUGGESTIONS[1], value: '' },
    { position: 3, name: DEFAULT_SUGGESTIONS[2], value: '' }
  ]);

  useEffect(() => {
    // Try to fetch existing definitions to help the user; non-blocking
    (async () => {
      try {
        // attempt to get account-scoped definitions
        let url = '/api/custom-attributes';
        try {
          if (user) {
            const accountId = extractAccountIdFromUser(user);
            if (accountId) url += `?accountId=${encodeURIComponent(accountId)}`;
          }
        } catch (e) {
          // silently ignore
        }

        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && Array.isArray(data.definitions) && data.definitions.length > 0) {
          // Map up to 3 definitions into our fields (by position)
          const init = [
            { position: 1, name: DEFAULT_SUGGESTIONS[0], value: '' },
            { position: 2, name: DEFAULT_SUGGESTIONS[1], value: '' },
            { position: 3, name: DEFAULT_SUGGESTIONS[2], value: '' }
          ];
          data.definitions.forEach((d: any) => {
            const pos = Number(d.position);
            if (pos >= 1 && pos <= 3) {
              init[pos - 1].name = d.name || init[pos - 1].name;
            }
          });
          setDefinitions(init);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleNameChange = (pos: number, name: string) => {
    setDefinitions(prev => prev.map(f => f.position === pos ? { ...f, name } : f));
  };

  const handleValueChange = (pos: number, value: string) => {
    setDefinitions(prev => prev.map(f => f.position === pos ? { ...f, value } : f));
  };

  const handleSubmit = async () => {
    // At least one value must be provided
    const payloadValues = definitions
      .filter(d => d.name.trim() && d.value.trim())
      .map(d => ({ attribute_position: d.position, name: d.name.trim(), value: d.value.trim() }));

    if (payloadValues.length === 0) {
      toast({ title: 'No values', description: 'Please provide at least one attribute value to assign.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const employeeIds = employees.map(e => e.id || e._id).filter(Boolean);

      // Prepare updates in the format expected by bulk-update route
      const updates = employeeIds.map(employeeId => ({
        employeeId,
        attributes: payloadValues.reduce((acc, attr) => {
          acc[`position_${attr.attribute_position}`] = attr.value;
          return acc;
        }, {} as { [key: string]: string })
      }));

      // Get account ID
      let accountId = null;
      try {
        if (user) {
          accountId = extractAccountIdFromUser(user);
        }
      } catch (e) {
        console.error('Failed to extract account ID:', e);
      }

      const response = await fetch('/api/custom-attributes/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          updates,
          accountId
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Bulk assign failed');
      }

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Success', description: `${employees.length} employees updated` });
        onDone && onDone();
      } else {
        throw new Error(data.error || 'Bulk assign returned error');
      }
    } catch (err: any) {
      console.error('Bulk assign error', err);
      toast({ title: 'Error', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
      onClose && onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5" />
              <span>Bulk Assign Custom Attributes</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium">Set Attribute Values</h3>
            <p className="text-sm text-gray-600">Define up to three attributes and enter the values to apply to the selected employees.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {definitions.map(def => (
              <div key={def.position} className="space-y-2">
                <Label className="text-sm font-medium">Attribute {def.position}</Label>
                <Input value={def.name} onChange={(e) => handleNameChange(def.position, e.target.value)} placeholder={`Attribute name (e.g., ${DEFAULT_SUGGESTIONS[def.position-1]})`} />
                <Input value={def.value} onChange={(e) => handleValueChange(def.position, e.target.value)} placeholder="Value to set (leave blank to skip)" />
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-medium">Employees to be Updated</h4>
            <p className="text-sm text-gray-600">{employees.length} employees will be updated</p>

            <div className="mt-3 max-h-40 overflow-y-auto border rounded-md p-3">
              {employees.map((emp) => (
                <div key={(emp as any).id || (emp as any)._id || `${emp.firstName}-${emp.lastName}`} className="flex items-center justify-between py-1">
                  <div>
                    <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                    <div className="text-sm text-gray-600">{emp.department || '—'} • {emp.status || '—'}</div>
                  </div>
                  <Badge variant="outline">{emp.status || '—'}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Apply to {employees.length} employees
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
