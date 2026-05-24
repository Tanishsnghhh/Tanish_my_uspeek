// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { DashboardLayout } from '@/components/layout/dashboard-layout';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import { 
//   ArrowLeft, 
//   BookOpen, 
//   Clock, 
//   Users, 
//   CheckCircle, 
//   Play, 
//   Star,
//   Video,
//   FileText
// } from 'lucide-react';

// interface Session {
//   id: string;
//   title: string;
//   description: string;
//   duration: string;
//   type: 'video' | 'text';
//   isActive: boolean;
//   isCompleted: boolean;
// }

// // Lesson content data based on session type
// const lessonContent = {
//   '1': {
//     title: 'Introduction to Eye Contact',
//     description: 'Understanding the importance of eye contact in communication',
//     content: 'Eye contact is the foundation of effective communication. It serves as a bridge between speaker and listener, conveying confidence, sincerity, and engagement. In this introductory session, we\'ll explore why eye contact matters and how it impacts our daily interactions.',
//     objectives: [
//       'Understand the fundamental role of eye contact in communication',
//       'Recognize cultural differences in eye contact practices',
//       'Learn the basic principles of effective eye contact',
//       'Identify common eye contact mistakes to avoid'
//     ],
//     keyPoints: [
//       'Eye contact builds trust and credibility',
//       'It shows active listening and engagement',
//       'Cultural sensitivity is crucial for global communication',
//       'Natural eye contact feels comfortable and authentic'
//     ]
//   },
//   '2': {
//     title: 'Psychology Behind Eye Contact',
//     description: 'Learn the psychological impact of eye contact on human behavior',
//     content: 'The psychology of eye contact reveals fascinating insights into human behavior and social dynamics. Research shows that eye contact activates specific areas of the brain associated with social cognition and emotional processing. Understanding these psychological mechanisms can help you use eye contact more effectively.',
//     objectives: [
//       'Understand the neurological basis of eye contact',
//       'Learn how eye contact affects emotional responses',
//       'Explore the connection between eye contact and trust',
//       'Study the impact of eye contact on memory and attention'
//     ],
//     keyPoints: [
//       'Eye contact releases oxytocin, the "trust hormone"',
//       'It activates mirror neurons for empathy',
//       'Prolonged eye contact can create intimacy',
//       'Cultural differences affect psychological responses'
//     ]
//   },
//   '3': {
//     title: 'Eye Contact Techniques',
//     description: 'Master the fundamental techniques for effective eye contact',
//     content: 'Mastering eye contact requires specific techniques and consistent practice. This session covers practical strategies for maintaining appropriate eye contact in various situations, from one-on-one conversations to large group presentations. You\'ll learn how to balance engagement with comfort.',
//     objectives: [
//       'Master the 50/70 rule for eye contact timing',
//       'Learn the triangle technique for group presentations',
//       'Practice natural eye contact patterns',
//       'Develop confidence in maintaining eye contact'
//     ],
//     keyPoints: [
//       'Use the 50/70 rule: 50% when listening, 70% when speaking',
//       'Create a triangle pattern: left eye, right eye, mouth',
//       'Break eye contact naturally every 3-5 seconds',
//       'Match your eye contact to the intimacy level of the conversation'
//     ]
//   },
//   '4': {
//     title: 'Basic Eye Contact Practice',
//     description: 'Practice maintaining eye contact while speaking',
//     content: 'Practice is essential for developing comfortable and effective eye contact skills. This session provides structured exercises and scenarios to help you build confidence and natural eye contact habits. Through guided practice, you\'ll develop muscle memory for appropriate eye contact patterns.',
//     objectives: [
//       'Practice eye contact in mirror exercises',
//       'Role-play different conversation scenarios',
//       'Build stamina for maintaining eye contact',
//       'Develop natural eye contact patterns'
//     ],
//     keyPoints: [
//       'Start with mirror practice for self-awareness',
//       'Gradually increase eye contact duration',
//       'Practice with friends and family first',
//       'Record yourself to identify improvement areas'
//     ]
//   },
//   '5': {
//     title: 'Advanced Eye Contact Strategies',
//     description: 'Advanced techniques for different audience sizes',
//     content: 'Advanced eye contact strategies involve adapting your approach based on audience size, cultural context, and communication goals. This session covers sophisticated techniques for large audiences, virtual meetings, and cross-cultural communication scenarios.',
//     objectives: [
//       'Master eye contact for large audiences',
//       'Learn virtual meeting eye contact techniques',
//       'Adapt eye contact for different cultures',
//       'Use eye contact for leadership and authority'
//     ],
//     keyPoints: [
//       'Use the "lighthouse" technique for large groups',
//       'Maintain eye contact through camera lenses',
//       'Research cultural norms before international meetings',
//       'Use eye contact to establish leadership presence'
//     ]
//   },
//   '6': {
//     title: 'Final Assessment',
//     description: 'Test your eye contact skills with real scenarios',
//     content: 'The final assessment evaluates your eye contact mastery through realistic scenarios and feedback. This comprehensive evaluation covers all aspects of eye contact: timing, cultural sensitivity, confidence, and natural expression. Success in this assessment demonstrates readiness for real-world application.',
//     objectives: [
//       'Demonstrate mastery of all eye contact techniques',
//       'Apply skills in realistic scenarios',
//       'Receive comprehensive feedback',
//       'Create a personal improvement plan'
//     ],
//     keyPoints: [
//       'Assessment covers all learned techniques',
//       'Real-time feedback from instructors',
//       'Cultural sensitivity evaluation',
//       'Personalized improvement recommendations'
//     ]
//   }
// };

// const courseSessions: Session[] = [
//   {
//     id: '1',
//     title: 'Introduction to Eye Contact',
//     description: 'Understanding the importance of eye contact in communication',
//     duration: '8:00',
//     type: 'video',
//     isActive: true,
//     isCompleted: false
//   },
//   {
//     id: '2',
//     title: 'Psychology Behind Eye Contact',
//     description: 'Learn the psychological impact of eye contact on human behavior',
//     duration: '6:00',
//     type: 'text',
//     isActive: false,
//     isCompleted: false
//   },
//   {
//     id: '3',
//     title: 'Eye Contact Techniques',
//     description: 'Master the fundamental techniques for effective eye contact',
//     duration: '7:00',
//     type: 'text',
//     isActive: false,
//     isCompleted: false
//   },
//   {
//     id: '4',
//     title: 'Basic Eye Contact Practice',
//     description: 'Practice maintaining eye contact while speaking',
//     duration: '5:00',
//     type: 'video',
//     isActive: false,
//     isCompleted: false
//   },
//   {
//     id: '5',
//     title: 'Advanced Eye Contact Strategies',
//     description: 'Advanced techniques for different audience sizes',
//     duration: '9:00',
//     type: 'text',
//     isActive: false,
//     isCompleted: false
//   },
//   {
//     id: '6',
//     title: 'Final Assessment',
//     description: 'Test your eye contact skills with real scenarios',
//     duration: '10:00',
//     type: 'video',
//     isActive: false,
//     isCompleted: false
//   }
// ];

// // Lesson Content Component
// const LessonContent = ({ session, isStarted, isCompleted, onStart, onComplete }: {
//   session: Session;
//   isStarted: boolean;
//   isCompleted: boolean;
//   onStart: () => void;
//   onComplete: () => void;
// }) => {
//   const content = lessonContent[session.id as keyof typeof lessonContent];
  
//   if (!content) return null;

//   return (
//     <div className="p-6">
//       {/* Session Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center space-x-2">
//           {session.type === 'video' ? (
//             <Video className="w-5 h-5 text-blue-600" />
//           ) : (
//             <FileText className="w-5 h-5 text-blue-600" />
//           )}
//           <h2 className="text-xl font-bold text-gray-900">{content.title}</h2>
//         </div>
//         <div className="text-sm text-gray-500">{session.duration}</div>
//       </div>

//       {/* Session Status Section */}
//       <div className="text-center mb-8">
//         <div className="text-4xl font-bold text-gray-900 mb-2">{session.duration}</div>
//         <div className="text-sm text-gray-500 mb-6">
//           {isStarted ? 'Session in progress...' : 'Ready to start'}
//         </div>
        
//         <div className="flex items-center justify-center space-x-4">
//           <Button
//             onClick={onStart}
//             className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
//             disabled={isStarted}
//           >
//             <Play className="w-4 h-4 mr-2" />
//             Start Session
//           </Button>
          
//           <Button
//             onClick={onComplete}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
//             disabled={!isStarted || isCompleted}
//           >
//             <CheckCircle className="w-4 h-4 mr-2" />
//             Complete Session
//           </Button>
//         </div>
//       </div>

//       {/* Session Description */}
//       <div className="mb-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-3">{content.description}</h3>
//       </div>

//       {/* Content Display */}
//       {session.type === 'video' ? (
//         <div className="mb-6">
//           <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
//             <div className="text-center">
//               <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center mb-4">
//                 <Play className="w-10 h-10 text-gray-400" />
//               </div>
//               <p className="text-gray-500 text-sm">Video content would be displayed here</p>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="mb-6">
//           <div className="bg-blue-50 rounded-lg p-6">
//             <div className="text-center">
//               <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
//                 <FileText className="w-10 h-10 text-blue-400" />
//               </div>
//               <p className="text-blue-600 text-sm font-medium">Text-based lesson content</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Session Content */}
//       <div className="prose prose-sm max-w-none">
//         <p className="text-gray-700 leading-relaxed mb-6">{content.content}</p>
        
//         <div className="mt-6 p-4 bg-blue-50 rounded-lg">
//           <h4 className="font-semibold text-blue-900 mb-2">Key Learning Objectives:</h4>
//           <ul className="space-y-1 text-sm text-blue-800">
//             {content.objectives.map((objective, index) => (
//               <li key={index}>• {objective}</li>
//             ))}
//           </ul>
//         </div>

//         <div className="mt-4 p-4 bg-green-50 rounded-lg">
//           <h4 className="font-semibold text-green-900 mb-2">Key Points:</h4>
//           <ul className="space-y-1 text-sm text-green-800">
//             {content.keyPoints.map((point, index) => (
//               <li key={index}>• {point}</li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* Progress Indicator */}
//       {isStarted && (
//         <div className="mt-6 p-4 bg-green-50 rounded-lg">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm font-medium text-green-800">Session Progress</span>
//             <span className="text-sm text-green-600">75%</span>
//           </div>
//           <Progress value={75} className="h-2" />
//         </div>
//       )}
//     </div>
//   );
// };

// export default function StartLessonGlobal() {
//   const router = useRouter();
//   const [selectedSession, setSelectedSession] = useState<Session>(courseSessions[0]);
//   const [isSessionStarted, setIsSessionStarted] = useState(false);
//   const [isSessionCompleted, setIsSessionCompleted] = useState(false);

//   const completedSessions = courseSessions.filter(session => session.isCompleted).length;
//   const totalSessions = courseSessions.length;
//   const completionPercentage = (completedSessions / totalSessions) * 100;

//   const handleBackToLessons = () => {
//     router.push('/learning-lessons');
//   };

//   const handleSessionSelect = (session: Session) => {
//     setSelectedSession(session);
//     setIsSessionStarted(false);
//     setIsSessionCompleted(false);
//   };

//   const handleStartSession = () => {
//     setIsSessionStarted(true);
//   };

//   const handleCompleteSession = () => {
//     setIsSessionCompleted(true);
//     // Update the session completion status
//     const updatedSessions = courseSessions.map(session => 
//       session.id === selectedSession.id 
//         ? { ...session, isCompleted: true }
//         : session
//     );
//   };

//   return (
//     <DashboardLayout>
//       <div className="min-h-screen bg-gray-50 p-6">
//         {/* Header Navigation */}
//         <div className="mb-6">
//           <Button
//             variant="ghost"
//             onClick={handleBackToLessons}
//             className="text-gray-600 hover:text-gray-900 p-0 h-auto font-medium"
//           >
//             <ArrowLeft className="w-4 h-4 mr-2" />
//             Back to Lessons
//           </Button>
//         </div>

//         {/* Course Overview Card */}
//         <Card className="mb-6 bg-white border-0 shadow-lg">
//           <CardContent className="p-6">
//             <div className="flex items-start justify-between">
//               <div className="flex items-start space-x-4">
//                 {/* Course Icon */}
//                 <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
//                   <BookOpen className="w-8 h-8 text-blue-600" />
//                 </div>
                
//                 {/* Course Info */}
//                 <div className="flex-1">
//                   <div className="flex items-center space-x-2 mb-2">
//                     <Badge variant="secondary" className="bg-blue-100 text-blue-800">
//                       COURSE
//                     </Badge>
//                     <Badge className="bg-green-100 text-green-800">
//                       Beginner
//                     </Badge>
//                     <div className="flex items-center space-x-1">
//                       <Star className="w-4 h-4 text-yellow-500 fill-current" />
//                       <span className="text-sm font-medium text-gray-600">4.8</span>
//                     </div>
//                   </div>
                  
//                   <h1 className="text-2xl font-bold text-gray-900 mb-2">
//                     Mastering Eye Contact
//                   </h1>
                  
//                   <p className="text-gray-600 mb-4">
//                     Learn how to maintain appropriate eye contact to build trust and engagement
//                   </p>
                  
//                   {/* Course Metrics */}
//                   <div className="flex items-center space-x-6 text-sm text-gray-500">
//                     <div className="flex items-center space-x-1">
//                       <Clock className="w-4 h-4" />
//                       <span>45 min</span>
//                     </div>
//                     <div className="flex items-center space-x-1">
//                       <Users className="w-4 h-4" />
//                       <span>{totalSessions} Sessions</span>
//                     </div>
//                     <div className="flex items-center space-x-1">
//                       <CheckCircle className="w-4 h-4" />
//                       <span>{completedSessions}/{totalSessions} Completed</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Completion Status */}
//               <div className="text-right">
//                 <div className="text-2xl font-bold text-blue-600">
//                   {completionPercentage}%
//                 </div>
//                 <div className="text-sm text-gray-500">Completed</div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Main Content Area */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Left Sidebar - Course Sessions */}
//           <div className="lg:col-span-1">
//             <Card className="bg-white border-0 shadow-lg h-fit">
//               <CardHeader className="pb-4">
//                 <CardTitle className="text-lg font-semibold text-gray-900">
//                   Course Sessions
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-0">
//                 <div className="space-y-2 max-h-96 overflow-y-auto">
//                   {courseSessions.map((session) => (
//                     <div
//                       key={session.id}
//                       onClick={() => handleSessionSelect(session)}
//                       className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
//                         selectedSession.id === session.id
//                           ? 'bg-blue-50 border-l-4 border-blue-500' 
//                           : 'border-l-4 border-transparent'
//                       }`}
//                     >
//                       <div className="flex items-start space-x-3">
//                         <div className="flex-shrink-0">
//                           {session.isCompleted ? (
//                             <CheckCircle className="w-5 h-5 text-green-500" />
//                           ) : (
//                             <Play className="w-5 h-5 text-gray-400" />
//                           )}
//                         </div>
                        
//                         <div className="flex-1 min-w-0">
//                           <h3 className="text-sm font-medium text-gray-900 mb-1">
//                             {session.title}
//                           </h3>
//                           <p className="text-xs text-gray-500 mb-2">
//                             {session.description}
//                           </p>
                          
//                           <div className="flex items-center justify-between">
//                             <span className="text-xs text-gray-400">
//                               {session.duration}
//                             </span>
//                             <Badge 
//                               variant="secondary" 
//                               className={`text-xs ${
//                                 session.type === 'video' 
//                                   ? 'bg-gray-100 text-gray-700' 
//                                   : 'bg-blue-100 text-blue-700'
//                               }`}
//                             >
//                               {session.type}
//                             </Badge>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Right Main Content - Session Details */}
//           <div className="lg:col-span-2">
//             <Card className="bg-white border-0 shadow-lg">
//               <CardContent className="p-0">
//                 <LessonContent
//                   session={selectedSession}
//                   isStarted={isSessionStarted}
//                   isCompleted={isSessionCompleted}
//                   onStart={handleStartSession}
//                   onComplete={handleCompleteSession}
//                 />
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// } 