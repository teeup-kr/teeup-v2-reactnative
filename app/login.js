
import {
  FontAwesome
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import Input from '@/components/ui/Input';
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

export default function LoginScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // // 웹 플랫폼에서 Google OAuth 처리를 위한 훅
  // useGoogleWebAuthEffect({
  //   refreshAuth,
  //   router,
  //   setErrors,
  //   setIsGoogleSigningIn,
  // });

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general) {
      setErrors((prev) => ({ ...prev, [field]: '', general: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.email.trim()) {
      nextErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.password.trim()) {
      nextErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      nextErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    }

    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({ email: '', password: '', general: '' });
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await authApi.login({
        email: formData.email.trim(),
        password: formData.password,
      });
      await refreshAuth();
      router.replace('/');
    } catch (error) {
      const message = error?.message || '로그인에 실패했습니다.';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInWithGoogle = async () => {
    console.log('Starting Google Sign-In process...');
    console.log('Google Auth Config:', googleAuthConfig);
    setErrors((prev) => ({ ...prev, general: '' }));
    setIsGoogleSigningIn(true);

    if (!googleAuthConfig.clientId || !googleAuthConfig.redirectUrl) {
      setErrors((prev) => ({
        ...prev,
        general: 'Google 로그인 설정(clientId/redirectUrl)이 누락되었습니다.',
      }));
      setIsGoogleSigningIn(false);
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

      console.log('!!! Google Login Payload: !!! \n', payload);

      await authApi.googleLogin(payload);
      await refreshAuth();
      router.replace('/');
    } catch (error) {
      console.error('Google 로그인 에러:', error);
      const message = error?.message || 'Google 로그인에 실패했습니다.';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      if (shouldClearState) {
        await tokenStorage.clearOauthState();
      }
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[colors.primary[50], colors.primary[100]]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.card}>
              <View style={styles.brandSection}>
                <View style={styles.logoWrap}>
                  <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.brandTitle}>티업링크</Text>
                <Text style={styles.brandSubtitle}>골프 모임을 더 쉽고 즐겁게</Text>
              </View>

              <Text style={styles.pageTitle}>로그인</Text>

              <Input
                label="이메일"
                value={formData.email}
                onChangeText={handleInputChange('email')}
                placeholder="이메일을 입력하세요"
                keyboardType="email-address"
                error={errors.email}
                required
              />
              <Input
                label="비밀번호"
                value={formData.password}
                onChangeText={handleInputChange('password')}
                placeholder="비밀번호를 입력하세요"
                secureTextEntry
                error={errors.password}
                required
              />

              {errors.general ? (
                <Text style={styles.generalError}>{errors.general}</Text>
              ) : null}

              <Button
                variant="primary"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleLogin}
                style={styles.buttonSpacing}
              >
                로그인
              </Button>

              <View style={styles.helperRow}>
                <Text style={styles.helperText}>비밀번호를 잊으셨나요?</Text>
                <Pressable onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={styles.helperLink}>비밀번호 찾기</Text>
                </Pressable>
              </View>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                variant="outline"
                size="lg"
                onPress={signInWithGoogle}
                loading={isGoogleSigningIn}
                disabled={isSubmitting || isGoogleSigningIn}
              >
                <FontAwesome name="google" size={16} color={colors.neutral[700]} style={styles.iconGap} />
                <Text style={styles.outlineText}>Google로 로그인</Text>
              </Button>

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>아직 계정이 없으신가요?</Text>
                <Pressable onPress={() => router.push('/register')}>
                  <Text style={styles.registerLink}>회원가입</Text>
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
  brandTitle: {
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  brandSubtitle: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
  },
  pageTitle: {
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  generalError: {
    textAlign: 'center',
    color: colors.error[600],
    fontSize: tokens.font.sm,
    marginBottom: tokens.spacing.sm2,
  },
  buttonSpacing: {
    marginTop: tokens.spacing.xxs,
  },
  helperRow: {
    marginTop: tokens.spacing.sm2,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  helperLink: {
    fontSize: tokens.font.sm,
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
    marginLeft: tokens.spacing.xs,
  },
  dividerRow: {
    marginVertical: tokens.spacing.md3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    marginHorizontal: tokens.spacing.sm2,
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  iconGap: {
    marginRight: tokens.spacing.xs2,
  },
  outlineText: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
  },
  registerRow: {
    marginTop: tokens.spacing.md3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  registerLink: {
    fontSize: tokens.font.sm,
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
    marginLeft: tokens.spacing.xs,
  },
});
