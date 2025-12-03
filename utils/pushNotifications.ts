import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiService } from '@/services/api';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Register for push notifications and send token to backend
 * Should be called after user logs in
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Determine device type
    const deviceType = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    // Register token with backend
    await apiService.registerPushToken(token.data, deviceType);

    console.log('Push token registered:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Unregister push notifications (call on logout)
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await apiService.unregisterPushToken();
    console.log('Push token unregistered');
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
  }
}

/**
 * Add a listener for when a notification is received while app is foregrounded
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when user interacts with a notification
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

