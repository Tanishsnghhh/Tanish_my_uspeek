'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BaseVideoPlayer } from '@/components/learning/base-video-player';
import { YouTubePlayer } from '@/components/learning/youtube-player';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle, 
  Play, 
  Star,
  Video,
  FileText,
  ChevronRight,
  ChevronDown,
  Youtube,
  Trophy
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/use-auth';
import {
  calculateVideoCompletion,
  isVideoCompleted
} from '@/lib/learning-utils';

interface Session {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'text' | 'quiz';
  isActive: boolean;
  isCompleted: boolean;
  videoUrl?: string;
}

interface DropdownItem {
  id: string;
  title: string;
  isExpanded?: boolean;
  children?: DropdownItem[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizContent {
  questions: QuizQuestion[];
}

interface LessonContentItem {
  title: string;
  description: string;
  content: string;
  objectives: string[];
  keyPoints: string[];
  quiz?: QuizContent;
  videoUrl?: string;
}

interface BaseLearningMaterialProps {
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  sessionsStructure: DropdownItem[];
  contentData: Record<string, LessonContentItem>;
  onBack?: () => void;
  navigationStyle?: 'sidebar' | 'horizontal';
}

function BaseLearningMaterial({
  title,
  description,
  difficulty,
  duration,
  sessionsStructure,
  contentData,
  onBack,
  navigationStyle = 'sidebar'
}: BaseLearningMaterialProps) {
  const router = useRouter();
  const { user, token } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [currentContent, setCurrentContent] = useState<LessonContentItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedDropdownItem, setSelectedDropdownItem] = useState<DropdownItem | null>(null);
  const [progress, setProgress] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  
  // Progress tracking state
  const [sessionProgress, setSessionProgress] = useState<any>(null);
  const [materialProgress, setMaterialProgress] = useState<any[]>([]);
  const [videoWatchedTime, setVideoWatchedTime] = useState(0);
  const [videoTotalTime, setVideoTotalTime] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Load material progress on mount
  useEffect(() => {
    if (user?.id && title) {
      loadMaterialProgress();
    }
  }, [user?.id, title]);

  const loadMaterialProgress = async () => {
    if (!user?.id || !token || !title) return;

    try {
      setIsLoadingProgress(true);
      const response = await fetch(`/api/learning-progress?material_id=${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterialProgress(data.progress || []);
      }
    } catch (error) {
      console.error('Error loading material progress:', error);
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const loadSessionProgress = async (sessionId: string) => {
    if (!user?.id || !token || !title) return;

    try {
      console.log('🔄 Loading session progress for:', sessionId);
      const response = await fetch(`/api/learning-progress?material_id=${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}&session_id=${encodeURIComponent(sessionId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const progress = data.progress?.[0];
        
        if (progress) {
          console.log('📊 Found existing progress for session:', sessionId, {
            video_progress: progress.video_progress?.[sessionId],
            quiz_attempts: progress.quiz_attempts?.[sessionId]
          });
          setSessionProgress(progress);
          
          // Access session-specific progress from the new structure
          const sessionVideoProgress = progress.video_progress?.[sessionId];
          const sessionQuizAttempts = progress.quiz_attempts?.[sessionId];
          
          setVideoWatchedTime(sessionVideoProgress?.watched_duration || 0);
          setVideoTotalTime(sessionVideoProgress?.total_duration || 0);
          setVideoCompleted(sessionVideoProgress?.is_completed || false);
          
          // Load quiz answers from last attempt for this session
          if (sessionQuizAttempts && sessionQuizAttempts.length > 0) {
            const lastAttempt = sessionQuizAttempts[sessionQuizAttempts.length - 1];
            setQuizAnswers(lastAttempt.answers || []);
            setShowQuizResults(true);
          } else {
            setQuizAnswers([]);
            setShowQuizResults(false);
          }
        } else {
          console.log('📊 No existing progress found for session:', sessionId, '- initializing as new');
          // Reset progress for new session
          setSessionProgress(null);
          setVideoWatchedTime(0);
          setVideoTotalTime(0);
          setVideoCompleted(false);
          setQuizAnswers([]);
          setShowQuizResults(false);
        }
      } else {
        console.error('❌ Failed to load session progress:', response.status);
      }
    } catch (error) {
      console.error('❌ Error loading session progress:', error);
    }
  };

  const handleVideoProgress = async (watchedTime: number, totalTime: number) => {
    if (!user?.id || !token || !selectedSession?.id || !title) {
      console.log('❌ Missing required data for progress tracking:', { userId: user?.id, token: !!token, sessionId: selectedSession?.id, title });
      return;
    }

    console.log('📥 Received progress update:', {
      sessionId: selectedSession.id,
      watchedTime,
      totalTime,
      previousWatchedTime: videoWatchedTime,
      previousTotalTime: videoTotalTime
    });

    setVideoWatchedTime(watchedTime);
    setVideoTotalTime(totalTime);

    const completionPercentage = calculateVideoCompletion(watchedTime, totalTime);
    const videoCompleted = isVideoCompleted(watchedTime, totalTime);

    // If video is completed, ensure progress is set to 100%
    const finalProgress = videoCompleted ? 100 : completionPercentage;

    setVideoCompleted(videoCompleted);
    setProgress(finalProgress);

    // Log completion status when it changes to completed
    if (videoCompleted) {
      console.log('🎉 Video completed!', {
        watchedTime,
        totalTime,
        completionPercentage: finalProgress
      });
    }

    // Save progress to database
    try {
      const payload = {
        material_id: title.toLowerCase().replace(/\s+/g, '-'),
        session_id: selectedSession.id,
        video_progress: {
          watched_duration: watchedTime,
          total_duration: totalTime,
          completion_percentage: finalProgress,
          is_completed: videoCompleted
        }
      };

      const response = await fetch('/api/learning-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to save video progress:', response.status, errorText);
      } else {
        const result = await response.json();
        console.log('✅ Video progress saved successfully:', result);
      }
    } catch (error) {
      console.error('❌ Error saving video progress:', error);
    }
  };

  const handleQuizSubmit = async () => {
    if (!user?.id || !selectedSession?.id || !title || !currentContent?.quiz) return;

    setShowQuizResults(true);

    const quiz = currentContent.quiz;
    const correctAnswers = quiz.questions.map(q => q.correctAnswer);
    const score = Math.round(
      (quizAnswers.filter((answer, index) => answer === correctAnswers[index]).length / quiz.questions.length) * 100
    );

    // Save quiz attempt to database
    try {
      const response = await fetch('/api/learning-progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          material_id: title.toLowerCase().replace(/\s+/g, '-'),
          session_id: selectedSession.id,
          quiz_attempt: {
            score,
            total_questions: quiz.questions.length,
            correct_answers: quizAnswers.filter((answer, index) => answer === correctAnswers[index]).length,
            answers: quizAnswers,
            time_taken: 0 // TODO: Track actual time taken
          }
        })
      });
      
      if (response.ok) {
        // Reload session progress to get updated data
        loadSessionProgress(selectedSession.id);
      } else {
        console.error('Failed to save quiz attempt');
      }
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  useEffect(() => {
    // Clear previous state when props change
    setSelectedSession(null);
    setCurrentContent(null);
    setSelectedDropdownItem(null);
    setExpandedItems(new Set());
    setProgress(0);
    setIsSessionActive(false);
    setCurrentQuizQuestion(0);
    setQuizAnswers([]);
    setShowQuizResults(false);

    // Find the first actual session (not just parent items)
    const findFirstSession = (items: DropdownItem[]): DropdownItem | null => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          // If it has children, find the first child
          return findFirstSession(item.children);
        } else {
          // If it's a leaf node (no children), this is a session
          return item;
        }
      }
      return null;
    };

    const firstSession = findFirstSession(sessionsStructure);
    if (firstSession) {
      setSelectedDropdownItem(firstSession);
      const content = contentData[firstSession.id];
      if (content) {
        setCurrentContent(content);
        setSelectedSession({
          id: firstSession.id,
          title: content.title,
          description: content.description,
          duration: '15:00',
          type: 'video',
          isActive: false,
          isCompleted: false,
          videoUrl: content.videoUrl
        });
        
        // Expand the parent item if this session has a parent
        const expandParent = (items: DropdownItem[], targetId: string): boolean => {
          for (const item of items) {
            if (item.children) {
              const hasChild = item.children.some(child => child.id === targetId);
              if (hasChild) {
                setExpandedItems(prev => new Set([...Array.from(prev), item.id]));
                return true;
              }
              if (expandParent(item.children, targetId)) {
                setExpandedItems(prev => new Set([...Array.from(prev), item.id]));
                return true;
              }
            }
          }
          return false;
        };
        
        expandParent(sessionsStructure, firstSession.id);
      }
    }
  }, [sessionsStructure, contentData, title, description, difficulty, duration]);

  const handleBackToLessons = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/learning-lessons');
    }
  };

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    setIsSessionActive(false);
    setProgress(0);
    setCurrentQuizQuestion(0);
    setQuizAnswers([]);
    setShowQuizResults(false);
  };

  const handleStartSession = () => {
    if (selectedSession) {
      setIsSessionActive(true);
      setProgress(0);
    }
  };

  const handleCompleteSession = () => {
    if (selectedSession) {
      setProgress(100);
      setIsSessionActive(false);
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[currentQuizQuestion] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const handleNextQuizQuestion = () => {
    if (currentContent?.quiz && currentQuizQuestion < currentContent.quiz.questions.length - 1) {
      setCurrentQuizQuestion(currentQuizQuestion + 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizQuestion(0);
    setQuizAnswers([]);
    setShowQuizResults(false);
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handlePopoverOpenChange = (itemId: string, open: boolean) => {
    if (open) {
      setExpandedItems(new Set([itemId]));
    } else {
      setExpandedItems(new Set());
    }
  };

  const itemContainsId = (item: DropdownItem, targetId: string): boolean => {
    if (!item.children || item.children.length === 0) return item.id === targetId;
    if (item.id === targetId) return true;
    return item.children.some((child) => itemContainsId(child, targetId));
  };

  const isActiveGroup = (item: DropdownItem): boolean => {
    const isOpen = expandedItems.has(item.id);
    if (!selectedDropdownItem) return isOpen;
    const containsSelected = itemContainsId(item, selectedDropdownItem.id);
    return isOpen || containsSelected;
  };

  const handleDropdownItemClick = (item: DropdownItem) => {
    if (item.children) {
      toggleItem(item.id);
    } else {
      setSelectedDropdownItem(item);
      const content = contentData[item.id];
      if (content) {
        setCurrentContent(content);
        setSelectedSession({
          id: item.id,
          title: content.title,
          description: content.description,
          duration: '15:00',
          type: 'video',
          isActive: false,
          isCompleted: false,
          videoUrl: content.videoUrl
        });

        // Don't reset video progress state immediately - wait for session progress to load
        // The loadSessionProgress function will set the correct values
        setProgress(0); // Only reset progress bar temporarily

        // Load session progress for the new session
        loadSessionProgress(item.id);

        // Keep the parent dropdown open when a child item is selected
        // Only close other dropdowns, but keep the current parent open
        const parentId = findParentId(sessionsStructure, item.id);
        if (parentId) {
          setExpandedItems(new Set([parentId]));
        } else {
          // If no parent found, just close all dropdowns
          setExpandedItems(new Set());
        }
      }
    }
  };

  const handleNextSession = async () => {
    // Auto-save current session progress before moving to next
    if (selectedSession && user?.id && token && title) {
      const completionPercentage = calculateVideoCompletion(videoWatchedTime, videoTotalTime || 900);
      const videoCompletedStatus = isVideoCompleted(videoWatchedTime, videoTotalTime || 900);

      try {
        await fetch('/api/learning-progress', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            material_id: title.toLowerCase().replace(/\s+/g, '-'),
            session_id: selectedSession.id,
            video_progress: {
              watched_duration: videoWatchedTime,
              total_duration: videoTotalTime || 900,
              completion_percentage: completionPercentage,
              is_completed: videoCompletedStatus
            }
          })
        });
      } catch (error) {
        console.error('Error auto-saving progress:', error);
      }
    }

    const getAllSessions = (items: DropdownItem[]): DropdownItem[] => {
      return items.flatMap(item => (item.children && item.children.length > 0) ? getAllSessions(item.children) : item);
    };
    const flatSessions = getAllSessions(sessionsStructure);
    const currentIndex = flatSessions.findIndex(session => session.id === selectedSession?.id);
    if (currentIndex !== -1 && currentIndex < flatSessions.length - 1) {
      handleDropdownItemClick(flatSessions[currentIndex + 1]);
    }
  };

  const handlePreviousSession = () => {
    const getAllSessions = (items: DropdownItem[]): DropdownItem[] => {
      return items.flatMap(item => (item.children && item.children.length > 0) ? getAllSessions(item.children) : item);
    };
    const flatSessions = getAllSessions(sessionsStructure);
    const currentIndex = flatSessions.findIndex(session => session.id === selectedSession?.id);
    if (currentIndex > 0) {
      handleDropdownItemClick(flatSessions[currentIndex - 1]);
    }
  };

  // Helper function to find the parent ID of a child item
  const findParentId = (items: DropdownItem[], childId: string): string | null => {
    for (const item of items) {
      if (item.children) {
        const hasChild = item.children.some(child => child.id === childId);
        if (hasChild) {
          return item.id;
        }
        // Recursively search in nested children
        const found = findParentId(item.children, childId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const renderDropdownItem = (item: DropdownItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    
    // Check if this session is completed
    const materialProgressData = materialProgress.find(p => p.material_id === title.toLowerCase().replace(/\s+/g, '-'));
    const sessionVideoProgress = materialProgressData?.video_progress?.[item.id];
    const sessionQuizAttempts = materialProgressData?.quiz_attempts?.[item.id];
    const isCompleted = sessionVideoProgress?.is_completed && 
                       sessionQuizAttempts && 
                       sessionQuizAttempts.length > 0;

    return (
      <div key={item.id} className="w-full">
        <div
          className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
            level > 0 ? 'pl-6' : ''
          } ${selectedDropdownItem?.id === item.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
          onClick={() => handleDropdownItemClick(item)}
        >
          <div className="flex items-center space-x-2">
            {hasChildren ? (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            ) : (
              <div className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{item.title}</span>
            {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
          </div>
          {!hasChildren && (
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">15:00</span>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="border-l border-gray-200 ml-4">
            {item.children?.map((child) => renderDropdownItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 mx-auto relative">
        {/* Back to Lessons button - positioned in the left white space */}
        <div className="absolute left-0 top-6 -ml-64 w-64 flex justify-center items-center">
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToLessons}
            className="flex items-center space-x-2 ml-14"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Lessons</span>
          </Button> */}
        </div>

        {/* Header */}
        <div className="mb-6">
          {/* Title and badges row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600">{description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {sessionsStructure.reduce((total, item) => {
                  return total + (item.children ? item.children.length : 1);
                }, 0)} Sessions
              </Badge>
              <Badge className={getDifficultyColor(difficulty)}>{difficulty}</Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {navigationStyle === 'horizontal' ? (
          <div className="space-y-6">
            {/* Horizontal Navigation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Course Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div ref={dropdownRef} className="flex flex-wrap gap-3 p-4 border-t justify-end">
                  {sessionsStructure.map((item) => {
                    if (item.children) {
                      return (
                        <Popover key={item.id} open={expandedItems.has(item.id)} onOpenChange={(open) => handlePopoverOpenChange(item.id, open)}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={isActiveGroup(item) ? "default" : "outline"}
                              size="sm"
                              className={`flex items-center space-x-2 ${isActiveGroup(item) ? 'bg-black text-white hover:bg-black' : ''}`}
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>{item.title}</span>
                              <ChevronDown
                                className={`w-3 h-3 transition-transform ${expandedItems.has(item.id) ? 'rotate-180' : ''}`}
                              />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" sideOffset={8} className="w-72 p-1 max-h-56 overflow-y-auto">
                            {item.children.map((child) => {
                              const materialProgressData = materialProgress.find(p => p.material_id === title.toLowerCase().replace(/\s+/g, '-'));
                              const childVideoProgress = materialProgressData?.video_progress?.[child.id];
                              const childQuizAttempts = materialProgressData?.quiz_attempts?.[child.id];
                              const isChildCompleted = childVideoProgress?.is_completed && 
                                                     childQuizAttempts && 
                                                     childQuizAttempts.length > 0;
                              
                              return (
                                <Button
                                  key={child.id}
                                  variant={selectedDropdownItem?.id === child.id ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => handleDropdownItemClick(child)}
                                  className={`w-full justify-start text-left h-8 text-sm hover:bg-gray-50 ${selectedDropdownItem?.id === child.id ? 'bg-black text-white hover:bg-black' : ''}`}
                                >
                                  <BookOpen className="w-3 h-3 mr-2" />
                                  <span className="truncate flex-1">{child.title}</span>
                                  {isChildCompleted && <CheckCircle className="w-3 h-3 ml-2 text-green-500 flex-shrink-0" />}
                                  <Clock className="w-3 h-3 ml-auto flex-shrink-0" />
                                </Button>
                              );
                            })}
                          </PopoverContent>
                        </Popover>
                      );
                    } else {
                      return (
                        <Button
                          key={item.id}
                          variant={selectedDropdownItem?.id === item.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleDropdownItemClick(item)}
                          className="flex items-center space-x-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>{item.title}</span>
                          <Clock className="w-3 h-3" />
                        </Button>
                      );
                    }
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Content Area */}
            {selectedSession && currentContent ? (
              <div className="space-y-6">
                {/* Session Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{currentContent.title}</CardTitle>
                        <p className="text-gray-600 mt-1">{currentContent.description}</p>
                        {videoTotalTime > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            <Progress value={progress} className="flex-1" />
                            <span className="text-sm text-gray-500">
                              {Math.floor(videoWatchedTime / 60)}:{(videoWatchedTime % 60).toString().padStart(2, '0')} / {Math.floor(videoTotalTime / 60)}:{(videoTotalTime % 60).toString().padStart(2, '0')}
                            </span>
                            {videoCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{selectedSession.duration}</Badge>
                        <Badge variant="secondary">{selectedSession.type}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Video Player Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Youtube className="w-5 h-5 text-red-500" />
                      <span>Video Lesson</span>
                      {videoCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {videoTotalTime > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {Math.floor(videoWatchedTime / 60)}:{(videoWatchedTime % 60).toString().padStart(2, '0')} / {Math.floor(videoTotalTime / 60)}:{(videoTotalTime % 60).toString().padStart(2, '0')}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentContent.videoUrl ? (
                      <div className="space-y-4">
                        <YouTubePlayer
                          videoId={currentContent.videoUrl}
                          title={currentContent.title}
                          onProgress={handleVideoProgress}
                          onReady={() => {}}
                          initialProgress={videoWatchedTime}
                          className="w-full"
                        />
                        {videoTotalTime > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>Progress</span>
                              <span>{Math.round(progress)}% complete</span>
                            </div>
                            <Progress value={progress} className="w-full" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <BaseVideoPlayer
                        title={currentContent.title}
                        description={currentContent.description}
                        duration={selectedSession.duration}
                        className="w-full"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{currentContent.content}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Objectives */}
                {currentContent.objectives.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Learning Objectives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentContent.objectives.map((objective, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Key Points */}
                {currentContent.keyPoints.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentContent.keyPoints.map((point, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{point}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quiz */}
                {currentContent.quiz && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!showQuizResults ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold mb-2">
                              Question {currentQuizQuestion + 1} of {currentContent.quiz!.questions.length}
                            </h3>
                            <p className="text-gray-700 mb-4">
                              {currentContent.quiz!.questions[currentQuizQuestion].question}
                            </p>
                            <div className="space-y-2">
                              {currentContent.quiz!.questions[currentQuizQuestion].options.map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleQuizAnswer(index)}
                                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                    quizAnswers[currentQuizQuestion] === index
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              onClick={resetQuiz}
                              disabled={currentQuizQuestion === 0}
                            >
                              Reset
                            </Button>
                            {currentQuizQuestion < currentContent.quiz!.questions.length - 1 ? (
                              <Button onClick={handleNextQuizQuestion}>
                                Next Question
                              </Button>
                            ) : (
                              <Button onClick={handleQuizSubmit}>
                                Submit Quiz
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="font-semibold text-green-800 mb-2">Quiz Results</h3>
                            {sessionProgress?.quiz_attempts?.[selectedSession?.id || ''] && sessionProgress.quiz_attempts[selectedSession?.id || ''].length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-green-700">
                                  Latest Score: {sessionProgress.quiz_attempts[selectedSession?.id || ''][sessionProgress.quiz_attempts[selectedSession?.id || ''].length - 1].score}% 
                                  ({sessionProgress.quiz_attempts[selectedSession?.id || ''][sessionProgress.quiz_attempts[selectedSession?.id || ''].length - 1].correct_answers} out of {sessionProgress.quiz_attempts[selectedSession?.id || ''][sessionProgress.quiz_attempts[selectedSession?.id || ''].length - 1].total_questions} correct)
                                </p>
                                <p className="text-sm text-green-600">
                                  Attempts: {sessionProgress.quiz_attempts[selectedSession?.id || ''].length}
                                </p>
                              </div>
                            ) : (
                              <p className="text-green-700">
                                You scored {quizAnswers.filter((answer, index) => 
                                  answer === currentContent.quiz!.questions[index].correctAnswer
                                ).length} out of {currentContent.quiz!.questions.length} correctly!
                              </p>
                            )}
                          </div>
                          <Button onClick={resetQuiz}>Retake Quiz</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBackToLessons}>
                    Back to Lessons
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handlePreviousSession}>
                      Previous Session
                    </Button>
                    <Button onClick={handleNextSession}>
                      Next Session
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a Session
                  </h3>
                  <p className="text-gray-600">
                    Choose a session from the navigation bar above to begin learning.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Course Content</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {sessionsStructure.map((item) => renderDropdownItem(item))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {selectedSession && currentContent ? (
                <div className="space-y-6">
                  {/* Session Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">{currentContent.title}</CardTitle>
                          <p className="text-gray-600 mt-1">{currentContent.description}</p>
                          {videoTotalTime > 0 && (
                            <div className="mt-2 flex items-center space-x-2">
                              <Progress value={progress} className="flex-1" />
                              <span className="text-sm text-gray-500">
                                {Math.floor(videoWatchedTime / 60)}:{(videoWatchedTime % 60).toString().padStart(2, '0')} / {Math.floor(videoTotalTime / 60)}:{(videoTotalTime % 60).toString().padStart(2, '0')}
                              </span>
                              {videoCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{selectedSession.duration}</Badge>
                          <Badge variant="secondary">{selectedSession.type}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Video Player Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Youtube className="w-5 h-5 text-red-500" />
                        <span>Video Lesson</span>
                        {videoCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {videoTotalTime > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {Math.floor(videoWatchedTime / 60)}:{(videoWatchedTime % 60).toString().padStart(2, '0')} / {Math.floor(videoTotalTime / 60)}:{(videoTotalTime % 60).toString().padStart(2, '0')}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentContent.videoUrl ? (
                        <div className="aspect-video w-full">
                          <YouTubePlayer
                            videoId={currentContent.videoUrl}
                            title={currentContent.title}
                            onProgress={handleVideoProgress}
                            onReady={() => {}}
                            initialProgress={videoWatchedTime}
                            className="w-full"
                          />
                          {videoTotalTime > 0 && (
                            <div className="space-y-2 mt-4">
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Progress</span>
                                <span>{Math.round(progress)}% complete</span>
                              </div>
                              <Progress value={progress} className="w-full" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <BaseVideoPlayer
                          title={currentContent.title}
                          description={currentContent.description}
                          duration={selectedSession.duration}
                          className="w-full"
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Content */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{currentContent.content}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Objectives */}
                  {currentContent.objectives.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Learning Objectives</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {currentContent.objectives.map((objective, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Points */}
                  {currentContent.keyPoints.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Points</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentContent.keyPoints.map((point, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-gray-700">{point}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quiz */}
                  {currentContent.quiz && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Quiz</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!showQuizResults ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h3 className="font-semibold mb-2">
                                Question {currentQuizQuestion + 1} of {currentContent.quiz!.questions.length}
                              </h3>
                              <p className="text-gray-700 mb-4">
                                {currentContent.quiz!.questions[currentQuizQuestion].question}
                              </p>
                              <div className="space-y-2">
                                {currentContent.quiz!.questions[currentQuizQuestion].options.map((option, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleQuizAnswer(index)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                      quizAnswers[currentQuizQuestion] === index
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button
                                variant="outline"
                                onClick={resetQuiz}
                                disabled={currentQuizQuestion === 0}
                              >
                                Reset
                              </Button>
                              {currentQuizQuestion < currentContent.quiz!.questions.length - 1 ? (
                                <Button onClick={handleNextQuizQuestion}>
                                  Next Question
                                </Button>
                              ) : (
                                <Button onClick={handleQuizSubmit}>
                                  Submit Quiz
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                              <h3 className="font-semibold text-green-800 mb-2">Quiz Results</h3>
                              <p className="text-green-700">
                                You scored {quizAnswers.filter((answer, index) => 
                                  answer === currentContent.quiz!.questions[index].correctAnswer
                                ).length} out of {currentContent.quiz!.questions.length} correctly!
                              </p>
                            </div>
                            <Button onClick={resetQuiz}>Retake Quiz</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleBackToLessons}>
                      Back to Lessons
                    </Button>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={handlePreviousSession}>
                        Previous Session
                      </Button>
                      <Button onClick={handleNextSession}>
                        Next Session
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select a Session
                    </h3>
                    <p className="text-gray-600">
                      Choose a session from the sidebar to begin learning.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export { BaseLearningMaterial };