import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { authApi } from '@/lib/authApi';
import { colors } from '@/theme/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.requestPasswordReset({ email: email.trim() });
      setSuccess('비밀번호 재설정 링크를 이메일로 전송했습니다.');
    } catch (apiError) {
      setError(apiError?.message || '요청에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="비밀번호 찾기" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>비밀번호 재설정</Text>
          <Text style={styles.subtitle}>
            가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
          </Text>

          <Input
            label="이메일"
            value={email}
            onChangeText={setEmail}
            placeholder="이메일을 입력하세요"
            keyboardType="email-address"
            error={error}
            required
          />

          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <Button style={styles.submitButton} onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? '전송 중...' : '링크 받기'}
          </Button>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 16,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 8,
  },
  successText: {
    fontSize: 12,
    color: colors.success[600],
    marginBottom: 8,
  },
});
