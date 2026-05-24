'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoFiltersProps {
  filters: {
    search: string;
    dateFrom: string;
    dateTo: string;
    status?: string;
    performanceLevel?: string;
    language?: string;
    minDuration?: string;
    maxDuration?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function VideoFilters({ filters, onFiltersChange }: VideoFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      performanceLevel: '',
      language: '',
      minDuration: '',
      maxDuration: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Search by Username */}
        <div>
          <Label htmlFor="search">Search by Username</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search"
              placeholder="Enter username..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="analyzing">Analyzing</SelectItem>
              <SelectItem value="transcribing">Transcribing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Performance Level */}
        <div>
          <Label htmlFor="performanceLevel">Performance Level</Label>
          <Select value={filters.performanceLevel || ''} onValueChange={(value) => updateFilter('performanceLevel', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
              <SelectItem value="Expert">Expert</SelectItem>
              <SelectItem value="Professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div>
          <Label htmlFor="language">Language</Label>
          <Select value={filters.language || ''} onValueChange={(value) => updateFilter('language', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
              <SelectItem value="pt">Portuguese</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="ko">Korean</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div>
          <Label htmlFor="dateFrom">From Date</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>

        {/* Date To */}
        <div>
          <Label htmlFor="dateTo">To Date</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>

        {/* Min Duration (seconds) */}
        <div>
          <Label htmlFor="minDuration">Min Duration (sec)</Label>
          <Input
            id="minDuration"
            type="number"
            min="0"
            placeholder="0"
            value={filters.minDuration || ''}
            onChange={(e) => updateFilter('minDuration', e.target.value)}
          />
        </div>

        {/* Max Duration (seconds) */}
        <div>
          <Label htmlFor="maxDuration">Max Duration (sec)</Label>
          <Input
            id="maxDuration"
            type="number"
            min="0"
            placeholder="3600"
            value={filters.maxDuration || ''}
            onChange={(e) => updateFilter('maxDuration', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}