// Application Configuration
export const APP_CONFIG = {
  // Authentication & Authorization
  AUTH: {
    // Admin roles that have cross-account access
    ADMIN_ROLES: ['CORPORATE_ADMIN', 'ADMIN'],
    
    // Regular user roles restricted to own account
    USER_ROLES: ['CORPORATE_USER', 'EMPLOYEE'],
    
    // JWT Configuration
    JWT: {
      SECRET: process.env.JWT_SECRET || 'development-secret-change-in-production',
      EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      ALGORITHM: 'HS256'
    },
    
    // Token validation settings
    TOKEN: {
      REQUIRED_CLAIMS: ['corporateAccountId', 'role', 'userId'],
      OPTIONAL_CLAIMS: ['exp', 'iat']
    }
  },

  // Database Configuration
  DATABASE: {
    // MongoDB Connection
    URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro',
    
    // Collection names (avoiding hardcoded strings)
    COLLECTIONS: {
      USERS: 'users',
      EMPLOYEE_PROFILES: 'employeeprofiles',
      EMPLOYEE_ATTRIBUTE_VALUES: 'employeeattributevalues',
      CUSTOM_ATTRIBUTE_DEFINITIONS: 'customattributedefinitions',
      LESSON_ACTIVITIES: 'lessonactivities',
      VIDEO_UPLOAD_ACTIVITIES: 'videouploadactivities',
      EMPLOYEE_SCORE_HISTORIES: 'employeescorehistories',
      CORPORATE_ACCOUNTS: 'corporateaccounts'
    }
  },

  // API Configuration
  API: {
    // Default pagination settings
    PAGINATION: {
      DEFAULT_PAGE: 1,
      DEFAULT_PAGE_SIZE: 50,
      MAX_PAGE_SIZE: 1000
    },
    
    // Sorting options
    SORT: {
      DEFAULT_FIELD: 'avgScore',
      DEFAULT_DIRECTION: 'desc',
      VALID_FIELDS: ['avgScore', 'videos', 'lessons', 'timeSpent', 'improvement'],
      VALID_DIRECTIONS: ['asc', 'desc']
    },
    
    // Grouping options
    GROUP_BY: {
      VALID_POSITIONS: ['position1', 'position2', 'position3', 'position4'],
      POSITION_REGEX: /^position([1-4])$/
    },
    
    // Metrics configuration
    METRICS: {
      DEFAULT: ['avgScore', 'videos', 'lessons', 'timeSpent', 'improvement'],
      AVAILABLE: ['avgScore', 'videos', 'lessons', 'timeSpent', 'improvement', 'headcount']
    },
    
    // Frequency options
    FREQUENCY: {
      VALID_OPTIONS: ['week', 'month'],
      DATE_FORMATS: {
        WEEK: 'YYYY-[W]WW',
        MONTH: 'YYYY-MM'
      }
    }
  },

  // Security Configuration
  SECURITY: {
    // Account access control
    ACCESS_CONTROL: {
      // If true, admins can access all accounts when accountId is null
      ADMIN_GLOBAL_ACCESS: process.env.ADMIN_GLOBAL_ACCESS === 'true',
      
      // If true, strict validation of account boundaries
      STRICT_ACCOUNT_ISOLATION: process.env.STRICT_ACCOUNT_ISOLATION !== 'false'
    },
    
    // CORS settings
    CORS: {
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      ALLOWED_HEADERS: ['Content-Type', 'Authorization']
    }
  },

  // Error Messages
  ERRORS: {
    AUTH: {
      TOKEN_REQUIRED: 'Authorization token required',
      INVALID_TOKEN: 'Invalid token',
      MISSING_ACCOUNT_ID: 'Invalid token: missing account ID',
      ACCESS_DENIED: 'Access denied: cannot access different account',
      INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this operation'
    },
    
    VALIDATION: {
      REQUIRED_FIELDS: 'Start date, end date, and groupBy are required',
      INVALID_DATE_FORMAT: 'Invalid date format',
      INVALID_GROUP_BY: 'Invalid groupBy value. Must be position1, position2, position3, or position4',
      ACCOUNT_ID_REQUIRED: 'Account ID required for non-admin users',
      NO_ATTRIBUTES_FOUND: 'No attributes found for specified position'
    },
    
    SERVER: {
      INTERNAL_ERROR: 'Internal server error',
      DATABASE_CONNECTION: 'Database connection failed',
      AGGREGATION_FAILED: 'Failed to execute aggregation query'
    }
  },

  // Feature Flags
  FEATURES: {
    // Enable/disable cross-account access for admins
    ADMIN_CROSS_ACCOUNT_ACCESS: process.env.ENABLE_ADMIN_CROSS_ACCOUNT === 'true',
    
    // Enable/disable frequency data in responses
    FREQUENCY_DATA: process.env.ENABLE_FREQUENCY_DATA !== 'false',
    
    // Enable/disable advanced filtering
    ADVANCED_FILTERING: process.env.ENABLE_ADVANCED_FILTERING !== 'false',
    
    // Enable/disable audit logging
    AUDIT_LOGGING: process.env.ENABLE_AUDIT_LOGGING === 'true'
  },

  // Performance Configuration
  PERFORMANCE: {
    // MongoDB aggregation pipeline settings
    AGGREGATION: {
      MAX_TIME_MS: parseInt(process.env.AGGREGATION_TIMEOUT_MS || '30000'),
      ALLOW_DISK_USE: process.env.AGGREGATION_ALLOW_DISK_USE === 'true'
    },
    
    // Caching settings
    CACHE: {
      TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '300'),
      MAX_ENTRIES: parseInt(process.env.CACHE_MAX_ENTRIES || '1000')
    }
  }
};

// Validation function to ensure all required environment variables are set
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables (only in production)
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET environment variable is required in production');
    }

    if (!process.env.MONGODB_URI) {
      errors.push('MONGODB_URI environment variable is required in production');
    }
  }

  // Validate admin roles
  if (!APP_CONFIG.AUTH.ADMIN_ROLES.length) {
    errors.push('At least one admin role must be configured');
  }

  // Validate pagination limits
  if (APP_CONFIG.API.PAGINATION.MAX_PAGE_SIZE < APP_CONFIG.API.PAGINATION.DEFAULT_PAGE_SIZE) {
    errors.push('MAX_PAGE_SIZE must be greater than or equal to DEFAULT_PAGE_SIZE');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function to check if a role is an admin role
export function isAdminRole(role: string): boolean {
  return APP_CONFIG.AUTH.ADMIN_ROLES.includes(role?.toUpperCase());
}

// Helper function to check if a role is a regular user role
export function isUserRole(role: string): boolean {
  return APP_CONFIG.AUTH.USER_ROLES.includes(role?.toUpperCase());
}

// Helper function to validate groupBy parameter
export function isValidGroupBy(groupBy: string): boolean {
  return APP_CONFIG.API.GROUP_BY.VALID_POSITIONS.includes(groupBy);
}

// Helper function to validate sort parameters
export function isValidSortField(field: string): boolean {
  return APP_CONFIG.API.SORT.VALID_FIELDS.includes(field);
}

export function isValidSortDirection(direction: string): boolean {
  return APP_CONFIG.API.SORT.VALID_DIRECTIONS.includes(direction);
}
