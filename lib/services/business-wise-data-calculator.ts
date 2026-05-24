/**
 * Business Wise Data Calculator
 * Fetches business names from businessunits collection and aggregates metrics from video_analysis collection
 */

import { connectDB } from '../mongodb';
import { ObjectId } from 'mongodb';

// Type definitions for Business Wise Data
interface BusinessWiseDataRow {
    rowLabels: string; // Business name from businessunits collection
    avgOIRPercent: number; // Average Overall Improvement Rate %
    avgMaxOS: number; // Average Maximum Overall Score
    avgMinOS: number; // Average Minimum Overall Score
    avgBIRPercent: number; // Average Body Language Improvement Rate %
    avgMaxBL: number; // Average Maximum Body Language Score
    avgMinBL: number; // Average Minimum Body Language Score
    avgVIRPercent: number; // Average Vocal Tone Improvement Rate %
    avgMaxVT: number; // Average Maximum Vocal Tone Score
    avgMinVT: number; // Average Minimum Vocal Tone Score
    avgWIRPercent: number; // Average Word Power Improvement Rate %
    avgMaxWP: number; // Average Maximum Word Power Score
    avgMinWP: number; // Average Minimum Word Power Score
    totalVideos: number;
    totalParticipants: number;
    businessCode: string;
    businessCategory?: string;
}

/**
 * Calculate Business Wise Data by fetching from businessunits and video_analysis collections
 */
export async function calculateBusinessWiseData(options: {
    periodStart?: Date;
    periodEnd?: Date;
    region?: string;
    zone?: string;
    batch?: string;
    branch?: string;
    businessCode?: string;
    corporateAccountId?: string;
} = {}) {
    try {
        const { db } = await connectDB();
        const { periodStart, periodEnd, region, zone, batch, branch, businessCode, corporateAccountId } = options;

        // Fetch business units
        const businessUnitsCollection = db.collection('businessunits');
        let businessUnitsQuery: any = {};
        if (businessCode) {
            businessUnitsQuery.businessCode = businessCode;
        }
        if (corporateAccountId) {
            businessUnitsQuery.corporate_account_id = new ObjectId(corporateAccountId);
        }
        const businessUnits = await businessUnitsCollection.find(businessUnitsQuery).toArray();

        console.log(`Found ${businessUnits.length} business units for Business Wise Data calculation`);

        if (businessUnits.length === 0) {
            return {
                success: false,
                error: 'No business units found'
            };
        }

        const videoAnalysisCollection = db.collection('video_analysis');
        const results: BusinessWiseDataRow[] = [];

        // Process each business unit
        for (const businessUnit of businessUnits) {
            console.log(`Processing business unit: ${businessUnit.businessName} (${businessUnit.businessCode})`);

            // Skip if no assigned employees
            if (!businessUnit.assignedEmployees || businessUnit.assignedEmployees.length === 0) {
                console.log(`No assigned employees for business unit: ${businessUnit.businessName}`);
                continue;
            }

            // Get employee profiles - check both _id and user_id fields
            const employeeProfilesCollection = db.collection('employeeprofiles');
            const employeeProfiles = await employeeProfilesCollection.find({
                $or: [
                    { _id: { $in: businessUnit.assignedEmployees.map((empId: string) => new ObjectId(empId)) } },
                    { user_id: { $in: businessUnit.assignedEmployees.map((empId: string) => new ObjectId(empId)) } }
                ]
            }).toArray();

            // Create mapping from assigned employee ID to user ID
            const assignedIdToUserIdMap: { [assignedId: string]: string } = {};
            employeeProfiles.forEach(profile => {
                if (profile.user_id) {
                    // Map both _id and user_id to the actual user_id
                    assignedIdToUserIdMap[profile._id.toString()] = profile.user_id.toString();
                    assignedIdToUserIdMap[profile.user_id.toString()] = profile.user_id.toString();
                }
            });

            // Get the actual user IDs for video analysis lookup
            const userIdsForAnalysis = businessUnit.assignedEmployees
                .map((empId: string) => assignedIdToUserIdMap[empId] || empId)
                .map((userId: string) => `EMPLOYEE:${userId}`);

            console.log(`Mapped ${businessUnit.assignedEmployees.length} employee profiles to ${userIdsForAnalysis.length} user IDs for business unit: ${businessUnit.businessName}`);

            // Build filter for video analyses
            const analysisFilter: any = {
                'uploadInfo.userId': { $in: userIdsForAnalysis }
            };

            // Add date filter if specified
            if (periodStart || periodEnd) {
                analysisFilter['uploadInfo.uploadDate'] = {};
                if (periodStart) analysisFilter['uploadInfo.uploadDate'].$gte = new Date(periodStart);
                if (periodEnd) analysisFilter['uploadInfo.uploadDate'].$lte = new Date(periodEnd);
            }

            // Add organization filters if specified
            if (region) analysisFilter['uploadInfo.organizationInfo.region'] = region;
            if (zone) analysisFilter['uploadInfo.organizationInfo.zone'] = zone;
            if (batch) analysisFilter['uploadInfo.organizationInfo.batch'] = batch;
            if (branch) analysisFilter['uploadInfo.organizationInfo.branch'] = branch;

            // Get all video analyses for this business unit's employees
            const videoAnalyses = await videoAnalysisCollection.find(analysisFilter).toArray();

            console.log(`Found ${videoAnalyses.length} video analyses for business unit: ${businessUnit.businessName}`);

            // Extract metrics from video analyses (or create empty metrics if no analyses)
            const metrics = videoAnalyses.length > 0 ? extractMetricsFromVideoAnalyses(videoAnalyses) : {
                uniqueParticipants: new Set(),
                totalVideos: 0
            };

            // Calculate improvement rates per participant (or create empty improvements if no analyses)
            const participantImprovements = videoAnalyses.length > 0 ? calculateParticipantImprovementsForBusinessWise(videoAnalyses) : {
                bodyLanguage: [],
                vocalTone: [],
                wordPower: [],
                overall: [],
                minBodyLanguage: [],
                maxBodyLanguage: [],
                minVocalTone: [],
                maxVocalTone: [],
                minWordPower: [],
                maxWordPower: [],
                minOverall: [],
                maxOverall: []
            };

            // Calculate averages
            const businessWiseRow: BusinessWiseDataRow = {
                rowLabels: businessUnit.businessName,
                avgOIRPercent: Math.round(calculateAverage(participantImprovements.overall) * 100) / 100,
                avgMaxOS: Math.round(calculateAverage(participantImprovements.maxOverall) * 100) / 100,
                avgMinOS: Math.round(calculateAverage(participantImprovements.minOverall) * 100) / 100,
                avgBIRPercent: Math.round(calculateAverage(participantImprovements.bodyLanguage) * 100) / 100,
                avgMaxBL: Math.round(calculateAverage(participantImprovements.maxBodyLanguage) * 100) / 100,
                avgMinBL: Math.round(calculateAverage(participantImprovements.minBodyLanguage) * 100) / 100,
                avgVIRPercent: Math.round(calculateAverage(participantImprovements.vocalTone) * 100) / 100,
                avgMaxVT: Math.round(calculateAverage(participantImprovements.maxVocalTone) * 100) / 100,
                avgMinVT: Math.round(calculateAverage(participantImprovements.minVocalTone) * 100) / 100,
                avgWIRPercent: Math.round(calculateAverage(participantImprovements.wordPower) * 100) / 100,
                avgMaxWP: Math.round(calculateAverage(participantImprovements.maxWordPower) * 100) / 100,
                avgMinWP: Math.round(calculateAverage(participantImprovements.minWordPower) * 100) / 100,
                totalVideos: videoAnalyses.length,
                totalParticipants: metrics.uniqueParticipants.size,
                businessCode: businessUnit.businessCode,
                businessCategory: businessUnit.category
            };

            results.push(businessWiseRow);
        }

        return {
            success: true,
            message: `Business Wise Data calculated for ${results.length} business units`,
            data: results,
            summary: {
                totalBusinessUnits: results.length,
                totalVideos: results.reduce((sum, row) => sum + row.totalVideos, 0),
                totalParticipants: results.reduce((sum, row) => sum + row.totalParticipants, 0)
            }
        };

    } catch (error) {
        console.error('Error calculating Business Wise Data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            error: 'Failed to calculate Business Wise Data',
            details: errorMessage
        };
    }
}

// Helper function to extract basic metrics from video analyses
function extractMetricsFromVideoAnalyses(videoAnalyses: any[]) {
    const uniqueParticipants = new Set(videoAnalyses.map(a => a.uploadInfo?.userId));

    return {
        uniqueParticipants,
        totalVideos: videoAnalyses.length
    };
}

// Helper function to calculate participant-level improvements for Business Wise Data
function calculateParticipantImprovementsForBusinessWise(videoAnalyses: any[]) {
    // Group analyses by participant
    const participantData: { [userId: string]: any[] } = {};

    videoAnalyses.forEach(analysis => {
        const userId = analysis.uploadInfo?.userId;
        if (!userId) return;

        if (!participantData[userId]) {
            participantData[userId] = [];
        }
        participantData[userId].push(analysis);
    });

    const improvements: {
        bodyLanguage: number[];
        vocalTone: number[];
        wordPower: number[];
        overall: number[];
        minBodyLanguage: number[];
        maxBodyLanguage: number[];
        minVocalTone: number[];
        maxVocalTone: number[];
        minWordPower: number[];
        maxWordPower: number[];
        minOverall: number[];
        maxOverall: number[];
    } = {
        bodyLanguage: [],
        vocalTone: [],
        wordPower: [],
        overall: [],
        minBodyLanguage: [],
        maxBodyLanguage: [],
        minVocalTone: [],
        maxVocalTone: [],
        minWordPower: [],
        maxWordPower: [],
        minOverall: [],
        maxOverall: []
    };

    // Calculate improvements for each participant
    Object.values(participantData).forEach((userAnalyses: any[]) => {
        // Sort by upload date
        userAnalyses.sort((a, b) => new Date(a.uploadInfo?.uploadDate || 0).getTime() - new Date(b.uploadInfo?.uploadDate || 0).getTime());

        // Extract scores from analyses
        const blScores = userAnalyses
            .map(a => a.overallPerformance?.bodyScore || a.bodyLanguageAnalysis?.overallScore || 0)
            .filter(score => score > 0);

        const vtScores = userAnalyses
            .map(a => a.overallPerformance?.vocalScore || a.vocalAnalysis?.overallScore || 0)
            .filter(score => score > 0);

        const wpScores = userAnalyses
            .map(a => a.overallPerformance?.wordScore || a.wordPowerAnalysis?.overallScore || 0)
            .filter(score => score > 0);

        const overallScores = userAnalyses
            .map(a => {
                let score = a.overallPerformance?.totalScore || 0;
                if (!score || score === 0) {
                    const bl = a.overallPerformance?.bodyScore || a.bodyLanguageAnalysis?.overallScore || 0;
                    const vt = a.overallPerformance?.vocalScore || a.vocalAnalysis?.overallScore || 0;
                    const wp = a.overallPerformance?.wordScore || a.wordPowerAnalysis?.overallScore || 0;
                    if (bl > 0 && vt > 0 && wp > 0) {
                        score = Math.round((bl + vt + wp) / 3);
                    }
                }
                return score;
            })
            .filter(score => score > 0);

        // Calculate improvements and min/max for each category
        if (blScores.length > 0) {
            improvements.minBodyLanguage.push(Math.min(...blScores));
            improvements.maxBodyLanguage.push(Math.max(...blScores));
            if (blScores.length > 1) {
                const improvement = ((blScores[blScores.length - 1] - blScores[0]) / blScores[0]) * 100;
                improvements.bodyLanguage.push(improvement);
            } else {
                // Single video: use baseline of 50 for improvement calculation
                const baselineScore = 50;
                const improvement = ((blScores[0] - baselineScore) / baselineScore) * 100;
                improvements.bodyLanguage.push(improvement);
            }
        }

        if (vtScores.length > 0) {
            improvements.minVocalTone.push(Math.min(...vtScores));
            improvements.maxVocalTone.push(Math.max(...vtScores));
            if (vtScores.length > 1) {
                const improvement = ((vtScores[vtScores.length - 1] - vtScores[0]) / vtScores[0]) * 100;
                improvements.vocalTone.push(improvement);
            } else {
                // Single video: use baseline of 50 for improvement calculation
                const baselineScore = 50;
                const improvement = ((vtScores[0] - baselineScore) / baselineScore) * 100;
                improvements.vocalTone.push(improvement);
            }
        }

        if (wpScores.length > 0) {
            improvements.minWordPower.push(Math.min(...wpScores));
            improvements.maxWordPower.push(Math.max(...wpScores));
            if (wpScores.length > 1) {
                const improvement = ((wpScores[wpScores.length - 1] - wpScores[0]) / wpScores[0]) * 100;
                improvements.wordPower.push(improvement);
            } else {
                // Single video: use baseline of 50 for improvement calculation
                const baselineScore = 50;
                const improvement = ((wpScores[0] - baselineScore) / baselineScore) * 100;
                improvements.wordPower.push(improvement);
            }
        }

        if (overallScores.length > 0) {
            improvements.minOverall.push(Math.min(...overallScores));
            improvements.maxOverall.push(Math.max(...overallScores));
            if (overallScores.length > 1) {
                const improvement = ((overallScores[overallScores.length - 1] - overallScores[0]) / overallScores[0]) * 100;
                improvements.overall.push(improvement);
            } else {
                // Single video: use baseline of 50 for improvement calculation
                const baselineScore = 50;
                const improvement = ((overallScores[0] - baselineScore) / baselineScore) * 100;
                improvements.overall.push(improvement);
            }
        }
    });

    return improvements;
}

// Helper function to calculate average of an array
function calculateAverage(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}
