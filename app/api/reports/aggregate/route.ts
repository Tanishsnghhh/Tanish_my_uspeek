import { NextRequest, NextResponse } from 'next/server';
import { 
  LessonActivity, 
  VideoUploadActivity, 
  EmployeeScoreHistory, 
  EmployeeProfile,
  EmployeeAttributeValue,
  CustomAttributeDefinition
} from '@/lib/models';
import connectDB from '@/lib/database';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { APP_CONFIG, validateConfig, isAdminRole, isValidGroupBy } from '@/lib/config';

// POST /api/reports/aggregate
export async function POST(request: NextRequest) {
  try {
    // Validate configuration on startup
    const configValidation = validateConfig();
    if (!configValidation.isValid) {
      console.error('Configuration validation failed:', configValidation.errors);
      return NextResponse.json(
        { success: false, error: APP_CONFIG.ERRORS.SERVER.INTERNAL_ERROR },
        { status: 500 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      start,
      end,
      groupBy,
      filters = [],
      metrics = APP_CONFIG.API.METRICS.DEFAULT,
      frequency = null,
      pagination = { 
        page: APP_CONFIG.API.PAGINATION.DEFAULT_PAGE, 
        pageSize: APP_CONFIG.API.PAGINATION.DEFAULT_PAGE_SIZE 
      },
      sort = { 
        field: APP_CONFIG.API.SORT.DEFAULT_FIELD, 
        direction: APP_CONFIG.API.SORT.DEFAULT_DIRECTION 
      }
    } = body;

    // Default behavior: if start/end not provided, return all data by default.
    // If groupBy not provided, default to position1 so API remains usable without client-supplied groupBy.
    const effectiveGroupBy = groupBy || 'position1';

    // Parse dates, defaulting to full range when not specified
    const startDate = start ? new Date(start) : new Date(0);
    const endDate = end ? new Date(end) : new Date();

    // Validate date formats only when provided (invalid formats should still return an error)
    if ((start && isNaN(startDate.getTime())) || (end && isNaN(endDate.getTime()))) {
      return NextResponse.json(
        { success: false, error: APP_CONFIG.ERRORS.VALIDATION.INVALID_DATE_FORMAT },
        { status: 400 }
      );
    }

    // Validate groupBy using configuration (use effectiveGroupBy)
    if (!isValidGroupBy(effectiveGroupBy)) {
      return NextResponse.json(
        { success: false, error: APP_CONFIG.ERRORS.VALIDATION.INVALID_GROUP_BY },
        { status: 400 }
      );
    }

    // Extract account_id from JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: APP_CONFIG.ERRORS.AUTH.TOKEN_REQUIRED },
        { status: 401 }
      );
    }

    let accountId: string | null = null;
    let isAdmin = false;
    
    try {
      const decoded = jwt.decode(token) as any;
      
      // Check if user is admin using configuration
      isAdmin = isAdminRole(decoded?.role);
      
      if (isAdmin && APP_CONFIG.FEATURES.ADMIN_CROSS_ACCOUNT_ACCESS) {
        // Admin users can access any account based on configuration
        // If accountId is explicitly provided in body, use it
        // If accountId is explicitly null in body, access all accounts (accountId stays null)
        // If accountId is not provided at all, default to admin's own account
        if (body.hasOwnProperty('accountId')) {
          accountId = body.accountId; // Could be a specific ID or null for all accounts
        } else {
          accountId = decoded?.corporateAccountId || null; // Default to admin's own account
        }
      } else {
        // Regular users are restricted to their own account
        if (!decoded?.corporateAccountId) {
          return NextResponse.json(
            { success: false, error: APP_CONFIG.ERRORS.AUTH.MISSING_ACCOUNT_ID },
            { status: 401 }
          );
        }
        
        // Security check: if regular user tries to access different account, deny
        if (APP_CONFIG.SECURITY.ACCESS_CONTROL.STRICT_ACCOUNT_ISOLATION && 
            body.accountId && body.accountId !== decoded.corporateAccountId) {
          return NextResponse.json(
            { success: false, error: APP_CONFIG.ERRORS.AUTH.ACCESS_DENIED },
            { status: 403 }
          );
        }
        
        accountId = decoded.corporateAccountId; // Always use their own account
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: APP_CONFIG.ERRORS.AUTH.INVALID_TOKEN },
        { status: 401 }
      );
    }

    const groupByPosition = parseInt(effectiveGroupBy.replace('position', ''));

    // Get attribute definitions for this position
    let attributeQuery: any = {
      position: groupByPosition,
      is_active: true
    };

    // Apply account filtering based on configuration and user role
    const shouldFilterByAccount = !isAdmin || 
                                 !APP_CONFIG.FEATURES.ADMIN_CROSS_ACCOUNT_ACCESS || 
                                 (isAdmin && accountId !== null);

    // Friendly account info for error messages and diagnostics
    const accountInfoForMessages = shouldFilterByAccount
      ? (accountId ? ` for account ${accountId}` : ' for requesting account')
      : ' (no account filter)';
    
    if (shouldFilterByAccount) {
      if (!accountId) {
        return NextResponse.json(
          { success: false, error: APP_CONFIG.ERRORS.VALIDATION.ACCOUNT_ID_REQUIRED },
          { status: 400 }
        );
      }
      attributeQuery.account_id = new mongoose.Types.ObjectId(accountId);
    }

    const groupByAttributes = await CustomAttributeDefinition!.find(attributeQuery).lean();

    if (!groupByAttributes || groupByAttributes.length === 0) {
      // Provide clearer diagnostics: include which account (if any) was used for the lookup
      return NextResponse.json(
        { success: false, error: `${APP_CONFIG.ERRORS.VALIDATION.NO_ATTRIBUTES_FOUND} ${effectiveGroupBy}${accountInfoForMessages}` },
        { status: 400 }
      );
    }

    // Create a combined name for the groupBy attribute
    const attributeNames = [...new Set(groupByAttributes.map(attr => attr.name))];
    const combinedAttributeName = attributeNames.length > 1 ? attributeNames.join(' / ') : attributeNames[0];

    // Build filter conditions for other attributes
    const filterConditions: any = {};
    for (const filter of filters) {
      if (filter.position && filter.value) {
        const filterPosition = parseInt(filter.position.replace('position', ''));
        
        let filterAttributeQuery: any = {
          position: filterPosition,
          is_active: true
        };

        // Apply account filter based on configuration
        if (shouldFilterByAccount) {
          filterAttributeQuery.account_id = new mongoose.Types.ObjectId(accountId!);
        }

        const filterAttributes = await CustomAttributeDefinition!.find(filterAttributeQuery).lean();

        if (filterAttributes && filterAttributes.length > 0) {
          // Get employees matching this filter for the requesting account
          const filterAttributeIds = filterAttributes.map(attr => attr._id);
          const matchingEmployees = await EmployeeAttributeValue!.find({
            attribute_id: { $in: filterAttributeIds },
            value: filter.value
          }).distinct('employee_id');
          
          if (matchingEmployees.length === 0) {
            return NextResponse.json({
              success: true,
              data: {
                window: { start, end },
                groupBy: { attributeName: combinedAttributeName, position: effectiveGroupBy },
                filtersApplied: filters,
                rows: [],
                page: pagination.page,
                pageSize: pagination.pageSize,
                totalRows: 0
              }
            });
          }
          
          filterConditions[`filter_${filterPosition}`] = matchingEmployees;
        }
      }
    }

    // Main aggregation pipeline
    const pipeline: any[] = [];

    // Apply account filtering based on configuration and user role
    if (shouldFilterByAccount) {
      const accountObjectId = new mongoose.Types.ObjectId(accountId!);
      
      pipeline.push(
        // First, join with users to get account information
        {
          $lookup: {
            from: APP_CONFIG.DATABASE.COLLECTIONS.USERS,
            localField: 'user_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: false
          }
        },
        // Filter by specific account only
        {
          $match: {
            'user.account_id': accountObjectId
          }
        }
      );
    }

    // Add employee attribute lookup
    pipeline.push(
      // Start with employees that have any of the groupBy attributes
      {
        $lookup: {
          from: APP_CONFIG.DATABASE.COLLECTIONS.EMPLOYEE_ATTRIBUTE_VALUES,
          let: { empId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$employee_id', '$$empId'] },
                attribute_id: { $in: groupByAttributes.map(attr => attr._id) }
              }
            }
          ],
          as: 'groupByAttr'
        }
      },
      {
        $match: {
          isActive: true,
          groupByAttr: { $ne: [] }
        }
      },
      {
        $unwind: '$groupByAttr'
      }
    );

    // Apply filters if any
    for (const [filterKey, employeeIds] of Object.entries(filterConditions)) {
      pipeline.push({
        $match: {
          _id: { $in: employeeIds }
        }
      } as any);
    }

    // Add lesson activity data
    pipeline.push(
      {
        $lookup: {
          from: APP_CONFIG.DATABASE.COLLECTIONS.LESSON_ACTIVITIES,
          let: { empId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employee_id', '$$empId'] },
                    ...(shouldFilterByAccount ? [{ $eq: ['$account_id', new mongoose.Types.ObjectId(accountId!)] }] : []),
                    { $gte: ['$attempted_at', startDate] },
                    { $lte: ['$attempted_at', endDate] }
                  ]
                }
              } as any
            }
          ],
          as: 'lessonActivities'
        }
      },
      // Add video upload data
      {
        $lookup: {
          from: APP_CONFIG.DATABASE.COLLECTIONS.VIDEO_UPLOAD_ACTIVITIES,
          let: { empId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employee_id', '$$empId'] },
                    ...(shouldFilterByAccount ? [{ $eq: ['$account_id', new mongoose.Types.ObjectId(accountId!)] }] : []),
                    { $gte: ['$upload_date', startDate] },
                    { $lte: ['$upload_date', endDate] }
                  ]
                }
              } as any
            }
          ],
          as: 'videoUploads'
        }
      },
      // Add score history data
      {
        $lookup: {
          from: APP_CONFIG.DATABASE.COLLECTIONS.EMPLOYEE_SCORE_HISTORIES,
          let: { empId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employee_id', '$$empId'] },
                    ...(shouldFilterByAccount ? [{ $eq: ['$account_id', new mongoose.Types.ObjectId(accountId!)] }] : []),
                    { $gte: ['$recorded_at', startDate] },
                    { $lte: ['$recorded_at', endDate] }
                  ]
                }
              } as any
            },
            { $sort: { recorded_at: 1 } } as any
          ],
          as: 'scoreHistory'
        }
      },
      // Group by attribute value and calculate metrics
      {
        $group: {
          _id: '$groupByAttr.value',
          headcount: { $sum: 1 },
          avgScore: {
            $avg: {
              $cond: [
                { $gt: [{ $size: '$lessonActivities' }, 0] },
                {
                  $avg: {
                    $map: {
                      input: '$lessonActivities',
                      in: '$$this.score'
                    }
                  }
                },
                null
              ]
            }
          },
          lessons: {
            $sum: {
              $size: {
                $setUnion: [
                  {
                    $map: {
                      input: '$lessonActivities',
                      in: '$$this.lesson_id'
                    }
                  },
                  []
                ]
              }
            }
          },
          timeSpentMinutes: {
            $sum: {
              $sum: {
                $map: {
                  input: '$lessonActivities',
                  in: '$$this.time_spent_minutes'
                }
              }
            }
          },
          videos: {
            $sum: { $size: '$videoUploads' }
          },
          improvementData: {
            $push: {
              $cond: [
                { $gt: [{ $size: '$scoreHistory' }, 1] },
                {
                  first: { $arrayElemAt: ['$scoreHistory.score', 0] },
                  last: { $arrayElemAt: ['$scoreHistory.score', -1] }
                },
                null
              ]
            }
          }
        }
      },
      // Calculate improvement
      {
        $addFields: {
          improvementDelta: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$improvementData',
                    cond: { $ne: ['$$this', null] }
                  }
                },
                in: { $subtract: ['$$this.last', '$$this.first'] }
              }
            }
          }
        }
      },
      // Project final fields
      {
        $project: {
          _id: 0,
          groupValue: '$_id',
          headcount: 1,
          avgScore: { $round: ['$avgScore', 1] },
          lessons: 1,
          timeSpentMinutes: { $round: ['$timeSpentMinutes', 1] },
          videos: 1,
          improvementDelta: { $round: ['$improvementDelta', 1] }
        }
      }
    );

    // Add sorting with configurable defaults
    const sortField = APP_CONFIG.API.SORT.VALID_FIELDS.includes(sort.field) ? 
      (sort.field === 'avgScore' ? 'avgScore' : 
       sort.field === 'videos' ? 'videos' :
       sort.field === 'lessons' ? 'lessons' :
       sort.field === 'timeSpent' ? 'timeSpentMinutes' :
       sort.field === 'improvement' ? 'improvementDelta' : 'avgScore') :
      'avgScore';
    
    const sortDirection = APP_CONFIG.API.SORT.VALID_DIRECTIONS.includes(sort.direction) ? 
      (sort.direction === 'asc' ? 1 : -1) : -1;
    
    pipeline.push({ $sort: { [sortField]: sortDirection } } as any);

    // Execute main aggregation with performance settings
    const aggregationOptions: any = {};
    if (APP_CONFIG.PERFORMANCE.AGGREGATION.MAX_TIME_MS) {
      aggregationOptions.maxTimeMS = APP_CONFIG.PERFORMANCE.AGGREGATION.MAX_TIME_MS;
    }
    if (APP_CONFIG.PERFORMANCE.AGGREGATION.ALLOW_DISK_USE) {
      aggregationOptions.allowDiskUse = APP_CONFIG.PERFORMANCE.AGGREGATION.ALLOW_DISK_USE;
    }

    const results = await EmployeeProfile!.aggregate(pipeline, aggregationOptions);

    // Apply pagination with configurable limits
    const totalRows = results.length;
    const pageSize = Math.min(pagination.pageSize || APP_CONFIG.API.PAGINATION.DEFAULT_PAGE_SIZE, 
                             APP_CONFIG.API.PAGINATION.MAX_PAGE_SIZE);
    const currentPage = Math.max(pagination.page || APP_CONFIG.API.PAGINATION.DEFAULT_PAGE, 1);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Add frequency data if requested and feature is enabled
    if (frequency && 
        paginatedResults.length > 0 && 
        APP_CONFIG.FEATURES.FREQUENCY_DATA &&
        APP_CONFIG.API.FREQUENCY.VALID_OPTIONS.includes(frequency)) {
      
      for (const row of paginatedResults) {
        if (frequency === 'week' || frequency === 'month') {
          // Build frequency match conditions using configuration
          let frequencyMatchConditions: any = {
            upload_date: { $gte: startDate, $lte: endDate }
          };
          
          // Add account filter based on configuration
          if (shouldFilterByAccount) {
            frequencyMatchConditions.account_id = new mongoose.Types.ObjectId(accountId!);
          }
          
          const frequencyData = await VideoUploadActivity!.aggregate([
            {
              $match: frequencyMatchConditions
            },
            {
              $lookup: {
                from: APP_CONFIG.DATABASE.COLLECTIONS.EMPLOYEE_ATTRIBUTE_VALUES,
                let: { empId: '$employee_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$employee_id', '$$empId'] },
                      attribute_id: { $in: groupByAttributes.map(attr => attr._id) },
                      value: row.groupValue
                    }
                  }
                ],
                as: 'attrMatch'
              }
            },
            {
              $match: {
                attrMatch: { $ne: [] }
              }
            },
            {
              $group: {
                _id: frequency === 'week' ? 
                  {
                    year: { $year: '$upload_date' },
                    week: { $week: '$upload_date' }
                  } :
                  {
                    year: { $year: '$upload_date' },
                    month: { $month: '$upload_date' }
                  },
                videos: { $sum: 1 }
              }
            },
            {
              $project: {
                t: frequency === 'week' ?
                  {
                    $concat: [
                      { $toString: '$_id.year' },
                      '-W',
                      { $toString: '$_id.week' }
                    ]
                  } :
                  {
                    $concat: [
                      { $toString: '$_id.year' },
                      '-',
                      { $toString: '$_id.month' }
                    ]
                  },
                videos: 1
              }
            },
            { $sort: { '_id.year': 1, [`_id.${frequency === 'week' ? 'week' : 'month'}`]: 1 } }
          ]);

          row.frequency = frequencyData.map((f: any) => ({
            t: f.t,
            videos: f.videos
          }));
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        window: { start, end },
        groupBy: { attributeName: combinedAttributeName, position: effectiveGroupBy },
        filtersApplied: filters,
        rows: paginatedResults,
        page: currentPage,
        pageSize: pageSize,
        totalRows
      }
    });

  } catch (error) {
    console.error('Error generating aggregate report:', error);
    return NextResponse.json(
      { success: false, error: APP_CONFIG.ERRORS.SERVER.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
