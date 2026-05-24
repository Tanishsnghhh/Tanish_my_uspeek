'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileVideo, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Play,
  FileAudio,
  Film,
  Clock,
  Zap,
  Brain,
  Target
} from 'lucide-react';

interface VideoUploadProps {
  onClose: () => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  icon: any;
  description: string;
}

export function VideoUpload({ onClose }: VideoUploadProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState<string>('upload');
  
  const processingSteps: ProcessingStep[] = [
    {
      id: 'upload',
      label: 'File Upload',
      status: 'pending',
      icon: Upload,
      description: 'Uploading your video file to the server'
    },
    {
      id: 'transcription',
      label: 'AI Transcription',
      status: 'pending', 
      icon: FileAudio,
      description: 'Converting speech to text using Whisper AI'
    },
    {
      id: 'enhancement',
      label: 'Text Enhancement',
      status: 'pending',
      icon: Brain,
      description: 'Improving grammar and generating summary with Gemini AI'
    },
    {
      id: 'analysis',
      label: 'Speech Analysis', 
      status: 'pending',
      icon: Target,
      description: 'Analyzing sentiment, filler words, and speech patterns'
    },
    {
      id: 'pose',
      label: 'Pose & Voice Analysis',
      status: 'pending',
      icon: Clock,
      description: 'Analyzing body language, gestures, and vocal delivery'
    },
    {
      id: 'completion',
      label: 'Generating Report',
      status: 'pending',
      icon: CheckCircle2,
      description: 'Compiling your comprehensive coaching feedback'
    }
  ];

  const [steps, setSteps] = useState<ProcessingStep[]>(processingSteps);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type (matching Django allowed extensions)
    const allowedTypes = [
      'video/mp4', 'video/avi', 'video/mov', 'video/x-msvideo', 
      'video/quicktime', 'video/x-matroska',
      'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/mp4'
    ];
    
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav', '.m4a'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return `Unsupported file type. Allowed formats: ${allowedExtensions.join(', ')}`;
    }

    // Check file size (100MB limit - matching Django)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 100MB';
    }

    // Check minimum file size
    const minSize = 1024; // 1KB minimum
    if (file.size < minSize) {
      return 'File is too small. Please select a valid media file.';
    }

    return null;
  };

  const updateStepStatus = (stepId: string, status: ProcessingStep['status']) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const error = validateFile(file);
      
      if (error) {
        setErrorMessage(error);
        setUploadStatus('error');
      } else {
        setSelectedFile(file);
        setUploadStatus('idle');
        setErrorMessage('');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = validateFile(file);
      
      if (error) {
        setErrorMessage(error);
        setUploadStatus('error');
      } else {
        setSelectedFile(file);
        setUploadStatus('idle');
        setErrorMessage('');
      }
    }
  };

  const getFileTypeIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const videoExtensions = ['mp4', 'avi', 'mov', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'm4a'];
    
    if (videoExtensions.includes(extension || '')) return Film;
    if (audioExtensions.includes(extension || '')) return FileAudio;
    return FileVideo;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setErrorMessage('Please select a video or audio file');
      setUploadStatus('error');
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Step 1: Upload and process with Django backend
      updateStepStatus('upload', 'processing');
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      
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

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 30) {
            clearInterval(progressInterval);
            return 30;
          }
          return prev + 5;
        });
      }, 300);

      // Call Django API for complete video analysis
      const response = await fetch('http://localhost:8000/app/upload-video/', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(50);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload and analysis failed');
      }

      const analysisResult = await response.json();
      updateStepStatus('upload', 'completed');
      updateStepStatus('transcription', 'completed');
      updateStepStatus('enhancement', 'completed');
      updateStepStatus('analysis', 'completed');
      
      setUploadProgress(80);
      setUploadStatus('processing');
      
      // Step 2: Get pose and voice analysis
      updateStepStatus('pose', 'processing');
      
      const poseFormData = new FormData();
      poseFormData.append('video', selectedFile);
      
      const poseResponse = await fetch('http://localhost:8000/app/pose-voice-analysis/', {
        method: 'POST',
        body: poseFormData,
      });

      if (!poseResponse.ok) {
        throw new Error('Pose and voice analysis failed');
      }

      const poseResult = await poseResponse.json();
      updateStepStatus('pose', 'completed');
      setUploadProgress(90);

      // Step 3: Generate coaching feedback
      updateStepStatus('completion', 'processing');
      
      const feedbackResponse = await fetch('http://localhost:8000/app/generate-coach-feedback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: poseResult
        }),
      });

      if (!feedbackResponse.ok) {
        throw new Error('Coaching feedback generation failed');
      }

      const feedbackResult = await feedbackResponse.json();
      updateStepStatus('completion', 'completed');
      setUploadProgress(100);
      
      setUploadStatus('success');
      
      // Store results and redirect to report page
      const completeResults = {
        transcript: analysisResult,
        poseAnalysis: poseResult,
        coaching: feedbackResult.feedback,
        filename: selectedFile.name,
        timestamp: new Date().toISOString()
      };
      
      // Generate a simple ID for the report
      const reportId = Date.now().toString();
      
      // Save to MongoDB instead of localStorage
      const saveResponse = await fetch('/api/video-analysis/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId: reportId,
          accountId: user?.corporateAccountId || 'default', // Use user's corporate account ID
          userId: user ? `${user.role}:${user.id}` : 'guest:unknown', // Include role prefix for identification
          filename: selectedFile.name,
          transcript: analysisResult,
          poseAnalysis: poseResult,
          coaching: feedbackResult.feedback,
          fileSize: selectedFile.size,
          timestamp: new Date().toISOString()
        }),
      });

      if (!saveResponse.ok) {
        console.warn('Failed to save to MongoDB, falling back to localStorage');
        // Fallback to localStorage if MongoDB save fails
        localStorage.setItem('lastAnalysis', JSON.stringify(completeResults));
        localStorage.setItem('lastAnalysisId', reportId);
      } else {
        console.log('✅ Analysis saved to MongoDB successfully');
        
        // Create video upload activity record
        try {
          const activityResponse = await fetch('/api/video-upload-activities', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uploadId: reportId,
              userId: user ? `EMPLOYEE:${user.id}` : 'guest:unknown',
              filename: selectedFile.name,
              fileSize: selectedFile.size,
              duration: '00:00:00', // Will be updated when available
              uploadSource: 'web'
            }),
          });

          if (activityResponse.ok) {
            console.log('✅ Video upload activity recorded successfully');
            
            // Update analysis status with scores
            try {
              const updateResponse = await fetch('/api/video-upload-activities', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  uploadId: reportId,
                  bodyLanguageScore: poseResult?.body_language_score || 0,
                  vocalToneScore: poseResult?.vocal_tone_score || 0,
                  wordPowerScore: analysisResult?.word_power_score || 0,
                  analysisVersion: '1.0'
                }),
              });

              if (updateResponse.ok) {
                console.log('✅ Analysis status updated successfully');
              } else {
                console.warn('⚠️ Failed to update analysis status');
              }
            } catch (updateError) {
              console.warn('⚠️ Error updating analysis status:', updateError);
            }
          } else {
            console.warn('⚠️ Failed to record video upload activity');
          }
        } catch (activityError) {
          console.warn('⚠️ Error recording video upload activity:', activityError);
        }
        
        // Clear any old localStorage data
        localStorage.removeItem('lastAnalysis');
        localStorage.removeItem('lastAnalysisId');
      }
      
      // Redirect to report page after a short delay
      setTimeout(() => {
        router.push(`/videos/${reportId}/report`);
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Processing error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Processing failed. Please check if Django server is running on port 8000.');
      setUploadProgress(0);
      
      // Mark current step as error
      if (currentStep) {
        updateStepStatus(currentStep, 'error');
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
    setUploadProgress(0);
    setCurrentStep('upload');
    setSteps(processingSteps);
  };

  const getStepStatusIcon = (step: ProcessingStep) => {
    const IconComponent = step.icon;
    
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <IconComponent className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Video Analysis</h2>
        <p className="text-gray-600">
          Upload your video or audio file for comprehensive speech analysis, transcription, and coaching feedback
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Status Messages */}
        {uploadStatus === 'error' && errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Analysis completed successfully! Redirecting to your results...
            </AlertDescription>
          </Alert>
        )}

        {/* Processing Steps */}
        {(uploadStatus === 'processing' || uploadStatus === 'success') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Processing Your File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStepStatusIcon(step)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          step.status === 'completed' ? 'text-green-700' :
                          step.status === 'processing' ? 'text-blue-700' :
                          step.status === 'error' ? 'text-red-700' :
                          'text-gray-700'
                        }`}>
                          {step.label}
                        </h4>
                        <Badge variant={
                          step.status === 'completed' ? 'default' :
                          step.status === 'processing' ? 'secondary' :
                          step.status === 'error' ? 'destructive' :
                          'outline'
                        }>
                          {step.status === 'processing' ? 'Processing...' : step.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {uploadStatus === 'uploading' && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Uploading file...</span>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <div className="text-xs text-gray-500 text-center">
                  This may take a few minutes depending on your file size
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Upload Area - Only show when not processing */}
        {uploadStatus !== 'processing' && uploadStatus !== 'success' && (
          <Card>
            <CardContent className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : uploadStatus === 'error'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-4">
                    {(() => {
                      const IconComponent = getFileTypeIcon(selectedFile.name);
                      return <IconComponent className="w-16 h-16 text-blue-600 mx-auto" />;
                    })()}
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{selectedFile.name}</p>
                      <div className="flex items-center justify-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <span>•</span>
                        <span className="capitalize">{selectedFile.type.split('/')[0]} File</span>
                      </div>
                    </div>
                    {!uploading && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetForm}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove File
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-center space-x-4">
                      <Film className="w-12 h-12 text-gray-400" />
                      <FileAudio className="w-12 h-12 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xl font-medium text-gray-900 mb-2">
                        Drop your file here, or{' '}
                        <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept="video/mp4,video/avi,video/mov,video/x-matroska,audio/mp3,audio/mpeg,audio/wav,audio/mp4"
                            onChange={handleFileSelect}
                            disabled={uploading}
                          />
                        </label>
                      </p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Supported formats: MP4, AVI, MOV, MKV, MP3, WAV, M4A</p>
                        <p>Maximum file size: 100MB</p>
                      </div>
                    </div>
                    
                    {/* Feature highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
                      <div className="text-center">
                        <FileAudio className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <h4 className="font-medium text-sm">AI Transcription</h4>
                        <p className="text-xs text-gray-500">Accurate speech-to-text</p>
                      </div>
                      <div className="text-center">
                        <Brain className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <h4 className="font-medium text-sm">Smart Analysis</h4>
                        <p className="text-xs text-gray-500">Sentiment & emotion detection</p>
                      </div>
                      <div className="text-center">
                        <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <h4 className="font-medium text-sm">Coaching Feedback</h4>
                        <p className="text-xs text-gray-500">Personalized improvement tips</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons - Only show when not processing */}
        {uploadStatus !== 'processing' && uploadStatus !== 'success' && (
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || uploading}
              className="bg-blue-600 hover:bg-blue-700 min-w-[140px]"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
