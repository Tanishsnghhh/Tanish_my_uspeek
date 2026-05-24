'use client';

import { BaseLearningMaterial } from '@/components/learning/base-learning-material';

export default function StartLessonGlobalPage() {
  const globalSessionsStructure = [
    {
      id: 'global-learning',
      title: 'Learning Material »',
      children: [
        { id: 'introduction', title: 'Introduction' }
      ]
    }
  ];

  const globalContentData = {
    'introduction': {
      title: 'Introduction to Learning Material',
      description: 'Welcome to this comprehensive learning experience',
      content: `Welcome to this learning material! This course is designed to help you develop essential skills and knowledge in your chosen area.`,
      objectives: [
        'Understand the course structure and expectations',
        'Identify key learning objectives'
      ],
      keyPoints: [
        'Learning is a continuous process',
        'Practice is essential for skill development'
      ],
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
  };

  return (
    <BaseLearningMaterial
      title="Learning Material"
      description="Comprehensive learning experience for skill development"
      difficulty="Beginner"
      duration="60 min"
      sessionsStructure={globalSessionsStructure}
      contentData={globalContentData}
    />
  );
} 