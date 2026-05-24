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

// Example Sessions Structure - Customize for your learning material
const exampleSessionsStructure: DropdownItem[] = [
  {
    id: 'main-topic',
    title: 'Main Topic »',
    children: [
      { id: 'session-1', title: 'Session 1: Introduction' },
      { id: 'session-2', title: 'Session 2: Core Concepts' },
      { id: 'session-3', title: 'Session 3: Advanced Techniques' },
      { id: 'session-4', title: 'Session 4: Practice and Application' }
    ]
  }
];

// Example Content Data - Customize for your learning material
const exampleContentData: Record<string, LessonContentItem> = {
  'session-1': {
    title: 'Session 1: Introduction',
    description: 'Introduction to the topic and key concepts',
    content: `This is the content for session 1. Replace this with your actual content.

Key points to cover:
- Point 1
- Point 2
- Point 3

Remember to structure your content in a way that's easy to read and understand.`,
    objectives: [
      'Understand the basic concepts',
      'Learn the fundamental principles',
      'Identify key areas for focus'
    ],
    keyPoints: [
      'Key point 1',
      'Key point 2',
      'Key point 3'
    ],
    videoUrl: 'https://www.youtube.com/embed/YOUR_VIDEO_ID' // Replace with actual YouTube URL
  },
  'session-2': {
    title: 'Session 2: Core Concepts',
    description: 'Deep dive into core concepts and techniques',
    content: `This is the content for session 2. Replace this with your actual content.

Core concepts to explore:
- Concept 1
- Concept 2
- Concept 3

Make sure to provide practical examples and real-world applications.`,
    objectives: [
      'Master core concepts',
      'Apply techniques in practice',
      'Develop practical skills'
    ],
    keyPoints: [
      'Core concept 1',
      'Core concept 2',
      'Core concept 3'
    ],
    videoUrl: 'https://www.youtube.com/embed/YOUR_VIDEO_ID' // Replace with actual YouTube URL
  }
  // Add more sessions as needed...
};

export default function ExampleLearningMaterial() {
  return (
    <BaseLearningMaterial
      title="Your Learning Material Title"
      description="Description of your learning material"
      difficulty="Beginner" // or "Intermediate" or "Advanced"
      duration="30 min"
      sessionsStructure={exampleSessionsStructure}
      contentData={exampleContentData}
    />
  );
} 