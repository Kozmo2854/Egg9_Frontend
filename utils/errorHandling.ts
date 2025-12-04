/**
 * Centralized error handling utilities
 * Provides user-friendly error messages for common scenarios
 */

// Error types for categorization
export type ErrorType = 
  | 'network'
  | 'auth'
  | 'validation'
  | 'not_found'
  | 'server'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
}

/**
 * User-friendly error messages by type
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: 'Unable to connect. Please check your internet connection and try again.',
  auth: 'Your session has expired. Please log in again.',
  validation: 'Please check your input and try again.',
  not_found: 'The requested item was not found.',
  server: 'Something went wrong on our end. Please try again later.',
  unknown: 'An unexpected error occurred. Please try again.',
};

/**
 * Specific error messages for common actions
 */
export const ACTION_ERROR_MESSAGES = {
  // Data loading
  loadData: 'Unable to load data. Pull down to refresh.',
  loadOrders: 'Unable to load orders. Please try again.',
  loadSubscription: 'Unable to load subscription details.',
  loadWeeklyStock: 'Unable to load weekly stock information.',
  
  // Order actions
  placeOrder: 'Unable to place order. Please try again.',
  updateOrder: 'Unable to update order. Please try again.',
  cancelOrder: 'Unable to cancel order. Please try again.',
  
  // Subscription actions
  createSubscription: 'Unable to create subscription. Please try again.',
  cancelSubscription: 'Unable to cancel subscription. Please try again.',
  
  // Payment actions
  markPayment: 'Unable to submit payment. Please try again.',
  confirmPayment: 'Unable to confirm payment. Please try again.',
  
  // Admin actions
  updateStock: 'Unable to update stock. Please try again.',
  updateDelivery: 'Unable to update delivery schedule. Please try again.',
  markDelivered: 'Unable to mark orders as delivered. Please try again.',
  
  // Auth actions
  login: 'Invalid email or password. Please try again.',
  register: 'Unable to create account. Please check your details.',
  logout: 'Unable to log out. Please try again.',
};

/**
 * Parse an error and return a user-friendly AppError
 */
export function parseError(error: any, action?: keyof typeof ACTION_ERROR_MESSAGES): AppError {
  // Check for specific action message first
  if (action && ACTION_ERROR_MESSAGES[action]) {
    return {
      type: getErrorType(error),
      message: ACTION_ERROR_MESSAGES[action],
      originalError: error,
    };
  }

  // Network errors
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return {
      type: 'network',
      message: ERROR_MESSAGES.network,
      originalError: error,
    };
  }

  // Check status codes
  if (error.statusCode) {
    switch (error.statusCode) {
      case 401:
        return {
          type: 'auth',
          message: ERROR_MESSAGES.auth,
          originalError: error,
        };
      case 404:
        return {
          type: 'not_found',
          message: ERROR_MESSAGES.not_found,
          originalError: error,
        };
      case 422:
        // Validation error - try to get specific message
        const validationMessage = error.data?.message || error.data?.errors?.[0]?.message;
        return {
          type: 'validation',
          message: validationMessage || ERROR_MESSAGES.validation,
          originalError: error,
        };
      case 500:
      case 502:
      case 503:
        return {
          type: 'server',
          message: ERROR_MESSAGES.server,
          originalError: error,
        };
    }
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: error.message || ERROR_MESSAGES.unknown,
    originalError: error,
  };
}

/**
 * Get error type from error object
 */
function getErrorType(error: any): ErrorType {
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return 'network';
  }
  
  switch (error.statusCode) {
    case 401: return 'auth';
    case 404: return 'not_found';
    case 422: return 'validation';
    case 500:
    case 502:
    case 503: return 'server';
    default: return 'unknown';
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error.message?.includes('Network') ||
    error.message?.includes('fetch') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('network')
  );
}

/**
 * Get user-friendly message for error type
 */
export function getErrorMessage(type: ErrorType): string {
  return ERROR_MESSAGES[type];
}

/**
 * Format validation errors from API response
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  const messages = Object.values(errors).flat();
  return messages.join('\n');
}

