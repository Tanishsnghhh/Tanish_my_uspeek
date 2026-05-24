import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

// Migration script to populate videouploadactivities from existing video_analysis data
export async function POST() {
  try {
    const { db } = await connectDB();
    
    const videoAnalysis = db.collection('video_analysis');
    const employeeProfiles = db.collection('employeeprofiles');
    const videoUploadActivities = db.collection('videouploadactivities');
    
    // Get all existing video analysis records
    const existingVideos = await videoAnalysis.find({}).toArray();
    console.log(`Found ${existingVideos.length} existing video analysis records`);
    
    // Get all employee profiles for mapping
    const employees = await employeeProfiles.find({}).toArray();
    const employeeMap = new Map();
    employees.forEach(emp => {
      employeeMap.set(`EMPLOYEE:${emp.user_id}`, emp);
    });
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const video of existingVideos) {
      try {
        const userId = video.uploadInfo?.userId;
        if (!userId) {
          console.log(`Skipping video ${video._id}: No userId found`);
          skippedCount++;
          continue;
        }
        
        // Check if activity already exists
        const existingActivity = await videoUploadActivities.findOne({
          uploadId: video._id.toString()
        });
        
        if (existingActivity) {
          console.log(`Activity already exists for video ${video._id}`);
          skippedCount++;
          continue;
        }
        
        const employee = employeeMap.get(userId);
        if (!employee) {
          console.log(`Employee not found for userId: ${userId}`);
          skippedCount++;
          continue;
        }
        
        const uploadDate = video.uploadInfo?.uploadDate ? new Date(video.uploadInfo.uploadDate) : new Date();
        const uploadTime = uploadDate.toTimeString().split(' ')[0];
        const dayOfWeek = uploadDate.toLocaleDateString('en-US', { weekday: 'long' });
        const weekOfYear = getWeekOfYear(uploadDate);
        const monthYear = uploadDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const quarter = `Q${Math.ceil((uploadDate.getMonth() + 1) / 3)} ${uploadDate.getFullYear()}`;
        
        // Extract analysis scores
        const bodyLanguageScore = video.bodyLanguageAnalysis?.overallScore;
        const vocalToneScore = video.vocalAnalysis?.overallScore;
        const wordPowerScore = video.wordPowerAnalysis?.overallScore;
        const overallScore = (bodyLanguageScore && vocalToneScore && wordPowerScore) 
          ? (bodyLanguageScore + vocalToneScore + wordPowerScore) / 3 
          : undefined;
        
        const isAnalyzed = !!(bodyLanguageScore || vocalToneScore || wordPowerScore);
        
        const activity = {
          uploadId: video._id.toString(),
          userId: userId,
          employeeId: employee.employeeId || employee.user_id,
          uploadDate: uploadDate,
          filename: video.uploadInfo?.filename || 'unknown.mp4',
          fileSize: video.uploadInfo?.fileSize,
          duration: video.uploadInfo?.duration,
          
          employeeInfo: {
            firstName: employee.first_name || '',
            lastName: employee.last_name || '',
            fullName: `${employee.first_name || ''} ${employee.last_name || ''}`.trim(),
            employeeId: employee.employeeId || employee.user_id,
            phoneNumber: employee.phoneNumber,
            department: employee.department,
            jobTitle: employee.job_title,
            hireDate: employee.hireDate ? new Date(employee.hireDate) : undefined,
            isActive: employee.isActive !== false
          },
          
          organizationInfo: {
            region: employee.custom_attributes?.position_1 || 'Unknown',
            zone: employee.custom_attributes?.position_2 || 'Unknown',
            batch: employee.custom_attributes?.position_3 || 'Unknown',
            branch: employee.custom_attributes?.position_4 || 'Unknown'
          },
          
          uploadInfo: {
            uploadDate: uploadDate,
            uploadTime: uploadTime,
            dayOfWeek: dayOfWeek,
            weekOfYear: weekOfYear,
            monthYear: monthYear,
            quarter: quarter,
            uploadSource: 'web',
            ipAddress: undefined
          },
          
          analysisStatus: {
            isAnalyzed: isAnalyzed,
            analysisDate: isAnalyzed ? uploadDate : undefined,
            bodyLanguageScore: bodyLanguageScore,
            vocalToneScore: vocalToneScore,
            wordPowerScore: wordPowerScore,
            overallScore: overallScore,
            analysisVersion: isAnalyzed ? '1.0' : undefined
          },
          
          metadata: {
            createdAt: uploadDate,
            updatedAt: new Date(),
            source: 'migration_from_video_analysis',
            version: 1
          }
        };
        
        await videoUploadActivities.insertOne(activity);
        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`Migrated ${migratedCount} records...`);
        }
        
      } catch (error) {
        console.error(`Error migrating video ${video._id}:`, error);
        skippedCount++;
      }
    }
    
    // Create indexes for better performance
    await videoUploadActivities.createIndex({ uploadId: 1 }, { unique: true });
    await videoUploadActivities.createIndex({ userId: 1 });
    await videoUploadActivities.createIndex({ uploadDate: -1 });
    await videoUploadActivities.createIndex({ 'organizationInfo.region': 1 });
    await videoUploadActivities.createIndex({ 'organizationInfo.zone': 1 });
    await videoUploadActivities.createIndex({ 'analysisStatus.isAnalyzed': 1 });
    await videoUploadActivities.createIndex({ 'uploadInfo.weekOfYear': 1 });
    await videoUploadActivities.createIndex({ 'uploadInfo.monthYear': 1 });
    
    console.log(`Migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);
    
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      migratedCount,
      skippedCount,
      totalProcessed: migratedCount + skippedCount
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Migration failed', details: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to get week of year
function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}