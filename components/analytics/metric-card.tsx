/**
 * Metric Card Component
 * Displays individual analytics metrics with proper null handling
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCardProps } from '@/types/analytics';

export function MetricCard({ title, value, icon, color, description }: MetricCardProps) {
  const displayValue = value !== null ? value : '—';
  const displayClass = value !== null ? `text-${color}-600` : 'text-gray-400';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`text-${color}-500`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${displayClass}`}>
          {displayValue}
          {value !== null && (
            <span className="text-lg text-gray-500 ml-1">/ 100</span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {value === null && (
          <p className="text-xs text-gray-400 mt-1">No data available</p>
        )}
      </CardContent>
    </Card>
  );
}
