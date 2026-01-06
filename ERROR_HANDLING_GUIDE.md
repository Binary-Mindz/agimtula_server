# Error Handling Guide

## Overview
This project now has comprehensive error handling with:
- Custom exception classes
- Proper error messages (user-friendly)
- Consistent error responses
- No detailed Prisma errors exposed

## Custom Exceptions

### Available Exception Classes:
```typescript
import { 
  NotFoundAppException, 
  ValidationException, 
  PaymentException, 
  ConflictAppException,
  UnauthorizedAppException,
  ForbiddenAppException,
  DatabaseException
} from 'src/common/app-exceptions';
```

### Usage Examples:

#### 1. Not Found Errors
```typescript
if (!user) {
  throw new NotFoundAppException('User not found');
}
```

#### 2. Validation Errors
```typescript
if (!email || !password) {
  throw new ValidationException('Email and password are required');
}
```

#### 3. Conflict Errors
```typescript
if (existingUser) {
  throw new ConflictAppException('User already exists');
}
```

#### 4. Payment Errors
```typescript
if (paymentFailed) {
  throw new PaymentException('Payment processing failed');
}
```

## Service Pattern

### Before (Bad):
```typescript
async createUser(data) {
  try {
    // ... logic
    return cResponseData({ message: 'Success', data: user });
  } catch (error) {
    return cResponseData({ message: error.message, error: true });
  }
}
```

### After (Good):
```typescript
async createUser(data) {
  // Validation
  if (!data.email) {
    throw new ValidationException('Email is required');
  }

  // Check existing
  const existing = await this.prisma.user.findUnique({
    where: { email: data.email }
  });
  
  if (existing) {
    throw new ConflictAppException('User already exists');
  }

  // Create user
  const user = await this.prisma.user.create({ data });
  
  return {
    message: 'User created successfully',
    data: user
  };
}
```

## Error Messages

### Use Clear, User-Friendly Messages:
- ✅ "Subscription plan not found"
- ❌ "Invalid subscription plan ID provided in request"

- ✅ "You already have an active subscription"
- ❌ "Duplicate subscription detected for user ID"

- ✅ "Payment processing failed"
- ❌ "Stripe API returned error code 402"

## Controller Pattern

Controllers should NOT catch exceptions - let global filters handle them:

```typescript
@Post()
async createUser(@Body() dto: CreateUserDto) {
  // No try-catch needed - exceptions will be handled globally
  return this.userService.createUser(dto);
}
```

## Global Exception Filters

The application has 3 levels of exception handling:
1. **PrismaExceptionFilter** - Handles database errors
2. **PrismaValidationExceptionFilter** - Handles validation errors  
3. **HttpExceptionFilter** - Handles all other HTTP exceptions

## Response Format

All errors return consistent format:
```json
{
  "statusCode": 400,
  "message": "User-friendly error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

## Files Updated

1. **src/common/app-exceptions.ts** - Custom exception classes
2. **src/common/error-response.util.ts** - Error response utilities
3. **src/main.ts** - Global exception filter setup
4. **src/user-dashboard/payment/payment.service.ts** - Example implementation

## Migration Steps

For each service file:
1. Import custom exceptions
2. Replace BadRequestException with appropriate custom exception
3. Remove try-catch blocks that return cResponseData with errors
4. Use clear, user-friendly error messages
5. Let exceptions bubble up to global filters