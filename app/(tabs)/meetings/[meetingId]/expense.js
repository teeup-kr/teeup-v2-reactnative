import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { meetingsApi } from '@/lib/api/api';
import { createFetchExpensesHandler } from '@/lib/render/meetings';
import {
  formatExpenseAmount,
  getExpenseLabel,
  getTotalExpenseAmount,
} from '@/lib/util/meetingUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export default function ExpenseScreen() {
  const { meetingId } = useLocalSearchParams();
  const resolvedId = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadExpenses = useMemo(
    () =>
      createFetchExpensesHandler({
        meetingId: resolvedId,
        fetchRoundExpenses: meetingsApi.fetchRoundExpenses,
        extractList,
        setExpenses,
        setIsLoading,
        setError,
      }),
    [resolvedId, setExpenses, setIsLoading, setError]
  );

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totalAmount = useMemo(() => getTotalExpenseAmount(expenses), [expenses]);

  const renderExpenseItem = useCallback(function renderExpenseItem(item) {
    return (
      <Card key={item?.id || item?.expense_id || item?.label} style={styles.expenseCard}>
        <Text style={styles.expenseLabel}>{getExpenseLabel(item)}</Text>
        <Text style={styles.expenseAmount}>{formatExpenseAmount(item)}</Text>
      </Card>
    );
  }, []);

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
            expenses.map(renderExpenseItem)
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
