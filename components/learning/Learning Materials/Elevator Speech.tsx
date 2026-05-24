'use client';

import { BaseLearningMaterial } from '@/components/learning/base-learning-material';

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

// Elevator Speech Sessions Structure
const elevatorSpeechSessionsStructure: DropdownItem[] = [
  {
    id: 'elevator-speech',
    title: 'Elevator Speech »',
    children: [
      { id: 'what-is-elevator-pitch', title: 'What is an elevator pitch' }
    ]
  }
];

const elevatorSpeechContent: Record<string, LessonContentItem> = {
  'what-is-elevator-pitch': {
    title: 'What is an Elevator Pitch?',
    description: 'Learn the fundamentals of creating compelling elevator pitches',
    content: `An elevator pitch is a brief, persuasive speech that you use to spark interest in what your organization does. It's called an "elevator pitch" because it should be short enough to present during a brief elevator ride.`,
    objectives: [
      'Understand what an elevator pitch is and its purpose',
      'Learn the key components of an effective elevator pitch',
      'Identify the ideal length and structure',
      'Develop techniques for creating memorable pitches'
    ],
    keyPoints: [
      'Keep it under 60 seconds',
      'Start with a compelling hook',
      'Focus on the problem you solve',
      'End with a clear call to action',
      'Practice and refine regularly'
    ],
    videoUrl: 'https://www.youtube.com/embed/wFuvGkj0x7s',
    quiz: {
      questions: [
        {
          id: 1,
          question: 'What is the ideal length for an elevator pitch?',
          options: [
            '15-30 seconds',
            '30-60 seconds',
            '1-2 minutes',
            '2-3 minutes'
          ],
          correctAnswer: 1,
          explanation: 'The ideal elevator pitch should be 30-60 seconds long - enough time to convey your message but short enough to maintain attention.'
        },
        {
          id: 2,
          question: 'Which of the following is NOT a key component of an elevator pitch?',
          options: [
            'Hook',
            'Problem',
            'Solution',
            'Detailed background'
          ],
          correctAnswer: 3,
          explanation: 'Detailed background is not a key component. The focus should be on the hook, problem, solution, value, and call to action.'
        },
        {
          id: 3,
          question: 'What is the primary goal of an elevator pitch?',
          options: [
            'To close a deal immediately',
            'To provide detailed information',
            'To open the door for further conversation',
            'To impress with technical knowledge'
          ],
          correctAnswer: 2,
          explanation: 'The primary goal is to open the door for further conversation, not to close a deal or provide exhaustive details.'
        }
      ]
    }
  }
};

export default function ElevatorSpeech() {
  return (
    <BaseLearningMaterial
      title="Elevator Speech"
      description="Master the art of compelling elevator pitches"
      difficulty="Beginner"
      duration="8 min"
      sessionsStructure={elevatorSpeechSessionsStructure}
      contentData={elevatorSpeechContent}
      navigationStyle="horizontal"
    />
  );
} 