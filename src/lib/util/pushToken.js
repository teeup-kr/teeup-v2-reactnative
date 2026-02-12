import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function getNativePushToken() {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    return tokenResponse?.data || null;
  } catch (error) {
    console.warn('FCM 토큰 조회 실패:', error?.message || error);
    return null;
  }
}
