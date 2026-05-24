'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { VideoUpload } from '@/components/videos/video-upload';
import { VideoFilters } from '@/components/videos/video-filters';
import { VideoList } from '@/components/videos/video-list';
import { Button } from '@/components/ui/button';
import { Upload, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';

export default function VideosPage() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: ''
  });
  const { user } = useAuth();

  // Only show upload button for employees (not admins)
  const isEmployee = user && (user.role === 'EMPLOYEE' || user.role === 'CORPORATE_USER');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Video className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Video Analysis</h1>
          </div>
          
          {isEmployee && (
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload New Video</DialogTitle>
                </DialogHeader>
                <VideoUpload onClose={() => setIsUploadDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <VideoFilters filters={filters} onFiltersChange={setFilters} />

        {/* Video List */}
        <VideoList filters={filters} />
      </div>
    </DashboardLayout>
  );
}