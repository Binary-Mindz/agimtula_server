export interface ErrorResponse {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  data?: any;
}

export class ErrorResponseUtil {
  static createErrorResponse(
    message: string,
    statusCode: number = 400,
    path?: string,
    data?: any
  ): ErrorResponse {
    return {
      success: false,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path,
      data,
    };
  }

  static createSuccessResponse(
    message: string,
    data?: any,
    statusCode: number = 200
  ) {
    return {
      success: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  // Common error messages in both English and Bangla-friendly format
  static readonly MESSAGES = {
    // Payment related
    PAYMENT_FAILED: 'Payment processing failed',
    PLAN_NOT_FOUND: 'Subscription plan not found',
    PLAN_INACTIVE: 'Selected plan is not available',
    PRICING_NOT_FOUND: 'Pricing information not available',
    ALREADY_SUBSCRIBED: 'You already have an active subscription',
    PAYMENT_CONFIG_ERROR: 'Payment system configuration error',
    STRIPE_ERROR: 'Payment gateway error',
    
    // General errors
    VALIDATION_ERROR: 'Invalid data provided',
    NOT_FOUND: 'Requested resource not found',
    UNAUTHORIZED: 'Access denied',
    FORBIDDEN: 'You do not have permission',
    CONFLICT: 'Resource already exists',
    DATABASE_ERROR: 'Database operation failed',
    INTERNAL_ERROR: 'Something went wrong',
    
    // Success messages
    PAYMENT_SUCCESS: 'Payment processed successfully',
    PLAN_PURCHASED: 'Subscription plan purchased successfully',
    PLAN_UPGRADED: 'Plan upgraded successfully',
    DATA_RETRIEVED: 'Data retrieved successfully',
    OPERATION_SUCCESS: 'Operation completed successfully',
  };
}