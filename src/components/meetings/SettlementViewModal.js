import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { roundsApi } from '../../lib/api';
import { extractData } from '../../lib/responseUtils';
import { colors } from '../../theme/colors';
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
        setSettlement(extractData(response));
      } catch (fetchError) {
        console.error('정산 조회 실패:', fetchError);
        setError('정산 정보를 불러오는데 실패했습니다.');
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
            <Text style={styles.detailLabel}>정산 방식</Text>
            <Text style={styles.detailValue}>{settlement.method || settlement.settlement_method || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>총 금액</Text>
            <Text style={styles.detailValue}>{formatCurrency(settlement.total_amount || settlement.amount)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>정산 상태</Text>
            <Text style={styles.detailValue}>{settlement.status || '-'}</Text>
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>정산 정보가 없습니다.</Text>
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
    fontSize: 12,
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
  detailList: {
    maxHeight: 240,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  detailLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  detailValue: {
    fontSize: 12,
    color: colors.neutral[800],
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});
