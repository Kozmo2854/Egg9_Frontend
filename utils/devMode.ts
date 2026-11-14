/**
 * Development mode utilities
 * Controls visibility of dev/testing features
 */

/**
 * Check if app is running in development mode
 * Fail-closed: only true in a React Native dev/debug build (__DEV__),
 * never in a production/release build regardless of env vars.
 */
declare const __DEV__: boolean;

export const isDevMode = (): boolean => {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
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

