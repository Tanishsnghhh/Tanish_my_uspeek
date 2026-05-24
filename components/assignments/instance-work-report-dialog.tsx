'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  X,
  User
} from 'lucide-react';

// Syncfusion Rich Text Editor
import { RichTextEditorComponent, Toolbar, Link, Image, Count, HtmlEditor, QuickToolbar, Table, Inject } from '@syncfusion/ej2-react-richtexteditor';

// Import Syncfusion CSS
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-richtexteditor/styles/material.css';

interface AssignmentInstance {
  _id: string;
  assignment_id: {
    title: string;
    description: string;
    assignment_type: string;
    difficulty_level: string;
    estimated_duration?: number;
  };
  assignment_scope: 'INDIVIDUAL' | 'BULK';
  status: string;
  deadline?: string;
  instructions?: string;
  created_at: string;
  assigned_by_user_id: { email: string };
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
  employee_id?: string;
  employee_name?: string;
}

interface Assignee {
  employee_id: string;
  name: string;
  department?: string;
  job_title?: string;
  employeeId?: string;
  status: string;
  assigned_at: string;
}

interface InstanceWorkReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  instance: AssignmentInstance;
  accountId: string;
  userId: string;
}

export function InstanceWorkReportDialog({ 
  isOpen, 
  onOpenChange, 
  instance,
  accountId,
  userId
}: InstanceWorkReportDialogProps) {
  const { toast } = useToast();
  const { token, user, isLoading } = useAuth();

  useEffect(() => {
    if (isOpen) {
      console.log('InstanceWorkReportDialog opened with:', {
        instanceId: instance?._id,
        accountId,
        userId,
        instanceData: instance
      });
      
      if (!accountId || !userId) {
        console.error('Missing required props:', { accountId, userId });
        toast({
          title: 'Error',
          description: 'Missing account or user information',
          variant: 'destructive'
        });
        return;
      }
    }
  }, [isOpen, accountId, userId, instance]);

  const [workReports, setWorkReports] = useState<WorkReport[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingReport, setEditingReport] = useState<WorkReport | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursSpent, setHoursSpent] = useState<number | ''>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [link, setLink] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const toolbarSettings = {
    items: ['Bold', 'Italic', 'Underline', '|',
           'Formats', 'Alignments', '|',
           'CreateLink', 'Image', '|',
           'NumberFormatList', 'BulletFormatList', '|',
           'Blockquote', 'CodeBlock', '|',
           'SourceCode', 'Undo', 'Redo']
  };

  const quickToolbarSettings = {
    table: ['TableHeader', 'TableRows', 'TableColumns', 'TableCell', '-', 'BackgroundColor', 'TableRemove', 'TableCellVerticalAlign', 'Styles'],
    showOnRightClick: true,
  };

  useEffect(() => {
    if (isOpen && instance._id && !isLoading && token) {
      fetchWorkReports();
      fetchAssignees();
    }
  }, [isOpen, instance._id, isLoading, token]);

  useEffect(() => {
    if (user?.role === 'CORPORATE_ADMIN' && assignees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(assignees[0].employee_id);
    }
  }, [user?.role, assignees, selectedEmployeeId]);

  const fetchAssignees = async () => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'Authentication required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/assignments/instances/${instance._id}/assignees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setAssignees(result.data || []);
      } else {
        console.error('Failed to fetch assignees:', result);
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch assignees',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching assignees:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch assignees',
        variant: 'destructive'
      });
    }
  };

  const fetchWorkReports = async () => {
    if (!token) {
      toast({
        title: 'Error',
        description: 'Authentication required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching work reports with:', {
        instanceId: instance._id,
        accountId: accountId,
        userId: userId
      });
      
      const response = await fetch(
        `/api/assignments/instances/${instance._id}/work-reports?accountId=${accountId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const result = await response.json();
      
      console.log('Work reports API response:', result);
      
      if (result.success) {
        setWorkReports(result.data || []);
      } else {
        console.error('Failed to fetch work reports:', result);
        toast({
          title: 'Error',
          description: result.error || 'Failed to fetch work reports',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching work reports:', error);
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

    if (!token) {
      toast({
        title: 'Error',
        description: 'Authentication required',
        variant: 'destructive'
      });
      return;
    }

    if (user?.role === 'CORPORATE_ADMIN' && !selectedEmployeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee to submit on behalf of',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      const reportData: any = {
        instance_id: instance._id,
        account_id: accountId,
        user_id: userId,
        content: editorContent,
        work_date: workDate,
        hours_spent: hoursSpent || null,
        tags: tags,
        link: link.trim() || null,
        status: status,
        submitted_by_admin: true // Mark as admin submission
      };

      if (user?.role === 'CORPORATE_ADMIN' && selectedEmployeeId) {
        reportData.target_employee_id = selectedEmployeeId;
      }

      const url = editingReport 
        ? `/api/assignments/instances/${instance._id}/work-reports/${editingReport._id}`
        : `/api/assignments/instances/${instance._id}/work-reports`;
      
      const method = editingReport ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: `Work report ${editingReport ? 'updated' : 'created'} successfully`,
        });
        
        setEditorContent('');
        setWorkDate(new Date().toISOString().split('T')[0]);
        setHoursSpent('');
        setTags([]);
        setNewTag('');
        setLink('');
        setShowEditor(false);
        setEditingReport(null);
        
        fetchWorkReports();
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
    setWorkDate(report.work_date);
    setHoursSpent(report.hours_spent || '');
    setTags(report.tags || []);
    setLink(report.link || '');
    setShowEditor(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this work report?')) {
      return;
    }

    if (!token) {
      toast({
        title: 'Error',
        description: 'Authentication required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/assignments/instances/${instance._id}/work-reports/${reportId}?accountId=${accountId}`,
        { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Work report deleted successfully',
        });
        fetchWorkReports();
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentTypeIcon = (type: string) => {
    switch (type) {
      case 'LESSON': return '📚';
      case 'VIDEO_TASK': return '🎥';
      case 'QUIZ': return '❓';
      case 'PRESENTATION': return '🎤';
      case 'ROLE_PLAY': return '🎭';
      case 'ASSESSMENT': return '📊';
      default: return '📝';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">
              {getAssignmentTypeIcon(instance.assignment_id.assignment_type)}
            </span>
            {instance.assignment_id.title} - Work Reports
          </DialogTitle>
          <DialogDescription>
            Manage and submit work reports for this assignment. View progress and collaborate with team members.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading authentication...</p>
            </div>
          </div>
        ) : !token ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-sm text-red-600 mb-2">Authentication required</p>
              <p className="text-xs text-gray-500">Please log in to access work reports</p>
            </div>
          </div>
        ) : (
          <>
            {user?.role === 'CORPORATE_ADMIN' && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Submit on behalf of an employee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignees.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="target-employee">Select employee</Label>
                        <select
                          id="target-employee"
                          className="mt-2 w-full border rounded-md px-3 py-2 bg-background"
                          value={selectedEmployeeId}
                          onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        >
                          {assignees.map((a) => (
                            <option key={a.employee_id} value={a.employee_id}>
                              {a.name || a.employeeId || a.employee_id}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-2">
                          You can submit work for any employee in this account. If the employee is not listed, they may not be assigned to this instance, but submission will still be accepted.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="target-employee-manual">Target Employee ID</Label>
                      <Input
                        id="target-employee-manual"
                        placeholder="Enter EmployeeProfile ID"
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        No assignees loaded. You can manually enter the employee's ID.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-3">{instance.assignment_id.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{instance.assignment_id.assignment_type}</Badge>
                        <Badge variant="outline">{instance.assignment_id.difficulty_level}</Badge>
                        <Badge variant="outline">{instance.assignment_scope}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Assigned by: {instance.assigned_by_user_id?.email || 'Unknown'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <User className="w-4 h-4 mt-0.5" />
                        <div>
                          <span className="font-medium">Assigned to:</span>
                          {assignees.length > 0 ? (
                            <div className="mt-1 space-y-1">
                              {assignees.map((assignee, index) => (
                                <div key={assignee.employee_id} className="text-xs">
                                  <span className="font-medium">{assignee.name}</span>
                                  {assignee.department && (
                                    <span className="text-gray-500"> • {assignee.department}</span>
                                  )}
                                  {assignee.job_title && (
                                    <span className="text-gray-500"> • {assignee.job_title}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 ml-1">Loading assignees...</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDate(instance.created_at)}</span>
                      </div>
                      {instance.deadline && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Deadline: {formatDate(instance.deadline)}</span>
                        </div>
                      )}
                      {instance.assignment_id.estimated_duration && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Estimated Duration: {instance.assignment_id.estimated_duration} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {instance.instructions && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Instructions:</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                        {instance.instructions}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Work Reports ({workReports.length})
                  </CardTitle>
                  <Button 
                    onClick={() => setShowEditor(!showEditor)}
                    disabled={loading}
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Report
                  </Button>
                </CardHeader>
                <CardContent>
                  {showEditor && (
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingReport ? 'Edit Work Report' : 'New Work Report'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="workDate">Work Date</Label>
                            <Input
                              id="workDate"
                              type="date"
                              value={workDate}
                              onChange={(e) => setWorkDate(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="hoursSpent">Hours Spent</Label>
                            <Input
                              id="hoursSpent"
                              type="number"
                              step="0.5"
                              min="0"
                              placeholder="e.g., 2.5"
                              value={hoursSpent}
                              onChange={(e) => setHoursSpent(e.target.value ? parseFloat(e.target.value) : '')}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="workLink">Submission Link (Optional)</Label>
                          <Input
                            id="workLink"
                            type="url"
                            placeholder="https://example.com/submission"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Add a link to your submission, demo, or relevant resource
                          </p>
                        </div>

                        <div>
                          <Label>Tags</Label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {tag}
                                <X 
                                  className="w-3 h-3 cursor-pointer" 
                                  onClick={() => handleRemoveTag(tag)}
                                />
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a tag..."
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            />
                            <Button type="button" onClick={handleAddTag} size="sm">Add</Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="workContent">Work Done Description</Label>
                          <Textarea
                            id="workContent"
                            placeholder="Describe what you worked on, challenges faced, progress made, etc..."
                            value={editorContent}
                            onChange={(e) => setEditorContent(e.target.value)}
                            rows={8}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use markdown formatting for better structure (e.g., **bold**, *italic*, - bullet points)
                          </p>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowEditor(false);
                              setEditingReport(null);
                              setEditorContent('');
                              setWorkDate(new Date().toISOString().split('T')[0]);
                              setHoursSpent('');
                              setTags([]);
                              setNewTag('');
                              setLink('');
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
                            {editingReport ? 'Update' : 'Submit'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : workReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No work reports yet. Click "Add Report" to create your first report.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {workReports.map((report) => (
                        <Card key={report._id} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(report.status)}>
                                  {report.status}
                                </Badge>
                                {report.employee_name && (
                                  <span className="text-sm text-gray-600">by {report.employee_name}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditReport(report)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteReport(report._id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(report.work_date).toLocaleDateString()}
                              </div>
                              {report.hours_spent && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {report.hours_spent}h
                                </div>
                              )}
                              <div>Updated: {formatDate(report.updated_at)}</div>
                            </div>
                            {report.tags && report.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {report.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {report.link && (
                              <div className="mt-2">
                                <a 
                                  href={report.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
                                >
                                  🔗 View Submission
                                </a>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent>
                            <div 
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: report.content }}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
