'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Database, BarChart3, Users, Video, TrendingUp, Building2, MapPin, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ExportFilters {
  // Organizational filters
  region: string;
  zone: string;
  batch: string;
  branch: string;
  businessUnit: string;
  
  // Date filters
  dateFrom: string;
  dateTo: string;
  periodType: string;
  
  // Business Reports data type filters
  includeBusinessMetrics: boolean;
  includeVideoAnalysisReports: boolean;
  includeEmployeePerformance: boolean;
  
  // Raw Data type filters
  includeVideoAnalysisData: boolean;
  includeLearningProgress: boolean;
  includeAssignments: boolean;
  includeAuditLogs: boolean;
  
  // Formats
  businessReportsFormat: string;
  rawDataFormat: string;
}

export default function ExportDataPage() {
  const [filters, setFilters] = useState<ExportFilters>({
    region: 'all',
    zone: 'all',
    batch: 'all',
    branch: 'all',
    businessUnit: 'all',
    dateFrom: '',
    dateTo: '',
    periodType: 'all-time',
    includeBusinessMetrics: true,
    includeVideoAnalysisReports: true,
    includeEmployeePerformance: true,
    includeVideoAnalysisData: true,
    includeLearningProgress: false,
    includeAssignments: false,
    includeAuditLogs: false,
    businessReportsFormat: 'csv',
    rawDataFormat: 'csv'
  });

  const [availableOptions, setAvailableOptions] = useState({
    regions: [] as string[],
    zones: [] as string[],
    batches: [] as string[],
    branches: [] as string[],
    businessUnits: [] as string[]
  });

  const [isLoading, setIsLoading] = useState(false);

  // Load available options on component mount
  useEffect(() => {
    loadAvailableOptions();
  }, []);

  const loadAvailableOptions = async () => {
    try {
      console.log('Loading available options...');
      
      // Get authentication token
      const token = localStorage.getItem('uspeak_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Load organizational data from employee profiles
      const response = await fetch('/api/accountsetting/company', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Company API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Company API data:', data);
        console.log('Available options:', data.availableOptions);
        
        setAvailableOptions(prev => ({
          ...prev,
          regions: data.availableOptions?.regions || [],
          zones: data.availableOptions?.zones || [],
          batches: data.availableOptions?.batches || [],
          branches: data.availableOptions?.branches || []
        }));
        
        console.log('Set regions:', data.availableOptions?.regions);
        console.log('Set zones:', data.availableOptions?.zones);
        console.log('Set batches:', data.availableOptions?.batches);
        console.log('Set branches:', data.availableOptions?.branches);
      } else {
        console.error('Company API failed:', response.status, response.statusText);
      }

      // Load business units
      const businessUnitsResponse = await fetch('/api/business-units', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Business units API response status:', businessUnitsResponse.status);
      
      if (businessUnitsResponse.ok) {
        const businessData = await businessUnitsResponse.json();
        console.log('Business units data:', businessData);
        
        setAvailableOptions(prev => ({
          ...prev,
          businessUnits: businessData.businessUnits?.map((unit: any) => unit.businessName) || []
        }));
        
        console.log('Set business units:', businessData.businessUnits?.map((unit: any) => unit.businessName));
      } else {
        console.error('Business units API failed:', businessUnitsResponse.status, businessUnitsResponse.statusText);
      }
    } catch (error) {
      console.error('Error loading available options:', error);
    }
  };

  const handleFilterChange = (key: keyof ExportFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async (type: 'reports' | 'raw-data') => {
    setIsLoading(true);
    try {
      // Prepare export data based on type
      const exportData: any = {
        region: filters.region,
        zone: filters.zone,
        batch: filters.batch,
        branch: filters.branch,
        businessUnit: filters.businessUnit,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        periodType: filters.periodType,
        exportType: type,
        format: type === 'reports' ? filters.businessReportsFormat : filters.rawDataFormat
      };

      // Add data type filters based on export type
      if (type === 'reports') {
        exportData.includeBusinessMetrics = filters.includeBusinessMetrics;
        exportData.includeVideoAnalysis = filters.includeVideoAnalysisReports;
        exportData.includeEmployeeData = filters.includeEmployeePerformance;
        exportData.includeLearningProgress = false;
        exportData.includeAssignments = false;
        exportData.includeAuditLogs = false;
      } else {
        exportData.includeBusinessMetrics = false;
        exportData.includeVideoAnalysis = filters.includeVideoAnalysisData;
        exportData.includeEmployeeData = false;
        exportData.includeLearningProgress = filters.includeLearningProgress;
        exportData.includeAssignments = filters.includeAssignments;
        exportData.includeAuditLogs = filters.includeAuditLogs;
      }

      // Get auth token from localStorage
      const token = localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(exportData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const format = type === 'reports' ? filters.businessReportsFormat : filters.rawDataFormat;
        a.download = `uspeak-export-${type}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.text();
        console.error('Export failed:', response.status, response.statusText, errorData);
        alert(`Export failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="bg-blue-50 min-h-screen">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Download className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-900">Export Data</h1>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 mx-4 mb-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Organizational Filters</h2>
              <p className="text-sm text-blue-700">Filter data by organizational hierarchy</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="region" className="text-sm font-medium text-blue-800">Region</Label>
              <Select value={filters.region} onValueChange={(value) => handleFilterChange('region', value)}>
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {availableOptions.regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="zone" className="text-sm font-medium text-blue-800">Zone</Label>
              <Select value={filters.zone} onValueChange={(value) => handleFilterChange('zone', value)}>
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {availableOptions.zones.map(zone => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="batch" className="text-sm font-medium text-blue-800">Batch</Label>
              <Select value={filters.batch} onValueChange={(value) => handleFilterChange('batch', value)}>
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {availableOptions.batches.map(batch => (
                    <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="branch" className="text-sm font-medium text-blue-800">Branch</Label>
              <Select value={filters.branch} onValueChange={(value) => handleFilterChange('branch', value)}>
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {availableOptions.branches.map(branch => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="businessUnit" className="text-sm font-medium text-blue-800">Business Unit</Label>
              <Select value={filters.businessUnit} onValueChange={(value) => handleFilterChange('businessUnit', value)}>
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="All Business Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Business Units</SelectItem>
                  {availableOptions.businessUnits.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 mx-4 mb-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Date Range</h2>
              <p className="text-sm text-blue-700">Filter data by specific time periods</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-sm font-medium text-blue-800">From Date</Label>
              <Input 
                type="date" 
                id="dateFrom" 
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="bg-blue-50 border-blue-200"
              />
            </div>
            <div>
              <Label htmlFor="dateTo" className="text-sm font-medium text-blue-800">To Date</Label>
              <Input 
                type="date" 
                id="dateTo" 
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="bg-blue-50 border-blue-200"
              />
            </div>
            <div>
              <Label htmlFor="periodType" className="text-sm font-medium text-blue-800">Period Type</Label>
              <Select value={filters.periodType} onValueChange={(value) => handleFilterChange('periodType', value)}>
                <SelectTrigger className="bg-blue-50 border-blue-200">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-time">All Time</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 mx-4 mb-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Business Reports</h2>
              <p className="text-sm text-blue-700">Generate comprehensive business intelligence reports</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-blue-900 mb-4">Select Data Types</h3>
            <div className="mb-6">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                <Checkbox 
                  id="includeBusinessMetrics" 
                  checked={filters.includeBusinessMetrics}
                  onCheckedChange={(checked) => handleFilterChange('includeBusinessMetrics', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeBusinessMetrics" className="font-medium text-blue-900">Business Metrics & KPIs</Label>
                  <p className="text-xs text-blue-700">Performance indicators and business analytics</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                <Checkbox 
                  id="includeVideoAnalysisReports" 
                  checked={filters.includeVideoAnalysisReports}
                  onCheckedChange={(checked) => handleFilterChange('includeVideoAnalysisReports', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeVideoAnalysisReports" className="font-medium text-blue-900">Video Analysis Reports</Label>
                  <p className="text-xs text-blue-700">Communication skills and performance analysis</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox 
                  id="includeEmployeePerformance" 
                  checked={filters.includeEmployeePerformance}
                  onCheckedChange={(checked) => handleFilterChange('includeEmployeePerformance', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeEmployeePerformance" className="font-medium text-blue-900">Employee Performance Data</Label>
                  <p className="text-xs text-blue-700">Individual and team performance metrics</p>
                </div>
              </div>
            </div>

            <h3 className="font-medium text-blue-900 mb-4">Export Settings</h3>
            <div>
              <div className="mb-4">
                <Label htmlFor="businessReportsFormat" className="text-sm font-medium text-blue-800">Export Format</Label>
                <Select value={filters.businessReportsFormat} onValueChange={(value) => handleFilterChange('businessReportsFormat', value)}>
                  <SelectTrigger className="bg-blue-50 border-blue-200">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV Data</SelectItem>
                    <SelectItem value="excel">Excel Workbook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3" 
                onClick={() => handleExport('reports')}
                disabled={isLoading}
              >
                <FileText className="w-4 h-4 mr-2" />
                {isLoading ? 'Generating Reports...' : 'Export Business Reports'}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 mx-4 mb-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Raw Data Export</h2>
              <p className="text-sm text-blue-700">Export raw data for advanced analysis and integration</p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-blue-900 mb-4">Select Data Types</h3>
            <div className="mb-6">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                <Checkbox 
                  id="includeVideoAnalysisData" 
                  checked={filters.includeVideoAnalysisData}
                  onCheckedChange={(checked) => handleFilterChange('includeVideoAnalysisData', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeVideoAnalysisData" className="font-medium text-blue-900">Video Analysis Data</Label>
                  <p className="text-xs text-blue-700">Raw video analysis results and metrics</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                <Checkbox 
                  id="includeLearningProgress" 
                  checked={filters.includeLearningProgress}
                  onCheckedChange={(checked) => handleFilterChange('includeLearningProgress', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeLearningProgress" className="font-medium text-blue-900">Learning Progress</Label>
                  <p className="text-xs text-blue-700">Training completion and progress tracking</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                <Checkbox 
                  id="includeAssignments" 
                  checked={filters.includeAssignments}
                  onCheckedChange={(checked) => handleFilterChange('includeAssignments', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeAssignments" className="font-medium text-blue-900">Assignment Data</Label>
                  <p className="text-xs text-blue-700">Task assignments and completion status</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox 
                  id="includeAuditLogs" 
                  checked={filters.includeAuditLogs}
                  onCheckedChange={(checked) => handleFilterChange('includeAuditLogs', checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="includeAuditLogs" className="font-medium text-blue-900">Audit Logs</Label>
                  <p className="text-xs text-blue-700">System activity and user actions</p>
                </div>
              </div>
            </div>

            <h3 className="font-medium text-blue-900 mb-4">Export Settings</h3>
            <div>
              <div className="mb-4">
                <Label htmlFor="rawDataFormat" className="text-sm font-medium text-blue-800">Export Format</Label>
                <Select value={filters.rawDataFormat} onValueChange={(value) => handleFilterChange('rawDataFormat', value)}>
                  <SelectTrigger className="bg-blue-50 border-blue-200">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3" 
                onClick={() => handleExport('raw-data')}
                disabled={isLoading}
              >
                <Database className="w-4 h-4 mr-2" />
                {isLoading ? 'Exporting Data...' : 'Export Raw Data'}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 mx-4 mb-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-blue-900">Available Data Overview</h2>
              <p className="text-sm text-blue-700">Summary of data types available for export</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Video Analysis</p>
                <p className="text-xs text-blue-700">Scores, transcripts, metrics</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Business Metrics</p>
                <p className="text-xs text-blue-700">KPIs, performance data</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Employee Data</p>
                <p className="text-xs text-blue-700">Profiles, progress, scores</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Organizational</p>
                <p className="text-xs text-blue-700">Regions, zones, units</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}