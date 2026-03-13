import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { googleAuthConfig } from '@/constants/authConstants';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api/api';
import { replaceWithPolicy } from '@/lib/navigation/cappedHistory';
import { tokenStorage } from '@/lib/tokenStorage';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const { refreshAuth, setAuthError } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const params = new URLSearchParams(window.location.search);

    const authorizationCode = params.get('code');
    const returnedState = params.get('state');
    const authError = params.get('error');

    const resetUrl = () => {
      window.history.replaceState(null, '', window.location.pathname);
    };

    const handleCallback = async () => {
      setIsLoading(true);
      setError(null);
      if (authError) {
        setAuthError(`Google 로그인 실패: ${authError}`);
        await tokenStorage.clearOauth();
        resetUrl();
        return;
      }

      if (!authorizationCode) {
        resetUrl();
        return;
      }

      try {
        const storedState = await tokenStorage.getOauthState();
        const codeVerifier = await tokenStorage.getCodeVerifier();

        // if (!codeVerifier) {
        //   throw new Error('PKCE code_verifier가 존재하지 않습니다.');
        // }

        if (storedState && returnedState && storedState !== returnedState) {
          throw new Error('OAuth state 값이 일치하지 않습니다.');
        }

        const response = await authApi.googleLogin({
          authorizationCode,
          codeVerifier,
          redirectUri: googleAuthConfig.redirectUrl,
        });

        await refreshAuth();
        const needsTermsAgreement = response?.user?.needs_terms_agreement === true;
        if (needsTermsAgreement) {
          replaceWithPolicy(router, '/terms-agree', { webHardReplace: true });
          return;
        }

        replaceWithPolicy(router, '/app', { webHardReplace: true });
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        setIsLoading(false);

        const isTermsAgreementRequired =
          err?.status === 403 &&
          (
            err?.payload?.detail?.code === 'TERMS_NOT_AGREED' ||
            err?.message?.includes('약관')
          );

        if (isTermsAgreementRequired) {
          // 약관 동의 페이지로 리다이렉트
          setError('필수 약관에 동의하지 않아 로그인할 수 없습니다. 약관 동의 페이지로 이동합니다...');
          setTimeout(() => {
            replaceWithPolicy(router, '/terms-agree', { webHardReplace: true });
          }, 1500); // 1.5초 후 리다이렉트
          return;
        }

        // 일반 에러 처리
        setError(err?.message || 'Google 로그인에 실패했습니다.');
        setAuthError(err?.message || 'Google 로그인에 실패했습니다.');
        resetUrl();
      } finally {
        setIsLoading(false);
        // 약관 동의 페이지로 리다이렉트되지 않은 경우에만 OAuth 정보 정리
        // 약관 동의 페이지로 가는 경우에는 OAuth 정보를 유지할 필요 없음
        if (Platform.OS === 'web') {
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/terms-agree')) {
            await tokenStorage.clearOauth();
          }
        }
      }
    };

    void handleCallback();
  }, [router, refreshAuth, setAuthError]);

  // 로딩 또는 에러 화면 표시
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {isLoading ? (
            <>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Text style={styles.loadingText}>로그인 처리 중...</Text>
            </>
          ) : error ? (
            <>
              <Text style={styles.errorTitle}>로그인 오류</Text>
              <Text style={styles.errorText}>{error}</Text>
              {error.includes('약관') && (
                <Text style={styles.infoText}>약관 동의 페이지로 이동합니다...</Text>
              )}
            </>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.padding.xl,
  },
  loadingText: {
    ...base.textBase,
    marginTop: tokens.spacing.md,
    color: colors.neutral[600],
  },
  errorTitle: {
    ...base.textXl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.error[600],
    marginBottom: tokens.spacing.md,
  },
  errorText: {
    ...base.textBase,
    color: colors.error[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  infoText: {
    ...base.textSm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: tokens.spacing.md,
  },
});
