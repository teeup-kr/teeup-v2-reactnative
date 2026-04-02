import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import { roundsApi } from '../../lib/api/api';
import Button from '../ui/Button';
import Modal from '../ui/Modal';


const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${num.toLocaleString()}원`;
};

export default function SettlementViewModal({
  isOpen,
  visible,
  onClose,
  meetingId
}) {
  const isVisible = visible ?? isOpen;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settlement, setSettlement] = useState(null);

  useEffect(() => {
    if (!isVisible || !meetingId) return;

    const fetchSettlement = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await roundsApi.getMeetingSettlement(meetingId);
        const data = extractData(response);
        setSettlement(data?.settlement ?? data);
      } catch (fetchError) {
        if (fetchError?.status === 404) {
          setSettlement(null);
          setError(null);
        } else {
          console.error('정산 조회 실패:', fetchError);
          setError('정산 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettlement();
  }, [isVisible, meetingId]);

  return (
    <Modal
      visible={isVisible}
      title="정산 상세"
      onClose={onClose}
      footer={(
        <Button size="sm" onPress={onClose}>
          닫기
        </Button>
      )}
    >
      {loading ? (
        <View style={styles.stateRow}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.stateText}>정산 정보를 불러오는 중...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : settlement ? (
        <ScrollView style={styles.detailList}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>총 금액</Text>
            <Text style={styles.detailValue}>{formatCurrency(settlement.total_cost ?? settlement.total_amount ?? settlement.amount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>1인당 금액</Text>
            <Text style={styles.detailValue}>{formatCurrency(settlement.amount_per_person)}</Text>
          </View>
          {settlement.total_participants != null && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>정산 대상</Text>
              <Text style={styles.detailValue}>{settlement.total_participants}명</Text>
            </View>
          )}
          {settlement.title ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>제목</Text>
              <Text style={styles.detailValue}>{settlement.title}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>정산 정보가 없습니다.</Text>
          <Text style={styles.emptySubtext}>정산이 생성되면 상세 내역을 확인할 수 있습니다.</Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  detailList: {
    maxHeight: 240,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: tokens.padding.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  detailLabel: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  detailValue: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
  },
  emptyWrap: {
    padding: tokens.padding.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
  },
});
