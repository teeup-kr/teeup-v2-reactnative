import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { authApi } from '../../../src/lib/authApi';
import { tokenStorage } from '../../../src/lib/tokenStorage';
import { colors } from '../../../src/theme/colors';

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const { code, state, error } = useLocalSearchParams();
  const [message, setMessage] = useState('로그인 처리 중...');

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        setMessage('Google 로그인 오류가 발생했습니다.');
        return;
      }

      if (!code) {
        setMessage('인증 코드가 없습니다.');
        return;
      }

      const storedState = await tokenStorage.getOauthState();
      if (storedState && state && storedState !== state) {
        setMessage('로그인 요청이 유효하지 않습니다.');
        return;
      }

      try {
        await tokenStorage.clearOauthState();
        await authApi.googleLogin({ provider: 'google', code, state });
        router.replace('/');
      } catch (authError) {
        setMessage(authError?.message || 'Google 로그인에 실패했습니다.');
      }
    };

    handleCallback();
  }, [code, state, error, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary[600]} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.neutral[50],
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: colors.neutral[700],
    textAlign: 'center',
  },
});
