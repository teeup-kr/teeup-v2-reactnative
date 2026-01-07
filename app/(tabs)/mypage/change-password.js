import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import Input from '../../../src/components/ui/Input';
import ScreenHeader from '../../../src/components/ui/ScreenHeader';
import { authApi } from '../../../src/lib/authApi';
import { colors } from '../../../src/theme/colors';

export default function ChangePasswordScreen() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentPassword, newPassword, confirmPassword } = form;

  const handleCurrentPasswordChange = (value) => {
    setForm((prev) => ({ ...prev, currentPassword: value }));
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  const handleNewPasswordChange = (value) => {
    setForm((prev) => ({ ...prev, newPassword: value }));
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setForm((prev) => ({ ...prev, confirmPassword: value }));
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      };
      await authApi.changePassword(payload);
      setSuccess('비밀번호가 변경되었습니다.');
    } catch (apiError) {
      setError(apiError?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="비밀번호 변경" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>비밀번호를 변경하세요</Text>
          <Text style={styles.cardSubtitle}>
            안전을 위해 8자 이상의 조합을 권장합니다.
          </Text>
          <Input
            label="현재 비밀번호"
            value={currentPassword}
            onChangeText={handleCurrentPasswordChange}
            placeholder="현재 비밀번호"
            secureTextEntry
            required
          />
          <Input
            label="새 비밀번호"
            value={newPassword}
            onChangeText={handleNewPasswordChange}
            placeholder="새 비밀번호"
            secureTextEntry
            required
          />
          <Input
            label="새 비밀번호 확인"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            placeholder="새 비밀번호 확인"
            secureTextEntry
            required
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? <Text style={styles.successText}>{success}</Text> : null}
        </Card>
        <Button style={styles.saveButton} onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? '처리 중...' : '변경하기'}
        </Button>
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: colors.success[600],
    marginTop: 4,
  },
  saveButton: {
    marginTop: 8,
  },
});
