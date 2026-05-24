'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Clock, AlertCircle } from 'lucide-react';
import { usePendingAssignments } from '@/hooks/use-pending-assignments';
import { useAuth } from '@/hooks/use-auth';
import { WorkReportDialog } from '@/components/assignments/work-report-dialog';

interface PendingAssignmentsProps {
  userId?: string | null;
}

export function PendingAssignments({ userId }: PendingAssignmentsProps) {
  const { data: assignments, isLoading, error } = usePendingAssignments(userId || null);
  const { user } = useAuth();
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});
  const [workReportDialogOpen, setWorkReportDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const handleStartAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setWorkReportDialogOpen(true);
  };

  useEffect(() => {
    const dates: Record<string, string> = {};
    assignments.forEach(assignment => {
      if (assignment.instance_id?.deadline) {
        dates[assignment._id] = formatDate(new Date(assignment.instance_id.deadline));
      }
    });
    setFormattedDates(dates);
  }, [assignments]);

  const getPriorityFromDifficulty = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'advanced':
      case 'expert':
        return 'high';
      case 'intermediate':
        return 'medium';
      case 'beginner':
      case 'basic':
        return 'low';
      default:
        return 'medium';
    }
  };

  const getPriorityColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'advanced':
      case 'expert':
        return 'bg-red-100 text-red-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'beginner':
      case 'basic':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'body language':
        return 'bg-blue-100 text-blue-800';
      case 'vocal tone':
        return 'bg-purple-100 text-purple-800';
      case 'word power':
        return 'bg-orange-100 text-orange-800';
      case 'presentation':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return '15 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500 shadow-lg">
              <BookOpen className="w-5 h-5 text-white filter drop-shadow-sm" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Pending Assignments
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
          <div className="h-32 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading assignments...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500 shadow-lg">
              <BookOpen className="w-5 h-5 text-white filter drop-shadow-sm" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Pending Assignments
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
          <div className="h-32 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-600">Failed to load assignments</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500 shadow-lg">
              <BookOpen className="w-5 h-5 text-white filter drop-shadow-sm" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Pending Assignments
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
          <div className="h-32 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No pending assignments</p>
              <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center space-x-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-indigo-400 to-blue-500 shadow-lg">
            <BookOpen className="w-5 h-5 text-white filter drop-shadow-sm" />
          </div>
          <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Pending Assignments
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-white/60 backdrop-blur-sm rounded-lg mx-4 mb-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {assignments.map((assignment) => {
            const assignmentData = assignment.instance_id?.assignment_id || assignment;
            const priority = getPriorityFromDifficulty(assignmentData.difficulty_level);

            return (
              <div key={assignment._id} className="p-4 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{assignmentData.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{assignmentData.description}</p>

                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={`${getPriorityColor(assignmentData.difficulty_level)} font-semibold shadow-sm`}>
                        {priority} priority
                      </Badge>
                      <Badge className={`${getCategoryColor(assignmentData.assignment_type)} font-semibold shadow-sm`}>
                        {assignmentData.assignment_type}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Due: {formattedDates[assignment._id] || 'No deadline'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDuration(assignmentData.estimated_duration || 15)}</span>
                      </div>
                      {assignment.status === 'IN_PROGRESS' && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>{assignment.progress_percentage || 0}% complete</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 ml-4"
                    onClick={() => handleStartAssignment(assignment)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    {assignment.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Work Report Dialog */}
      {selectedAssignment && (
        <WorkReportDialog
          isOpen={workReportDialogOpen}
          onOpenChange={setWorkReportDialogOpen}
          assignmentEmployee={{
            _id: selectedAssignment._id,
            instance_id: {
              _id: selectedAssignment.instance_id?._id,
              assignment_id: {
                title: selectedAssignment.instance_id?.assignment_id?.title || selectedAssignment.title,
                assignment_type: selectedAssignment.instance_id?.assignment_id?.assignment_type || selectedAssignment.assignment_type
              },
              status: selectedAssignment.status,
              deadline: selectedAssignment.instance_id?.deadline
            },
            employee_id: selectedAssignment.employee_id,
            status: selectedAssignment.status,
            progress_percentage: selectedAssignment.progress_percentage || 0
          }}
          accountId={user?.corporateAccountId || ''}
          employeeId={user?.employeeId}
          onSuccess={() => {
            // Refresh assignments after work report submission
            window.location.reload();
          }}
        />
      )}
    </Card>
  );
}