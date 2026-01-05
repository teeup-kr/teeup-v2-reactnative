import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { colors } from '../src/theme/colors';

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
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
