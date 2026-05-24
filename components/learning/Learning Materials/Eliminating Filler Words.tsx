'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle, 
  Play, 
  Star,
  Video,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'text' | 'quiz';
  isActive: boolean;
  isCompleted: boolean;
}

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
}

// Course Sessions Structure with hierarchical dropdown
const courseSessionsStructure: DropdownItem[] = [
  {
    id: 'filler-words',
    title: 'Filler Words »',
    children: [
      { 
        id: 'overview', 
        title: 'Overview',
        children: [
          { id: 'what-is-word-power', title: 'What is Word Power?' },
          { id: 'practice', title: 'Practice' },
          { id: 'word-power-video-examples', title: 'Word Power Video Examples' },
          { id: 'fun-activity', title: 'Fun Activity' },
          { id: 'quiz', title: 'Quiz' }
        ]
      },
      { 
        id: 'sentence-length', 
        title: 'Sentence Length',
        children: [
          { id: 'what-is-sentence-length', title: 'What is Sentence Length?' },
          { id: 'active-vs-passive-voice', title: 'What is Active vs Passive Voice?' },
          { id: 'sentence-length-practice-1', title: 'Practice' },
          { id: 'simple-vs-complex-words', title: 'What is Simple vs. Complex Words?' },
          { id: 'sentence-length-practice-2', title: 'Practice' },
          { id: 'redundant-words', title: 'What are Redundant Words?' },
          { id: 'sentence-length-practice-3', title: 'Practice' },
          { id: 'sentence-length-practice-4', title: 'Practice' },
          { id: 'sentence-length-fun-exercise', title: 'Fun Exercise' }
        ]
      },
      { 
        id: 'unique-repetitive-words', 
        title: 'Unique & Repetitive Words',
        children: [
          { id: 'what-are-unique-repetitive-words', title: 'What are unique and repetitive words?' },
          { id: 'unique-repetitive-quiz', title: 'Quiz' },
          { id: 'unique-repetitive-practice', title: 'Practice' }
        ]
      },
      { 
        id: 'pet-filler-words', 
        title: 'Pet and Filler Words',
        children: [
          { id: 'what-are-pet-filler-words', title: 'What are Pet and Filler Words?' },
          { id: 'pet-filler-fun-activity', title: 'Fun Activity' },
          { id: 'pet-filler-practice-1', title: 'Practice #1' },
          { id: 'pet-filler-practice-2', title: 'Practice #2' },
          { id: 'pet-filler-practice-3', title: 'Practice #3' }
        ]
      },
      { 
        id: 'key-words', 
        title: 'What are Key Words?',
        children: [
          { id: 'key-words-practice', title: 'Practice' },
          { id: 'key-words-exercise', title: 'Exercise for Key Words' },
          { id: 'key-words-videos', title: 'Videos on interviewing' },
          { id: 'key-words-quiz', title: 'Quiz' }
        ]
      },
      { 
        id: 'text-sentiment-emotion', 
        title: 'Text Sentiment & Emotion',
        children: [
          { id: 'what-is-text-sentiment-emotion', title: 'What is Text Sentiment and Emotion?' },
          { id: 'practice-text-sentiment', title: 'Practice Text Sentiment' },
          { id: 'practice-text-emotion', title: 'Practice Text Emotion' },
          { id: 'practice-writing-1', title: 'Practice Writing #1' },
          { id: 'practice-writing-2', title: 'Practice Writing #2' },
          { id: 'text-sentiment-fun-activity', title: 'Fun Activity' },
          { id: 'practice-writing-3', title: 'Practice Writing #3' },
          { id: 'powerful-word-video-examples', title: 'Powerful Word Video Examples' }
        ]
      },
      { 
        id: 'i-statements', 
        title: 'I Statements',
        children: [
          { id: 'what-are-i-statements', title: 'What are I statements?' },
          { id: 'i-statements-practice-1', title: 'Practice #1' },
          { id: 'i-statements-practice-2', title: 'Practice #2' },
          { id: 'i-statements-elevator-speech', title: 'I Statements Elevator Speech' }
        ]
      }
    ]
  }
];

// Eliminating Filler Words course content - Each section is completely independent
const fillerWordsContent: Record<string, LessonContentItem> = {
  'overview': {
    title: 'Overview',
    description: 'Introduction to filler words and communication analysis',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'what-is-word-power': {
    title: 'Overview',
    description: 'Overview Video on Word Power',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'practice': {
    title: 'Practice',
    description: 'Choose one out',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'word-power-video-examples': {
    title: 'YouTube Videos',
    description: 'Watch some well written famous speeches.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'fun-activity': {
    title: 'Word Power Fun Activity',
    description: '',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'quiz': {
    title: 'Homonym Quiz',
    description: 'Homonyms are words with the same meanings.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'sentence-length': {
    title: 'Sentence Length',
    description: 'Understanding optimal sentence length for effective communication',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'what-is-sentence-length': {
    title: 'Sentence Length',
    description: 'Video on Sentence Length',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'active-vs-passive-voice': {
    title: 'What is Active vs Passive Voice?',
    description: 'Understanding the difference between active and passive voice and when to use each',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'sentence-length-practice-1': {
    title: 'Practice Exercise',
    description: 'Convert Passive Voice to Active Voice',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'simple-vs-complex-words': {
    title: 'Complex vs. Simple Words',
    description: 'Video on Complex vs. Simple Words',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'sentence-length-practice-2': {
    title: 'Convert Complex Into Simple Words',
    description: 'Match the complex words below with a simple word.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'redundant-words': {
    title: 'Redundant Words',
    description: 'Video on Redundant Words',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'sentence-length-practice-3': {
    title: 'Fun Activity-Redundant Words',
    description: 'Remove Redundant Words',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'sentence-length-practice-4': {
    title: 'Practice Exercise Crisp Writing',
    description: 'Write a crisper sentence.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'sentence-length-fun-exercise': {
    title: 'Match Taglines',
    description: 'Match each company name to the correct company taglines.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'unique-repetitive-words': {
    title: 'Unique & Repetitive Words',
    description: 'Managing word variety and avoiding repetition in communication',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'what-are-unique-repetitive-words': {
    title: 'Unique and Repetitive Words',
    description: 'Video on Unique and Repetitive Words',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'unique-repetitive-quiz': {
    title: 'Quiz',
    description: 'Test your knowledge of unique and repetitive words concepts',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'unique-repetitive-practice': {
    title: 'Repetitive Words',
    description: 'Read the paragraph. The highlighted words in yellow are repetitive words. Rewrite the paragraph with synonyms and make it crisper.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'pet-filler-words': {
    title: 'Pet and Filler Words',
    description: 'Identifying and eliminating personal filler words and phrases',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'what-are-pet-filler-words': {
    title: 'Pet and Filler Words',
    description: 'Video on Pet and Filler Words',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'pet-filler-fun-activity': {
    title: 'Fun Activity',
    description: 'Engaging activities to practice identifying and eliminating pet and filler words',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'pet-filler-practice-1': {
    title: 'Practice #1',
    description: 'Record and upload your answer to the following question. You can upload a video from your computer or mobile:',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'pet-filler-practice-2': {
    title: 'Practice #2',
    description: 'Record and upload your answer to the following question. You can upload a video from your computer or mobile:',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'pet-filler-practice-3': {
    title: 'Practice #3',
    description: 'Record and upload your answer to the following question. You can upload a video from your computer or mobile:',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'key-words': {
    title: 'What are Key Words?',
    description: 'Understanding the importance of key words in effective communication',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'key-words-practice': {
    title: 'Key Words',
    description: 'Video on Key Words',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'key-words-exercise': {
    title: 'Key Words Exercise',
    description: 'Record and upload your answer to the following question. You can upload a video from your computer or mobile Describe your work experience :- ',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'key-words-videos': {
    title: 'Videos on interviewing',
    description: 'Watch videos to learn how to use key words effectively in interviews',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'key-words-quiz': {
    title: 'Quiz',
    description: 'Test your knowledge of key words concepts and techniques',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'text-sentiment-emotion': {
    title: 'Text Sentiment & Emotion',
    description: 'Understanding and conveying emotion in communication',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'what-is-text-sentiment-emotion': {
    title: 'Text Sentiment & Emotion',
    description: 'Video on Text Sentiment & Emotion',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'practice-text-sentiment': {
    title: 'Text Sentiment',
    description: 'This is an exercise to help you understand text sentiment.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'practice-text-emotion': {
    title: 'Text Emotion',
    description: 'This is an exercise to help you understand text emotion.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'practice-writing-1': {
    title: 'Write A Paragraph 1',
    description: '',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'practice-writing-2': {
    title: 'Write A Paragraph 2',
    description: '',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'text-sentiment-fun-activity': {
    title: 'Pick Better Phrase',
    description: 'Pick the more positive sounding sentence.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'practice-writing-3': {
    title: 'Write A Paragraph 3',
    description: '',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'powerful-word-video-examples': {
    title: 'Video Example',
    description: 'Watch an example video on powerful speeches.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'what-are-i-statements': {
    title: 'I Statements',
    description: 'Video on I Statements',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'i-statements-practice-1': {
    title: 'I Statements Exercise 1',
    description: 'Record and upload your answer to the following question. You can upload a video from your computer or mobile.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'i-statements-practice-2': {
    title: 'I Statements Exercise 2',
    description: 'Record and upload your answer to the following question. You can upload a video from your computer or mobile.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'i-statements-elevator-speech': {
    title: 'I Statements Elevator Speech?',
    description: '',
    content: '',
    objectives: [],
    keyPoints: []
  }
};

export default function EliminatingFillerWords() {
  const router = useRouter();
  
  // Initialize with "Overview" page
  const initialSession: Session = {
    id: 'overview',
    title: 'Overview',
    description: 'Introduction to filler words and communication analysis',
    duration: '5:00',
    type: 'text',
    isActive: true,
    isCompleted: false
  };
  
  const [selectedSession, setSelectedSession] = useState<Session>(initialSession);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['filler-words']));
  const [selectedDropdownItem, setSelectedDropdownItem] = useState<DropdownItem | null>({
    id: 'overview',
    title: 'Overview'
  });

  const handleBackToLessons = () => {
    router.push('/learning-lessons');
  };

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session);
    setIsSessionStarted(false);
    setIsSessionCompleted(false);
    setCurrentQuizQuestion(0);
    setQuizAnswers([]);
    setShowQuizResults(false);
  };

  const handleStartSession = () => {
    setIsSessionStarted(true);
  };

  const handleCompleteSession = () => {
    setIsSessionCompleted(true);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[currentQuizQuestion] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizQuestion < (content.quiz?.questions.length || 0) - 1) {
      setCurrentQuizQuestion(currentQuizQuestion + 1);
    } else {
      setShowQuizResults(true);
    }
  };

  const handleQuizSubmit = () => {
    setShowQuizResults(true);
  };

  const resetQuiz = () => {
    setCurrentQuizQuestion(0);
    setQuizAnswers([]);
    setShowQuizResults(false);
  };

  // Enhanced navigation function for next item
  const handleNextItem = () => {
    // Get the filler words section and its children
    const fillerWordsSection = courseSessionsStructure.find(item => item.id === 'filler-words');
    
    if (!fillerWordsSection || !fillerWordsSection.children) {
      console.log('Filler words section not found');
      return;
    }
    
    const children = fillerWordsSection.children;
    const currentItemId = selectedSession.id;
    
    // Find the current item index
    const currentIndex = children.findIndex(item => item.id === currentItemId);
    
    // Get the next item
    if (currentIndex !== -1 && currentIndex < children.length - 1) {
      const nextItem = children[currentIndex + 1];
      
      // Simulate clicking the next item
      handleDropdownItemClick(nextItem);
    } else {
      // If it's the last item, redirect to the main learning lessons page
      console.log('This is the last item in the list, redirecting to main lessons page');
      router.push('/learning-lessons');
    }
  };

  // Navigation function specifically for practice components
  const handleNextLesson = () => {
    // Get the filler words section and its children
    const fillerWordsSection = courseSessionsStructure.find(item => item.id === 'filler-words');
    
    if (!fillerWordsSection || !fillerWordsSection.children) {
      console.log('Filler words section not found');
      return;
    }
    
    const children = fillerWordsSection.children;
    const currentItemId = selectedSession.id;
    
    // Find the current item index
    const currentIndex = children.findIndex(item => item.id === currentItemId);
    
    // Get the next item
    if (currentIndex !== -1 && currentIndex < children.length - 1) {
      const nextItem = children[currentIndex + 1];
      
      // Simulate clicking the next item
      handleDropdownItemClick(nextItem);
    } else {
      // If it's the last item, redirect to the main learning lessons page
      console.log('This is the last item in the list, redirecting to main lessons page');
      router.push('/learning-lessons');
    }
  };

  // Reusable button component
  const ActionButton = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    className = '',
    disabled = false
  }: { 
    children: React.ReactNode; 
    onClick: () => void; 
    variant?: 'primary' | 'secondary' | 'success'; 
    className?: string;
    disabled?: boolean;
  }) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
    
    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-gray-600 hover:bg-gray-700 text-white",
      success: "bg-green-600 hover:bg-green-700 text-white"
    };
    
    return (
      <button 
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleDropdownItemClick = (item: DropdownItem) => {
    if (item.children && item.children.length > 0) {
      // If it has children, toggle the dropdown
      toggleItem(item.id);
    } else {
      // If it's a leaf item, set it as selected and find corresponding content
      setSelectedDropdownItem(item);
      
      // Find the corresponding session or create a virtual session for the content
      const contentKey = item.id;
      if (fillerWordsContent[contentKey]) {
        // Create a virtual session for the dropdown content
        const virtualSession: Session = {
          id: contentKey,
          title: fillerWordsContent[contentKey].title,
          description: fillerWordsContent[contentKey].description,
          duration: '5:00',
          type: contentKey === 'filler-words-quiz' ? 'quiz' : 'text',
          isActive: true,
          isCompleted: false
        };
        setSelectedSession(virtualSession);
        setIsSessionStarted(false);
        setIsSessionCompleted(false);
        setCurrentQuizQuestion(0);
        setQuizAnswers([]);
        setShowQuizResults(false);
      }
    }
  };

  const renderDropdownItem = (item: DropdownItem, level: number = 0) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <div
          className={`flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50 transition-colors duration-200 ${
            level > 0 ? 'ml-4' : ''
          }`}
          onClick={() => handleDropdownItemClick(item)}
        >
          <div className="flex items-center space-x-2">
            {hasChildren && (
              <div className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-blue-600" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-blue-600" />
                )}
              </div>
            )}
            <span className={`text-sm font-medium ${hasChildren ? 'text-blue-900' : 'text-gray-700'}`}>
              {item.title}
            </span>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="border-l border-blue-200 ml-4">
            {item.children!.map((child) => renderDropdownItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const content = fillerWordsContent[selectedSession.id as keyof typeof fillerWordsContent];
  
  if (!content) return null;

  // Independent components for each section
  const OverviewComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Welcome to the comprehensive guide on eliminating filler words and improving your communication skills.
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-gray-900">
                  This course will help you understand various aspects of effective communication including sentence structure, word choice, and emotional expression.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Understand the fundamentals of effective communication</li>
              <li>• Learn to identify and eliminate filler words</li>
              <li>• Master sentence structure and length optimization</li>
              <li>• Develop skills in word choice and repetition management</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Communication effectiveness starts with awareness</li>
              <li>• Sentence structure impacts clarity and engagement</li>
              <li>• Word choice influences message delivery</li>
              <li>• Practice leads to natural improvement</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const SentenceLengthComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <div className="text-left text-white">
              <h1 className="text-2xl font-bold">
                <span>Sentence Length</span>
              </h1>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-lg">
                <span className="text-green-500">Video on Sentence Length</span>
              </h3>
              
              {/* Video Section */}
              <div className="mt-6">
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <video 
                    width="100%" 
                    id="video02" 
                    controls 
                    controlsList="nodownload" 
                    style={{objectFit: 'cover'}}
                    className="w-full h-auto"
                  >
                    <source src="../AppVideo/WordPower/Word Power Lesson 1 of 7 (App).mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton 
                variant="success" 
                onClick={() => {
                  // Handle Done button click
                  console.log('Done clicked');
                }}
              >
                Done
              </ActionButton>
              <ActionButton 
                variant="primary" 
                onClick={handleNextLesson}
              >
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const UniqueRepetitiveWordsComponent = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="mt-6">
              <div className="col-lg-12 col-md-12 col-12 col-sm-12 mt-3">
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-10 h-10 text-gray-400" aria-hidden="true">
                        <polygon points="6 3 20 12 6 21 6 3"></polygon>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Unique and Repetitive Words Video</p>
                    <p className="text-gray-400 text-xs mt-2">Word Power Lesson 2 of 7 (App).mp4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton variant="success" onClick={() => { console.log('Done clicked'); }}>
              Done
            </ActionButton>
            <ActionButton variant="primary" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const PetFillerWordsComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Identifying and eliminating personal filler words and phrases
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-gray-900">
                  Pet words and filler phrases are personal speech patterns that can undermine your communication effectiveness. This section helps you identify your specific filler words and provides strategies for eliminating them.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Identify personal pet words and filler phrases</li>
              <li>• Learn strategies to eliminate filler words</li>
              <li>• Practice alternative communication patterns</li>
              <li>• Develop awareness of speech habits</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Everyone has personal filler words</li>
              <li>• Awareness is the first step to elimination</li>
              <li>• Replacement strategies are more effective than suppression</li>
              <li>• Consistent practice leads to lasting change</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const KeyWordsComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Understanding the importance of key words in effective communication
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-gray-900">
                  Key words are the essential elements that carry the core meaning of your message. This section explores how to identify and emphasize key words to make your communication more impactful and memorable.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Understand the concept of key words in communication</li>
              <li>• Learn to identify key words in your messages</li>
              <li>• Practice emphasizing key words effectively</li>
              <li>• Develop skills in message structuring</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Key words carry the core message meaning</li>
              <li>• Emphasis on key words increases impact</li>
              <li>• Strategic placement enhances message delivery</li>
              <li>• Practice helps develop natural emphasis patterns</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const TextSentimentEmotionComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Understanding and conveying emotion in communication
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-gray-900">
                  Emotional expression and sentiment play vital roles in effective communication. This section explores how to understand, identify, and convey emotions appropriately in your speech to create more engaging and authentic communication.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Understand the role of emotion in communication</li>
              <li>• Learn to identify emotional content in speech</li>
              <li>• Practice conveying emotions appropriately</li>
              <li>• Develop skills in emotional expression</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Emotion enhances message engagement and impact</li>
              <li>• Appropriate emotional expression builds connection</li>
              <li>• Emotional awareness improves communication effectiveness</li>
              <li>• Authentic emotion creates more memorable messages</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const IStatementsComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Using I statements for effective and assertive communication
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-gray-900">
                  I statements are powerful communication tools that help you express yourself clearly and assertively while maintaining positive relationships. This section teaches you how to construct and use I statements effectively.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Understand the structure and purpose of I statements</li>
              <li>• Learn to construct effective I statements</li>
              <li>• Practice using I statements in various contexts</li>
              <li>• Develop assertive communication skills</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• I statements promote clear and assertive communication</li>
              <li>• They help express feelings without blaming others</li>
              <li>• I statements maintain positive relationships</li>
              <li>• Practice makes I statements feel natural</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  // New Overview Subsection Components
  const WhatIsWordPowerComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content */}
          <div className="p-6">
            <div className="col-lg-12 col-md-12 col-12 col-sm-12 mt-3">
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Play className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Word Power Overview Video</p>
                  <p className="text-gray-400 text-xs mt-2">final-WordPowerLesson1-1uSpeekApp.mp4</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton variant="success" onClick={handleNextLesson}>
                Done
              </ActionButton>
              <ActionButton variant="primary" onClick={handleNextLesson}>
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PracticeComponent = () => {
    const [selectedOption, setSelectedOption] = useState('option1');
    const [textContent, setTextContent] = useState('');

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content */}
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">For Improve your Writing Skill.</h4>
            
            <div className="mt-6">
              <h4 className="mb-6 font-semibold text-red-500">
                Choose one out of two questions. Write a paragraph of 50 to 100 words.
              </h4>
              
              <div className="space-y-4 mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="practice-option"
                    value="option1"
                    checked={selectedOption === 'option1'}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-lg text-gray-900">Describe someone you admire and why?</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="practice-option"
                    value="option2"
                    checked={selectedOption === 'option2'}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-lg text-gray-900">If you have to convince your manager for something, how would you do it?</span>
                </label>
              </div>

              <div className="mt-6">
                <textarea
                  name="text"
                  minLength={20}
                  id="text"
                  rows={10}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Write your answer here (50-100 words)..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton variant="primary" onClick={() => console.log('Submit clicked')}>
                Submit
              </ActionButton>
              <ActionButton variant="primary" onClick={handleNextLesson}>
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WordPowerVideoExamplesComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mahatma Gandhi Video */}
              <div className="video-thumbnail">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="250" 
                    src="https://www.youtube.com/embed/5hS1YWtalPY" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full"
                  ></iframe>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">Mahatma Gandhi</h4>
                    <p className="text-gray-600 text-sm">Watch video & learn</p>
                  </div>
                </div>
              </div>

              {/* Nelson Mandela Video */}
              <div className="video-thumbnail">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="250" 
                    src="https://www.youtube.com/embed/qiHtROcjd6M" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full"
                  ></iframe>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">Nelson Mandela</h4>
                    <p className="text-gray-600 text-sm">Watch video & learn</p>
                  </div>
                </div>
              </div>

              {/* Oprah Winfrey Video */}
              <div className="video-thumbnail">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="250" 
                    src="https://www.youtube.com/embed/2yqSMHLL0Oc" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full"
                  ></iframe>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">Oprah Winfrey</h4>
                    <p className="text-gray-600 text-sm">Watch video & learn</p>
                  </div>
                </div>
              </div>

              {/* Chimamanda Ngozi Adichie Video */}
              <div className="video-thumbnail">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="250" 
                    src="https://www.youtube.com/embed/D9Ihs241zeg" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full"
                  ></iframe>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">Chimamanda Ngozi Adichie from Nigeria</h4>
                    <p className="text-gray-600 text-sm">Watch video & learn</p>
                  </div>
                </div>
              </div>

              {/* John F. Kennedy Video */}
              <div className="video-thumbnail">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="250" 
                    src="https://www.youtube.com/embed/th5A6ZQ28pE" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full"
                  ></iframe>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900">John F. Kennedy</h4>
                    <p className="text-gray-600 text-sm">Watch video & learn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton variant="success" onClick={handleNextLesson}>
                Done
              </ActionButton>
              <ActionButton variant="primary" onClick={handleNextLesson}>
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FunActivityComponent = () => {
    const [answers, setAnswers] = useState({
      'answer_id[1]': '',
      'answer_id[2]': '',
      'answer_id[3]': '',
      'answer_id[4]': '',
      'answer_id[5]': '',
      'answer_id[6]': '',
      'answer_id[7]': '',
      'answer_id[8]': ''
    });

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const movieQuotes = [
      {
        id: 1,
        quote: "Elementary, my dear Watson.",
        options: [
          "Dead Poets Society, 1989",
          "Dumbledore to Harry in The Sorcerer's Stone, 2002",
          "Finding Nemo, 2003",
          "Forrest Gump, 1994",
          "Snow White and the Seven Dwarfs, 1937",
          "The Adventures of Sherlock Holmes, 1939",
          "The Godfather Part II, 1974",
          "The Terminator, 1984"
        ]
      },
      {
        id: 2,
        quote: "Carpe diem. Seize the day, boys. Make your lives extraordinary.",
        options: [
          "Dead Poets Society, 1989",
          "Dumbledore to Harry in The Sorcerer's Stone, 2002",
          "Finding Nemo, 2003",
          "Forrest Gump, 1994",
          "Snow White and the Seven Dwarfs, 1937",
          "The Adventures of Sherlock Holmes, 1939",
          "The Godfather Part II, 1974",
          "The Terminator, 1984"
        ]
      },
      {
        id: 3,
        quote: "I'll be back.",
        options: [
          "Dead Poets Society, 1989",
          "Dumbledore to Harry in The Sorcerer's Stone, 2002",
          "Finding Nemo, 2003",
          "Forrest Gump, 1994",
          "Snow White and the Seven Dwarfs, 1937",
          "The Adventures of Sherlock Holmes, 1939",
          "The Godfather Part II, 1974",
          "The Terminator, 1984"
        ]
      },
      {
        id: 4,
        quote: "Magic Mirror on the wall, who is the fairest one of all?",
        options: [
          "Dead Poets Society, 1989",
          "Dumbledore to Harry in The Sorcerer's Stone, 2002",
          "Finding Nemo, 2003",
          "Forrest Gump, 1994",
          "Snow White and the Seven Dwarfs, 1937",
          "The Adventures of Sherlock Holmes, 1939",
          "The Godfather Part II, 1974",
          "The Terminator, 1984"
        ]
      },
      {
        id: 5,
        quote: "Keep your friends close, but your enemies closer.",
        options: [
          "Dead Poets Society, 1989",
          "Dumbledore to Harry in The Sorcerer's Stone, 2002",
          "Finding Nemo, 2003",
          "Forrest Gump, 1994",
          "Snow White and the Seven Dwarfs, 1937",
          "The Adventures of Sherlock Holmes, 1939",
          "The Godfather Part II, 1974",
          "The Terminator, 1984"
        ]
      },
      {
        id: 6,
        quote: "Just keep swimming.",
        options: [
          "Dead Poets Society, 1989",
          "Dumbledore to Harry in The Sorcerer's Stone, 2002",
          "Finding Nemo, 2003",
          "Forrest Gump, 1994",
          "Snow White and the Seven Dwarfs, 1937",
          "The Adventures of Sherlock Holmes, 1939",
          "The Godfather Part II, 1974",
          "The Terminator, 1984"
        ]
      },
      {
        id: 7,
        quote: "To the well-organized mind, death is but the next great adventure.",
        options: [
          "Dead Poets Society, 1989",
          "Dumbledore to Harry in The Sorcerer's Stone, 2002",
          "Finding Nemo, 2003",
          "Forrest Gump, 1994",
          "Snow White and the Seven Dwarfs, 1937",
          "The Adventures of Sherlock Holmes, 1939",
          "The Godfather Part II, 1974",
          "The Terminator, 1984"
        ]
      },
      {
        id: 8,
        quote: "My mama always said life was like a box of chocolates. You never know what you're gonna get.",
        options: [
          "Dead Poets Society, 1989",
          "Dumbledore to Harry in The Sorcerer's Stone, 2002",
          "Finding Nemo, 2003",
          "Forrest Gump, 1994",
          "Snow White and the Seven Dwarfs, 1937",
          "The Adventures of Sherlock Holmes, 1939",
          "The Godfather Part II, 1974",
          "The Terminator, 1984"
        ]
      }
    ];

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content */}
          <div className="p-6">
            <h3 className="mb-3 font-semibold">
              <span className="text-gray-900">The Movie Matchmaker</span>
            </h3>
            <p className="text-gray-700 mb-6">
              Here are lines from famous speeches. Correctly match the movie quote to the correct movie title.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="mb-4 font-semibold text-gray-900">Movie Quote</h4>
              </div>
              <div>
                <h4 className="mb-4 font-semibold text-gray-900">Movie Title</h4>
              </div>
            </div>

            <div className="space-y-6">
              {movieQuotes.map((item) => (
                <div key={item.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  <div className="flex items-center">
                    <span className="text-gray-900 font-semibold text-lg mr-3">{item.id}.</span>
                    <span className="text-gray-900 text-base">{item.quote}</span>
                  </div>
                  <div>
                    <select
                      id={`answer_id[${item.id}]`}
                      value={answers[`answer_id[${item.id}]` as keyof typeof answers]}
                      onChange={(e) => handleAnswerChange(`answer_id[${item.id}]`, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">SELECT</option>
                      {item.options.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton variant="success" onClick={() => console.log('Submit clicked', answers)}>
                Submit
              </ActionButton>
              <ActionButton variant="primary" onClick={handleNextLesson}>
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const QuizComponent = () => {
    const [answers, setAnswers] = useState({
      'answer_id[1]': '',
      'answer_id[2]': '',
      'answer_id[3]': ''
    });

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const resetQuiz = () => {
      setAnswers({
        'answer_id[1]': '',
        'answer_id[2]': '',
        'answer_id[3]': ''
      });
    };

    const quizQuestions = [
      {
        id: 1,
        question: "How many different uses does the word \"run\" have?",
        options: ["10", "50", "400", "200"]
      },
      {
        id: 2,
        question: "500 of the most commonly used words in English have an average of how many meanings per word?",
        options: ["28", "08", "14", "36"]
      },
      {
        id: 3,
        question: "In which of the following sentences, is the word draft used correctly?",
        options: [
          "If there's a space under your front door, there will be a draft in the house and it might get cold.",
          "A rough draft is a version that has not yet been revised.",
          "The final draft is the final version of it.",
          "A person can be drafted to serve in the military.",
          "All of the above."
        ]
      }
    ];

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content */}
          <div className="p-6">
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-4">Homonym Quiz</h4>
              <p className="text-gray-700 mb-4">
                This quiz will test your knowledge of homonyms and word meanings.
              </p>
              
              <div className="space-y-6">
                {quizQuestions.map((item) => (
                  <div key={item.id} className="p-4 bg-white rounded-lg border">
                    <p className="font-medium mb-3 text-gray-900">
                      Question {item.id}: {item.question}
                    </p>
                    <div className="space-y-2">
                      {item.options.map((option, index) => (
                        <label key={index} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`answer_id[${item.id}]`}
                            value={index + 1}
                            checked={answers[`answer_id[${item.id}]` as keyof typeof answers] === String(index + 1)}
                            onChange={(e) => handleAnswerChange(`answer_id[${item.id}]`, e.target.value)}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-gray-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-between">
                <button 
                  onClick={resetQuiz}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-white border border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  Reset Quiz
                </button>
                <ActionButton 
                  variant="primary" 
                  onClick={() => console.log('Submit clicked', answers)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Submit Quiz
                </ActionButton>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton variant="primary" onClick={handleNextLesson}>
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // New Sentence Length Subsection Components
  const WhatIsSentenceLengthComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Video Section */}
            <div className="mt-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <video 
                  width="100%" 
                  id="video02" 
                  controls 
                  controlsList="nodownload" 
                  style={{objectFit: 'cover'}}
                  className="w-full h-auto"
                >
                  <source src="../AppVideo/WordPower/Word Power Lesson 1 of 7 (App).mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton 
              variant="success" 
              onClick={() => {
                // Handle Done button click
                console.log('Done clicked');
              }}
            >
              Done
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const ActiveVsPassiveVoiceComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Video Section */}
            <div className="mt-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <video 
                  width="100%" 
                  id="video03" 
                  controls 
                  controlsList="nodownload" 
                  style={{objectFit: 'cover'}}
                  className="w-full h-auto"
                >
                  <source src="../AppVideo/WordPower/Word Power Lesson 2-2 (App).mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton 
              variant="success" 
              onClick={() => {
                // Handle Done button click
                console.log('Done clicked');
              }}
            >
              Done
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const SentenceLengthPractice1Component = () => {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [showAnswers, setShowAnswers] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const handleSubmit = () => {
      setIsSubmitted(true);
      setShowAnswers(true);
    };

    const handleDone = () => {
      // Handle Done button click
      console.log('Done clicked');
    };

    const questions = [
      {
        id: '1',
        question: 'The deliverable was completed by me in record time.',
        answer: 'I completed the deliverable in record time.'
      },
      {
        id: '2',
        question: 'Extensive training on the new safety procedures was required to be attended by the maintenance staff.',
        answer: 'The maintenance staff need to attend the new safety procedure training.'
      },
      {
        id: '3',
        question: 'The decision to replace Susan needs to be taken at the earliest to mitigate any surprises arising out of it and the same needs to be communicated to the business.',
        answer: 'I need a decision on Susan\'s replacement, and then, I will communicate it to the business.'
      },
      {
        id: '4',
        question: 'Payment term changes are disliked by the vendors.',
        answer: 'Vendors dislike payment term changes.'
      },
      {
        id: '5',
        question: 'It was not long before the machine learning code was mastered by him.',
        answer: 'He quickly mastered the machine learning code.'
      }
    ];

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Practice Questions */}
            <div className="space-y-8">
              {questions.map((q) => (
                <div key={q.id} className="border border-gray-200 rounded-lg p-6">
                  <h4 className="mb-4 font-semibold text-gray-900">
                    <span className="text-green-500">{q.id}. </span>
                    {q.question}
                  </h4>
                  
                  <div className="mb-4">
                    <textarea
                      id={`answer_id[${q.id}]`}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={5}
                      placeholder="Enter your answer here..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      disabled={isSubmitted}
                    />
                  </div>
                  
                  {showAnswers && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <span className="text-green-600 font-semibold">Answer: </span>
                      <span className="text-gray-900">{q.answer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="card-footer text-right bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              {!isSubmitted ? (
                <ActionButton 
                  variant="success" 
                  onClick={handleSubmit}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  Submit
                </ActionButton>
              ) : (
                <ActionButton 
                  variant="success" 
                  onClick={handleDone}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  Done
                </ActionButton>
              )}
              <ActionButton 
                variant="primary" 
                onClick={handleNextLesson}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SimpleVsComplexWordsComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Video Section */}
            <div className="mt-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <video 
                  width="100%" 
                  id="video04" 
                  controls 
                  controlsList="nodownload" 
                  style={{objectFit: 'cover'}}
                  className="w-full h-auto"
                >
                  <source src="../AppVideo/WordPower/Word Power Lesson 2-4 (App).mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton 
              variant="success" 
              onClick={() => {
                // Handle Done button click
                console.log('Done clicked');
              }}
            >
              Done
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const SentenceLengthPractice2Component = () => {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const handleSubmit = () => {
      setIsSubmitted(true);
      console.log('Answers submitted:', answers);
    };

    const questions = [
      { id: '1', complex: 'Commence', correctAnswer: 'Start' },
      { id: '2', complex: 'Endeavor', correctAnswer: 'Try' },
      { id: '3', complex: 'Interrogate', correctAnswer: 'Ask' },
      { id: '4', complex: 'Negligible', correctAnswer: 'Small' },
      { id: '5', complex: 'Ascertain', correctAnswer: 'Find Out' },
      { id: '6', complex: 'Render Services', correctAnswer: 'Serve' },
      { id: '7', complex: 'Accorded', correctAnswer: 'Given' },
      { id: '8', complex: 'It is requested that', correctAnswer: 'Please' },
      { id: '9', complex: 'Accompany', correctAnswer: 'Go With' },
      { id: '10', complex: 'Accrue', correctAnswer: 'Add' }
    ];

    const options = [
      'Add', 'Ask', 'Find Out', 'Given', 'Go With', 'Please', 'Serve', 'Small', 'Start', 'Try'
    ];

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Header Row */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-green-500">Complex</h4>
              </div>
              <div>
                <h4 className="font-semibold text-green-500">Simple</h4>
              </div>
            </div>
            
            {/* Questions */}
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="grid grid-cols-2 gap-6 items-center border-b border-gray-200 pb-4">
                  <div>
                    <span className="text-green-500 font-semibold">{q.id}. </span>
                    <span className="text-gray-900">{q.complex}</span>
                  </div>
                  <div>
                    <select
                      id={`answer_id[${q.id}]`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      disabled={isSubmitted}
                    >
                      <option value="">SELECT</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton 
              variant="success" 
              onClick={handleSubmit}
              disabled={isSubmitted}
            >
              Submit
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const RedundantWordsComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Video Section */}
            <div className="mt-6">
              <div className="bg-gray-100 rounded-lg overflow-hidden">
                <video 
                  width="100%" 
                  id="video05" 
                  controls 
                  controlsList="nodownload" 
                  style={{objectFit: 'cover'}}
                  className="w-full h-auto"
                >
                  <source src="../AppVideo/WordPower/Word Power Lesson 2-6 (App).mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={() => { console.log('Done clicked'); }}>
              Done
            </ActionButton>
            <ActionButton variant="primary" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const SentenceLengthPractice3Component = () => {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [currentTab, setCurrentTab] = useState(1);
    const [showResults, setShowResults] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const handleSubmit = () => {
      setIsSubmitted(true);
      setShowResults(true);
      console.log('Answers submitted:', answers);
    };

    const handleNextTab = () => {
      if (currentTab < 3) {
        setCurrentTab(currentTab + 1);
        setShowResults(false);
      }
    };

    const questions = [
      {
        id: '1',
        question: 'The wealthy millionaire introduced a famous celebrity at his party. At a sudden impulse, the celebrity performed which was an unexpected surprise for all. The guests proceeded forward to dinner after which they returned back to their homes.',
        answer: 'wealthy, millionaire, famous, celebrity, sudden, impulse, unexpected, surprise, proceeded, forward, returned, back'
      },
      {
        id: '2',
        question: 'Today this house looks like a safe haven. In its past history, it was known as a haunted house. Currently at this time, a family of six continues on to live here. While there were rumors of a ghost, it was never established as a true fact.',
        answer: 'safe, haven, past, history, Currently, at, this, time, continues, on, true, fact'
      },
      {
        id: '3',
        question: 'The fact that the vast majority of citizens like the present incumbent maybe over exaggerated. The future ahead as per the exit polls looks bleak. Unless the party does advance planning, he will need to leave from his office.',
        answer: 'vast, majority, present, incumbent, over, exaggerated, future, ahead, advance, planning, leave, from'
      }
    ];

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-6">Spot and tap the redundant words in the paragraph.</p>
            
            {/* Questions */}
            <div className="space-y-8">
              {questions.map((q) => (
                <div key={q.id} className={`${currentTab === parseInt(q.id) ? 'block' : 'hidden'}`}>
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="mb-4 font-semibold text-gray-900">
                      <span className="text-green-500">{q.id}. </span>
                      <span className="text-gray-900 leading-relaxed">{q.question}</span>
                    </h4>
                    
                    <div className="mb-4">
                      <textarea
                        id={`question_id${q.id}`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={5}
                        placeholder="Enter the redundant words you found..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={isSubmitted}
                      />
                    </div>
                    
                    {showResults && currentTab === parseInt(q.id) && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <h4 className="text-green-600 font-semibold mb-2">Correct Answer:</h4>
                        <p className="text-gray-900">{q.answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            {!isSubmitted ? (
              <ActionButton 
                variant="success" 
                onClick={handleSubmit}
              >
                Submit
              </ActionButton>
            ) : currentTab < 3 ? (
              <ActionButton 
                variant="primary" 
                onClick={handleNextTab}
              >
                Next Question
              </ActionButton>
            ) : (
              <ActionButton 
                variant="success" 
                onClick={() => { console.log('Done clicked'); }}
              >
                Done
              </ActionButton>
            )}
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const SentenceLengthPractice4Component = () => {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [currentTab, setCurrentTab] = useState(1);
    const [showResults, setShowResults] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const handleSubmit = () => {
      setIsSubmitted(true);
      setShowResults(true);
      console.log('Answers submitted:', answers);
    };

    const handleNextTab = () => {
      if (currentTab < 2) {
        setCurrentTab(currentTab + 1);
        setShowResults(false);
      }
    };

    const questions = [
      {
        id: '1',
        question: 'It is imperative that our current cost overruns be addressed by the responsible parties, namely, the project managers.',
        answer: 'Project managers should explain the reasons for cost overruns.'
      },
      {
        id: '2',
        question: 'Insofar as the submission of time cards is concerned, it is of the essence that all employees be punctual.',
        answer: 'Employees submit your time cards on time.'
      }
    ];

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Questions */}
            <div className="space-y-8">
              {questions.map((q) => (
                <div key={q.id} className={`${currentTab === parseInt(q.id) ? 'block' : 'hidden'}`}>
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="mb-4 font-semibold text-gray-900">
                      <span className="text-green-500">{q.id}. </span>
                      <span className="text-gray-900">{q.question}</span>
                    </h4>
                    
                    <div className="mb-4">
                      <textarea
                        id={`answer_id[${q.id}]`}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={5}
                        placeholder="Write your crisper sentence here..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={isSubmitted}
                      />
                    </div>
                    
                    {showResults && currentTab === parseInt(q.id) && (
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <h4 className="text-green-600 font-semibold mb-2">Answer:</h4>
                        <p className="text-gray-900">{q.answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            {!isSubmitted ? (
              <ActionButton 
                variant="success" 
                onClick={handleSubmit}
              >
                Submit
              </ActionButton>
            ) : currentTab < 2 ? (
              <ActionButton 
                variant="primary" 
                onClick={handleNextTab}
              >
                Next
              </ActionButton>
            ) : (
              <ActionButton 
                variant="success" 
                onClick={() => { console.log('Done clicked'); }}
              >
                Done
              </ActionButton>
            )}
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const SentenceLengthFunExerciseComponent = () => {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const handleSubmit = () => {
      setIsSubmitted(true);
      console.log('Answers submitted:', answers);
    };

    const questions = [
      { id: '1', company: 'Nike', correctAnswer: 'Just Do It' },
      { id: '2', company: 'Apple', correctAnswer: 'Think Different' },
      { id: '3', company: 'L\'Oreal', correctAnswer: 'Because you\'re worth it' },
      { id: '4', company: 'KFC', correctAnswer: 'It\'s finger lickin\' good' },
      { id: '5', company: 'Coca Cola', correctAnswer: 'Open Happiness' },
      { id: '6', company: 'McDonald\'s', correctAnswer: 'I\'m lovin\' it' },
      { id: '7', company: 'Google', correctAnswer: 'Do the right thing' },
      { id: '8', company: 'Mastercard', correctAnswer: 'There are some things money can\'t buy. For everything else, there\'s MasterCard.' },
      { id: '9', company: 'De Beers', correctAnswer: 'A Diamond Is Forever' },
      { id: '10', company: 'BMW', correctAnswer: 'Designed for Driving Pleasure' },
      { id: '11', company: 'Lay\'s', correctAnswer: 'Betcha Can\'t Eat Just One' }
    ];

    const options = [
      'A Diamond Is Forever',
      'Because you\'re worth it',
      'Betcha Can\'t Eat Just One',
      'Designed for Driving Pleasure',
      'Do the right thing',
      'I\'m lovin\' it',
      'It\'s finger lickin\' good',
      'Just Do It',
      'Open Happiness',
      'There are some things money can\'t buy. For everything else, there\'s MasterCard.',
      'Think Different'
    ];

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Header Row */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-green-500">Company</h4>
              </div>
              <div>
                <h4 className="font-semibold text-green-500">Taglines</h4>
              </div>
            </div>
            
            {/* Questions */}
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q.id} className="grid grid-cols-2 gap-6 items-center border-b border-gray-200 pb-4">
                  <div>
                    <span className="text-green-500 font-semibold">{q.id}. </span>
                    <span className="text-gray-900">{q.company}</span>
                  </div>
                  <div>
                    <select
                      id={`answer_id[${q.id}]`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      disabled={isSubmitted}
                    >
                      <option value="">SELECT</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton 
              variant="success" 
              onClick={handleSubmit}
              disabled={isSubmitted}
            >
              Submit
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  // New Unique & Repetitive Words Subsection Components
  const WhatAreUniqueRepetitiveWordsComponent = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="mt-6">
              <div className="col-lg-12 col-md-12 col-12 col-sm-12 mt-3">
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-10 h-10 text-gray-400" aria-hidden="true">
                        <polygon points="6 3 20 12 6 21 6 3"></polygon>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">Unique and Repetitive Words Video</p>
                    <p className="text-gray-400 text-xs mt-2">Word Power Lesson 2 of 7 (App).mp4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton variant="success" onClick={() => { console.log('Done clicked'); }}>
              Done
            </ActionButton>
            <ActionButton variant="primary" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const UniqueRepetitiveQuizComponent = () => {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const handleSubmit = () => {
      setIsSubmitted(true);
      console.log('Answers submitted:', answers);
    };

    const handleNextQuestion = () => {
      if (currentQuestion < 12) {
        setCurrentQuestion(currentQuestion + 1);
      }
    };

    const handlePreviousQuestion = () => {
      if (currentQuestion > 1) {
        setCurrentQuestion(currentQuestion - 1);
      }
    };

    const questions = [
      {
        id: '1',
        question: 'Underconfident',
        options: ['Peaceful', 'Apprehensive', 'Diffident', 'Upright', 'Touchy'],
        correctAnswer: 'Upright'
      },
      {
        id: '2',
        question: 'Develop',
        options: ['Flourish', 'Mature', 'Establish', 'Repress', 'Thrive'],
        correctAnswer: 'Repress'
      },
      {
        id: '3',
        question: 'Problem',
        options: ['Complication', 'Issue', 'Certainty', 'Quandary', 'Obstacle'],
        correctAnswer: 'Certainty'
      },
      {
        id: '4',
        question: 'Interesting',
        options: ['Disenchanting', 'Alluring', 'Amusing', 'Fascinating', 'Compelling'],
        correctAnswer: 'Disenchanting'
      },
      {
        id: '5',
        question: 'Exciting',
        options: ['Stimulating', 'Impressive', 'Intriguing', 'Appealing', 'Moderate'],
        correctAnswer: 'Moderate'
      },
      {
        id: '6',
        question: 'Idea',
        options: ['Belief', 'Perception', 'Intention', 'Theory', 'Discrete'],
        correctAnswer: 'Discrete'
      },
      {
        id: '7',
        question: 'People',
        options: ['Public', 'Gender', 'Society', 'Community', 'Folk'],
        correctAnswer: 'Gender'
      },
      {
        id: '8',
        question: 'Situation',
        options: ['Direction', 'Assignment', 'Location', 'Setting', 'Footing'],
        correctAnswer: 'Direction'
      },
      {
        id: '9',
        question: 'Possible',
        options: ['Probable', 'Viable', 'Ungettable', 'Conceivable', 'Imaginable'],
        correctAnswer: 'Ungettable'
      },
      {
        id: '10',
        question: 'Substantial',
        options: ['Generous', 'Meaningful', 'Sizable', 'Intermittent', 'Extraordinary'],
        correctAnswer: 'Intermittent'
      },
      {
        id: '11',
        question: 'Opportunity',
        options: ['Conveyance', 'Truth', 'Hope', 'Freedom', 'Space'],
        correctAnswer: 'Conveyance'
      },
      {
        id: '12',
        question: 'Small',
        options: ['Cramped', 'Microscopic', 'Minuscule', 'Through', 'Slight'],
        correctAnswer: 'Through'
      }
    ];

    const currentQ = questions.find(q => q.id === currentQuestion.toString());

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-lg">
              <span className="text-purple-600">Choose which word is NOT a Synonym.</span>
            </h3>
            <p className="text-gray-700 mb-6">
              A Synonym is a word or phrase that means exactly or nearly the same as another word or phrase. For example, shut is a synonym of close.
            </p>
            
            {/* Current Question */}
            {currentQ && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-4">Question {currentQ.id} of 12</h4>
                <p className="text-gray-700 mb-4">Choose which word is NOT a Synonym for: <strong>{currentQ.question}</strong></p>
                <div className="space-y-3">
                  {currentQ.options.map((option, index) => (
                    <label key={index} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        id={`answer_id[${currentQ.id}]_${index}`}
                        name={`answer_id[${currentQ.id}]`}
                        value={option}
                        checked={answers[currentQ.id] === option}
                        onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                        disabled={isSubmitted}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  {currentQuestion > 1 && (
                    <button 
                      onClick={handlePreviousQuestion}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:text-accent-foreground h-10 px-4 py-2 text-purple-600 border-purple-600 hover:bg-purple-50"
                    >
                      Previous Question
                    </button>
                  )}
                  {currentQuestion < 12 ? (
                    <button 
                      onClick={handleNextQuestion}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitted}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const UniqueRepetitivePracticeComponent = () => {
    const [answer, setAnswer] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);

    const handleAnswerChange = (value: string) => {
      setAnswer(value);
    };

    const handleSubmit = () => {
      setIsSubmitted(true);
      setShowAnswer(true);
      console.log('Answer submitted:', answer);
    };

    const handleDone = () => {
      console.log('Done clicked');
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="mb-6 font-semibold text-gray-900">
              <span style={{ color: '#72cda9' }}>1. </span>
              We are very <span style={{ color: '#feb500' }}>excited about</span> sharing the good news <span style={{ color: '#feb500' }}>about</span> our <span style={{ color: '#feb500' }}>innovation</span>. My colleague Tom is equally <span style={{ color: '#feb500' }}>excited</span> but unfortunately, <span style={{ color: '#feb500' }}>he</span> cannot be here with us today. <span style={{ color: '#feb500' }}>He</span> is the key driver behind <span style={{ color: '#feb500' }}>innovation</span>.
            </h4>
            
            <div className="mb-4">
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                rows={5} 
                value={answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={isSubmitted}
                placeholder="Rewrite the paragraph with synonyms and make it crisper..."
              />
            </div>
            
            {showAnswer && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <span className="font-semibold text-green-800">Answer: </span>
                <span className="text-gray-700">
                  We are very excited about sharing the good news on our innovation. My colleague Tom is equally elated but unfortunately, cannot be here with us today. He is the key driver behind transformation.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            {!isSubmitted ? (
              <ActionButton variant="success" onClick={handleSubmit}>
                Submit
              </ActionButton>
            ) : (
              <ActionButton variant="success" onClick={handleDone}>
                Done
              </ActionButton>
            )}
            <ActionButton variant="primary" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  // New Pet and Filler Words Subsection Components
  const WhatArePetFillerWordsComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content Section */}
          <div className="p-6">
            <div className="mb-6">
              {/* Video Section */}
              <div className="mt-6">
                <div className="bg-gray-100 rounded-lg overflow-hidden">
                  <video 
                    width="100%" 
                    id="video07" 
                    controls 
                    controlsList="nodownload" 
                    style={{objectFit: 'cover'}}
                    className="w-full h-auto"
                  >
                    <source src="../AppVideo/WordPower/Word Power Lesson 3-7 (App).mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton 
                variant="success" 
                onClick={() => {
                  // Handle Done button click
                  console.log('Done clicked');
                }}
              >
                Done
              </ActionButton>
              <ActionButton 
                variant="primary" 
                onClick={handleNextLesson}
              >
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PetFillerFunActivityComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Engaging activities to practice identifying and eliminating pet and filler words
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-gray-900">
                  Learning should be fun! This section provides engaging activities and interactive exercises that make practicing pet and filler word identification enjoyable while reinforcing your learning.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Engage in interactive pet word identification activities</li>
              <li>• Practice filler word elimination through games</li>
              <li>• Reinforce learning through enjoyable exercises</li>
              <li>• Develop skills through playful practice</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Fun activities enhance learning retention</li>
              <li>• Interactive exercises improve engagement</li>
              <li>• Game-like scenarios improve retention</li>
              <li>• Enjoyable practice leads to better results</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const PetFillerPractice1Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith('video/')) {
        setSelectedFile(file);
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
    };

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content Section */}
          <div className="p-6">
            <div className="mt-4">
              <div className="mt-6">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-900">Describe your dream holiday.</h4>
                </div>

                {/* Video Upload Section */}
                <div className="card-body">
                  <div className="row">
                    <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                      <input id="videoType" type="hidden" value="Interview" />
                      <input id="jobRole" type="hidden" value="null" />
                      <input 
                        ref={fileInputRef}
                        id="thefiles" 
                        type="file" 
                        name="files" 
                        accept=".mp4, .mov" 
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <div className="ff_fileupload_wrap">
                        <div className="ff_fileupload_dropzone_wrap">
                          <button 
                            className="ff_fileupload_dropzone w-full p-12 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors h-40" 
                            type="button" 
                            aria-label="Browse, drag-and-drop, or paste files to upload"
                            onClick={handleButtonClick}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                          >
                            {isUploading ? (
                              <div className="flex flex-col items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                <p className="text-lg font-medium text-gray-600">Uploading...</p>
                              </div>
                            ) : selectedFile ? (
                              <div className="flex flex-col items-center justify-center h-full">
                                <p className="text-lg font-medium text-green-600 mb-2">✓ File Selected</p>
                                <p className="text-sm text-gray-500">{selectedFile.name}</p>
                              </div>
                            ) : (
                              <p className="text-lg font-medium text-gray-600">Upload Video</p>
                            )}
                          </button>
                          <div className="ff_fileupload_dropzone_tools"></div>
                        </div>
                        <table className="ff_fileupload_uploads"></table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {isUploading && (
                    <div className="progress progress-lg mt-4">
                      <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-full h-4 bg-blue-600 rounded-full">
                        <span className="text-white text-sm">Please Wait...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton 
                variant="primary" 
                onClick={handleNextLesson}
              >
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PetFillerPractice2Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith('video/')) {
        setSelectedFile(file);
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
    };

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content Section */}
          <div className="p-6">
            <div className="mb-6">
              <div className="mt-6">
                <div className="col-xl-12 col-lg-12 col-md-12">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">
                    How would others describe you?
                  </h4>
                </div>

                {/* Video Upload Section */}
                <div className="card-body">
                  <div className="row">
                    <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                      <input id="videoType" type="hidden" value="General" />
                      <input id="jobRole" type="hidden" value="" />
                      <input 
                        ref={fileInputRef}
                        id="thefiles" 
                        type="file" 
                        name="files" 
                        accept=".mp4, .mov" 
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <div className="ff_fileupload_wrap">
                        <div className="ff_fileupload_dropzone_wrap">
                          <button 
                            className="ff_fileupload_dropzone w-full p-12 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors h-40" 
                            type="button" 
                            aria-label="Browse, drag-and-drop, or paste files to upload"
                            onClick={handleButtonClick}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                          >
                            {isUploading ? (
                              <div className="flex flex-col items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                <p className="text-lg font-medium text-gray-600">Uploading...</p>
                              </div>
                            ) : selectedFile ? (
                              <div className="flex flex-col items-center justify-center h-full">
                                <p className="text-lg font-medium text-green-600 mb-2">✓ File Selected</p>
                                <p className="text-sm text-gray-500">{selectedFile.name}</p>
                              </div>
                            ) : (
                              <p className="text-lg font-medium text-gray-600">Upload Video</p>
                            )}
                          </button>
                          <div className="ff_fileupload_dropzone_tools"></div>
                        </div>
                        <table className="ff_fileupload_uploads"></table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {isUploading && (
                    <div className="progress progress-lg mt-4">
                      <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-full h-4 bg-blue-600 rounded-full">
                        <span className="text-white text-sm">Please Wait...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton 
                variant="primary" 
                onClick={handleNextLesson}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PetFillerPractice3Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith('video/')) {
        setSelectedFile(file);
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
    };

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content Section */}
          <div className="p-6">
            <form id="addForm" autoComplete="off">
              <input type="hidden" id="user_id" value="3014" name="user_id" />
              <div className="">
                <div className="row mt-6">
                  <div className="col-xl-12 col-lg-12 col-md-12">
                    <h4 className="text-lg font-semibold text-gray-900">What is your favorite movie and why?</h4>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                        <input id="videoType" type="hidden" value="General" />
                        <input id="jobRole" type="hidden" value="" />
                        <input 
                          ref={fileInputRef}
                          id="thefiles" 
                          type="file" 
                          name="files" 
                          accept=".mp4, .mov" 
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <div className="ff_fileupload_wrap">
                          <div className="ff_fileupload_dropzone_wrap">
                            <button 
                              className="ff_fileupload_dropzone w-full p-12 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors h-40" 
                              type="button" 
                              aria-label="Browse, drag-and-drop, or paste files to upload"
                              onClick={handleButtonClick}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                            >
                              {isUploading ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                  <p className="text-lg font-medium text-gray-600">Uploading...</p>
                                </div>
                              ) : selectedFile ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <p className="text-lg font-medium text-green-600 mb-2">✓ File Selected</p>
                                  <p className="text-sm text-gray-500">{selectedFile.name}</p>
                                </div>
                              ) : (
                                <p className="text-lg font-medium text-gray-600">Upload Video</p>
                              )}
                            </button>
                            <div className="ff_fileupload_dropzone_tools"></div>
                          </div>
                          <table className="ff_fileupload_uploads"></table>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="progress progress-lg mt-4">
                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-full h-4 bg-blue-600 rounded-full">
                          <span className="text-white text-sm">Please Wait...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Section */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton 
                variant="primary" 
                onClick={handleNextLesson}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // New Key Words Subsection Components
  const KeyWordsPracticeComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content Section */}
          <div className="p-6">
            <form id="addForm" autoComplete="off">
              <input type="hidden" id="user_id" value="3014" name="user_id" />
              <div className="">
                <div className="col-lg-12 col-md-12 col-12 col-sm-12 mt-3">
                  <h4 className="mb-6 font-weight-semibold">
                  </h4>
                  <video 
                    width="100%" 
                    id="video08" 
                    controls 
                    controlsList="nodownload" 
                    style={{objectFit: 'cover'}}
                    className="w-full h-auto"
                  >
                    <source src="../AppVideo/WordPower/KeywordsuSpeekApp.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <br /><br />
                </div>
              </div>
            </form>
          </div>

          {/* Footer Section */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton 
                variant="success" 
                onClick={() => {
                  // Handle Done button click
                  console.log('Done clicked');
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Done
              </ActionButton>
              <ActionButton 
                variant="primary" 
                onClick={handleNextLesson}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const KeyWordsExerciseComponent = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedJobRole, setSelectedJobRole] = useState('Account Executive');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith('video/')) {
        setSelectedFile(file);
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
        }, 2000);
      }
    };

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
    };

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    const jobRoles = [
      'Account Executive', 'Actuary', 'Administrative Assistant', 'Advertising', 'Aerospace Engineering',
      'Anesthesiologist', 'Anthropology', 'Application Developer', 'Architect', 'Artist', 'Athletic Trainer',
      'Attorney', 'Auditor', 'Banking', 'Biomedical Engineering', 'Bookkeeper', 'Brand Manager', 'Business Manager',
      'Business Consultant', 'Business Operations Manager', 'Carpenter', 'Certified Public Accountant', 'Chef',
      'Chemical Engineering', 'Chemist', 'Civil Engineer', 'Civil Service', 'Compliance Officer', 'Computer Science',
      'Computer Engineering', 'Software Engineering', 'Software Developer', 'Web Developer', 'Web Programmer',
      'Cosmetologist', 'Creative Designer', 'Criminal Justice', 'Customer Service Representative', 'Data Warehouse Developer',
      'Dental Hygienist', 'Dietitian', 'Doctor', 'Economics', 'Editor', 'Electrical Engineering', 'Electrician',
      'Entrepreneur', 'Event Planner', 'Financial Advisor', 'Financial Analyst', 'Flight Attendant', 'Graphic Designer',
      'Hospitality', 'Human Resources', 'Image Consultant', 'Industrial Engineering', 'Information Security Analyst',
      'Information Systems and Technology', 'Insurance', 'Interior Designer', 'Inventory Controller', 'Journalism',
      'Law/Lawyer/Legal Affairs/Legal Advisors', 'Lab Technician', 'Loan Officer', 'Logistics', 'Management/Management Consultant/Manufacturing & Operations Management',
      'Manufacturing & Operations Management', 'Marketing/Market Research Analyst', 'Mechanical Engineering', 'Network Architect',
      'Network Engineer', 'Non-Profit management', 'Nuclear Engineering', 'Nurse Practitioner', 'Nursing', 'Nutritionist',
      'Operations Director', 'Operations Research Analyst', 'Ophthalmologist', 'Optician', 'Optometrist', 'Orthodontist',
      'Personal Trainer', 'Petroleum Engineering', 'Pharmaceutical Sales Representative/Pharmacist', 'Pharmacy Technician',
      'Photographer', 'Physical Therapist', 'Physician Assistant', 'Pilot', 'Production Manager', 'Project Manager',
      'Property Management', 'Public Relations', 'Quality Engineer', 'Radiologist', 'Real Estate Agent/Real Estate Executive/Real Estate Sales Persons',
      'Receptionist', 'Restaurant Manager', 'Retail', 'Sales Representative', 'Security Officer', 'Surgeon', 'Surveyor',
      'Systems Analyst', 'Teaching', 'Technical Support', 'Transportation/Warehouse and Distribution', 'Travel Agent',
      'Volunteer Coordinator', 'Veterinarian', 'Veterinary Assistant'
    ];

    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Content Section */}
          <div className="p-6">
            <form id="addForm" autoComplete="off">
              <input type="hidden" id="user_id" value="3014" name="user_id" />
              <div className="">
                <div className="row mt-6">
                  <div className="col-xl-12 col-lg-12 col-md-12">
                    {/* Job Role Selection */}
                    <div className="mt-6 mb-4">
                      <label className="block text-lg font-semibold text-gray-900 mb-2">
                        <strong>Select Job Role</strong>
                      </label>
                      <select
                        name="jobRole"
                        id="jobRole"
                        value={selectedJobRole}
                        onChange={(e) => setSelectedJobRole(e.target.value)}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {jobRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Video Upload Section */}
                  <div className="card-body">
                    <div className="row">
                      <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                        <input id="videoType" type="hidden" value="Interview" />
                        <input 
                          ref={fileInputRef}
                          id="thefiles" 
                          type="file" 
                          name="files" 
                          accept=".mp4, .mov" 
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <div className="ff_fileupload_wrap">
                          <div className="ff_fileupload_dropzone_wrap">
                            <button 
                              className="ff_fileupload_dropzone w-full p-12 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors h-40" 
                              type="button" 
                              aria-label="Browse, drag-and-drop, or paste files to upload"
                              onClick={handleButtonClick}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                            >
                              {isUploading ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                  <p className="text-lg font-medium text-gray-600">Uploading...</p>
                                </div>
                              ) : selectedFile ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                  <p className="text-lg font-medium text-green-600 mb-2">✓ File Selected</p>
                                  <p className="text-sm text-gray-500">{selectedFile.name}</p>
                                </div>
                              ) : (
                                <p className="text-lg font-medium text-gray-600">Upload Video</p>
                              )}
                            </button>
                            <div className="ff_fileupload_dropzone_tools"></div>
                          </div>
                          <table className="ff_fileupload_uploads"></table>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="progress progress-lg mt-4">
                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-full h-4 bg-blue-600 rounded-full">
                          <span className="text-white text-sm">Please Wait...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Section */}
          <div className="bg-white px-6 py-4">
            <div className="flex justify-end space-x-4">
              <ActionButton 
                variant="primary" 
                onClick={handleNextLesson}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next Lesson
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const KeyWordsVideosComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Watch videos to learn how to use key words effectively in interviews
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-gray-900">
                  Video content is a powerful way to learn key words usage in real interview scenarios. These videos demonstrate effective techniques and provide practical examples of how to incorporate key words in professional communication.
                </p>
              </div>
            </div>
          </div>
          
          {/* Video Placeholder */}
          <div className="mb-6">
            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Play className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Key Words in Interview Videos</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Observe key words usage in real interviews</li>
              <li>• Learn effective interview communication techniques</li>
              <li>• Understand key word placement strategies</li>
              <li>• Apply observed techniques to your own interviews</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Video examples provide real-world context</li>
              <li>• Interview scenarios show practical application</li>
              <li>• Visual learning enhances understanding</li>
              <li>• Expert demonstrations show best practices</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const KeyWordsQuizComponent = () => {
    return (
      <div className="mt-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Test your knowledge of key words concepts and techniques
            </h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-3">
                <p className="text-gray-900">
                  Challenge yourself with this quiz to test your understanding of key words concepts, usage techniques, and effective communication strategies you've learned throughout this section.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-4">Key Words Quiz</h4>
            <p className="text-gray-700 mb-4">
              This quiz will test your knowledge of key words concepts, usage techniques, and effective communication strategies.
            </p>
            
            <div className="space-y-4">
              <div className="p-3 bg-white rounded-lg border">
                <p className="font-medium mb-2">1. What % of fortune 500 companies use Automated Tracking System for scanning resumes and conducting interviews?</p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[2]" name="answer_id[2]" value="1" required className="text-purple-600" />
                    <span className="text-sm">50%</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[2]" name="answer_id[2]" value="2" required className="text-purple-600" />
                    <span className="text-sm">75%</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[2]" name="answer_id[2]" value="3" required className="text-purple-600" />
                    <span className="text-sm">85%</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[2]" name="answer_id[2]" value="4" required className="text-purple-600" />
                    <span className="text-sm">95%</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[2]" name="answer_id[2]" value="5" required className="text-purple-600" />
                    <span className="text-sm">100%</span>
                  </label>
                </div>
              </div>
              
              <div className="p-3 bg-white rounded-lg border">
                <p className="font-medium mb-2">
                  <span style={{color: 'black'}}>2. </span>
                  When should you use Key Words?
                  <input type="hidden" id="question_id[3]" value="114" name="question_id[3]" />
                </p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[3]" name="answer_id[3]" value="1" required className="text-purple-600" />
                    <span className="text-sm">Resume</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[3]" name="answer_id[3]" value="2" required className="text-purple-600" />
                    <span className="text-sm">Cover letter Video interview</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[3]" name="answer_id[3]" value="3" required className="text-purple-600" />
                    <span className="text-sm">Video interview</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[3]" name="answer_id[3]" value="4" required className="text-purple-600" />
                    <span className="text-sm">Audio interview</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[3]" name="answer_id[3]" value="5" required className="text-purple-600" />
                    <span className="text-sm">Face to face interview</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" id="answer_id[3]" name="answer_id[3]" value="6" required className="text-purple-600" />
                    <span className="text-sm">All of the above</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                Reset Quiz
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Submit Quiz
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <ActionButton variant="success" onClick={handleNextLesson}>
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const WhatIsTextSentimentEmotionComponent = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="col-lg-12 col-md-12 col-12 col-sm-12 mt-3">
            <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-10 h-10 text-gray-400" aria-hidden="true">
                    <polygon points="6 3 20 12 6 21 6 3"></polygon>
                  </svg>
              </div>
                <p className="text-gray-500 text-sm">Text Sentiment & Emotion Video</p>
                <p className="text-gray-400 text-xs mt-2">Text sentiment and emotion.mp4</p>
            </div>
          </div>
          </div>
          </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="success" 
              onClick={() => {
                // Handle Done button click
                console.log('Done clicked');
              }}
            >
              Done
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const PracticeTextSentimentComponent = () => {
    const [selectedSentiment, setSelectedSentiment] = useState<string>('');
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [showSuggestedAnswer, setShowSuggestedAnswer] = useState(false);

    const handleSentimentChange = (sentiment: string) => {
      setSelectedSentiment(sentiment);
      setShowAnswer(true);
    };

    const handleSubmit = () => {
      setShowSuggestedAnswer(true);
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-4">
              <strong>Example:</strong>
            </h4>
            <p className="text-base text-gray-700 mb-6">
              Is it possible to finish my internship one week early? It would be nice to attend my family event which is the last week of my internship. Hope it is not too much of an inconvenience. That is not my intention. I was only asking if it is possible.
            </p>
            <p className="text-base font-semibold text-gray-900 mb-6">
              What is the sentiment (positive, negative, neutral) of the text?
            </p>

            {/* Sentiment Options */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="sentiment"
                  value="positive"
                  checked={selectedSentiment === 'positive'}
                  onChange={() => handleSentimentChange('positive')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">Positive</span>
                <span className="text-4xl">🙂</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="sentiment"
                  value="negative"
                  checked={selectedSentiment === 'negative'}
                  onChange={() => handleSentimentChange('negative')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">Negative</span>
                <span className="text-4xl">🙁</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="sentiment"
                  value="neutral"
                  checked={selectedSentiment === 'neutral'}
                  onChange={() => handleSentimentChange('neutral')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">Neutral</span>
                <span className="text-4xl">😶</span>
              </label>
              </div>

            {/* Answer Section */}
            {showAnswer && (
              <div className="mb-6">
                <div className="text-2xl font-bold text-green-600 mb-4">
                  <label>Answer</label>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div></div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-4">
                      {/* Negative Sentiment */}
                      <div className="flex items-center py-2 bg-red-50 rounded-lg">
                        <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">🙁</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Negative</div>
                          <span className="text-sm text-gray-600">(58%)</span>
            </div>
          </div>
          
                      {/* Positive Sentiment */}
                      <div className="flex items-center py-2 bg-green-50 rounded-lg">
                        <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">🙂</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Positive</div>
                          <span className="text-sm text-gray-600">(%)</span>
                        </div>
          </div>

                      {/* Neutral Sentiment */}
                      <div className="flex items-center py-2 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">😶</span>
          </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Neutral</div>
                          <span className="text-sm text-gray-600">(%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-base text-gray-700 mt-4">
                  For example, in the opening line, it gives the right for the other person to refuse which sets a negative tone. Second, it uses passive words/voice such as "I was only", "It would be", "Hope it is not too much of an inconvenience." "That is not my intention."
                </p>
              </div>
            )}

            {/* Writing Exercise */}
            <div className="mt-8">
              <h4 className="mb-4 font-semibold text-lg">
                <span style={{color: '#72cda9'}}>1. </span>
                Write a more positive text sentiment.
              </h4>
              <textarea
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={5}
                placeholder="Write your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              
              {/* Suggested Answer */}
              {showSuggestedAnswer && (
                <div className="mt-4">
                  <h3 className="mb-3 font-semibold text-lg">
                    <span style={{color: '#72cda9'}}>Suggested Answer</span>
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-4">
                      {/* Positive Sentiment */}
                      <div className="flex items-center py-2 bg-green-50 rounded-lg">
                        <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">🙂</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Positive</div>
                          <span className="text-sm text-gray-600">(88%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-blue-900">
                      In the last week of my internship, I have a family event. I need to complete my internship by August 15. My project will be over by then. I look forward to your approval.
                    </h5>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            {!showSuggestedAnswer ? (
              <ActionButton 
                variant="success" 
                onClick={handleSubmit}
              >
                Submit
              </ActionButton>
            ) : (
              <ActionButton 
                variant="success" 
                onClick={() => {
                  // Handle Done button click
                  console.log('Done clicked');
                }}
              >
                Done
              </ActionButton>
            )}
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const PracticeTextEmotionComponent = () => {
    const [selectedEmotion, setSelectedEmotion] = useState<string>('');
    const [showAnswer, setShowAnswer] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [showSuggestedAnswer, setShowSuggestedAnswer] = useState(false);

    const handleEmotionChange = (emotion: string) => {
      setSelectedEmotion(emotion);
      setShowAnswer(true);
    };

    const handleSubmit = () => {
      setShowSuggestedAnswer(true);
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-4">
              <strong>Example:</strong>
            </h4>
            <p className="text-base text-gray-700 mb-6">
              The bad news is that we have had two recent resignations of Customer Service Supervisors – Greg and Martha. I have spoken to Human Capital and they are looking for replacements. It will take as long as 30 days to identify replacements and only within 90 days they will join. We can expect some escalations over the next two months. Wanted to warn you.
            </p>
            <p className="text-base font-semibold text-gray-900 mb-6">
              How does the text sound emotionally (sadness, joyful, angry, fear, confused)?
            </p>

            {/* Emotion Options */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="emotion"
                  value="sadness"
                  checked={selectedEmotion === 'sadness'}
                  onChange={() => handleEmotionChange('sadness')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">Sadness</span>
                <span className="text-4xl">😌</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="emotion"
                  value="joyful"
                  checked={selectedEmotion === 'joyful'}
                  onChange={() => handleEmotionChange('joyful')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">Joyful</span>
                <span className="text-4xl">😁</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="emotion"
                  value="anger"
                  checked={selectedEmotion === 'anger'}
                  onChange={() => handleEmotionChange('anger')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">Anger</span>
                <span className="text-4xl">😠</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="emotion"
                  value="fear"
                  checked={selectedEmotion === 'fear'}
                  onChange={() => handleEmotionChange('fear')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">Fear</span>
                <span className="text-4xl">😨</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="emotion"
                  value="confused"
                  checked={selectedEmotion === 'confused'}
                  onChange={() => handleEmotionChange('confused')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-lg">Confused</span>
                <span className="text-4xl">😕</span>
              </label>
              </div>

            {/* Answer Section */}
            {showAnswer && (
              <div className="mb-6">
                <div className="text-2xl font-bold text-green-600 mb-4">
                  <label>Answer</label>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div></div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-4">
                      {/* Anger */}
                      <div className="flex items-center py-2 bg-red-50 rounded-lg">
                        <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">😠</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Anger</div>
                          <span className="text-sm text-gray-600">(21%)</span>
            </div>
          </div>
          
                      {/* Sadness */}
                      <div className="flex items-center py-2 bg-blue-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">😌</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Sadness</div>
                          <span className="text-sm text-gray-600">(68%)</span>
                        </div>
          </div>

                      {/* Fear */}
                      <div className="flex items-center py-2 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">😨</span>
          </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Fear</div>
                          <span className="text-sm text-gray-600">(19%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Writing Exercise */}
            <div className="mt-8">
              <h4 className="mb-4 font-semibold text-lg">
                <span style={{color: '#72cda9'}}>1. </span>
                Change the paragraph to have less negative text emotion.
              </h4>
              <textarea
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={5}
                placeholder="Write your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              
              {/* Suggested Answer */}
              {showSuggestedAnswer && (
                <div className="mt-4">
                  <h3 className="mb-3 font-semibold text-lg">
                    <span style={{color: '#72cda9'}}>Suggested Answer</span>
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="space-y-4">
                      {/* Anger */}
                      <div className="flex items-center py-2 bg-red-50 rounded-lg">
                        <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">😠</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Anger</div>
                          <span className="text-sm text-gray-600">(9%)</span>
                        </div>
                      </div>
                      
                      {/* Sadness */}
                      <div className="flex items-center py-2 bg-blue-50 rounded-lg">
                        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">😌</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Sadness</div>
                          <span className="text-sm text-gray-600">(33%)</span>
                        </div>
                      </div>
                      
                      {/* Fear */}
                      <div className="flex items-center py-2 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">😨</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Fear</div>
                          <span className="text-sm text-gray-600">(11%)</span>
                        </div>
                      </div>
                      
                      {/* Joyful */}
                      <div className="flex items-center py-2 bg-yellow-50 rounded-lg">
                        <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center ml-4">
                          <span className="text-2xl">😁</span>
                        </div>
                        <div className="ml-4 text-center flex-1">
                          <div className="text-lg font-semibold">Joyful</div>
                          <span className="text-sm text-gray-600">(20%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-blue-900">
                      The situation is that we have had two recent resignations of Customer Service Supervisors - Greg and Martha. I have spoken to Human Capital and they are looking for replacements. Within 30 days, we will be able to identify replacements and within 90 days they will join. We can expect some escalations over the next two months.
                    </h5>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            {!showSuggestedAnswer ? (
              <ActionButton 
                variant="success" 
                onClick={handleSubmit}
              >
                Submit
              </ActionButton>
            ) : (
              <ActionButton 
                variant="success" 
                onClick={() => {
                  // Handle Done button click
                  console.log('Done clicked');
                }}
              >
                Done
              </ActionButton>
            )}
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const PracticeWriting1Component = () => {
    const [userAnswer, setUserAnswer] = useState('');

    const handleSubmit = () => {
      // Handle submit functionality
      console.log('Submit clicked with answer:', userAnswer);
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="mb-6 mt-3 font-semibold text-lg">
              <span style={{color: '#72cda9'}}>1. </span>
              Write a small paragraph on bad news that you need to deliver to someone.
            </h4>
            
            <div className="form-group">
              <textarea
                name="text"
                id="text"
                rows={10}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your paragraph here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              </div>
            </div>
          </div>
          
        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="primary" 
              onClick={handleSubmit}
            >
              Submit
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const PracticeWriting2Component = () => {
    const [userAnswer, setUserAnswer] = useState('');

    const handleSubmit = () => {
      // Handle submit functionality
      console.log('Submit clicked with answer:', userAnswer);
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="mb-6 mt-3 font-semibold text-lg">
              <span style={{color: '#72cda9'}}>1. </span>
              Write a paragraph to influence your manager for additional responsibility.
            </h4>
            
            <div className="form-group">
              <textarea
                name="text"
                id="text"
                rows={10}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your paragraph here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              </div>
            </div>
          </div>
          
        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="primary" 
              onClick={handleSubmit}
            >
              Submit
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const TextSentimentFunActivityComponent = () => {
    const [answers, setAnswers] = useState<{ [key: string]: string }>({});

    const handleAnswerChange = (questionId: string, value: string) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    const handleSubmit = () => {
      // Handle submit functionality
      console.log('Submit clicked with answers:', answers);
    };

    const questions = [
      {
        id: '1',
        options: [
          { value: '1', text: 'Your weakness is your planning skills.' },
          { value: '2', text: 'Your development need is your planning skills.' }
        ]
      },
      {
        id: '2',
        options: [
          { value: '1', text: 'Let me share some constructive criticism.' },
          { value: '2', text: 'Let me share your growth areas.' }
        ]
      },
      {
        id: '3',
        options: [
          { value: '1', text: 'Your body language is an area for improvement.' },
          { value: '2', text: 'Your body language makes you look negative.' }
        ]
      },
      {
        id: '4',
        options: [
          { value: '1', text: 'The past issue was your timeliness.' },
          { value: '2', text: 'You have an opportunity to improve your timeliness.' }
        ]
      },
      {
        id: '5',
        options: [
          { value: '1', text: 'I learned a new perspective in that report.' },
          { value: '2', text: 'I made a mistake on that report.' }
        ]
      },
      {
        id: '6',
        options: [
          { value: '1', text: 'What were your learnings from that project?' },
          { value: '2', text: 'You failed to complete the project on time.' }
        ]
      },
      {
        id: '7',
        options: [
          { value: '1', text: 'The problem is that we have not been able to set the right team culture.' },
          { value: '2', text: 'The solution is to improve the team culture.' }
        ]
      },
      {
        id: '8',
        options: [
          { value: '1', text: 'The bad news is we lost the contract to our competition.' },
          { value: '2', text: 'The situation is that we have lost the contract to our competition.' }
        ]
      },
      {
        id: '9',
        options: [
          { value: '1', text: 'We are facing challenges with getting clearance for our new product.' },
          { value: '2', text: 'We are facing hurdles with getting clearances for our new product.' }
        ]
      },
      {
        id: '10',
        options: [
          { value: '1', text: 'Completing the software development by March 31 will never happen.' },
          { value: '2', text: 'The software development can happen by March 31, when we get two additional resources.' }
        ]
      }
    ];

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="space-y-8">
              {questions.map((question, index) => (
                <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="space-y-4">
                    {question.options.map((option, optionIndex) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name={`answer_id[${question.id}]`}
                          value={option.value}
                          checked={answers[question.id] === option.value}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                          required
                        />
                        <span className="text-sm font-semibold text-black">
                          {String.fromCharCode(97 + optionIndex)} {/* a, b, c, etc. */}
                        </span>
                        <span className="text-base text-gray-900">{option.text}</span>
                      </label>
                    ))}
              </div>
            </div>
              ))}
          </div>
          </div>
          </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="success" 
              onClick={handleSubmit}
            >
              Submit
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const PracticeWriting3Component = () => {
    const [userAnswer, setUserAnswer] = useState('');

    const handleSubmit = () => {
      // Handle submit functionality
      console.log('Submit clicked with answer:', userAnswer);
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="mb-6 mt-3 font-semibold text-lg">
              <span className="text-black">1. </span>
              Write a paragraph on your weaknesses.
            </h4>
            
            <div className="form-group">
              <textarea
                name="text"
                id="text"
                rows={10}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write your paragraph here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              </div>
            </div>
          </div>
          
        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="primary" 
              onClick={handleSubmit}
            >
              Submit
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const PowerfulWordVideoExamplesComponent = () => {
    const handleSubmit = () => {
      // Handle submit functionality
      console.log('Submit clicked');
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="mt-4">
              <div className="video-list-thumbs">
                <div className="thumbnail">
                  <iframe 
                    width="100%" 
                    height="300" 
                    src="https://www.youtube.com/embed/u8WN9eRdw1U" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full rounded-lg"
                  ></iframe>
                  
                  <div className="caption mt-4">
                    <h4 className="font-bold text-lg text-gray-900">Hidden Figures</h4>
                    <p className="text-gray-600">Watch video & learn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="success" 
              onClick={handleSubmit}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Submit
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const WhatAreIStatementsComponent = () => {
    const handleSubmit = () => {
      // Handle submit functionality
      console.log('Done clicked');
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="mt-6">
              <div className="col-lg-12 col-md-12 col-12 col-sm-12 mt-3">
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-10 h-10 text-gray-400" aria-hidden="true">
                        <polygon points="6 3 20 12 6 21 6 3"></polygon>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">I Statements Video</p>
                    <p className="text-gray-400 text-xs mt-2">Word Power Lesson 6 of 7 (App).mp4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="success" 
              onClick={handleSubmit}
            >
              Done
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const IStatementsPractice1Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && (file.type === 'video/mp4' || file.type === 'video/quicktime')) {
        setSelectedFile(file);
      }
    };

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
    };

    const handleUpload = () => {
      if (selectedFile) {
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
          console.log('File uploaded:', selectedFile.name);
        }, 2000);
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="mt-6">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h4 className="mb-6 font-semibold text-gray-900">
                  Describe yourself.
                </h4>
              </div>
              
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                    <input id="videoType" type="hidden" value="Interview" />
                    <input id="jobRole" type="hidden" value="null" />
                    
                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <input
                        id="thefiles"
                        type="file"
                        name="files"
                        accept=".mp4, .mov"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      
                      <div 
                        className="cursor-pointer"
                        onClick={() => document.getElementById('thefiles')?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-2">Upload Video</p>
                        <p className="text-sm text-gray-500">
                          Drag and drop your video file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supported formats: .mp4, .mov (Max size: 500MB)
                        </p>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <p className="text-green-800 font-medium">
                            Selected file: {selectedFile.name}
                          </p>
                          <p className="text-green-600 text-sm">
                            Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {isUploading && (
                  <div className="progress mt-4">
                    <div className="progress-bar bg-blue-600 h-2 rounded-full w-full animate-pulse">
                      Please Wait...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            {selectedFile && !isUploading && (
              <ActionButton 
                variant="success" 
                onClick={handleUpload}
              >
                Upload Video
              </ActionButton>
            )}
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const IStatementsPractice2Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);
      }
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && (file.type === 'video/mp4' || file.type === 'video/quicktime')) {
        setSelectedFile(file);
      }
    };

    const handleDragOver = (event: React.DragEvent) => {
      event.preventDefault();
    };

    const handleUpload = () => {
      if (selectedFile) {
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
          setIsUploading(false);
          console.log('File uploaded:', selectedFile.name);
        }, 2000);
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="mt-6">
              <div className="col-xl-12 col-lg-12 col-md-12">
                <h4 className="mb-6 font-semibold text-gray-900">
                  Describe an achievement.
                </h4>
              </div>
              
              <div className="card-body">
                <div className="row">
                  <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                    <input id="videoType" type="hidden" value="Interview" />
                    <input id="jobRole" type="hidden" value="null" />
                    
                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <input
                        id="thefiles"
                        type="file"
                        name="files"
                        accept=".mp4, .mov"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      
                      <div 
                        className="cursor-pointer"
                        onClick={() => document.getElementById('thefiles')?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-2">Upload Video</p>
                        <p className="text-sm text-gray-500">
                          Drag and drop your video file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supported formats: .mp4, .mov (Max size: 500MB)
                        </p>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <p className="text-green-800 font-medium">
                            Selected file: {selectedFile.name}
                          </p>
                          <p className="text-green-600 text-sm">
                            Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {isUploading && (
                  <div className="progress mt-4">
                    <div className="progress-bar bg-blue-600 h-2 rounded-full w-full animate-pulse">
                      Please Wait...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="success" 
              onClick={handleUpload}
            >
              Done
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  const IStatementsElevatorSpeechComponent = () => {
    const handleSubmit = () => {
      // Handle submit functionality
      console.log('Done clicked');
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="mt-6">
              <div className="col-lg-12 col-md-12 col-12 col-sm-12 mt-3">
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play w-10 h-10 text-gray-400" aria-hidden="true">
                        <polygon points="6 3 20 12 6 21 6 3"></polygon>
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">I Statements Elevator Speech Video</p>
                    <p className="text-gray-400 text-xs mt-2">How to write and deliver an Elevator Speech uSpeek App.mp4</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4">
          <div className="flex justify-end space-x-4">
            <ActionButton 
              variant="success" 
              onClick={handleSubmit}
            >
              Done
            </ActionButton>
            <ActionButton 
              variant="primary" 
              onClick={handleNextLesson}
            >
              Next Lesson
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToLessons}
            className="text-gray-600 hover:text-gray-900 p-0 h-auto font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lessons
          </Button>
        </div>

        {/* Course Overview Card */}
        <Card className="mb-6 bg-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                {/* Course Icon */}
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                
                {/* Course Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      COURSE
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      Beginner
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-gray-600">4.7</span>
                    </div>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Eliminating Filler Words
                  </h1>
                  
                  <p className="text-gray-600 mb-4">
                    Strategies to reduce "um", "uh", and other verbal fillers in your speech
                  </p>
                  
                  {/* Course Metrics */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>52 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>45 Sessions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>0/45 Completed</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Completion Status */}
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  0%
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {/* Left Sidebar - Course Sessions */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Course Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div>
                  {courseSessionsStructure.map((item) => renderDropdownItem(item))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Main Content - Session Details */}
          <div className="lg:col-span-5">
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="p-6">
                  {/* Session Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      {selectedSession.type === 'video' ? (
                        <Video className="w-5 h-5 text-blue-600" />
                      ) : selectedSession.type === 'quiz' ? (
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : (
                        <FileText className="w-5 h-5 text-blue-600" />
                      )}
                      <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
                    </div>
                    <div className="text-sm text-gray-500">{selectedSession.duration}</div>
                  </div>

                  {/* Session Status Section */}
                  <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-gray-900 mb-2">{selectedSession.duration}</div>
                    <div className="text-sm text-gray-500 mb-6">
                      {isSessionStarted ? 'Session in progress...' : 'Ready to start'}
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        onClick={handleStartSession}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                        disabled={isSessionStarted}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                      
                      <Button
                        onClick={handleCompleteSession}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                        disabled={!isSessionStarted || isSessionCompleted}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Session
                      </Button>
                    </div>
                  </div>

                  {/* Session Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{content.description}</h3>
                  </div>

                  {/* Conditional Rendering of Independent Components */}
                  {selectedSession.id === 'overview' && <OverviewComponent />}
                  {selectedSession.id === 'sentence-length' && <SentenceLengthComponent />}
                  {selectedSession.id === 'unique-repetitive-words' && <UniqueRepetitiveWordsComponent />}
                  {selectedSession.id === 'pet-filler-words' && <PetFillerWordsComponent />}
                  {selectedSession.id === 'key-words' && <KeyWordsComponent />}
                  {selectedSession.id === 'text-sentiment-emotion' && <TextSentimentEmotionComponent />}
                  {selectedSession.id === 'i-statements' && <IStatementsComponent />}
                  {selectedSession.id === 'what-is-word-power' && <WhatIsWordPowerComponent />}
                  {selectedSession.id === 'practice' && <PracticeComponent />}
                  {selectedSession.id === 'word-power-video-examples' && <WordPowerVideoExamplesComponent />}
                  {selectedSession.id === 'fun-activity' && <FunActivityComponent />}
                  {selectedSession.id === 'quiz' && <QuizComponent />}
                  {selectedSession.id === 'what-is-sentence-length' && <WhatIsSentenceLengthComponent />}
                  {selectedSession.id === 'active-vs-passive-voice' && <ActiveVsPassiveVoiceComponent />}
                  {selectedSession.id === 'sentence-length-practice-1' && <SentenceLengthPractice1Component />}
                  {selectedSession.id === 'simple-vs-complex-words' && <SimpleVsComplexWordsComponent />}
                  {selectedSession.id === 'sentence-length-practice-2' && <SentenceLengthPractice2Component />}
                  {selectedSession.id === 'redundant-words' && <RedundantWordsComponent />}
                  {selectedSession.id === 'sentence-length-practice-3' && <SentenceLengthPractice3Component />}
                  {selectedSession.id === 'sentence-length-practice-4' && <SentenceLengthPractice4Component />}
                  {selectedSession.id === 'sentence-length-fun-exercise' && <SentenceLengthFunExerciseComponent />}
                  {selectedSession.id === 'what-are-unique-repetitive-words' && <WhatAreUniqueRepetitiveWordsComponent />}
                  {selectedSession.id === 'unique-repetitive-quiz' && <UniqueRepetitiveQuizComponent />}
                  {selectedSession.id === 'unique-repetitive-practice' && <UniqueRepetitivePracticeComponent />}
                  {selectedSession.id === 'what-are-pet-filler-words' && <WhatArePetFillerWordsComponent />}
                  {selectedSession.id === 'pet-filler-fun-activity' && <PetFillerFunActivityComponent />}
                  {selectedSession.id === 'pet-filler-practice-1' && <PetFillerPractice1Component />}
                  {selectedSession.id === 'pet-filler-practice-2' && <PetFillerPractice2Component />}
                  {selectedSession.id === 'pet-filler-practice-3' && <PetFillerPractice3Component />}
                  {selectedSession.id === 'key-words' && <KeyWordsComponent />}
                  {selectedSession.id === 'key-words-practice' && <KeyWordsPracticeComponent />}
                  {selectedSession.id === 'key-words-exercise' && <KeyWordsExerciseComponent />}
                  {selectedSession.id === 'key-words-videos' && <KeyWordsVideosComponent />}
                  {selectedSession.id === 'key-words-quiz' && <KeyWordsQuizComponent />}
                  {selectedSession.id === 'what-is-text-sentiment-emotion' && <WhatIsTextSentimentEmotionComponent />}
                  {selectedSession.id === 'practice-text-sentiment' && <PracticeTextSentimentComponent />}
                  {selectedSession.id === 'practice-text-emotion' && <PracticeTextEmotionComponent />}
                  {selectedSession.id === 'practice-writing-1' && <PracticeWriting1Component />}
                  {selectedSession.id === 'practice-writing-2' && <PracticeWriting2Component />}
                  {selectedSession.id === 'text-sentiment-fun-activity' && <TextSentimentFunActivityComponent />}
                  {selectedSession.id === 'practice-writing-3' && <PracticeWriting3Component />}
                  {selectedSession.id === 'powerful-word-video-examples' && <PowerfulWordVideoExamplesComponent />}
                  {selectedSession.id === 'what-are-i-statements' && <WhatAreIStatementsComponent />}
                  {selectedSession.id === 'i-statements-practice-1' && <IStatementsPractice1Component />}
                  {selectedSession.id === 'i-statements-practice-2' && <IStatementsPractice2Component />}
                  {selectedSession.id === 'i-statements-elevator-speech' && <IStatementsElevatorSpeechComponent />}

                  {/* Default Content Display for sections without specific components */}
                  {!['overview', 'sentence-length', 'unique-repetitive-words', 'pet-filler-words', 'key-words', 'text-sentiment-emotion', 'i-statements', 'what-is-word-power', 'practice', 'word-power-video-examples', 'fun-activity', 'quiz', 'what-is-sentence-length', 'active-vs-passive-voice', 'sentence-length-practice-1', 'simple-vs-complex-words', 'sentence-length-practice-2', 'redundant-words', 'sentence-length-practice-3', 'sentence-length-practice-4', 'sentence-length-fun-exercise', 'what-are-unique-repetitive-words', 'unique-repetitive-quiz', 'unique-repetitive-practice', 'what-are-pet-filler-words', 'pet-filler-fun-activity', 'pet-filler-practice-1', 'pet-filler-practice-2', 'pet-filler-practice-3', 'key-words-practice', 'key-words-exercise', 'key-words-videos', 'key-words-quiz', 'what-is-text-sentiment-emotion', 'practice-text-sentiment', 'practice-text-emotion', 'practice-writing-1', 'practice-writing-2', 'text-sentiment-fun-activity', 'practice-writing-3', 'powerful-word-video-examples', 'what-are-i-statements', 'i-statements-practice-1', 'i-statements-practice-2', 'i-statements-elevator-speech'].includes(selectedSession.id) && (
                  <div className="prose prose-sm max-w-none">
                      {content.content && <p className="text-gray-700 leading-relaxed mb-6">{content.content}</p>}
                    
                    {selectedSession.type === 'quiz' && content.quiz ? (
                      <div className="mt-6">
                        {!showQuizResults ? (
                          <div className="space-y-6">
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <h4 className="font-semibold text-purple-900 mb-4">Question {currentQuizQuestion + 1} of {content.quiz.questions.length}</h4>
                              <p className="text-gray-700 mb-4">{content.quiz.questions[currentQuizQuestion].question}</p>
                              
                              <div className="space-y-3">
                                {content.quiz.questions[currentQuizQuestion].options.map((option, index) => (
                                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${currentQuizQuestion}`}
                                      value={index}
                                      checked={quizAnswers[currentQuizQuestion] === index}
                                      onChange={() => handleQuizAnswer(index)}
                                      className="text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                              
                              <div className="mt-6 flex justify-between">
                                <button 
                                  onClick={resetQuiz}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-white border border-purple-600 text-purple-600 hover:bg-purple-50"
                                >
                                  Reset Quiz
                                </button>
                                <ActionButton 
                                  variant="primary" 
                                  onClick={() => console.log('Submit clicked', quizAnswers)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  Submit Quiz
                                </ActionButton>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-4">Quiz Results</h4>
                            <div className="space-y-4">
                              {content.quiz.questions.map((question, index) => {
                                const userAnswer = quizAnswers[index];
                                const isCorrect = userAnswer === question.correctAnswer;
                                return (
                                  <div key={index} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <p className="font-medium mb-2">Question {index + 1}: {question.question}</p>
                                    <p className="text-sm mb-1">Your answer: {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}</p>
                                    <p className="text-sm mb-1">Correct answer: {question.options[question.correctAnswer]}</p>
                                    <p className="text-sm text-gray-600">{question.explanation}</p>
                                  </div>
                                );
                              })}
                              <div className="mt-4 text-center">
                                <Button
                                  onClick={resetQuiz}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  Retake Quiz
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                          {content.objectives.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
                          <ul className="space-y-1 text-sm text-blue-800">
                            {content.objectives.map((objective, index) => (
                              <li key={index}>• {objective}</li>
                            ))}
                          </ul>
                        </div>
                          )}

                          {content.keyPoints.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
                          <ul className="space-y-1 text-sm text-green-800">
                            {content.keyPoints.map((point, index) => (
                              <li key={index}>• {point}</li>
                            ))}
                          </ul>
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="flex justify-end space-x-4 mt-6">
                            <ActionButton 
                              variant="primary"
                              onClick={handleNextLesson}
                            >
                              Next Lesson
                            </ActionButton>
                        </div>
                      </>
                    )}
                  </div>
                  )}

                  {/* Progress Indicator */}
                  {isSessionStarted && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">Session Progress</span>
                        <span className="text-sm text-green-600">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
