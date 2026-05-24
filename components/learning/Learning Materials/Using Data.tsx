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

// Using Data Sessions Structure
const usingDataSessionsStructure: DropdownItem[] = [
  {
    id: 'using-data',
    title: 'Using Data »',
    children: [
      { id: 'its-all-in-numbers', title: 'It\'s all in the numbers' }
    ]
  }
];

const usingDataContent: Record<string, LessonContentItem> = {
  'its-all-in-numbers': {
    title: 'It\'s All in the Numbers',
    description: 'Learn how to effectively use data and statistics in your presentations',
    content: `Data and statistics can be powerful tools for making your presentations more compelling and credible. However, using data effectively requires more than just presenting numbers - it requires storytelling, context, and clear communication.`,
    objectives: [
      'Understand the role of data in effective presentations',
      'Learn best practices for selecting and presenting data',
      'Master techniques for making data meaningful and engaging',
      'Avoid common pitfalls when using data'
    ],
    keyPoints: [
      'Data builds credibility and supports arguments',
      'Choose relevant and accurate data',
      'Present data with clear visuals and context',
      'Connect data to real-world implications',
      'Data should enhance, not replace, your message'
    ],
    videoUrl: 'https://www.youtube.com/embed/LZj53KmjhTM',
    quiz: {
      questions: [
        {
          id: 1,
          question: 'What is the primary purpose of using data in presentations?',
          options: [
            'To impress the audience with complex numbers',
            'To build credibility and support arguments',
            'To fill time in the presentation',
            'To confuse the audience'
          ],
          correctAnswer: 1,
          explanation: 'The primary purpose of using data in presentations is to build credibility and support arguments. Data provides evidence that makes your message more compelling and trustworthy.'
        },
        {
          id: 2,
          question: 'Which of the following is NOT a best practice for using data?',
          options: [
            'Choose relevant and accurate data',
            'Present data with clear visuals',
            'Provide context and comparisons',
            'Overwhelm with too much data'
          ],
          correctAnswer: 3,
          explanation: 'Overwhelming with too much data is not a best practice. You should select the most relevant data and present it clearly and meaningfully.'
        },
        {
          id: 3,
          question: 'What type of chart is best for showing trends over time?',
          options: [
            'Bar chart',
            'Line graph',
            'Pie chart',
            'Table'
          ],
          correctAnswer: 1,
          explanation: 'Line graphs are best for showing trends over time. They clearly display how values change across different time periods.'
        }
      ]
    }
  }
};

export default function UsingData() {
  return (
    <BaseLearningMaterial
      title="Using Data"
      description="Master the art of presenting data effectively"
      difficulty="Intermediate"
      duration="10 min"
      sessionsStructure={usingDataSessionsStructure}
      contentData={usingDataContent}
      navigationStyle="horizontal"
    />
  );
} 