import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const [googleLoginError, setGoogleLoginError] = useState('');

  // const handleGoogleLogin = async () => {
  //   if (isGoogleRedirecting) return;
  //   setGoogleLoginError('');
  //   setIsGoogleRedirecting(true);

  //   if (!googleAuthConfig.clientId || !googleAuthConfig.redirectUrl) {
  //     setGoogleLoginError('Google 로그인 설정(clientId/redirectUrl)이 누락되었습니다.');
  //     setIsGoogleRedirecting(false);
  //     return;
  //   }

  //   try {
  //     const oauthState = generateOauthState();
  //     const codeVerifier = generateCodeVerifier();
  //     const codeChallenge = await generateCodeChallenge(codeVerifier);

  //     await tokenStorage.setOauthState(oauthState);
  //     await tokenStorage.setCodeVerifier(codeVerifier);

  //     const authUrl = buildGoogleAuthorizeUrl({
  //       state: oauthState,
  //       codeChallenge,
  //       codeChallengeMethod: 'S256',
  //     });

  //     window.location.assign(authUrl);
  //   } catch (error) {
  //     setGoogleLoginError(error?.message || 'Google 로그인 연결에 실패했습니다.');
  //     setIsGoogleRedirecting(false);
  //   }
  // };

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
        <Text style={styles.brand}>티업링크</Text>
        <Text style={styles.headline}>골프 모임 관리의{'\n'}새로운 경험</Text>
        <Text style={styles.subcopy}>
          자동 조편성, 정산, 공지까지{'\n'}한 번에 관리하세요.
        </Text>
        <View style={styles.ctaRow}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            onPress={signInWithGoogle}
          >
            <Text style={styles.primaryButtonText}>
              {isGoogleRedirecting ? 'Google 로그인으로 이동 중...' : 'Google로 로그인'}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={() => router.push('/app')}
          >
            <Text style={styles.secondaryButtonText}>서비스 둘러보기</Text>
          </Pressable>
          {googleLoginError ? <Text style={styles.errorText}>{googleLoginError}</Text> : null}
        </View>
      </LinearGradient>
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
    paddingHorizontal: tokens.padding.xl,
    justifyContent: 'center',
    alignItems: 'center',
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
  primaryButton: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.padding.baseLg,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
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
});
