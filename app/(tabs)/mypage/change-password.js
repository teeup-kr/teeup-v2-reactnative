
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { mypageApi } from '@/lib/api/api';
import {
  createPasswordFieldChangeHandler,
  createSubmitChangePasswordHandler,
} from '@/lib/render/mypage';
import { base, tokens } from '@/styles/style';

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

  const handleCurrentPasswordChange = useMemo(
    () =>
      createPasswordFieldChangeHandler({
        setForm,
        setError,
        setSuccess,
        field: 'currentPassword',
      }),
    [setForm, setError, setSuccess],
  );

  const handleNewPasswordChange = useMemo(
    () =>
      createPasswordFieldChangeHandler({
        setForm,
        setError,
        setSuccess,
        field: 'newPassword',
      }),
    [setForm, setError, setSuccess],
  );

  const handleConfirmPasswordChange = useMemo(
    () =>
      createPasswordFieldChangeHandler({
        setForm,
        setError,
        setSuccess,
        field: 'confirmPassword',
      }),
    [setForm, setError, setSuccess],
  );

  const handleSubmit = useMemo(
    () =>
      createSubmitChangePasswordHandler({
        form,
        isSubmitting,
        setError,
        setSuccess,
        setIsSubmitting,
        changePassword: mypageApi.changePassword,
      }),
    [form, isSubmitting, setError, setIsSubmitting, setSuccess],
  );

  return (
    <View style={styles.safeArea}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  card: {
    marginBottom: tokens.spacing.md,
  },
  cardTitle: { ...base.cardTitle, marginBottom: tokens.spacing.xs },
  cardSubtitle: { ...base.textSmSubtle, marginBottom: tokens.spacing.sm2 },
  errorText: { ...base.textSmError, marginTop: tokens.spacing.xxs },
  successText: { ...base.textSmSuccess, marginTop: tokens.spacing.xxs },
  saveButton: {
    marginTop: tokens.spacing.xs2,
  },
});
