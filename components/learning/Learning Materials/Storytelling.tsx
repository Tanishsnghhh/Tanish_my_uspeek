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

// Storytelling Sessions Structure
const storytellingSessionsStructure: DropdownItem[] = [
  {
    id: 'storytelling',
    title: 'Storytelling »',
    children: [
      { id: 'introduction', title: 'Introduction' },
      { id: '5-elements', title: '5 Elements' },
      { id: 'great-team-stories', title: 'Great Team Stories' },
      { id: 'inspiration-stories', title: 'Inspiration Stories' },
      { id: 'customer-stories', title: 'Customer Stories' },
      { id: 'credibility-stories', title: 'Credibility Stories' },
      { id: 'influencing-stories', title: 'Influencing Stories' },
      { id: 'powerful-stories', title: 'Powerful Stories' },
      { id: 'interview-stories-part1', title: 'Interview Stories (Part I)' },
      { id: 'interview-stories-part2', title: 'Interview Stories (Part 2)' },
      { id: 'growth-stories', title: 'Growth Stories' },
      { id: 'funny-stories', title: 'Funny Stories' },
      { id: 'coaching-stories', title: 'Coaching Stories' },
      { id: 'conflict-stories', title: 'Conflict Stories' },
      { id: 'winning-stories', title: 'The Winning Stories' },
      { id: 'mentor-stories', title: 'Mentor Stories' }
    ]
  }
];

const storytellingContent: Record<string, LessonContentItem> = {
  'introduction': {
    title: 'Introduction to Storytelling',
    description: 'Learn the fundamentals of effective storytelling',
    content: `Storytelling is one of the most powerful communication tools available to us. It's how we connect, inspire, and influence others. In this module, you'll learn the essential elements of great storytelling and how to apply them in various professional contexts.

Key concepts you'll explore:
- The psychology behind why stories work
- Different types of stories for different purposes
- How to structure your stories for maximum impact
- Techniques for making your stories memorable and engaging

Why Storytelling Matters:
- Stories are 22 times more memorable than facts alone
- They create emotional connections with your audience
- They help people understand complex information
- They inspire action and change behavior
- They build trust and credibility

The Science Behind Stories:
- Stories activate multiple areas of the brain
- They release oxytocin, the "trust hormone"
- They create neural coupling between speaker and listener
- They help people remember information better
- They make abstract concepts concrete and relatable

In this course, you'll learn:
- The 5 essential elements of great stories
- How to craft stories for different audiences
- Techniques for delivering stories effectively
- Ways to adapt stories for various contexts
- Methods for practicing and improving your storytelling skills

Remember: Everyone has stories to tell. The key is learning how to tell them in a way that resonates with your audience.`,
    objectives: [
      'Understand the fundamental principles of storytelling',
      'Learn why stories are so effective for communication',
      'Identify the key elements that make stories memorable',
      'Begin developing your own storytelling skills'
    ],
    keyPoints: [
      'Stories are 22 times more memorable than facts alone',
      'They create emotional connections with audiences',
      'They activate multiple areas of the brain',
      'They help people understand complex information',
      'Everyone has stories worth telling'
    ],
    videoUrl: 'https://www.youtube.com/embed/604FKlAExOg'
  },
  '5-elements': {
    title: 'The 5 Elements of Great Stories',
    description: 'Master the essential components of effective storytelling',
    content: `Learn the five fundamental elements that make stories compelling and memorable: Character, Conflict, Plot, Setting, and Theme.`,
    objectives: [
      'Understand the five essential elements of great stories',
      'Learn how to incorporate each element effectively',
      'Practice balancing these elements in your own stories',
      'Develop skills for crafting compelling narratives'
    ],
    keyPoints: [
      'Character, conflict, plot, setting, and theme are the five essential elements',
      'Each element should support and enhance the others',
      'Balance is key - don\'t overemphasize any single element',
      'These elements work together to create engaging stories',
      'Practice is essential for mastering these elements'
    ],
    videoUrl: 'https://www.youtube.com/embed/FockJDPnyCc'
  },
  'great-team-stories': {
    title: 'Great Team Stories',
    description: 'Learn how to tell stories that build team cohesion and collaboration',
    content: `Discover how to craft stories that strengthen team bonds, build trust, and create a shared sense of purpose among team members.`,
    objectives: [
      'Learn different types of team stories and their purposes',
      'Understand how to craft stories that build team cohesion',
      'Develop skills for sharing team experiences effectively',
      'Create stories that strengthen team relationships'
    ],
    keyPoints: [
      'Team stories build cohesion, trust, and shared purpose',
      'Different types of stories serve different team needs',
      'Focus on collective experiences and individual contributions',
      'Make stories relevant to current team challenges',
      'Team stories should strengthen relationships'
    ],
    videoUrl: 'https://www.youtube.com/embed/p1SkuqraaPU' // No specific URL provided for Great Team Stories
  },
  'inspiration-stories': {
    title: 'Inspiration Stories',
    description: 'Learn how to craft stories that motivate and inspire others',
    content: `Master the art of creating stories that move people, change perspectives, and drive positive action through authentic and transformative narratives.`,
    objectives: [
      'Understand the elements that make stories inspiring',
      'Learn how to craft stories that motivate others',
      'Develop skills for sharing transformative experiences',
      'Create stories that drive positive action'
    ],
    keyPoints: [
      'Authenticity and vulnerability make stories more inspiring',
      'Show transformation and growth throughout the story',
      'Connect to larger purpose and meaning',
      'Build emotional connections with your audience',
      'End with hope and possibility'
    ],
    videoUrl: 'https://www.youtube.com/embed/NZw2Tp-lN8s'
  },
  'customer-stories': {
    title: 'Customer Stories',
    description: 'Learn how to tell compelling customer success stories',
    content: `Learn to craft powerful customer narratives that build trust, demonstrate value, and create emotional connections with your audience.`,
    objectives: [
      'Learn different types of customer stories and their purposes',
      'Understand how to structure compelling customer narratives',
      'Develop skills for gathering and sharing customer experiences',
      'Create stories that build trust and demonstrate value'
    ],
    keyPoints: [
      'Make the customer the hero of the story',
      'Use authentic voice and real testimonials',
      'Show clear before and after results',
      'Include specific details and examples',
      'Focus on customer success and achievement'
    ],
    videoUrl: 'https://www.youtube.com/embed/HSd_HtPkhvQ'
  },
  'credibility-stories': {
    title: 'Credibility Stories',
    description: 'Learn how to build trust and credibility through storytelling',
    content: `Develop stories that establish your expertise, build trust, and demonstrate your qualifications to your audience.`,
    objectives: [
      'Understand how to build credibility through storytelling',
      'Learn different types of credibility stories',
      'Develop skills for sharing expertise effectively',
      'Create stories that establish trust and authority'
    ],
    keyPoints: [
      'Be specific and include concrete details',
      'Show humility and acknowledge challenges',
      'Be authentic and honest about limitations',
      'Focus on value and benefits to others',
      'Build credibility through consistent storytelling'
    ],
    videoUrl: 'https://www.youtube.com/embed/5fpPnIDTR4E'
  },
  'influencing-stories': {
    title: 'Influencing Stories',
    description: 'Learn how to use stories to persuade and influence others',
    content: `Master the techniques of persuasive storytelling to change minds, shift perspectives, and drive action through compelling narratives.`,
    objectives: [
      'Understand the elements of effective influencing stories',
      'Learn techniques for persuasive storytelling',
      'Develop skills for changing minds and perspectives',
      'Create stories that drive action and change'
    ],
    keyPoints: [
      'Clearly identify problems and present solutions',
      'Use evidence and proof to support arguments',
      'Appeal to emotions and values',
      'Include clear calls to action',
      'Combine logic with emotional appeal'
    ],
    videoUrl: 'https://www.youtube.com/embed/g8GrevrmEP8'
  },
  'powerful-stories': {
    title: 'Powerful Stories',
    description: 'Learn how to craft stories that have maximum impact and resonance',
    content: `Create stories that move people deeply, create lasting impressions, and drive meaningful change through maximum impact techniques.`,
    objectives: [
      'Understand the characteristics of powerful stories',
      'Learn techniques for creating maximum impact',
      'Develop skills for crafting memorable narratives',
      'Create stories that resonate deeply with audiences'
    ],
    keyPoints: [
      'Connect to universal themes and human experiences',
      'Create emotional depth and authentic voice',
      'Use vivid imagery and sensory details',
      'Build to satisfying climax and resolution',
      'Focus on authenticity and genuine connection'
    ],
    videoUrl: 'https://www.youtube.com/embed/tJy4l7fTD7Q'
  },
  'interview-stories-part1': {
    title: 'Interview Stories (Part I)',
    description: 'Learn how to tell compelling stories during job interviews',
    content: `Master the art of sharing relevant experiences and achievements during job interviews using the STAR method and effective storytelling techniques.`,
    objectives: [
      'Understand different types of interview stories',
      'Learn the STAR method for structuring stories',
      'Develop skills for sharing relevant experiences',
      'Create stories that demonstrate your capabilities'
    ],
    keyPoints: [
      'Use the STAR method for structure',
      'Be specific and include measurable results',
      'Focus on relevant skills and experiences',
      'Show your problem-solving and leadership abilities',
      'Connect stories to the role requirements'
    ],
    videoUrl: 'https://www.youtube.com/embed/LPE0zzrPNWY'
  },
  'interview-stories-part2': {
    title: 'Interview Stories (Part 2)',
    description: 'Advanced techniques for crafting compelling interview narratives',
    content: `Advanced storytelling techniques for job interviews including emotional connection, quantifiable results, and handling difficult questions effectively.`,
    objectives: [
      'Learn advanced techniques for interview storytelling',
      'Develop skills for handling difficult questions',
      'Create stories that show character and values',
      'Master the art of connecting with interviewers'
    ],
    keyPoints: [
      'Build emotional connections with interviewers',
      'Include quantifiable results and metrics',
      'Show problem-solving and leadership abilities',
      'Demonstrate character and values',
      'Connect stories to role and company needs'
    ],
    videoUrl: 'https://www.youtube.com/embed/yG1eiBpQi8k'
  },
  'growth-stories': {
    title: 'Growth Stories',
    description: 'Learn how to tell stories about personal and professional development',
    content: `Share stories that demonstrate your ability to learn, adapt, and improve over time, showing your commitment to development and capacity for change.`,
    objectives: [
      'Understand the elements of effective growth stories',
      'Learn how to structure personal development narratives',
      'Develop skills for sharing learning experiences',
      'Create stories that demonstrate continuous improvement'
    ],
    keyPoints: [
      'Show clear starting point and transformation',
      'Include specific steps and milestones',
      'Demonstrate learning and adaptation',
      'Highlight ongoing development and growth',
      'Connect growth to positive impact'
    ],
    videoUrl: 'https://www.youtube.com/embed/AFMfHkXR76k'
  },
  'funny-stories': {
    title: 'Funny Stories',
    description: 'Learn how to use humor effectively in storytelling',
    content: `Master the art of using humor to build connections, relieve tension, and make your message more memorable while maintaining professionalism.`,
    objectives: [
      'Understand how to use humor effectively in storytelling',
      'Learn techniques for crafting funny narratives',
      'Develop skills for appropriate and engaging humor',
      'Create stories that entertain while informing'
    ],
    keyPoints: [
      'Focus on relatability and universal experiences',
      'Use appropriate timing and pacing',
      'Practice self-deprecation and humility',
      'Maintain professionalism and appropriateness',
      'Enhance your message with humor, don\'t distract from it'
    ],
    videoUrl: 'https://www.youtube.com/embed/lDI_VvuqFik'
  },
  'coaching-stories': {
    title: 'Coaching Stories',
    description: 'Learn how to use stories to coach and develop others',
    content: `Use storytelling to help others learn, grow, and develop by sharing relevant experiences and insights that provide context and guidance.`,
    objectives: [
      'Understand how to use stories for coaching and development',
      'Learn different types of coaching stories',
      'Develop skills for sharing relevant experiences',
      'Create stories that inspire and guide others'
    ],
    keyPoints: [
      'Make stories relevant to the coachee\'s situation',
      'Share authentic experiences and insights',
      'Provide actionable takeaways and lessons',
      'Inspire and motivate through storytelling',
      'Help others discover their own insights'
    ],
    // videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // No YouTube video available for coaching stories
  },
  'conflict-stories': {
    title: 'Conflict Stories',
    description: 'Learn how to tell stories about resolving conflicts and challenges',
    content: `Demonstrate your ability to handle difficult situations, work with others, and find constructive solutions through effective conflict resolution stories.`,
    objectives: [
      'Understand how to tell effective conflict resolution stories',
      'Learn different types of conflicts and approaches',
      'Develop skills for sharing challenging experiences',
      'Create stories that demonstrate problem-solving abilities'
    ],
    keyPoints: [
      'Show understanding of multiple perspectives',
      'Focus on resolution and positive outcomes',
      'Demonstrate emotional intelligence and professionalism',
      'Include specific details and measurable results',
      'Highlight learning and growth from conflicts'
    ],
    videoUrl: 'https://www.youtube.com/embed/NEA4FquAzL8'
  },
  'winning-stories': {
    title: 'The Winning Stories',
    description: 'Learn how to tell stories about success, achievement, and victory',
    content: `Celebrate success, achievement, and positive outcomes through stories that inspire others, build confidence, and demonstrate your capabilities.`,
    objectives: [
      'Understand how to tell compelling winning stories',
      'Learn different types of success narratives',
      'Develop skills for sharing achievements effectively',
      'Create stories that inspire and motivate others'
    ],
    keyPoints: [
      'Show clear goals, challenges, and results',
      'Include specific details and measurable outcomes',
      'Maintain humility and acknowledge others',
      'Connect wins to broader impact and value',
      'Inspire others while staying authentic'
    ],
    videoUrl: 'https://www.youtube.com/embed/qdQH2AsTiP8'
  },
  'mentor-stories': {
    title: 'Mentor Stories',
    description: 'Learn how to share stories about mentoring relationships and development',
    content: `Highlight the importance of guidance, support, and development in personal and professional growth through meaningful mentor stories.`,
    objectives: [
      'Understand how to tell effective mentor stories',
      'Learn different types of mentoring relationships',
      'Develop skills for sharing guidance experiences',
      'Create stories that honor mentorship and development'
    ],
    keyPoints: [
      'Show how mentoring relationships develop',
      'Include specific examples and outcomes',
      'Demonstrate impact and transformation',
      'Express gratitude and appreciation',
      'Highlight the lasting value of mentorship'
    ],
    videoUrl: 'https://www.youtube.com/embed/zHI8sIWuT9A'
  }
};

export default function Storytelling() {
  return (
    <BaseLearningMaterial
      title="Storytelling"
      description="Master the art of compelling storytelling for presentations"
      difficulty="Intermediate"
      duration="20 min"
      sessionsStructure={storytellingSessionsStructure}
      contentData={storytellingContent}
      navigationStyle="horizontal"
    />
  );
} 