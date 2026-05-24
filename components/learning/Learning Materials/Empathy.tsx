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

// Empathy Sessions Structure
const empathySessionsStructure: DropdownItem[] = [
  {
    id: 'empathy',
    title: 'Empathy »',
    children: [
      { id: 'conversational-skills', title: 'Conversational Skills' }
    ]
  }
];

const empathyContent: Record<string, LessonContentItem> = {
  'conversational-skills': {
    title: 'Conversational Skills',
    description: 'Master the art of empathetic conversations',
    content: `Empathy is the ability to understand and share the feelings of others. It's a crucial skill for building meaningful relationships, resolving conflicts, and creating positive connections with people.
`,
    objectives: [
      'Understand the different types of empathy',
      'Learn active listening techniques',
      'Master empathetic conversation skills',
      'Develop perspective-taking abilities'
    ],
    keyPoints: [
      'Empathy involves understanding and sharing feelings',
      'Active listening is the foundation of empathy',
      'Validating feelings creates connection and trust',
      'Perspective-taking helps build understanding',
      'Empathy is a skill that can be developed'
    ],
    videoUrl: 'https://www.youtube.com/embed/nH-iz2qPa74',
    quiz: {
      questions: [
        {
          id: 1,
          question: 'What is the primary purpose of empathy in conversations?',
          options: [
            'To solve problems quickly',
            'To understand and connect with others',
            'To give advice and solutions',
            'To change someone\'s mind'
          ],
          correctAnswer: 1,
          explanation: 'The primary purpose of empathy is to understand and connect with others, not to solve problems or give advice.'
        },
        {
          id: 2,
          question: 'Which of the following is NOT a type of empathy?',
          options: [
            'Cognitive empathy',
            'Emotional empathy',
            'Compassionate empathy',
            'Logical empathy'
          ],
          correctAnswer: 3,
          explanation: 'Logical empathy is not a recognized type of empathy. The three main types are cognitive, emotional, and compassionate empathy.'
        },
        {
          id: 3,
          question: 'What is the best way to show empathy in a conversation?',
          options: [
            'Offer solutions immediately',
            'Listen actively and validate feelings',
            'Share your own similar experiences',
            'Tell them to cheer up'
          ],
          correctAnswer: 1,
          explanation: 'The best way to show empathy is to listen actively and validate the person\'s feelings, rather than immediately offering solutions.'
        }
      ]
    }
  }
};

export default function Empathy() {
  return (
    <BaseLearningMaterial
      title="Empathy"
      description="Develop empathy skills for better interpersonal communication"
      difficulty="Beginner"
      duration="18 min"
      sessionsStructure={empathySessionsStructure}
      contentData={empathyContent}
      navigationStyle="horizontal"
    />
  );
} 