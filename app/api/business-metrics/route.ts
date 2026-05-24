import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { checkAdminPermissions } from '@/lib/admin-permissions';

// Interface for the businessmetrics collection
interface BusinessMetrics {
    _id?: ObjectId;

    // Identification
    businessId: string;
    businessUnitId?: ObjectId;    // Reference to businessunits collection _id
    businessName: string;
    businessUnit?: string;      // Business unit name (e.g., "Acquiring & Cards")
    businessCode?: string;      // Business unit code (e.g., "ACQ_CARDS")
    businessCategory?: string;  // Business category
    region: string;
    zone?: string;
    batch?: string;
    branch?: string;
    corporate_account_id: ObjectId; // Reference to CorporateAccount

    // Time Period
    periodInfo: {
        calculationDate: Date;
        periodType: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all-time';
        periodStart: Date;
        periodEnd: Date;
        weekOfYear?: number;
        monthYear?: string;
        quarter?: string;
        year: number;
    };

    // Participants
    participants: {
        totalParticipants: number; // P
        activeParticipants: number;
        newParticipants: number;
        totalVideos: number;
        analyzedVideos: number;
    };

    // Body Language Metrics
    bodyLanguage: {
        averageBodyLanguage: number;      // ABL
        maximumBodyLanguage: number;      // MAX BL
        minimumBodyLanguage: number;      // MIN BL
        bodyLanguageImprovementRate: number; // BIR
        avgMinBodyLanguage: number;       // Avg MIN BL
        avgMaxBodyLanguage: number;       // Avg MAX BL
        participantsWithBL: number;
    };

    // Vocal Tone Metrics
    vocalTone: {
        averageVocalTone: number;         // AVT
        maximumVocalTone: number;         // MAX VT
        minimumVocalTone: number;         // MIN VT
        vocalToneImprovementRate: number; // VIR
        avgMinVocalTone: number;          // Avg MIN VT
        avgMaxVocalTone: number;          // Avg MAX VT
        participantsWithVT: number;
    };

    // Word Power Metrics
    wordPower: {
        averageWordPower: number;         // AWP
        maximumWordPower: number;         // MAX WP
        minimumWordPower: number;         // MIN WP
        wordPowerImprovementRate: number; // WIR
        avgMinWordPower: number;          // Avg MIN WP
        avgMaxWordPower: number;          // Avg MAX WP
        participantsWithWP: number;
    };

    // Overall Metrics
    overall: {
        avgOverallImprovementRate: number;    // Avg OIR
        avgMaxOverallScore: number;           // Avg MAX OS
        avgMinOverallScore: number;           // Avg MIN OS
        avgBodyLanguageImprovementRate: number; // Avg BIR
        avgVocalToneImprovementRate: number;    // Avg VIR
        avgWordPowerImprovementRate: number;    // Avg WIR
        overallEngagementScore: number;
        completionRate: number;
    };

    // Enhanced metrics (optional for backward compatibility)
    enhancedVocalMetrics?: any;
    enhancedBodyLanguageMetrics?: any;
    enhancedWordPowerMetrics?: any;
    enhancedPsychologicalMetrics?: any;
    comprehensiveInsights?: any;

    // Metadata
    metadata: {
        calculatedAt: Date;
        calculatedBy: string;
        version: number;
        dataSource: string;
        isActive: boolean;
        enhancementLevel?: string;
        dataPointsUsed?: number;
    };
}

// Type for creating new business metrics (without _id)
type CreateBusinessMetrics = Omit<BusinessMetrics, '_id'>;

// Calculate and store business metrics
export async function POST(request: NextRequest) {
    try {
        // Check admin authentication and get corporate account ID
        const authResult = await checkAdminPermissions(request);
        
        if (!authResult.isAuthenticated || !authResult.isAdmin) {
            return NextResponse.json(
                { error: authResult.error || 'Admin authentication required' },
                { status: 401 }
            );
        }

        if (!authResult.corporateAccountId) {
            return NextResponse.json(
                { error: 'Corporate account ID not found' },
                { status: 400 }
            );
        }

        const { db } = await connectDB();
        const body = await request.json();

        const {
            region,
            zone,
            batch,
            branch,
            periodType = 'all-time',
            periodStart,
            periodEnd,
            businessName,
            businessCode,
            businessCategory,
            businessUnitId,
            accountId = 'default',
            activities: providedActivities // Allow activities to be passed directly
        } = body;

        const videoUploadActivities = db.collection('videouploadactivities');
        const businessMetrics = db.collection('businessmetrics');

        // If activities are provided directly, use them instead of fetching from database
        let activities = providedActivities;
        let rawActivities = providedActivities || [];

        if (!activities) {
            // Build filter for activities
            const activityFilter: any = {};

            // Add account-based filtering
            // Filter by corporate account ID
            activityFilter.corporate_account_id = new ObjectId(authResult.corporateAccountId);

            // Add organization info filters if provided
            if (region) activityFilter['organizationInfo.region'] = region;
            if (zone) activityFilter['organizationInfo.zone'] = zone;
            if (batch) activityFilter['organizationInfo.batch'] = batch;
            if (branch) activityFilter['organizationInfo.branch'] = branch;

            // Add date filter if specified
            if (periodStart || periodEnd) {
                activityFilter.uploadDate = {};
                if (periodStart) activityFilter.uploadDate.$gte = new Date(periodStart);
                if (periodEnd) activityFilter.uploadDate.$lte = new Date(periodEnd);
            }

            // Get all activities for this filter
            rawActivities = await videoUploadActivities.find(activityFilter).toArray();
            console.log(`Found ${rawActivities.length} activities for business metrics calculation`);

            if (rawActivities.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'No activities found for the specified criteria'
                }, { status: 404 });
            }

            // Get video analysis data directly and join with activity organizational info
            const videoAnalysisCollection = db.collection('video_analysis');
            
            // Get all video analyses that match our activities
            const uploadIds = rawActivities.map((a: any) => a.uploadId);
            const videoAnalyses = await videoAnalysisCollection.find({
                'uploadInfo.uploadId': { $in: uploadIds }
            }).toArray();

            console.log(`Found ${videoAnalyses.length} video analyses for ${rawActivities.length} activities`);

            // Create enriched activities by joining video_analysis (primary) with videouploadactivities (organizational info)
            const enrichedActivities: any[] = [];

            for (const analysis of videoAnalyses) {
                // Find the corresponding activity for organizational info
                const activity = rawActivities.find((a: any) => a.uploadId === analysis.uploadInfo.uploadId);
                
                if (!activity) {
                    console.log(`No activity found for uploadId: ${analysis.uploadInfo.uploadId}`);
                    continue;
                }

                // Create enriched activity using video_analysis as primary source with FULL DATA
                const enrichedActivity = {
                    // Use activity data for organizational and employee info
                    uploadId: activity.uploadId,
                    userId: activity.userId,
                    employeeId: activity.employeeId,
                    uploadDate: activity.uploadDate,
                    filename: activity.filename,
                    businessId: activity.businessId,
                    employeeInfo: activity.employeeInfo,
                    organizationInfo: activity.organizationInfo,
                    
                    // ENHANCED: Extract rich analysis data instead of just 4 basic scores
                    analysisData: {
                        // Basic scores (for backward compatibility)
                        bodyLanguageScore: analysis.overallPerformance?.bodyScore || analysis.bodyLanguageAnalysis?.overallScore || 0,
                        vocalToneScore: analysis.overallPerformance?.vocalScore || analysis.vocalAnalysis?.overallScore || 0,
                        wordPowerScore: analysis.overallPerformance?.wordScore || analysis.wordPowerAnalysis?.overallScore || 0,
                        overallScore: analysis.overallPerformance?.totalScore || 0,
                        
                        // RICH VOCAL DATA
                        vocalMetrics: {
                            volumeDb: analysis.vocalAnalysis?.audio?.volumeDb || 0,
                            pitchHz: analysis.vocalAnalysis?.audio?.meanPitchHz || 0,
                            pitchRange: analysis.vocalAnalysis?.audio?.avgPitchRange || 0,
                            speakingPercentage: analysis.vocalAnalysis?.audio?.speakingTimePercentage || 0,
                            pausesPerMinute: analysis.vocalAnalysis?.audio?.numPauses ? 
                                (analysis.vocalAnalysis.audio.numPauses / (analysis.vocalAnalysis.audio.durationSec / 60)) : 0,
                            clarity: analysis.vocalAnalysis?.quality?.clarity || 0,
                            fluency: analysis.vocalAnalysis?.quality?.fluency || 0,
                            energy: analysis.vocalAnalysis?.quality?.energy || 'Unknown',
                            projection: analysis.vocalAnalysis?.quality?.projection || 'Unknown'
                        },
                        
                        // RICH BODY LANGUAGE DATA
                        bodyLanguageMetrics: {
                            smilePercentage: analysis.bodyLanguageAnalysis?.gestures?.smiles?.percentage || 0,
                            eyeContactPercentage: analysis.bodyLanguageAnalysis?.gestures?.eyeContact?.percentage || 0,
                            handMovementPercentage: analysis.bodyLanguageAnalysis?.gestures?.handMovement?.percentage || 0,
                            headMovementPercentage: analysis.bodyLanguageAnalysis?.gestures?.headMovement?.percentage || 0,
                            straightPosture: analysis.bodyLanguageAnalysis?.posture?.straightPosture || 0,
                            confidence: analysis.bodyLanguageAnalysis?.posture?.confidence || 'Unknown',
                            stability: analysis.bodyLanguageAnalysis?.posture?.stability || 'Unknown'
                        },
                        
                        // RICH WORD POWER DATA
                        wordPowerMetrics: {
                            vocabularyDiversity: analysis.wordPowerAnalysis?.contentAssessment?.vocabularyDiversity || 0,
                            clarityScore: analysis.wordPowerAnalysis?.contentAssessment?.clarityScore || 0,
                            wordCount: analysis.wordPowerAnalysis?.contentAssessment?.contentLength?.wordCount || 0,
                            fillerWordsPercentage: analysis.wordPowerAnalysis?.contentAssessment?.fluency?.fillerWordsPercentage || 0,
                            avgWordsPerSentence: analysis.wordPowerAnalysis?.contentAssessment?.sentenceStructure?.avgWordsPerSentence || 0,
                            complexityLevel: analysis.wordPowerAnalysis?.contentAssessment?.complexityLevel || 'Unknown'
                        },
                        
                        // PSYCHOLOGICAL METRICS
                        psychologicalMetrics: {
                            confidenceScore: analysis.confidenceAnalysis?.confidenceScore || 0,
                            engagementScore: analysis.confidenceAnalysis?.engagementScore || 0,
                            nervousnessScore: analysis.confidenceAnalysis?.nervousnessScore || 0,
                            sentimentPositive: analysis.sentimentAnalysis?.positiveScore || 0,
                            sentimentNegative: analysis.sentimentAnalysis?.negativeScore || 0,
                            dominantEmotion: analysis.emotionAnalysis?.dominantEmotion || 'Unknown'
                        },
                        
                        // METADATA
                        analysisMetadata: {
                            isAnalyzed: true,
                            analysisDate: analysis.processingInfo?.processedDate || new Date(),
                            analysisVersion: analysis.processingInfo?.analysisVersion || '2.0',
                            processingTime: analysis.processingInfo?.processingTime || 0,
                            framesProcessed: analysis.bodyLanguageAnalysis?.framesProcessed || 0,
                            audioQuality: analysis.processingInfo?.qualityFlags?.audioQuality || 'Unknown',
                            videoQuality: analysis.processingInfo?.qualityFlags?.videoQuality || 'Unknown'
                        }
                    },
                    
                    // Keep full analysis for any additional processing
                    fullAnalysis: analysis
                };

                enrichedActivities.push(enrichedActivity);
            }

            activities = enrichedActivities;
        } else {
            console.log(`Using ${activities.length} provided activities for business metrics calculation`);
            
            // Check if activities are already enriched (have analysisData)
            const needsEnrichment = activities.length > 0 && !activities[0].analysisData;
            
            if (needsEnrichment) {
                console.log('Enriching provided activities with analysis data...');
                
                // Get video analysis data for the provided activities
                const videoAnalysisCollection = db.collection('video_analysis');
                const uploadIds = activities.map((a: any) => a.uploadId);
                const videoAnalyses = await videoAnalysisCollection.find({
                    'uploadInfo.uploadId': { $in: uploadIds }
                }).toArray();

                console.log(`Found ${videoAnalyses.length} video analyses for ${activities.length} provided activities`);

                // Enrich the provided activities
                activities = activities.map((activity: any) => {
                    const analysis = videoAnalyses.find(a => a.uploadInfo.uploadId === activity.uploadId);
                    
                    if (!analysis) {
                        console.log(`No analysis found for uploadId: ${activity.uploadId}`);
                        return activity;
                    }

                    return {
                        // Keep original activity data
                        ...activity,
                        
                        // Add enriched analysis data
                        analysisData: {
                            // Basic scores (for backward compatibility)
                            bodyLanguageScore: analysis.overallPerformance?.bodyScore || analysis.bodyLanguageAnalysis?.overallScore || 0,
                            vocalToneScore: analysis.overallPerformance?.vocalScore || analysis.vocalAnalysis?.overallScore || 0,
                            wordPowerScore: analysis.overallPerformance?.wordScore || analysis.wordPowerAnalysis?.overallScore || 0,
                            overallScore: analysis.overallPerformance?.totalScore || 0,
                            
                            // RICH VOCAL DATA
                            vocalMetrics: {
                                volumeDb: analysis.vocalAnalysis?.audio?.volumeDb || 0,
                                pitchHz: analysis.vocalAnalysis?.audio?.meanPitchHz || 0,
                                pitchRange: analysis.vocalAnalysis?.audio?.avgPitchRange || 0,
                                speakingPercentage: analysis.vocalAnalysis?.audio?.speakingTimePercentage || 0,
                                pausesPerMinute: analysis.vocalAnalysis?.audio?.numPauses ? 
                                    (analysis.vocalAnalysis.audio.numPauses / (analysis.vocalAnalysis.audio.durationSec / 60)) : 0,
                                clarity: analysis.vocalAnalysis?.quality?.clarity || 0,
                                fluency: analysis.vocalAnalysis?.quality?.fluency || 0,
                                energy: analysis.vocalAnalysis?.quality?.energy || 'Unknown',
                                projection: analysis.vocalAnalysis?.quality?.projection || 'Unknown'
                            },
                            
                            // RICH BODY LANGUAGE DATA
                            bodyLanguageMetrics: {
                                smilePercentage: analysis.bodyLanguageAnalysis?.gestures?.smiles?.percentage || 0,
                                eyeContactPercentage: analysis.bodyLanguageAnalysis?.gestures?.eyeContact?.percentage || 0,
                                handMovementPercentage: analysis.bodyLanguageAnalysis?.gestures?.handMovement?.percentage || 0,
                                headMovementPercentage: analysis.bodyLanguageAnalysis?.gestures?.headMovement?.percentage || 0,
                                straightPosture: analysis.bodyLanguageAnalysis?.posture?.straightPosture || 0,
                                confidence: analysis.bodyLanguageAnalysis?.posture?.confidence || 'Unknown',
                                stability: analysis.bodyLanguageAnalysis?.posture?.stability || 'Unknown'
                            },
                            
                            // RICH WORD POWER DATA
                            wordPowerMetrics: {
                                vocabularyDiversity: analysis.wordPowerAnalysis?.contentAssessment?.vocabularyDiversity || 0,
                                clarityScore: analysis.wordPowerAnalysis?.contentAssessment?.clarityScore || 0,
                                wordCount: analysis.wordPowerAnalysis?.contentAssessment?.contentLength?.wordCount || 0,
                                fillerWordsPercentage: analysis.wordPowerAnalysis?.contentAssessment?.fluency?.fillerWordsPercentage || 0,
                                avgWordsPerSentence: analysis.wordPowerAnalysis?.contentAssessment?.sentenceStructure?.avgWordsPerSentence || 0,
                                complexityLevel: analysis.wordPowerAnalysis?.contentAssessment?.complexityLevel || 'Unknown'
                            },
                            
                            // PSYCHOLOGICAL METRICS
                            psychologicalMetrics: {
                                confidenceScore: analysis.confidenceAnalysis?.confidenceScore || 0,
                                engagementScore: analysis.confidenceAnalysis?.engagementScore || 0,
                                nervousnessScore: analysis.confidenceAnalysis?.nervousnessScore || 0,
                                sentimentPositive: analysis.sentimentAnalysis?.positiveScore || 0,
                                sentimentNegative: analysis.sentimentAnalysis?.negativeScore || 0,
                                dominantEmotion: analysis.emotionAnalysis?.dominantEmotion || 'Unknown'
                            },
                            
                            // METADATA
                            analysisMetadata: {
                                isAnalyzed: true,
                                analysisDate: analysis.processingInfo?.processedDate || new Date(),
                                analysisVersion: analysis.processingInfo?.analysisVersion || '2.0',
                                processingTime: analysis.processingInfo?.processingTime || 0,
                                framesProcessed: analysis.bodyLanguageAnalysis?.framesProcessed || 0,
                                audioQuality: analysis.processingInfo?.qualityFlags?.audioQuality || 'Unknown',
                                videoQuality: analysis.processingInfo?.qualityFlags?.videoQuality || 'Unknown'
                            }
                        },
                        
                        // Keep full analysis for any additional processing
                        fullAnalysis: analysis
                    };
                });
            }
        }

        // Fetch business units for employee assignment matching
        const businessUnitsCollection = db.collection('businessunits');
        const businessUnits = await businessUnitsCollection.find({ isActive: true }).toArray();

        console.log(`Loaded ${businessUnits.length} active business units`);

        // Group activities by business unit based on employee assignments
        const businessGroups: { [businessCode: string]: any[] } = {};

        for (const activity of activities) {
            // Extract employee ID from userId (remove EMPLOYEE: prefix)
            const employeeId = activity.userId?.replace('EMPLOYEE:', '');

            if (!employeeId) {
                console.log(`No employee ID found for activity: ${activity.uploadId}`);
                continue;
            }

            // Find business unit that has this employee assigned
            let assignedBusinessUnit = null;
            for (const businessUnit of businessUnits) {
                if (businessUnit.assignedEmployees && businessUnit.assignedEmployees.includes(employeeId)) {
                    assignedBusinessUnit = businessUnit;
                    break;
                }
            }

            if (!assignedBusinessUnit) {
                console.log(`No business unit found for employee: ${employeeId}`);
                continue;
            }

            // Use business unit code as the key
            const businessCode = assignedBusinessUnit.businessCode;
            if (!businessGroups[businessCode]) {
                businessGroups[businessCode] = [];
            }
            businessGroups[businessCode].push(activity);
        }

        console.log(`Grouped activities into ${Object.keys(businessGroups).length} business units`);

        // Calculate metrics for each business unit
        const calculatedMetrics = [];

        for (const [businessCode, businessActivities] of Object.entries(businessGroups)) {
            // Skip if no activities for this business unit
            if (businessActivities.length === 0) {
                console.log(`No activities found for business unit: ${businessCode}`);
                continue;
            }

            // Find the business unit info
            const businessUnitInfo = businessUnits.find(bu => bu.businessCode === businessCode);

            if (!businessUnitInfo) {
                console.log(`Business unit not found for code: ${businessCode}`);
                continue;
            }

            const metrics = calculateBusinessMetrics(businessActivities, {
                region: region || 'All',
                zone: zone || 'All',
                batch: batch || 'All',
                branch: branch || 'All',
                periodType,
                periodStart: periodStart ? new Date(periodStart) : (businessActivities.length > 0 ? new Date(businessActivities[0].uploadDate) : new Date()),
                periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
                businessName: businessUnitInfo.businessName,
                businessCode: businessUnitInfo.businessCode,
                businessCategory: businessUnitInfo.businessCategory,
                businessUnitId: businessUnitInfo._id,
                accountId: authResult.corporateAccountId // Use authenticated corporate account ID
            }, authResult.corporateAccountId);

            calculatedMetrics.push(metrics);
        }

        const results = [];
        for (const metrics of calculatedMetrics) {
            // Check if metrics already exist for this business unit and period
            const existingMetrics = await businessMetrics.findOne({
                businessId: metrics.businessId,
                'periodInfo.periodType': metrics.periodInfo.periodType,
                'periodInfo.periodStart': metrics.periodInfo.periodStart,
                'periodInfo.periodEnd': metrics.periodInfo.periodEnd
            });

            if (existingMetrics) {
                // Update existing metrics
                const result = await businessMetrics.updateOne(
                    { _id: existingMetrics._id },
                    {
                        $set: {
                            ...metrics,
                            'metadata.calculatedAt': new Date(),
                            'metadata.version': existingMetrics.metadata.version + 1
                        }
                    }
                );
                results.push({ businessId: metrics.businessId, action: 'updated', id: existingMetrics._id });
            } else {
                // Create new metrics
                const result = await businessMetrics.insertOne(metrics);
                results.push({ businessId: metrics.businessId, action: 'created', id: result.insertedId });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Business metrics calculated for ${calculatedMetrics.length} business units`,
            results,
            summary: {
                totalBusinessUnits: calculatedMetrics.length,
                totalActivities: activities.length,
                totalParticipants: calculatedMetrics.reduce((sum, m) => sum + m.participants.totalParticipants, 0),
                totalVideos: calculatedMetrics.reduce((sum, m) => sum + m.participants.totalVideos, 0)
            }
        });
    }
    catch (error) {
        console.error('Error calculating business metrics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to calculate business metrics', details: errorMessage },
            { status: 500 }
        );
    }
}

// Get business metrics with filtering
export async function GET(request: NextRequest) {
    try {
        // Check admin authentication and get corporate account ID
        const authResult = await checkAdminPermissions(request);
        
        if (!authResult.isAuthenticated || !authResult.isAdmin) {
            return NextResponse.json(
                { error: authResult.error || 'Admin authentication required' },
                { status: 401 }
            );
        }

        if (!authResult.corporateAccountId) {
            return NextResponse.json(
                { error: 'Corporate account ID not found' },
                { status: 400 }
            );
        }

        const { db } = await connectDB();
        const { searchParams } = new URL(request.url);

        // Check if requesting business-wise data
        const format = searchParams.get('format');
        const isBusinessWise = format === 'business-wise';

        // Build filter based on query parameters and corporate account
        const filter: any = { 
            'metadata.isActive': true,
            corporate_account_id: new ObjectId(authResult.corporateAccountId)
        };

        const region = searchParams.get('region');
        const zone = searchParams.get('zone');
        const batch = searchParams.get('batch');
        const branch = searchParams.get('branch');
        const periodType = searchParams.get('periodType');
        const year = searchParams.get('year');

        if (region) filter.region = region;
        if (zone) filter.zone = zone;
        if (batch) filter.batch = batch;
        if (branch) filter.branch = branch;
        if (periodType) filter['periodInfo.periodType'] = periodType;
        if (year) filter['periodInfo.year'] = parseInt(year);

        const businessMetrics = db.collection('businessmetrics');
        const metrics = await businessMetrics
            .find(filter)
            .sort({ 'periodInfo.calculationDate': -1 })
            .toArray();

        if (isBusinessWise) {
            // Return business-wise aggregated data
            const businessData = aggregateBusinessData(metrics);
            return NextResponse.json({
                success: true,
                count: businessData.length,
                // keep `data` for backwards compatibility and also include `businessData` which the frontend expects
                data: businessData,
                businessData: businessData,
                summary: {
                    totalBusinessUnits: businessData.length,
                    totalParticipants: businessData.reduce((sum, b) => sum + b.totalParticipants, 0),
                    totalVideos: businessData.reduce((sum, b) => sum + b.totalVideos, 0)
                }
            });
        }

        return NextResponse.json({
            success: true,
            count: metrics.length,
            data: metrics
        });

    } catch (error) {
        console.error('Error fetching business metrics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
            { error: 'Failed to fetch business metrics', details: errorMessage },
            { status: 500 }
        );
    }
}

// Helper function to aggregate business data
function aggregateBusinessData(metrics: any[]) {
    const businessData: { [businessCode: string]: any } = {};

    metrics.forEach(metric => {
        const businessCode = metric.businessCode || metric.businessId || 'UNASSIGNED';
        const businessName = metric.businessUnit || metric.businessName || 'Unassigned Business';

        if (!businessData[businessCode]) {
            businessData[businessCode] = {
                businessName,
                businessCode,
                businessCategory: metric.businessCategory ,
                totalParticipants: 0,
                totalVideos: 0,
                totalAnalyzedVideos: 0,
                weightedAvgOIR: 0,
                weightedAvgMaxOS: 0,
                weightedAvgMinOS: 0,
                weightedAvgBIR: 0,
                weightedAvgMaxBL: 0,
                weightedAvgMinBL: 0,
                weightedAvgVIR: 0,
                weightedAvgMaxVT: 0,
                weightedAvgMinVT: 0,
                weightedAvgWIR: 0,
                weightedAvgMaxWP: 0,
                weightedAvgMinWP: 0,
                regions: new Set(),
                lastCalculated: null
            };
        }

        const business = businessData[businessCode];
        const participants = metric.participants?.totalParticipants || 0;

        business.totalParticipants += participants;
        business.totalVideos += metric.participants?.totalVideos || 0;
        business.totalAnalyzedVideos += metric.participants?.analyzedVideos || 0;

        // Weighted averages
        business.weightedAvgOIR += (metric.overall?.avgOverallImprovementRate || 0) * participants;
        business.weightedAvgMaxOS += (metric.overall?.avgMaxOverallScore || 0) * participants;
        business.weightedAvgMinOS += (metric.overall?.avgMinOverallScore || 0) * participants;
        business.weightedAvgBIR += (metric.overall?.avgBodyLanguageImprovementRate || 0) * participants;
        business.weightedAvgMaxBL += (metric.bodyLanguage?.avgMaxBodyLanguage || 0) * participants;
        business.weightedAvgMinBL += (metric.bodyLanguage?.avgMinBodyLanguage || 0) * participants;
        business.weightedAvgVIR += (metric.overall?.avgVocalToneImprovementRate || 0) * participants;
        business.weightedAvgMaxVT += (metric.vocalTone?.avgMaxVocalTone || 0) * participants;
        business.weightedAvgMinVT += (metric.vocalTone?.avgMinVocalTone || 0) * participants;
        business.weightedAvgWIR += (metric.overall?.avgWordPowerImprovementRate || 0) * participants;
        business.weightedAvgMaxWP += (metric.wordPower?.avgMaxWordPower || 0) * participants;
        business.weightedAvgMinWP += (metric.wordPower?.avgMinWordPower || 0) * participants;

        business.regions.add(metric.region);

        const calcDate = new Date(metric.metadata?.calculatedAt);
        if (!business.lastCalculated || calcDate > business.lastCalculated) {
            business.lastCalculated = calcDate;
        }
    });

    // Calculate final averages and return business-wise data
    return Object.values(businessData).map((business: any) => {
        const participants = business.totalParticipants;

        return {
            businessName: business.businessName,
            businessCode: business.businessCode,
            businessCategory: business.businessCategory,

            // Business Wise Data Row Labels as requested
            avgOIR: participants > 0 ? Math.round((business.weightedAvgOIR / participants) * 100) / 100 : 0,
            avgMaxOS: participants > 0 ? Math.round((business.weightedAvgMaxOS / participants) * 100) / 100 : 0,
            avgMinOS: participants > 0 ? Math.round((business.weightedAvgMinOS / participants) * 100) / 100 : 0,
            avgBIR: participants > 0 ? Math.round((business.weightedAvgBIR / participants) * 100) / 100 : 0,
            avgMaxBL: participants > 0 ? Math.round((business.weightedAvgMaxBL / participants) * 100) / 100 : 0,
            avgMinBL: participants > 0 ? Math.round((business.weightedAvgMinBL / participants) * 100) / 100 : 0,
            avgVIR: participants > 0 ? Math.round((business.weightedAvgVIR / participants) * 100) / 100 : 0,
            avgMaxVT: participants > 0 ? Math.round((business.weightedAvgMaxVT / participants) * 100) / 100 : 0,
            avgMinVT: participants > 0 ? Math.round((business.weightedAvgMinVT / participants) * 100) / 100 : 0,
            avgWIR: participants > 0 ? Math.round((business.weightedAvgWIR / participants) * 100) / 100 : 0,
            avgMaxWP: participants > 0 ? Math.round((business.weightedAvgMaxWP / participants) * 100) / 100 : 0,
            avgMinWP: participants > 0 ? Math.round((business.weightedAvgMinWP / participants) * 100) / 100 : 0,

            totalParticipants: participants,
            totalVideos: business.totalVideos,
            totalAnalyzedVideos: business.totalAnalyzedVideos,
            analysisRate: business.totalVideos > 0 ?
                Math.round((business.totalAnalyzedVideos / business.totalVideos) * 100) : 0,
            regionsCount: business.regions.size,
            regions: Array.from(business.regions),
            lastCalculated: business.lastCalculated
        };
    }).sort((a, b) => a.businessName.localeCompare(b.businessName));
}

// Helper function to calculate business metrics from activities
function calculateBusinessMetrics(activities: any[], config: any, corporateAccountId: string): CreateBusinessMetrics {
    const analyzedActivities = activities.filter(a => a.analysisData?.analysisMetadata?.isAnalyzed);
    const uniqueParticipants = new Set(activities.map(a => a.userId));

    // ENHANCED: Extract rich analysis data instead of just basic scores
    const bodyLanguageScores = analyzedActivities
        .map(a => a.analysisData?.bodyLanguageScore)
        .filter(score => score !== undefined && score !== null && score > 0);

    const vocalToneScores = analyzedActivities
        .map(a => a.analysisData?.vocalToneScore)
        .filter(score => score !== undefined && score !== null && score > 0);

    const wordPowerScores = analyzedActivities
        .map(a => a.analysisData?.wordPowerScore)
        .filter(score => score !== undefined && score !== null && score > 0);

    // ENHANCED: Extract detailed metrics for comprehensive analysis
    const vocalMetrics = {
        volumeDb: analyzedActivities.map(a => a.analysisData?.vocalMetrics?.volumeDb).filter(v => v > 0),
        pitchHz: analyzedActivities.map(a => a.analysisData?.vocalMetrics?.pitchHz).filter(v => v > 0),
        speakingPercentage: analyzedActivities.map(a => a.analysisData?.vocalMetrics?.speakingPercentage).filter(v => v > 0),
        clarity: analyzedActivities.map(a => a.analysisData?.vocalMetrics?.clarity).filter(v => v > 0),
        fluency: analyzedActivities.map(a => a.analysisData?.vocalMetrics?.fluency).filter(v => v > 0),
        energyLevels: analyzedActivities.map(a => a.analysisData?.vocalMetrics?.energy).filter(Boolean)
    };

    const bodyLanguageMetrics = {
        smilePercentage: analyzedActivities.map(a => a.analysisData?.bodyLanguageMetrics?.smilePercentage).filter(v => v >= 0),
        eyeContactPercentage: analyzedActivities.map(a => a.analysisData?.bodyLanguageMetrics?.eyeContactPercentage).filter(v => v >= 0),
        handMovementPercentage: analyzedActivities.map(a => a.analysisData?.bodyLanguageMetrics?.handMovementPercentage).filter(v => v >= 0),
        straightPosture: analyzedActivities.map(a => a.analysisData?.bodyLanguageMetrics?.straightPosture).filter(v => v > 0),
        confidenceLevels: analyzedActivities.map(a => a.analysisData?.bodyLanguageMetrics?.confidence).filter(Boolean)
    };

    const wordPowerMetrics = {
        vocabularyDiversity: analyzedActivities.map(a => a.analysisData?.wordPowerMetrics?.vocabularyDiversity).filter(v => v > 0),
        clarityScore: analyzedActivities.map(a => a.analysisData?.wordPowerMetrics?.clarityScore).filter(v => v > 0),
        wordCount: analyzedActivities.map(a => a.analysisData?.wordPowerMetrics?.wordCount).filter(v => v > 0),
        fillerWordsPercentage: analyzedActivities.map(a => a.analysisData?.wordPowerMetrics?.fillerWordsPercentage).filter(v => v >= 0),
        complexityLevels: analyzedActivities.map(a => a.analysisData?.wordPowerMetrics?.complexityLevel).filter(Boolean)
    };

    const psychologicalMetrics = {
        confidenceScore: analyzedActivities.map(a => a.analysisData?.psychologicalMetrics?.confidenceScore).filter(v => v > 0),
        engagementScore: analyzedActivities.map(a => a.analysisData?.psychologicalMetrics?.engagementScore).filter(v => v > 0),
        nervousnessScore: analyzedActivities.map(a => a.analysisData?.psychologicalMetrics?.nervousnessScore).filter(v => v >= 0),
        sentimentPositive: analyzedActivities.map(a => a.analysisData?.psychologicalMetrics?.sentimentPositive).filter(v => v >= 0)
    };

    // Calculate improvement rates per participant
    const participantImprovements = calculateParticipantImprovements(activities);

    // Helper functions
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const max = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 0;
    const min = (arr: number[]) => arr.length > 0 ? Math.min(...arr) : 0;

    const calculationDate = new Date();

    // Get business info from the first activity or config
    const firstActivity = activities[0];
    const businessRegion = config.region || firstActivity?.organizationInfo?.region || 'All';
    const businessZone = config.zone || firstActivity?.organizationInfo?.zone || undefined;
    const businessBatch = config.batch || firstActivity?.organizationInfo?.batch || undefined;
    const businessBranch = config.branch || firstActivity?.organizationInfo?.branch || undefined;

    // Use provided business info - no hardcoded fallbacks
    const finalBusinessName = config.businessName;
    const finalBusinessCode = config.businessCode;
    const finalBusinessCategory = config.businessCategory;
    const finalBusinessUnitId = config.businessUnitId;

    // Generate businessId based on business code
    const businessId = finalBusinessCode;

    return {
        businessId,
        businessUnitId: finalBusinessUnitId,
        businessName: finalBusinessName,
        businessUnit: finalBusinessName,
        businessCode: finalBusinessCode,
        businessCategory: finalBusinessCategory,
        region: businessRegion,
        zone: businessZone,
        batch: businessBatch,
        branch: businessBranch,
        corporate_account_id: new ObjectId(corporateAccountId), // Use passed corporate account ID

        periodInfo: {
            calculationDate,
            periodType: config.periodType,
            periodStart: config.periodStart,
            periodEnd: config.periodEnd,
            weekOfYear: getWeekOfYear(calculationDate),
            monthYear: calculationDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            quarter: `Q${Math.ceil((calculationDate.getMonth() + 1) / 3)} ${calculationDate.getFullYear()}`,
            year: calculationDate.getFullYear()
        },

        participants: {
            totalParticipants: uniqueParticipants.size,
            activeParticipants: uniqueParticipants.size,
            newParticipants: uniqueParticipants.size, // Could be calculated based on first upload date
            totalVideos: activities.length,
            analyzedVideos: analyzedActivities.length
        },

        bodyLanguage: {
            averageBodyLanguage: Math.round(avg(bodyLanguageScores) * 100) / 100,
            maximumBodyLanguage: max(bodyLanguageScores),
            minimumBodyLanguage: min(bodyLanguageScores),
            bodyLanguageImprovementRate: Math.round(avg(participantImprovements.bodyLanguage) * 100) / 100,
            avgMinBodyLanguage: Math.round(avg(participantImprovements.minBodyLanguage) * 100) / 100,
            avgMaxBodyLanguage: Math.round(avg(participantImprovements.maxBodyLanguage) * 100) / 100,
            participantsWithBL: bodyLanguageScores.length
        },

        vocalTone: {
            averageVocalTone: Math.round(avg(vocalToneScores) * 100) / 100,
            maximumVocalTone: max(vocalToneScores),
            minimumVocalTone: min(vocalToneScores),
            vocalToneImprovementRate: Math.round(avg(participantImprovements.vocalTone) * 100) / 100,
            avgMinVocalTone: Math.round(avg(participantImprovements.minVocalTone) * 100) / 100,
            avgMaxVocalTone: Math.round(avg(participantImprovements.maxVocalTone) * 100) / 100,
            participantsWithVT: vocalToneScores.length
        },

        wordPower: {
            averageWordPower: Math.round(avg(wordPowerScores) * 100) / 100,
            maximumWordPower: max(wordPowerScores),
            minimumWordPower: min(wordPowerScores),
            wordPowerImprovementRate: Math.round(avg(participantImprovements.wordPower) * 100) / 100,
            avgMinWordPower: Math.round(avg(participantImprovements.minWordPower) * 100) / 100,
            avgMaxWordPower: Math.round(avg(participantImprovements.maxWordPower) * 100) / 100,
            participantsWithWP: wordPowerScores.length
        },

        overall: {
            avgOverallImprovementRate: Math.round(avg(participantImprovements.overall) * 100) / 100,
            avgMaxOverallScore: Math.round(avg(participantImprovements.maxOverall) * 100) / 100,
            avgMinOverallScore: Math.round(avg(participantImprovements.minOverall) * 100) / 100,
            avgBodyLanguageImprovementRate: Math.round(avg(participantImprovements.bodyLanguage) * 100) / 100,
            avgVocalToneImprovementRate: Math.round(avg(participantImprovements.vocalTone) * 100) / 100,
            avgWordPowerImprovementRate: Math.round(avg(participantImprovements.wordPower) * 100) / 100,
            overallEngagementScore: activities.length > 0 ? Math.round((analyzedActivities.length / activities.length) * 100) : 0,
            completionRate: activities.length > 0 ? Math.round((analyzedActivities.length / activities.length) * 100) : 0
        },

        // ENHANCED METRICS: Rich data from video_analysis collection
        enhancedVocalMetrics: {
            avgVolumeDb: Math.round(avg(vocalMetrics.volumeDb) * 100) / 100,
            avgPitchHz: Math.round(avg(vocalMetrics.pitchHz) * 100) / 100,
            avgSpeakingPercentage: Math.round(avg(vocalMetrics.speakingPercentage) * 100) / 100,
            avgClarity: Math.round(avg(vocalMetrics.clarity) * 100) / 100,
            avgFluency: Math.round(avg(vocalMetrics.fluency) * 100) / 100,
            energyDistribution: getDistribution(vocalMetrics.energyLevels),
            voiceProjectionQuality: avg(vocalMetrics.volumeDb) >= 60 ? 'Strong' : avg(vocalMetrics.volumeDb) >= 45 ? 'Adequate' : 'Needs Improvement'
        },

        enhancedBodyLanguageMetrics: {
            avgSmilePercentage: Math.round(avg(bodyLanguageMetrics.smilePercentage) * 100) / 100,
            avgEyeContactPercentage: Math.round(avg(bodyLanguageMetrics.eyeContactPercentage) * 100) / 100,
            avgHandMovementPercentage: Math.round(avg(bodyLanguageMetrics.handMovementPercentage) * 100) / 100,
            avgStraightPosture: Math.round(avg(bodyLanguageMetrics.straightPosture) * 100) / 100,
            confidenceDistribution: getDistribution(bodyLanguageMetrics.confidenceLevels),
            engagementLevel: avg(bodyLanguageMetrics.eyeContactPercentage) >= 70 ? 'High' : avg(bodyLanguageMetrics.eyeContactPercentage) >= 40 ? 'Medium' : 'Low',
            nonVerbalEffectiveness: (avg(bodyLanguageMetrics.smilePercentage) + avg(bodyLanguageMetrics.eyeContactPercentage) + avg(bodyLanguageMetrics.handMovementPercentage)) / 3
        },

        enhancedWordPowerMetrics: {
            avgVocabularyDiversity: Math.round(avg(wordPowerMetrics.vocabularyDiversity) * 100) / 100,
            avgContentClarity: Math.round(avg(wordPowerMetrics.clarityScore) * 100) / 100,
            avgWordCount: Math.round(avg(wordPowerMetrics.wordCount)),
            avgFillerWordsPercentage: Math.round(avg(wordPowerMetrics.fillerWordsPercentage) * 100) / 100,
            complexityDistribution: getDistribution(wordPowerMetrics.complexityLevels),
            communicationEfficiency: avg(wordPowerMetrics.fillerWordsPercentage) <= 5 ? 'High' : avg(wordPowerMetrics.fillerWordsPercentage) <= 10 ? 'Medium' : 'Needs Improvement',
            vocabularyStrength: avg(wordPowerMetrics.vocabularyDiversity) >= 80 ? 'Excellent' : avg(wordPowerMetrics.vocabularyDiversity) >= 60 ? 'Good' : 'Developing'
        },

        enhancedPsychologicalMetrics: {
            avgConfidenceScore: Math.round(avg(psychologicalMetrics.confidenceScore) * 100) / 100,
            avgEngagementScore: Math.round(avg(psychologicalMetrics.engagementScore) * 100) / 100,
            avgNervousnessScore: Math.round(avg(psychologicalMetrics.nervousnessScore) * 100) / 100,
            avgSentimentPositivity: Math.round(avg(psychologicalMetrics.sentimentPositive) * 100) / 100,
            overallWellbeingIndicator: avg(psychologicalMetrics.confidenceScore) >= 70 && avg(psychologicalMetrics.nervousnessScore) <= 30 ? 'Positive' : 'Developing',
            teamMorale: avg(psychologicalMetrics.sentimentPositive) >= 0.6 ? 'High' : avg(psychologicalMetrics.sentimentPositive) >= 0.3 ? 'Moderate' : 'Low'
        },

        // COMPREHENSIVE INSIGHTS
        comprehensiveInsights: {
            totalDataPoints: (vocalMetrics.volumeDb.length + bodyLanguageMetrics.smilePercentage.length + wordPowerMetrics.vocabularyDiversity.length + psychologicalMetrics.confidenceScore.length),
            dataRichness: 'comprehensive', // vs 'basic' (old 4-score system)
            topPerformanceArea: getTopPerformanceArea(avg(bodyLanguageScores), avg(vocalToneScores), avg(wordPowerScores)),
            improvementPriority: getImprovementPriority(avg(bodyLanguageScores), avg(vocalToneScores), avg(wordPowerScores)),
            teamReadiness: calculateTeamReadiness(avg(psychologicalMetrics.confidenceScore), avg(psychologicalMetrics.engagementScore)),
            communicationMaturity: calculateCommunicationMaturity(avg(vocalMetrics.clarity), avg(bodyLanguageMetrics.eyeContactPercentage), avg(wordPowerMetrics.vocabularyDiversity))
        },

        metadata: {
            calculatedAt: calculationDate,
            calculatedBy: 'enhanced-system',
            version: 2, // Enhanced version with rich data
            dataSource: 'video_analysis_enhanced',
            isActive: true,
            enhancementLevel: 'comprehensive',
            dataPointsUsed: (vocalMetrics.volumeDb.length + bodyLanguageMetrics.smilePercentage.length + wordPowerMetrics.vocabularyDiversity.length + psychologicalMetrics.confidenceScore.length)
        }
    };
}

// Helper function to calculate participant-level improvements
function calculateParticipantImprovements(activities: any[]) {
    const participantData: { [userId: string]: any[] } = {};

    // Group activities by participant
    activities.forEach(activity => {
        if (!participantData[activity.userId]) {
            participantData[activity.userId] = [];
        }
        participantData[activity.userId].push(activity);
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
    Object.values(participantData).forEach((userActivities: any[]) => {
        const analyzedActivities = userActivities
            .filter(a => a.analysisData?.analysisMetadata?.isAnalyzed)
            .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime());

        if (analyzedActivities.length === 0) return;

        // Use actual scores from enhanced analysis data - filter out zero/invalid scores
        const blScores = analyzedActivities
            .map(a => a.analysisData?.bodyLanguageScore)
            .filter(score => score !== undefined && score !== null && score > 0);
        
        const vtScores = analyzedActivities
            .map(a => a.analysisData?.vocalToneScore)
            .filter(score => score !== undefined && score !== null && score > 0);
        
        const wpScores = analyzedActivities
            .map(a => a.analysisData?.wordPowerScore)
            .filter(score => score !== undefined && score !== null && score > 0);
        
        const overallScores = analyzedActivities.map(a => {
            let score = a.analysisData?.overallScore;
            // Calculate from individual scores if overall is missing but individual scores exist
            if (!score || score === 0) {
                const bl = a.analysisData?.bodyLanguageScore;
                const vt = a.analysisData?.vocalToneScore;
                const wp = a.analysisData?.wordPowerScore;
                if (bl > 0 && vt > 0 && wp > 0) {
                    score = Math.round((bl + vt + wp) / 3);
                }
            }
            return score;
        }).filter(score => score !== undefined && score !== null && score > 0);

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

// Helper function to get week of year
function getWeekOfYear(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
// Helper function to determine business unit based on departments//
function determineBusiness(departments: string[]): { name: string; code: string; category: string } {
    // Count department occurrences
    const deptCounts: { [key: string]: number } = {};
    departments.forEach(dept => {
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    // Find most common department
    const mostCommonDept = Object.keys(deptCounts).reduce((a, b) =>
        deptCounts[a] > deptCounts[b] ? a : b, Object.keys(deptCounts)[0] || 'general'
    );

    // Map departments to business units
    const businessMapping: { [key: string]: { name: string; code: string; category: string } } = {
        'cards': { name: 'Acquiring & Cards', code: 'ACQ_CARDS', category: 'Financial Services' },
        'acquiring': { name: 'Acquiring & Cards', code: 'ACQ_CARDS', category: 'Financial Services' },
        'payments': { name: 'Acquiring & Cards', code: 'ACQ_CARDS', category: 'Financial Services' },
        'banking': { name: 'Bharat Banking', code: 'BHARAT_BANK', category: 'Banking' },
        'retail banking': { name: 'Bharat Banking', code: 'BHARAT_BANK', category: 'Banking' },
        'corporate banking': { name: 'Bharat Banking', code: 'BHARAT_BANK', category: 'Banking' },
        'cse': { name: 'Technology Services', code: 'TECH_SERVICES', category: 'Technology' },
        'engineering': { name: 'Technology Services', code: 'TECH_SERVICES', category: 'Technology' },
        'hr': { name: 'Human Resources', code: 'HR_SERVICES', category: 'Human Resources' }
    };

    // Check for exact matches first
    if (businessMapping[mostCommonDept]) {
        return businessMapping[mostCommonDept];
    }

    // Check for partial matches
    for (const [key, business] of Object.entries(businessMapping)) {
        if (mostCommonDept.includes(key) || key.includes(mostCommonDept)) {
            return business;
        }
    }

    // Default business
    return { name: 'Unassigned Business', code: 'UNASSIGNED', category: 'General' };
}

// ENHANCED HELPER FUNCTIONS for rich data analysis

function getDistribution(values: string[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    values.forEach(value => {
        distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
}

function getTopPerformanceArea(bodyScore: number, vocalScore: number, wordScore: number): string {
    const scores: { [key: string]: number } = { 'Body Language': bodyScore, 'Vocal Tone': vocalScore, 'Word Power': wordScore };
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
}

function getImprovementPriority(bodyScore: number, vocalScore: number, wordScore: number): string {
    const scores: { [key: string]: number } = { 'Body Language': bodyScore, 'Vocal Tone': vocalScore, 'Word Power': wordScore };
    return Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);
}

function calculateTeamReadiness(avgConfidence: number, avgEngagement: number): string {
    const readinessScore = (avgConfidence + avgEngagement) / 2;
    if (readinessScore >= 80) return 'High Readiness';
    if (readinessScore >= 60) return 'Moderate Readiness';
    return 'Building Readiness';
}

function calculateCommunicationMaturity(clarity: number, eyeContact: number, vocabulary: number): string {
    const maturityScore = (clarity + eyeContact + vocabulary) / 3;
    if (maturityScore >= 80) return 'Advanced';
    if (maturityScore >= 65) return 'Proficient';
    if (maturityScore >= 50) return 'Developing';
    return 'Foundational';
}