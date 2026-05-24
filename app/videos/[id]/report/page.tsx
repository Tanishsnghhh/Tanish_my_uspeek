'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { VideoReport } from '@/components/videos/video-report';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, ArrowLeft, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';

interface DjangoAnalysisData {
  filename: string;
  file_size: string;
  language: string;
  duration: string;
  original_transcript: string;
  corrected_transcript: string;
  summary: string;
  keywords: string;
  repeated_words: Array<{ word: string; count: number }>;
  filler_words: Array<{ word: string; count: number; percentage: number }>;
  sentiment_analysis: any;
  content_assessment: any;
  strengths_improvements: any;
  emotion_analysis: any;
  confidence_analysis: any;
}

interface PoseAnalysisData {
  frames_processed: number;
  smiles: string;
  head_moves: string;
  hand_moves: string;
  eye_contact: string;
  leg_moves: string;
  foot_moves: string;
  audio: {
    duration_sec: number;
    volume_db: number;
    mean_pitch_hz: number;
    pitch_range: string;
    num_pauses: number;
    spoken_duration_sec: number;
  };
}

interface CoachingData {
  summary: string;
  interpretation: string;
  suggestions: string;
}

export default function VideoReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const uploadId = params.id as string;
  
  const [analysisData, setAnalysisData] = useState<DjangoAnalysisData | null>(null);
  const [poseData, setPoseData] = useState<PoseAnalysisData | null>(null);
  const [coachingData, setCoachingData] = useState<CoachingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle video upload
  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev >= 90 ? 90 : prev + 10);
      }, 500);

      // Upload to Django backend
      const formData = new FormData();
      formData.append('file', file);
      
      // Add user information to the Django request
      if (user) {
        formData.append('userId', `${user.role}:${user.id}`);
        formData.append('accountId', user.corporateAccountId || 'default');
        formData.append('userRole', user.role);
        formData.append('userEmail', user.email);
        formData.append('userName', `${user.firstName} ${user.lastName}`.trim());
      } else {
        formData.append('userId', 'guest:unknown');
        formData.append('accountId', 'default');
        formData.append('userRole', 'guest');
      }

      const response = await fetch('http://localhost:8000/app/upload-video/', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        
        // Save analysis data to MongoDB instead of localStorage
        try {
          const mongoResponse = await fetch('/api/video-analysis/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-account-id': user?.corporateAccountId || 'default',
              'x-user-id': user ? `${user.role}:${user.id}` : 'guest:unknown'
            },
            body: JSON.stringify({
              uploadId: uploadId,
              userId: user ? `${user.role}:${user.id}` : 'guest:unknown',
              userRole: user?.role || 'guest',
              accountId: user?.corporateAccountId || 'default',
              analysisData: result
            })
          });
          
          if (mongoResponse.ok) {
            console.log('✅ Analysis data saved to MongoDB');
            // Remove localStorage as it's now in MongoDB
            localStorage.removeItem('lastAnalysis');
            localStorage.removeItem('lastAnalysisId');
          } else {
            console.error('Failed to save to MongoDB, keeping localStorage as backup');
            localStorage.setItem('lastAnalysis', JSON.stringify(result));
            localStorage.setItem('lastAnalysisId', uploadId);
          }
        } catch (mongoError) {
          console.error('MongoDB save error, using localStorage backup:', mongoError);
          localStorage.setItem('lastAnalysis', JSON.stringify(result));
          localStorage.setItem('lastAnalysisId', uploadId);
        }
        
        // Update state with the new data
        if (result.transcript) setAnalysisData(result.transcript);
        if (result.poseAnalysis) setPoseData(result.poseAnalysis);
        if (result.coaching) setCoachingData(result.coaching);
        
        setError(null);
        setLoading(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please check your connection and try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    // Load analysis data from MongoDB first, fallback to localStorage
    const loadAnalysisData = async () => {
      // Wait for auth to complete
      if (authLoading) return;
      
      try {
        // Try to fetch from MongoDB first with proper user context
        const accountId = user?.corporateAccountId || 'default';
        const response = await fetch(`/api/video-analysis/results/${uploadId}?accountId=${accountId}`, {
          headers: {
            'x-account-id': accountId,
            'x-user-id': user ? `${user.role}:${user.id}` : 'guest:unknown'
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('✅ Analysis data loaded from MongoDB');
            
            // The API already returns Django-formatted data, no need to transform again
            const data = result.data;
            
            setAnalysisData(data.transcript);
            setPoseData(data.poseAnalysis);
            setCoachingData(data.coaching);
            setLoading(false);
            return;
          } else {
            console.log('⚠️ MongoDB response was not successful:', result);
          }
        } else {
          const errorResult = await response.json();
          console.log('❌ MongoDB fetch failed:', response.status, errorResult);
        }
        
        // Fallback to localStorage if MongoDB fails
        console.log('📦 Falling back to localStorage');
        const savedAnalysis = localStorage.getItem('lastAnalysis');
        const savedAnalysisId = localStorage.getItem('lastAnalysisId');
        
        // Check if the ID matches (basic validation)
        if (savedAnalysis && (!savedAnalysisId || savedAnalysisId === uploadId)) {
          try {
            const data = JSON.parse(savedAnalysis);
            setAnalysisData(data.transcript);
            setPoseData(data.poseAnalysis);
            setCoachingData(data.coaching);
            setLoading(false);
            return;
          } catch (err) {
            console.error('Error parsing saved analysis:', err);
          }
        }
        
        // If no data found anywhere, show upload interface
        setLoading(false);
        
      } catch (error) {
        console.error('Error loading analysis data from MongoDB:', error);
        
        // Final fallback to localStorage
        const savedAnalysis = localStorage.getItem('lastAnalysis');
        const savedAnalysisId = localStorage.getItem('lastAnalysisId');
        
        if (savedAnalysis && (!savedAnalysisId || savedAnalysisId === uploadId)) {
          try {
            const data = JSON.parse(savedAnalysis);
            setAnalysisData(data.transcript);
            setPoseData(data.poseAnalysis);
            setCoachingData(data.coaching);
            setLoading(false);
            return;
          } catch (err) {
            console.error('Error parsing saved analysis:', err);
          }
        }
        
        // If no saved data, show upload interface
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [uploadId, user, authLoading]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analysis results...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show upload interface if no data available
  if (!analysisData && !uploading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/videos')}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Video Analysis Report</h1>
                <p className="text-gray-600 mt-1">Upload your video to get started</p>
              </div>
            </div>
          </div>

          {/* Video Upload Area */}
          <div className="relative w-full h-96 bg-black rounded-xl overflow-hidden group cursor-pointer">
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
              {uploading ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm animate-pulse">
                    <Upload className="w-10 h-10 text-blue-400" />
                  </div>
                  <div className="text-xl font-medium">Processing Video...</div>
                  <div className="text-gray-400 text-sm">AI Analysis in progress</div>
                  <div className="w-64 mx-auto">
                    <Progress value={uploadProgress} className="h-2" />
                    <div className="text-xs text-gray-400 mt-2">{uploadProgress}% Complete</div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="text-4xl">🎬</div>
                  </div>
                  <div className="text-xl font-medium">Upload Video for Analysis</div>
                  <div className="text-gray-400 text-sm">Click to upload and start AI analysis</div>
                </div>
              )}
            </div>

            {/* Upload Button Overlay */}
            {!uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300">
                <Button
                  size="icon"
                  className="bg-white/90 hover:bg-white text-gray-900 border-0 rounded-full w-16 h-16 shadow-2xl transition-all duration-300 transform hover:scale-110"
                  onClick={() => document.getElementById('video-upload-input')?.click()}
                >
                  <Upload className="w-6 h-6" />
                </Button>
              </div>
            )}

            {/* Hidden file input */}
            <input
              id="video-upload-input"
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleVideoUpload(file);
                }
              }}
              className="hidden"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Show the VideoReport component when data is available
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/videos')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Analysis Complete
            </Badge>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Use the VideoReport component */}
        <VideoReport 
          analysisData={analysisData}
          poseData={poseData}
          coachingData={coachingData}
          uploadId={uploadId} // Pass the uploadId for dynamic thumbnails
          userData={user ? {
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0],
            email: user.email,
            role: user.role,
            title: user.jobTitle || user.role,
            department: user.department,
            isAdmin: user.role === 'ADMIN' || user.role === 'CORPORATE_ADMIN',
            employeeId: user.employeeId,
            position: user.jobTitle
          } : null}
          onClose={() => router.push('/videos')}
        />
      </div>
    </DashboardLayout>
  );
}