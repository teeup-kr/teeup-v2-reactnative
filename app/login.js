import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { authorize } from 'react-native-app-auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import Card from '../src/components/ui/Card';
import Input from '../src/components/ui/Input';
import { useAuth } from '../src/context/AuthContext';
import { authApi } from '../src/lib/authApi';
import { buildGoogleAuthConfig, generateOauthState } from '../src/lib/authUtils';
import { tokenStorage } from '../src/lib/tokenStorage';
import { colors } from '../src/theme/colors';

const logoImage = require('../assets/teeuplink-logo.png');

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
    setErrors((prev) => ({ ...prev, general: '' }));
    setIsGoogleSigningIn(true);

    const oauthState = generateOauthState();
    await tokenStorage.setOauthState(oauthState);

    try {
      const authState = await authorize(buildGoogleAuthConfig(oauthState));
      // console.log('Google OAuth State:', authState);
      // const stateParam =
      //   authState?.authorizeAdditionalParameters?.state ??
      //   authState?.tokenAdditionalParameters?.state;
      // const code = authState.authorizationCode;

      // if (!code) {
      //   throw new Error('Google 인증 코드가 존재하지 않습니다.');
      // }

      // if (stateParam && stateParam !== oauthState) {
      //   throw new Error('Google 인증 상태가 일치하지 않습니다.');
      // }

      // const payload = {
      //   provider: 'google',
      //   code,
      //   ...(oauthState ? { state: oauthState } : {}),
      //   redirect_uri: config.redirectUrl,
      // };
      const payload = {
        provider: 'google',
        authorizationCode: authState.authorizationCode,
        codeVerifier: authState.codeVerifier,
      };
      await authApi.googleLogin(payload);
      await refreshAuth();
      router.replace('/');
    } catch (error) {
      console.error('Google 로그인 에러:', error);
      const message = error?.message || 'Google 로그인에 실패했습니다.';
      setErrors((prev) => ({ ...prev, general: message }));
    } finally {
      await tokenStorage.clearOauthState();
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#E8F5E8', '#C8E6C9']} style={styles.gradient}>
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 48,
    height: 48,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.neutral[600],
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 16,
  },
  generalError: {
    textAlign: 'center',
    color: colors.error[600],
    fontSize: 12,
    marginBottom: 12,
  },
  buttonSpacing: {
    marginTop: 4,
  },
  helperRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  helperLink: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 6,
  },
  dividerRow: {
    marginVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: colors.neutral[500],
  },
  iconGap: {
    marginRight: 8,
  },
  outlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  registerRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  registerLink: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 6,
  },
});
