import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const splashLogo = require('../../public/icons/icon-512-transparent.png');
const SPLASH_REDIRECT_DELAY_MS = 180;

export default function NativeEntryScreen() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      router.replace('/app');
    }, SPLASH_REDIRECT_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [router, pathname]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[colors.emerald[600], colors.teal[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.centerWrap}>
          <View style={styles.logoWrap}>
            <Image source={splashLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brand}>티업링크</Text>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.loadingText}>앱을 준비 중입니다...</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaWhite,
  container: {
    flex: 1,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.padding.xl,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: tokens.radius.xxl,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  logo: {
    width: 56,
    height: 56,
  },
  brand: {
    color: colors.white,
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs2,
  },
  loadingText: {
    color: colors.emerald[100],
    fontSize: tokens.font.sm,
  },
});
