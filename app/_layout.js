import * as NavigationBar from 'expo-navigation-bar';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomNavigationBar, { bottomNavHeight } from '@/components/layout/BottomNavigationBar';
import FullMenu from '@/components/layout/FullMenu';
import { AppLayoutProvider } from '@/context/AppLayoutContext';
import { AuthProvider } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

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
