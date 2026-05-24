"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Layers, User as UserIcon } from "lucide-react";
import { WorkReportDialog } from "@/components/assignments/work-report-dialog";
import Link from "next/link";

interface AssignmentMaster {
  _id: string;
  title: string;
  description?: string;
  assignment_type?: string;
  difficulty_level?: string;
}

interface AssignmentInstance {
  _id: string;
  assignment_id: AssignmentMaster;
  deadline?: string;
  assignment_scope: "INDIVIDUAL" | "BULK";
  status: string;
  instructions?: string;
  links?: string[];
  priority?: string;
  internal_notes?: string;
  notification_settings?: {
    email_reminders: boolean;
    push_notifications: boolean;
    reminder_frequency: string;
  };
  tags?: string[];
  estimated_completion_time?: number;
  max_attempts?: number;
  grading_type?: string;
  passing_score?: number;
  created_at?: string;
  updated_at?: string;
  assigned_by_user_id?: string;
}

interface EmployeeProfileRef {
  _id: string;
  first_name: string;
  last_name: string;
  department?: string;
  job_title?: string;
}

interface AssignmentEmployeeItem {
  _id: string;
  status: string;
  progress_percentage?: number;
  assigned_at?: string;
  instance_id: AssignmentInstance;
  employee_id?: EmployeeProfileRef;
}

export default function EmployeeAssignmentsPage() {
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const { toast } = useToast();

  const [dataLoading, setDataLoading] = useState(true);
  const [employeeProfileId, setEmployeeProfileId] = useState<string | null>(null);
  const [items, setItems] = useState<AssignmentEmployeeItem[]>([]);
  const [showWorkReportDialog, setShowWorkReportDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedAssignmentEmployee, setSelectedAssignmentEmployee] = useState<AssignmentEmployeeItem | null>(null);
  const [assignerNames, setAssignerNames] = useState<Record<string, string>>({});

  // Function to refresh assignments data
  const refreshAssignments = async () => {
    if (!employeeProfileId || !user?.id) return;
    
    try {
      console.log('🔄 Refreshing assignments data...');
      // Get authentication token
      const authToken = token || localStorage.getItem('uspeak_token');
      
      const response = await fetch(`/api/assignments/employees?employeeId=${employeeProfileId}`, {
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
      });
      if (!response.ok) throw new Error('Failed to refresh assignments');
      const result = await response.json();

      if (result.success) {
        console.log(`✅ Refreshed ${(result.data || []).length} assignments`);
        setItems(result.data || []);
      } else {
        console.error('Failed to refresh assignments:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing assignments:', error);
    }
  };

  // Function to get assigner name (resilient)
  const getAssignerName = async (userId: string) => {
    // return cached
    if (assignerNames[userId]) return assignerNames[userId];

    // validate likely-mongodb id
    if (!userId || typeof userId !== 'string' || !/^[a-f0-9]{24}$/i.test(userId)) {
      // not an object id — just return as-is
      setAssignerNames(prev => ({ ...prev, [userId]: userId }));
      return userId;
    }

    // if no token, don't attempt authorized call
    if (!token) {
      setAssignerNames(prev => ({ ...prev, [userId]: userId }));
      return userId;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      if (response.status === 404) {
        // user deleted or not found — use friendly fallback
        setAssignerNames(prev => ({ ...prev, [userId]: 'Unknown' }));
        return 'Unknown';
      }

      if (!response.ok) {
        // other non-OK responses — cache id to avoid repeated failing calls
        console.warn('Non-ok response fetching user', response.status);
        setAssignerNames(prev => ({ ...prev, [userId]: userId }));
        return userId;
      }

      const userData = await response.json();
      // API returns { success: true, data: detailedUser }
      const payload = userData?.data || userData;
      const name = `${payload?.firstName || payload?.first_name || ''} ${payload?.lastName || payload?.last_name || ''}`.trim();
      const finalName = name || payload?.email || userId;
      setAssignerNames(prev => ({ ...prev, [userId]: finalName }));
      return finalName;
    } catch (error) {
      console.error('Error fetching assigner name:', error);
      setAssignerNames(prev => ({ ...prev, [userId]: userId }));
      return userId;
    }
  };

  const isAdmin = useMemo(() => {
    return user?.role === "ADMIN" || user?.role === "CORPORATE_ADMIN";
  }, [user?.role]);

  // Helpers to extract a clean accountId similar to admin page
  function cleanObjectId(id: any): string | null {
    if (!id) return null;
    if (typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id)) return id;
    if (typeof id === 'object' && id._id) {
      const s = String(id._id);
      return /^[a-f0-9]{24}$/i.test(s) ? s : null;
    }
    if (typeof id === 'string') {
      const match = id.match(/[a-f0-9]{24}/i);
      if (match) return match[0];
    }
    return null;
  }

  function decodeJWT(t: string) {
    try {
      const base64Url = t.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  const accountId = useMemo(() => {
    // prefer from user object
    const fromUser = cleanObjectId(user?.corporateAccountId);
    if (fromUser) return fromUser;
    // fallback to token decode
    if (token) {
      const decoded = decodeJWT(token);
      const fromToken = cleanObjectId(decoded?.corporateAccountId);
      if (fromToken) return fromToken;
    }
    return null;
  }, [user?.corporateAccountId, token]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || !user?.id) return;

    const load = async () => {
      try {
        setDataLoading(true);
        console.log(`Loading assignments for user: ${user.id}`);
        
        // 1) Find EmployeeProfile by current userId
        const employeeRes = await fetch(
          `/api/employees?method=by-user-id&targetId=${user.id}`
        );
        if (!employeeRes.ok) throw new Error("Failed to load employee profile");
        const employeeJson = await employeeRes.json();
        const profile = Array.isArray(employeeJson.data) ? employeeJson.data[0] : null;
        if (!profile?.id) {
          toast({
            title: "Profile missing",
            description: "No employee profile is linked to your user.",
            variant: "destructive",
          });
          setDataLoading(false);
          return;
        }
        setEmployeeProfileId(profile.id);
        console.log(`Found employee profile: ${profile.id}`);

        // 2) Load assignments for this employee
        // Get authentication token
        const authToken = token || localStorage.getItem('uspeak_token');
        
        const aeRes = await fetch(`/api/assignments/employees?employeeId=${profile.id}`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        });
        if (!aeRes.ok) throw new Error("Failed to load assignments");
        const aeJson = await aeRes.json();
        setItems(aeJson.data || []);
        console.log(`Loaded ${(aeJson.data || []).length} assignments`);

        // Fetch assigner names in parallel (resilient)
        const uniqueAssignerIds = [...new Set((aeJson.data || []).map((item: any) => item.instance_id?.assigned_by_user_id).filter(Boolean))];
        const validIds = uniqueAssignerIds.filter((id: any) => typeof id === 'string');
        if (validIds.length > 0) {
          await Promise.allSettled((validIds as string[]).map((id: string) => getAssignerName(id)));
        }
      } catch (e: any) {
        console.error('Error loading employee assignments:', e);
        toast({ title: "Error", description: e.message || "Something went wrong", variant: "destructive" });
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, [isAuthenticated, isLoading, user?.id, toast]);

  const statusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-4">Please log in to view your assignments.</p>
            <Button onClick={() => (window.location.href = "/auth")}>Go to Login</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isAdmin) {
    // Guard: this page is for employee view
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-xl font-semibold mb-2">Employee Assignments</h1>
            <p className="text-gray-600">This page is intended for employee users. Use the Assignments page for admin.</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/assignments")}>Go to Admin Assignments</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (dataLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Assignments</h1>
            <p className="text-lg text-gray-600">All tasks assigned to you with deadlines and detailed information</p>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="shadow-lg border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Assignments Found</h3>
              <p className="text-lg text-gray-600">You don't have any assignments at the moment. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {items.map((item) => {
              const inst = item.instance_id;
              const master = inst?.assignment_id as AssignmentMaster | undefined;
              const progress = item.progress_percentage ?? 0;
              const deadline = inst?.deadline ? new Date(inst.deadline).toLocaleString() : null;

              return (
                <Card key={item._id} className="shadow-lg border-2 border-gray-200 hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white to-gray-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-xl font-bold">
                      <span className="truncate text-lg" title={master?.title || "Assignment"}>
                        {master?.title || "Assignment"}
                      </span>
                      <Badge className={`${statusColor(item.status)} text-sm px-3 py-1 font-semibold`}>
                        {item.status}
                      </Badge>
                    </CardTitle>
                    {inst?.assigned_by_user_id && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                        <UserIcon className="w-4 h-4" />
                        <span className="font-medium">Assigned by {assignerNames[inst.assigned_by_user_id] || inst.assigned_by_user_id}</span>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-base text-gray-700 leading-relaxed">
                      {master?.description || inst?.instructions || "No description provided."}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">{master?.assignment_type || "TASK"}</span>
                      </div>
                      {deadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-red-600" />
                          <span className="font-medium">Due: {deadline}</span>
                        </div>
                      )}
                    </div>

                    {inst?.priority && (
                      <div className="flex items-center gap-2 text-sm bg-yellow-50 p-2 rounded-lg">
                        <span className="font-bold text-gray-800">Priority:</span>
                        <Badge variant="outline" className={`text-sm px-2 py-1 font-bold ${inst.priority === 'URGENT' ? 'border-red-500 text-red-700 bg-red-50' : 'border-yellow-500 text-yellow-700 bg-yellow-50'}`}>
                          {inst.priority}
                        </Badge>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {inst?.estimated_completion_time && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <span className="font-bold text-gray-800 block">Est. Time:</span>
                          <span className="text-lg font-semibold text-blue-700">{inst.estimated_completion_time} hrs</span>
                        </div>
                      )}
                      {inst?.max_attempts && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <span className="font-bold text-gray-800 block">Max Attempts:</span>
                          <span className="text-lg font-semibold text-green-700">{inst.max_attempts}</span>
                        </div>
                      )}
                      {inst?.grading_type && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <span className="font-bold text-gray-800 block">Grading:</span>
                          <span className="text-lg font-semibold text-purple-700">{inst.grading_type}</span>
                        </div>
                      )}
                      {inst?.passing_score && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <span className="font-bold text-gray-800 block">Passing Score:</span>
                          <span className="text-lg font-semibold text-orange-700">{inst.passing_score}%</span>
                        </div>
                      )}
                    </div>

                    {inst?.tags && inst.tags.length > 0 && (
                      <div className="text-sm">
                        <span className="font-bold text-gray-800 text-base">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {inst.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm px-3 py-1 bg-indigo-100 text-indigo-800 font-medium">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-100 p-4 rounded-lg">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-700 font-bold text-base">Progress</span>
                        <span className="font-bold text-lg text-gray-900">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-3 bg-gray-200" />
                    </div>

                    {inst?.created_at && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                        <span className="font-medium">Created: {new Date(inst.created_at).toLocaleString()}</span>
                        {inst.updated_at && <span className="ml-4 font-medium">Updated: {new Date(inst.updated_at).toLocaleString()}</span>}
                      </div>
                    )}

                    {inst?.notification_settings && (
                      <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded-lg">
                        <span className="font-medium">Notifications: </span>
                        {inst.notification_settings.email_reminders ? 'Email ' : ''}
                        {inst.notification_settings.push_notifications ? 'Push ' : ''}
                        ({inst.notification_settings.reminder_frequency})
                      </div>
                    )}

                    <div className="pt-4 flex items-center justify-between border-t border-gray-200">
                        <Button
                          variant="outline"
                          className="text-sm px-4 py-2 font-semibold border-2 hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => {
                            setSelectedAssignmentEmployee(item);
                            setShowDetailsDialog(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          className="text-sm px-4 py-2 font-semibold bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedAssignmentEmployee(item);
                            setShowWorkReportDialog(true);
                          }}
                        >
                          Submit Report
                        </Button>
                      {item.assigned_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">Assigned {new Date(item.assigned_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedAssignmentEmployee && selectedAssignmentEmployee.employee_id && (
        <WorkReportDialog
          isOpen={showWorkReportDialog}
          onOpenChange={setShowWorkReportDialog}
          assignmentEmployee={{
            _id: selectedAssignmentEmployee._id,
            instance_id: {
              _id: selectedAssignmentEmployee.instance_id._id,
              assignment_id: {
                title: selectedAssignmentEmployee.instance_id.assignment_id.title || 'Assignment',
                assignment_type: selectedAssignmentEmployee.instance_id.assignment_id.assignment_type || 'TASK'
              },
              status: selectedAssignmentEmployee.instance_id.status,
              deadline: selectedAssignmentEmployee.instance_id.deadline
            },
            employee_id: {
              first_name: selectedAssignmentEmployee.employee_id.first_name,
              last_name: selectedAssignmentEmployee.employee_id.last_name,
              department: selectedAssignmentEmployee.employee_id.department || '',
              job_title: selectedAssignmentEmployee.employee_id.job_title || ''
            },
            status: selectedAssignmentEmployee.status,
            progress_percentage: selectedAssignmentEmployee.progress_percentage || 0
          }}
          accountId={accountId || ''}
          employeeId={employeeProfileId || undefined}
          onSuccess={refreshAssignments}
        />
      )}

      {/* Details Dialog */}
      {selectedAssignmentEmployee && showDetailsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Assignment Details</h2>
                <button
                  onClick={() => setShowDetailsDialog(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Instructions</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedAssignmentEmployee.instance_id.instructions || 'No instructions provided.'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Internal Notes</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedAssignmentEmployee.instance_id.internal_notes || 'No internal notes.'}</p>
                  </div>
                </div>
                
                {selectedAssignmentEmployee.instance_id.assigned_by_user_id && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Assigned By</h3>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-gray-700">{assignerNames[selectedAssignmentEmployee.instance_id.assigned_by_user_id] || selectedAssignmentEmployee.instance_id.assigned_by_user_id}</p>
                    </div>
                  </div>
                )}
                
                {selectedAssignmentEmployee.instance_id.links && selectedAssignmentEmployee.instance_id.links.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Links</h3>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <ul className="list-disc pl-5 space-y-1">
                        {selectedAssignmentEmployee.instance_id.links.map((link, idx) => (
                          <li key={idx}>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowDetailsDialog(false)}
                  className="px-4 py-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
