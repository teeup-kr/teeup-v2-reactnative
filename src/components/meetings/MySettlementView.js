import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import { roundsApi } from '../../lib/api/api';
import { extractData } from '../../lib/util/responseUtils';
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${num.toLocaleString()}원`;
};

export default function MySettlementView({ meetingId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!meetingId) return;

    const fetchMySettlement = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await roundsApi.getMySettlement(meetingId);
        setData(extractData(response));
      } catch (fetchError) {
        console.error('내 정산 조회 실패:', fetchError);
        setError('정산 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMySettlement();
  }, [meetingId]);

  if (loading) {
    return (
      <View style={styles.stateRow}>
        <ActivityIndicator size="small" color={colors.primary[600]} />
        <Text style={styles.stateText}>정산 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  if (!data) {
    return <Text style={styles.emptyText}>정산 정보가 없습니다.</Text>;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>내 정산 내역</Text>
      <View style={styles.row}>
        <Text style={styles.label}>정산 방식</Text>
        <Text style={styles.value}>{data.method || data.settlement_method || '-'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>내 부담금</Text>
        <Text style={styles.value}>{formatCurrency(data.my_amount || data.amount)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>정산 상태</Text>
        <Text style={styles.value}>{data.status || '-'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: tokens.padding.md,
  },
  title: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs2,
  },
  label: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  value: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: tokens.font.sm,
    color: colors.error[600],
  },
  emptyText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
});
