'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Play, Pause, CheckCircle, Target } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  instructions: string[];
  exercises: {
    id: string;
    title: string;
    description: string;
    duration: number; // in seconds
  }[];
}

interface AssignmentViewerProps {
  category: string;
  onBack: () => void;
}

const assignmentData: Record<string, Assignment[]> = {
  'Body Language': [
    {
      id: 'bl-1',
      title: 'Eye Contact Mastery',
      description: 'Learn to maintain appropriate eye contact to build trust and engagement',
      duration: 15,
      difficulty: 'Beginner',
      instructions: [
        'Sit comfortably in front of your camera',
        'Look directly into the camera lens, not at the screen',
        'Practice maintaining eye contact for 3-5 seconds at a time',
        'Blink naturally and avoid staring',
        'Practice with different speaking scenarios'
      ],
      exercises: [
        {
          id: 'ex-1',
          title: 'Basic Eye Contact',
          description: 'Practice looking directly at the camera while speaking',
          duration: 300
        },
        {
          id: 'ex-2',
          title: 'Eye Contact with Movement',
          description: 'Maintain eye contact while using hand gestures',
          duration: 240
        },
        {
          id: 'ex-3',
          title: 'Storytelling with Eye Contact',
          description: 'Tell a short story while maintaining proper eye contact',
          duration: 360
        }
      ]
    },
    {
      id: 'bl-2',
      title: 'Confident Posture Training',
      description: 'Develop strong, confident posture that commands attention',
      duration: 20,
      difficulty: 'Beginner',
      instructions: [
        'Stand or sit with your back straight',
        'Keep your shoulders relaxed and back',
        'Align your head over your shoulders',
        'Keep your feet planted firmly on the ground',
        'Practice different postures for different scenarios'
      ],
      exercises: [
        {
          id: 'ex-4',
          title: 'Standing Posture',
          description: 'Practice confident standing posture',
          duration: 300
        },
        {
          id: 'ex-5',
          title: 'Sitting Posture',
          description: 'Master professional sitting posture',
          duration: 240
        },
        {
          id: 'ex-6',
          title: 'Dynamic Posture',
          description: 'Maintain good posture while moving and gesturing',
          duration: 420
        }
      ]
    },
    {
      id: 'bl-3',
      title: 'Effective Hand Gestures',
      description: 'Learn natural and impactful hand gestures that enhance your message',
      duration: 18,
      difficulty: 'Intermediate',
      instructions: [
        'Keep gestures within the "box" between your shoulders and waist',
        'Use open palm gestures to appear trustworthy',
        'Match gesture size to your audience size',
        'Practice gestures that support your words',
        'Avoid repetitive or distracting movements'
      ],
      exercises: [
        {
          id: 'ex-7',
          title: 'Basic Hand Positions',
          description: 'Practice fundamental hand gesture positions',
          duration: 240
        },
        {
          id: 'ex-8',
          title: 'Descriptive Gestures',
          description: 'Use gestures to describe size, shape, and direction',
          duration: 300
        },
        {
          id: 'ex-9',
          title: 'Emphatic Gestures',
          description: 'Practice gestures that emphasize key points',
          duration: 360
        }
      ]
    }
  ],
  'Vocal Tone': [
    {
      id: 'vt-1',
      title: 'Voice Modulation Basics',
      description: 'Learn to vary your pitch, pace, and volume for maximum impact',
      duration: 22,
      difficulty: 'Beginner',
      instructions: [
        'Practice speaking at different pitch levels',
        'Vary your speaking pace for emphasis',
        'Control your volume appropriately',
        'Use pauses effectively',
        'Record yourself to hear improvements'
      ],
      exercises: [
        {
          id: 'ex-10',
          title: 'Pitch Variation',
          description: 'Practice speaking with different pitch levels',
          duration: 360
        },
        {
          id: 'ex-11',
          title: 'Pace Control',
          description: 'Master speaking at different speeds',
          duration: 300
        },
        {
          id: 'ex-12',
          title: 'Volume Dynamics',
          description: 'Practice controlling your speaking volume',
          duration: 420
        }
      ]
    },
    {
      id: 'vt-2',
      title: 'Breathing and Projection',
      description: 'Develop proper breathing techniques for clear voice projection',
      duration: 25,
      difficulty: 'Intermediate',
      instructions: [
        'Practice diaphragmatic breathing',
        'Support your voice with proper breath control',
        'Project your voice without straining',
        'Maintain consistent volume',
        'Use breathing for pacing and emphasis'
      ],
      exercises: [
        {
          id: 'ex-13',
          title: 'Breathing Exercises',
          description: 'Practice proper breathing techniques',
          duration: 300
        },
        {
          id: 'ex-14',
          title: 'Voice Projection',
          description: 'Learn to project your voice effectively',
          duration: 360
        },
        {
          id: 'ex-15',
          title: 'Sustained Speaking',
          description: 'Practice speaking for extended periods',
          duration: 540
        }
      ]
    },
    {
      id: 'vt-3',
      title: 'Emotional Expression',
      description: 'Convey emotions effectively through vocal tone and inflection',
      duration: 20,
      difficulty: 'Advanced',
      instructions: [
        'Practice expressing different emotions through voice',
        'Use inflection to convey meaning',
        'Match your tone to your message',
        'Practice storytelling with emotional range',
        'Develop your unique vocal style'
      ],
      exercises: [
        {
          id: 'ex-16',
          title: 'Emotional Range',
          description: 'Practice expressing different emotions',
          duration: 300
        },
        {
          id: 'ex-17',
          title: 'Storytelling Tone',
          description: 'Use vocal variety in storytelling',
          duration: 420
        },
        {
          id: 'ex-18',
          title: 'Persuasive Speaking',
          description: 'Practice persuasive vocal techniques',
          duration: 480
        }
      ]
    }
  ],
  'Word Power': [
    {
      id: 'wp-1',
      title: 'Eliminating Filler Words',
      description: 'Strategies to reduce "um", "uh", and other verbal fillers in your speech',
      duration: 18,
      difficulty: 'Beginner',
      instructions: [
        'Become aware of your filler word usage',
        'Practice pausing instead of using fillers',
        'Slow down your speaking pace',
        'Prepare key phrases in advance',
        'Record yourself to track progress'
      ],
      exercises: [
        {
          id: 'ex-19',
          title: 'Filler Word Awareness',
          description: 'Identify and count your filler words',
          duration: 240
        },
        {
          id: 'ex-20',
          title: 'Pause Practice',
          description: 'Practice using pauses instead of fillers',
          duration: 300
        },
        {
          id: 'ex-21',
          title: 'Smooth Speaking',
          description: 'Speak continuously without fillers',
          duration: 540
        }
      ]
    },
    {
      id: 'wp-2',
      title: 'Power Words and Phrases',
      description: 'Learn to use impactful words that enhance your message',
      duration: 16,
      difficulty: 'Intermediate',
      instructions: [
        'Build a vocabulary of power words',
        'Practice using action verbs',
        'Replace weak words with strong alternatives',
        'Use specific rather than general terms',
        'Practice incorporating power words naturally'
      ],
      exercises: [
        {
          id: 'ex-22',
          title: 'Power Word Practice',
          description: 'Practice using impactful vocabulary',
          duration: 240
        },
        {
          id: 'ex-23',
          title: 'Word Substitution',
          description: 'Replace weak words with powerful alternatives',
          duration: 300
        },
        {
          id: 'ex-24',
          title: 'Persuasive Language',
          description: 'Use power words in persuasive contexts',
          duration: 420
        }
      ]
    },
    {
      id: 'wp-3',
      title: 'Clear Articulation',
      description: 'Improve pronunciation and clarity of speech',
      duration: 14,
      difficulty: 'Beginner',
      instructions: [
        'Practice tongue twisters for articulation',
        'Focus on consonant clarity',
        'Work on vowel pronunciation',
        'Practice speaking slowly and clearly',
        'Record and review your pronunciation'
      ],
      exercises: [
        {
          id: 'ex-25',
          title: 'Tongue Twisters',
          description: 'Practice challenging tongue twisters',
          duration: 180
        },
        {
          id: 'ex-26',
          title: 'Consonant Clarity',
          description: 'Focus on clear consonant pronunciation',
          duration: 240
        },
        {
          id: 'ex-27',
          title: 'Reading Aloud',
          description: 'Practice clear articulation while reading',
          duration: 420
        }
      ]
    }
  ]
};

export function AssignmentViewer({ category, onBack }: AssignmentViewerProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const assignments = assignmentData[category] || [];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && !isPaused && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            setIsActive(false);
            handleExerciseComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeRemaining]);

  const handleStartAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setCurrentExercise(0);
    setTimeRemaining(assignment.exercises[0].duration);
    setCompletedExercises(new Set());
  };

  const handleStartExercise = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePauseExercise = () => {
    setIsPaused(!isPaused);
  };

  const handleExerciseComplete = () => {
    if (!selectedAssignment) return;
    
    const currentEx = selectedAssignment.exercises[currentExercise];
    setCompletedExercises(prev => new Set([...Array.from(prev), currentEx.id]));
    
    if (currentExercise < selectedAssignment.exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setTimeRemaining(selectedAssignment.exercises[currentExercise + 1].duration);
      setIsActive(false);
      setIsPaused(false);
    } else {
      // Assignment completed
      setSelectedAssignment(null);
      setCurrentExercise(0);
      setIsActive(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedAssignment) {
    const currentEx = selectedAssignment.exercises[currentExercise];
    const progress = ((currentExercise + (completedExercises.has(currentEx.id) ? 1 : 0)) / selectedAssignment.exercises.length) * 100;

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedAssignment(null)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Assignment</span>
          </Button>
          <h2 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercise Content */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Exercise {currentExercise + 1}: {currentEx.title}</span>
                  <Badge className={getDifficultyColor(selectedAssignment.difficulty)}>
                    {selectedAssignment.difficulty}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-600">{currentEx.description}</p>
                
                {/* Timer */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {isActive ? (isPaused ? 'Paused' : 'Active') : 'Ready to start'}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center space-x-4">
                  {!isActive ? (
                    <Button 
                      onClick={handleStartExercise}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={timeRemaining === 0}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Exercise
                    </Button>
                  ) : (
                    <Button 
                      onClick={handlePauseExercise}
                      variant="outline"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleExerciseComplete}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!isActive}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Exercise
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Instructions:</h4>
                  <ul className="space-y-1 text-sm">
                    {selectedAssignment.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Exercise {currentExercise + 1} of {selectedAssignment.exercises.length}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedAssignment.exercises.map((exercise, index) => (
                    <div 
                      key={exercise.id}
                      className={`p-3 rounded-lg border ${
                        index === currentExercise 
                          ? 'border-blue-500 bg-blue-50' 
                          : completedExercises.has(exercise.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{exercise.title}</span>
                        {completedExercises.has(exercise.id) && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTime(exercise.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Learning</span>
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">{category} Assignments</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {assignment.title}
                </CardTitle>
                <Badge className={getDifficultyColor(assignment.difficulty)}>
                  {assignment.difficulty}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">{assignment.description}</p>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{assignment.duration} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{assignment.exercises.length} exercises</span>
                </div>
              </div>

              <Button 
                onClick={() => handleStartAssignment(assignment)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Assignment
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}