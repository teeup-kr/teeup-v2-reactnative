import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '../../src/components/ui/ScreenHeader';
import Card from '../../src/components/ui/Card';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { colors } from '../../src/theme/colors';
import { authApi } from '../../src/lib/authApi';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();
  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!token) {
      setError('유효하지 않은 링크입니다.');
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authApi.resetPassword(token, form.password);
      setSuccess('비밀번호가 변경되었습니다. 로그인해 주세요.');
    } catch (apiError) {
      setError(apiError?.message || '요청에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="비밀번호 재설정" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>새 비밀번호 입력</Text>
          <Text style={styles.subtitle}>
            새 비밀번호를 입력하고 변경을 완료하세요.
          </Text>

          <Input
            label="새 비밀번호"
            value={form.password}
            onChangeText={handleChange('password')}
            placeholder="새 비밀번호"
            secureTextEntry
            required
          />
          <Input
            label="새 비밀번호 확인"
            value={form.confirmPassword}
            onChangeText={handleChange('confirmPassword')}
            placeholder="새 비밀번호 확인"
            secureTextEntry
            required
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}

          <Button style={styles.submitButton} onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : '비밀번호 변경'}
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
  errorText: {
    fontSize: 12,
    color: colors.error[600],
    marginBottom: 8,
  },
  successText: {
    fontSize: 12,
    color: colors.success[600],
    marginBottom: 8,
  },
});
