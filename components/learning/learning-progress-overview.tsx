'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Trophy,
  TrendingUp,
  Target
} from 'lucide-react';

interface MaterialStats {
  material_id: string;
  total_sessions: number;
  completed_sessions: number;
  completion_percentage: number;
  total_quiz_attempts: number;
  average_quiz_score: number;
  last_updated: string;
}

interface LearningProgressOverviewProps {
  onMaterialSelect?: (materialId: string) => void;
}

export function LearningProgressOverview({ onMaterialSelect }: LearningProgressOverviewProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<MaterialStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchProgressStats();
    }
  }, [user?.id]);

  const fetchProgressStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/learning-progress/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.overall_stats);
      } else {
        setError(data.error || 'Failed to fetch progress stats');
      }
    } catch (err) {
      setError('Failed to fetch progress stats');
      console.error('Error fetching progress stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialDisplayName = (materialId: string): string => {
    const nameMap: { [key: string]: string } = {
      'storytelling': 'Storytelling',
      'empathy': 'Empathy',
      'communication-tips': 'Communication Tips',
      'communication-styles': 'Communication Styles',
      'crucial-conversations': 'Crucial Conversations',
      'anxiety': 'Anxiety Management',
      'confidence': 'Confidence Building',
      'elevator-speech': 'Elevator Speech',
      'interviewing-skills': 'Interviewing Skills',
      'using-data': 'Using Data Effectively'
    };

    return nameMap[materialId] || materialId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDifficultyColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    if (percentage >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading progress...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchProgressStats} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Learning Progress Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Start exploring our learning materials to track your progress here.
          </p>
          <Button onClick={() => window.location.href = '/learning-materials'}>
            Explore Learning Materials
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalMaterials = stats.length;
  const completedMaterials = stats.filter(s => s.completion_percentage === 100).length;
  const overallCompletion = totalMaterials > 0
    ? Math.round((completedMaterials / totalMaterials) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Learning Progress Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalMaterials}</div>
              <div className="text-sm text-gray-600">Total Materials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedMaterials}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{overallCompletion}%</div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(stats.reduce((sum, s) => sum + s.average_quiz_score, 0) / stats.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Quiz Score</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={overallCompletion} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Individual Material Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((material) => (
          <Card key={material.material_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {getMaterialDisplayName(material.material_id)}
                </CardTitle>
                <Badge className={getDifficultyColor(material.completion_percentage)}>
                  {material.completion_percentage}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sessions Completed</span>
                  <span>{material.completed_sessions} / {material.total_sessions}</span>
                </div>
                <Progress value={material.completion_percentage} className="w-full" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>Quiz Attempts: {material.total_quiz_attempts}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Avg Score: {material.average_quiz_score}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Last updated: {new Date(material.last_updated).toLocaleDateString()}</span>
                </div>
                {onMaterialSelect && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onMaterialSelect(material.material_id)}
                  >
                    Continue Learning
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
