'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  Calendar,
  Clock,
  FileText,
  Save,
  Send,
  Trash2,
  Edit,
  Plus,
  X
} from 'lucide-react';

interface AssignmentInstance {
  _id: string;
  assignment_id: {
    title: string;
    assignment_type: string;
  };
  status: string;
  deadline?: string;
  instructions?: string;
  internal_notes?: string;
  priority?: string;
  estimated_completion_time?: number;
  max_attempts?: number;
  grading_type?: string;
  passing_score?: number;
  tags?: string[];
  links?: string[];
  created_at?: string;
  updated_at?: string;
  notification_settings?: {
    email_reminders: boolean;
    push_notifications: boolean;
    reminder_frequency: string;
  };
}

interface AssignmentEmployee {
  _id: string;
  instance_id: AssignmentInstance;
  employee_id: {
    first_name: string;
    last_name: string;
    department: string;
    job_title: string;
  };
  status: string;
  progress_percentage: number;
}

interface WorkReport {
  _id: string;
  content: string;
  work_date: string;
  hours_spent?: number;
  tags?: string[];
  link?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  employee_id: {
    first_name: string;
    last_name: string;
  };
}

interface WorkReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentEmployee: AssignmentEmployee;
  accountId: string;
  employeeId?: string; // New: explicit employee profile id for submissions
  onSuccess?: () => void; // Callback to refresh parent data after operations
}

export function WorkReportDialog({ 
  isOpen, 
  onOpenChange, 
  assignmentEmployee,
  accountId,
  employeeId,
  onSuccess
}: WorkReportDialogProps) {
  const [workReports, setWorkReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingReport, setEditingReport] = useState<WorkReport | null>(null);
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursSpent, setHoursSpent] = useState<number | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [link, setLink] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && assignmentEmployee?._id) {
      fetchWorkReports();
    }
  }, [isOpen, assignmentEmployee?._id]);

  const fetchWorkReports = async () => {
    if (!assignmentEmployee?._id || !accountId) {
      console.warn('Missing required data for fetching work reports');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Fetching work reports with params:', {
        assignmentEmployeeId: assignmentEmployee._id,
        accountId: accountId,
        url: `/api/assignments/work-reports?assignmentEmployeeId=${assignmentEmployee._id}&accountId=${accountId}`
      });
      
      const response = await fetch(
        `/api/assignments/work-reports?assignmentEmployeeId=${assignmentEmployee._id}&accountId=${accountId}`
      );
      
      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      const result = await response.json();
      console.log('📊 API Result:', result);
      
      if (result.success) {
        console.log('📊 Work reports fetched:', {
          count: result.data?.length || 0,
          reports: result.data?.map((r: any) => ({
            id: r._id,
            content: r.content?.substring(0, 30) + '...',
            work_date: r.work_date,
            created_at: r.created_at
          })) || []
        });
        
        // Check for duplicates in the frontend data
        const reportIds = result.data?.map((r: any) => r._id) || [];
        const uniqueIds = [...new Set(reportIds)];
        if (reportIds.length !== uniqueIds.length) {
          console.warn('⚠️ DUPLICATE IDs DETECTED IN API RESPONSE:', {
            totalCount: reportIds.length,
            uniqueCount: uniqueIds.length,
            duplicateIds: reportIds.filter((id: any, index: number) => reportIds.indexOf(id) !== index)
          });
        }
        
        // Deduplicate reports by _id to prevent duplicate rendering
        const uniqueReports = result.data?.filter((report: any, index: number, array: any[]) => 
          array.findIndex((r: any) => r._id === report._id) === index
        ) || [];
        
        if (uniqueReports.length !== (result.data?.length || 0)) {
          console.log('🧹 Deduplication applied:', {
            original: result.data?.length || 0,
            deduplicated: uniqueReports.length
          });
        }
        
        setWorkReports(uniqueReports);
      } else {
        console.error('❌ API Error:', result.error);
        toast({
          title: 'Error',
          description: 'Failed to fetch work reports',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Network Error fetching work reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch work reports',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReport = async (status: 'DRAFT' | 'SUBMITTED' = 'SUBMITTED') => {
    if (!editorContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter work done content',
        variant: 'destructive'
      });
      return;
    }

    if (!employeeId) {
      toast({
        title: 'Error',
        description: 'Employee ID not resolved for submission',
        variant: 'destructive'
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'User ID not available for submission tracking',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const reportData = {
        assignment_employee_id: assignmentEmployee._id,
        employee_id: employeeId,
        account_id: accountId,
        content: editorContent,
        work_date: workDate,
        hours_spent: hoursSpent || undefined,
        tags,
        status,
        submitted_by_employee: true, // Mark as employee submission
        user_id: user.id // Track which user submitted
      };

      let response;
      if (editingReport) {
        // Update existing report
        response = await fetch(`/api/assignments/work-reports/${editingReport._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData)
        });
      } else {
        // Create new report
        response = await fetch('/api/assignments/work-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData)
        });
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: editingReport ? 'Work report updated successfully' : 'Work report created successfully'
        });
        
        // Reset form
        setEditorContent('');
        setWorkDate(new Date().toISOString().split('T')[0]);
        setHoursSpent('');
        setTags([]);
        setShowEditor(false);
        setEditingReport(null);
        
        // Refresh reports
        await fetchWorkReports();
        
        // Call parent success callback to refresh parent data
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save work report',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error saving work report:', error);
      toast({
        title: 'Error',
        description: 'Failed to save work report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditReport = (report: WorkReport) => {
    setEditingReport(report);
    setEditorContent(report.content);
    setWorkDate(report.work_date.split('T')[0]);
    setHoursSpent(report.hours_spent || '');
    setTags(report.tags || []);
    setShowEditor(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this work report?')) {
      return;
    }

    try {
      const response = await fetch(`/api/assignments/work-reports/${reportId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Work report deleted successfully'
        });
        await fetchWorkReports();
        
        // Call parent success callback to refresh parent data
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete work report',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting work report:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete work report',
        variant: 'destructive'
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Safety check - don't render if essential data is missing
  if (!assignmentEmployee?._id || !accountId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Work Reports - {assignmentEmployee.instance_id?.assignment_id?.title || 'Assignment'}
          </DialogTitle>
          <div className="text-sm text-gray-600">
            Employee: {assignmentEmployee.employee_id?.first_name || ''} {assignmentEmployee.employee_id?.last_name || ''}
            {assignmentEmployee.employee_id?.department && assignmentEmployee.employee_id?.job_title && (
              <span>
                {' • '}
                {assignmentEmployee.employee_id.department} - {assignmentEmployee.employee_id.job_title}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Assignment Details</TabsTrigger>
              <TabsTrigger value="reports">Work Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Title:</Label>
                      <p className="mt-1">{assignmentEmployee.instance_id?.assignment_id?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Type:</Label>
                      <p className="mt-1">{assignmentEmployee.instance_id?.assignment_id?.assignment_type || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Status:</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(assignmentEmployee.status)}>
                          {assignmentEmployee.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">Deadline:</Label>
                      <p className="mt-1">{assignmentEmployee.instance_id?.deadline ? formatDate(assignmentEmployee.instance_id.deadline) : 'No deadline'}</p>
                    </div>
                    {assignmentEmployee.instance_id?.priority && (
                      <div>
                        <Label className="font-medium">Priority:</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className={assignmentEmployee.instance_id.priority === 'URGENT' ? 'border-red-500 text-red-700' : 'border-yellow-500 text-yellow-700'}>
                            {assignmentEmployee.instance_id.priority}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {assignmentEmployee.instance_id?.estimated_completion_time && (
                      <div>
                        <Label className="font-medium">Est. Time:</Label>
                        <p className="mt-1">{assignmentEmployee.instance_id.estimated_completion_time} hrs</p>
                      </div>
                    )}
                    {assignmentEmployee.instance_id?.max_attempts && (
                      <div>
                        <Label className="font-medium">Max Attempts:</Label>
                        <p className="mt-1">{assignmentEmployee.instance_id.max_attempts}</p>
                      </div>
                    )}
                    {assignmentEmployee.instance_id?.grading_type && (
                      <div>
                        <Label className="font-medium">Grading:</Label>
                        <p className="mt-1">{assignmentEmployee.instance_id.grading_type}</p>
                      </div>
                    )}
                    {assignmentEmployee.instance_id?.passing_score && (
                      <div>
                        <Label className="font-medium">Passing Score:</Label>
                        <p className="mt-1">{assignmentEmployee.instance_id.passing_score}%</p>
                      </div>
                    )}
                  </div>

                  {assignmentEmployee.instance_id?.tags && assignmentEmployee.instance_id.tags.length > 0 && (
                    <div>
                      <Label className="font-medium">Tags:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {assignmentEmployee.instance_id.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignmentEmployee.instance_id?.instructions && (
                    <div>
                      <Label className="font-medium">Instructions:</Label>
                      <div className="mt-2 p-4 bg-blue-50 rounded-lg text-sm leading-relaxed">
                        {assignmentEmployee.instance_id.instructions}
                      </div>
                    </div>
                  )}

                  {assignmentEmployee.instance_id?.internal_notes && (
                    <div>
                      <Label className="font-medium">Internal Notes:</Label>
                      <div className="mt-2 p-4 bg-red-50 rounded-lg border-l-4 border-red-400 text-sm leading-relaxed">
                        {assignmentEmployee.instance_id.internal_notes}
                      </div>
                    </div>
                  )}

                  {assignmentEmployee.instance_id?.links && assignmentEmployee.instance_id.links.length > 0 && (
                    <div>
                      <Label className="font-medium">Links:</Label>
                      <ul className="mt-2 list-disc pl-5 space-y-1">
                        {assignmentEmployee.instance_id.links.map((link, idx) => (
                          <li key={idx}>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {assignmentEmployee.instance_id?.notification_settings && (
                    <div>
                      <Label className="font-medium">Notifications:</Label>
                      <p className="mt-1 text-sm">
                        {assignmentEmployee.instance_id.notification_settings.email_reminders ? 'Email ' : ''}
                        {assignmentEmployee.instance_id.notification_settings.push_notifications ? 'Push ' : ''}
                        ({assignmentEmployee.instance_id.notification_settings.reminder_frequency})
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 pt-4 border-t">
                    <p>Created: {assignmentEmployee.instance_id?.created_at ? formatDate(assignmentEmployee.instance_id.created_at) : 'N/A'}</p>
                    {assignmentEmployee.instance_id?.updated_at && assignmentEmployee.instance_id.updated_at !== assignmentEmployee.instance_id.created_at && (
                      <p>Updated: {formatDate(assignmentEmployee.instance_id.updated_at)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              {/* Add New Report Button */}
              {!showEditor && (
                <Button 
                  onClick={() => setShowEditor(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Work Report
                </Button>
              )}

              {/* Work Report Editor */}
              {showEditor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingReport ? 'Edit Work Report' : 'New Work Report'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Date and Hours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="work-date">Work Date</Label>
                        <Input
                          id="work-date"
                          type="date"
                          value={workDate}
                          onChange={(e) => setWorkDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hours-spent">Hours Spent</Label>
                        <Input
                          id="hours-spent"
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          placeholder="e.g., 2.5"
                          value={hoursSpent}
                          onChange={(e) => setHoursSpent(e.target.value ? parseFloat(e.target.value) : '')}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add a tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Work Description Editor */}
                    <div>
                      <Label>Work Done Description</Label>
                      <Textarea
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                        className="mt-2 min-h-[200px]"
                        placeholder="Describe what work was accomplished, challenges faced, next steps..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowEditor(false);
                          setEditingReport(null);
                          setEditorContent('');
                          setWorkDate(new Date().toISOString().split('T')[0]);
                          setHoursSpent('');
                          setTags([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleSaveReport('DRAFT')}
                        disabled={loading}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                      </Button>
                      <Button 
                        onClick={() => handleSaveReport('SUBMITTED')}
                        disabled={loading}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Submit Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing Work Reports */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Previous Reports ({workReports.length})</h3>
                
                {loading ? (
                  <div className="text-center py-4">Loading work reports...</div>
                ) : workReports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No work reports found. Create your first report above.
                  </div>
                ) : (
                  workReports.map((report: any, index: number) => {
                    console.log(`🔍 Rendering report ${index}:`, { id: report._id, content: report.content?.substring(0, 20) });
                    return (
                      <Card key={report._id}> {/* Use only _id as key, not _id-index */}
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  {formatDate(report.work_date)}
                                </span>
                              </div>
                              {report.hours_spent && (
                                <>
                                  <Separator orientation="vertical" className="h-4" />
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">
                                      {report.hours_spent}h
                                    </span>
                                  </div>
                                </>
                              )}
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReport(report)}
                              >
                                🔗 View Submission
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditReport(report)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteReport(report._id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Employee Information */}
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <span>submitted by</span>
                            <span className="font-medium">
                              {report.employee_id?.first_name || 'Unknown'} {report.employee_id?.last_name || ''}
                            </span>
                          </div>
                          
                          {report.tags && report.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {report.tags.map((tag: string, tagIndex: number) => (
                                <Badge key={tagIndex} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                            {report.content}
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            Created: {formatDate(report.created_at)}
                            {report.updated_at !== report.created_at && (
                              <> • Updated: {formatDate(report.updated_at)}</>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Work Report Editor */}
          {showEditor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {editingReport ? 'Edit Work Report' : 'New Work Report'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date and Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="work-date">Work Date</Label>
                    <Input
                      id="work-date"
                      type="date"
                      value={workDate}
                      onChange={(e) => setWorkDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hours-spent">Hours Spent</Label>
                    <Input
                      id="hours-spent"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      placeholder="e.g., 2.5"
                      value={hoursSpent}
                      onChange={(e) => setHoursSpent(e.target.value ? parseFloat(e.target.value) : '')}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Work Description Editor */}
                <div>
                  <Label>Work Done Description</Label>
                  <Textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="mt-2 min-h-[200px]"
                    placeholder="Describe what work was accomplished, challenges faced, next steps..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowEditor(false);
                      setEditingReport(null);
                      setEditorContent('');
                      setWorkDate(new Date().toISOString().split('T')[0]);
                      setHoursSpent('');
                      setTags([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSaveReport('DRAFT')}
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button 
                    onClick={() => handleSaveReport('SUBMITTED')}
                    disabled={loading}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Work Reports */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Previous Reports ({workReports.length})</h3>
            
            {loading ? (
              <div className="text-center py-4">Loading work reports...</div>
            ) : workReports.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No work reports found. Create your first report above.
              </div>
            ) : (
              workReports.map((report: any, index: number) => {
                console.log(`🔍 Rendering report ${index}:`, { id: report._id, content: report.content?.substring(0, 20) });
                return (
                  <Card key={report._id}> {/* Use only _id as key, not _id-index */}
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">
                              {formatDate(report.work_date)}
                            </span>
                          </div>
                          {report.hours_spent && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">
                                  {report.hours_spent}h
                                </span>
                              </div>
                            </>
                          )}
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            🔗 View Submission
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReport(report)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteReport(report._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Employee Information */}
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <span>submitted by</span>
                        <span className="font-medium">
                          {report.employee_id?.first_name || 'Unknown'} {report.employee_id?.last_name || ''}
                        </span>
                      </div>
                      
                      {report.tags && report.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {report.tags.map((tag: string, tagIndex: number) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {report.content}
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        Created: {formatDate(report.created_at)}
                        {report.updated_at !== report.created_at && (
                          <> • Updated: {formatDate(report.updated_at)}</>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Submission Details Popup */}
        {selectedReport && (
          <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Submission Details
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Date:</Label>
                    <p>{formatDate(selectedReport.work_date)}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Status:</Label>
                    <Badge className={getStatusColor(selectedReport.status)}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="font-medium">Hours Spent:</Label>
                    <p>{selectedReport.hours_spent || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Submitted by:</Label>
                    <p>{selectedReport.employee_id?.first_name || 'Unknown'} {selectedReport.employee_id?.last_name || ''}</p>
                  </div>
                </div>
                
                {selectedReport.tags && selectedReport.tags.length > 0 && (
                  <div>
                    <Label className="font-medium">Tags:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedReport.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="font-medium">Work Done:</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md prose prose-sm max-w-none whitespace-pre-wrap">
                    {selectedReport.content}
                  </div>
                </div>

                {selectedReport.link && (
                  <div>
                    <Label className="font-medium">Additional Link:</Label>
                    <p className="text-blue-600 underline break-all">{selectedReport.link}</p>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  <p>Created: {formatDate(selectedReport.created_at)}</p>
                  {selectedReport.updated_at !== selectedReport.created_at && (
                    <p>Updated: {formatDate(selectedReport.updated_at)}</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
