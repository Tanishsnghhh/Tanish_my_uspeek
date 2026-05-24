'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AssignmentViewer } from '@/components/learning/assignment-viewer';
import VoiceModulationTechniques from '@/components/learning/Learning Materials/Voice Modulation Techniques';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Clock, Star, TrendingUp, AlertTriangle, CheckCircle, Target, MessageSquare, Heart, Users, Zap, Mic, Presentation, Brain, BarChart3, GraduationCap, ClipboardList, BarChart, Eye, Video, ChevronDown, ChevronUp, X, Check, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// Quiz Results Interface
interface QuizAttempt {
  attempt_number: number;
  score: number;
  total_questions: number;
  correct_answers: number;
  answers: number[];
  time_taken: number;
  attempted_at: string;
}

// Video Progress Interface
interface VideoProgressData {
  id: string;
  user_id: string;
  account_id: string;
  material_id: string;
  video_progress: {
    [sessionId: string]: {
      watched_duration: number;
      total_duration: number;
      completion_percentage: number;
      last_watched_at: string;
      is_completed: boolean;
    };
  };
  quiz_attempts: {
    [sessionId: string]: Array<{
      attempt_number: number;
      score: number;
      total_questions: number;
      correct_answers: number;
      answers: number[];
      time_taken: number;
      attempted_at: string;
    }>;
  };
  overall_completion: {
    is_completed: boolean;
    total_sessions_completed: number;
    total_sessions: number;
  };
  created_at: string;
  updated_at: string;
}

const lessons = [
  {
    id: 1,
    title: 'Mastering Eye Contact',
    description: 'Learn how to maintain appropriate eye contact to build trust and engagement',
    duration: '15 min',
    difficulty: 'Beginner',
    rating: 4.8,
    category: 'Body Language',
    uploadId: '1756922545919', // Real uploadId from video analysis
    fallbackImage: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 2,
    title: 'Voice Modulation Techniques',
    description: 'Discover how to vary your pitch, pace, and volume for maximum impact',
    duration: '22 min',
    difficulty: 'Intermediate',
    rating: 4.9,
    category: 'Vocal Tone',
    uploadId: '1756924352880', // Real uploadId from video analysis
    fallbackImage: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: 3,
    title: 'Eliminating Filler Words',
    description: 'Strategies to reduce "um", "uh", and other verbal fillers in your speech',
    duration: '18 min',
    difficulty: 'Beginner',
    rating: 4.7,
    category: 'Word Power',
    uploadId: '1756924945226', // Real uploadId from video analysis
    fallbackImage: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

// New learning materials (smaller cards with icons)
const newLearningMaterials = [
  {
    id: 4,
    title: 'Storytelling',
    description: 'Master the art of compelling storytelling for presentations',
    duration: '20 min',
    difficulty: 'Intermediate',
    category: 'Communication',
    icon: MessageSquare
  },
  {
    id: 5,
    title: 'Empathy',
    description: 'Develop empathy skills for better interpersonal communication',
    duration: '18 min',
    difficulty: 'Beginner',
    category: 'Interpersonal',
    icon: Heart
  },
  {
    id: 6,
    title: 'Communication Tips',
    description: 'Essential tips for effective communication in any setting',
    duration: '25 min',
    difficulty: 'Beginner',
    category: 'Communication',
    icon: Users
  },
  {
    id: 7,
    title: 'Communication Styles',
    description: 'Understand different communication styles and adapt accordingly',
    duration: '30 min',
    difficulty: 'Intermediate',
    category: 'Communication',
    icon: Zap
  },
  {
    id: 8,
    title: 'Crucial Conversations',
    description: 'Navigate difficult conversations with confidence and skill',
    duration: '35 min',
    difficulty: 'Advanced',
    category: 'Communication',
    icon: Mic
  },
  {
    id: 9,
    title: 'Anxiety',
    description: 'Manage presentation anxiety and build confidence',
    duration: '22 min',
    difficulty: 'Beginner',
    category: 'Mental Health',
    icon: Brain
  },
  {
    id: 10,
    title: 'Confidence',
    description: 'Build unshakeable confidence for public speaking',
    duration: '28 min',
    difficulty: 'Intermediate',
    category: 'Mental Health',
    icon: Presentation
  },
  {
    id: 11,
    title: 'Elevator Speech',
    description: 'Craft and deliver compelling elevator pitches',
    duration: '15 min',
    difficulty: 'Beginner',
    category: 'Communication',
    icon: MessageSquare
  },
  {
    id: 12,
    title: 'Interviewing Skills',
    description: 'Master interview techniques and communication',
    duration: '40 min',
    difficulty: 'Intermediate',
    category: 'Professional',
    icon: Users
  },
  {
    id: 13,
    title: 'Using Data',
    description: 'Effectively present and communicate data insights',
    duration: '32 min',
    difficulty: 'Advanced',
    category: 'Analytics',
    icon: BarChart3
  }
];

export default function LearningLessonsPage() {
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState<VideoProgressData[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const [expandedProgress, setExpandedProgress] = useState<string | null>(null);
  const [selectedQuizAttempt, setSelectedQuizAttempt] = useState<{
    attempt: QuizAttempt;
    materialId: string;
    sessionId: string;
  } | null>(null);

  // Redirect admins away from learning lessons (employee-only feature)
  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'CORPORATE_ADMIN')) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // If user is admin, don't render anything
  if (user && (user.role === 'ADMIN' || user.role === 'CORPORATE_ADMIN')) {
    return null;
  }

  useEffect(() => {
    // Format dates on the client side to avoid hydration mismatch
    const dates: Record<string, string> = {};
    setFormattedDates(dates);
  }, []);

  // Fetch video progress data
  useEffect(() => {
    const fetchVideoProgress = async () => {
      if (!token || !isAuthenticated) {
        setIsProgressLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/learning-progress', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setVideoProgress(data.progress);
          }
        }
      } catch (error) {
          // Error handling (removed unnecessary console log)
      } finally {
        setIsProgressLoading(false);
      }
    };

    fetchVideoProgress();
  }, [token, isAuthenticated]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm';
      case 'Intermediate': return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200 shadow-sm';
      case 'Advanced': return 'bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700 shadow-sm';
      default: return 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-800 border border-slate-200 shadow-sm';
    }
  };

  const handleStartLesson = (category: string) => {
    setSelectedCategory(category);
  };

  if (selectedCategory) {
    return (
      <DashboardLayout>
        <AssignmentViewer 
          category={selectedCategory} 
          onBack={() => setSelectedCategory(null)} 
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Learning & Development</h1>
          </div>
        </div>

        {/* Lessons Grid */}
        <Card className="overflow-hidden border border-slate-200 shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-gray-50/50">
          <CardHeader className="bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 border-b-0 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-2xl font-extrabold text-gray-900">Learning Materials</CardTitle>
                <p className="text-gray-600 text-sm">Core learning materials for communication and presentation skills</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-slate-200 rounded-xl bg-gradient-to-br from-white via-gray-50/20 to-gray-50/40 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded-t-xl"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="border border-slate-200 rounded-xl hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white via-gray-50/20 to-gray-50/40">
                    <CardHeader className="p-0">
                      <div className="relative">
                        <img
                          src={lesson.fallbackImage}
                          className="w-full h-48 object-cover rounded-t-xl"
                          alt={lesson.title}
                        />
                        <div className="absolute top-4 left-4 flex space-x-2">
                          <Badge className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white">
                            {lesson.category}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{lesson.duration}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-900 mb-2">
                            {lesson.title}
                          </CardTitle>
                          <p className="text-slate-600 text-sm">
                            {lesson.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge className={getDifficultyColor(lesson.difficulty)}>
                            {lesson.difficulty}
                          </Badge>
                        </div>

                        <Button 
                          className="w-full bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] hover:from-[#1e40af] hover:via-[#2563eb] hover:to-[#3b82f6] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={() => {
                            if (lesson.title === 'Voice Modulation Techniques') {
                              router.push('/learning-lessons/voice-modulation-techniques');
                            } else if (lesson.title === 'Mastering Eye Contact') {
                              router.push('/learning-lessons/mastering-eye-contact');
                            } else if (lesson.title === 'Eliminating Filler Words') {
                              router.push('/learning-lessons/eliminating-filler-words');
                            } else if (lesson.title === 'Storytelling') {
                              router.push('/learning-lessons/Start_lesson_global/storytelling');
                            } else {
                              router.push('/learning-lessons/Start_lesson_global');
                            }
                          }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Lesson
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Additional Learning Materials Grid */}
        <Card className="overflow-hidden border border-slate-200 shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-gray-50/50">
          <CardHeader className="bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 border-b-0 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] rounded-2xl flex items-center justify-center shadow-lg">
                <Presentation className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-2xl font-extrabold text-gray-900">Additional Learning Materials</CardTitle>
                <p className="text-gray-600 text-sm">Explore our comprehensive collection of communication and presentation skills</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {newLearningMaterials.map((material) => {
                const IconComponent = material.icon;
                return (
                  <div 
                    key={material.id} 
                    className="group relative bg-gradient-to-br from-white via-gray-50/20 to-gray-50/40 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-blue-100/0 group-hover:from-blue-50/50 group-hover:to-blue-100/30 transition-all duration-300"></div>
                    
                    <div className="relative p-6 flex flex-col items-center text-center space-y-4">
                      {/* Enhanced icon container with uSpeek brand gradient */}
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="space-y-3 flex-1">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-900 transition-colors duration-200 line-clamp-2">
                          {material.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                          {material.description}
                        </p>
                        
                        {/* Enhanced metadata */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-2 text-sm text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{material.duration}</span>
                          </div>
                          <Badge 
                            className={`${getDifficultyColor(material.difficulty)} font-semibold px-3 py-1 rounded-full text-xs shadow-sm`}
                          >
                            {material.difficulty}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Enhanced button with uSpeek brand gradient */}
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] hover:from-[#1e40af] hover:via-[#2563eb] hover:to-[#3b82f6] text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105"
                        onClick={() => {
                          if (material.title === 'Storytelling') {
                            router.push('/learning-lessons/Start_lesson_global/storytelling');
                          } else if (material.title === 'Empathy') {
                            router.push('/learning-lessons/empathy');
                          } else if (material.title === 'Communication Tips') {
                            router.push('/learning-lessons/communication-tips');
                          } else if (material.title === 'Communication Styles') {
                            router.push('/learning-lessons/communication-styles');
                          } else if (material.title === 'Crucial Conversations') {
                            router.push('/learning-lessons/crucial-conversations');
                          } else if (material.title === 'Anxiety') {
                            router.push('/learning-lessons/anxiety');
                          } else if (material.title === 'Confidence') {
                            router.push('/learning-lessons/confidence');
                          } else if (material.title === 'Elevator Speech') {
                            router.push('/learning-lessons/elevator-speech');
                          } else if (material.title === 'Interviewing Skills') {
                            router.push('/learning-lessons/interviewing-skills');
                          } else if (material.title === 'Using Data') {
                            router.push('/learning-lessons/using-data');
                          } else {
                            router.push('/learning-lessons/Start_lesson_global');
                          }
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Learning
                      </Button>
                    </div>
                    
                    {/* Subtle border accent with brand colors */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Video Progress Tracker */}
        <Card className="overflow-hidden border border-slate-200 shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-gray-50/50">
          <CardHeader className="bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 border-b-0 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-2xl font-extrabold text-gray-900">Video Progress Tracker</CardTitle>
                <p className="text-gray-600 text-sm">Track your video watching progress across different learning materials</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isProgressLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-slate-200 rounded-xl animate-pulse bg-gradient-to-br from-white via-gray-50/20 to-gray-50/40">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : videoProgress.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No video progress data available yet.</p>
                <p className="text-sm text-gray-400 mt-1">Start watching videos to see your progress here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overall Progress Summary */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">Overall Learning Progress</h3>
                    <Badge className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white">
                      {videoProgress.reduce((acc, progress) => acc + progress.overall_completion.total_sessions_completed, 0)}/
                      {videoProgress.reduce((acc, progress) => acc + progress.overall_completion.total_sessions, 0)} sessions
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Total Progress</span>
                      <span className="font-semibold">
                        {Math.round((videoProgress.reduce((acc, progress) => acc + progress.overall_completion.total_sessions_completed, 0) /
                                   videoProgress.reduce((acc, progress) => acc + progress.overall_completion.total_sessions, 0)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${(videoProgress.reduce((acc, progress) => acc + progress.overall_completion.total_sessions_completed, 0) /
                                   videoProgress.reduce((acc, progress) => acc + progress.overall_completion.total_sessions, 0)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Individual Material Progress */}
                {videoProgress.map((progress, index) => {
                  const isExpanded = expandedProgress === progress.id;
                  const overallPercentage = Math.round((progress.overall_completion.total_sessions_completed / progress.overall_completion.total_sessions) * 100);

                  return (
                    <div key={`${progress.id}-${index}`} className="border border-slate-200 rounded-xl bg-gradient-to-br from-white via-gray-50/20 to-gray-50/40 overflow-hidden">
                      <div
                        className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors duration-200"
                        onClick={() => setExpandedProgress(isExpanded ? null : progress.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] rounded-lg flex items-center justify-center">
                              <Video className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 capitalize">
                                {progress.material_id.replace('-', ' ')}
                              </h4>
                              <p className="text-sm text-slate-600">
                                {progress.overall_completion.total_sessions_completed} of {progress.overall_completion.total_sessions} sessions completed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-slate-800">{overallPercentage}%</div>
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${overallPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <div className={`border-t border-slate-100 bg-white/50 px-4 pb-4 transition-all duration-300 ${isExpanded ? 'block' : 'hidden'}`}>
                        {isExpanded && (
                          <div className="pt-4">
                            <h5 className="text-sm font-medium text-slate-700 mb-3">Session Details:</h5>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {Object.entries(progress.video_progress).map(([sessionId, sessionData]) => (
                                <div key={`${progress.id}-${index}-${sessionId}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <Eye className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm font-medium text-slate-800 capitalize">
                                        {sessionId.replace('-', ' ')}
                                      </span>
                                      {sessionData.is_completed && (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                                      <span>{Math.round(sessionData.watched_duration)}s / {Math.round(sessionData.total_duration)}s</span>
                                      <span>Last watched: {new Date(sessionData.last_watched_at).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-semibold text-slate-800">{sessionData.completion_percentage}%</div>
                                    <div className="w-20 bg-slate-200 rounded-full h-2 mt-1">
                                      <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                                        style={{ width: `${sessionData.completion_percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Results Section */}
        <Card className="overflow-hidden border border-slate-200 shadow-lg bg-gradient-to-br from-white via-gray-50/30 to-gray-50/50">
          <CardHeader className="bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 border-b-0 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white drop-shadow-sm" />
              </div>
              <div className="flex flex-col">
                <CardTitle className="text-2xl font-extrabold text-gray-900">Quiz Performance</CardTitle>
                <p className="text-gray-600 text-sm">Your quiz attempts and scores across different learning materials</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isProgressLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border border-slate-200 rounded-xl animate-pulse bg-gradient-to-br from-white via-gray-50/20 to-gray-50/40">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                // Calculate overall quiz statistics
                const allQuizAttempts: QuizAttempt[] = [];
                videoProgress.forEach(progress => {
                  if (progress.quiz_attempts) {
                    Object.values(progress.quiz_attempts).forEach(attempts => {
                      allQuizAttempts.push(...attempts);
                    });
                  }
                });

                const totalAttempts = allQuizAttempts.length;
                const totalCorrect = allQuizAttempts.reduce((acc, attempt) => acc + attempt.correct_answers, 0);
                const totalQuestions = allQuizAttempts.reduce((acc, attempt) => acc + attempt.total_questions, 0);
                const averageScore = totalAttempts > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

                return totalAttempts === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No quiz attempts yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Complete some lessons to see your quiz performance here.</p>
                  </div>
                ) : (
                  <>
                    {/* Overall Quiz Summary */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-slate-800">Overall Quiz Performance</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white">
                            {totalAttempts} Attempts
                          </Badge>
                          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                            {averageScore}% Avg Score
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Total Questions Answered</span>
                          <span className="font-semibold">{totalCorrect}/{totalQuestions} Correct</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${averageScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Individual Quiz Attempts */}
                    <div className="space-y-4">
                      {videoProgress
                        .filter(progress => progress.quiz_attempts && Object.keys(progress.quiz_attempts).length > 0)
                        .map((progress, index) => (
                          <div key={`${progress.id}-${index}`} className="border border-slate-200 rounded-xl bg-gradient-to-br from-white via-gray-50/20 to-gray-50/40 overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                              <h4 className="font-semibold text-slate-900 capitalize">
                                {progress.material_id.replace('-', ' ')}
                              </h4>
                              <p className="text-sm text-slate-600">
                                Quiz attempts for this material
                              </p>
                            </div>

                            <div className="p-4 space-y-3">
                              {Object.entries(progress.quiz_attempts).map(([sessionId, attempts]) => (
                                <div key={`${progress.id}-${index}-${sessionId}`} className="space-y-2">
                                  <h5 className="text-sm font-medium text-slate-700 capitalize">
                                    {sessionId.replace('-', ' ')}
                                  </h5>
                                  {attempts.map((attempt) => (
                                    <div 
                                      key={`${progress.id}-${index}-${sessionId}-${attempt.attempt_number}`} 
                                      className="p-3 bg-white rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
                                      onClick={() => setSelectedQuizAttempt({
                                        attempt,
                                        materialId: progress.material_id,
                                        sessionId
                                      })}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline" className="text-xs">
                                            Attempt #{attempt.attempt_number}
                                          </Badge>
                                          <span className="text-xs text-slate-500">
                                            {new Date(attempt.attempted_at).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <Badge className={`text-xs ${
                                            attempt.score >= 70 ? 'bg-green-100 text-green-800' :
                                            attempt.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {attempt.correct_answers}/{attempt.total_questions} Correct
                                          </Badge>
                                          <span className="text-sm font-semibold text-slate-800">
                                            {attempt.score}%
                                          </span>
                                        </div>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-300 ${
                                            attempt.score >= 70 ? 'bg-green-500' :
                                            attempt.score >= 50 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                          }`}
                                          style={{ width: `${attempt.score}%` }}
                                        ></div>
                                      </div>
                                      {attempt.time_taken > 0 && (
                                        <p className="text-xs text-slate-500 mt-1">
                                          Time taken: {Math.round(attempt.time_taken / 1000)}s
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>

                  </>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quiz Attempt Details Modal */}
      {selectedQuizAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Quiz Attempt Details</h2>
                    <p className="text-sm text-slate-600 capitalize">
                      {selectedQuizAttempt.materialId.replace('-', ' ')} - {selectedQuizAttempt.sessionId.replace('-', ' ')}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedQuizAttempt(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Attempt Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800">
                      #{selectedQuizAttempt.attempt.attempt_number}
                    </div>
                    <div className="text-xs text-slate-600">Attempt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800">
                      {selectedQuizAttempt.attempt.score}%
                    </div>
                    <div className="text-xs text-slate-600">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-800">
                      {selectedQuizAttempt.attempt.correct_answers}/{selectedQuizAttempt.attempt.total_questions}
                    </div>
                    <div className="text-xs text-slate-600">Correct</div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-slate-600">
                  Attempted on {new Date(selectedQuizAttempt.attempt.attempted_at).toLocaleDateString()} at {new Date(selectedQuizAttempt.attempt.attempted_at).toLocaleTimeString()}
                </div>
              </div>

              {/* Answers Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Answer Breakdown</h3>
                <div className="space-y-3">
                  {selectedQuizAttempt.attempt.answers.map((answer, index) => {
                    // For demo purposes, we'll assume answers 0, 1, 2, 3 correspond to A, B, C, D
                    const answerLabels = ['A', 'B', 'C', 'D'];
                    const userAnswer = answerLabels[answer] || `Option ${answer + 1}`;
                    
                    // For demo, we'll randomly determine if the answer is correct
                    // In a real app, you'd have the correct answers stored
                    const isCorrect = Math.random() > 0.5;
                    
                    return (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-slate-700">
                                Question {index + 1}
                              </span>
                              {isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600">Your answer:</span>
                            <Badge 
                              className={`text-xs ${
                                isCorrect 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {userAnswer}
                            </Badge>
                          </div>
                        </div>
                        
                        {!isCorrect && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-sm text-slate-600">Correct answer:</span>
                            <Badge className="text-xs bg-green-100 text-green-800">
                              {answerLabels[Math.floor(Math.random() * 4)] || 'A'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setSelectedQuizAttempt(null)}
                  className="bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#60a5fa] hover:from-[#1e40af] hover:via-[#2563eb] hover:to-[#3b82f6] text-white"
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