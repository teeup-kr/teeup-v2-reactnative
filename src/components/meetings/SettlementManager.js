import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { roundsApi } from '../../lib/api';
import { extractData } from '../../lib/responseUtils';
import { colors } from '../../theme/colors';
import Button from '../ui/Button';
import Input from '../ui/Input';
import SettlementViewModal from './SettlementViewModal';

const ROUND_METHODS = [
  { value: 'EQUAL_SPLIT', label: 'N분의 1' },
  { value: 'INDIVIDUAL', label: '개별 정산' },
];

const SOCIAL_METHODS = [
  { value: 'EQUAL_SPLIT', label: 'N분의 1' },
  { value: 'TREASURER_PREPAID', label: '총무 선결제' },
  { value: 'CLUB_FUND', label: '클럽 회비 사용' },
  { value: 'INDIVIDUAL', label: '개별 정산' },
];

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${num.toLocaleString()}원`;
};

export default function SettlementManager({
  meetingId,
  meetingType,
  canSettle,
  canManageSettlement,
  participants = [],
  onSettlementCreated,
  onConfirmSettlement,
  meeting,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('EQUAL_SPLIT');
  const [saving, setSaving] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchSettlement = useCallback(async () => {
    if (!meetingId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await roundsApi.getMeetingSettlement(meetingId);
      setSettlement(extractData(response));
    } catch (_fetchError) {
      setSettlement(null);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchSettlement();
  }, [fetchSettlement]);

  const methods = meetingType === 'SOCIAL' ? SOCIAL_METHODS : ROUND_METHODS;

  const handleCreateSettlement = async () => {
    if (!meetingId) return;
    if (!amount) {
      setError('정산 금액을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        total_amount: Number(amount),
        settlement_method: method,
      };

      if (meetingType === 'SOCIAL') {
        await roundsApi.createEventSettlement(meetingId, payload);
      } else {
        await roundsApi.createRoundingSettlement(meetingId, payload);
      }

      if (onSettlementCreated) {
        onSettlementCreated();
      }
      fetchSettlement();
    } catch (createError) {
      console.error('정산 생성 실패:', createError);
      setError(createError?.message || '정산 생성에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>정산 관리</Text>

      {loading ? (
        <Text style={styles.helperText}>정산 정보를 불러오는 중...</Text>
      ) : settlement ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>정산 요약</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>정산 방식</Text>
            <Text style={styles.summaryValue}>{settlement.method || settlement.settlement_method || '-'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>총 금액</Text>
            <Text style={styles.summaryValue}>{formatCurrency(settlement.total_amount || settlement.amount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>상태</Text>
            <Text style={styles.summaryValue}>{settlement.status || '-'}</Text>
          </View>
          <View style={styles.actionRow}>
            <Button size="sm" variant="outline" onPress={() => setShowViewModal(true)}>
              정산 상세
            </Button>
            {onConfirmSettlement && (
              <Button size="sm" onPress={onConfirmSettlement}>
                정산 확정
              </Button>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.helperText}>정산 정보가 아직 없습니다.</Text>
      )}

      {canManageSettlement && canSettle && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>정산 생성</Text>
          <Input
            label="총 금액"
            value={amount}
            onChangeText={setAmount}
            placeholder="예: 120000"
            keyboardType="number-pad"
          />
          <Text style={styles.formLabel}>정산 방식</Text>
          <View style={styles.methodRow}>
            {methods.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={method === option.value ? 'primary' : 'outline'}
                onPress={() => setMethod(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Button size="sm" onPress={handleCreateSettlement} loading={saving}>
            정산 생성
          </Button>
        </View>
      )}

      <SettlementViewModal
        visible={showViewModal}
        onClose={() => setShowViewModal(false)}
        meetingId={meetingId}
        meetingType={meetingType}
        participants={participants}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  summaryCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  summaryValue: {
    fontSize: 11,
    color: colors.neutral[800],
    fontWeight: '600',
  },
  formCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 12,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
    marginBottom: 8,
  },
});
