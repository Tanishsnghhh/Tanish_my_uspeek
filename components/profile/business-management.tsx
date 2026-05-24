'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building, Users, Plus, Edit, Trash2, Save, X,
  BarChart3, TrendingUp, MapPin, Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessUnit {
  id: string;
  name: string;
  code: string;
  category: string;
  region: string;
  zone?: string;
  batch?: string;
  branch?: string;
  assignedEmployees: string[];
  totalEmployees: number;
  isActive: boolean;
}

interface BusinessMetrics {
  businessName: string;
  businessCode: string;
  businessCategory: string;
  avgOIR: number;
  avgMaxOS: number;
  avgMinOS: number;
  avgBIR: number;
  avgMaxBL: number;
  avgMinBL: number;
  avgVIR: number;
  avgMaxVT: number;
  avgMinVT: number;
  avgWIR: number;
  avgMaxWP: number;
  avgMinWP: number;
  totalParticipants: number;
  totalVideos: number;
  analysisRate: number;
  regions: string[];
  lastCalculated: string;
}

interface BusinessUnitOptions {
  regions: string[];
  categories: string[];
  departments: string[];
  zones: string[];
  batches: string[];
  branches: string[];
}

export function BusinessManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('units');
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [options, setOptions] = useState<BusinessUnitOptions>({
    regions: [],
    categories: [],
    departments: [],
    zones: [],
    batches: [],
    branches: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    region: '',
    zone: '',
    batch: '',
    branch: ''
  });

  const [regionBasedOptions, setRegionBasedOptions] = useState({
    zones: [] as string[],
    batches: [] as string[],
    branches: [] as string[]
  });

  useEffect(() => {
    fetchBusinessData();
    fetchEmployees();
    fetchOptions();
  }, []);

  // Refresh metrics when switching to metrics tab
  useEffect(() => {
    if (activeTab === 'metrics') {
      fetchBusinessMetrics();
    }
  }, [activeTab]);

  const fetchBusinessMetrics = async () => {
    try {
      toast({
        title: '🔄 Refreshing Metrics',
        description: 'Fetching latest business performance data...',
        variant: 'info'
      });

      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/business-metrics?format=business-wise', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const businessData = data.businessData || [];
        console.log('Fetched business metrics on tab change:', businessData);
        setBusinessMetrics(businessData);
        toast({
          title: '✅ Metrics Updated',
          description: 'Business metrics have been refreshed successfully',
          variant: 'default'
        });
      } else {
        console.log('Business metrics fetch failed:', response.status);
        setBusinessMetrics([]);
        toast({
          title: 'Error',
          description: 'Failed to refresh metrics',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching business metrics:', error);
      setBusinessMetrics([]);
      toast({
        title: 'Error',
        description: 'Failed to refresh metrics',
        variant: 'destructive'
      });
    }
  };

  const fetchBusinessData = async () => {
    try {
      // Fetch business units from the business-units API
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const unitsResponse = await fetch('/api/business-units', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (unitsResponse.ok) {
        const unitsData = await unitsResponse.json();
        const businessUnitsData = unitsData.businessUnits || [];

        // Convert to the expected format
        const units: BusinessUnit[] = businessUnitsData.map((unit: any) => ({
          id: unit._id.toString(),
          name: unit.businessName,
          code: unit.businessCode || unit.businessName.replace(/\s+/g, '_').toUpperCase(),
          category: unit.businessCategory || 'General',
          region: unit.region,
          zone: unit.zone,
          batch: unit.batch,
          branch: unit.branch,
          assignedEmployees: unit.assignedEmployees || [],
          totalEmployees: unit.totalEmployees || 0,
          isActive: unit.isActive !== false
        }));

        setBusinessUnits(units);
        console.log('Fetched business units:', units);
      } else {
        console.log('Business units API failed:', unitsResponse.status);
        setBusinessUnits([]);
      }

      // Note: Business metrics are now fetched separately when needed
    } catch (error) {
      console.error('Error fetching business data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load business data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Try to get all employees without account filtering
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/employees?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Employee API response:', data);
        console.log('Employees array:', data.data);
        setEmployees(data.data || []);
      } else {
        console.log('Employee API failed with status:', response.status);
        // Fallback: try without parameters
        const fallbackResponse = await fetch('/api/employees', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setEmployees(fallbackData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  const fetchRegionBasedOptions = async (selectedRegion: string) => {
    if (!selectedRegion) {
      setRegionBasedOptions({ zones: [], batches: [], branches: [] });
      return;
    }

    try {
      console.log('Fetching region-based options for:', selectedRegion);

      // Fetch organizational hierarchy from the new API endpoint
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const hierarchyResponse = await fetch(`/api/organization-hierarchy?region=${encodeURIComponent(selectedRegion)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response Status:', hierarchyResponse.status);

      if (hierarchyResponse.ok) {
        const hierarchyData = await hierarchyResponse.json();
        console.log('Organization hierarchy response:', hierarchyData);

        if (hierarchyData.success) {
          const zones = hierarchyData.zones || [];
          const batches = hierarchyData.batches || [];
          const branches = hierarchyData.branches || [];
          
          console.log('Extracted options:', { zones, batches, branches });
          
          setRegionBasedOptions({
            zones,
            batches,
            branches
          });

          console.log('Final extracted data for region', selectedRegion, ':', hierarchyData);
        } else {
          console.log('API returned success=false:', hierarchyData);
          setRegionBasedOptions({ zones: [], batches: [], branches: [] });
        }
      } else {
        const errorData = await hierarchyResponse.json().catch(() => ({}));
        console.log('Organization hierarchy API failed:', hierarchyResponse.status, errorData);
        // Fallback to empty arrays
        setRegionBasedOptions({ zones: [], batches: [], branches: [] });
      }
    } catch (error) {
      console.error('Error fetching region-based options:', error);
      // Don't set fallback data - leave empty to show no options available
      setRegionBasedOptions({
        zones: [],
        batches: [],
        branches: []
      });
    }
  };

  const fetchOptions = async () => {
    try {
      console.log('Fetching options for business unit form...');

      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch regions from region improvement API
      const regionResponse = await fetch('/api/dashboard/region-improvement', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      let regions: string[] = [];
      if (regionResponse.ok) {
        const regionData = await regionResponse.json();
        const regionList = regionData.map((item: any) => item.region as string).filter((region: string): region is string => Boolean(region));
        regions = [...new Set<string>(regionList)].sort();
        console.log('Fetched regions:', regions);
      } else {
        console.log('Region API failed:', regionResponse.status);
      }

      // Fetch business metrics to get categories
      const metricsResponse = await fetch('/api/business-metrics?format=business-wise', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      let categories: string[] = [];
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        console.log('Business metrics response:', metricsData);

        // Try different possible data structures
        const businessData = metricsData.businessData || metricsData.data || metricsData;
        console.log('Business data array:', businessData);
        console.log('Is business data array?', Array.isArray(businessData));

        if (Array.isArray(businessData)) {
          console.log('Sample business item:', businessData[0]);
          const categoryList = businessData.map((item: any) => {
            console.log('Item businessCategory:', item.businessCategory);
            return item.businessCategory as string;
          }).filter((cat: string): cat is string => Boolean(cat));
          console.log('Category list before deduplication:', categoryList);
          categories = [...new Set<string>(categoryList)].sort();
        }
        console.log('Extracted categories:', categories);

        // If no categories found from API, check if we have any business metrics at all
        if (categories.length === 0 && Array.isArray(businessData) && businessData.length > 0) {
          console.log('No categories found, but business data exists. Using fallback categories.');
          categories = ['Technology']; // Keep the existing category if that's what's in your data
        }
      } else {
        console.log('Business metrics API failed:', metricsResponse.status);
      }

      // Fetch employees to get departments
      const employeeResponse = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      let departments: string[] = [];
      if (employeeResponse.ok) {
        const employeeData = await employeeResponse.json();
        console.log('Employee data structure:', Object.keys(employeeData));
        const departmentList = employeeData.employees?.map((emp: any) => emp.department as string).filter((dept: string): dept is string => Boolean(dept)) || [];
        departments = [...new Set<string>(departmentList)].sort();
        console.log('Extracted departments:', departments);
      } else {
        console.log('Employee API failed:', employeeResponse.status);
      }

      // Always provide default options to ensure dropdowns work
      const finalOptions = {
        regions: regions.length > 0 ? regions : ['EAST', 'WEST', 'NORTH', 'SOUTH', 'CENTRAL'],
        categories: [...new Set<string>([
          ...categories,
          'Financial Services',
          'Banking',
          'Technology',
          'Operations',
          'Sales',
          'Human Resources',
          'Marketing',
          'Customer Service'
        ])].sort(),
        departments: departments.length > 0 ? departments : [
          'Engineering',
          'Sales',
          'Marketing',
          'HR',
          'Finance',
          'Operations',
          'Customer Support'
        ],
        zones: [], // Will be populated based on region selection
        batches: [], // Will be populated based on region selection
        branches: [] // Will be populated based on region selection
      };

      console.log('Final options set:', finalOptions);
      setOptions(finalOptions);
    } catch (error) {
      console.error('Error fetching options:', error);
      // Set default options on error
      const defaultOptions = {
        regions: ['EAST', 'WEST', 'NORTH', 'SOUTH', 'CENTRAL'],
        categories: ['Financial Services', 'Banking', 'Technology', 'Operations', 'Sales'],
        departments: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'],
        zones: [], // Will be populated based on region selection
        batches: [], // Will be populated based on region selection
        branches: [] // Will be populated based on region selection
      };
      console.log('Using default options due to error:', defaultOptions);
      setOptions(defaultOptions);
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleCreateUnit = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.code || !formData.category || !formData.region) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields: Business Name, Code, Category, and Region',
          variant: 'destructive'
        });
        return;
      }

      // Create business unit using the correct API
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/business-units', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: formData.name,
          businessCode: formData.code,
          businessCategory: formData.category,
          region: formData.region,
          zone: formData.zone,
          batch: formData.batch,
          branch: formData.branch
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Business unit created:', result);

        // Create a local business unit representation
        const newUnit: BusinessUnit = {
          id: result.businessUnitId || result.businessUnit._id.toString(),
          name: formData.name,
          code: formData.code,
          category: formData.category,
          region: formData.region,
          zone: formData.zone,
          batch: formData.batch,
          branch: formData.branch,
          assignedEmployees: [],
          totalEmployees: 0,
          isActive: true
        };

        setBusinessUnits([...businessUnits, newUnit]);
        setShowCreateForm(false);
        setFormData({
          name: '',
          code: '',
          category: '',
          region: '',
          zone: '',
          batch: '',
          branch: ''
        });

        toast({
          title: '✅ Business Unit Created',
          description: `${newUnit.name} has been created successfully`,
          variant: 'default'
        });

        // Refresh the business data to get updated metrics
        fetchBusinessData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create business unit');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create business unit',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveEmployee = async (unitId: string, employeeId: string) => {
    try {
      console.log('Unassigning employee:', { unitId, employeeId });

      const unit = businessUnits.find(u => u.id === unitId);
      if (!unit) {
        console.error('Business unit not found:', unitId);
        return;
      }

      // Call the API to unassign the employee
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/business-units', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessUnitId: unitId,
          action: 'unassign',
          employeeId: employeeId
        })
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to unassign employee');
      }

      const result = await response.json();
      console.log('Unassignment successful:', result);

      // Update local state
      const updatedUnits = businessUnits.map(unit => {
        if (unit.id === unitId) {
          return {
            ...unit,
            assignedEmployees: unit.assignedEmployees.filter(id => id !== employeeId),
            totalEmployees: unit.totalEmployees - 1
          };
        }
        return unit;
      });

      setBusinessUnits(updatedUnits);

      toast({
        title: '✅ Employee Removed',
        description: 'Employee has been removed from the business unit',
        variant: 'default'
      });

      // Refresh business data to get updated metrics
      fetchBusinessData();

    } catch (error) {
      console.error('Error in handleRemoveEmployee:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove employee',
        variant: 'destructive'
      });
    }
  };

  if (isLoading || optionsLoading) {
    return <div className="flex items-center justify-center p-8">Loading business data...</div>;
  }

  const handleAssignEmployee = async (unitId: string, employeeId: string) => {
    try {
      const unit = businessUnits.find(u => u.id === unitId);
      if (!unit) return;

      // Call the API to assign the employee
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/business-units', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessUnitId: unitId,
          action: 'assign',
          employeeId: employeeId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign employee');
      }

      // Update local state
      const updatedUnits = businessUnits.map(unit => {
        if (unit.id === unitId) {
          return {
            ...unit,
            assignedEmployees: [...unit.assignedEmployees, employeeId],
            totalEmployees: unit.totalEmployees + 1
          };
        }
        return unit;
      });

      setBusinessUnits(updatedUnits);

      toast({
        title: '✅ Employee Assigned',
        description: 'Employee has been assigned to the business unit',
        variant: 'default'
      });

      // Refresh business data to get updated metrics
      fetchBusinessData();

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign employee',
        variant: 'destructive'
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Business Management</h3>
          <p className="text-sm text-gray-600">Manage business units, divisions, and employee assignments</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Business Unit
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="units">Business Units</TabsTrigger>
          <TabsTrigger value="metrics">Business Metrics</TabsTrigger>
          <TabsTrigger value="assignments">Employee Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="units" className="space-y-4">
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Business Unit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Business Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Acquiring & Cards"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Business Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., ACQ_CARDS"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.categories.length > 0 ? (
                          options.categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {/* Debug info - remove in production */}
                    <div className="text-xs text-gray-500 mt-1">
                      {options.categories.length} categories loaded
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => {
                        console.log('Region changed to:', value);
                        setFormData({ ...formData, region: value, zone: '', batch: '', branch: '' });
                        fetchRegionBasedOptions(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.regions.map((region) => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="zone">Zone</Label>
                    <Select
                      value={formData.zone}
                      onValueChange={(value) => setFormData({ ...formData, zone: value })}
                      disabled={!formData.region}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.region ? "Select zone" : "Select region first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {regionBasedOptions.zones.length > 0 ? (
                          regionBasedOptions.zones.map((zone) => (
                            <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-zones" disabled>
                            {formData.region ? 'No zones available for ' + formData.region : 'Select region first'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="batch">Batch</Label>
                    <Select
                      value={formData.batch}
                      onValueChange={(value) => setFormData({ ...formData, batch: value })}
                      disabled={!formData.region}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.region ? "Select batch" : "Select region first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {regionBasedOptions.batches.length > 0 ? (
                          regionBasedOptions.batches.map((batch) => (
                            <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-batches" disabled>
                            {formData.region ? 'No batches available for ' + formData.region : 'Select region first'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <Select
                      value={formData.branch}
                      onValueChange={(value) => setFormData({ ...formData, branch: value })}
                      disabled={!formData.region}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.region ? "Select branch" : "Select region first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {regionBasedOptions.branches.length > 0 ? (
                          regionBasedOptions.branches.map((branch) => (
                            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-branches" disabled>
                            {formData.region ? 'No branches available for ' + formData.region : 'Select region first'}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCreateUnit} disabled={!formData.region}>
                    <Save className="w-4 h-4 mr-2" />
                    Create Unit
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {businessUnits.map((unit) => (
              <Card key={unit.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{unit.name}</h4>
                        <p className="text-sm text-gray-600">{unit.code} • {unit.category}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            <MapPin className="w-3 h-3 mr-1" />
                            {unit.region}
                          </Badge>
                          {unit.zone && <Badge variant="outline">{unit.zone}</Badge>}
                          {unit.batch && <Badge variant="outline">{unit.batch}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{unit.totalEmployees}</span>
                        <span className="text-sm text-gray-500">employees</span>
                      </div>
                      <Badge variant={unit.isActive ? "default" : "secondary"}>
                        {unit.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Debug info - remove in production */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                <strong>Debug Info:</strong> {businessMetrics.length} business metrics loaded
                {businessMetrics.length > 0 && (
                  <div className="mt-2">
                    <strong>Sample metric:</strong> {JSON.stringify(businessMetrics[0], null, 2)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Business-Wise Performance Metrics
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={fetchBusinessMetrics}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Refresh Metrics
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Business</th>
                      <th className="text-center p-2">Avg OIR%</th>
                      <th className="text-center p-2">Avg MAX OS</th>
                      <th className="text-center p-2">Avg MIN OS</th>
                      <th className="text-center p-2">Avg BIR%</th>
                      <th className="text-center p-2">Avg MAX BL</th>
                      <th className="text-center p-2">Avg MIN BL</th>
                      <th className="text-center p-2">Avg VIR%</th>
                      <th className="text-center p-2">Avg MAX VT</th>
                      <th className="text-center p-2">Avg MIN VT</th>
                      <th className="text-center p-2">Avg WIR%</th>
                      <th className="text-center p-2">Avg MAX WP</th>
                      <th className="text-center p-2">Avg MIN WP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessMetrics.map((metric, index) => {
                      console.log('Rendering metric:', index, metric.businessName, metric.avgOIR);
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{metric.businessName}</div>
                              <div className="text-xs text-gray-500">{metric.businessCode}</div>
                            </div>
                          </td>
                          <td className="text-center p-2">{metric.avgOIR}%</td>
                          <td className="text-center p-2">{metric.avgMaxOS}</td>
                          <td className="text-center p-2">{metric.avgMinOS}</td>
                          <td className="text-center p-2">{metric.avgBIR}%</td>
                          <td className="text-center p-2">{metric.avgMaxBL}</td>
                          <td className="text-center p-2">{metric.avgMinBL}</td>
                          <td className="text-center p-2">{metric.avgVIR}%</td>
                          <td className="text-center p-2">{metric.avgMaxVT}</td>
                          <td className="text-center p-2">{metric.avgMinVT}</td>
                          <td className="text-center p-2">{metric.avgWIR}%</td>
                          <td className="text-center p-2">{metric.avgMaxWP}</td>
                          <td className="text-center p-2">{metric.avgMinWP}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {businessMetrics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No business metrics available. Generate metrics by calculating business performance data.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {/* Debug info - commented out for production */}
          {/* <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                <strong>Debug Info:</strong> {employees.length} employees loaded, {businessUnits.length} business units
                {employees.length > 0 && (
                  <div className="mt-2">
                    <strong>Sample employee:</strong> {JSON.stringify(employees[0], null, 2)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card> */}

          <div className="grid gap-4">
            {businessUnits.map((unit) => (
              <Card key={unit.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{unit.name}</span>
                    <Badge>{unit.totalEmployees} assigned</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Assign Employee</Label>
                      <Select onValueChange={(employeeId) => handleAssignEmployee(unit.id, employeeId)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee to assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees && employees.length > 0 ? (
                            employees
                              .filter(emp => emp && emp.id && !unit.assignedEmployees.includes(emp.id))
                              .map((employee) => (
                                <SelectItem key={employee.id} value={employee.id}>
                                  {employee.firstName || 'Unknown'} {employee.lastName || 'Employee'} - {employee.department || 'No Department'} ({employee.customAttributes?.position_1 || 'No Region'})
                                </SelectItem>
                              ))
                          ) : (
                            <SelectItem value="no-employees" disabled>
                              {employees.length === 0 ? 'No employees available' : 'Loading employees...'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {/* Debug info - remove in production */}
                      <div className="text-xs text-gray-500 mt-1">
                        {employees.length} employees loaded, {employees.filter(emp => emp && emp.id && !unit.assignedEmployees.includes(emp.id)).length} available for assignment (showing all regions)
                      </div>
                    </div>

                    {unit.assignedEmployees.length > 0 && (
                      <div>
                        <Label>Assigned Employees</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {unit.assignedEmployees.map((empId) => {
                            const employee = employees.find(e => e.id === empId);
                            return employee ? (
                              <div key={empId} className="flex items-center gap-1">
                                <Badge variant="secondary" className="flex items-center gap-1 pr-1">
                                  {employee.firstName} {employee.lastName}
                                  <button
                                    onClick={() => handleRemoveEmployee(unit.id, empId)}
                                    className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
                                    title="Remove employee"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}