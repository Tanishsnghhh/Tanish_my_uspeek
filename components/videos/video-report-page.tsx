// 'use client';

// import { useRouter } from 'next/navigation';
// import { DashboardLayout } from '@/components/layout/dashboard-layout';
// import { VideoReport } from '@/components/videos/video-report';
// import { Button } from '@/components/ui/button';
// import { ArrowLeft } from 'lucide-react';
// import { useAuth } from '@/hooks/use-auth';

// interface VideoReportPageProps {
//   video: {
//     id: string;
//     title: string;
//     speaker: string;
//     uploadDate: string;
//     duration: string;
//     overallScore: number;
//     bodyLanguageScore: number;
//     vocalToneScore: number;
//     wordPowerScore: number;
//     thumbnail?: string;
//   };
// }

// export function VideoReportPage({ video }: VideoReportPageProps) {
//   const router = useRouter();
//   const { user } = useAuth();

//   return (
//     <DashboardLayout>
//       <div className="space-y-6">
//         <div className="flex items-center space-x-4">
//           <Button 
//             variant="outline" 
//             onClick={() => router.back()}
//             className="flex items-center space-x-2"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             <span>Back to Videos</span>
//           </Button>
//           <h1 className="text-2xl font-bold text-gray-900">Video Analysis Report</h1>
//         </div>
//         <VideoReport 
//           analysisData={null}
//           poseData={null}
//           coachingData={null}
//           userData={user ? {
//             name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0],
//             email: user.email,
//             role: user.role,
//             title: user.jobTitle || user.role,
//             department: user.department,
//             isAdmin: user.role === 'ADMIN' || user.role === 'CORPORATE_ADMIN',
//             employeeId: user.employeeId,
//             position: user.jobTitle
//           } : null}
//           onClose={() => router.back()} 
//         />
//       </div>
//     </DashboardLayout>
//   );
// }