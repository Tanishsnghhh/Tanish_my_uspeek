"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, ArrowLeft, Layers } from "lucide-react";
import { WorkReportDialog } from "@/components/assignments/work-report-dialog";

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
}

interface EmployeeProfileRef {
  _id?: string;
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

export default function EmployeeAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [employeeProfileId, setEmployeeProfileId] = useState<string | null>(null);
  const [item, setItem] = useState<AssignmentEmployeeItem | null>(null);
  const [status, setStatus] = useState<string>("ASSIGNED");
  const [progress, setProgress] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const assignmentEmployeeId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string | undefined);

  const isAdmin = useMemo(() => user?.role === "ADMIN" || user?.role === "CORPORATE_ADMIN", [user?.role]);

  function cleanObjectId(id: any): string | null {
    if (!id) return null;
    if (typeof id === "string" && /^[a-f0-9]{24}$/i.test(id)) return id;
    if (typeof id === "object" && (id as any)._id) {
      const s = String((id as any)._id);
      return /^[a-f0-9]{24}$/i.test(s) ? s : null;
    }
    if (typeof id === "string") {
      const match = id.match(/[a-f0-9]{24}/i);
      if (match) return match[0];
    }
    return null;
  }
  function decodeJWT(t: string) {
    try {
      const base64Url = t.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
  const accountId = useMemo(() => {
    const fromUser = cleanObjectId(user?.corporateAccountId);
    if (fromUser) return fromUser;
    if (token) {
      const decoded = decodeJWT(token);
      const fromToken = cleanObjectId(decoded?.corporateAccountId);
      if (fromToken) return fromToken;
    }
    return null;
  }, [user?.corporateAccountId, token]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || !assignmentEmployeeId) return;

    const load = async () => {
      try {
        setLoading(true);
        // Resolve employee profile id for this user
        const employeeRes = await fetch(`/api/employees?method=by-user-id&targetId=${user?.id}`);
        const employeeJson = await employeeRes.json();
        const profile = Array.isArray(employeeJson.data) ? employeeJson.data[0] : null;
        if (!profile?.id) {
          toast({ title: "Profile missing", description: "No employee profile is linked to your user.", variant: "destructive" });
          setLoading(false);
          return;
        }
        setEmployeeProfileId(profile.id);

        // Fetch the assignment-employee by id
        // Get authentication token
        const authToken = token || localStorage.getItem('uspeak_token');
        
        const aeRes = await fetch(`/api/assignments/employees?id=${assignmentEmployeeId}`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
          }
        });
        if (!aeRes.ok) throw new Error("Failed to load assignment details");
        const aeJson = await aeRes.json();
        const data: AssignmentEmployeeItem | null = aeJson.data || null;
        if (!data) throw new Error("Assignment not found");

        // Optional ownership check: ensure the fetched assignment belongs to this employee
        if (cleanObjectId((data.employee_id as any)?._id) !== profile.id && !isAdmin) {
          toast({ title: "Access denied", description: "This assignment is not assigned to you.", variant: "destructive" });
          router.push("/employeeassignmnetpage");
          return;
        }

        setItem(data);
        setStatus(data.status);
        setProgress(data.progress_percentage ?? 0);
      } catch (e: any) {
        console.error(e);
        toast({ title: "Error", description: e.message || "Something went wrong", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAuthenticated, isLoading, user?.id, assignmentEmployeeId, isAdmin, router, toast]);

  const statusColor = (s: string) => {
    switch (s) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      case "ASSIGNED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const saveProgress = async () => {
    if (!item) return;
    try {
      // Get authentication token
      const authToken = token || localStorage.getItem('uspeak_token');
      
      const res = await fetch("/api/assignments/employees", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          assignmentEmployeeId: item._id,
          status,
          progress_percentage: progress,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to update");
      toast({ title: "Saved", description: "Progress updated" });
      setItem({ ...item, status, progress_percentage: progress });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Update failed", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-4">Please log in to view this assignment.</p>
            <Button onClick={() => (window.location.href = "/auth")}>Go to Login</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-xl font-semibold mb-2">Employee Assignment</h1>
            <p className="text-gray-600">Admins should manage assignments on the admin page.</p>
            <Button className="mt-4" onClick={() => (window.location.href = "/assignments")}>Go to Admin Assignments</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || !item) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900" />
        </div>
      </DashboardLayout>
    );
  }

  const inst = item.instance_id;
  const master = inst?.assignment_id as AssignmentMaster | undefined;
  const deadline = inst?.deadline ? new Date(inst.deadline).toLocaleString() : null;

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/employeeassignmnetpage")}> 
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-bold">{master?.title || "Assignment"}</h1>
            <Badge className={statusColor(item.status)}>{item.status}</Badge>
          </div>
          <div>
            <Button onClick={() => setDialogOpen(true)}>Open Editor</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-700">{master?.description || inst?.instructions || "No description provided."}</div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{master?.assignment_type || "TASK"}</span>
              </div>
              {deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due: {deadline}</span>
                </div>
              )}
            </div>

            {inst?.links && inst.links.length > 0 && (
              <div className="text-xs text-gray-500 space-y-1">
                <div className="font-medium text-gray-700">Links:</div>
                <ul className="list-disc pl-5 space-y-1">
                  {inst.links.map((link, idx) => (
                    <li key={idx} className="truncate">
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="status">Status</Label>
                <select id="status" className="mt-1 w-full border rounded-md px-3 py-2 bg-background" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <div>
                <Label htmlFor="progress">Progress %</Label>
                <Input id="progress" type="number" min={0} max={100} value={progress} onChange={(e) => setProgress(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={saveProgress}>Save</Button>
              </div>
            </div>
            {item.assigned_at && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Assigned {new Date(item.assigned_at).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {item && (
        <WorkReportDialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          assignmentEmployee={item as any}
          accountId={accountId || ''}
          employeeId={employeeProfileId || undefined}
        />
      )}
    </DashboardLayout>
  );
}
