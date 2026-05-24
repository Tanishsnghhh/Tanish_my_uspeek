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

// Crucial Conversations Sessions Structure
const crucialConversationsSessionsStructure: DropdownItem[] = [
  {
    id: 'crucial-conversations',
    title: 'Crucial Conversations »',
    children: [
      { id: 'part-1', title: 'Crucial Conversation - Part 1' },
      { id: 'part-2', title: 'Crucial Conversation - Part 2' },
      { id: 'part-3', title: 'Crucial Conversation - Part 3' },
      { id: 'part-4', title: 'Crucial Conversation - Part 4' },
      { id: 'part-5', title: 'Crucial Conversation - Part 5' },
      { id: 'part-6', title: 'Crucial Conversation - Part 6' },
      { id: 'part-7', title: 'Crucial Conversation - Part 7' }
    ]
  }
];

const crucialConversationsContent: Record<string, LessonContentItem> = {
  'part-1': {
    title: 'Crucial Conversation - Part 1',
    description: 'Introduction to crucial conversations and their importance',
    content: `Crucial conversations are high-stakes discussions where opinions vary, emotions run strong, and the stakes are high. These conversations can make or break relationships, careers, and organizations.`,
    objectives: [
      'Understand what makes a conversation crucial',
      'Recognize the importance of handling crucial conversations well',
      'Identify common challenges and costs of avoidance',
      'Learn the framework for effective crucial conversations'
    ],
    keyPoints: [
      'Crucial conversations have high stakes and strong emotions',
      'Avoiding crucial conversations has significant costs',
      'Effective handling requires preparation and skill',
      'These conversations shape relationships and outcomes',
      'Everyone can learn to handle them better'
    ],
    videoUrl: 'https://www.youtube.com/embed/CSKiet5YkaE'
  },
  'part-2': {
    title: 'Crucial Conversation - Part 2',
    description: 'Preparing for crucial conversations',
    content: `Preparation is the foundation of successful crucial conversations. The more prepared you are, the more likely you are to achieve a positive outcome.`,
    objectives: [
      'Learn how to prepare for crucial conversations',
      'Master techniques for managing emotions and stories',
      'Understand how to create safety in conversations',
      'Develop strategies for staying focused on mutual purpose'
    ],
    keyPoints: [
      'Start with examining your own motives and intentions',
      'Separate facts from stories and assumptions',
      'Create safety through mutual purpose and respect',
      'Prepare your path and be ready to share it',
      'Stay focused on what you really want'
    ],
    videoUrl: 'https://www.youtube.com/embed/JsCBwZ7gcGY'
  },
  'part-3': {
    title: 'Crucial Conversation - Part 3',
    description: 'Managing emotions and staying in dialogue',
    content: `Emotions are often the biggest obstacle in crucial conversations. Learning to manage your emotions and stay in dialogue is essential for success.`,
    objectives: [
      'Understand how emotions work in conversations',
      'Learn techniques for managing your own emotions',
      'Master strategies for staying in dialogue',
      'Develop skills for handling emotional triggers'
    ],
    keyPoints: [
      'Emotions are created by the stories we tell ourselves',
      'Dialogue requires both speaking and listening',
      'Notice when you\'re going to silence or violence',
      'Use "I" statements and focus on facts',
      'Emotions are signals, not commands'
    ],
    videoUrl: 'https://www.youtube.com/embed/QK80_SbspDA'
  },
  'part-4': {
    title: 'Crucial Conversation - Part 4',
    description: 'Speaking persuasively, not abrasively',
    content: `Speaking persuasively in crucial conversations requires skill and finesse. You need to be able to express your views clearly and convincingly without alienating others.`,
    objectives: [
      'Learn how to share facts and stories effectively',
      'Master techniques for speaking tentatively',
      'Understand how to encourage others to share their views',
      'Develop skills for creating mutual understanding'
    ],
    keyPoints: [
      'Start with facts, then share your story',
      'Use tentative language and show openness',
      'Encourage others to share their perspectives',
      'Focus on understanding, not winning',
      'Use contrasting statements to clarify meaning'
    ],
    videoUrl: 'https://www.youtube.com/embed/HVRCGeENK_I'
  },
  'part-5': {
    title: 'Crucial Conversation - Part 5',
    description: 'Listening and understanding others',
    content: `Listening is perhaps the most important skill in crucial conversations. When you truly listen and understand others, you create the foundation for mutual understanding and resolution.`,
    objectives: [
      'Master active listening techniques',
      'Learn how to understand others\' perspectives',
      'Develop skills for asking effective questions',
      'Understand how to create safety through listening'
    ],
    keyPoints: [
      'Active listening requires full attention and engagement',
      'Understand others\' facts, stories, and emotions',
      'Ask questions to explore and clarify',
      'Reflect back what you\'re hearing',
      'Create safety through respect and understanding'
    ],
    videoUrl: 'https://www.youtube.com/embed/u_Wk59QWeS8'
  },
  'part-6': {
    title: 'Crucial Conversation - Part 6',
    description: 'Moving to action and decision-making',
    content: `The goal of crucial conversations is not just understanding, but action. You need to be able to move from dialogue to decisions and implementation.`,
    objectives: [
      'Learn different decision-making methods',
      'Understand how to choose the right approach',
      'Master techniques for building commitment',
      'Develop skills for implementation planning'
    ],
    keyPoints: [
      'Choose decision-making methods based on context',
      'Document decisions clearly and specifically',
      'Build commitment through understanding and involvement',
      'Plan implementation with specific steps and timelines',
      'Follow up to ensure successful execution'
    ],
    videoUrl: 'https://www.youtube.com/embed/UkAigHe4ZW0'
  },
  'part-7': {
    title: 'Crucial Conversation - Part 7',
    description: 'Putting it all together and practicing',
    content: `Now that you've learned the principles and techniques of crucial conversations, it's time to put them all together and practice. Mastery comes through application and experience.`,
    objectives: [
      'Integrate all the skills learned in the series',
      'Practice crucial conversations in real situations',
      'Avoid common pitfalls and mistakes',
      'Build a culture of effective dialogue'
    ],
    keyPoints: [
      'Mastery comes through practice and application',
      'Start with lower-stakes conversations',
      'Avoid common pitfalls and mistakes',
      'Build a culture of dialogue and trust',
      'Measure success and continue learning'
    ],
    videoUrl: 'https://www.youtube.com/embed/G6rDfv4NZ1s'
  }
};

export default function CrucialConversations() {
  return (
    <BaseLearningMaterial
      title="Crucial Conversations"
      description="Master the art of high-stakes dialogue"
      difficulty="Advanced"
      duration="35 min"
      sessionsStructure={crucialConversationsSessionsStructure}
      contentData={crucialConversationsContent}
      navigationStyle="horizontal"
    />
  );
} 