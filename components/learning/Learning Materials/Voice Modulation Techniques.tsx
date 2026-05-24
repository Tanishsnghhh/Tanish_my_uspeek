'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ChevronDown,
  ChevronRight,
  Upload
} from 'lucide-react';

// Reusable VideoPlayer Component
interface VideoPlayerProps {
  title: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  title, 
  subtitle, 
  description = "Click to play the video", 
  className = "" 
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden aspect-video relative">
        {/* Video Player */}
        <div className="w-full h-full flex items-center justify-center relative">
          <div className="text-center text-white">
            <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Play className="w-10 h-10" />
            </div>
            <div className="text-2xl font-bold mb-2">
              <div>{title}</div>
              {subtitle && <div>{subtitle}</div>}
            </div>
            <p className="text-gray-300 text-sm">{description}</p>
          </div>
        </div>
        
        {/* uSpeek Logo */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="text-gray-400 text-xs">uSpeek</span>
        </div>
      </div>
    </div>
  );
};

// Reusable AudioPlayer Component
interface AudioPlayerProps {
  title: string;
  subtitle?: string;
  description?: string;
  duration?: string;
  className?: string;
  variant?: 'simple' | 'advanced';
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  title, 
  subtitle, 
  description = "Practice audio guide", 
  duration = "0:00",
  className = "",
  variant = "advanced"
}) => {
  if (variant === 'simple') {
    return (
      <div className={`mb-6 ${className}`}>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </button>
              <span className="text-sm text-gray-600">0:00 / {duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-300 rounded-full">
                <div className="w-0 h-2 bg-gray-600 rounded-full"></div>
              </div>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-8 ${className}`}>
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden p-6">
        {/* Audio Player Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{title}</h3>
              <p className="text-gray-300 text-sm">{description}</p>
            </div>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Play className="w-5 h-5 text-gray-800" />
            </button>
            <div className="text-white">
              <span className="text-sm">0:00</span>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-sm">{duration}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Progress Bar */}
            <div className="w-32 h-2 bg-gray-600 rounded-full">
              <div className="w-0 h-2 bg-white rounded-full transition-all duration-300"></div>
            </div>
            
            {/* Volume Control */}
            <button className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            
            {/* Menu */}
            <button className="text-white hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable VideoUpload Component
interface VideoUploadProps {
  id: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'standard' | 'compact';
  uploadedFile?: File | null;
  onFileChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ 
  id,
  title = "Upload Video",
  description = "Click to upload your practice video",
  className = "",
  variant = "standard",
  uploadedFile,
  onFileChange
}) => {
  if (variant === 'compact') {
    return (
      <div className={`mb-6 ${className}`}>
        {title && <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
          <input
            id={id}
            type="file"
            accept="video/*"
            onChange={onFileChange}
            className="hidden"
          />
          <label
            htmlFor={id}
            className="cursor-pointer"
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">{description}</p>
            {uploadedFile && (
              <p className="mt-2 text-green-600 text-sm">✓ {uploadedFile.name}</p>
            )}
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-8 ${className}`}>
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
        <input
          id={id}
          type="file"
          accept="video/*"
          onChange={onFileChange}
          className="hidden"
        />
        <label
          htmlFor={id}
          className="cursor-pointer"
        >
          <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <p className="text-blue-500 font-medium">{title}</p>
          {uploadedFile && (
            <p className="mt-2 text-green-600 text-sm">✓ {uploadedFile.name}</p>
          )}
        </label>
      </div>
    </div>
  );
};

interface Session {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'text' | 'quiz';
  isActive: boolean;
  isCompleted: boolean;
}

// Voice Modulation Techniques course data
const voiceModulationSessions: Session[] = [
  {
    id: '1',
    title: 'Introduction to Voice Modulation',
    description: 'Understanding the fundamentals of voice modulation and its impact',
    duration: '8:00',
    type: 'video',
    isActive: true,
    isCompleted: false
  },
  {
    id: '2',
    title: 'Pitch Control Techniques',
    description: 'Learn how to control and vary your pitch effectively',
    duration: '10:00',
    type: 'text',
    isActive: false,
    isCompleted: false
  },
  {
    id: '3',
    title: 'Pace and Rhythm Mastery',
    description: 'Master the art of controlling speaking pace and rhythm',
    duration: '12:00',
    type: 'text',
    isActive: false,
    isCompleted: false
  },
  {
    id: '4',
    title: 'Volume and Projection',
    description: 'Techniques for proper volume control and voice projection',
    duration: '9:00',
    type: 'video',
    isActive: false,
    isCompleted: false
  },
  {
    id: '5',
    title: 'Emotional Expression Through Voice',
    description: 'How to convey emotions through voice modulation',
    duration: '11:00',
    type: 'text',
    isActive: false,
    isCompleted: false
  },
  {
    id: '6',
    title: 'Advanced Modulation Strategies',
    description: 'Advanced techniques for professional voice modulation',
    duration: '15:00',
    type: 'video',
    isActive: false,
    isCompleted: false
  },
  {
    id: '7',
    title: 'Voice Modulation Quiz',
    description: 'Test your knowledge of voice modulation techniques',
    duration: '8:00',
    type: 'quiz',
    isActive: false,
    isCompleted: false
  }
];

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
  script?: string;
  isExternalPage?: boolean;
  nextSession?: string;
  hasVideo?: boolean;
  videoSrc?: string;
  audioSamples?: Array<{
    id: number;
    duration: string;
    title: string;
  }>;
  rateOptions?: string[];
  difficultyLevels?: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  practiceText?: string;
  hasAudio?: boolean;
  audioSrc?: string;
  audioDuration?: string;
  duration?: string;
  questions?: Array<{
    id: number;
    question: string;
    answer: string;
  }>;
}

const voiceModulationContent: Record<string, LessonContentItem> = {
  '1': {
    title: 'Introduction to Voice Modulation',
    description: 'Understanding the fundamentals of voice modulation and its impact',
    content: 'Voice modulation is the art of varying your voice\'s pitch, pace, volume, and tone to create engaging and effective communication. It\'s not just about speaking clearly—it\'s about using your voice as a powerful tool to convey meaning, emotion, and authority. In this introductory session, we\'ll explore why voice modulation matters and how it can transform your communication skills.',
    objectives: [
      'Understand what voice modulation is and why it matters',
      'Learn the four key elements of voice modulation',
      'Recognize the impact of voice modulation on audience engagement',
      'Identify common voice modulation mistakes to avoid'
    ],
    keyPoints: [
      'Voice modulation includes pitch, pace, volume, and tone',
      'Proper modulation increases audience engagement by 40%',
      'Monotone voices are perceived as less credible',
      'Modulation helps convey emotions and emphasize key points'
    ]
  },
  '2': {
    title: 'Pitch Control Techniques',
    description: 'Learn how to control and vary your pitch effectively',
    content: 'Pitch control is fundamental to effective voice modulation. Your pitch can convey confidence, authority, enthusiasm, or concern. Learning to control and vary your pitch appropriately can make the difference between a forgettable presentation and a memorable one. This session covers practical techniques for pitch control that you can apply immediately.',
    objectives: [
      'Master the basics of pitch variation',
      'Learn techniques for raising and lowering pitch naturally',
      'Understand how pitch affects audience perception',
      'Practice pitch control in different scenarios'
    ],
    keyPoints: [
      'Higher pitch conveys excitement and enthusiasm',
      'Lower pitch projects authority and confidence',
      'Varying pitch prevents monotony and maintains interest',
      'Practice with recordings to develop pitch awareness'
    ]
  },
  '3': {
    title: 'Pace and Rhythm Mastery',
    description: 'Master the art of controlling speaking pace and rhythm',
    content: 'Pace and rhythm are crucial elements of voice modulation that directly impact how your message is received. The right pace can build suspense, emphasize important points, or create urgency. Rhythm helps your audience follow along and remember key information. This session teaches you how to master these essential skills.',
    objectives: [
      'Learn to control speaking pace effectively',
      'Master rhythm patterns for better engagement',
      'Understand when to speed up or slow down',
      'Practice pace variation in different contexts'
    ],
    keyPoints: [
      'Slower pace for important points and complex ideas',
      'Faster pace for excitement and energy',
      'Pauses create emphasis and allow processing time',
      'Rhythm helps audience follow and remember content'
    ]
  },
  '4': {
    title: 'Volume and Projection',
    description: 'Techniques for proper volume control and voice projection',
    content: 'Volume and projection are essential for ensuring your message reaches every member of your audience. Proper volume control shows confidence and authority, while good projection ensures clarity and engagement. This session covers techniques for developing strong, clear voice projection without straining.',
    objectives: [
      'Learn proper breathing techniques for projection',
      'Master volume control for different audience sizes',
      'Understand how to project without straining',
      'Practice volume variation for emphasis'
    ],
    keyPoints: [
      'Diaphragmatic breathing supports strong projection',
      'Volume should match audience size and room acoustics',
      'Varying volume creates emphasis and interest',
      'Good projection comes from proper breath support'
    ]
  },
  '5': {
    title: 'Emotional Expression Through Voice',
    description: 'How to convey emotions through voice modulation',
    content: 'Your voice is a powerful tool for conveying emotions and creating emotional connections with your audience. By learning to express emotions through voice modulation, you can make your presentations more compelling and memorable. This session teaches you how to use your voice to create emotional impact.',
    objectives: [
      'Learn to convey different emotions through voice',
      'Master emotional expression techniques',
      'Understand the connection between emotion and voice',
      'Practice emotional voice modulation'
    ],
    keyPoints: [
      'Joy and excitement use higher pitch and faster pace',
      'Serious topics benefit from lower pitch and slower pace',
      'Emotion in voice creates stronger audience connection',
      'Practice helps develop natural emotional expression'
    ]
  },
  '6': {
    title: 'Advanced Modulation Strategies',
    description: 'Advanced voice modulation combines all the techniques you\'ve learned into sophisticated strategies for professional communication. This session covers advanced techniques used by professional speakers, actors, and communication experts. You\'ll learn how to create compelling, memorable presentations that captivate your audience.',
    content: 'Advanced voice modulation combines all the techniques you\'ve learned into sophisticated strategies for professional communication. This session covers advanced techniques used by professional speakers, actors, and communication experts. You\'ll learn how to create compelling, memorable presentations that captivate your audience.',
    objectives: [
      'Master advanced modulation combinations',
      'Learn professional-level voice techniques',
      'Develop personal voice modulation style',
      'Apply advanced techniques in real scenarios'
    ],
    keyPoints: [
      'Combine multiple techniques for maximum impact',
      'Develop your unique voice modulation signature',
      'Advanced techniques require consistent practice',
      'Professional modulation enhances credibility and authority'
    ]
  },
  '7': {
    title: 'Voice Modulation Quiz',
    description: 'Test your knowledge of voice modulation techniques',
    content: 'This quiz will test your understanding of voice modulation concepts, techniques, and best practices. Answer the questions based on what you\'ve learned throughout this course.',
    objectives: [
      'Assess understanding of voice modulation fundamentals',
      'Test knowledge of pitch, pace, and volume control',
      'Evaluate comprehension of emotional expression techniques',
      'Review advanced modulation strategies'
    ],
    keyPoints: [
      'Focus on practical application of techniques',
      'Consider real-world communication scenarios',
      'Apply cultural sensitivity in voice modulation',
      'Remember the importance of natural expression'
    ],
    quiz: {
      questions: [
        {
          id: 1,
          question: 'Which of the following is NOT a key element of voice modulation?',
          options: ['Pitch', 'Pace', 'Volume', 'Eye Color'],
          correctAnswer: 3,
          explanation: 'Eye color is not related to voice modulation. The key elements are pitch, pace, volume, and tone.'
        },
        {
          id: 2,
          question: 'What does a higher pitch typically convey?',
          options: ['Authority and confidence', 'Excitement and enthusiasm', 'Sadness and concern', 'Boredom and disinterest'],
          correctAnswer: 1,
          explanation: 'Higher pitch typically conveys excitement and enthusiasm, while lower pitch projects authority and confidence.'
        },
        {
          id: 3,
          question: 'In which country can too much eye contact be considered intimidating?',
          options: ['Japan', 'America', 'Brazil', 'UK'],
          correctAnswer: 0,
          explanation: 'In Japan, prolonged eye contact can be considered intimidating or disrespectful in certain contexts.'
        },
        {
          id: 4,
          question: 'What is the recommended approach for speaking pace during important points?',
          options: ['Speed up to maintain energy', 'Slow down for emphasis', 'Maintain consistent pace', 'Vary randomly'],
          correctAnswer: 1,
          explanation: 'Slower pace is recommended for important points and complex ideas to allow the audience to process the information.'
        },
        {
          id: 5,
          question: 'Which technique helps maintain audience engagement through voice modulation?',
          options: ['Speaking in monotone', 'Using purposeful pauses', 'Speaking at maximum volume', 'Avoiding pitch variation'],
          correctAnswer: 1,
          explanation: 'Purposeful pauses help maintain audience engagement and allow listeners to process information.'
        }
      ]
    }
  },
  'try-to-match-rate': {
    title: 'Try to Match Rate of Speech',
    description: 'Advanced practice session to master rate matching with varying complexity levels',
    duration: '20:00',
    content: 'This exercise will challenge you with more complex speech patterns and varying rates. Choose your difficulty level and practice matching the exact timing and rhythm.',
    objectives: [
      'Master advanced rate matching techniques',
      'Practice with varying complexity levels',
      'Improve timing and rhythm control',
      'Develop precise speech rate matching'
    ],
    keyPoints: [
      'Focus on rhythm and timing patterns',
      'Pay attention to natural pauses and breaks',
      'Practice with a metronome for precise timing',
      'Record multiple attempts and compare'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/learn-breathing',
    difficultyLevels: [
      { id: 'beginner', title: 'Beginner Level', description: 'Simple sentences with consistent pacing.' },
      { id: 'intermediate', title: 'Intermediate Level', description: 'Complex sentences with varying pace.' },
      { id: 'advanced', title: 'Advanced Level', description: 'Dynamic speech with rapid pace changes.' }
    ],
    practiceText: 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. Practice speaking this sentence at different rates while maintaining clarity and proper pronunciation.'
  },
  'learn-breathing': {
    title: 'Breathing exercise',
    description: 'Master breathing techniques to control your rate of speech and improve vocal delivery',
    duration: '12:00',
    content: 'Proper breathing is fundamental to controlling your rate of speech. Learn diaphragmatic breathing, breath support, and how to use breathing to pace your speech effectively.',
    objectives: [
      'Learn diaphragmatic breathing techniques',
      'Master breath support for speech',
      'Understand pacing with breath',
      'Practice breathing exercises'
    ],
    keyPoints: [
      'Diaphragmatic breathing provides better breath support',
      'Breath support helps control speaking pace',
      'Natural breathing patterns create pauses',
      'Proper breathing reduces anxiety and improves clarity'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/practice-2',
    hasVideo: true,
    videoSrc: '/AppVideo/Breathing/Breathing%20Exercise%20Video.mp4',
    hasAudio: true,
    audioSrc: '/AppAudio/Breathing/Breathing%20Instructions.mp3',
    audioDuration: '0:21'
  },
  'practice-2': {
    title: 'Recording Exercise 2',
    description: 'Practice recording yourself with a specific script',
    duration: '10:00',
    content: 'Now, let us try it again. Record yourself saying the script below. You can upload a video from your computer or mobile.',
    objectives: [
      'Record yourself saying the provided script',
      'Focus on maintaining a consistent rate of speech',
      'Upload your video for review',
      'Practice clear pronunciation and enunciation'
    ],
    keyPoints: [
      'Mount Everest is the highest mountain in the world at 29,035 feet',
      'It grows 4mm higher every year due to geologic uplift',
      'Over 4,000 people have attempted to climb it',
      'The youngest person to reach the summit was 13',
      'The oldest was 80'
    ],
    script: 'Mount Everest is the highest mountain in the world at 29,035 feet. It grows 4mm higher every year due to geologic uplift. Over 4,000 people have attempted to climb it. The youngest person to reach the summit was 13. The oldest was 80.',
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/learn-period-pause'
  },
  'learn-period-pause': {
    title: 'Learn Period and Pause',
    description: 'Master the art of using pauses and periods to control your speech rate and improve clarity',
    duration: '10:00',
    content: 'Learn how strategic pauses and proper use of periods can dramatically improve your speech rate control, clarity, and audience engagement.',
    objectives: [
      'Understand the importance of strategic pauses',
      'Learn proper period placement techniques',
      'Master different pause durations',
      'Practice pause timing for maximum impact'
    ],
    keyPoints: [
      'Strategic pauses emphasize important points',
      'Period placement creates natural breaks',
      'Pause duration affects audience processing',
      'Proper pausing improves speech clarity'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/practice-3',
    hasVideo: true,
    videoSrc: '/AppVideo/PeriodPause/Period%20and%20Pause%20Video.mp4'
  },
  'practice-3': {
    title: 'Recording Exercise 3',
    description: 'Practice recording yourself with a specific script using periods and pauses',
    duration: '12:00',
    content: 'Now, let us try it again. Record yourself saying the script below. You can upload a video from your computer or mobile.',
    objectives: [
      'Record yourself saying the provided script with proper pauses',
      'Focus on using periods and pauses effectively',
      'Upload your video for review',
      'Practice clear pronunciation and enunciation with strategic pauses'
    ],
    keyPoints: [
      'Mount Everest is the highest mountain in the world at 29,035 feet. (Period, Pause)',
      'It grows 4mm higher every year due to geologic uplift. (Period, Pause)',
      'Over 4,000 people have attempted to climb it. (Period, Pause)',
      'The youngest person to reach the summit was 13. (Period, Pause)',
      'The oldest was 80. (Period, Pause)'
    ],
    script: 'Mount Everest is the highest mountain in the world at 29,035 feet. (Period, Pause) It grows 4mm higher every year due to geologic uplift. (Period, Pause) Over 4,000 people have attempted to climb it. (Period, Pause) The youngest person to reach the summit was 13. (Period, Pause) The oldest was 80. (Period, Pause)',
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/question-answer'
  },
  'what-is-pace-variation': {
    title: 'What is Pace Variation?',
    description: 'Learn about pace variation and its importance in effective communication',
    duration: '8:00',
    content: 'Pace variation is the strategic use of different speaking speeds to create interest, emphasize points, and maintain audience engagement throughout your presentation.',
    objectives: [
      'Understand what vocal variation means',
      'Learn why variation is important',
      'Practice pace variation techniques',
      'Apply pace variation in communication'
    ],
    keyPoints: [
      'Vocal variation means speaking at different rates of speech',
      'Slower rate emphasizes certain words',
      'Faster rate creates exhilaration and joy',
      'Variation keeps listeners engaged',
      'Variation creates emotional journey'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/practice-4',
    questions: [
      {
        id: 1,
        question: 'What does vocal variation mean?',
        answer: 'It means speaking at different rates of speech. For example, when you speak at a slower rate, you emphasize on certain words. When you speak at a fast rate, the tempo creates a feeling of exhilaration and joy.'
      },
      {
        id: 2,
        question: 'Why is it important to have variation?',
        answer: 'It keeps the listener engaged, creates a story, and takes you through an emotional journey of anticipation and excitement.'
      }
    ]
  },
  'practice-4': {
    title: 'Recording Exercise 4',
    description: 'Practice recording yourself with pace variation techniques',
    duration: '15:00',
    content: 'Now, let us practice. Record yourself saying the script below and vary your rate of speech as you read it. You can upload a video from your computer or mobile.',
    objectives: [
      'Record yourself saying the provided script with pace variation',
      'Focus on varying your rate of speech effectively',
      'Upload your video for review',
      'Practice clear pronunciation and enunciation with pace variation'
    ],
    keyPoints: [
      'Roger Federer is a Swiss tennis player who has dominated the sport since early 21st century',
      'He is known to be an all-rounder and has won 20 single men\'s Grand Slam Championships',
      'This is the maximum number in the history of tennis',
      'At the age of 17, he won his first Wimbledon junior singles championship'
    ],
    script: 'Roger Federer is a Swiss tennis player who has dominated the sport since early 21st century. He is known to be an all-rounder and has won 20 single men\'s Grand Slam Championships, which is the maximum number in the history of tennis. At the age of 17, he won his first Wimbledon junior singles championship.',
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume'
  },
  'what-is-volume': {
    title: 'What is Volume?',
    description: 'Learn about volume and its importance in effective communication',
    duration: '8:00',
    content: 'Volume is the loudness or softness of your voice. Understanding how to control and vary your volume is essential for effective communication and audience engagement.',
    objectives: [
      'Understand what volume is and why it matters',
      'Learn how to control your volume effectively',
      'Practice volume variation techniques',
      'Apply volume control in different situations'
    ],
    keyPoints: [
      'Volume affects audience engagement and comprehension',
      'Proper volume control shows confidence and authority',
      'Volume variation creates interest and emphasis',
      'Context determines appropriate volume levels'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume/volume-practice-1',
    hasVideo: true,
    videoSrc: '/AppVideo/Volume/Lesson%203-1%20Vocal%20Volume%20(App).mp4'
  },
  'volume-practice-1': {
    title: 'Practice Exercise 1',
    description: 'Practice recording yourself with volume control techniques',
    duration: '12:00',
    content: 'Now, let us practice. Record yourself saying the script below. You can upload a video from your computer or mobile.',
    objectives: [
      'Record yourself saying the provided script',
      'Focus on volume control and projection',
      'Upload your video for review',
      'Practice clear pronunciation and enunciation'
    ],
    keyPoints: [
      'Dolphins stick to their mothers for 3 to 8 years',
      'They are extremely intelligent animals rated only second to humans',
      'The average lifespan is 17 years but can live up to 50 years',
      'Dolphins have two stomachs, one for food and the other for digestion'
    ],
    script: 'Dolphins stick to their mothers for 3 to 8 years. They are extremely intelligent animals rated only second to humans. The average lifespan is 17 years but can live up to 50 years. Dolphins have two stomachs, one for food and the other for digestion.',
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume/learn-balloon-exercise'
  },
  'learn-balloon-exercise': {
    title: 'Learn Balloon Exercise',
    description: 'Learn the balloon exercise technique for volume control',
    duration: '10:00',
    content: 'The balloon exercise is a simple yet effective technique for improving your volume control and voice projection. This exercise helps you understand how to use your diaphragm and control your breath for better vocal delivery.',
    objectives: [
      'Learn the balloon exercise technique',
      'Understand how to control your breath for volume',
      'Practice voice projection without straining',
      'Develop better vocal control'
    ],
    keyPoints: [
      'The balloon exercise helps with breath control',
      'It improves voice projection and volume',
      'It teaches proper diaphragm usage',
      'It reduces vocal strain and fatigue'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume/balloon-practice',
    hasVideo: true,
    videoSrc: '/AppVideo/Volume/Balloon%20Exercise%20Video.mp4'
  },
  'balloon-practice': {
    title: 'Balloon Exercise Practice',
    description: 'Practice the balloon exercise technique',
    duration: '8:00',
    content: 'Now practice the balloon exercise technique you just learned. Follow the instructions and record your practice session.',
    objectives: [
      'Practice the balloon exercise technique',
      'Record your practice session',
      'Focus on breath control and volume',
      'Apply the learned techniques'
    ],
    keyPoints: [
      'Practice makes perfect',
      'Focus on breath control',
      'Maintain consistent volume',
      'Record for self-assessment'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume/learn-mouth-exercise'
  },
  'learn-mouth-exercise': {
    title: 'Learn Mouth Exercise',
    description: 'Learn mouth exercises for better articulation',
    duration: '12:00',
    content: 'Mouth exercises help improve articulation and clarity in speech. These exercises strengthen the muscles used in speaking and help with pronunciation.',
    objectives: [
      'Learn mouth exercise techniques',
      'Improve articulation and clarity',
      'Strengthen speaking muscles',
      'Practice pronunciation exercises'
    ],
    keyPoints: [
      'Mouth exercises improve articulation',
      'They strengthen speaking muscles',
      'They help with pronunciation',
      'Regular practice is essential'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume/learn-back-of-room'
  },
  'learn-back-of-room': {
    title: 'Learn Back of Room Exercise',
    description: 'Learn exercises for projecting your voice to the back of the room',
    duration: '10:00',
    content: 'The back of room exercise helps you learn to project your voice effectively so that everyone in the room can hear you clearly.',
    objectives: [
      'Learn voice projection techniques',
      'Practice speaking to the back of the room',
      'Improve voice clarity and volume',
      'Develop confidence in speaking'
    ],
    keyPoints: [
      'Voice projection is essential for public speaking',
      'Practice speaking to different distances',
      'Focus on clarity and volume',
      'Build confidence through practice'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume/balloon-practice-2'
  },
  'balloon-practice-2': {
    title: 'Advanced Balloon Practice',
    description: 'Advanced practice of the balloon exercise technique',
    duration: '15:00',
    content: 'Now practice the balloon exercise with more advanced techniques and variations.',
    objectives: [
      'Practice advanced balloon techniques',
      'Combine with other exercises',
      'Record and assess progress',
      'Build confidence in voice control'
    ],
    keyPoints: [
      'Advanced techniques build on basics',
      'Combination exercises are effective',
      'Regular practice improves results',
      'Self-assessment is important'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume/balloon-practice-3'
  },
  'balloon-practice-3': {
    title: 'Final Balloon Practice',
    description: 'Final practice session for the balloon exercise',
    duration: '12:00',
    content: 'This is your final practice session for the balloon exercise. Apply all the techniques you have learned.',
    objectives: [
      'Apply all learned techniques',
      'Demonstrate mastery of the exercise',
      'Record final practice session',
      'Assess overall progress'
    ],
    keyPoints: [
      'Final practice consolidates learning',
      'Demonstrate mastery of techniques',
      'Record for future reference',
      'Celebrate progress made'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/volume'
  },
  'what-is-pitch': {
    title: 'What is Pitch?',
    description: 'Understanding the fundamentals of pitch in voice modulation',
    duration: '8:00',
    content: 'Pitch is one of the fundamental elements of voice modulation. It refers to how high or low your voice sounds when you speak. Understanding and controlling pitch is essential for effective communication and creating engaging presentations.',
    objectives: [
      'Understand what pitch is in voice modulation',
      'Learn how pitch affects communication',
      'Recognize different pitch variations',
      'Practice pitch control techniques'
    ],
    keyPoints: [
      'Pitch is the highness or lowness of your voice',
      'Varying pitch creates interest and engagement',
      'Different pitches convey different emotions',
      'Pitch control is essential for effective communication'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/fun-facts',
    hasVideo: true,
    videoSrc: '/AppVideo/Pitch/What%20is%20Pitch%20Video.mp4'
  },
  'fun-facts': {
    title: 'Fun Facts',
    description: 'About Vocal Pitch',
    duration: '5:00',
    content: 'Discover interesting facts about vocal pitch and how it relates to your voice range and communication.',
    objectives: [
      'Learn about vocal range and its importance',
      'Understand male and female vocal pitch categories',
      'Recognize different vocal types and their frequency ranges',
      'Appreciate the science behind vocal pitch'
    ],
    keyPoints: [
      'Your vocal range is the lowest note you can sing to the highest note you can sing',
      'Most male vocal pitch ranges are categorized into 3 types: Bass (87 to 330 hertz), Baritone (87 to 349 hertz), Tenor (130 to 523 hertz)',
      'Most female vocal pitch ranges are categorized into 3 types: Alto (175 to 698 hertz), Mezzo-Soprano (110 to 880 hertz), Soprano (262 to 1047 hertz)'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/pitch-video-examples'
  },
  'pitch-video-examples': {
    title: 'Pitch Video Examples',
    description: 'Watch some interesting YouTube videos on vocal pitch',
    duration: '15:00',
    content: 'This section showcases three YouTube videos that demonstrate different aspects of vocal pitch and how it affects communication.',
    objectives: [
      'Watch videos on vocal pitch examples',
      'Learn from real-world pitch variations',
      'Understand how pitch affects communication',
      'Observe different pitch techniques in action'
    ],
    keyPoints: [
      'Margaret Thatcher - Iron Lady\'s speech patterns',
      'Top 10 Male Actors with Iconic Voices',
      'Top 10 Actresses with Unique Voices',
      'Different pitch variations and their impact'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/learn-bumble-bee'
  },
  'learn-bumble-bee': {
    title: 'Learn Bumble Bee Exercise',
    description: 'Master the bumble bee exercise for pitch control and vocal resonance',
    duration: '10:00',
    content: 'The bumble bee exercise is a powerful technique for improving pitch control and vocal resonance. This exercise helps you develop better control over your vocal cords and create a more resonant, engaging voice.',
    objectives: [
      'Learn the bumble bee exercise technique',
      'Understand how it improves pitch control',
      'Practice vocal resonance techniques',
      'Develop better vocal cord control'
    ],
    keyPoints: [
      'The bumble bee exercise improves vocal resonance',
      'It helps control pitch variations',
      'It strengthens vocal cord muscles',
      'Regular practice enhances voice quality'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/practice-9',
    hasVideo: true,
    videoSrc: '/AppVideo/Pitch/Bumble%20Bee%20Exercise%20Video.mp4'
  },
  'practice-9': {
    title: 'Bumble Bee Exercise Practice',
    description: 'Practice the bumble bee exercise for pitch control and vocal resonance',
    duration: '10:00',
    content: 'The bumble bee exercise is a powerful technique for improving pitch control and vocal resonance. This exercise helps you develop better control over your vocal cords and create a more resonant, engaging voice.',
    objectives: [
      'Practice the bumble bee exercise technique',
      'Understand how it improves pitch control',
      'Develop better vocal resonance techniques',
      'Practice vocal resonance in different scenarios'
    ],
    keyPoints: [
      'The bumble bee exercise improves vocal resonance',
      'It helps control pitch variations',
      'It strengthens vocal cord muscles',
      'Regular practice enhances voice quality'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/practice-10',
    hasVideo: true,
    videoSrc: '/AppVideo/Pitch/Bumble%20Bee%20Exercise%20Video.mp4'
  },
  'learn-yawn-exercise': {
    title: 'Learn Yawn Exercise',
    description: 'Master the yawn exercise for pitch control and vocal resonance',
    duration: '8:00',
    content: 'The yawn exercise is a simple yet effective technique for improving pitch control and vocal resonance. This exercise helps you develop better control over your vocal cords and create a more resonant, engaging voice.',
    objectives: [
      'Learn the yawn exercise technique',
      'Understand how it improves pitch control',
      'Practice vocal resonance techniques',
      'Develop better vocal cord control'
    ],
    keyPoints: [
      'The yawn exercise improves vocal resonance',
      'It helps control pitch variations',
      'It strengthens vocal cord muscles',
      'Regular practice enhances voice quality'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch',
    hasVideo: true,
    videoSrc: '/AppVideo/Pitch/Yawn%20Exercise%20Video.mp4'
  },
  'practice-10': {
    title: 'Practice Exercise',
    description: 'Practice recording yourself with the Morgan Freeman script',
    duration: '10:00',
    content: 'Now, let us practice. Record yourself saying the script below. You can upload a video from your computer or mobile.',
    objectives: [
      'Record yourself saying the provided script',
      'Focus on pitch control and variation',
      'Upload your video for review',
      'Practice clear pronunciation and enunciation'
    ],
    keyPoints: [
      'Morgan Freeman has been universally voted one of the best voices of all time',
      'He has used his voice to play God, the President, national commercials',
      'He has been used for presidential campaigns for Barack Obama and Hillary Clinton',
      'He had a voice and diction instructor while studying acting at LA City College'
    ],
    script: 'Morgan Freeman has been universally voted one of the best voices of all time. He has used his voice to play God, the President, national commercials and even for presidential campaigns for Barack Obama and Hillary Clinton. How did he get such as powerful voice like that? He had a voice and diction instructor while studying acting at LA City College.',
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation'
  },
  'what-is-modulation': {
    title: 'What is Modulation?',
    description: 'Learn about modulation and its importance in effective communication',
    duration: '10:00',
    content: 'Modulation is the strategic use of voice pitch, pace, and volume to create interest, emphasize points, and maintain audience engagement throughout your presentation.',
    objectives: [
      'Understand what modulation is and why it matters',
      'Learn different modulation techniques',
      'Practice modulation in different scenarios',
      'Develop a personal modulation style'
    ],
    keyPoints: [
      'Modulation adds depth and emotion to your voice',
      'It helps convey different emotions and tones',
      'Different modulation techniques work for different situations',
      'Practice helps develop modulation skills'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/modulation-practice-1'
  },
  'modulation-practice-1': {
    title: 'Practice',
    description: 'Practice modulation techniques with video guidance',
    duration: '8:00',
    content: 'This practice session will help you apply the modulation techniques you\'ve learned. Watch the video and then practice the exercises.',
    objectives: [
      'Watch the practice video',
      'Apply modulation techniques',
      'Record your practice session',
      'Review and improve your performance'
    ],
    keyPoints: [
      'Focus on pitch variation',
      'Practice pace control',
      'Work on volume modulation',
      'Combine techniques for maximum impact'
    ],
    hasVideo: true,
    videoSrc: '/AppVideo/Modulation/Modulation%20Practice%20Video.mp4',
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/modulation'
  },
  'modulation': {
    title: 'Modulation',
    description: 'Advanced modulation techniques and strategies',
    duration: '12:00',
    content: 'Learn advanced modulation techniques that combine pitch, pace, and volume for maximum impact in your communication.',
    objectives: [
      'Master advanced modulation combinations',
      'Learn professional modulation techniques',
      'Develop personal modulation style',
      'Apply techniques in real scenarios'
    ],
    keyPoints: [
      'Combine multiple techniques for maximum impact',
      'Develop your unique modulation signature',
      'Advanced techniques require consistent practice',
      'Professional modulation enhances credibility'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/remember-to-smile'
  },
  'remember-to-smile': {
    title: 'Remember to Smile',
    description: 'The importance of smiling in voice modulation',
    duration: '6:00',
    content: 'Smiling while speaking can dramatically improve your voice modulation and make you sound more engaging and approachable.',
    objectives: [
      'Understand the connection between smiling and voice',
      'Learn how smiling affects vocal tone',
      'Practice speaking while smiling',
      'Develop natural smiling habits'
    ],
    keyPoints: [
      'Smiling brightens your vocal tone',
      'It makes you sound more approachable',
      'Smiling reduces vocal tension',
      'Practice smiling during conversations'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/modulation-practice-2'
  },
  'modulation-practice-2': {
    title: 'Practice',
    description: 'Advanced practice session for modulation techniques',
    duration: '10:00',
    content: 'This advanced practice session will help you master the modulation techniques you\'ve learned, including the importance of smiling.',
    objectives: [
      'Apply all learned modulation techniques',
      'Practice with smiling',
      'Record your practice session',
      'Review and assess your progress'
    ],
    keyPoints: [
      'Combine pitch, pace, and volume',
      'Remember to smile while speaking',
      'Practice in different scenarios',
      'Record for self-assessment'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/modulation-quiz'
  },
  'modulation-quiz': {
    title: 'Quiz',
    description: 'Test your knowledge of modulation techniques',
    duration: '5:00',
    content: 'This quiz will test your understanding of modulation concepts, techniques, and best practices.',
    objectives: [
      'Answer all questions to complete the quiz',
      'Review your understanding of modulation',
      'Get immediate feedback on your performance',
      'Track your progress and understanding'
    ],
    keyPoints: [
      'Modulation fundamentals',
      'Technique applications',
      'Best practices',
      'Practical implementation'
    ],
    isExternalPage: true,
    nextSession: '/learning-lessons/voice-modulation-techniques'
  }
};

// New dropdown structure component
interface DropdownItem {
  id: string;
  title: string;
  isExpanded?: boolean;
  children?: DropdownItem[];
}

const dropdownStructure: DropdownItem[] = [
  {
    id: 'vocal-tone',
    title: 'Vocal Tone »',
    children: [
      { id: 'what-is-vocal-tone', title: 'What is Vocal Tone?' },
      { id: 'overview', title: 'Overview' },
      { id: 'word-exercise', title: 'Word Exercise' },
      { id: 'who-is-siri', title: 'Who is Siri?' },
      { id: 'quiz', title: 'Quiz' }
    ]
  },
  {
    id: 'rate-of-speech',
    title: 'Rate of Speech',
    children: [
      { id: 'what-is-rate-of-speech', title: 'What is Rate of Speech?' },
      { id: 'practice-1', title: 'Practice' },
      { id: 'match-rate-of-speech', title: 'Match the Rate of Speech' },
      { id: 'try-to-match-rate', title: 'Try to Match Rate of Speech' },
      { id: 'learn-breathing', title: 'Learn Breathing' },
      { id: 'practice-2', title: 'Practice' },
      { id: 'learn-period-pause', title: 'Learn Period and Pause' },
      { id: 'practice-3', title: 'Practice' },
      { 
        id: 'question-answer', 
        title: 'Question Answer',
        children: [
      { id: 'what-is-pace-variation', title: 'What is Pace Variation?' },
      { id: 'practice-4', title: 'Practice' }
        ]
      }
    ]
  },
  {
    id: 'volume',
    title: 'Volume',
    children: [
      { id: 'what-is-volume', title: 'What is volume?' },
      { id: 'volume-practice-1', title: 'Practice' },
      { 
        id: 'learn-balloon-exercise', 
        title: 'Learn Balloon Exercise',
        children: [
          { id: 'balloon-practice', title: 'Practice' },
      { id: 'learn-mouth-exercise', title: 'Learn Mouth Exercise' },
      { id: 'learn-back-of-room', title: 'Learn Back of Room Exercise' },
          { id: 'balloon-practice-2', title: 'Practice' },
          { id: 'balloon-practice-3', title: 'Practice' }
        ]
      }
    ]
  },
  {
    id: 'pitch',
    title: 'Pitch',
    children: [
      { id: 'what-is-pitch', title: 'What is Pitch?' },
      { id: 'fun-facts', title: 'Fun Facts' },
      { id: 'pitch-video-examples', title: 'Pitch Video Examples' },
      { id: 'learn-bumble-bee', title: 'Learn Bumble Bee' },
      { id: 'practice-9', title: 'Practice' },
      { id: 'learn-yawn-exercise', title: 'Learn Yawn Exercise' },
      { id: 'practice-10', title: 'Practice' },
      { 
        id: 'what-is-modulation', 
        title: 'What is modulation?',
        children: [
          { id: 'modulation-practice-1', title: 'Practice' },
          { id: 'modulation', title: 'Modulation' },
          { id: 'remember-to-smile', title: 'Remember to smile' },
          { id: 'modulation-practice-2', title: 'Practice' },
          { id: 'modulation-quiz', title: 'Quiz' }
        ]
      }
    ]
  }
];

function DropdownStructure({ className, selectedDropdownItem, onItemSelect }: { 
  className?: string;
  selectedDropdownItem: DropdownItem | null;
  onItemSelect: (item: DropdownItem) => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: DropdownItem) => {
    if (item.children && item.children.length > 0) {
      // If it has children, toggle the dropdown
      toggleItem(item.id);
    } else {
      // If it's a leaf item, set it as selected to show content
      onItemSelect(item);
    }
  };

  const renderDropdownItem = (item: DropdownItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <div
          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 ${
            level > 0 ? 'ml-4' : ''
          }`}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <div className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-blue-600" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-blue-600" />
                )}
              </div>
            )}
            <span className={`text-sm font-medium ${hasChildren ? 'text-blue-900' : 'text-gray-700'}`}>
              {item.title}
            </span>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="border-l border-blue-200 ml-4">
            {item.children!.map((child) => renderDropdownItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={`bg-white border-0 shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Course Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div>
          {dropdownStructure.map((item) => renderDropdownItem(item))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VoiceModulationTechniques() {
  const router = useRouter();
  const [selectedSession, setSelectedSession] = useState<Session>(voiceModulationSessions[0]);
  const [selectedDropdownItem, setSelectedDropdownItem] = useState<DropdownItem | null>(null);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [isOverviewStarted, setIsOverviewStarted] = useState(false);
  const [selectedWordExerciseQuestion, setSelectedWordExerciseQuestion] = useState('friendship');
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [isSiriVideoStarted, setIsSiriVideoStarted] = useState(false);
  const [isSiriCompleted, setIsSiriCompleted] = useState(false);
  const [vocalToneQuizAnswers, setVocalToneQuizAnswers] = useState<Record<number, number>>({});
  const [currentVocalToneQuizQuestion, setCurrentVocalToneQuizQuestion] = useState(0);
  const [showVocalToneQuizResults, setShowVocalToneQuizResults] = useState(false);
  const [matchRateAnswers, setMatchRateAnswers] = useState<Record<number, number>>({});
  const [isMatchRateSubmitted, setIsMatchRateSubmitted] = useState(false);
  const [selectedDifficultyLevel, setSelectedDifficultyLevel] = useState('beginner');
  const [paceVariationAnswers, setPaceVariationAnswers] = useState<Record<number, string>>({});
  const [showPaceVariationAnswers, setShowPaceVariationAnswers] = useState<Record<number, boolean>>({});

  const completedSessions = voiceModulationSessions.filter(session => session.isCompleted).length;
  const totalSessions = voiceModulationSessions.length;
  const completionPercentage = (completedSessions / totalSessions) * 100;

  const handleBackToLessons = () => {
    router.push('/learning-lessons');
  };

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    setIsSessionStarted(false);
    setIsSessionCompleted(false);
  };

  const handleStartSession = () => {
    setIsSessionStarted(true);
  };

  const handleCompleteSession = () => {
    setIsSessionCompleted(true);
    // Update the session completion status
    const updatedSessions = voiceModulationSessions.map(session => 
      session.id === selectedSession.id 
        ? { ...session, isCompleted: true }
        : session
    );
  };



  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedVideo(file);
    }
  };

  const handleNextWordExercise = () => {
    // Navigate to next session (Who is Siri?)
    const whoIsSiriItem = dropdownStructure[0].children?.find(item => item.id === 'who-is-siri');
    if (whoIsSiriItem) {
      setSelectedDropdownItem(whoIsSiriItem);
      setSelectedWordExerciseQuestion('friendship');
      setUploadedVideo(null);
    }
  };

  const handleStartSiriVideo = () => {
    setIsSiriVideoStarted(true);
  };

  const handleCompleteSiri = () => {
    setIsSiriCompleted(true);
  };

  const handleNextSiriSession = () => {
    // Navigate to next session (Quiz)
    const quizItem = dropdownStructure[0].children?.find(item => item.id === 'quiz');
    if (quizItem) {
      setSelectedDropdownItem(quizItem);
      setIsSiriVideoStarted(false);
      setIsSiriCompleted(false);
    }
  };

  // Quiz questions based on the image
  const vocalToneQuizQuestions = [
    {
      id: 1,
      question: "What should be your average rate of speech?",
      options: [
        "161-180 words per minute",
        "100-129 words per minute", 
        "130-160 words per minute",
        "75-99 words per minute"
      ],
      correctAnswer: 2
    },
    {
      id: 2,
      question: "What is the female vocal frequency range?",
      options: [
        "50 to 500 hertz",
        "350 to 1,000 hertz",
        "250 to 5,000 hertz", 
        "350 to 17,000 hertz"
      ],
      correctAnswer: 3
    },
    {
      id: 3,
      question: "What is the male vocal frequency range?",
      options: [
        "100 to 8,000 hertz",
        "50 to 5,000 hertz",
        "200 to 15,000 hertz",
        "300 to 12,000 hertz"
      ],
      correctAnswer: 0
    },
    {
      id: 4,
      question: "What is audible decibel range?",
      options: [
        "0 to 60 decibels",
        "0 to 130 decibels",
        "10 to 100 decibels",
        "20 to 150 decibels"
      ],
      correctAnswer: 1
    },
    {
      id: 5,
      question: "You are able to tell the other person's emotions more accurately over the phone than in a face to face meeting.",
      options: ["True", "False"],
      correctAnswer: 1
    }
  ];

  const handleVocalToneQuizAnswer = (questionId: number, answerIndex: number) => {
    setVocalToneQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextVocalToneQuizQuestion = () => {
    if (currentVocalToneQuizQuestion < vocalToneQuizQuestions.length - 1) {
      setCurrentVocalToneQuizQuestion(currentVocalToneQuizQuestion + 1);
    } else {
      setShowVocalToneQuizResults(true);
    }
  };

  const handleSubmitVocalToneQuiz = () => {
    setShowVocalToneQuizResults(true);
  };

  const resetVocalToneQuiz = () => {
    setCurrentVocalToneQuizQuestion(0);
    setVocalToneQuizAnswers({});
    setShowVocalToneQuizResults(false);
  };

  const handleMatchRateAnswer = (sampleId: number, answerIndex: number) => {
    setMatchRateAnswers(prev => ({
      ...prev,
      [sampleId]: answerIndex
    }));
  };

  const handleSubmitMatchRate = () => {
    setIsMatchRateSubmitted(true);
  };

  const resetMatchRate = () => {
    setMatchRateAnswers({});
    setIsMatchRateSubmitted(false);
  };

  const handleDifficultyLevelChange = (level: string) => {
    setSelectedDifficultyLevel(level);
  };

  const content = voiceModulationContent[selectedSession.id as keyof typeof voiceModulationContent];
  
  // Function to get dropdown item content
  const getDropdownItemContent = (item: DropdownItem) => {
    const contentMap: Record<string, any> = {
      'what-is-vocal-tone': {
        title: 'What is Vocal Tone?',
        description: 'Understanding the fundamental concept of vocal tone and its importance in communication',
        duration: '5:00',
        content: 'Vocal tone is the emotional quality and character of your voice that goes beyond the words you speak. It\'s how you sound when you speak - the warmth, enthusiasm, authority, or concern that your voice conveys.',
        objectives: [
          'Understand what vocal tone is and why it matters',
          'Learn how vocal tone affects communication',
          'Identify different types of vocal tones',
          'Recognize the impact of tone on audience perception'
        ],
        keyPoints: [
          'Vocal tone conveys emotion and attitude',
          'It can make or break your message',
          'Different tones work for different situations',
          'Practice helps develop tone awareness'
        ],
        nextSession: '/learning-lessons/voice-modulation-techniques/vocal-tone/overview'
      },
      'overview': {
        title: 'Vocal Tone Overview',
        description: 'A comprehensive overview of vocal tone concepts and their applications',
        duration: '8:00',
        content: 'This overview covers the essential aspects of vocal tone, including its definition, importance, and practical applications in various communication scenarios.',
        objectives: [
          'Core concepts of vocal tone',
          'Different types of vocal tones',
          'When to use different tones',
          'Common mistakes to avoid',
          'Practical applications'
        ],
        keyPoints: [
          'Vocal tone is more than just pitch',
          'Context determines appropriate tone',
          'Practice improves tone control',
          'Awareness is the first step'
        ],
        hasVideo: true,
        videoSrc: '/AppVideo/VocalTone/Lesson%201-1%20Vocal%20Tone%20Overview%20(App).mp4',
        nextSession: '/learning-lessons/voice-modulation-techniques/vocal-tone/word-exercise'
      },
      'word-exercise': {
        title: 'Word Exercise',
        description: 'Practice vocal tone variations with different words and phrases',
        duration: '10:00',
        content: 'This exercise will help you practice different vocal tones by repeating words and phrases with various emotional qualities and emphasis.',
        objectives: [
          'Listen to the example pronunciation',
          'Repeat each word with the specified tone',
          'Practice until you feel comfortable',
          'Record yourself for self-assessment',
          'Compare your pronunciation with the example'
        ],
        keyPoints: [
          '"Hello" - Warm and friendly',
          '"Important" - Serious and authoritative',
          '"Exciting" - Enthusiastic and energetic',
          '"Calm" - Peaceful and soothing',
          '"Urgent" - Quick and concerned'
        ],
        nextSession: '/learning-lessons/voice-modulation-techniques/vocal-tone/who-is-siri',
        isExternalPage: true
      },
      'who-is-siri': {
        title: 'Who is Siri?',
        description: 'Understanding voice assistants and their impact on vocal communication',
        duration: '7:00',
        content: 'Siri is Apple\'s virtual assistant that uses voice recognition and natural language processing to help users interact with their devices. Understanding how Siri works can teach us valuable lessons about voice communication and tone.',
        objectives: [
          'How voice assistants process speech',
          'The importance of clear pronunciation',
          'Tone variations in digital communication',
          'Voice recognition technology basics',
          'Improving voice clarity for better recognition'
        ],
        keyPoints: [
          'Speaking clearly for voice assistants',
          'Adapting tone for different technologies',
          'Understanding voice recognition limitations',
          'Improving overall voice clarity'
        ],
        nextSession: '/learning-lessons/voice-modulation-techniques/vocal-tone/quiz',
        isExternalPage: true
      },
      'quiz': {
        title: 'Vocal Tone Quiz',
        description: 'Test your knowledge of vocal tone concepts and techniques',
        duration: '5:00',
        content: 'This quiz will test your understanding of vocal tone concepts, including definitions, practical applications, and best practices for effective communication.',
        objectives: [
          'Answer all questions to complete the quiz',
          'You can review your answers before submitting',
          'Get immediate feedback on your performance',
          'Track your progress and understanding',
          'Retake the quiz to improve your score'
        ],
        keyPoints: [
          'Vocal tone fundamentals',
          'Tone variations and their effects',
          'Practical applications',
          'Communication best practices',
          'Voice assistant interactions'
        ],
        nextSession: '/learning-lessons/voice-modulation-techniques'
      },
      'what-is-rate-of-speech': {
        title: 'What is Rate of Speech?',
        description: 'Understanding the fundamental concept of rate of speech and its importance in communication',
        duration: '5:00',
        content: 'Rate of speech refers to how fast or slow you speak when communicating. It\'s the speed at which you deliver your words and can significantly impact how your message is received.',
        objectives: [],
        keyPoints: [],
        hasVideo: true,
        videoSrc: '/AppVideo/RateOfSpeech/Lesson%201-1%20Rate%20of%20Speech%20Overview%20(App).mp4',
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/practice-1'
      },
      'practice-1': {
        title: 'Recording Exercise 1',
        description: 'Practice recording yourself with a specific script',
        duration: '10:00',
        content: 'Record yourself saying the script below. You can upload a video from your computer or mobile.',
        objectives: [
          'Record yourself saying the provided script',
          'Focus on maintaining a consistent rate of speech',
          'Upload your video for review',
          'Practice clear pronunciation and enunciation'
        ],
        keyPoints: [
          'Mount Everest is the highest mountain in the world at 29,035 feet',
          'It grows 4mm higher every year due to geologic uplift',
          'Over 4,000 people have attempted to climb it',
          'The youngest person to reach the summit was 13',
          'The oldest was 80'
        ],
        script: 'Mount Everest is the highest mountain in the world at 29,035 feet. It grows 4mm higher every year due to geologic uplift. Over 4,000 people have attempted to climb it. The youngest person to reach the summit was 13. The oldest was 80.',
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/match-rate-of-speech'
      },
      'match-rate-of-speech': {
        title: 'Try to Match Rate of Speech',
        description: 'Listen to audio samples and match the rate of speech',
        duration: '15:00',
        content: 'Listen to the audio samples and try to match the exact rate of speech. This exercise will help you develop better control over your speaking pace.',
        objectives: [
          'Listen to audio samples carefully',
          'Identify the rate of speech for each sample',
          'Practice matching the exact speed and timing',
          'Improve your speech rate control'
        ],
        keyPoints: [
          'Pay attention to rhythm and pacing',
          'Practice the same text multiple times',
          'Focus on matching the exact speed',
          'Use audio samples as reference'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/try-to-match-rate',
        audioSamples: [
          { id: 1, duration: '0:14', title: 'Sample 1' },
          { id: 2, duration: '0:10', title: 'Sample 2' },
          { id: 3, duration: '0:17', title: 'Sample 3' },
          { id: 4, duration: '0:09', title: 'Sample 4' }
        ],
        rateOptions: [
          '100 or less words per minute',
          '101-129 words per minute',
          '130-160 words per minute',
          '160 words or more per minute'
        ]
      },
      'try-to-match-rate': {
        title: 'Try to Match Rate of Speech',
        description: 'Advanced practice session to master rate matching with varying complexity levels',
        duration: '20:00',
        content: 'This exercise will challenge you with more complex speech patterns and varying rates. Choose your difficulty level and practice matching the exact timing and rhythm.',
        objectives: [
          'Master advanced rate matching techniques',
          'Practice with varying complexity levels',
          'Improve timing and rhythm control',
          'Develop precise speech rate matching'
        ],
        keyPoints: [
          'Focus on rhythm and timing patterns',
          'Pay attention to natural pauses and breaks',
          'Practice with a metronome for precise timing',
          'Record multiple attempts and compare'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/learn-breathing',
        difficultyLevels: [
          { id: 'beginner', title: 'Beginner Level', description: 'Simple sentences with consistent pacing.' },
          { id: 'intermediate', title: 'Intermediate Level', description: 'Complex sentences with varying pace.' },
          { id: 'advanced', title: 'Advanced Level', description: 'Dynamic speech with rapid pace changes.' }
        ],
        practiceText: 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. Practice speaking this sentence at different rates while maintaining clarity and proper pronunciation.'
      },
      'learn-breathing': {
        title: 'Breathing exercise',
        description: 'Master breathing techniques to control your rate of speech and improve vocal delivery',
        duration: '12:00',
        content: 'Proper breathing is fundamental to controlling your rate of speech. Learn diaphragmatic breathing, breath support, and how to use breathing to pace your speech effectively.',
        objectives: [
          'Learn diaphragmatic breathing techniques',
          'Master breath support for speech',
          'Understand pacing with breath',
          'Practice breathing exercises'
        ],
        keyPoints: [
          'Diaphragmatic breathing provides better breath support',
          'Breath support helps control speaking pace',
          'Natural breathing patterns create pauses',
          'Proper breathing reduces anxiety and improves clarity'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/practice-2',
        hasVideo: true,
        videoSrc: '/AppVideo/Breathing/Breathing%20Exercise%20Video.mp4',
        hasAudio: true,
        audioSrc: '/AppAudio/Breathing/Breathing%20Instructions.mp3',
        audioDuration: '0:21'
      },
      'practice-2': {
        title: 'Recording Exercise 2',
        description: 'Practice recording yourself with a specific script',
        duration: '10:00',
        content: 'Now, let us try it again. Record yourself saying the script below. You can upload a video from your computer or mobile.',
        objectives: [
          'Record yourself saying the provided script',
          'Focus on maintaining a consistent rate of speech',
          'Upload your video for review',
          'Practice clear pronunciation and enunciation'
        ],
        keyPoints: [
          'Mount Everest is the highest mountain in the world at 29,035 feet',
          'It grows 4mm higher every year due to geologic uplift',
          'Over 4,000 people have attempted to climb it',
          'The youngest person to reach the summit was 13',
          'The oldest was 80'
        ],
        script: 'Mount Everest is the highest mountain in the world at 29,035 feet. It grows 4mm higher every year due to geologic uplift. Over 4,000 people have attempted to climb it. The youngest person to reach the summit was 13. The oldest was 80.',
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/learn-period-pause'
      },
      'learn-period-pause': {
        title: 'Learn Period and Pause',
        description: 'Master the art of using pauses and periods to control your speech rate and improve clarity',
        duration: '10:00',
        content: 'Learn how strategic pauses and proper use of periods can dramatically improve your speech rate control, clarity, and audience engagement.',
        objectives: [
          'Understand the importance of strategic pauses',
          'Learn proper period placement techniques',
          'Master different pause durations',
          'Practice pause timing for maximum impact'
        ],
        keyPoints: [
          'Strategic pauses emphasize important points',
          'Period placement creates natural breaks',
          'Pause duration affects audience processing',
          'Proper pausing improves speech clarity'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/practice-3',
        hasVideo: true,
        videoSrc: '/AppVideo/PeriodPause/Period%20and%20Pause%20Video.mp4'
      },
      'practice-3': {
        title: 'Recording Exercise 3',
        description: 'Practice recording yourself with a specific script using periods and pauses',
        duration: '12:00',
        content: 'Now, let us try it again. Record yourself saying the script below. You can upload a video from your computer or mobile.',
        objectives: [
          'Record yourself saying the provided script with proper pauses',
          'Focus on using periods and pauses effectively',
          'Upload your video for review',
          'Practice clear pronunciation and enunciation with strategic pauses'
        ],
        keyPoints: [
          'Mount Everest is the highest mountain in the world at 29,035 feet. (Period, Pause)',
          'It grows 4mm higher every year due to geologic uplift. (Period, Pause)',
          'Over 4,000 people have attempted to climb it. (Period, Pause)',
          'The youngest person to reach the summit was 13. (Period, Pause)',
          'The oldest was 80. (Period, Pause)'
        ],
        script: 'Mount Everest is the highest mountain in the world at 29,035 feet. (Period, Pause) It grows 4mm higher every year due to geologic uplift. (Period, Pause) Over 4,000 people have attempted to climb it. (Period, Pause) The youngest person to reach the summit was 13. (Period, Pause) The oldest was 80. (Period, Pause)',
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/question-answer'
      },
      'what-is-pace-variation': {
        title: 'What is Pace Variation?',
        description: 'Learn about pace variation and its importance in effective communication',
        duration: '8:00',
        content: 'Pace variation is the strategic use of different speaking speeds to create interest, emphasize points, and maintain audience engagement throughout your presentation.',
        objectives: [
          'Understand what vocal variation means',
          'Learn why variation is important',
          'Practice pace variation techniques',
          'Apply pace variation in communication'
        ],
        keyPoints: [
          'Vocal variation means speaking at different rates of speech',
          'Slower rate emphasizes certain words',
          'Faster rate creates exhilaration and joy',
          'Variation keeps listeners engaged',
          'Variation creates emotional journey'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/rate-of-speech/practice-4',
        questions: [
          {
            id: 1,
            question: 'What does vocal variation mean?',
            answer: 'It means speaking at different rates of speech. For example, when you speak at a slower rate, you emphasize on certain words. When you speak at a fast rate, the tempo creates a feeling of exhilaration and joy.'
          },
          {
            id: 2,
            question: 'Why is it important to have variation?',
            answer: 'It keeps the listener engaged, creates a story, and takes you through an emotional journey of anticipation and excitement.'
          }
        ]
      },
      'practice-4': {
        title: 'Recording Exercise 4',
        description: 'Practice recording yourself with pace variation techniques',
        duration: '15:00',
        content: 'Now, let us practice. Record yourself saying the script below and vary your rate of speech as you read it. You can upload a video from your computer or mobile.',
        objectives: [
          'Record yourself saying the provided script with pace variation',
          'Focus on varying your rate of speech effectively',
          'Upload your video for review',
          'Practice clear pronunciation and enunciation with pace variation'
        ],
        keyPoints: [
          'Roger Federer is a Swiss tennis player who has dominated the sport since early 21st century',
          'He is known to be an all-rounder and has won 20 single men\'s Grand Slam Championships',
          'This is the maximum number in the history of tennis',
          'At the age of 17, he won his first Wimbledon junior singles championship'
        ],
        script: 'Roger Federer is a Swiss tennis player who has dominated the sport since early 21st century. He is known to be an all-rounder and has won 20 single men\'s Grand Slam Championships, which is the maximum number in the history of tennis. At the age of 17, he won his first Wimbledon junior singles championship.',
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume'
      },
      'what-is-volume': {
        title: 'What is Volume?',
        description: 'Learn about volume and its importance in effective communication',
        duration: '8:00',
        content: 'Volume is the loudness or softness of your voice. Understanding how to control and vary your volume is essential for effective communication and audience engagement.',
        objectives: [
          'Understand what volume is and why it matters',
          'Learn how to control your volume effectively',
          'Practice volume variation techniques',
          'Apply volume control in different situations'
        ],
        keyPoints: [
          'Volume affects audience engagement and comprehension',
          'Proper volume control shows confidence and authority',
          'Volume variation creates interest and emphasis',
          'Context determines appropriate volume levels'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume/volume-practice-1',
        hasVideo: true,
        videoSrc: '/AppVideo/Volume/Lesson%203-1%20Vocal%20Volume%20(App).mp4'
      },
      'volume-practice-1': {
        title: 'Practice Exercise 1',
        description: 'Practice recording yourself with volume control techniques',
        duration: '12:00',
        content: 'Now, let us practice. Record yourself saying the script below. You can upload a video from your computer or mobile.',
        objectives: [
          'Record yourself saying the provided script',
          'Focus on volume control and projection',
          'Upload your video for review',
          'Practice clear pronunciation and enunciation'
        ],
        keyPoints: [
          'Dolphins stick to their mothers for 3 to 8 years',
          'They are extremely intelligent animals rated only second to humans',
          'The average lifespan is 17 years but can live up to 50 years',
          'Dolphins have two stomachs, one for food and the other for digestion'
        ],
        script: 'Dolphins stick to their mothers for 3 to 8 years. They are extremely intelligent animals rated only second to humans. The average lifespan is 17 years but can live up to 50 years. Dolphins have two stomachs, one for food and the other for digestion.',
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume/learn-balloon-exercise'
      },
      'learn-balloon-exercise': {
        title: 'Learn Balloon Exercise',
        description: 'Learn the balloon exercise technique for volume control',
        duration: '10:00',
        content: 'The balloon exercise is a simple yet effective technique for improving your volume control and voice projection. This exercise helps you understand how to use your diaphragm and control your breath for better vocal delivery.',
        objectives: [
          'Learn the balloon exercise technique',
          'Understand how to control your breath for volume',
          'Practice voice projection without straining',
          'Develop better vocal control'
        ],
        keyPoints: [
          'The balloon exercise helps with breath control',
          'It improves voice projection and volume',
          'It teaches proper diaphragm usage',
          'It reduces vocal strain and fatigue'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume/balloon-practice',
        hasVideo: true,
        videoSrc: '/AppVideo/Volume/Balloon%20Exercise%20Video.mp4'
      },
      'balloon-practice': {
        title: 'Balloon Exercise Practice',
        description: 'Practice the balloon exercise technique',
        duration: '8:00',
        content: 'Now practice the balloon exercise technique you just learned. Follow the instructions and record your practice session.',
        objectives: [
          'Practice the balloon exercise technique',
          'Record your practice session',
          'Focus on breath control and volume',
          'Apply the learned techniques'
        ],
        keyPoints: [
          'Practice makes perfect',
          'Focus on breath control',
          'Maintain consistent volume',
          'Record for self-assessment'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume/learn-mouth-exercise'
      },
      'learn-mouth-exercise': {
        title: 'Learn Mouth Exercise',
        description: 'Learn mouth exercises for better articulation',
        duration: '12:00',
        content: 'Mouth exercises help improve articulation and clarity in speech. These exercises strengthen the muscles used in speaking and help with pronunciation.',
        objectives: [
          'Learn mouth exercise techniques',
          'Improve articulation and clarity',
          'Strengthen speaking muscles',
          'Practice pronunciation exercises'
        ],
        keyPoints: [
          'Mouth exercises improve articulation',
          'They strengthen speaking muscles',
          'They help with pronunciation',
          'Regular practice is essential'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume/learn-back-of-room'
      },
      'learn-back-of-room': {
        title: 'Learn Back of Room Exercise',
        description: 'Learn exercises for projecting your voice to the back of the room',
        duration: '10:00',
        content: 'The back of room exercise helps you learn to project your voice effectively so that everyone in the room can hear you clearly.',
        objectives: [
          'Learn voice projection techniques',
          'Practice speaking to the back of the room',
          'Improve voice clarity and volume',
          'Develop confidence in speaking'
        ],
        keyPoints: [
          'Voice projection is essential for public speaking',
          'Practice speaking to different distances',
          'Focus on clarity and volume',
          'Build confidence through practice'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume/balloon-practice-2'
      },
      'balloon-practice-2': {
        title: 'Advanced Balloon Practice',
        description: 'Advanced practice of the balloon exercise technique',
        duration: '15:00',
        content: 'Now practice the balloon exercise with more advanced techniques and variations.',
        objectives: [
          'Practice advanced balloon techniques',
          'Combine with other exercises',
          'Record and assess progress',
          'Build confidence in voice control'
        ],
        keyPoints: [
          'Advanced techniques build on basics',
          'Combination exercises are effective',
          'Regular practice improves results',
          'Self-assessment is important'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume/balloon-practice-3'
      },
      'balloon-practice-3': {
        title: 'Final Balloon Practice',
        description: 'Final practice session for the balloon exercise',
        duration: '12:00',
        content: 'This is your final practice session for the balloon exercise. Apply all the techniques you have learned.',
        objectives: [
          'Apply all learned techniques',
          'Demonstrate mastery of the exercise',
          'Record final practice session',
          'Assess overall progress'
        ],
        keyPoints: [
          'Final practice consolidates learning',
          'Demonstrate mastery of techniques',
          'Record for future reference',
          'Celebrate progress made'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/volume'
      },
      'what-is-pitch': {
        title: 'What is Pitch?',
        description: 'Understanding the fundamentals of pitch in voice modulation',
        duration: '8:00',
        content: 'Pitch is one of the fundamental elements of voice modulation. It refers to how high or low your voice sounds when you speak. Understanding and controlling pitch is essential for effective communication and creating engaging presentations.',
        objectives: [
          'Understand what pitch is in voice modulation',
          'Learn how pitch affects communication',
          'Recognize different pitch variations',
          'Practice pitch control techniques'
        ],
        keyPoints: [
          'Pitch is the highness or lowness of your voice',
          'Varying pitch creates interest and engagement',
          'Different pitches convey different emotions',
          'Pitch control is essential for effective communication'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/fun-facts',
        hasVideo: true,
        videoSrc: '/AppVideo/Pitch/What%20is%20Pitch%20Video.mp4'
      },
      'fun-facts': {
        title: 'Fun Facts',
        description: 'About Vocal Pitch',
        duration: '5:00',
        content: 'Discover interesting facts about vocal pitch and how it relates to your voice range and communication.',
        objectives: [
          'Learn about vocal range and its importance',
          'Understand male and female vocal pitch categories',
          'Recognize different vocal types and their frequency ranges',
          'Appreciate the science behind vocal pitch'
        ],
        keyPoints: [
          'Your vocal range is the lowest note you can sing to the highest note you can sing',
          'Most male vocal pitch ranges are categorized into 3 types: Bass (87 to 330 hertz), Baritone (87 to 349 hertz), Tenor (130 to 523 hertz)',
          'Most female vocal pitch ranges are categorized into 3 types: Alto (175 to 698 hertz), Mezzo-Soprano (110 to 880 hertz), Soprano (262 to 1047 hertz)'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/pitch-video-examples'
      },
      'pitch-video-examples': {
        title: 'Pitch Video Examples',
        description: 'Watch some interesting YouTube videos on vocal pitch',
        duration: '15:00',
        content: 'This section showcases three YouTube videos that demonstrate different aspects of vocal pitch and how it affects communication.',
        objectives: [
          'Watch videos on vocal pitch examples',
          'Learn from real-world pitch variations',
          'Understand how pitch affects communication',
          'Observe different pitch techniques in action'
        ],
        keyPoints: [
          'Margaret Thatcher - Iron Lady\'s speech patterns',
          'Top 10 Male Actors with Iconic Voices',
          'Top 10 Actresses with Unique Voices',
          'Different pitch variations and their impact'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/learn-bumble-bee'
      },
      'learn-bumble-bee': {
        title: 'Learn Bumble Bee Exercise',
        description: 'Master the bumble bee exercise for pitch control and vocal resonance',
        duration: '10:00',
        content: 'The bumble bee exercise is a powerful technique for improving pitch control and vocal resonance. This exercise helps you develop better control over your vocal cords and create a more resonant, engaging voice.',
        objectives: [
          'Learn the bumble bee exercise technique',
          'Understand how it improves pitch control',
          'Practice vocal resonance techniques',
          'Develop better vocal cord control'
        ],
        keyPoints: [
          'The bumble bee exercise improves vocal resonance',
          'It helps control pitch variations',
          'It strengthens vocal cord muscles',
          'Regular practice enhances voice quality'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/practice-9',
        hasVideo: true,
        videoSrc: '/AppVideo/Pitch/Bumble%20Bee%20Exercise%20Video.mp4'
      },
      'practice-9': {
        title: 'Bumble Bee Exercise Practice',
        description: 'Practice the bumble bee exercise for pitch control and vocal resonance',
        duration: '10:00',
        content: 'The bumble bee exercise is a powerful technique for improving pitch control and vocal resonance. This exercise helps you develop better control over your vocal cords and create a more resonant, engaging voice.',
        objectives: [
          'Practice the bumble bee exercise technique',
          'Understand how it improves pitch control',
          'Develop better vocal resonance techniques',
          'Practice vocal resonance in different scenarios'
        ],
        keyPoints: [
          'The bumble bee exercise improves vocal resonance',
          'It helps control pitch variations',
          'It strengthens vocal cord muscles',
          'Regular practice enhances voice quality'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/practice-10',
        hasVideo: true,
        videoSrc: '/AppVideo/Pitch/Bumble%20Bee%20Exercise%20Video.mp4'
      },
      'learn-yawn-exercise': {
        title: 'Learn Yawn Exercise',
        description: 'Master the yawn exercise for pitch control and vocal resonance',
        duration: '8:00',
        content: 'The yawn exercise is a simple yet effective technique for improving pitch control and vocal resonance. This exercise helps you develop better control over your vocal cords and create a more resonant, engaging voice.',
        objectives: [
          'Learn the yawn exercise technique',
          'Understand how it improves pitch control',
          'Practice vocal resonance techniques',
          'Develop better vocal cord control'
        ],
        keyPoints: [
          'The yawn exercise improves vocal resonance',
          'It helps control pitch variations',
          'It strengthens vocal cord muscles',
          'Regular practice enhances voice quality'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch',
        hasVideo: true,
        videoSrc: '/AppVideo/Pitch/Yawn%20Exercise%20Video.mp4'
      },
      'practice-10': {
        title: 'Practice Exercise',
        description: 'Practice recording yourself with the Morgan Freeman script',
        duration: '10:00',
        content: 'Now, let us practice. Record yourself saying the script below. You can upload a video from your computer or mobile.',
        objectives: [
          'Record yourself saying the provided script',
          'Focus on pitch control and variation',
          'Upload your video for review',
          'Practice clear pronunciation and enunciation'
        ],
        keyPoints: [
          'Morgan Freeman has been universally voted one of the best voices of all time',
          'He has used his voice to play God, the President, national commercials',
          'He has been used for presidential campaigns for Barack Obama and Hillary Clinton',
          'He had a voice and diction instructor while studying acting at LA City College'
        ],
        script: 'Morgan Freeman has been universally voted one of the best voices of all time. He has used his voice to play God, the President, national commercials and even for presidential campaigns for Barack Obama and Hillary Clinton. How did he get such as powerful voice like that? He had a voice and diction instructor while studying acting at LA City College.',
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation'
      },
      'what-is-modulation': {
        title: 'What is Modulation?',
        description: 'Learn about modulation and its importance in effective communication',
        duration: '10:00',
        content: 'Modulation is the strategic use of voice pitch, pace, and volume to create interest, emphasize points, and maintain audience engagement throughout your presentation.',
        objectives: [
          'Understand what modulation is and why it matters',
          'Learn different modulation techniques',
          'Practice modulation in different scenarios',
          'Develop a personal modulation style'
        ],
        keyPoints: [
          'Modulation adds depth and emotion to your voice',
          'It helps convey different emotions and tones',
          'Different modulation techniques work for different situations',
          'Practice helps develop modulation skills'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/modulation-practice-1'
      },
      'modulation-practice-1': {
        title: 'Practice',
        description: 'Practice modulation techniques with video guidance',
        duration: '8:00',
        content: 'This practice session will help you apply the modulation techniques you\'ve learned. Watch the video and then practice the exercises.',
        objectives: [
          'Watch the practice video',
          'Apply modulation techniques',
          'Record your practice session',
          'Review and improve your performance'
        ],
        keyPoints: [
          'Focus on pitch variation',
          'Practice pace control',
          'Work on volume modulation',
          'Combine techniques for maximum impact'
        ],
        hasVideo: true,
        videoSrc: '/AppVideo/Modulation/Modulation%20Practice%20Video.mp4',
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/modulation'
      },
      'modulation': {
        title: 'Modulation',
        description: 'Advanced modulation techniques and strategies',
        duration: '12:00',
        content: 'Learn advanced modulation techniques that combine pitch, pace, and volume for maximum impact in your communication.',
        objectives: [
          'Master advanced modulation combinations',
          'Learn professional modulation techniques',
          'Develop personal modulation style',
          'Apply techniques in real scenarios'
        ],
        keyPoints: [
          'Combine multiple techniques for maximum impact',
          'Develop your unique modulation signature',
          'Advanced techniques require consistent practice',
          'Professional modulation enhances credibility'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/remember-to-smile'
      },
      'remember-to-smile': {
        title: 'Remember to Smile',
        description: 'The importance of smiling in voice modulation',
        duration: '6:00',
        content: 'Smiling while speaking can dramatically improve your voice modulation and make you sound more engaging and approachable.',
        objectives: [
          'Understand the connection between smiling and voice',
          'Learn how smiling affects vocal tone',
          'Practice speaking while smiling',
          'Develop natural smiling habits'
        ],
        keyPoints: [
          'Smiling brightens your vocal tone',
          'It makes you sound more approachable',
          'Smiling reduces vocal tension',
          'Practice smiling during conversations'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/modulation-practice-2'
      },
      'modulation-practice-2': {
        title: 'Practice',
        description: 'Advanced practice session for modulation techniques',
        duration: '10:00',
        content: 'This advanced practice session will help you master the modulation techniques you\'ve learned, including the importance of smiling.',
        objectives: [
          'Apply all learned modulation techniques',
          'Practice with smiling',
          'Record your practice session',
          'Review and assess your progress'
        ],
        keyPoints: [
          'Combine pitch, pace, and volume',
          'Remember to smile while speaking',
          'Practice in different scenarios',
          'Record for self-assessment'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques/pitch/what-is-modulation/modulation-quiz'
      },
      'modulation-quiz': {
        title: 'Quiz',
        description: 'Test your knowledge of modulation techniques',
        duration: '5:00',
        content: 'This quiz will test your understanding of modulation concepts, techniques, and best practices.',
        objectives: [
          'Answer all questions to complete the quiz',
          'Review your understanding of modulation',
          'Get immediate feedback on your performance',
          'Track your progress and understanding'
        ],
        keyPoints: [
          'Modulation fundamentals',
          'Technique applications',
          'Best practices',
          'Practical implementation'
        ],
        isExternalPage: true,
        nextSession: '/learning-lessons/voice-modulation-techniques'
      }
    };
    
    return contentMap[item.id] || null;
  };

  const dropdownContent = selectedDropdownItem ? getDropdownItemContent(selectedDropdownItem) : null;
  
  if (!content && !dropdownContent) return null;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToLessons}
            className="text-gray-600 hover:text-gray-900 p-0 h-auto font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>
        </div>

        {/* Course Overview Card */}
        <Card className="mb-6 bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {/* Course Icon */}
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                
                {/* Course Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      COURSE
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Intermediate
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-600">4.9</span>
                    </div>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Voice Modulation Techniques
                  </h1>
                  
                  <p className="text-gray-600 mb-4">
                    Discover how to vary your pitch, pace, and volume for maximum impact
                  </p>
                  
                  {/* Course Metrics */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>65 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{totalSessions} Sessions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>{completedSessions}/{totalSessions} Completed</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Completion Status */}
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {completionPercentage}%
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Left Sidebar - Course Structure */}
          <div className="lg:col-span-1">
            <DropdownStructure 
              selectedDropdownItem={selectedDropdownItem}
              onItemSelect={setSelectedDropdownItem}
            />
          </div>

          {/* Right Main Content - Session Details */}
          <div className="lg:col-span-5">
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="p-6">
                  {/* Session Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      {selectedDropdownItem ? (
                        <FileText className="w-5 h-5 text-blue-600" />
                      ) : selectedSession.type === 'video' ? (
                        <Video className="w-5 h-5 text-blue-600" />
                      ) : selectedSession.type === 'quiz' ? (
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedDropdownItem ? dropdownContent?.title : content.title}
                      </h2>
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedDropdownItem ? dropdownContent?.duration : selectedSession.duration}
                    </div>
                  </div>

                  {/* Session Status Section */}
                  {selectedDropdownItem?.id !== 'what-is-vocal-tone' && selectedDropdownItem?.id !== 'what-is-rate-of-speech' && !dropdownContent?.isExternalPage && selectedDropdownItem?.id !== 'quiz' && (
                    <div className="text-center mb-8">
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {selectedDropdownItem ? dropdownContent?.duration : selectedSession.duration}
                      </div>
                      <div className="text-sm text-gray-500 mb-6">
                        {isSessionStarted ? 'Session in progress...' : 'Ready to start'}
                      </div>
                      
                                             <div className="flex items-center justify-center space-x-4">
                         <Button
                           onClick={selectedDropdownItem?.id === 'overview' ? () => setIsOverviewStarted(true) : handleStartSession}
                           className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                           disabled={selectedDropdownItem?.id === 'overview' ? isOverviewStarted : isSessionStarted}
                         >
                           <Play className="w-4 h-4 mr-2" />
                           Start {selectedDropdownItem ? 'Lesson' : 'Session'}
                         </Button>
                         
                         <Button
                           onClick={handleCompleteSession}
                           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                           disabled={!isSessionStarted || isSessionCompleted}
                         >
                           <CheckCircle className="w-4 h-4 mr-2" />
                           Complete {selectedDropdownItem ? 'Lesson' : 'Session'}
                         </Button>
                       </div>
                    </div>
                  )}

                  {/* Session Description */}
                  {!dropdownContent?.isExternalPage && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        {selectedDropdownItem ? dropdownContent?.description : content.description}
                      </h3>
                    </div>
                  )}

                  {/* Video Section for Rate of Speech */}
                  {selectedDropdownItem?.id === 'what-is-rate-of-speech' && (
                    <div className="mb-6">
                      <VideoPlayer 
                        title="Rate of Speech"
                        subtitle="Video Lesson"
                        description="Click to play the rate of speech video lesson"
                      />
                    </div>
                  )}

                  {/* Content Display */}
                  {selectedDropdownItem?.id !== 'what-is-vocal-tone' && selectedDropdownItem?.id !== 'what-is-rate-of-speech' && (
                    <>
                      {selectedDropdownItem ? (
                        selectedDropdownItem.id === 'overview' ? (
                          isOverviewStarted ? (
                            <div className="mb-6">
                              <VideoPlayer 
                                title="Overview Video on"
                                subtitle="Vocal Tone"
                                description="Click to play the vocal tone overview video"
                              />
                            </div>
                          ) : null
                        ) : dropdownContent?.isExternalPage ? (
                          selectedDropdownItem?.id === 'word-exercise' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Practice Exercise</h3>
                                
                                {/* Instructions */}
                                <p className="mb-4 text-gray-700">Pick one of the two questions below.</p>

                                {/* Questions */}
                                <div className="space-y-4 mb-6">
                                  <label className="flex items-start space-x-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="question"
                                      value="friendship"
                                      checked={selectedWordExerciseQuestion === 'friendship'}
                                      onChange={() => setSelectedWordExerciseQuestion('friendship')}
                                      className="mt-1 h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-gray-900">What does friendship mean to you?</span>
                                  </label>
                                  <label className="flex items-start space-x-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="question"
                                      value="dream-job"
                                      checked={selectedWordExerciseQuestion === 'dream-job'}
                                      onChange={() => setSelectedWordExerciseQuestion('dream-job')}
                                      className="mt-1 h-4 w-4 text-blue-600"
                                    />
                                    <span className="text-gray-900">Describe your dream job.</span>
                                  </label>
                                </div>

                                {/* Instructions */}
                                <p className="mb-6 text-gray-700">
                                  Record and upload your answer to the above question. You can upload a video from your computer or mobile.
                                </p>

                                {/* Upload Box */}
                                <VideoUpload 
                                    id="video-upload"
                                  title="Upload Video"
                                  uploadedFile={uploadedVideo}
                                  onFileChange={handleVideoUpload}
                                />

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      const overviewItem = dropdownStructure[0].children?.find(item => item.id === 'overview');
                                      if (overviewItem) {
                                        setSelectedDropdownItem(overviewItem);
                                        setSelectedWordExerciseQuestion('friendship');
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Previous Session
                                  </button>
                                  <button
                                    onClick={handleNextWordExercise}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Next Session
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'pitch-video-examples' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  YouTube Videos
                                </h1>
                                
                                {/* Subtitle */}
                                <p className="text-gray-500 mb-6">
                                  Watch some interesting YouTube videos on vocal pitch.
                                </p>

                                {/* Video Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                  {/* Video 1 */}
                                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                    <div className="relative aspect-video bg-gray-100">
                                      <iframe
                                        src="https://www.youtube.com/embed/mwzCvuj8XXA?start=1"
                                        title="WSJ Highlights From the Iron Lady's Speeches"
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                    <div className="p-4">
                                      <h3 className="font-semibold text-gray-900 mb-2">Margaret Thatcher</h3>
                                      <p className="text-sm text-gray-600 mb-3">WSJ Highlights From the Iron Lady's Speeches</p>
                                    </div>
                                  </div>

                                  {/* Video 2 */}
                                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                    <div className="relative aspect-video bg-gray-100">
                                      <iframe
                                        src="https://www.youtube.com/embed/Ynav6QTgnFc?start=2"
                                        title="Top 10 Male Actors with Iconic Voices"
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                    <div className="p-4">
                                      <h3 className="font-semibold text-gray-900 mb-2">Top 10 Male Actors with Iconic Voices</h3>
                                      <p className="text-sm text-gray-600 mb-3">mojo Top 10 Male Actors with Iconic Voices</p>

                                    </div>
                                  </div>

                                  {/* Video 3 */}
                                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                    <div className="relative aspect-video bg-gray-100">
                                      <iframe
                                        src="https://www.youtube.com/embed/jkCXFn1HB0w?start=6"
                                        title="Top 10 Actresses with Unique Voices"
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                    <div className="p-4">
                                      <h3 className="font-semibold text-gray-900 mb-2">Top 10 Actresses with Unique Voices</h3>
                                      <p className="text-sm text-gray-600 mb-3">mojo Top 10 Actresses with Unique Voices</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const funFactsItem = pitchItem?.children?.find(item => item.id === 'fun-facts');
                                      if (funFactsItem) {
                                        setSelectedDropdownItem(funFactsItem);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Previous Session
                                  </button>
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const nextItem = pitchItem?.children?.find(item => item.id === 'learn-bumble-bee');
                                      if (nextItem) {
                                        setSelectedDropdownItem(nextItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Next Session
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'practice-1' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Recording Exercise 1
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Recording 1
                                </h2>

                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  Record yourself saying the script below. You can upload a video from your computer or mobile.
                                </p>

                                {/* Script */}
                                <div className="mb-8">
                                  <h3 className="font-semibold text-gray-900 mb-3">Script:</h3>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">
                                      {dropdownContent?.script || 'Mount Everest is the highest mountain in the world at 29,035 feet. It grows 4mm higher every year due to geologic uplift. Over 4,000 people have attempted to climb it. The youngest person to reach the summit was 13. The oldest was 80.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Video Upload Area */}
                                <VideoUpload 
                                      id="video-upload-practice-1"
                                  title="Upload Video"
                                  uploadedFile={uploadedVideo}
                                  onFileChange={handleVideoUpload}
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const matchRateItem = dropdownStructure[1].children?.find(item => item.id === 'match-rate-of-speech');
                                      if (matchRateItem) {
                                        setSelectedDropdownItem(matchRateItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                    disabled={!uploadedVideo}
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'practice-2' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Recording Exercise 2
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Recording 2
                                </h2>

                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  Now, let us try it again. Record yourself saying the script below. You can upload a video from your computer or mobile.
                                </p>

                                {/* Script */}
                                <div className="mb-8">
                                  <h3 className="font-semibold text-gray-900 mb-3">Script:</h3>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">
                                      {dropdownContent?.script || 'Mount Everest is the highest mountain in the world at 29,035 feet. It grows 4mm higher every year due to geologic uplift. Over 4,000 people have attempted to climb it. The youngest person to reach the summit was 13. The oldest was 80.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Video Upload Area */}
                                <VideoUpload 
                                  id="video-upload-practice-2"
                                  title="Upload Video"
                                  uploadedFile={uploadedVideo}
                                  onFileChange={handleVideoUpload}
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const learnPeriodPauseItem = dropdownStructure[1].children?.find(item => item.id === 'learn-period-pause');
                                      if (learnPeriodPauseItem) {
                                        setSelectedDropdownItem(learnPeriodPauseItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                    disabled={!uploadedVideo}
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'match-rate-of-speech' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Try to Match Rate of Speech
                                </h1>
                              
                                {/* Audio Samples */}
                                <div className="space-y-6">
                                  {dropdownContent?.audioSamples?.map((sample: { id: number; duration: string; title: string }, index: number) => (
                                    <div key={sample.id} className="border border-gray-200 rounded-lg p-4">
                                      {/* Audio Player */}
                                      <AudioPlayer 
                                        title={`Sample ${sample.id}`}
                                        duration={sample.duration}
                                        variant="simple"
                                        className="mb-4"
                                      />

                                      {/* Rate Options */}
                                      <div className="space-y-2">
                                        {dropdownContent?.rateOptions?.map((option: string, optionIndex: number) => (
                                          <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`sample-${sample.id}`}
                                              value={optionIndex}
                                              checked={matchRateAnswers[sample.id] === optionIndex}
                                              onChange={() => handleMatchRateAnswer(sample.id, optionIndex)}
                                              className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{option}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4 mt-6">
                                  <button
                                    onClick={handleSubmitMatchRate}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                    disabled={Object.keys(matchRateAnswers).length < 4}
                                  >
                                    Submit
                                  </button>
                                  <button
                                    onClick={() => {
                                      const tryToMatchItem = dropdownStructure[1].children?.find(item => item.id === 'try-to-match-rate');
                                      if (tryToMatchItem) {
                                        setSelectedDropdownItem(tryToMatchItem);
                                        setMatchRateAnswers({});
                                        setIsMatchRateSubmitted(false);
                                      }
                                    }}
                                    className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'try-to-match-rate' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Try to Match Rate of Speech
                                </h1>

                                {/* Instructions */}
                                <div className="mb-6">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                    Advanced rate matching practice
                                  </h3>
                                  <p className="text-gray-700 mb-4">
                                    This exercise will challenge you with more complex speech patterns and varying rates. Choose your difficulty level and practice matching the exact timing and rhythm.
                                  </p>
                                </div>

                                {/* Difficulty Levels */}
                                <div className="mb-6">
                                  <h4 className="font-semibold text-gray-900 mb-3">Choose difficulty level:</h4>
                                  <div className="space-y-3">
                                    {dropdownContent?.difficultyLevels?.map((level: { id: string; title: string; description: string }) => (
                                      <label key={level.id} className="flex items-start space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                                        <input
                                          type="radio"
                                          name="level"
                                          value={level.id}
                                          checked={selectedDifficultyLevel === level.id}
                                          onChange={() => handleDifficultyLevelChange(level.id)}
                                          className="mt-1 h-4 w-4 text-purple-600"
                                        />
                                        <div>
                                          <span className="text-gray-900 font-medium">{level.title}</span>
                                          <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Audio Sample Section */}
                                <div className="mb-6">
                                  <h4 className="font-semibold text-gray-900 mb-3">Listen to the advanced sample:</h4>
                                  <div className="bg-gray-100 rounded-lg p-4">
                                    <div className="flex items-center justify-center space-x-4">
                                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                                        <Play className="w-6 h-6 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">Advanced Sample Audio</p>
                                        <p className="text-sm text-gray-600">Click to play the reference audio</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Practice Text */}
                                <div className="mb-6">
                                  <h4 className="font-semibold text-gray-900 mb-3">Practice text:</h4>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">
                                      {dropdownContent?.practiceText || 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. Practice speaking this sentence at different rates while maintaining clarity and proper pronunciation.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Video Upload Section */}
                                <VideoUpload 
                                      id="video-upload-try-to-match"
                                  title="Record your advanced attempt:"
                                  description="Click to upload your practice video"
                                  variant="compact"
                                  uploadedFile={uploadedVideo}
                                  onFileChange={handleVideoUpload}
                                />

                                {/* Advanced Tips */}
                                <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                                  <h4 className="font-semibold text-purple-900 mb-2">Advanced Tips:</h4>
                                  <ul className="space-y-1 text-sm text-purple-800">
                                    {dropdownContent?.keyPoints?.map((tip: string, index: number) => (
                                      <li key={index}>• {tip}</li>
                                    ))}
                                  </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      const matchRateItem = dropdownStructure[1].children?.find(item => item.id === 'match-rate-of-speech');
                                      if (matchRateItem) {
                                        setSelectedDropdownItem(matchRateItem);
                                        setSelectedDifficultyLevel('beginner');
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Previous Lesson
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      const learnBreathingItem = dropdownStructure[1].children?.find(item => item.id === 'learn-breathing');
                                      if (learnBreathingItem) {
                                        setSelectedDropdownItem(learnBreathingItem);
                                        setSelectedDifficultyLevel('beginner');
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md"
                                    disabled={!uploadedVideo}
                                  >
                                    Complete Exercise
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'learn-breathing' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="Breathing"
                                  subtitle="exercise"
                                  description="Click to play the breathing lesson"
                                />

                                {/* Instruction Text */}
                                <div className="mb-6">
                                  <p className="text-gray-700">
                                    <span className="inline-block w-8 h-8 bg-orange-400 text-white rounded-full text-center font-bold mr-2">2</span>
                                    Listen to the audio instructions and practice the breathing exercise.
                                  </p>
                                      </div>
                                      
                                {/* Audio Player */}
                                <AudioPlayer 
                                  title="Breathing Exercise Audio"
                                  duration={dropdownContent?.audioDuration || '0:21'}
                                  variant="simple"
                                />

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={() => {
                                      const tryToMatchItem = dropdownStructure[1].children?.find(item => item.id === 'try-to-match-rate');
                                      if (tryToMatchItem) {
                                        setSelectedDropdownItem(tryToMatchItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Done
                                  </button>
                                  <button
                                    onClick={() => {
                                      const practice2Item = dropdownStructure[1].children?.find(item => item.id === 'practice-2');
                                      if (practice2Item) {
                                        setSelectedDropdownItem(practice2Item);
                                      }
                                    }}
                                    className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                        </div>
                                      </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'learn-period-pause' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="Period and"
                                  subtitle="Pause"
                                  description="Click to play the period and pause lesson"
                                />

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={() => {
                                      const practice2Item = dropdownStructure[1].children?.find(item => item.id === 'practice-2');
                                      if (practice2Item) {
                                        setSelectedDropdownItem(practice2Item);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Done
                                            </button>
                                  <button
                                    onClick={() => {
                                      const practice3Item = dropdownStructure[1].children?.find(item => item.id === 'practice-3');
                                      if (practice3Item) {
                                        setSelectedDropdownItem(practice3Item);
                                      }
                                    }}
                                    className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                          </div>
                                            </div>
                                          </div>
                          ) : selectedDropdownItem?.id === 'practice-3' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Recording Exercise 3
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Recording 3
                                </h2>

                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  Now, let us try it again. Record yourself saying the script below. You can upload a video from your computer or mobile.
                                </p>

                                {/* Script */}
                                <div className="mb-8">
                                  <h3 className="font-semibold text-gray-900 mb-3">Script:</h3>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">
                                      {dropdownContent?.script || 'Mount Everest is the highest mountain in the world at 29,035 feet. (Period, Pause) It grows 4mm higher every year due to geologic uplift. (Period, Pause) Over 4,000 people have attempted to climb it. (Period, Pause) The youngest person to reach the summit was 13. (Period, Pause) The oldest was 80. (Period, Pause)'}
                                    </p>
                                        </div>
                                      </div>

                                {/* Video Upload Area */}
                                <VideoUpload 
                                  id="video-upload-practice-3"
                                  title="Upload Video"
                                  uploadedFile={uploadedVideo}
                                  onFileChange={handleVideoUpload}
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const questionAnswerItem = dropdownStructure[1].children?.find(item => item.id === 'question-answer');
                                      if (questionAnswerItem) {
                                        setSelectedDropdownItem(questionAnswerItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                    disabled={!uploadedVideo}
                                  >
                                    Next Lesson
                                  </button>
                                    </div>
                                  </div>
                                </div>
                          ) : selectedDropdownItem?.id === 'what-is-pace-variation' ? (
                                <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Pace Variation
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Question Answer
                                </h2>

                                {/* Questions Section */}
                                <div className="space-y-8">
                                  {dropdownContent?.questions?.map((question: { id: number; question: string; answer: string }, index: number) => (
                                    <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        {index + 1}. {question.question}
                                      </h3>
                                      
                                      {/* Answer Input */}
                                      <div className="mb-4">
                                        <textarea
                                          value={paceVariationAnswers[question.id] || ''}
                                          onChange={(e) => setPaceVariationAnswers(prev => ({
                                            ...prev,
                                            [question.id]: e.target.value
                                          }))}
                                          placeholder="Type your answer here..."
                                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                          rows={4}
                                        />
                                </div>

                                      {/* Show Answer Button */}
                                      <button
                                        onClick={() => {
                                          const currentState = showPaceVariationAnswers[question.id] || false;
                                          setShowPaceVariationAnswers(prev => ({
                                            ...prev,
                                            [question.id]: !currentState
                                          }));
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                                      >
                                        {(showPaceVariationAnswers[question.id] || false) ? 'Hide Answer' : 'Show Answer'}
                                        </button>
                                      
                                      {/* Answer Display */}
                                      {(showPaceVariationAnswers[question.id] || false) && (
                                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                          <h4 className="font-semibold text-green-900 mb-2">Answer:</h4>
                                          <p className="text-green-800">{question.answer}</p>
                                      </div>
                                      )}
                                        </div>
                                  ))}
                                      </div>

                                {/* Navigation Button */}
                                <div className="flex justify-end mt-8">
                                  <button
                                    onClick={() => {
                                      // Find the question-answer item first, then find practice-4 within its children
                                      const questionAnswerItem = dropdownStructure[1].children?.find(item => item.id === 'question-answer');
                                      const practice4Item = questionAnswerItem?.children?.find(item => item.id === 'practice-4');
                                      if (practice4Item) {
                                        setSelectedDropdownItem(practice4Item);
                                        setPaceVariationAnswers({});
                                        setShowPaceVariationAnswers({});
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                    </div>
                                  </div>
                                </div>
                          ) : selectedDropdownItem?.id === 'practice-4' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Recording Exercise 4
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Recording 4
                                </h2>

                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  Now, let us practice. Record yourself saying the script below and vary your rate of speech as you read it. You can upload a video from your computer or mobile.
                                </p>

                                {/* Script */}
                                <div className="mb-8">
                                  <h3 className="font-semibold text-gray-900 mb-3">Script:</h3>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">
                                      {dropdownContent?.script || 'Roger Federer is a Swiss tennis player who has dominated the sport since early 21st century. He is known to be an all-rounder and has won 20 single men\'s Grand Slam Championships, which is the maximum number in the history of tennis. At the age of 17, he won his first Wimbledon junior singles championship.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Video Upload Area */}
                                <VideoUpload 
                                  id="video-upload-practice-4"
                                  title="Upload Video"
                                  uploadedFile={uploadedVideo}
                                  onFileChange={handleVideoUpload}
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const volumeItem = dropdownStructure[2].children?.find(item => item.id === 'what-is-volume');
                                      if (volumeItem) {
                                        setSelectedDropdownItem(volumeItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                    disabled={!uploadedVideo}
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'what-is-volume' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Volume
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Overview Video on Volume
                                </h2>

                                {/* Video Player Section - Large Dark Theme */}
                                <VideoPlayer 
                                  title="Lesson 3-1:"
                                  subtitle="Vocal Volume"
                                  description="Click to play the volume lesson"
                                />
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'volume-practice-1' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                   Exercise 1
                                </h1>
                                

                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  Now, let us practice. Record yourself saying the script below. You can upload a video from your computer or mobile.
                                </p>

                                {/* Script */}
                                <div className="mb-8">
                                  <h3 className="font-semibold text-gray-900 mb-3">Script:</h3>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">
                                      {dropdownContent?.script || 'Dolphins stick to their mothers for 3 to 8 years. They are extremely intelligent animals rated only second to humans. The average lifespan is 17 years but can live up to 50 years. Dolphins have two stomachs, one for food and the other for digestion.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Video Upload Area */}
                                <VideoUpload 
                                  id="video-upload-volume-practice-1"
                                  title="Upload Video"
                                  uploadedFile={uploadedVideo}
                                  onFileChange={handleVideoUpload}
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const balloonExerciseItem = dropdownStructure[2].children?.find(item => item.id === 'learn-balloon-exercise');
                                      const balloonPracticeItem = balloonExerciseItem?.children?.find(item => item.id === 'balloon-practice');
                                      if (balloonPracticeItem) {
                                        setSelectedDropdownItem(balloonPracticeItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'who-is-siri' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="text-center mb-4">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Understanding Voice Assistants
                                  </h3>
                                  <p className="text-gray-600">
                                    Learn about Siri and how voice assistants work
                                  </p>
                                </div>

                                {/* Video Player */}
                                <div className="flex justify-center mb-6">
                                  <div className="w-full max-w-4xl">
                                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                      <iframe
                                        src="https://www.youtube.com/embed/7xvv560z2Go?start=18"
                                        title="Who is Siri - Voice Assistant"
                                        className="w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      ></iframe>
                                    </div>
                                  </div>
                                </div>



                                {/* Completion Status */}
                                {isSiriVideoStarted && (
                                  <div className="text-center mb-6">
                                    <button
                                      onClick={handleCompleteSiri}
                                      disabled={isSiriCompleted}
                                      className={`font-medium px-6 py-2 rounded-md ${
                                        isSiriCompleted
                                          ? 'bg-green-600 text-white cursor-not-allowed'
                                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                                      }`}
                                    >
                                      {isSiriCompleted ? '✓ Completed' : 'Mark as Done'}
                                    </button>
                                  </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      const wordExerciseItem = dropdownStructure[0].children?.find(item => item.id === 'word-exercise');
                                      if (wordExerciseItem) {
                                        setSelectedDropdownItem(wordExerciseItem);
                                        setIsSiriVideoStarted(false);
                                        setIsSiriCompleted(false);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Previous Session
                                  </button>
                                  <button
                                    onClick={handleNextSiriSession}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Next Session
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'learn-balloon-exercise' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Learn Balloon Exercise
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Balloon Exercise for Volume Control
                                </h2>

                                {/* Balloon Image Section */}
                                <div className="mb-8">
                                  <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center">
                                    {/* Balloon Image */}
                                    <div className="mb-4">
                                      <img 
                                        src="https://app.uspeeknow.com/assets/images/ballon.png" 
                                        alt="Balloon Exercise Illustration" 
                                        className="max-w-md h-auto rounded-lg shadow-lg"
                                      />
                                    </div>
                                    
                                    {/* Practice Text */}
                                    <div className="text-center">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Let's practice the Balloon Exercise
                                      </h3>
                                    </div>
                                  </div>
                                </div>

                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="Balloon Exercise:"
                                  subtitle="Volume Control"
                                  description="Click to play the balloon exercise video"
                                />

                                {/* Description */}
                                <div className="mb-6">
                                  <h3 className="font-semibold text-gray-900 mb-3">About the Balloon Exercise:</h3>
                                  <p className="text-gray-700 leading-relaxed">
                                    The balloon exercise is a simple yet effective technique for improving your volume control and voice projection. This exercise helps you understand how to use your diaphragm and control your breath for better vocal delivery.
                                  </p>
                                </div>

                                {/* Key Points */}
                                <div className="mb-6">
                                  <h3 className="font-semibold text-gray-900 mb-3">Key Benefits:</h3>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      The balloon exercise helps with breath control
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      It improves voice projection and volume
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      It teaches proper diaphragm usage
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      It reduces vocal strain and fatigue
                                    </li>
                                  </ul>
                                </div>

                                {/* Calendar Image Section */}
                                <div className="mb-8">
                                  <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center">
                                    {/* Calendar Image */}
                                    <div className="mb-4">
                                      <img 
                                        src="https://app.uspeeknow.com/assets/images/cal.png" 
                                        alt="Month Exercise Calendar Illustration" 
                                        className="max-w-md h-auto rounded-lg shadow-lg"
                                      />
                                    </div>
                                    
                                    {/* Practice Text */}
                                    <div className="text-center">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Let's practice the Month Exercise
                                      </h3>
                                    </div>
                                  </div>
                                </div>

                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="Month Exercise"
                                  subtitle="Video"
                                  description="Practice video guide"
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const practice6Item = dropdownStructure[2].children?.find(item => item.id === 'practice-6');
                                      if (practice6Item) {
                                        setSelectedDropdownItem(practice6Item);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'balloon-practice' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Balloon Exercise Practice
                                </h1>
                                
                                {/* Balloon Image Section */}
                                <div className="mb-8">
                                  <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center">
                                    {/* Balloon Image */}
                                    <div className="mb-4">
                                      <img 
                                        src="https://app.uspeeknow.com/assets/images/ballon.png" 
                                        alt="Balloon Exercise Illustration" 
                                        className="max-w-md h-auto rounded-lg shadow-lg"
                                      />
                                    </div>
                                    
                                    {/* Practice Text */}
                                    <div className="text-center">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Let's practice the Balloon Exercise
                                      </h3>
                                    </div>
                                  </div>
                                </div>

                                {/* Audio Player Section */}
                                <AudioPlayer 
                                  title="Balloon Exercise Audio"
                                  description="Practice audio guide"
                                  duration="0:28"
                                  variant="advanced"
                                />





                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const balloonExerciseItem = dropdownStructure[2].children?.find(item => item.id === 'learn-balloon-exercise');
                                      const mouthExerciseItem = balloonExerciseItem?.children?.find(item => item.id === 'learn-mouth-exercise');
                                      if (mouthExerciseItem) {
                                        setSelectedDropdownItem(mouthExerciseItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                    disabled={!uploadedVideo}
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'learn-mouth-exercise' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Learn Mouth Exercise
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Mouth Exercises for Better Articulation
                                </h2>

                                {/* Description */}
                                <div className="mb-6">
                                  <p className="text-gray-700 leading-relaxed">
                                    Mouth exercises help improve articulation and clarity in speech. These exercises strengthen the muscles used in speaking and help with pronunciation.
                                  </p>
                                </div>

                                {/* Key Points */}
                                <div className="mb-6">
                                  <h3 className="font-semibold text-gray-900 mb-3">Key Benefits:</h3>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      Mouth exercises improve articulation
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      They strengthen speaking muscles
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      They help with pronunciation
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      Regular practice is essential
                                    </li>
                                  </ul>
                                </div>

                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="Mouth Exercise:"
                                  subtitle="Articulation Techniques"
                                  description="Click to play the mouth exercise video"
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const balloonExerciseItem = dropdownStructure[2].children?.find(item => item.id === 'learn-balloon-exercise');
                                      const backOfRoomItem = balloonExerciseItem?.children?.find(item => item.id === 'learn-back-of-room');
                                      if (backOfRoomItem) {
                                        setSelectedDropdownItem(backOfRoomItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'learn-back-of-room' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Learn Back of Room Exercise
                                </h1>
                                
                                {/* Section Title */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Voice Projection Techniques
                                </h2>

                                {/* Description */}
                                <div className="mb-6">
                                  <p className="text-gray-700 leading-relaxed">
                                    The back of room exercise helps you learn to project your voice effectively so that everyone in the room can hear you clearly.
                                  </p>
                                </div>

                                {/* Key Points */}
                                <div className="mb-6">
                                  <h3 className="font-semibold text-gray-900 mb-3">Key Benefits:</h3>
                                  <ul className="space-y-2 text-gray-700">
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      Voice projection is essential for public speaking
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      Practice speaking to different distances
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      Focus on clarity and volume
                                    </li>
                                    <li className="flex items-start">
                                      <span className="text-blue-500 mr-2">•</span>
                                      Build confidence through practice
                                    </li>
                                  </ul>
                                </div>

                                {/* Calendar Image Section */}
                                <div className="mb-8">
                                  <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center">
                                    {/* Calendar Image */}
                                    <div className="mb-4">
                                      <img 
                                        src="https://app.uspeeknow.com/assets/images/cal.png" 
                                        alt="Month Exercise Calendar Illustration" 
                                        className="max-w-md h-auto rounded-lg shadow-lg"
                                      />
                                    </div>
                                    
                                    {/* Practice Text */}
                                    <div className="text-center">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Let's practice the Month Exercise
                                      </h3>
                                    </div>
                                  </div>
                                </div>

                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="Month Exercise"
                                  subtitle="Video"
                                  description="Practice video guide"
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const balloonExerciseItem = dropdownStructure[2].children?.find(item => item.id === 'learn-balloon-exercise');
                                      const balloonPractice2Item = balloonExerciseItem?.children?.find(item => item.id === 'balloon-practice-2');
                                      if (balloonPractice2Item) {
                                        setSelectedDropdownItem(balloonPractice2Item);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'balloon-practice-2' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Advanced Balloon Practice
                                </h1>
                                
                                {/* Duration */}
                                <p className="text-gray-500 mb-6">15:00</p>

                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  Now practice the balloon exercise with more advanced techniques and variations.
                                </p>

                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="Advanced Balloon Practice:"
                                  subtitle="Video Guide"
                                  description="Click to play the advanced practice video"
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const balloonExerciseItem = dropdownStructure[2].children?.find(item => item.id === 'learn-balloon-exercise');
                                      const balloonPractice3Item = balloonExerciseItem?.children?.find(item => item.id === 'balloon-practice-3');
                                      if (balloonPractice3Item) {
                                        setSelectedDropdownItem(balloonPractice3Item);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'balloon-practice-3' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Final Balloon Practice
                                </h1>
                                
                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  This is your final practice session for the balloon exercise. Apply all the techniques you have learned.
                                </p>

                                {/* Image Section */}
                                <div className="mb-8">
                                  <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center">
                                    {/* boGirl Image */}
                                    <div className="mb-4">
                                      <img
                                        src="https://app.uspeeknow.com/assets/images/boGirl.png"
                                        alt="Balloon Exercise Practice Illustration"
                                        className="max-w-md h-auto rounded-lg shadow-lg"
                                      />
                                    </div>

                                    {/* Practice Text */}
                                    <div className="text-center">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Let's practice the back of the room exercise.
                                      </h3>
                                    </div>
                                  </div>
                                </div>

                                {/* Audio Player Section */}
                                <AudioPlayer 
                                  title="Back of Room Exercise Audio"
                                  description="Practice audio guide"
                                  duration="0:17"
                                  variant="advanced"
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      // Navigate back to the main volume section
                                      const volumeItem = dropdownStructure[2];
                                      if (volumeItem) {
                                        setSelectedDropdownItem(volumeItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Complete Section
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'what-is-pitch' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  What is Pitch?
                                </h1>
                                
                                {/* Duration */}
                                <p className="text-gray-500 mb-6">8:00</p>

                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="What is Pitch?"
                                  subtitle="Video Guide"
                                  description="Click to play the pitch introduction video"
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const funFactsItem = pitchItem?.children?.find(item => item.id === 'fun-facts');
                                      if (funFactsItem) {
                                        setSelectedDropdownItem(funFactsItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'fun-facts' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Fun Facts
                                </h1>
                                
                                {/* Subtitle */}
                                <p className="text-gray-500 mb-6">About Vocal Pitch</p>

                                {/* Fun Facts Content */}
                                <div className="space-y-6">
                                  {/* Fact 1 */}
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                                      <span className="text-orange-700 font-bold text-sm">1</span>
                                    </div>
                                    <div>
                                      <p className="text-gray-700">
                                        <strong>Fact 1:</strong> Your vocal range is the lowest note you can sing to the highest note you can sing.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Fact 2 */}
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                                      <span className="text-orange-700 font-bold text-sm">2</span>
                                    </div>
                                    <div>
                                      <p className="text-gray-700 mb-2">
                                        <strong>Fact 2:</strong> Most male vocal pitch ranges are categorized into 3 types.
                                      </p>
                                      <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                                        <li>Bass (87 to 330 hertz)</li>
                                        <li>Baritone (87 to 349 hertz)</li>
                                        <li>Tenor (130 to 523 hertz)</li>
                                      </ul>
                                    </div>
                                  </div>

                                  {/* Fact 3 */}
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                                      <span className="text-orange-700 font-bold text-sm">3</span>
                                    </div>
                                    <div>
                                      <p className="text-gray-700 mb-2">
                                        <strong>Fact 3:</strong> Most female vocal pitch ranges are categorized into 3 types.
                                      </p>
                                      <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                                        <li>Alto (175 to 698 hertz)</li>
                                        <li>Mezzo-Soprano (110 to 880 hertz)</li>
                                        <li>Soprano (262 to 1047 hertz)</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-8">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsPitchItem = pitchItem?.children?.find(item => item.id === 'what-is-pitch');
                                      if (whatIsPitchItem) {
                                        setSelectedDropdownItem(whatIsPitchItem);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Done
                                  </button>
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const nextItem = pitchItem?.children?.find(item => item.id === 'pitch-video-examples');
                                      if (nextItem) {
                                        setSelectedDropdownItem(nextItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'learn-bumble-bee' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Bumble Bee Exercise
                                </h1>
                                
                                {/* Subtitle */}
                                <p className="text-gray-500 mb-6">Master the bumble bee exercise for pitch control and vocal resonance</p>

                                {/* Video Component */}
                                <div className="mb-6">
                                  <VideoPlayer 
                                    title="Bumble Bee Exercise"
                                    subtitle="Video Lesson"
                                    description="Click to play the bumble bee exercise video"
                                  />
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const pitchVideoExamplesItem = pitchItem?.children?.find(item => item.id === 'pitch-video-examples');
                                      if (pitchVideoExamplesItem) {
                                        setSelectedDropdownItem(pitchVideoExamplesItem);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Previous Session
                                  </button>
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const nextItem = pitchItem?.children?.find(item => item.id === 'practice-9');
                                      if (nextItem) {
                                        setSelectedDropdownItem(nextItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Next Session
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'practice-9' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Bumble Bee Exercise Practice
                                </h1>
                                
                                {/* Bumble Bee Image Section */}
                                <div className="mb-8">
                                  <div className="bg-gray-50 rounded-lg p-8 flex flex-col items-center justify-center">
                                    {/* Bumble Bee Image */}
                                    <div className="mb-4">
                                      <img 
                                        src="https://app.uspeeknow.com/assets/images/bee.png" 
                                        alt="Bumble Bee Exercise Illustration" 
                                        className="max-w-md h-auto rounded-lg shadow-lg"
                                      />
                                    </div>
                                    
                                    {/* Practice Text */}
                                    <div className="text-center">
                                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Let's practice the Bumble Bee exercise
                                      </h3>
                                    </div>
                                  </div>
                                </div>

                                {/* Audio Player Section */}
                                <AudioPlayer 
                                  title="Bumble Bee Exercise Audio"
                                  description="Practice audio guide"
                                  duration="0:21"
                                  variant="advanced"
                                />

                                {/* Navigation Buttons */}
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const learnBumbleBeeItem = pitchItem?.children?.find(item => item.id === 'learn-bumble-bee');
                                      if (learnBumbleBeeItem) {
                                        setSelectedDropdownItem(learnBumbleBeeItem);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Done
                                  </button>
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const nextItem = pitchItem?.children?.find(item => item.id === 'learn-yawn-exercise');
                                      if (nextItem) {
                                        setSelectedDropdownItem(nextItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'learn-yawn-exercise' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Video Component Only */}
                                <VideoPlayer 
                                  title="Yawn Exercise"
                                  subtitle="Video Lesson"
                                  description="Click to play the yawn exercise video"
                                />
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'practice-10' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Practice Exercise
                                </h1>
                                
                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  Now, let us practice. Record yourself saying the script below. You can upload a video from your computer or mobile.
                                </p>

                                {/* Script */}
                                <div className="mb-8">
                                  <h3 className="font-semibold text-gray-900 mb-3">Script:</h3>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">
                                      Morgan Freeman has been universally voted one of the best voices of all time. He has used his voice to play God, the President, national commercials and even for presidential campaigns for Barack Obama and Hillary Clinton. How did he get such as powerful voice like that? He had a voice and diction instructor while studying acting at LA City College.
                                    </p>
                                  </div>
                                </div>

                                {/* Video Upload Area */}
                                <VideoUpload 
                                  id="video-upload-practice-10"
                                  title="Upload Video"
                                  uploadedFile={uploadedVideo}
                                  onFileChange={handleVideoUpload}
                                />

                                {/* Navigation Button */}
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const nextItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      if (nextItem) {
                                        setSelectedDropdownItem(nextItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                    disabled={!uploadedVideo}
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'modulation-practice-1' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Video Player Section */}
                                <VideoPlayer 
                                  title="Modulation Practice"
                                  subtitle="Video Lesson"
                                  description="Click to play the modulation practice video"
                                />

                                {/* Instructions */}
                                <div className="mb-6">
                                  <p className="text-gray-700">
                                    <span className="inline-block w-8 h-8 bg-blue-400 text-white rounded-full text-center font-bold mr-2">1</span>
                                    Watch the practice video and then practice the modulation techniques.
                                  </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsModulationItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      if (whatIsModulationItem) {
                                        setSelectedDropdownItem(whatIsModulationItem);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Previous Lesson
                                  </button>
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsModulationItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      const modulationItem = whatIsModulationItem?.children?.find(item => item.id === 'modulation');
                                      if (modulationItem) {
                                        setSelectedDropdownItem(modulationItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'modulation' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Modulation
                                </h1>
                                
                                {/* Content */}
                                <div className="mb-6">
                                  <p className="text-gray-700 leading-relaxed">
                                    Learn advanced modulation techniques that combine pitch, pace, and volume for maximum impact in your communication.
                                  </p>
                                </div>

                                {/* Video Section */}
                                <div className="mb-8">
                                  <VideoPlayer 
                                    title="Advanced Modulation Techniques"
                                    subtitle="Combining Pitch, Pace, and Volume"
                                    description="Learn how to combine multiple voice modulation techniques for maximum impact in your communication"
                                  />
                                </div>

                                {/* Key Points */}
                                <div className="mb-8">
                                  <h3 className="font-semibold text-gray-900 mb-3">Key Points:</h3>
                                  <ul className="space-y-2">
                                    <li className="flex items-start space-x-2">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                      <span className="text-gray-700">Combine multiple techniques for maximum impact</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                      <span className="text-gray-700">Develop your unique modulation signature</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                      <span className="text-gray-700">Advanced techniques require consistent practice</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                      <span className="text-gray-700">Professional modulation enhances credibility</span>
                                    </li>
                                  </ul>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsModulationItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      const practice1Item = whatIsModulationItem?.children?.find(item => item.id === 'modulation-practice-1');
                                      if (practice1Item) {
                                        setSelectedDropdownItem(practice1Item);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Previous Lesson
                                  </button>
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsModulationItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      const rememberToSmileItem = whatIsModulationItem?.children?.find(item => item.id === 'remember-to-smile');
                                      if (rememberToSmileItem) {
                                        setSelectedDropdownItem(rememberToSmileItem);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'remember-to-smile' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                                  Remember to Smile
                                </h1>
                                
                                {/* Circular Background with Illustration */}
                                <div className="flex justify-center mb-8">
                                  <div className="w-80 h-80 bg-gray-100 rounded-full flex items-center justify-center relative">
                                    {/* Smiling Woman Illustration */}
                                    <div className="w-64 h-64 bg-white rounded-full flex items-center justify-center shadow-lg">
                                      <div className="text-center">
                                        {/* Woman Icon - Using a more sophisticated representation */}
                                        <div className="w-40 h-40 mx-auto relative">
                                          {/* Head */}
                                          <div className="w-32 h-32 bg-yellow-400 rounded-full mx-auto relative overflow-hidden">
                                            {/* Hair */}
                                            <div className="w-36 h-12 bg-amber-700 rounded-full absolute -top-3 left-2 transform -rotate-6"></div>
                                            {/* Face features */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              {/* Eyes */}
                                              <div className="flex space-x-12 -mt-2">
                                                <div className="w-4 h-4 bg-black rounded-full"></div>
                                                <div className="w-4 h-4 bg-black rounded-full"></div>
                                              </div>
                                            </div>
                                            {/* Smile */}
                                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                                              <div className="w-12 h-6 border-b-4 border-black rounded-full"></div>
                                            </div>
                                          </div>
                                          {/* Body */}
                                          <div className="w-28 h-20 bg-yellow-400 rounded-t-full mx-auto mt-1 relative">
                                            {/* Collar */}
                                            <div className="w-24 h-6 bg-white rounded-full absolute -top-3 left-2"></div>
                                            {/* Arms - positioned to look like they're clasped */}
                                            <div className="absolute -left-3 top-6 w-6 h-12 bg-yellow-400 rounded-full transform -rotate-12"></div>
                                            <div className="absolute -right-3 top-6 w-6 h-12 bg-yellow-400 rounded-full transform rotate-12"></div>
                                          </div>
                                          {/* Pants */}
                                          <div className="w-28 h-12 bg-blue-500 rounded-b-full mx-auto"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Tips Text */}
                                <div className="text-center mb-8">
                                  <p className="text-lg font-medium text-gray-700">
                                    Tips on how to modulate your voice
                                  </p>
                                </div>

                                {/* Audio Player */}
                                <div className="max-w-md mx-auto mb-8">
                                  <div className="bg-gray-100 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <button className="w-8 h-8 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                                          <Play className="w-4 h-4 text-white" />
                                        </button>
                                        <span className="text-sm text-gray-600">0:00 / 0:12</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-24 h-2 bg-gray-300 rounded-full">
                                          <div className="w-0 h-2 bg-gray-600 rounded-full"></div>
                                        </div>
                                        <button className="text-gray-500 hover:text-gray-700">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                          </svg>
                                        </button>
                                        <button className="text-gray-500 hover:text-gray-700">
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsModulationItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      const modulationItem = whatIsModulationItem?.children?.find(item => item.id === 'modulation');
                                      if (modulationItem) {
                                        setSelectedDropdownItem(modulationItem);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Previous Lesson
                                  </button>
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsModulationItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      const practice2Item = whatIsModulationItem?.children?.find(item => item.id === 'modulation-practice-2');
                                      if (practice2Item) {
                                        setSelectedDropdownItem(practice2Item);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'modulation-practice-2' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                {/* Page Title */}
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                  Practice Exercise 2
                                </h1>
                                
                                {/* Subtitle */}
                                <h2 className="text-xl font-semibold text-gray-700 mb-6">
                                  Practice Exercise
                                </h2>
                                
                                {/* Instructions */}
                                <p className="text-gray-700 mb-6">
                                  Now, let us practice. Record yourself saying again the script below. You can upload a video from your computer or mobile.
                                </p>

                                {/* Script */}
                                <div className="mb-8">
                                  <h3 className="font-semibold text-gray-900 mb-3">Script:</h3>
                                  <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 leading-relaxed">
                                      A 100 million people would recognize her voice. Interact with her daily. You might have even asked her to dial your ex in the middle of the night. Her voice is your companion, and her name is Siri from Apple. In real life, she is Susan Bennett.
                                    </p>
                                  </div>
                                </div>

                                {/* Video Upload Area */}
                                <div className="mb-8">
                                  <VideoUpload 
                                    id="video-upload-modulation-practice-2"
                                    title="Upload Video"
                                    description="Click to upload your practice video"
                                    uploadedFile={uploadedVideo}
                                    onFileChange={handleVideoUpload}
                                  />
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center">
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsModulationItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      const rememberToSmileItem = whatIsModulationItem?.children?.find(item => item.id === 'remember-to-smile');
                                      if (rememberToSmileItem) {
                                        setSelectedDropdownItem(rememberToSmileItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-6 py-2 rounded-md"
                                  >
                                    Previous Lesson
                                  </button>
                                  <button
                                    onClick={() => {
                                      const pitchItem = dropdownStructure[3];
                                      const whatIsModulationItem = pitchItem?.children?.find(item => item.id === 'what-is-modulation');
                                      const quizItem = whatIsModulationItem?.children?.find(item => item.id === 'modulation-quiz');
                                      if (quizItem) {
                                        setSelectedDropdownItem(quizItem);
                                        setUploadedVideo(null);
                                      }
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-md"
                                    disabled={!uploadedVideo}
                                  >
                                    Next Lesson
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : selectedDropdownItem?.id === 'modulation-quiz' ? (
                            <div className="mb-6">
                              <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Modulation Quiz</h3>
                                
                                <div className="space-y-6">
                                  <div className="p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-semibold text-blue-900 mb-4">Test your knowledge of modulation techniques</h4>
                                    <p className="text-gray-700 mb-4">
                                      This quiz will test your understanding of modulation concepts, techniques, and best practices.
                                    </p>
                                    
                                    <div className="space-y-4">
                                      <div className="p-3 bg-white rounded-lg border">
                                        <p className="font-medium mb-2">Question 1: What is modulation?</p>
                                        <div className="space-y-2">
                                          <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="radio" name="q1" value="a" className="text-blue-600" />
                                            <span className="text-gray-700">Speaking loudly</span>
                                          </label>
                                          <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="radio" name="q1" value="b" className="text-blue-600" />
                                            <span className="text-gray-700">The strategic use of voice pitch, pace, and volume</span>
                                          </label>
                                          <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="radio" name="q1" value="c" className="text-blue-600" />
                                            <span className="text-gray-700">Speaking quickly</span>
                                          </label>
                                        </div>
                                      </div>
                                      
                                      <div className="p-3 bg-white rounded-lg border">
                                        <p className="font-medium mb-2">Question 2: How does smiling affect your voice?</p>
                                        <div className="space-y-2">
                                          <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="radio" name="q2" value="a" className="text-blue-600" />
                                            <span className="text-gray-700">It makes you sound louder</span>
                                          </label>
                                          <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="radio" name="q2" value="b" className="text-blue-600" />
                                            <span className="text-gray-700">It brightens your vocal tone and makes you sound more approachable</span>
                                          </label>
                                          <label className="flex items-center space-x-3 cursor-pointer">
                                            <input type="radio" name="q2" value="c" className="text-blue-600" />
                                            <span className="text-gray-700">It has no effect</span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-6 flex justify-between">
                                      <Button
                                        variant="outline"
                                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                      >
                                        Reset Quiz
                                      </Button>
                                      <Button
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        Submit Quiz
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null
                        ) : (
                          <div className="mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question for Vocal Tone</h3>
                              
                              {!showVocalToneQuizResults ? (
                                <div className="space-y-6">
                                  <div className="p-4 bg-purple-50 rounded-lg">
                                    <h4 className="font-semibold text-purple-900 mb-4">Question {currentVocalToneQuizQuestion + 1} of {vocalToneQuizQuestions.length}</h4>
                                    <p className="text-gray-700 mb-4">{vocalToneQuizQuestions[currentVocalToneQuizQuestion].question}</p>
                                    
                                    <div className="space-y-3">
                                      {vocalToneQuizQuestions[currentVocalToneQuizQuestion].options.map((option, index) => (
                                        <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                          <input
                                            type="radio"
                                            name={`question-${currentVocalToneQuizQuestion}`}
                                            value={index}
                                            checked={vocalToneQuizAnswers[vocalToneQuizQuestions[currentVocalToneQuizQuestion].id] === index}
                                            onChange={() => handleVocalToneQuizAnswer(vocalToneQuizQuestions[currentVocalToneQuizQuestion].id, index)}
                                            className="text-purple-600 focus:ring-purple-500"
                                          />
                                          <span className="text-gray-700">{option}</span>
                                        </label>
                                      ))}
                                    </div>
                                    
                                    <div className="mt-6 flex justify-between">
                                      <Button
                                        onClick={resetVocalToneQuiz}
                                        variant="outline"
                                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                                      >
                                        Reset Quiz
                                      </Button>
                                      <Button
                                        onClick={handleNextVocalToneQuizQuestion}
                                        disabled={vocalToneQuizAnswers[vocalToneQuizQuestions[currentVocalToneQuizQuestion]?.id] === undefined}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                      >
                                        {currentVocalToneQuizQuestion === vocalToneQuizQuestions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 bg-green-50 rounded-lg">
                                  <h4 className="font-semibold text-green-900 mb-4">Quiz Results</h4>
                                  <div className="space-y-4">
                                    {vocalToneQuizQuestions.map((question, index) => {
                                      const userAnswer = vocalToneQuizAnswers[question.id];
                                      const isCorrect = userAnswer === question.correctAnswer;
                                      return (
                                        <div key={index} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                                          <p className="font-medium mb-2">Question {index + 1}: {question.question}</p>
                                          <p className="text-sm mb-1">Your answer: {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}</p>
                                          <p className="text-sm mb-1">Correct answer: {question.options[question.correctAnswer]}</p>
                                        </div>
                                      );
                                    })}
                                    <div className="mt-4 text-center">
                                      <Button
                                        onClick={resetVocalToneQuiz}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                      >
                                        Retake Quiz
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      ) : selectedSession.type === 'video' ? (
                        <div className="mb-6">
                          <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <Play className="w-10 h-10 text-gray-400" />
                              </div>
                              <p className="text-gray-500 text-sm">Video content would be displayed here</p>
                            </div>
                          </div>
                        </div>
                      ) : selectedSession.type === 'quiz' ? (
                        <div className="mb-6">
                          <div className="bg-purple-50 rounded-lg p-6">
                            <div className="text-center">
                              <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <p className="text-purple-600 text-sm font-medium">Quiz Assessment</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-6">
                          <div className="bg-blue-50 rounded-lg p-6">
                            <div className="text-center">
                              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-10 h-10 text-blue-400" />
                              </div>
                              <p className="text-blue-600 text-sm font-medium">Text-based lesson content</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Session Content */}
                  <div className="prose prose-sm max-w-none">
                    {!(selectedDropdownItem?.id === 'overview' && !isOverviewStarted) && !dropdownContent?.isExternalPage && (
                      <p className="text-gray-700 leading-relaxed mb-6">
                        {selectedDropdownItem ? dropdownContent?.content : content.content}
                      </p>
                    )}
                    
                    {selectedDropdownItem ? (
                      selectedDropdownItem.id === 'overview' ? null : dropdownContent?.isExternalPage ? null : selectedDropdownItem.id === 'quiz' ? null : selectedDropdownItem.id === 'what-is-rate-of-speech' ? null : (
                        <>
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
                            <ul className="space-y-1 text-sm text-blue-800">
                              {dropdownContent?.objectives.map((objective: string, index: number) => (
                                <li key={index}>• {objective}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
                            <ul className="space-y-1 text-sm text-green-800">
                              {dropdownContent?.keyPoints.map((point: string, index: number) => (
                                <li key={index}>• {point}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )
                    ) : selectedSession.type === 'quiz' && content.quiz ? (
                      <div className="mt-6">
                        {!showQuizResults ? (
                          <div className="space-y-6">
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <h4 className="font-semibold text-purple-900 mb-4">Question {currentQuizQuestion + 1} of {content.quiz?.questions.length}</h4>
                              <p className="text-gray-700 mb-4">{content.quiz?.questions[currentQuizQuestion].question}</p>
                              
                              <div className="space-y-3">
                                {content.quiz?.questions[currentQuizQuestion].options.map((option, index) => (
                                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${currentQuizQuestion}`}
                                      value={index}
                                      checked={quizAnswers[currentQuizQuestion] === index}
                                      onChange={() => setQuizAnswers(prev => [...prev, index])}
                                      className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                              
                              <div className="mt-6 flex justify-between">
                                <Button
                                  onClick={() => setCurrentQuizQuestion(0)}
                                  variant="outline"
                                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                                >
                                  Reset Quiz
                                </Button>
                                <Button
                                  onClick={handleSubmitVocalToneQuiz}
                                  disabled={quizAnswers.length < (content.quiz?.questions.length || 0)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  {currentQuizQuestion === (content.quiz?.questions.length || 0) - 1 ? 'Submit Quiz' : 'Next Question'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-4">Quiz Results</h4>
                            <div className="space-y-4">
                              {content.quiz?.questions.map((question, index) => {
                                const userAnswer = quizAnswers[index];
                                const isCorrect = userAnswer === question.correctAnswer;
                                return (
                                  <div key={index} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <p className="font-medium mb-2">Question {index + 1}: {question.question}</p>
                                    <p className="text-sm mb-1">Your answer: {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}</p>
                                    <p className="text-sm mb-1">Correct answer: {question.options[question.correctAnswer]}</p>
                                    <p className="text-sm text-gray-600">{question.explanation}</p>
                                  </div>
                                );
                              })}
                              <div className="mt-4 text-center">
                                <Button
                                  onClick={() => setCurrentQuizQuestion(0)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  Retake Quiz
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
                          <ul className="space-y-1 text-sm text-blue-800">
                            {content.objectives.map((objective, index) => (
                              <li key={index}>• {objective}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
                          <ul className="space-y-1 text-sm text-green-800">
                            {content.keyPoints.map((point, index) => (
                              <li key={index}>• {point}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  {isSessionStarted && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">Session Progress</span>
                        <span className="text-sm text-green-600">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  )}


                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
