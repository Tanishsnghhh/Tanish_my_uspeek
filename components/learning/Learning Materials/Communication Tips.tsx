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

// Communication Tips Sessions Structure
const communicationTipsSessionsStructure: DropdownItem[] = [
  {
    id: 'communication-tips',
    title: 'Communication Tips »',
    children: [
      { id: 'body-language-overview', title: 'Body Language Overview' },
      { id: 'vocal-tone-overview', title: 'Vocal Tone Overview' },
      { id: 'word-power-overview', title: 'Word Power Overview' }
    ]
  }
];

const communicationTipsContent: Record<string, LessonContentItem> = {
  'body-language-overview': {
    title: 'Body Language Overview',
    description: 'Master the art of nonverbal communication',
    content: `Body language is a powerful form of nonverbal communication that can convey more meaning than words alone. Understanding and mastering body language can significantly enhance your communication effectiveness.`,
    objectives: [
      'Understand the key elements of body language',
      'Learn to read and interpret nonverbal cues',
      'Master techniques for positive body language',
      'Avoid common body language mistakes'
    ],
    keyPoints: [
      'Body language conveys more than words',
      'Posture and stance show confidence',
      'Eye contact builds connection and trust',
      'Gestures should be natural and purposeful',
      'Personal space varies by culture and relationship'
    ],
    videoUrl: 'https://www.youtube.com/embed/ab7sLW4mR8g'
  },
  'vocal-tone-overview': {
    title: 'Vocal Tone Overview',
    description: 'Master the power of your voice in communication',
    content: `Your vocal tone is one of the most important aspects of communication. It can convey emotions, build rapport, and significantly impact how your message is received.`,
    objectives: [
      'Understand the key elements of vocal tone',
      'Learn techniques for improving voice quality',
      'Master pace, pitch, and volume control',
      'Develop emotional expression in speech'
    ],
    keyPoints: [
      'Vocal tone conveys emotions and meaning',
      'Vary pitch and pace to maintain interest',
      'Clear articulation improves understanding',
      'Proper breathing supports voice quality',
      'Practice and awareness improve vocal skills'
    ],
    videoUrl: 'https://www.youtube.com/embed/a_wQkysxZnA'
  },
  'word-power-overview': {
    title: 'Word Power Overview',
    description: 'Harness the power of words in effective communication',
    content: `The words you choose have a profound impact on your communication effectiveness. Understanding word power can help you convey your message more clearly, persuasively, and memorably.`,
    objectives: [
      'Understand the power of word choice',
      'Learn techniques for clear and persuasive communication',
      'Master vocabulary and language skills',
      'Develop storytelling and example usage'
    ],
    keyPoints: [
      'Word choice significantly impacts communication',
      'Clear, simple language is most effective',
      'Emotional impact comes from careful word selection',
      'Active voice creates more direct communication',
      'Stories and examples make messages memorable'
    ],
    videoUrl: 'https://www.youtube.com/embed/ERtYyllYU68'
  }
};

export default function CommunicationTips() {
  return (
    <BaseLearningMaterial
      title="Communication Tips"
      description="Master the fundamentals of effective communication"
      difficulty="Beginner"
      duration="15 min"
      sessionsStructure={communicationTipsSessionsStructure}
      contentData={communicationTipsContent}
      navigationStyle="horizontal"
    />
  );
} 