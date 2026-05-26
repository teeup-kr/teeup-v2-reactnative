import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api/api';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function ReviewerLoginScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length > 0, [email, password]);

  const handleSubmit = async () => {
    if (!canSubmit || isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      await authApi.passwordLogin({ email: email.trim(), password });
      const currentUser = await refreshAuth?.();
      if (!currentUser) {
        setError('로그인은 되었지만 세션을 확인하지 못했습니다. 백엔드를 재시작했는지 확인해 주세요.');
        return;
      }
      router.replace('/app');
    } catch (e) {
      setError(e?.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>리뷰어 로그인</Text>
          <Text style={styles.subtitle}>구글 로그인 심사용 임시 로그인</Text>

          <View style={styles.field}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="reviewer@teeup.run"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
              editable={!isLoading}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="비밀번호"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
              editable={!isLoading}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}
            style={styles.submit}
          >
            {isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.submitText}>로그인 중...</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>로그인</Text>
            )}
          </Button>

          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>돌아가기</Text>
          </Pressable>
        </Card>

        {Platform.OS === 'web' ? (
          <Text style={styles.hint}>웹에서는 쿠키 기반으로 동작할 수 있습니다.</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaWhite,
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: tokens.padding.lg,
    backgroundColor: colors.neutral[100],
  },
  card: {
    paddingHorizontal: tokens.padding.xl,
    paddingVertical: tokens.padding.xl,
  },
  title: {
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  field: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    marginBottom: tokens.spacing.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.padding.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
  },
  error: {
    color: colors.error[700],
    fontSize: tokens.font.sm,
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  submit: {
    marginTop: tokens.spacing.sm2,
  },
  submitText: {
    color: colors.white,
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.semibold,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs2,
  },
  back: {
    marginTop: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  backText: {
    textAlign: 'center',
    color: colors.neutral[700],
    textDecorationLine: 'underline',
  },
  hint: {
    marginTop: tokens.spacing.md,
    textAlign: 'center',
    color: colors.neutral[500],
    fontSize: tokens.font.xs,
  },
});

