import { Platform } from 'react-native';

import { updateDevice } from '@/lib/api';

// ---------------------------------------------------------------------------
// Push notifications — STRETCH GOAL, client-side stub.
//
// The backend alert endpoint does not exist yet. This registers for a push
// token and pushes it to the device record via PATCH /api/admin/devices so the
// backend can deliver AQI threshold alerts (>100, >150, >200) and an 8am
// morning briefing once those server features ship.
// ---------------------------------------------------------------------------

export const AQI_ALERT_THRESHOLDS = [100, 150, 200];

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const Notifications = await import('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== Notifications.PermissionStatus.GRANTED) {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== Notifications.PermissionStatus.GRANTED) return null;
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

// Schedule a local morning briefing reminder at 8am (until backend push lands).
export async function scheduleMorningBriefing(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Bair1 morning briefing',
        body: 'Your daily air-quality summary is ready.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    });
    return true;
  } catch {
    return false;
  }
}

// Push the obtained token to the backend device record (PATCH).
export async function syncPushToken(
  authToken: string,
  deviceId: string,
  pushToken: string,
): Promise<void> {
  await updateDevice(authToken, { deviceId, pushToken });
}
