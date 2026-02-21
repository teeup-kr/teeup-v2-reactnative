import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { clubsApi } from '@/lib/api/api';
import { clubFeeCycles } from '@/constants/clubConstants';
import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function ClubFeeEditScreen() {
  const router = useRouter();
  const { clubId, feeId } = useLocalSearchParams();
  const resolvedClubId = Array.isArray(clubId) ? clubId[0] : clubId;
  const resolvedFeeId = Array.isArray(feeId) ? feeId[0] : feeId;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!resolvedClubId || !resolvedFeeId) return;
      try {
        setIsLoading(true);
        setFetchError('');
        const res = extractData(await clubsApi.getClubFee(resolvedClubId, resolvedFeeId));
        if (!cancelled) {
          setName(res?.name || '');
          setAmount(String(res?.amount ?? ''));
          setCycle(res?.cycle || '');
          setDescription(res?.description || '');
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err?.message || '회비 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [resolvedClubId, resolvedFeeId]);

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
      await clubsApi.updateClubFee(resolvedClubId, resolvedFeeId, {
        name: name.trim(),
        amount: amountNum,
        cycle: cycle || null,
        description: description?.trim() || null,
      });
      if (Platform.OS === 'web') {
        window.alert('회비가 수정되었습니다.');
        router.replace(`/clubs/${resolvedClubId}/fees`);
      } else {
        Alert.alert('수정 완료', '회비가 수정되었습니다.', [
          { text: '확인', onPress: () => router.replace(`/clubs/${resolvedClubId}/fees`) },
        ]);
      }
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        '수정에 실패했습니다.';
      Alert.alert('수정 실패', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('이 회비 항목을 삭제하시겠습니까?')
        : await new Promise((resolve) => {
            Alert.alert(
              '회비 삭제',
              '이 회비 항목을 삭제하시겠습니까?',
              [
                { text: '취소', style: 'cancel', onPress: () => resolve(false) },
                { text: '삭제', style: 'destructive', onPress: () => resolve(true) },
              ]
            );
          });

    if (!confirmed) return;

    try {
      await clubsApi.deleteClubFee(resolvedClubId, resolvedFeeId);
      if (Platform.OS === 'web') {
        window.alert('회비가 삭제되었습니다.');
        router.replace(`/clubs/${resolvedClubId}/fees`);
      } else {
        Alert.alert('삭제 완료', '회비가 삭제되었습니다.', [
          { text: '확인', onPress: () => router.replace(`/clubs/${resolvedClubId}/fees`) },
        ]);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err?.message || '삭제에 실패했습니다.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('삭제 실패', msg);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="회비 수정" />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="회비 수정" />
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <Button variant="outline" onPress={() => router.back()} style={{ marginTop: tokens.spacing.md }}>
            뒤로가기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="회비 수정" />
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

        <Button variant="primary" size="lg" onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '저장하기'}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onPress={handleDelete}
          disabled={isSubmitting}
          style={styles.deleteBtn}
        >
          삭제하기
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  loadingWrap: {
    flex: 1,
    padding: tokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: base.textSmMuted,
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
  errorText: base.textSmError,
  cycleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs2,
    marginBottom: tokens.spacing.sm2,
  },
  cycleBtn: {
    marginRight: tokens.spacing.xs,
  },
  deleteBtn: {
    marginTop: tokens.spacing.sm2,
    borderColor: colors.error[300],
  },
});
