import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import { createFetchFeesHandler } from '@/lib/render/clubs';
import { buildFeeSummary, normalizeFeeItem } from '@/lib/util/clubUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export default function ClubFeesScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [fees, setFees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFees = useMemo(
    () =>
      createFetchFeesHandler({
        clubId: resolvedId,
        fetchClubFees: clubsApi.getClubFees,
        extractList,
        setFees,
        setIsLoading,
        setError,
      }),
    [resolvedId, setFees, setIsLoading, setError]
  );

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const summary = useMemo(() => buildFeeSummary(fees), [fees]);
  const normalizedFees = useMemo(() => fees.map(normalizeFeeItem), [fees]);

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
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>회비 내역을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : normalizedFees.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 회비 내역이 없습니다.</Text>
            </View>
          ) : (
            normalizedFees.map((fee) => (
              <Card key={fee.id} style={styles.feeCard}>
                <Text style={styles.feeTitle}>{fee.title}</Text>
                <Text style={styles.feeAmount}>{fee.amount}</Text>
                <Text style={styles.feeStatus}>{fee.status}</Text>
              </Card>
            ))
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
    marginBottom: tokens.spacing.md,
  },
  summaryTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
    marginBottom: tokens.spacing.xs,
  },
  summaryValue: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xxs,
  },
  summaryHint: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  list: {
    marginBottom: tokens.spacing.md,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  feeCard: {
    marginBottom: tokens.spacing.sm2,
  },
  feeTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  feeAmount: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginTop: tokens.spacing.xs,
  },
  feeStatus: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xxs,
  },
});
