import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { colors } from '../src/theme/colors';
import { AuthProvider } from '../src/context/AuthContext';
import { AppLayoutProvider } from '../src/context/AppLayoutContext';
import BottomNavigationBar, { bottomNavHeight } from '../src/components/layout/BottomNavigationBar';
import FullMenu from '../src/components/layout/FullMenu';

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
