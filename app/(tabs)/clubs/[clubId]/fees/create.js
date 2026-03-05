import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubFeeCycles } from '@/constants/clubConstants';
import { clubsApi } from '@/lib/api/api';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function ClubFeeCreateScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('MONTHLY');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    const newErrors = {};
    if (!name?.trim()) newErrors.name = '회비 항목명을 입력해주세요.';
    const amountNum = Number(amount);
    if (amount === '' || isNaN(amountNum) || amountNum < 0) {
      newErrors.amount = '유효한 금액을 입력해주세요.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await clubsApi.createClubFee(resolvedId, {
        name: name.trim(),
        amount: amountNum,
        cycle: cycle || null,
        description: description?.trim() || null,
        is_active: true,
      });
      if (Platform.OS === 'web') {
        window.alert('회비가 등록되었습니다.');
        router.replace(`/clubs/${resolvedId}/fees`);
      } else {
        Alert.alert('등록 완료', '회비가 등록되었습니다.', [
          { text: '확인', onPress: () => router.replace(`/clubs/${resolvedId}/fees`) },
        ]);
      }
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        '회비 등록에 실패했습니다.';
      Alert.alert('등록 실패', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="회비 등록" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.label}>회비 항목명 *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="예: 정기 회비"
            style={[styles.input, errors.name && styles.inputError]}
            placeholderTextColor={colors.neutral[400]}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          <Text style={styles.label}>금액 (원) *</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            keyboardType="numeric"
            style={[styles.input, errors.amount && styles.inputError]}
            placeholderTextColor={colors.neutral[400]}
          />
          {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

          <Text style={styles.label}>주기 (선택)</Text>
          <View style={styles.cycleRow}>
            {clubFeeCycles.map((c) => (
              <Button
                key={c.id}
                variant={cycle === c.id ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setCycle(c.id)}
                style={styles.cycleBtn}
              >
                {c.label}
              </Button>
            ))}
          </View>

          <Text style={styles.label}>설명 (선택)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="회비에 대한 설명"
            style={[styles.input, styles.textArea]}
            multiline
            placeholderTextColor={colors.neutral[400]}
          />
        </Card>

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '등록 중...' : '등록하기'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  card: {
    marginBottom: tokens.spacing.md,
  },
  label: base.labelSm,
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
    marginBottom: tokens.spacing.xs,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: tokens.font.xs,
    color: colors.error[600],
    marginBottom: tokens.spacing.sm2,
  },
  cycleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs2,
    marginBottom: tokens.spacing.sm2,
  },
  cycleBtn: {
    marginRight: tokens.spacing.xs,
  },
});
