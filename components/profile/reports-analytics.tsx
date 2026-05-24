'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  Clock, 
  Video, 
  Award,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  ScoreTrendChart,
  ActivityComparisonChart,
  DepartmentPerformanceChart,
  EngagementDistributionChart,
  TimeSpentTrendChart,
  VideoUploadTrendChart,
  CombinedMetricsChart
} from './reports-charts';

interface AttributeDefinition {
  position: string;
  attributeId: string;
  name: string;
}

interface EmployeeSummary {
  employeeId: string;
  window: { start: string; end: string };
  profile: {
    name: string;
    department: string;
    jobTitle: string;
  };
  attributes: Array<{
    name: string;
    position: number;
    value: string;
  }>;
  metrics: {
    avgScore: number | null;
    lessonsCompleted: number;
    timeSpentMinutes: number;
    videosUploaded: number;
    improvement: {
      first: number;
      last: number;
      delta: number;
      deltaPct: number;
    } | null;
  };
}

interface AggregateRow {
  groupValue: string;
  headcount: number;
  avgScore: number | null;
  lessons: number;
  timeSpentMinutes: number;
  videos: number;
  improvementDelta: number | null;
}

interface AggregateData {
  window: { start: string; end: string };
  groupBy: { attributeName: string; position: string };
  filtersApplied: Array<{ position: string; value: string }>;
  rows: AggregateRow[];
  page: number;
  pageSize: number;
  totalRows: number;
}

export function ReportsAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  // dateRange intentionally removed — no date filters for now
  
  // Overview state
  const [aggregateData, setAggregateData] = useState<AggregateData | null>(null);
  const [selectedGroupBy, setSelectedGroupBy] = useState('position1');
  const [filters, setFilters] = useState<Array<{ position: string; value: string }>>([]);
  const [availableFilterValues, setAvailableFilterValues] = useState<Record<string, string[]>>({});
  
  // Employee detail state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeSummary, setEmployeeSummary] = useState<EmployeeSummary | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; department: string }>>([]);
  
  // Time series data for charts
  const [timeSeriesData, setTimeSeriesData] = useState<Array<{
    date: string;
    avgScore?: number;
    timeSpent?: number;
    videosUploaded?: number;
    lessonsCompleted?: number;
  }>>([]);

  const { toast } = useToast();
  const { user, token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchAttributes();
      fetchEmployees();
      if (activeTab === 'overview') {
        fetchAggregateData();
      }
    }
  }, [token, activeTab]);

  useEffect(() => {
    if (activeTab === 'overview' && attributes.length > 0) {
      fetchAggregateData();
    } else if (activeTab === 'employee' && selectedEmployee) {
      fetchEmployeeSummary();
      fetchTimeSeriesData();
    }
  }, [selectedGroupBy, filters, selectedEmployee]);

  const fetchTimeSeriesData = async () => {
    if (!selectedEmployee || !token) return;

    try {
      // No date filters — fetch full available timeseries
      const response = await fetch(`/api/reports/employee/${selectedEmployee}/timeseries`, {
        headers: { authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTimeSeriesData(data.timeSeries || []);
      }
    } catch (error) {
      console.error('Error fetching time series data:', error);
    }
  };

  const fetchAttributes = async () => {
    console.log('🔍 Fetching attributes...', { token: !!token });
    try {
      const response = await fetch('/api/reports/definitions/attributes', {
        headers: { authorization: `Bearer ${token}` }
      });
      
      console.log('📊 Attributes API response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Attributes data:', data);
        setAttributes(data.attributes || []);
        if (data.attributes && data.attributes.length > 0) {
          setSelectedGroupBy(data.attributes[0].position);
        }
      } else {
        const error = await response.json();
        console.error('❌ Attributes API error:', error);
      }
    } catch (error) {
      console.error('❌ Error fetching attributes:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?method=by-account&all=true', {
        headers: { authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const employeesData = Array.isArray(data.data) ? data.data : [];
        setEmployees(employeesData.map((emp: any) => ({
          id: emp.id || emp._id,
          name: `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim(),
          department: emp.department || ''
        })));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAggregateData = async () => {
    if (!selectedGroupBy || attributes.length === 0) {
      console.log('⚠️ Skipping aggregate fetch:', { selectedGroupBy, attributesCount: attributes.length });
      return;
    }
    
    console.log('🔍 Fetching aggregate data...', { selectedGroupBy, filters });
    
    setLoading(true);
    try {
      const response = await fetch('/api/reports/aggregate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
           groupBy: selectedGroupBy,
           filters,
           metrics: ['avgScore', 'videos', 'lessons', 'timeSpent', 'improvement'],
           pagination: { page: 1, pageSize: 50 },
           sort: { field: 'avgScore', direction: 'desc' }
         })
       });

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Aggregate data received:', result);
        setAggregateData(result.data);
      } else {
        const error = await response.json();
        console.error('❌ Aggregate API error:', error);
        toast({
          title: 'Error',
          description: error.error || 'Failed to fetch aggregate data',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching aggregate data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch aggregate data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeSummary = async () => {
    if (!selectedEmployee) return;
    
    setLoading(true);
    try {
      const url = new URL(`/api/reports/employee/${selectedEmployee}/summary`, window.location.origin);
      // no date filters — request full summary
      url.searchParams.set('includeTrend', 'true');
      url.searchParams.set('includeAssignments', 'true');

      const response = await fetch(url.toString(), {
        headers: { authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const result = await response.json();
        setEmployeeSummary(result.data);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to fetch employee data',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching employee summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employee data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    setLoading(true);
    try {
      const params = activeTab === 'employee' && selectedEmployee ? 
        { employeeId: selectedEmployee } :
        {
          groupBy: selectedGroupBy,
          filters,
          metrics: ['avgScore', 'videos', 'lessons', 'timeSpent', 'improvement'],
          sort: { field: 'avgScore', direction: 'desc' }
        };

      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          format,
          level: activeTab === 'employee' ? 'individual' : 'aggregate',
          params
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Open download URL in new tab
        window.open(result.downloadUrl, '_blank');
        toast({
          title: 'Export Ready',
          description: `Your ${format.toUpperCase()} export has been generated successfully.`
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Export Failed',
          description: error.error || 'Failed to generate export',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate export',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addFilter = (position: string, value: string) => {
    if (!filters.find(f => f.position === position && f.value === value)) {
      setFilters([...filters, { position, value }]);
    }
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const getAttributeName = (position: string) => {
    const attr = attributes.find(a => a.position === position);
    return attr?.name || position;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">
            Track employee performance and engagement across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => activeTab === 'overview' ? fetchAggregateData() : fetchEmployeeSummary()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => exportData('csv')}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => exportData('pdf')}
            disabled={loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range intentionally removed — showing all data by default */}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Aggregate Overview</TabsTrigger>
          <TabsTrigger value="employee">Employee Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters & Grouping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Group By */}
              <div className="flex items-center gap-4">
                <Label>Group By:</Label>
                <Select value={selectedGroupBy} onValueChange={setSelectedGroupBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={attributes.length === 0 ? "Loading attributes..." : "Select attribute"} />
                  </SelectTrigger>
                  <SelectContent>
                    {attributes.length === 0 ? (
                      <SelectItem value="loading" disabled>Loading attributes...</SelectItem>
                    ) : (
                      attributes.map(attr => (
                        <SelectItem key={attr.position} value={attr.position}>
                          {attr.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {attributes.length === 0 && (
                  <span className="text-sm text-gray-500">
                    {token ? "Loading..." : "Please log in"}
                  </span>
                )}
              </div>

              {/* Active Filters */}
              {filters.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Label>Active Filters:</Label>
                  {filters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {getAttributeName(filter.position)}: {filter.value}
                      <button
                        onClick={() => removeFilter(index)}
                        className="ml-1 text-xs hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Aggregate Results */}
          {aggregateData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Total Employees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {aggregateData.rows.reduce((sum, row) => sum + row.headcount, 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Avg Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(() => {
                        const validScores = aggregateData.rows.filter(r => r.avgScore && !isNaN(r.avgScore));
                        if (validScores.length === 0) return 'N/A';
                        const sum = validScores.reduce((sum, row) => sum + (row.avgScore || 0), 0);
                        return Math.round(sum / validScores.length);
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Total Lessons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {aggregateData.rows.reduce((sum, row) => sum + row.lessons, 0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Total Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {aggregateData.rows.reduce((sum, row) => sum + row.videos, 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Charts */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DepartmentPerformanceChart 
                    data={aggregateData.rows.map(row => ({
                      department: row.groupValue,
                      avgScore: row.avgScore || 0,
                      employees: row.headcount,
                      lessons: row.lessons,
                      videos: row.videos,
                      timeSpent: row.timeSpentMinutes
                    }))}
                    title={`Performance by ${aggregateData.groupBy.attributeName}`}
                  />
                  
                  <EngagementDistributionChart 
                    data={[
                      {
                        name: 'Lessons',
                        value: aggregateData.rows.reduce((sum, row) => sum + row.lessons, 0),
                        color: 'hsl(var(--chart-1))'
                      },
                      {
                        name: 'Videos',
                        value: aggregateData.rows.reduce((sum, row) => sum + row.videos, 0),
                        color: 'hsl(var(--chart-2))'
                      },
                      {
                        name: 'Time (hours)',
                        value: Math.round(aggregateData.rows.reduce((sum, row) => sum + row.timeSpentMinutes, 0) / 60),
                        color: 'hsl(var(--chart-3))'
                      }
                    ]}
                    title="Activity Distribution"
                  />
                </div>
              </div>

              {/* Data Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by {aggregateData.groupBy.attributeName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">{aggregateData.groupBy.attributeName}</th>
                          <th className="text-right p-2">Employees</th>
                          <th className="text-right p-2">Avg Score</th>
                          <th className="text-right p-2">Lessons</th>
                          <th className="text-right p-2">Time (min)</th>
                          <th className="text-right p-2">Videos</th>
                          <th className="text-right p-2">Improvement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregateData.rows.map((row, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{row.groupValue}</td>
                            <td className="p-2 text-right">{row.headcount}</td>
                            <td className="p-2 text-right">
                              {row.avgScore ? Math.round(row.avgScore * 10) / 10 : 'N/A'}
                            </td>
                            <td className="p-2 text-right">{row.lessons}</td>
                            <td className="p-2 text-right">{Math.round(row.timeSpentMinutes)}</td>
                            <td className="p-2 text-right">{row.videos}</td>
                            <td className="p-2 text-right">
                              {row.improvementDelta ? 
                                <span className={`inline-flex items-center ${row.improvementDelta > 0 ? 'text-green-600' : row.improvementDelta < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {row.improvementDelta > 0 && <TrendingUp className="w-3 h-3 mr-1" />}
                                  {Math.round(row.improvementDelta * 10) / 10}
                                </span> : 'N/A'
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="employee" className="space-y-6">
          {/* Employee Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose an employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={fetchEmployeeSummary}
                  disabled={!selectedEmployee || loading}
                >
                  Load Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Employee Summary */}
          {employeeSummary && (
            <div className="space-y-6">
              {/* Header */}
              <Card>
                <CardHeader>
                  <CardTitle>{employeeSummary.profile.name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {employeeSummary.profile.department} • {employeeSummary.profile.jobTitle}
                  </p>
                </CardHeader>
                <CardContent>
                  {employeeSummary.attributes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {employeeSummary.attributes.map((attr, index) => (
                        <Badge key={index} variant="outline">
                          {attr.name}: {attr.value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Average Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {employeeSummary.metrics.avgScore ? 
                        Math.round(employeeSummary.metrics.avgScore * 10) / 10 : 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Lessons Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {employeeSummary.metrics.lessonsCompleted}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(employeeSummary.metrics.timeSpentMinutes)} min
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Videos Uploaded
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {employeeSummary.metrics.videosUploaded}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Improvement Card */}
              {employeeSummary.metrics.improvement && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Score Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-sm text-gray-600">First Score</p>
                        <p className="text-xl font-bold">{employeeSummary.metrics.improvement.first}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Latest Score</p>
                        <p className="text-xl font-bold">{employeeSummary.metrics.improvement.last}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Improvement</p>
                        <p className={`text-xl font-bold ${employeeSummary.metrics.improvement.delta > 0 ? 'text-green-600' : employeeSummary.metrics.improvement.delta < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {employeeSummary.metrics.improvement.delta > 0 ? '+' : ''}{employeeSummary.metrics.improvement.delta} 
                          ({employeeSummary.metrics.improvement.deltaPct > 0 ? '+' : ''}{
                            isNaN(employeeSummary.metrics.improvement.deltaPct) ? 'N/A' : 
                            Math.round((employeeSummary.metrics.improvement.deltaPct || 0) * 100) / 100
                          }%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Charts */}
              {timeSeriesData.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ScoreTrendChart 
                      data={timeSeriesData} 
                      title="Score Progression"
                    />
                    <TimeSpentTrendChart 
                      data={timeSeriesData} 
                      title="Learning Time Trends"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <VideoUploadTrendChart 
                      data={timeSeriesData} 
                      title="Video Upload Activity"
                    />
                    <ActivityComparisonChart 
                      data={timeSeriesData.map(item => ({
                        week: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        lessons: item.lessonsCompleted || 0,
                        videos: item.videosUploaded || 0,
                        timeSpent: item.timeSpent || 0
                      }))} 
                      title="Activity Comparison"
                    />
                  </div>

                  <CombinedMetricsChart 
                    data={timeSeriesData} 
                    title="Combined Performance Overview"
                    height={350}
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
