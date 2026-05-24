'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface CreateAssignmentFormProps {
  onSuccess: () => void;
}

export function CreateAssignmentForm({ onSuccess }: CreateAssignmentFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignment_type: 'LESSON',
    difficulty_level: 'BEGINNER',
    estimated_duration: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { token } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get authentication token
      const authToken = token || localStorage.getItem('uspeak_token');
      
      const response = await fetch('/api/assignments/master', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
        body: JSON.stringify({
          ...formData,
          estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : undefined,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Assignment created successfully'
        });
        onSuccess();
      } else {
        throw new Error('Failed to create assignment');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="assignment_type">Assignment Type</Label>
          <Select
            value={formData.assignment_type}
            onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LESSON">Lesson</SelectItem>
              <SelectItem value="VIDEO_TASK">Video Task</SelectItem>
              <SelectItem value="QUIZ">Quiz</SelectItem>
              <SelectItem value="PRESENTATION">Presentation</SelectItem>
              <SelectItem value="ROLE_PLAY">Role Play</SelectItem>
              <SelectItem value="ASSESSMENT">Assessment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="difficulty_level">Difficulty Level</Label>
          <Select
            value={formData.difficulty_level}
            onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="estimated_duration">Estimated Duration (minutes)</Label>
        <Input
          id="estimated_duration"
          type="number"
          value={formData.estimated_duration}
          onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
          placeholder="Optional"
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="communication, leadership, sales"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Assignment'}
        </Button>
      </div>
    </form>
  );
}
