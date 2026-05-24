import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

interface ExportFilters {
  region: string;
  zone: string;
  batch: string;
  branch: string;
  businessUnit: string;
  dateFrom: string;
  dateTo: string;
  periodType: string;
  includeVideoAnalysis: boolean;
  includeBusinessMetrics: boolean;
  includeEmployeeData: boolean;
  includeLearningProgress: boolean;
  includeAssignments: boolean;
  includeAuditLogs: boolean;
  format: string;
  exportType: 'reports' | 'raw-data';
}

export async function POST(request: NextRequest) {
  try {
    console.log('Export API called');
    
    // Get authorization header from request
    const authorization = request.headers.get('authorization');
    console.log('Authorization header:', authorization ? 'Present' : 'Missing');
    
    if (!authorization) {
      console.error('No authorization header provided');
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Verify JWT token and get user info
    const token = authorization.replace('Bearer ', '');
    console.log('Token extracted, length:', token.length);
    
    const decoded = await verifyToken(token);
    console.log('Token decoded:', decoded ? 'Success' : 'Failed');
    
    if (!decoded) {
      console.error('Token verification failed');
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!decoded.corporateAccountId) {
      console.error('Missing corporateAccountId in token');
      return NextResponse.json(
        { error: 'Missing account information in token' },
        { status: 401 }
      );
    }

    console.log('Connecting to database...');
    const { db } = await connectDB();
    console.log('Database connected successfully');

    const filters: ExportFilters = await request.json();
    console.log('Filters received:', filters);

    // Build base filter for account
    const baseFilter = { account_id: new ObjectId(decoded.corporateAccountId) };
    const videoBaseFilter = { 'uploadInfo.accountId': decoded.corporateAccountId };

    // Build organizational filters
    const orgFilter: any = {};
    if (filters.region && filters.region !== 'all') orgFilter['custom_attributes.position_1'] = filters.region;
    if (filters.zone && filters.zone !== 'all') orgFilter['custom_attributes.position_2'] = filters.zone;
    if (filters.batch && filters.batch !== 'all') orgFilter['custom_attributes.position_3'] = filters.batch;
    if (filters.branch && filters.branch !== 'all') orgFilter['custom_attributes.position_4'] = filters.branch;

    // Build date filters
    const dateFilter: any = {};
    const videoDateFilter: any = {};
    if (filters.dateFrom || filters.dateTo) {
      dateFilter.created_at = {};
      videoDateFilter['uploadInfo.uploadDate'] = {};
      if (filters.dateFrom) {
        dateFilter.created_at.$gte = new Date(filters.dateFrom);
        videoDateFilter['uploadInfo.uploadDate'].$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        dateFilter.created_at.$lte = new Date(filters.dateTo);
        videoDateFilter['uploadInfo.uploadDate'].$lte = new Date(filters.dateTo);
      }
    }

    let exportData: any = {};
    console.log('Starting data export...');

    // Export Video Analysis Data
    if (filters.includeVideoAnalysis) {
      console.log('Exporting video analysis data...');
      const videoAnalysisCollection = db.collection('video_analysis');
      const videoFilter = { ...videoBaseFilter, ...videoDateFilter };
      console.log('Video filter:', JSON.stringify(videoFilter, null, 2));
      
      let videoAnalysis = await videoAnalysisCollection.find(videoFilter).toArray();
      console.log(`Found ${videoAnalysis.length} video analysis records with filters`);
      
      // If no results with filters, try without account filter to see if there's any data
      if (videoAnalysis.length === 0) {
        console.log('No video analysis found with filters, trying without account filter...');
        const fallbackFilter = { ...videoDateFilter };
        videoAnalysis = await videoAnalysisCollection.find(fallbackFilter).limit(10).toArray();
        console.log(`Found ${videoAnalysis.length} video analysis records without account filter (showing first 10)`);
      }
      
      // Debug: Log the structure of the first video analysis record
      if (videoAnalysis.length > 0) {
        console.log('Sample video analysis structure:', JSON.stringify(videoAnalysis[0], null, 2));
        console.log('Sentiment analysis:', videoAnalysis[0].sentimentAnalysis);
        console.log('Emotion analysis:', videoAnalysis[0].emotionAnalysis);
        console.log('Metadata:', videoAnalysis[0].metadata);
      }
      
      exportData.videoAnalysis = videoAnalysis.map(video => ({
        uploadId: video.uploadInfo?.uploadId,
        filename: video.uploadInfo?.filename,
        uploadDate: video.uploadInfo?.uploadDate,
        duration: video.uploadInfo?.duration,
        language: video.uploadInfo?.language,
        overallScore: video.overallPerformance?.totalScore,
        bodyLanguageScore: video.bodyLanguageAnalysis?.scoreOutOfFive,
        vocalToneScore: video.vocalAnalysis?.scoreOutOfFive,
        wordPowerScore: video.wordPowerAnalysis?.scoreOutOfFive,
        transcript: video.transcript?.correctedTranscript || video.transcript?.originalTranscript,
        summary: video.transcript?.summary,
        keywords: video.transcript?.keywords,
        sentiment: video.sentimentAnalysis?.overallSentiment,
        emotion: video.emotionAnalysis?.dominantEmotion,
        created_at: video.metadata?.createdAt || video.created_at,
        updated_at: video.metadata?.updatedAt || video.updated_at
      }));
    }

    // Export Business Metrics
    if (filters.includeBusinessMetrics) {
      console.log('Exporting business metrics data...');
      const businessMetricsCollection = db.collection('businessmetrics');
      const metricsFilter: any = { 'metadata.isActive': true };
      
      if (filters.region && filters.region !== 'all') metricsFilter.region = filters.region;
      if (filters.zone && filters.zone !== 'all') metricsFilter.zone = filters.zone;
      if (filters.batch && filters.batch !== 'all') metricsFilter.batch = filters.batch;
      if (filters.branch && filters.branch !== 'all') metricsFilter.branch = filters.branch;
      if (filters.businessUnit && filters.businessUnit !== 'all') metricsFilter.businessUnit = filters.businessUnit;
      if (filters.periodType) metricsFilter['periodInfo.periodType'] = filters.periodType;
      if (dateFilter.created_at) metricsFilter['periodInfo.calculationDate'] = dateFilter.created_at;

      console.log('Business metrics filter:', JSON.stringify(metricsFilter, null, 2));
      let businessMetrics = await businessMetricsCollection.find(metricsFilter).toArray();
      console.log(`Found ${businessMetrics.length} business metrics records with filters`);
      
      // If no results with filters, try with just the active filter
      if (businessMetrics.length === 0) {
        console.log('No business metrics found with filters, trying with just active filter...');
        businessMetrics = await businessMetricsCollection.find({ 'metadata.isActive': true }).limit(10).toArray();
        console.log(`Found ${businessMetrics.length} business metrics records with just active filter (showing first 10)`);
      }
      
      exportData.businessMetrics = businessMetrics.map(metric => ({
        businessId: metric.businessId,
        businessName: metric.businessName,
        businessUnit: metric.businessUnit,
        businessCode: metric.businessCode,
        region: metric.region,
        zone: metric.zone,
        batch: metric.batch,
        branch: metric.branch,
        periodType: metric.periodInfo?.periodType,
        periodStart: metric.periodInfo?.periodStart,
        periodEnd: metric.periodInfo?.periodEnd,
        totalParticipants: metric.participants?.totalParticipants,
        activeParticipants: metric.participants?.activeParticipants,
        totalVideos: metric.participants?.totalVideos,
        analyzedVideos: metric.participants?.analyzedVideos,
        averageBodyLanguage: metric.bodyLanguage?.averageBodyLanguage,
        averageVocalTone: metric.vocalTone?.averageVocalTone,
        averageWordPower: metric.wordPower?.averageWordPower,
        overallImprovementRate: metric.overall?.avgOverallImprovementRate,
        calculationDate: metric.periodInfo?.calculationDate
      }));
    }

    // Export Employee Data
    if (filters.includeEmployeeData) {
      console.log('Exporting employee data...');
      const employeeProfilesCollection = db.collection('employeeprofiles');
      const employeeFilter = { ...orgFilter, isActive: true };
      console.log('Employee filter:', JSON.stringify(employeeFilter, null, 2));
      
      let employees = await employeeProfilesCollection.find(employeeFilter).toArray();
      console.log(`Found ${employees.length} employee records with filters`);
      
      // If no results with filters, try with just the active filter
      if (employees.length === 0) {
        console.log('No employees found with filters, trying with just active filter...');
        employees = await employeeProfilesCollection.find({ isActive: true }).limit(10).toArray();
        console.log(`Found ${employees.length} employee records with just active filter (showing first 10)`);
      }
      
      exportData.employees = employees.map(emp => ({
        employeeId: emp.employeeId,
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.user_id, // This would need to be populated from User collection
        phoneNumber: emp.phoneNumber,
        department: emp.department,
        jobTitle: emp.job_title,
        hireDate: emp.hireDate,
        region: emp.custom_attributes?.position_1,
        zone: emp.custom_attributes?.position_2,
        batch: emp.custom_attributes?.position_3,
        branch: emp.custom_attributes?.position_4,
        isActive: emp.isActive,
        created_at: emp.created_at,
        updated_at: emp.updated_at
      }));
    }

    // Export Learning Progress
    if (filters.includeLearningProgress) {
      const learningProgressCollection = db.collection('learningprogresses');
      const learningFilter = { ...baseFilter, ...dateFilter };
      
      const learningProgress = await learningProgressCollection.find(learningFilter).toArray();
      
      exportData.learningProgress = learningProgress.map(progress => ({
        userId: progress.user_id,
        materialId: progress.material_id,
        isCompleted: progress.overall_completion?.is_completed,
        completedAt: progress.overall_completion?.completed_at,
        totalSessionsCompleted: progress.overall_completion?.total_sessions_completed,
        totalSessions: progress.overall_completion?.total_sessions,
        videoProgress: progress.video_progress,
        quizAttempts: progress.quiz_attempts,
        created_at: progress.created_at,
        updated_at: progress.updated_at
      }));
    }

    // Export Assignment Data
    if (filters.includeAssignments) {
      const assignmentInstancesCollection = db.collection('assignmentinstances');
      const assignmentFilter = { ...baseFilter, ...dateFilter };
      
      const assignments = await assignmentInstancesCollection.find(assignmentFilter).toArray();
      
      exportData.assignments = assignments.map(assignment => ({
        instanceId: assignment.instance_id,
        assignmentId: assignment.assignment_id,
        assignedToEmployeeId: assignment.assigned_to_employee_id,
        assignedToEmployeeName: assignment.assigned_to_employee_name,
        deadline: assignment.deadline,
        status: assignment.status,
        priority: assignment.priority,
        assignmentScope: assignment.assignment_scope,
        instructions: assignment.instructions,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at
      }));
    }

    // Export Audit Logs
    if (filters.includeAuditLogs) {
      const auditLogsCollection = db.collection('auditlogs');
      const auditFilter = { ...baseFilter, ...dateFilter };
      
      const auditLogs = await auditLogsCollection.find(auditFilter).toArray();
      
      exportData.auditLogs = auditLogs.map(log => ({
        actionType: log.action_type,
        userId: log.user_id,
        details: log.details,
        timestamp: log.timestamp,
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      }));
    }

    // Generate export based on format
    console.log('Generating export file...');
    let responseData: string;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split('T')[0];
    console.log('Export data summary:', {
      videoAnalysis: exportData.videoAnalysis?.length || 0,
      businessMetrics: exportData.businessMetrics?.length || 0,
      employees: exportData.employees?.length || 0,
      learningProgress: exportData.learningProgress?.length || 0,
      assignments: exportData.assignments?.length || 0,
      auditLogs: exportData.auditLogs?.length || 0
    });

    if (filters.format === 'csv') {
      responseData = generateStructuredCSV(exportData, filters.exportType);
      contentType = 'text/csv; charset=utf-8';
      filename = `uspeak-export-${filters.exportType}-${timestamp}.csv`;
    } else if (filters.format === 'xlsx' || filters.format === 'excel') {
      // For Excel format, we'll return CSV for now - in production, use a library like xlsx
      responseData = generateStructuredCSV(exportData, filters.exportType);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `uspeak-export-${filters.exportType}-${timestamp}.xlsx`;
    } else {
      // Default to CSV
      responseData = generateStructuredCSV(exportData, filters.exportType);
      contentType = 'text/csv; charset=utf-8';
      filename = `uspeak-export-${filters.exportType}-${timestamp}.csv`;
    }

    console.log('Export completed successfully, file size:', responseData.length, 'bytes');
    
    return new NextResponse(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateStructuredCSV(data: any, exportType: string): string {
  const csvRows: string[] = [];
  
  // Add BOM for UTF-8 encoding to ensure proper display in Excel
  csvRows.push('\ufeff');
  
  // Add comprehensive export metadata
  csvRows.push('USPEAK DATA EXPORT REPORT');
  csvRows.push('='.repeat(50));
  csvRows.push(`Export Date: ${new Date().toLocaleString()}`);
  csvRows.push(`Export Type: ${exportType.toUpperCase()}`);
  csvRows.push(`Generated By: uSpeak Export System`);
  csvRows.push('');
  
  // Add data summary
  csvRows.push('DATA SUMMARY');
  csvRows.push('-'.repeat(30));
  csvRows.push(`Video Analysis Records: ${data.videoAnalysis?.length || 0}`);
  csvRows.push(`Business Metrics Records: ${data.businessMetrics?.length || 0}`);
  csvRows.push(`Employee Records: ${data.employees?.length || 0}`);
  csvRows.push(`Learning Progress Records: ${data.learningProgress?.length || 0}`);
  csvRows.push(`Assignment Records: ${data.assignments?.length || 0}`);
  csvRows.push(`Audit Log Records: ${data.auditLogs?.length || 0}`);
  csvRows.push('');
  csvRows.push('='.repeat(50));
  csvRows.push('');
  
  if (exportType === 'reports') {
    // Generate executive summary format
    csvRows.push('EXECUTIVE SUMMARY REPORT');
    csvRows.push('='.repeat(50));
    
    if (data.businessMetrics && data.businessMetrics.length > 0) {
      const metricsHeaders = [
        'Business Name', 'Business Code', 'Region', 'Zone', 'Batch', 'Branch',
        'Period Type', 'Total Participants', 'Active Participants', 'Total Videos',
        'Analyzed Videos', 'Avg Body Language', 'Avg Vocal Tone', 'Avg Word Power',
        'Overall Improvement Rate', 'Calculation Date'
      ].join(',');
      csvRows.push(metricsHeaders);
      
      data.businessMetrics.forEach((metric: any) => {
        const row = [
          `"${metric.businessName || ''}"`,
          `"${metric.businessCode || ''}"`,
          `"${metric.region || ''}"`,
          `"${metric.zone || ''}"`,
          `"${metric.batch || ''}"`,
          `"${metric.branch || ''}"`,
          `"${metric.periodType || ''}"`,
          metric.totalParticipants || 0,
          metric.activeParticipants || 0,
          metric.totalVideos || 0,
          metric.analyzedVideos || 0,
          metric.averageBodyLanguage || 0,
          metric.averageVocalTone || 0,
          metric.averageWordPower || 0,
          metric.overallImprovementRate || 0,
          `"${metric.calculationDate || ''}"`
        ].join(',');
        csvRows.push(row);
      });
    }
    
  } else {
    // Generate detailed structured CSV for raw data
    if (data.videoAnalysis && data.videoAnalysis.length > 0) {
      csvRows.push('=== VIDEO ANALYSIS DATA ===');
      const videoHeaders = [
        'Upload ID', 'Filename', 'Upload Date', 'Duration', 'Language',
        'Overall Score', 'Body Language Score', 'Vocal Tone Score', 'Word Power Score',
        'Transcript', 'Summary', 'Keywords', 'Sentiment', 'Emotion', 'Created At', 'Updated At'
      ].join(',');
      csvRows.push(videoHeaders);
      
      data.videoAnalysis.forEach((video: any) => {
        const row = [
          `"${video.uploadId || ''}"`,
          `"${video.filename || ''}"`,
          `"${video.uploadDate || ''}"`,
          `"${video.duration || ''}"`,
          `"${video.language || ''}"`,
          video.overallScore || 0,
          video.bodyLanguageScore || 0,
          video.vocalToneScore || 0,
          video.wordPowerScore || 0,
          `"${(video.transcript || '').replace(/"/g, '""')}"`,
          `"${(video.summary || '').replace(/"/g, '""')}"`,
          `"${(video.keywords || '').replace(/"/g, '""')}"`,
          `"${video.sentiment || ''}"`,
          `"${video.emotion || ''}"`,
          `"${video.created_at || ''}"`,
          `"${video.updated_at || ''}"`
        ].join(',');
        csvRows.push(row);
      });
      csvRows.push('');
    }
    
    if (data.businessMetrics && data.businessMetrics.length > 0) {
      csvRows.push('=== BUSINESS METRICS DATA ===');
      const metricsHeaders = [
        'Business ID', 'Business Name', 'Business Unit', 'Business Code', 'Region', 'Zone', 'Batch', 'Branch',
        'Period Type', 'Period Start', 'Period End', 'Total Participants', 'Active Participants',
        'Total Videos', 'Analyzed Videos', 'Avg Body Language', 'Avg Vocal Tone', 'Avg Word Power',
        'Overall Improvement Rate', 'Calculation Date'
      ].join(',');
      csvRows.push(metricsHeaders);
      
      data.businessMetrics.forEach((metric: any) => {
        const row = [
          `"${metric.businessId || ''}"`,
          `"${metric.businessName || ''}"`,
          `"${metric.businessUnit || ''}"`,
          `"${metric.businessCode || ''}"`,
          `"${metric.region || ''}"`,
          `"${metric.zone || ''}"`,
          `"${metric.batch || ''}"`,
          `"${metric.branch || ''}"`,
          `"${metric.periodType || ''}"`,
          `"${metric.periodStart || ''}"`,
          `"${metric.periodEnd || ''}"`,
          metric.totalParticipants || 0,
          metric.activeParticipants || 0,
          metric.totalVideos || 0,
          metric.analyzedVideos || 0,
          metric.averageBodyLanguage || 0,
          metric.averageVocalTone || 0,
          metric.averageWordPower || 0,
          metric.overallImprovementRate || 0,
          `"${metric.calculationDate || ''}"`
        ].join(',');
        csvRows.push(row);
      });
      csvRows.push('');
    }
    
    if (data.employees && data.employees.length > 0) {
      csvRows.push('=== EMPLOYEE DATA ===');
      const employeeHeaders = [
        'Employee ID', 'First Name', 'Last Name', 'Phone Number', 'Department', 'Job Title',
        'Hire Date', 'Region', 'Zone', 'Batch', 'Branch', 'Is Active', 'Created At', 'Updated At'
      ].join(',');
      csvRows.push(employeeHeaders);
      
      data.employees.forEach((employee: any) => {
        const row = [
          `"${employee.employeeId || ''}"`,
          `"${employee.firstName || ''}"`,
          `"${employee.lastName || ''}"`,
          `"${employee.phoneNumber || ''}"`,
          `"${employee.department || ''}"`,
          `"${employee.jobTitle || ''}"`,
          `"${employee.hireDate || ''}"`,
          `"${employee.region || ''}"`,
          `"${employee.zone || ''}"`,
          `"${employee.batch || ''}"`,
          `"${employee.branch || ''}"`,
          employee.isActive ? 'Yes' : 'No',
          `"${employee.created_at || ''}"`,
          `"${employee.updated_at || ''}"`
        ].join(',');
        csvRows.push(row);
      });
      csvRows.push('');
    }
    
    if (data.learningProgress && data.learningProgress.length > 0) {
      csvRows.push('=== LEARNING PROGRESS DATA ===');
      const learningHeaders = [
        'User ID', 'Material ID', 'Is Completed', 'Completed At', 'Total Sessions Completed',
        'Total Sessions', 'Created At', 'Updated At'
      ].join(',');
      csvRows.push(learningHeaders);
      
      data.learningProgress.forEach((progress: any) => {
        const row = [
          `"${progress.userId || ''}"`,
          `"${progress.materialId || ''}"`,
          progress.isCompleted ? 'Yes' : 'No',
          `"${progress.completedAt || ''}"`,
          progress.totalSessionsCompleted || 0,
          progress.totalSessions || 0,
          `"${progress.created_at || ''}"`,
          `"${progress.updated_at || ''}"`
        ].join(',');
        csvRows.push(row);
      });
      csvRows.push('');
    }
    
    if (data.assignments && data.assignments.length > 0) {
      csvRows.push('=== ASSIGNMENT DATA ===');
      const assignmentHeaders = [
        'Instance ID', 'Assignment ID', 'Assigned To Employee ID', 'Assigned To Employee Name',
        'Deadline', 'Status', 'Priority', 'Assignment Scope', 'Instructions', 'Created At', 'Updated At'
      ].join(',');
      csvRows.push(assignmentHeaders);
      
      data.assignments.forEach((assignment: any) => {
        const row = [
          `"${assignment.instanceId || ''}"`,
          `"${assignment.assignmentId || ''}"`,
          `"${assignment.assignedToEmployeeId || ''}"`,
          `"${assignment.assignedToEmployeeName || ''}"`,
          `"${assignment.deadline || ''}"`,
          `"${assignment.status || ''}"`,
          `"${assignment.priority || ''}"`,
          `"${assignment.assignmentScope || ''}"`,
          `"${(assignment.instructions || '').replace(/"/g, '""')}"`,
          `"${assignment.created_at || ''}"`,
          `"${assignment.updated_at || ''}"`
        ].join(',');
        csvRows.push(row);
      });
      csvRows.push('');
    }
    
    if (data.auditLogs && data.auditLogs.length > 0) {
      csvRows.push('=== AUDIT LOGS DATA ===');
      const auditHeaders = [
        'Action Type', 'User ID', 'Details', 'Timestamp', 'IP Address', 'User Agent'
      ].join(',');
      csvRows.push(auditHeaders);
      
      data.auditLogs.forEach((log: any) => {
        const row = [
          `"${log.actionType || ''}"`,
          `"${log.userId || ''}"`,
          `"${(JSON.stringify(log.details) || '').replace(/"/g, '""')}"`,
          `"${log.timestamp || ''}"`,
          `"${log.ipAddress || ''}"`,
          `"${(log.userAgent || '').replace(/"/g, '""')}"`
        ].join(',');
        csvRows.push(row);
      });
    }
  }
  
  // Add footer
  csvRows.push('');
  csvRows.push('='.repeat(50));
  csvRows.push('END OF EXPORT');
  csvRows.push(`Generated on: ${new Date().toLocaleString()}`);
  csvRows.push('uSpeak Data Export System');
  
  return csvRows.join('\n');
}
