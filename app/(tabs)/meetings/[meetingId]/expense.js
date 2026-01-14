
import {
useLocalSearchParams } from 'expo-router';
import { useEffect,
useMemo,
useState } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { roundsApi } from '@/lib/api';
import { extractList } from '@/lib/responseUtils';
import { base, tokens } from '@/styles/style';
import { colors } from '@/theme/colors';
export default function ExpenseScreen() {
  const { meetingId } = useLocalSearchParams();
  const resolvedId = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadExpenses = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await roundsApi.getRoundExpenses(resolvedId);
        const list = extractList(response);
        setExpenses(list);
      } catch (fetchError) {
        console.error('경비 조회 실패:', fetchError);
        setError(fetchError?.message || '경비 정보를 불러오는데 실패했습니다.');
        setExpenses([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExpenses();
  }, [resolvedId]);

  const totalAmount = useMemo(() => {
    const amounts = expenses
      .map((expense) => {
        const value = expense?.amount ?? expense?.price ?? expense?.cost;
        return value !== undefined && value !== null ? Number(value) : null;
      })
      .filter((value) => Number.isFinite(value));
    if (amounts.length === 0) return '-';
    const total = amounts.reduce((sum, value) => sum + value, 0);
    return `${total.toLocaleString('ko-KR')}원`;
  }, [expenses]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="정산/경비" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>총 비용</Text>
          <Text style={styles.summaryValue}>{totalAmount}</Text>
          <Text style={styles.summaryHint}>모임 ID: {resolvedId || meetingId}</Text>
        </Card>

        <View style={styles.list}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>경비를 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : expenses.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 경비가 없습니다.</Text>
            </View>
          ) : (
            expenses.map((item) => {
              const amountValue = item?.amount ?? item?.price ?? item?.cost;
              const amount = amountValue !== undefined && amountValue !== null
                ? `${Number(amountValue).toLocaleString('ko-KR')}원`
                : '-';
              return (
                <Card key={item?.id || item?.expense_id || item?.label} style={styles.expenseCard}>
                  <Text style={styles.expenseLabel}>{item?.label || item?.title || '경비'}</Text>
                  <Text style={styles.expenseAmount}>{amount}</Text>
                </Card>
              );
            })
          )}
        </View>

        <Button variant="primary" size="lg">
          정산 시작
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  summaryCard: {
    marginBottom: tokens.spacing.md,
  },
  summaryTitle: {
    fontSize: tokens.font.base,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginTop: tokens.spacing.xs,
  },
  summaryHint: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xs,
  },
  list: {
    marginBottom: tokens.spacing.md,
  },
  expenseCard: {
    marginBottom: tokens.spacing.sm2,
  },
  expenseLabel: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
  },
  expenseAmount: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginTop: tokens.spacing.xs,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
});