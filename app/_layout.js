
import * as NavigationBar from 'expo-navigation-bar';
import {
  Slot
} from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNavigationBar, { bottomNavHeight } from '@/components/layout/BottomNavigationBar';
import FullMenu from '@/components/layout/FullMenu';
import { AppLayoutProvider } from '@/context/AppLayoutContext';
import { AuthProvider } from '@/context/AuthContext';
import { colors } from '@/styles/colors';
function AppShell() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.shell, { paddingBottom: bottomNavHeight(insets) }]}>
        <View style={styles.main}>
          <Slot />
        </View>
      </View>
      <BottomNavigationBar />
      <FullMenu />
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