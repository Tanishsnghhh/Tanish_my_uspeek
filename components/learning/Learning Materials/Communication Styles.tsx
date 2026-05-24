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

// Communication Styles Sessions Structure
const communicationStylesSessionsStructure: DropdownItem[] = [
  {
    id: 'communication-styles',
    title: 'Communication Styles »',
    children: [
      { id: 'passive-communication', title: 'Passive Communication Style' },
      { id: 'aggressive-communication', title: 'Aggressive Communication Style' },
      { id: 'assertive-communication', title: 'Assertive Communication Style' },
      { id: 'passive-aggressive-communication', title: 'Passive Aggressive Communication' }
    ]
  }
];

const communicationStylesContent: Record<string, LessonContentItem> = {
  'passive-communication': {
    title: 'Passive Communication Style',
    description: 'Understanding and recognizing passive communication patterns',
    content: `Passive communication is characterized by avoiding conflict, putting others' needs before your own, and failing to express your thoughts, feelings, and needs clearly.`,
    objectives: [
      'Understand the characteristics of passive communication',
      'Recognize passive communication patterns in yourself and others',
      'Identify the impact of passive communication',
      'Learn why people use passive communication'
    ],
    keyPoints: [
      'Passive communication avoids conflict and confrontation',
      'It often leads to resentment and unmet needs',
      'Fear and low self-esteem are common causes',
      'Recognizing patterns is the first step to change',
      'Passive communication can damage relationships'
    ],
    videoUrl: 'https://www.youtube.com/embed/LKv2GBUjEt0'
  },
  'aggressive-communication': {
    title: 'Aggressive Communication Style',
    description: 'Understanding and recognizing aggressive communication patterns',
    content: `Aggressive communication is characterized by dominating others, expressing needs and opinions at the expense of others, and using intimidation or manipulation to get what you want.`,
    objectives: [
      'Understand the characteristics of aggressive communication',
      'Recognize aggressive communication patterns',
      'Identify the impact of aggressive communication',
      'Learn why people use aggressive communication'
    ],
    keyPoints: [
      'Aggressive communication dominates and intimidates',
      'It damages relationships and creates conflict',
      'Fear and insecurity often drive aggressive behavior',
      'Short-term gains lead to long-term problems',
      'Recognizing patterns is essential for change'
    ],
    videoUrl: 'https://www.youtube.com/embed/T4ROHKFV2eA'
  },
  'assertive-communication': {
    title: 'Assertive Communication Style',
    description: 'Mastering assertive communication for healthy relationships',
    content: `Assertive communication is the healthiest and most effective communication style. It involves expressing your thoughts, feelings, and needs clearly and respectfully while also respecting the rights and needs of others.`,
    objectives: [
      'Understand the characteristics of assertive communication',
      'Learn techniques for assertive communication',
      'Recognize the benefits of assertive communication',
      'Develop skills for setting boundaries'
    ],
    keyPoints: [
      'Assertive communication respects both self and others',
      'Use "I" statements to express thoughts and feelings',
      'Clear, specific communication is more effective',
      'Active listening is essential for assertiveness',
      'Setting boundaries is part of healthy communication'
    ],
    videoUrl: 'https://www.youtube.com/embed/aWb1B9o1CIM'
  },
  'passive-aggressive-communication': {
    title: 'Passive Aggressive Communication',
    description: 'Understanding and addressing passive-aggressive communication patterns',
    content: `Passive-aggressive communication is a destructive pattern that combines elements of both passive and aggressive communication. It involves expressing negative feelings indirectly rather than openly addressing them.`,
    objectives: [
      'Understand passive-aggressive communication patterns',
      'Recognize passive-aggressive behavior in yourself and others',
      'Learn how to address passive-aggressive communication',
      'Develop strategies for healthier communication'
    ],
    keyPoints: [
      'Passive-aggressive communication is indirect and destructive',
      'It creates confusion and damages relationships',
      'Fear and lack of skills often drive this behavior',
      'Direct, assertive communication is the solution',
      'Addressing patterns requires self-awareness and practice'
    ],
    videoUrl: 'https://www.youtube.com/embed/8Rp3-mHXYAw'
  }
};

export default function CommunicationStyles() {
  return (
    <BaseLearningMaterial
      title="Communication Styles"
      description="Understand and master different communication styles"
      difficulty="Intermediate"
      duration="20 min"
      sessionsStructure={communicationStylesSessionsStructure}
      contentData={communicationStylesContent}
      navigationStyle="horizontal"
    />
  );
} 