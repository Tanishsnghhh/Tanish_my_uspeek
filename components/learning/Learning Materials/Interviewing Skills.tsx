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

// Interviewing Skills Sessions Structure
const interviewingSkillsSessionsStructure: DropdownItem[] = [
  {
    id: 'interviewing-skills',
    title: 'Interviewing Skills »',
    children: [
      { id: 'how-to-prepare-for-interview', title: 'How to Prepare for an Interview' },
      { id: 'where-do-you-see-yourself', title: 'Where do you see yourself 3 years from Now' },
      { id: 'why-do-you-want-to-leave', title: 'Why do you want to Leave your Current Job' },
      { id: 'strengths-and-weaknesses', title: 'How to Answer what are your Strengths and Weaknesses' },
      { id: 'tell-me-about-yourself', title: 'Tell me about yourself' },
      { id: 'interview-tips', title: 'Interview tips' }
    ]
  }
];

const interviewingSkillsContent: Record<string, LessonContentItem> = {
  'how-to-prepare-for-interview': {
    title: 'How to Prepare for an Interview',
    description: 'Master the art of interview preparation',
    content: `Interview preparation is the key to success. The more prepared you are, the more confident and professional you'll appear. This comprehensive guide will help you prepare for any type of interview.`,
    objectives: [
      'Learn comprehensive interview preparation strategies',
      'Master company and role research techniques',
      'Develop effective response preparation methods',
      'Understand interview etiquette and best practices'
    ],
    keyPoints: [
      'Thorough research builds confidence and credibility',
      'Practice responses using the STAR method',
      'Prepare thoughtful questions for the interviewer',
      'Professional appearance and punctuality matter',
      'Authenticity and enthusiasm are key'
    ],
    videoUrl: 'https://www.youtube.com/embed/Hz0Q7faCXeM'
  },
  'where-do-you-see-yourself': {
    title: 'Where do you see yourself 3 years from Now?',
    description: 'Learn how to answer this common interview question effectively',
    content: `This question is designed to assess your career goals, ambition, and fit with the company's long-term plans. It's an opportunity to show that you're thoughtful about your career and that your goals align with the company's direction.`,
    objectives: [
      'Understand the purpose of this interview question',
      'Learn how to structure an effective response',
      'Master techniques for showing career progression',
      'Develop strategies for aligning with company goals'
    ],
    keyPoints: [
      'Show realistic career progression within the role',
      'Align your goals with company opportunities',
      'Demonstrate flexibility and growth mindset',
      'Be specific about skills and areas of interest',
      'Show long-term commitment to the company'
    ],
    videoUrl: 'https://www.youtube.com/embed/3zvfpdwjhtw'
  },
  'why-do-you-want-to-leave': {
    title: 'Why do you want to Leave your Current Job?',
    description: 'Master the art of answering this sensitive interview question',
    content: `This question can be tricky because you need to be honest while avoiding negative comments about your current employer. The key is to focus on positive reasons for seeking new opportunities.`,
    objectives: [
      'Learn how to answer this question positively',
      'Master techniques for focusing on growth opportunities',
      'Understand what to avoid when answering',
      'Develop effective response strategies'
    ],
    keyPoints: [
      'Focus on growth and new opportunities',
      'Avoid negative comments about current employer',
      'Frame response positively and professionally',
      'Show enthusiasm for the new role',
      'Demonstrate thoughtful career planning'
    ],
    videoUrl: 'https://www.youtube.com/embed/EUAlaylojoU'
  },
  'strengths-and-weaknesses': {
    title: 'How to Answer what are your Strengths and Weaknesses?',
    description: 'Learn to present your strengths and weaknesses effectively',
    content: `This classic interview question is designed to assess your self-awareness, honesty, and ability to reflect on your professional development. The key is to be authentic while presenting yourself in the best light.`,
    objectives: [
      'Learn how to identify and present relevant strengths',
      'Master techniques for addressing weaknesses positively',
      'Understand the importance of self-awareness',
      'Develop effective response strategies'
    ],
    keyPoints: [
      'Choose strengths relevant to the job requirements',
      'Provide specific examples and evidence',
      'Frame weaknesses as growth opportunities',
      'Show self-awareness and improvement efforts',
      'Demonstrate authenticity and honesty'
    ],
    videoUrl: 'https://www.youtube.com/embed/1EsbTU9MRuc'
  },
  'tell-me-about-yourself': {
    title: 'Tell me about yourself',
    description: 'Master the art of the personal introduction',
    content: `This is often the first question in an interview and sets the tone for the entire conversation. It's your opportunity to make a strong first impression and guide the interviewer toward your key strengths and relevant experience.`,
    objectives: [
      'Learn how to structure an effective personal introduction',
      'Master techniques for connecting experience to the role',
      'Understand the importance of professional focus',
      'Develop concise and impactful responses'
    ],
    keyPoints: [
      'Focus on professional background and experience',
      'Connect your background to the role requirements',
      'Keep response concise and relevant',
      'Show enthusiasm for the opportunity',
      'Demonstrate self-awareness and confidence'
    ],
    videoUrl: 'https://www.youtube.com/embed/5paQOLY2QHI'
  },
  'interview-tips': {
    title: 'Interview Tips',
    description: 'Essential tips for interview success',
    content: `Interview success requires preparation, practice, and the right mindset. These tips will help you navigate any interview situation with confidence and professionalism.`,
    objectives: [
      'Learn comprehensive interview preparation strategies',
      'Master communication and body language techniques',
      'Understand follow-up and reflection processes',
      'Avoid common interview mistakes'
    ],
    keyPoints: [
      'Thorough preparation builds confidence',
      'Professional appearance and punctuality matter',
      'Effective communication and body language are crucial',
      'Follow-up shows professionalism and interest',
      'Every interview is a learning opportunity'
    ],
    videoUrl: 'https://www.youtube.com/embed/jA9y8uCytYc'
  }
};

export default function InterviewingSkills() {
  return (
    <BaseLearningMaterial
      title="Interviewing Skills"
      description="Master the art of successful interviewing"
      difficulty="Intermediate"
      duration="25 min"
      sessionsStructure={interviewingSkillsSessionsStructure}
      contentData={interviewingSkillsContent}
      navigationStyle="horizontal"
    />
  );
} 