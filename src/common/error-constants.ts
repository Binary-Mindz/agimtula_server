export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource Management
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Business Logic
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Payment & Subscription
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUBSCRIPTION_ERROR: 'SUBSCRIPTION_ERROR',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
  PLAN_NOT_FOUND: 'PLAN_NOT_FOUND',
  ALREADY_SUBSCRIBED: 'ALREADY_SUBSCRIBED',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  MAINTENANCE_MODE: 'MAINTENANCE_MODE',
  
  // File Operations
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Email & Communication
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  INVALID_EMAIL: 'INVALID_EMAIL',
  SMS_SEND_FAILED: 'SMS_SEND_FAILED',
  
  // IMAP & Email Processing
  IMAP_CONNECTION_FAILED: 'IMAP_CONNECTION_FAILED',
  EMAIL_PROCESSING_FAILED: 'EMAIL_PROCESSING_FAILED',
  INVALID_EMAIL_CONFIG: 'INVALID_EMAIL_CONFIG',
} as const;

export const ERROR_MESSAGES = {
  // Authentication & Authorization
  [ERROR_CODES.UNAUTHORIZED]: 'Access denied. Please authenticate.',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid username or password.',
  [ERROR_CODES.TOKEN_EXPIRED]: 'Your session has expired. Please login again.',
  [ERROR_CODES.INVALID_TOKEN]: 'Invalid authentication token.',
  
  // Validation
  [ERROR_CODES.VALIDATION_ERROR]: 'The provided data is invalid.',
  [ERROR_CODES.INVALID_INPUT]: 'Invalid input provided.',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing.',
  [ERROR_CODES.INVALID_FORMAT]: 'Invalid data format.',
  
  // Resource Management
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.ALREADY_EXISTS]: 'Resource already exists.',
  [ERROR_CODES.CONFLICT]: 'Resource conflict occurred.',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'Duplicate entry detected.',
  
  // Business Logic
  [ERROR_CODES.BUSINESS_LOGIC_ERROR]: 'Business rule violation.',
  [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this operation.',
  [ERROR_CODES.OPERATION_NOT_ALLOWED]: 'Operation not allowed in current state.',
  [ERROR_CODES.QUOTA_EXCEEDED]: 'Usage quota exceeded.',
  
  // Payment & Subscription
  [ERROR_CODES.PAYMENT_ERROR]: 'Payment processing error occurred.',
  [ERROR_CODES.PAYMENT_FAILED]: 'Payment failed. Please try again.',
  [ERROR_CODES.SUBSCRIPTION_ERROR]: 'Subscription operation failed.',
  [ERROR_CODES.SUBSCRIPTION_EXPIRED]: 'Your subscription has expired.',
  [ERROR_CODES.SUBSCRIPTION_NOT_FOUND]: 'Subscription not found.',
  [ERROR_CODES.PLAN_NOT_FOUND]: 'Subscription plan not found.',
  [ERROR_CODES.ALREADY_SUBSCRIBED]: 'You already have an active subscription.',
  
  // Database
  [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed.',
  [ERROR_CODES.CONNECTION_ERROR]: 'Database connection error.',
  [ERROR_CODES.TRANSACTION_FAILED]: 'Database transaction failed.',
  
  // External Services
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error.',
  [ERROR_CODES.API_ERROR]: 'API request failed.',
  [ERROR_CODES.NETWORK_ERROR]: 'Network connection error.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'Request timeout.',
  
  // System
  [ERROR_CODES.INTERNAL_ERROR]: 'An internal error occurred.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable.',
  [ERROR_CODES.RATE_LIMIT_ERROR]: 'Rate limit exceeded. Please try again later.',
  [ERROR_CODES.MAINTENANCE_MODE]: 'System is under maintenance.',
  
  // File Operations
  [ERROR_CODES.FILE_NOT_FOUND]: 'File not found.',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds the limit.',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Invalid file type.',
  [ERROR_CODES.UPLOAD_FAILED]: 'File upload failed.',
  
  // Email & Communication
  [ERROR_CODES.EMAIL_SEND_FAILED]: 'Failed to send email.',
  [ERROR_CODES.INVALID_EMAIL]: 'Invalid email address.',
  [ERROR_CODES.SMS_SEND_FAILED]: 'Failed to send SMS.',
  
  // IMAP & Email Processing
  [ERROR_CODES.IMAP_CONNECTION_FAILED]: 'IMAP connection failed.',
  [ERROR_CODES.EMAIL_PROCESSING_FAILED]: 'Email processing failed.',
  [ERROR_CODES.INVALID_EMAIL_CONFIG]: 'Invalid email configuration.',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;