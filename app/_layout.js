
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import {
  Slot,
  usePathname,
  useRouter
} from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import DebugConsoleOverlay from '@/components/debug/DebugConsoleOverlay';
import BottomNavigationBar, { bottomNavHeight } from '@/components/layout/BottomNavigationBar';
import FullMenu from '@/components/layout/FullMenu';
import { AppLayoutProvider } from '@/context/AppLayoutContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api/api';
import { colors } from '@/styles/colors';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function getNotificationRoute(data = {}) {
  const category = data?.category || data?.type || data?.notification_type;
  const targetId = data?.target_id || data?.targetId || data?.id;
  const meetingType = data?.meeting_type || data?.meetingType;
  const clubId = data?.club_id || data?.clubId;

  if (category === 'meeting' && targetId) {
    const slug = meetingType === 'social' ? 'social' : 'rounding';
    return `/meetings/${slug}/${targetId}`;
  }

  // 선택한 알림 카테고리에 따라 라우팅 경로 반환
  if (category === 'meeting_rounding' && targetId) return `/meetings/rounding/${targetId}`;
  if (category === 'meeting_social' && targetId) return `/meetings/social/${targetId}`;
  if (category === 'club' && targetId) return `/clubs/${targetId}`;
  if (category === 'club_notice' && clubId) return `/clubs/${clubId}/notices`;
  if (category === 'notice' && targetId) return `/notices/${targetId}`;

  return null;
}

function routeByNotification(router, notification) {
  const data = notification?.request?.content?.data;
  if (!data || typeof data !== 'object') return;
  const route = getNotificationRoute(data);
  if (!route) return;
  router.push(route);
}

async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: '기본',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function ensureNotificationPermission() {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return Boolean(requested.granted);
}

function AppShell() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const handledNotificationIdsRef = useRef(new Set());
  const isRootEntry = pathname === '/';

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    if (isLoading || !isAuthenticated) return undefined;

    let isUnmounted = false;

    const handleRouteOnce = (notification) => {
      const identifier = notification?.request?.identifier;
      if (!identifier) {
        routeByNotification(router, notification);
        return;
      }

      if (handledNotificationIdsRef.current.has(identifier)) return;
      handledNotificationIdsRef.current.add(identifier);
      routeByNotification(router, notification);
    };

    const setup = async () => {
      try {
        await setupNotificationChannel();
        const granted = await ensureNotificationPermission();
        await authApi.syncPushToken({ enabled: true });
        if (!granted || isUnmounted) return;

        const initialResponse = await Notifications.getLastNotificationResponseAsync();
        if (initialResponse?.notification && !isUnmounted) {
          handleRouteOnce(initialResponse.notification);
        }
      } catch (error) {
        console.warn('알림 초기화 실패:', error?.message || error);
      }
    };

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification?.request?.content?.data;
      console.log('[Push Received]', data);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handleRouteOnce(response?.notification);
    });

    setup();

    return () => {
      isUnmounted = true;
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [isAuthenticated, isLoading, router]);

  return (
    <View style={styles.root}>
      <View style={[styles.shell, { paddingBottom: isRootEntry ? 0 : bottomNavHeight(insets) }]}>
        <View style={styles.main}>
          <Slot />
        </View>
      </View>
      {!isRootEntry ? <BottomNavigationBar /> : null}
      {!isRootEntry ? <FullMenu /> : null}
      {/* !!!!!!!!!!!!!!!!!!!!! 디버그 오버레이 TODO 출시시 삭제 !!!!!!!!!!!!!!!!!!!!!! */}
      <DebugConsoleOverlay />
      {/* !!!!!!!!!!!!!!!!!!!!! 디버그 오버레이 !!!!!!!!!!!!!!!!!!!!!! */}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setPositionAsync('relative');
      NavigationBar.setBackgroundColorAsync(colors.white);
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  return (
    <SafeAreaProvider>
      {/* 2. 웹 PWA를 위한 Head 설정 추가 */}
      <Head>
        <title>TeeUp</title>
        <link rel="manifest" href="/manifest.json" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TeeUp" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>

      <StatusBar style="dark" backgroundColor={colors.white} />
      <AuthProvider>
        <AppLayoutProvider>
          <AppShell />
        </AppLayoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  shell: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  main: {
    flex: 1,
  },
});
