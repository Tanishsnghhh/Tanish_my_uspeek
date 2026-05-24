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

// Anxiety Sessions Structure
const anxietySessionsStructure: DropdownItem[] = [
  {
    id: 'anxiety',
    title: 'Anxiety »',
    children: [
      { id: 'how-to-reduce-anxiety', title: 'How to reduce your anxiety while Speaking' }
    ]
  }
];

const anxietyContent: Record<string, LessonContentItem> = {
  'how-to-reduce-anxiety': {
    title: 'How to Reduce Your Anxiety While Speaking',
    description: 'Learn effective techniques to manage and reduce speaking anxiety',
    content: `Speaking anxiety is one of the most common fears people face. Whether it's presenting to a large audience, speaking in meetings, or having difficult conversations, anxiety can significantly impact your performance and confidence.`,
    objectives: [
      'Understand the nature and symptoms of speaking anxiety',
      'Learn practical techniques to reduce anxiety before and during speaking',
      'Develop breathing and relaxation strategies',
      'Master cognitive techniques for managing negative thoughts'
    ],
    keyPoints: [
      'Preparation is the foundation of confidence',
      'Breathing techniques can calm your nervous system',
      'Reframe anxiety as excitement and energy',
      'Practice regularly to build comfort and skill',
      'Some anxiety is normal and can be beneficial'
    ],
    videoUrl: 'https://www.youtube.com/embed/9KN5ArA5_js',
    quiz: {
      questions: [
        {
          id: 1,
          question: 'Which of the following is NOT a common physical symptom of speaking anxiety?',
          options: [
            'Rapid heartbeat',
            'Sweating',
            'Dry mouth',
            'Increased appetite'
          ],
          correctAnswer: 3,
          explanation: 'Increased appetite is not a common symptom of speaking anxiety. Common physical symptoms include rapid heartbeat, sweating, trembling, and dry mouth.'
        },
        {
          id: 2,
          question: 'What is the 4-7-8 breathing technique?',
          options: [
            'Breathe in for 4 seconds, hold for 7, exhale for 8',
            'Breathe in for 8 seconds, hold for 4, exhale for 7',
            'Breathe in for 7 seconds, hold for 8, exhale for 4',
            'Breathe in for 4 seconds, hold for 8, exhale for 7'
          ],
          correctAnswer: 0,
          explanation: 'The 4-7-8 technique involves breathing in for 4 seconds, holding for 7 seconds, and exhaling for 8 seconds. This helps activate the parasympathetic nervous system and reduce anxiety.'
        },
        {
          id: 3,
          question: 'What is the best approach to managing speaking anxiety?',
          options: [
            'Avoid speaking situations entirely',
            'Eliminate all anxiety completely',
            'Manage and channel anxiety effectively',
            'Rely solely on medication'
          ],
          correctAnswer: 2,
          explanation: 'The best approach is to manage and channel anxiety effectively. Some anxiety is normal and can actually enhance performance when managed properly.'
        }
      ]
    }
  }
};

export default function Anxiety() {
  return (
    <BaseLearningMaterial
      title="Anxiety"
      description="Learn to manage and reduce speaking anxiety"
      difficulty="Beginner"
      duration="15 min"
      sessionsStructure={anxietySessionsStructure}
      contentData={anxietyContent}
      navigationStyle="horizontal"
    />
  );
} 