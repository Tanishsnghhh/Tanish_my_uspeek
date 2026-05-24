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

// Confidence Sessions Structure
const confidenceSessionsStructure: DropdownItem[] = [
  {
    id: 'confidence',
    title: 'Confidence »',
    children: [
      { id: 'how-to-feel-confident', title: 'How to feel Confident while Communicating or Speaking' }
    ]
  }
];

const confidenceContent: Record<string, LessonContentItem> = {
  'how-to-feel-confident': {
    title: 'How to Feel Confident While Communicating or Speaking',
    description: 'Develop unshakeable confidence in your communication skills',
    content: `Confidence is the foundation of effective communication. When you feel confident, your message becomes more compelling, your presence more commanding, and your impact more significant.`,
    objectives: [
      'Understand the nature of confidence in communication',
      'Learn preparation techniques that build confidence',
      'Master physical and mental confidence-building strategies',
      'Develop a positive mindset for speaking situations'
    ],
    keyPoints: [
      'Confidence comes from thorough preparation',
      'Physical preparation enhances mental confidence',
      'Positive self-talk builds self-assurance',
      'Practice and experience develop confidence',
      'Authenticity is more important than perfection'
    ],
    videoUrl: 'https://www.youtube.com/embed/SmeCcRd-D5c',
    quiz: {
      questions: [
        {
          id: 1,
          question: 'What is the foundation of effective communication?',
          options: [
            'Perfect grammar',
            'Confidence',
            'Loud voice',
            'Complex vocabulary'
          ],
          correctAnswer: 1,
          explanation: 'Confidence is the foundation of effective communication. When you feel confident, your message becomes more compelling and your presence more commanding.'
        },
        {
          id: 2,
          question: 'Which of the following is NOT a confidence-building technique?',
          options: [
            'Power posing',
            'Deep breathing',
            'Positive self-talk',
            'Avoiding preparation'
          ],
          correctAnswer: 3,
          explanation: 'Avoiding preparation is not a confidence-building technique. Thorough preparation is actually one of the most important ways to build confidence.'
        },
        {
          id: 3,
          question: 'What should you focus on during a presentation?',
          options: [
            'Your nervousness',
            'Your message and audience',
            'Your mistakes',
            'Your appearance'
          ],
          correctAnswer: 1,
          explanation: 'Focus on your message and audience rather than your nervousness or mistakes. This helps you stay present and confident.'
        }
      ]
    }
  }
};

export default function Confidence() {
  return (
    <BaseLearningMaterial
      title="Confidence"
      description="Build unshakeable confidence in your communication"
      difficulty="Beginner"
      duration="15 min"
      sessionsStructure={confidenceSessionsStructure}
      contentData={confidenceContent}
      navigationStyle="horizontal"
    />
  );
} 