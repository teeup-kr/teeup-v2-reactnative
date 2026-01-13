import { StyleSheet } from 'react-native';
import { base, tokens } from '@/styles/style';

import {
useLocalSearchParams } from 'expo-router';
import { useEffect,
useMemo,
useState } from 'react';
import { ActivityIndicator,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/clubsApi';
import { extractList } from '@/lib/responseUtils';

export default function ClubFeesScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [fees, setFees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFees = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubFees(resolvedId, { page: 1, limit: 50 });
        const list = extractList(response);
        setFees(list);
      } catch (fetchError) {
        console.error('회비 목록 조회 실패:', fetchError);
        setError(fetchError?.message || '회비 정보를 불러오는데 실패했습니다.');
        setFees([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFees();
  }, [resolvedId]);

  const summary = useMemo(() => {
    if (fees.length === 0) {
      return { amount: '-', nextDue: '-' };
    }
    const sortedByDue = fees
      .filter((fee) => fee?.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    const nextDue = sortedByDue[0]?.due_date ? sortedByDue[0].due_date.slice(0, 10) : '-';
    const recurring = fees.find((fee) => fee?.amount !== undefined && fee?.amount !== null);
    const amountValue = recurring?.amount;
    const amount = amountValue !== undefined && amountValue !== null
      ? `${Number(amountValue).toLocaleString('ko-KR')}원`
      : '-';
    return { amount, nextDue };
  }, [fees]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="회비 관리" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>정기 회비</Text>
          <Text style={styles.summaryValue}>{summary.amount}</Text>
          <Text style={styles.summaryHint}>다음 납부일 {summary.nextDue}</Text>
        </Card>

        <View style={styles.list}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={tokens.colors.primary[600]} />
              <Text style={styles.stateText}>회비 내역을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : fees.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 회비 내역이 없습니다.</Text>
            </View>
          ) : (
            fees.map((fee) => {
              const title = fee?.title || fee?.type || '회비';
              const amountValue = fee?.amount;
              const amount = amountValue !== undefined && amountValue !== null
                ? `${Number(amountValue).toLocaleString('ko-KR')}원`
                : '-';
              const status = fee?.status || fee?.payment_status || '';
              return (
                <Card key={fee?.id || fee?.fee_id || title} style={styles.feeCard}>
                  <Text style={styles.feeTitle}>{title}</Text>
                  <Text style={styles.feeAmount}>{amount}</Text>
                  <Text style={styles.feeStatus}>{status || '-'}</Text>
                </Card>
              );
            })
          )}
        </View>

        <Button variant="primary" size="lg">
          회비 납부하기
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.neutral[700],
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.neutral[900],
    marginBottom: 4,
  },
  summaryHint: {
    fontSize: 11,
    color: tokens.colors.neutral[500],
  },
  list: {
    marginBottom: 16,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  feeCard: {
    marginBottom: 12,
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.colors.neutral[800],
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.neutral[900],
    marginTop: 6,
  },
  feeStatus: {
    fontSize: 11,
    color: tokens.colors.neutral[500],
    marginTop: 4,
  },
});
