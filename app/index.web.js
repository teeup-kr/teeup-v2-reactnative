import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppFooter from '@/components/layout/AppFooter';
import { useAuth } from '@/context/AuthContext';
import { navigateWithCap } from '@/lib/navigation/cappedHistory';
import { signInWithGoogle } from '@/lib/util/authUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const logoImage = require('../public/icons/icon-512-transparent.png');

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, refreshAuth } = useAuth();
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const [googleLoginError, setGoogleLoginError] = useState('');

  const handleGoogleSignIn = async () => {
    if (isGoogleRedirecting) return;

    await signInWithGoogle({
      refreshAuth,
      router,
      setLoading: setIsGoogleRedirecting,
      setErrorMessage: setGoogleLoginError,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>로그인 상태를 확인하고 있습니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/app" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[colors.emerald[600], colors.teal[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.logoWrap}>
          <Image source={logoImage} style={styles.logo} resizeMode="cover" />
        </View>
        <Text style={styles.brand}>티업링크</Text>
        <Text style={styles.headline}>골프 모임 관리의{'\n'}새로운 경험</Text>
        <Text style={styles.subcopy}>
          자동 조편성, 정산, 공지까지{'\n'}한 번에 관리하세요.
        </Text>
        <View style={styles.ctaRow}>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.primaryButton,
              styles.buttonInteractive,
              hovered && styles.buttonHovered,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleRedirecting}
          >
            <View style={styles.primaryButtonContent}>
              <FontAwesome name="google" size={16} color={colors.emerald[700]} style={styles.primaryButtonIcon} />
              <Text style={styles.primaryButtonText}>
                {isGoogleRedirecting ? 'Google 로그인으로 이동 중...' : 'Google로 로그인'}
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={({ pressed, hovered }) => [
              styles.secondaryButton,
              styles.buttonInteractive,
              hovered && styles.buttonHovered,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={() => navigateWithCap(router, '/app')}
          >
            <Text style={styles.secondaryButtonText}>서비스 둘러보기</Text>
          </Pressable>
          {googleLoginError ? <Text style={styles.errorText}>{googleLoginError}</Text> : null}
        </View>
      </LinearGradient>
      <View style={styles.footerWrap}>
        <AppFooter />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaWhite,
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm2,
  },
  loadingText: {
    color: colors.neutral[600],
    fontSize: tokens.font.sm,
  },
  hero: {
    flex: 1,
    width: '100%',
    paddingHorizontal: tokens.padding.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: tokens.radius.xxl,
    backgroundColor: 'rgb(255, 255, 255)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  brand: {
    color: colors.white,
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing.sm2,
  },
  headline: {
    color: colors.white,
    fontSize: tokens.font.xxl,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing.sm2,
  },
  subcopy: {
    color: colors.emerald[100],
    fontSize: tokens.font.base,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: tokens.spacing.lg2,
  },
  ctaRow: {
    width: '100%',
    maxWidth: 340,
    gap: tokens.spacing.sm2,
  },
  buttonInteractive: {
    transitionProperty: 'transform, box-shadow, opacity',
    transitionDuration: '100ms',
    transitionTimingFunction: 'ease',
  },
  buttonHovered: {
    transform: [{ translateY: -1 }],
    boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.18)',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.padding.baseLg,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonIcon: {
    marginRight: tokens.spacing.xs2,
  },
  primaryButtonText: {
    color: colors.emerald[700],
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.padding.baseLg,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
  },
  errorText: {
    color: colors.white,
    fontSize: tokens.font.sm,
    textAlign: 'center',
  },
  footerWrap: {
    width: '100%',
    maxWidth: tokens.layout.maxWidth,
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
});
