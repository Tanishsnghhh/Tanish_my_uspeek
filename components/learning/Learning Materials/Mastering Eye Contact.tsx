'use client';

import { useState } from 'react';
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
  ChevronRight,
  ChevronDown
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
    id: 'body-language',
    title: 'Body Language »',
    children: [
      { id: 'what-is-body-language', title: 'What is body language?' },
      { id: 'dos-and-donts', title: 'Dos and Don\'ts' },
      { id: 'body-language-practice', title: 'Practice 1' },
      { id: 'body-language-fun-facts', title: 'Fun Facts' },
      { id: 'body-language-quiz', title: 'Quiz Time' },
      { id: 'what-is-facial-emotion', title: 'What is facial emotion?' },
      { id: 'facial-emotion-practice', title: 'Practice 2' },
      { id: 'body-language-practice-again', title: 'Practice 3' },
      { id: 'how-to-improve-facial-score', title: 'How to improve Facial Score' },
      { id: 'facial-score-practice-1', title: 'Practice 4' },
      { id: 'facial-score-practice-2', title: 'Practice 5' },
      { id: 'facial-emotion-quiz', title: 'Quiz Time' }
    ]
  }
];



const eyeContactContent: Record<string, LessonContentItem> = {





  'what-is-facial-emotion': {
    title: 'Facial Emotion Part 1',
    description: 'Video on Facial Emotion Part 1',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'dos-and-donts': {
    title: 'Learning Clips',
    description: 'Become a master at Body Language',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'body-language-practice': {
    title: 'Practice 1',
    description: 'Upload your answer to the following question. You can upload a video from your computer or mobile.',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'body-language-fun-facts': {
    title: 'Fun Facts',
    description: 'Interesting and surprising facts about body language across cultures',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'body-language-practice-again': {
    title: 'Practice 3',
    description: '',
    content: '',
    objectives: [
      '',
      '',
      '',
      ''
    ],
    keyPoints: [
      '',
      '',
      '',
      ''
    ]
  },
  'how-to-improve-facial-score': {
    title: 'Facial Emotion Part 2',
    description: 'Video on Facial Emotion Part 2',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'body-language-quiz': {
    title: 'Quiz Time',
    description: 'Test your knowledge of body language and facial expressions',
    content: 'This comprehensive quiz will test your understanding of body language, facial expressions, and nonverbal communication. Answer the questions based on what you\'ve learned throughout this course about effective communication through body language.',
    objectives: [
      'Assess understanding of body language fundamentals',
      'Test knowledge of facial expressions and emotions',
      'Evaluate comprehension of nonverbal communication',
      'Review practical application of body language techniques'
    ],
    keyPoints: [
      'Body language is a crucial component of effective communication',
      'Facial expressions convey emotions more powerfully than words',
      'Cultural awareness is essential for global communication',
      'Practice and feedback are key to improvement'
    ],
    quiz: {
      questions: [
        {
          id: 1,
          question: 'What percentage of communication is nonverbal?',
          options: ['30-40%', '50-60%', '70-80%', '90-95%'],
          correctAnswer: 2,
          explanation: 'Research shows that 70-80% of communication is nonverbal, including body language, facial expressions, and tone of voice.'
        },
        {
          id: 2,
          question: 'Which of the following is NOT one of the seven universal facial expressions?',
          options: ['Joy', 'Sadness', 'Confusion', 'Anger'],
          correctAnswer: 2,
          explanation: 'The seven universal facial expressions are: joy, sadness, anger, fear, surprise, disgust, and contempt. Confusion is not one of them.'
        },
        {
          id: 3,
          question: 'What does crossed arms typically indicate?',
          options: ['Confidence', 'Defensiveness', 'Relaxation', 'Excitement'],
          correctAnswer: 1,
          explanation: 'Crossed arms typically indicate defensiveness, resistance, or a closed-off attitude, though context is important.'
        },
        {
          id: 4,
          question: 'How long do micro-expressions typically last?',
          options: ['Less than 1/25th of a second', '1-2 seconds', '3-5 seconds', '5-10 seconds'],
          correctAnswer: 0,
          explanation: 'Micro-expressions are brief, involuntary facial expressions that last less than 1/25th of a second and reveal true emotions.'
        },
        {
          id: 5,
          question: 'What is the best way to improve your facial score?',
          options: ['Practice in front of a mirror', 'Watch others\' expressions', 'Read books about emotions', 'All of the above'],
          correctAnswer: 3,
          explanation: 'The best approach combines multiple strategies: practicing in front of a mirror, observing others, studying the subject, and seeking feedback.'
        }
      ]
    }
  },
  'facial-emotion-practice': {
    title: 'Practice 2',
    description: '',
    content: '',
    objectives: [],
    keyPoints: []
  },
  'facial-score-practice-1': {
    title: 'Practice 4',
    description: '',
    content: '',
    objectives: [
      '',
      '',
      '',
      ''
    ],
    keyPoints: [
      '',
      '',
      '',
      ''
    ]
  },
  'facial-score-practice-2': {
    title: 'Practice 5',
    description: '',
    content: '',
    objectives: [
      '',
      '',
      '',
      ''
    ],
    keyPoints: [
      '',
      '',
      '',
      ''
    ]
  },
  'facial-emotion-quiz': {
    title: 'Quiz Time',
    description: 'Test your knowledge of facial emotions and expressions',
    content: 'This quiz focuses specifically on facial emotions, expressions, and their role in communication. Test your understanding of emotional recognition, expression techniques, and the psychology behind facial communication.',
    objectives: [
      'Assess understanding of facial emotion fundamentals',
      'Test knowledge of emotional expression techniques',
      'Evaluate comprehension of facial communication psychology',
      'Review practical application of facial emotion skills'
    ],
    keyPoints: [
      'Facial emotions are universal across cultures',
      'Micro-expressions reveal true emotions',
      'Authentic expressions enhance communication',
      'Practice improves facial emotion skills'
    ],
    quiz: {
      questions: [
        {
          id: 1,
          question: 'Which of the following is considered a universal facial expression?',
          options: ['Embarrassment', 'Pride', 'Joy', 'Shame'],
          correctAnswer: 2,
          explanation: 'Joy is one of the seven universal facial expressions that are recognized across all cultures.'
        },
        {
          id: 2,
          question: 'What is the primary purpose of facial expressions in communication?',
          options: ['To hide emotions', 'To convey emotions', 'To confuse others', 'To avoid eye contact'],
          correctAnswer: 1,
          explanation: 'Facial expressions primarily serve to convey emotions and feelings to others during communication.'
        },
        {
          id: 3,
          question: 'How can you improve your facial expression recognition skills?',
          options: ['Avoid looking at faces', 'Practice with photos and videos', 'Ignore facial expressions', 'Focus only on words'],
          correctAnswer: 1,
          explanation: 'Practicing with photos and videos is an effective way to improve facial expression recognition skills.'
        },
        {
          id: 4,
          question: 'What is the difference between a macro-expression and a micro-expression?',
          options: ['There is no difference', 'Macro-expressions last longer', 'Micro-expressions are more visible', 'Macro-expressions are involuntary'],
          correctAnswer: 1,
          explanation: 'Macro-expressions last longer (typically 0.5-4 seconds) while micro-expressions are very brief (less than 1/25th of a second).'
        },
        {
          id: 5,
          question: 'Why is it important to be aware of cultural differences in facial expressions?',
          options: ['To avoid communication', 'To respect cultural norms', 'To confuse others', 'To hide emotions'],
          correctAnswer: 1,
          explanation: 'Being aware of cultural differences in facial expressions helps respect cultural norms and avoid misunderstandings in cross-cultural communication.'
        }
      ]
    }
  },
  'what-is-body-language': {
    title: 'What is body language?',
    description: '',
    content: '',
    objectives: [],
    keyPoints: []
  }
};

export default function MasteringEyeContact() {
  const router = useRouter();
  
  // Initialize with "What is body language?" page
  const initialSession: Session = {
    id: 'what-is-body-language',
    title: 'What is body language?',
    description: '',
    duration: '5:00',
    type: 'video',
    isActive: true,
    isCompleted: false
  };
  
  const [selectedSession, setSelectedSession] = useState<Session>(initialSession);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(false);
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['body-language']));
  const [selectedDropdownItem, setSelectedDropdownItem] = useState<DropdownItem | null>({
    id: 'what-is-body-language',
    title: 'What is body language?'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // File upload states for different practice sections
  const [selectedFilePractice1, setSelectedFilePractice1] = useState<File | null>(null);
  const [isUploadingPractice1, setIsUploadingPractice1] = useState(false);
  const [uploadProgressPractice1, setUploadProgressPractice1] = useState(0);

  const [selectedFilePractice2, setSelectedFilePractice2] = useState<File | null>(null);
  const [isUploadingPractice2, setIsUploadingPractice2] = useState(false);
  const [uploadProgressPractice2, setUploadProgressPractice2] = useState(0);

  const [selectedFilePractice3, setSelectedFilePractice3] = useState<File | null>(null);
  const [isUploadingPractice3, setIsUploadingPractice3] = useState(false);
  const [uploadProgressPractice3, setUploadProgressPractice3] = useState(0);

  const [selectedFilePractice4, setSelectedFilePractice4] = useState<File | null>(null);
  const [isUploadingPractice4, setIsUploadingPractice4] = useState(false);
  const [uploadProgressPractice4, setUploadProgressPractice4] = useState(0);

  const [selectedFilePractice5, setSelectedFilePractice5] = useState<File | null>(null);
  const [isUploadingPractice5, setIsUploadingPractice5] = useState(false);
  const [uploadProgressPractice5, setUploadProgressPractice5] = useState(0);



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
    // Get the body language section and its children
    const bodyLanguageSection = courseSessionsStructure.find(item => item.id === 'body-language');
    
    if (!bodyLanguageSection || !bodyLanguageSection.children) {
      console.log('Body language section not found');
      return;
    }
    
    const children = bodyLanguageSection.children;
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
    // Get the body language section and its children
    const bodyLanguageSection = courseSessionsStructure.find(item => item.id === 'body-language');
    
    if (!bodyLanguageSection || !bodyLanguageSection.children) {
      console.log('Body language section not found');
      return;
    }
    
    const children = bodyLanguageSection.children;
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
      if (eyeContactContent[contentKey]) {
        // Create a virtual session for the dropdown content
        const virtualSession: Session = {
          id: contentKey,
          title: eyeContactContent[contentKey].title,
          description: eyeContactContent[contentKey].description,
          duration: '5:00',
          type: contentKey === 'body-language-quiz' || contentKey === 'facial-emotion-quiz' ? 'quiz' : 
                contentKey === 'what-is-body-language' ? 'video' : 'text',
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

  const content = eyeContactContent[selectedSession.id as keyof typeof eyeContactContent];
  
  if (!content) return null;

  // Separate Practice Components
  const Practice1Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = () => {
      if (!selectedFile) return;
      
      setIsUploading(true);
      setUploadProgress(0);
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setUploadProgress(100);
          setIsUploading(false);
          alert('Video uploaded successfully!');
        } else {
          setUploadProgress(currentProgress);
        }
      }, 500);
    };

    return (
      <div className="mt-6">
        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Topic Selection */}
            <div className="mb-6">
              <p className="text-gray-700 mb-4">Choose one of the topics below</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-gray-900">
                    <strong>a. </strong> Tell us about an event or person who has shaped the way you think. What did he or she do specifically?
                  </p>
                  <p className="text-gray-900">
                    <strong>b. </strong> Tell us about something you learned and how you did it.
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <div className="row">
                <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                  <input id="videoType" type="hidden" value="Interview" />
                  <input id="jobRole" type="hidden" value="" />
                  
                  {/* Custom File Upload */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      selectedFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('video/')) {
                          setSelectedFile(file);
                        } else {
                          alert('Please upload a video file (MP4, MOV)');
                        }
                      }
                    }}
                  >
                    {selectedFile ? (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-green-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mb-4">
                          <label htmlFor="video-upload-practice-1" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload Video
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              MP4, MOV up to 100MB
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    <input
                      id="video-upload-practice-1"
                      name="files"
                      type="file"
                      className="sr-only"
                      accept=".mp4,.mov"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 100 * 1024 * 1024) {
                            alert('File size must be less than 100MB');
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                    />
                    {!selectedFile && (
                      <div className="text-xs text-gray-500">
                        <p>Drag and drop your video here, or click to browse</p>
                      </div>
                    )}
                    {selectedFile && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="progress progress-lg mt-4">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"
                  style={{ width: `${uploadProgress}%` }}
                >
                  Please Wait... {uploadProgress}%
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <ActionButton 
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Analyse Video'}
              </ActionButton>
              <ActionButton 
                variant="success"
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

  const Practice2Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = () => {
      if (!selectedFile) return;
      
      setIsUploading(true);
      setUploadProgress(0);
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setUploadProgress(100);
          setIsUploading(false);
          alert('Video uploaded successfully!');
        } else {
          setUploadProgress(currentProgress);
        }
      }, 500);
    };

    return (
      <div className="mt-6">
        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Question Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Record and upload your answer to the following question. You can upload a video from your computer or mobile.
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-gray-900">
                    <strong>Question:</strong> How would others describe you?
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <div className="row">
                <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                  <input id="videoType" type="hidden" value="Interview" />
                  <input id="jobRole" type="hidden" value="" />
                  
                  {/* Custom File Upload */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      selectedFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('video/')) {
                          setSelectedFile(file);
                        } else {
                          alert('Please upload a video file (MP4, MOV)');
                        }
                      }
                    }}
                  >
                    {selectedFile ? (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-green-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mb-4">
                          <label htmlFor="video-upload-practice-2" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload Video
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              MP4, MOV up to 100MB
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    <input
                      id="video-upload-practice-2"
                      name="files"
                      type="file"
                      className="sr-only"
                      accept=".mp4,.mov"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 100 * 1024 * 1024) {
                            alert('File size must be less than 100MB');
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                    />
                    {!selectedFile && (
                      <div className="text-xs text-gray-500">
                        <p>Drag and drop your video here, or click to browse</p>
                      </div>
                    )}
                    {selectedFile && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="progress progress-lg mt-4">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"
                  style={{ width: `${uploadProgress}%` }}
                >
                  Please Wait... {uploadProgress}%
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <ActionButton 
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Analyse Video'}
              </ActionButton>
              <ActionButton 
                variant="success"
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

  const Practice3Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = () => {
      if (!selectedFile) return;
      
      setIsUploading(true);
      setUploadProgress(0);
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setUploadProgress(100);
          setIsUploading(false);
          alert('Video uploaded successfully!');
        } else {
          setUploadProgress(currentProgress);
        }
      }, 500);
    };

    return (
      <div className="mt-6">
        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Question Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Thank you for uploading your previous practice video. Now, record and upload another video answering the following question.
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-gray-900">
                    <strong>Question:</strong> Describe your hobbies.
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <div className="row">
                <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                  <input id="videoType" type="hidden" value="Interview" />
                  <input id="jobRole" type="hidden" value="" />
                  
                  {/* Custom File Upload */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      selectedFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('video/')) {
                          setSelectedFile(file);
                        } else {
                          alert('Please upload a video file (MP4, MOV)');
                        }
                      }
                    }}
                  >
                    {selectedFile ? (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-green-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mb-4">
                          <label htmlFor="video-upload-practice-3" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload Video
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              MP4, MOV up to 100MB
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    <input
                      id="video-upload-practice-3"
                      name="files"
                      type="file"
                      className="sr-only"
                      accept=".mp4,.mov"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 100 * 1024 * 1024) {
                            alert('File size must be less than 100MB');
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                    />
                    {!selectedFile && (
                      <div className="text-xs text-gray-500">
                        <p>Drag and drop your video here, or click to browse</p>
                      </div>
                    )}
                    {selectedFile && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="progress progress-lg mt-4">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"
                  style={{ width: `${uploadProgress}%` }}
                >
                  Please Wait... {uploadProgress}%
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <ActionButton 
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Analyse Video'}
              </ActionButton>
              <ActionButton 
                variant="success"
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

  const Practice4Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = () => {
      if (!selectedFile) return;
      
      setIsUploading(true);
      setUploadProgress(0);
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setUploadProgress(100);
          setIsUploading(false);
          alert('Video uploaded successfully!');
        } else {
          setUploadProgress(currentProgress);
        }
      }, 500);
    };

    return (
      <div className="mt-6">
        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Question Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Record and upload your answer to the following question. You can upload a video from your computer or mobile.
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-gray-900">
                    <strong>Question:</strong> How would others describe you?
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <div className="row">
                <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                  <input id="videoType" type="hidden" value="Interview" />
                  <input id="jobRole" type="hidden" value="" />
                  
                  {/* Custom File Upload */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      selectedFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('video/')) {
                          setSelectedFile(file);
                        } else {
                          alert('Please upload a video file (MP4, MOV)');
                        }
                      }
                    }}
                  >
                    {selectedFile ? (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-green-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mb-4">
                          <label htmlFor="video-upload-practice-4" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload Video
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              MP4, MOV up to 100MB
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    <input
                      id="video-upload-practice-4"
                      name="files"
                      type="file"
                      className="sr-only"
                      accept=".mp4,.mov"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 100 * 1024 * 1024) {
                            alert('File size must be less than 100MB');
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                    />
                    {!selectedFile && (
                      <div className="text-xs text-gray-500">
                        <p>Drag and drop your video here, or click to browse</p>
                      </div>
                    )}
                    {selectedFile && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="progress progress-lg mt-4">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"
                  style={{ width: `${uploadProgress}%` }}
                >
                  Please Wait... {uploadProgress}%
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <ActionButton 
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Analyse Video'}
              </ActionButton>
              <ActionButton 
                variant="success"
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

  const Practice5Component = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = () => {
      if (!selectedFile) return;
      
      setIsUploading(true);
      setUploadProgress(0);
      
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 10;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setUploadProgress(100);
          setIsUploading(false);
          alert('Video uploaded successfully!');
        } else {
          setUploadProgress(currentProgress);
        }
      }, 500);
    };

    return (
      <div className="mt-6">
        {/* Main Content */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            {/* Question Section */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Record and upload your answer to the following question. You can upload a video from your computer or mobile.
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-gray-900">
                    <strong>Question:</strong> Describe your hobbies.
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <div className="row">
                <div className="col-lg-8 mb-lg-3 mb-md-7 mb-sm-7">
                  <input id="videoType" type="hidden" value="Interview" />
                  <input id="jobRole" type="hidden" value="" />
                  
                  {/* Custom File Upload */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      selectedFile 
                        ? 'border-green-400 bg-green-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      if (files.length > 0) {
                        const file = files[0];
                        if (file.type.startsWith('video/')) {
                          setSelectedFile(file);
                        } else {
                          alert('Please upload a video file (MP4, MOV)');
                        }
                      }
                    }}
                  >
                    {selectedFile ? (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-sm font-medium text-green-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mb-4">
                          <label htmlFor="video-upload-practice-5" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload Video
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              MP4, MOV up to 100MB
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    <input
                      id="video-upload-practice-5"
                      name="files"
                      type="file"
                      className="sr-only"
                      accept=".mp4,.mov"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 100 * 1024 * 1024) {
                            alert('File size must be less than 100MB');
                            return;
                          }
                          setSelectedFile(file);
                        }
                      }}
                    />
                    {!selectedFile && (
                      <div className="text-xs text-gray-500">
                        <p>Drag and drop your video here, or click to browse</p>
                      </div>
                    )}
                    {selectedFile && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="progress progress-lg mt-4">
                <div 
                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"
                  style={{ width: `${uploadProgress}%` }}
                >
                  Please Wait... {uploadProgress}%
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <ActionButton 
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Analyse Video'}
              </ActionButton>
              <ActionButton 
                variant="success"
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
                      <span className="text-sm font-medium text-gray-600">4.8</span>
                    </div>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Mastering Eye Contact
                  </h1>
                  
                  <p className="text-gray-600 mb-4">
                    Learn how to maintain appropriate eye contact to build trust and engagement
                  </p>
                  
                  {/* Course Metrics */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>45 min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>12 Sessions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>0/12 Completed</span>
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

                  {/* Content Display */}
                  {selectedSession.type === 'video' ? (
                    <div className="mb-6">
                      {selectedSession.id === 'what-is-body-language' ? (
                        <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                          <video 
                            id="video" 
                            width="100%" 
                            height="100%"
                            controls 
                            controlsList="nodownload" 
                            style={{objectFit: 'cover', width: '100%', height: '100%'}}
                            className="rounded-lg w-full h-full"
                          >
                            <source src="../AppVideo/BodyLanguage/Body%20Language%20Lesson%20Plan%201-1.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
                              <Play className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm">Video content would be displayed here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedSession.type === 'quiz' ? (
                    <div className="mb-6">
                      <div className="bg-purple-50 rounded-lg p-6">
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <p className="text-purple-600 text-sm font-medium">Quiz Assessment</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      {selectedSession.id !== 'dos-and-donts' && selectedSession.id !== 'body-language-practice' && selectedSession.id !== 'body-language-fun-facts' && selectedSession.id !== 'what-is-facial-emotion' && selectedSession.id !== 'how-to-improve-facial-score' && selectedSession.id !== 'facial-emotion-practice' && selectedSession.id !== 'body-language-practice-again' && selectedSession.id !== 'facial-score-practice-1' && selectedSession.id !== 'facial-score-practice-2' && (
                        <div className="bg-blue-50 rounded-lg p-6">
                          <div className="text-center">
                            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                              <FileText className="w-10 h-10 text-blue-400" />
                            </div>
                            <p className="text-blue-600 text-sm font-medium">
                              {selectedSession.id === 'what-is-body-language' ? 'Body Language Content' :
                               'Text-based lesson content'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Session Content */}
                  <div className="prose prose-sm max-w-none">
                    {content.content && <p className="text-gray-700 leading-relaxed mb-6">{content.content}</p>}
                    
                    {/* Special content for what is body language section */}
                    {selectedSession.id === 'what-is-body-language' && (
                      <div className="mt-6">
                        {/* Video Instructions */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                          <h3 className="mb-3 font-semibold text-blue-900">
                            Watch the video for tips and techniques to improve your Body Language Skills. Then, press done to move to the next lesson.
                          </h3>
                        </div>

                        {/* Self Assessment Section */}
                        <div className="mb-6 p-4 bg-green-50 rounded-lg">
                          <h3 className="mb-3 font-semibold text-green-900">
                            <span style={{color: '#eb7068'}}>1.2 </span> 
                            Do self-assessment on your Body Language.
                          </h3>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-4">
                          <ActionButton 
                            variant="primary"
                            onClick={handleNextItem}
                          >
                            Done
                          </ActionButton>
                        </div>
                      </div>
                    )}
                    
                    {/* Special content for facial emotion section */}
                    {selectedSession.id === 'what-is-facial-emotion' && (
                      <div className="mt-6">
                        {/* Video Section */}
                        <div className="mb-6">
                          <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                            <video
                              id="video1"
                              width="100%"
                              height="100%"
                              controls
                              controlsList="nodownload"
                              style={{objectFit: 'cover', width: '100%', height: '100%'}}
                              className="rounded-lg w-full h-full"
                            >
                              <source src="../AppVideo/BodyLanguage/Body%20Language%20Lesson%203-6%20(App).mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </div>

                        {/* Navigation Button */}
                        <div className="flex justify-end">
                          <ActionButton
                            variant="primary"
                            onClick={handleNextLesson}
                          >
                            Next Lesson
                          </ActionButton>
                        </div>
                      </div>
                    )}

                    

                    {/* Special content for facial score improvement */}
                    {selectedSession.id === 'how-to-improve-facial-score' && (
                      <div className="mt-6">
                        {/* Video Section */}
                        <div className="mb-6">
                          <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                            <video
                              id="video4"
                              width="100%"
                              height="100%"
                              controls
                              controlsList="nodownload"
                              style={{objectFit: 'cover', width: '100%', height: '100%'}}
                              className="rounded-lg w-full h-full"
                            >
                              <source src="../AppVideo/BodyLanguage/Body%20Language%20Lesson%203-1%20(App).mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-end space-x-4">
                          <ActionButton
                            variant="success"
                            onClick={handleNextLesson}
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
                    )}





                    {/* Special content for dos and don'ts section */}
                    {selectedSession.id === 'dos-and-donts' && (
                      <div className="mt-6">
                        {/* Video Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Video 1 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-1.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Shaking your foot seated while smiling</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 2 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-2.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Crossed legs seated in a chair</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 3 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-3 (App).mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Clasped hands.</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 4 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-3b (App).mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Meaningful Hand Gestures</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 5 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-4.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Fidgeting by rubbing your nose</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 6 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-5.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Moving around frequently in a chair</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 7 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-6 (App).mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Shifting weight from side to side</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 8 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-7.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Standing with your feet too far apart</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 9 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-8.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Looking away and not maintaining eye contact</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 10 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-9.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Tilting head one side or other</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 11 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-10.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Facial expression which is blank.</strong>
                              </h4>
                            </div>
                          </div>

                          {/* Video 12 */}
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <video 
                              width="100%" 
                              controls 
                              controlsList="nodownload" 
                              style={{objectFit: 'cover'}}
                              className="w-full h-64"
                            >
                              <source src="../AppVideo/BodyLanguage/Body Language Lesson Plan 2-11.mp4" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900">
                                <strong>Facial expression of disgust and then angry</strong>
                              </h4>
                            </div>
                          </div>
                        </div>

                        {/* Done Button */}
                        <div className="flex justify-end mt-6">
                          <ActionButton 
                            variant="success"
                            onClick={() => {
                              // Handle done button click - could navigate to next section or show completion
                              console.log('Learning clips completed');
                            }}
                          >
                            Done
                          </ActionButton>
                        </div>
                      </div>
                    )}

                    {/* Special content for body language practice section */}
                    {selectedSession.id === 'body-language-practice' && (
                      <Practice1Component />
                    )}

                    {/* Special content for facial emotion practice */}
                    {selectedSession.id === 'facial-emotion-practice' && (
                      <Practice2Component />
                    )}

                    {/* Special content for practice again section */}
                    {selectedSession.id === 'body-language-practice-again' && (
                      <Practice3Component />
                    )}

                    {/* Special content for facial score practice 1 */}
                    {selectedSession.id === 'facial-score-practice-1' && (
                      <Practice4Component />
                    )}

                    {/* Special content for facial score practice 2 */}
                    {selectedSession.id === 'facial-score-practice-2' && (
                      <Practice5Component />
                    )}

                    {/* Special content for fun facts section */}
                    {selectedSession.id === 'body-language-fun-facts' && (
                      <div className="mt-6">
                        {/* Section 1: Eye Contact */}
                        <div className="mb-8">
                          <h3 className="mb-4 font-semibold text-gray-900">
                            <span style={{color: '#eb7068'}}>1. </span> Eye contact
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <img 
                                className="w-full h-48 object-cover" 
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop" 
                                alt="Asian culture eye contact"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Asian+Culture+Eye+Contact";
                                }}
                              />
                              <div className="p-4">
                                <p className="text-gray-700">
                                  <strong>Picture 1:</strong> In Asian culture, direct eye contact continuously is considered disrespectful, and makes the other person feel intimidated.
                                </p>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <img 
                                className="w-full h-48 object-cover" 
                                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=300&fit=crop" 
                                alt="Western culture eye contact"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300/059669/FFFFFF?text=Western+Culture+Eye+Contact";
                                }}
                              />
                              <div className="p-4">
                                <p className="text-gray-700">
                                  <strong>Picture 2:</strong> However, in Western culture, direct eye contact means you are engaged and caring about the conversation.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Personal Distance */}
                        <div className="mb-8">
                          <h3 className="mb-4 font-semibold text-gray-900">
                            <span style={{color: '#eb7068'}}>2. </span> Personal Distance
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <img 
                                className="w-full h-48 object-cover" 
                                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop" 
                                alt="India and China personal distance"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300/DC2626/FFFFFF?text=India+China+Personal+Distance";
                                }}
                              />
                              <div className="p-4">
                                <p className="text-gray-700">
                                  <strong>Picture 1:</strong> In India and China people huddle together and stand very close.
                                </p>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <img 
                                className="w-full h-48 object-cover" 
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop" 
                                alt="American and British personal distance"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=American+British+Personal+Distance";
                                }}
                              />
                              <div className="p-4">
                                <p className="text-gray-700">
                                  <strong>Picture 2:</strong> On the other hand, Americans and the British want a lot of distance and personal space.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Gestures */}
                        <div className="mb-8">
                          <h3 className="mb-4 font-semibold text-gray-900">
                            <span style={{color: '#eb7068'}}>3. </span> Gestures
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <img 
                                className="w-full h-48 object-cover" 
                                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=300&fit=crop" 
                                alt="Southern European gestures"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Southern+European+Gestures";
                                }}
                              />
                              <div className="p-4">
                                <p className="text-gray-700">
                                  <strong>Picture 1:</strong> Southern Europeans like Italians and the Spanish are more open and expressive and use a lot of gestures such as moving arms and legs when they speak.
                                </p>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <img 
                                className="w-full h-48 object-cover" 
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop" 
                                alt="Asian gestures"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300/10B981/FFFFFF?text=Asian+Gestures";
                                }}
                              />
                              <div className="p-4">
                                <p className="text-gray-700">
                                  <strong>Picture 2:</strong> Asians generally use a lot less gestures when they speak.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Hiding Feelings */}
                        <div className="mb-8">
                          <h3 className="mb-4 font-semibold text-gray-900">
                            <span style={{color: '#eb7068'}}>4. </span> Hiding Feelings
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <img 
                                className="w-full h-48 object-cover" 
                                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop" 
                                alt="South Korea and Indonesia hiding feelings"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300/EC4899/FFFFFF?text=Hiding+Feelings";
                                }}
                              />
                              <div className="p-4">
                                <p className="text-gray-700">
                                  <strong>Picture: </strong> In South Korea, laughter is used to hide your true feelings.
                                </p>
                                <p className="text-gray-700 mt-2">
                                  In Indonesia, people smile to hide feelings because they do not like to disagree or show negative feelings in public.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 5: Saying No */}
                        <div className="mb-8">
                          <h3 className="mb-4 font-semibold text-gray-900">
                            <span style={{color: '#eb7068'}}>5. </span> Saying No
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                              <img 
                                className="w-full h-48 object-cover" 
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop" 
                                alt="Japanese and Indian saying no"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Saying+No";
                                }}
                              />
                              <div className="p-4">
                                <p className="text-gray-700">
                                  <strong>Picture: </strong> It is hard for Japanese people to say no. Therefore, don't interpret a nod as a yes in Japan.
                                </p>
                                <p className="text-gray-700 mt-2">
                                  Similarly, Indians find it also hard to say no.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-end space-x-4">
                          <ActionButton
                            variant="success"
                            onClick={() => {
                              console.log('Submit clicked');
                            }}
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
                    )}

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
                                <Button
                                  onClick={resetQuiz}
                                  variant="outline"
                                  className="text-purple-600 border-purple-600 hover:bg-purple-50"
                                >
                                  Reset Quiz
                                </Button>
                                <Button
                                  onClick={handleNextQuizQuestion}
                                  disabled={quizAnswers[currentQuizQuestion] === undefined}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  {currentQuizQuestion === content.quiz.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                                </Button>
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
                        {selectedSession.id !== 'what-is-body-language' && selectedSession.id !== 'body-language-practice-again' && selectedSession.id !== 'facial-score-practice-1' && selectedSession.id !== 'facial-score-practice-2' && content.objectives.length > 0 && (
                          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
                            <ul className="space-y-1 text-sm text-blue-800">
                              {content.objectives.map((objective, index) => (
                                <li key={index}>• {objective}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedSession.id !== 'what-is-body-language' && selectedSession.id !== 'body-language-practice-again' && selectedSession.id !== 'facial-score-practice-1' && selectedSession.id !== 'facial-score-practice-2' && content.keyPoints.length > 0 && (
                          <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
                            <ul className="space-y-1 text-sm text-green-800">
                              {content.keyPoints.map((point, index) => (
                                <li key={index}>• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>

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
