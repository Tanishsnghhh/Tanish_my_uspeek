'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, Play, CheckCircle, AlertCircle, 
  RefreshCw, Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MigrationStats {
  totalEmployees: number;
  employeesWithOldAttributes: number;
  newAttributeValues: number;
  totalAttributeDefinitions: number;
  migrationNeeded: boolean;
}

interface MigrationResults {
  processedEmployees: number;
  migratedValues: number;
  errors: string[];
  dryRunMode: boolean;
}

export function AttributeMigrationManager() {
  const { toast } = useToast();
  
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<MigrationResults | null>(null);

  useEffect(() => {
    fetchMigrationStats();
  }, []);

  const fetchMigrationStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/migrate-attributes');
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      } else {
        throw new Error('Failed to fetch migration statistics');
      }
    } catch (error) {
      console.error('Error fetching migration stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load migration statistics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runMigration = async (dryRun: boolean = true) => {
    try {
      setIsMigrating(true);
      const response = await fetch('/api/migrate-attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun }),
      });

      if (response.ok) {
        const data = await response.json();
        setMigrationResults(data.results);
        
        toast({
          title: dryRun ? 'Dry Run Completed' : 'Migration Completed',
          description: data.message
        });

        // Refresh stats after successful migration
        if (!dryRun) {
          await fetchMigrationStats();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Migration failed');
      }
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: 'Migration Error',
        description: error.message || 'Failed to run migration',
        variant: 'destructive'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading migration information...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Employee Attribute Migration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Migration Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">About This Migration</h4>
                <p className="text-sm text-blue-700 mt-1">
                  This migration moves custom attribute values from the legacy format 
                  (stored in EmployeeProfile.custom_attributes) to the new EmployeeAttributeValue 
                  model with proper foreign key relationships.
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</div>
                <div className="text-sm text-gray-600">Total Employees</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-900">{stats.employeesWithOldAttributes}</div>
                <div className="text-sm text-yellow-700">With Old Attributes</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-900">{stats.newAttributeValues}</div>
                <div className="text-sm text-green-700">New Attribute Values</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-900">{stats.totalAttributeDefinitions}</div>
                <div className="text-sm text-blue-700">Attribute Definitions</div>
              </div>
            </div>
          )}

          {/* Migration Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {stats?.migrationNeeded ? (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <div>
                <h4 className="font-medium">
                  {stats?.migrationNeeded ? 'Migration Needed' : 'Migration Complete'}
                </h4>
                <p className="text-sm text-gray-600">
                  {stats?.migrationNeeded 
                    ? 'There are employees with legacy custom attributes that need migration.'
                    : 'All employee custom attributes have been migrated to the new format.'
                  }
                </p>
              </div>
            </div>
            <Badge className={stats?.migrationNeeded ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
              {stats?.migrationNeeded ? 'Pending' : 'Complete'}
            </Badge>
          </div>

          {/* Migration Actions */}
          {stats?.migrationNeeded && (
            <div className="space-y-4">
              <h4 className="font-medium">Migration Actions</h4>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => runMigration(true)}
                  disabled={isMigrating}
                >
                  {isMigrating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Dry Run
                </Button>
                <Button 
                  onClick={() => runMigration(false)}
                  disabled={isMigrating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isMigrating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  Run Migration
                </Button>
              </div>
            </div>
          )}

          {/* Migration Results */}
          {migrationResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {migrationResults.dryRunMode ? 'Dry Run Results' : 'Migration Results'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-blue-900">{migrationResults.processedEmployees}</div>
                    <div className="text-sm text-blue-700">Employees Processed</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-green-900">{migrationResults.migratedValues}</div>
                    <div className="text-sm text-green-700">
                      Values {migrationResults.dryRunMode ? 'To Migrate' : 'Migrated'}
                    </div>
                  </div>
                </div>

                {migrationResults.errors.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h5 className="font-medium text-red-900 mb-2">Errors ({migrationResults.errors.length})</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {migrationResults.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={fetchMigrationStats} disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
