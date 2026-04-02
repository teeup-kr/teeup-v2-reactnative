import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import { backOrHome } from '@/lib/navigation/cappedHistory';
import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

import { ClubFeeForm } from '../create';

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

  const handleSubmit = async ({ name: nextName, amount: nextAmount, cycle: nextCycle, description: nextDescription }) => {
    setIsSubmitting(true);
    try {
      await clubsApi.updateClubFee(resolvedClubId, resolvedFeeId, {
        name: nextName,
        amount: nextAmount,
        cycle: nextCycle,
        description: nextDescription,
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
          <Button variant="outline" onPress={() => backOrHome(router)} style={{ marginTop: tokens.spacing.md }}>
            뒤로가기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ClubFeeForm
      screenTitle="회비 수정"
      initialName={name}
      initialAmount={amount}
      initialCycle={cycle}
      initialDescription={description}
      submitButtonText="저장하기"
      submittingButtonText="저장 중..."
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      extraActions={(
        <Button
          variant="outline"
          size="lg"
          onPress={handleDelete}
          disabled={isSubmitting}
          style={styles.deleteBtn}
        >
          삭제하기
        </Button>
      )}
    />
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
  errorText: base.textSmError,
  deleteBtn: {
    marginTop: tokens.spacing.sm2,
    borderColor: colors.error[300],
  },
});
