import {
FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
KeyboardAvoidingView,
Platform,
Pressable,
ScrollView,
Text,
View,
} from 'react-native';
import { authorize } from 'react-native-app-auth';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/authApi';
import { buildGoogleAuthConfig, generateOauthState } from '@/lib/authUtils';
import { tokenStorage } from '@/lib/tokenStorage';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/login';

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

