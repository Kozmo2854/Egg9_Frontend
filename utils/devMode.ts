/**
 * Development mode utilities
 * Controls visibility of dev/testing features
 */

/**
 * Check if app is running in development mode
 * Based on EXPO_PUBLIC_APP_ENV environment variable
 */
export const isDevMode = (): boolean => {
  return process.env.EXPO_PUBLIC_APP_ENV === 'development';
};

/**
 * Check if app is running in production mode
 */
export const isProdMode = (): boolean => {
  return process.env.EXPO_PUBLIC_APP_ENV === 'production';
};

/**
 * Get current environment name
 */
export const getEnvName = (): string => {
  return process.env.EXPO_PUBLIC_APP_ENV || 'unknown';
};

