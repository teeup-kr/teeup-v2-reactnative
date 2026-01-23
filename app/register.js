
import {
  FontAwesome
} from '@expo/vector-icons';
import {
  LinearGradient
} from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { authorize } from 'react-native-app-auth';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { googleAuthConfig } from '@/constants/authConstants';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api/api';
import { tokenStorage } from '@/lib/tokenStorage';
import {
  buildGoogleAuthConfig,
  buildGoogleAuthPayload,
  buildGoogleAuthorizeUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOauthState
} from '@/lib/util/authUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';



const logoImage = require('../public/icons/icon-512-transparent.png');

export default function RegisterScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [errors, setErrors] = useState({
    general: '',
  });
  const [isGoogleSigningUp, setIsGoogleSigningUp] = useState(false);

  const signUpWithGoogle = async () => {
    console.log('Starting Google Sign-Up process...');
    console.log('Google Auth Config:', googleAuthConfig);
    setErrors((prev) => ({ ...prev, general: '' }));
    setIsGoogleSigningUp(true);

    if (!googleAuthConfig.clientId || !googleAuthConfig.redirectUrl) {
      setErrors((prev) => ({
        ...prev,
        general: 'Google 로그인 설정(clientId/redirectUrl)이 누락되었습니다.',
      }));
      setIsGoogleSigningUp(false);
      return;
    }

    const shouldClearState = Platform.OS !== 'web';

    try {
      const oauthState = generateOauthState();
      await tokenStorage.setOauthState(oauthState);

      // Web 플랫폼에서는 별도의 브라우저 리디렉션 처리
      if (Platform.OS === 'web') {
        const oauthState = generateOauthState();

        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        await tokenStorage.setOauthState(oauthState);
        await tokenStorage.setCodeVerifier(codeVerifier);

        const authUrl = buildGoogleAuthorizeUrl({
          state: oauthState,
          codeChallenge,
          codeChallengeMethod: 'S256',
        });

        window.location.assign(authUrl);
        return;
      }

      // Native 플랫폼에서는 react-native-app-auth 사용
      const authState = await authorize(buildGoogleAuthConfig(oauthState));

      const payload = buildGoogleAuthPayload(authState, oauthState);

      console.log('!!! Google Sign-Up Payload: !!! \n', payload);

      await authApi.googleLogin(payload);
      await refreshAuth();
      router.replace('/');
    } catch (error) {
      console.error('Google 회원가입 에러:', error);
      const message = error?.message || 'Google 회원가입에 실패했습니다.';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      if (shouldClearState) {
        await tokenStorage.clearOauthState();
      }
      setIsGoogleSigningUp(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[colors.primary[50], colors.secondary[50]]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Card style={styles.card}>
              <View style={styles.brandSection}>
                <View style={styles.logoWrap}>
                  <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.pageTitle}>회원가입</Text>
                <Text style={styles.pageSubtitle}>Google 계정으로 간편하게 가입하세요</Text>
              </View>

              {errors.general ? (
                <Text style={styles.generalError}>{errors.general}</Text>
              ) : null}

              <Button
                variant="primary"
                size="lg"
                onPress={signUpWithGoogle}
                loading={isGoogleSigningUp}
                disabled={isGoogleSigningUp}
                style={styles.buttonSpacing}
              >
                <FontAwesome name="google" size={16} color={colors.white} style={styles.iconGap} />
                <Text style={styles.primaryButtonText}>Google로 회원가입</Text>
              </Button>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
                <Pressable onPress={() => router.replace('/login')}>
                  <Text style={styles.loginLink}>로그인</Text>
                </Pressable>
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaPrimary,
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.padding.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: tokens.padding.xl,
    paddingVertical: tokens.padding.xl2,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg2,
  },
  logoWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  logo: {
    width: 48,
    height: 48,
  },
  pageTitle: {
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  pageSubtitle: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.md3,
  },
  generalError: {
    textAlign: 'center',
    color: colors.error[600],
    fontSize: tokens.font.sm,
    marginBottom: tokens.spacing.sm2,
  },
  buttonSpacing: {
    marginTop: tokens.spacing.md,
  },
  iconGap: {
    marginRight: tokens.spacing.xs2,
  },
  primaryButtonText: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.white,
  },
  loginRow: {
    marginTop: tokens.spacing.md3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  loginLink: {
    fontSize: tokens.font.sm,
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
    marginLeft: tokens.spacing.xs,
  },
});
