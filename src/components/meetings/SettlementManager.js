import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

import { roundsApi } from '@/lib/api/api';
import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

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

function formatCurrency(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0원';
  return `${numeric.toLocaleString('ko-KR')}원`;
}

function formatInputNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  return `${Math.round(numeric)}`;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return 0;
}

function onlyDigits(value) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

/** participant.user_id 또는 guest_id (백엔드 전송용, 단일 타입일 때) */
function getParticipantId(p) {
  return p?.user_id ?? p?.guest_id ?? p?.id;
}

/** 선택 상태 저장/비교용 고유 키 (user_id=1과 guest_id=1 구분) */
function getParticipantStorageKey(p) {
  if (p?.id != null) return `id:${p.id}`;
  if (p?.user_id != null) return `user:${p.user_id}`;
  if (p?.guest_id != null) return `guest:${p.guest_id}`;
  return null;
}

/** participant 표시 이름 */
function getParticipantDisplayName(p) {
  return p?.user_name ?? p?.name ?? p?.guest_name ?? p?.realname ?? '이름 없음';
}

/** 리스트 렌더 시 고유 key */
function getParticipantKey(p, index) {
  const sk = getParticipantStorageKey(p);
  return sk ?? `idx-${index}`;
}

function makeSettlementForm(settlement, meeting) {
  return {
    total_cost: onlyDigits(
      firstFiniteNumber(
        settlement?.total_cost,
        settlement?.total_amount,
        settlement?.amount,
        meeting?.total_cost
      )
    ),
    green_fee: onlyDigits(firstFiniteNumber(settlement?.green_fee, meeting?.green_fee)),
    caddy_fee: onlyDigits(firstFiniteNumber(settlement?.caddy_fee, meeting?.caddy_fee)),
    cart_fee: onlyDigits(firstFiniteNumber(settlement?.cart_fee, meeting?.cart_fee)),
    other_fee: onlyDigits(firstFiniteNumber(settlement?.other_fee, meeting?.other_fee)),
  };
}

function normalizeSettlementPayload(payload) {
  if (!payload) return null;

  if (Object.prototype.hasOwnProperty.call(payload, 'settlement')) {
    return payload.settlement || null;
  }

  if (
    payload?.data &&
    typeof payload.data === 'object' &&
    Object.prototype.hasOwnProperty.call(payload.data, 'settlement')
  ) {
    return payload.data.settlement || null;
  }

  const extracted = extractData(payload);

  if (
    extracted &&
    typeof extracted === 'object' &&
    Object.prototype.hasOwnProperty.call(extracted, 'settlement')
  ) {
    return extracted.settlement || null;
  }

  if (
    extracted &&
    typeof extracted === 'object' &&
    !Array.isArray(extracted) &&
    (extracted.id ||
      extracted.total_cost !== undefined ||
      extracted.total_amount !== undefined ||
      extracted.amount !== undefined)
  ) {
    return extracted;
  }

  return null;
}

export default function SettlementManager({
  meetingId,
  meetingType,
  meeting,
  canSettle,
  canManageSettlement,
  participants = [],
  onSettlementCreated,
  onConfirmSettlement,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [settlementForm, setSettlementForm] = useState(() => makeSettlementForm(null, meeting));
  const [method, setMethod] = useState('EQUAL_SPLIT');
  const [feeParticipants, setFeeParticipants] = useState({
    green_fee: [],
    caddy_fee: [],
    cart_fee: [],
  });
  const [saving, setSaving] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const fetchSettlement = useCallback(async () => {
    if (!meetingId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await roundsApi.getMeetingSettlement(meetingId);
      setSettlement(normalizeSettlementPayload(response));
    } catch (fetchError) {
      console.error('정산 조회 실패:', fetchError);
      setSettlement(null);
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchSettlement();
  }, [fetchSettlement]);

  useEffect(() => {
    setSettlementForm(makeSettlementForm(settlement, meeting));
    if (settlement) {
      setMethod(String(settlement?.settlement_method || settlement?.method || 'EQUAL_SPLIT'));
    }
  }, [settlement, meeting]);

  const participantStorageKeys = useMemo(
    () => participants.map(getParticipantStorageKey).filter(Boolean),
    [participants]
  );

  const toggleFeeParticipant = useCallback((feeKey, storageKey) => {
    setFeeParticipants((prev) => {
      const current = prev[feeKey] || [];
      const next = current.includes(storageKey)
        ? current.filter((k) => k !== storageKey)
        : [...current, storageKey];
      return { ...prev, [feeKey]: next };
    });
  }, []);

  const selectAllForFee = useCallback((feeKey) => {
    setFeeParticipants((prev) => ({ ...prev, [feeKey]: [...participantStorageKeys] }));
  }, [participantStorageKeys]);

  const clearAllForFee = useCallback((feeKey) => {
    setFeeParticipants((prev) => ({ ...prev, [feeKey]: [] }));
  }, []);

  /** 선택된 storage key들을 참가자 id(MeetingParticipant.id) 배열로 변환 (백엔드 전송용) */
  const feeParticipantsToIds = useCallback((feeKey) => {
    const keys = feeParticipants[feeKey] || [];
    return keys
      .map((storageKey) => {
        const p = participants.find((q) => getParticipantStorageKey(q) === storageKey);
        return p?.id ?? (storageKey.startsWith('id:') ? Number(storageKey.slice(3)) : null);
      })
      .filter((id) => id != null);
  }, [feeParticipants, participants]);

  const methods = meetingType === 'SOCIAL' ? SOCIAL_METHODS : ROUND_METHODS;

  const totalCost = useMemo(
    () =>
      firstFiniteNumber(
        settlement?.total_cost,
        settlement?.total_amount,
        settlement?.amount
      ),
    [settlement]
  );

  const targetCount = useMemo(() => {
    const fromField = firstFiniteNumber(
      settlement?.total_participants,
      settlement?.participant_count
    );
    if (fromField > 0) return fromField;
    if (Array.isArray(settlement?.settlement_targets)) return settlement.settlement_targets.length;
    return participants.length;
  }, [participants.length, settlement?.participant_count, settlement?.settlement_targets, settlement?.total_participants]);

  const amountPerPerson = useMemo(() => {
    const fromField = firstFiniteNumber(settlement?.amount_per_person);
    if (fromField > 0) return fromField;
    if (targetCount <= 0) return 0;
    return Math.round(totalCost / targetCount);
  }, [settlement?.amount_per_person, targetCount, totalCost]);

  const costFields = useMemo(
    () => [
      {
        key: 'total_cost',
        label: '전체 비용 (원)',
        value: formatInputNumber(totalCost),
      },
      {
        key: 'green_fee',
        label: '그린피 (원)',
        value: formatInputNumber(settlement?.green_fee),
      },
      {
        key: 'caddy_fee',
        label: '캐디피 (원)',
        value: formatInputNumber(settlement?.caddy_fee),
      },
      {
        key: 'cart_fee',
        label: '카트비 (원)',
        value: formatInputNumber(settlement?.cart_fee),
      },
      {
        key: 'other_fee',
        label: '기타 비용 (원)',
        value: formatInputNumber(settlement?.other_fee),
      },
    ],
    [settlement?.caddy_fee, settlement?.cart_fee, settlement?.green_fee, settlement?.other_fee, totalCost]
  );

  const canCreateSettlement = useMemo(
    () => Boolean(!settlement && canManageSettlement && canSettle),
    [settlement, canManageSettlement, canSettle]
  );

  const canEditSettlement = useMemo(
    () => Boolean(settlement && canManageSettlement && !meeting?.settlement_confirmed),
    [settlement, canManageSettlement, meeting?.settlement_confirmed]
  );

  const canConfirmSettlement = useMemo(
    () =>
      Boolean(
        settlement &&
          canManageSettlement &&
          onConfirmSettlement &&
          !meeting?.settlement_confirmed
      ),
    [settlement, canManageSettlement, onConfirmSettlement, meeting?.settlement_confirmed]
  );

  const shouldShowForm = useMemo(
    () => Boolean(canCreateSettlement || showEditForm),
    [canCreateSettlement, showEditForm]
  );

  const updateNumericField = useCallback((key, value) => {
    setSettlementForm((prev) => ({
      ...prev,
      [key]: onlyDigits(value),
    }));
  }, []);

  const handleSaveSettlement = useCallback(async () => {
    if (!meetingId) return;

    const numericTotalCost = Number(settlementForm.total_cost);
    if (!Number.isFinite(numericTotalCost) || numericTotalCost < 0) {
      setError('총 비용을 올바르게 입력해주세요.');
      return;
    }

    const greenFee = firstFiniteNumber(settlementForm.green_fee);
    const caddyFee = firstFiniteNumber(settlementForm.caddy_fee);
    const cartFee = firstFiniteNumber(settlementForm.cart_fee);

    if (meetingType === 'ROUND') {
      if (greenFee > 0 && (feeParticipants.green_fee || []).length === 0) {
        setError('그린피의 정산 대상자를 선택해주세요.');
        return;
      }
      if (caddyFee > 0 && (feeParticipants.caddy_fee || []).length === 0) {
        setError('캐디피의 정산 대상자를 선택해주세요.');
        return;
      }
      if (cartFee > 0 && (feeParticipants.cart_fee || []).length === 0) {
        setError('카트비의 정산 대상자를 선택해주세요.');
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        total_amount: numericTotalCost,
        total_cost: numericTotalCost,
        green_fee: greenFee,
        caddy_fee: caddyFee,
        cart_fee: cartFee,
        other_fee: firstFiniteNumber(settlementForm.other_fee),
        settlement_method: method,
      };

      if (meetingType === 'ROUND') {
        payload.green_fee_participants = greenFee > 0 ? feeParticipantsToIds('green_fee') : [];
        payload.caddy_fee_participants = caddyFee > 0 ? feeParticipantsToIds('caddy_fee') : [];
        payload.cart_fee_participants = cartFee > 0 ? feeParticipantsToIds('cart_fee') : [];
      }

      if (meetingType === 'SOCIAL') {
        await roundsApi.createEventSettlement(meetingId, payload);
      } else {
        await roundsApi.createRoundingSettlement(meetingId, payload);
      }

      if (onSettlementCreated) {
        onSettlementCreated();
      }

      setShowEditForm(false);
      await fetchSettlement();
    } catch (saveError) {
      console.error('정산 저장 실패:', saveError);
      setError(saveError?.message || '정산 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [
    fetchSettlement,
    feeParticipants,
    feeParticipantsToIds,
    meetingId,
    meetingType,
    method,
    onSettlementCreated,
    settlementForm,
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>정산 관리</Text>

      {loading ? (
        <Text style={styles.helperText}>정산 정보를 불러오는 중...</Text>
      ) : settlement ? (
        <View style={styles.settlementContent}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <Text style={styles.summaryHeaderText}>정산 정보</Text>
              <Pressable onPress={() => setShowViewModal(true)}>
                <Text style={styles.summaryDetailLink}>상세보기</Text>
              </Pressable>
            </View>
            <Text style={styles.summaryLine}>총 비용: {formatCurrency(totalCost)}</Text>
            <Text style={styles.summaryLine}>정산 대상자: {targetCount}명</Text>
            <Text style={styles.summaryLine}>인당 비용: {formatCurrency(amountPerPerson)}</Text>
          </View>

          <View style={styles.costSection}>
            <Text style={styles.costTitle}>비용 정보</Text>
            {costFields.map((field) => (
              <View key={field.key} style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <View style={styles.readonlyInput}>
                  <Text style={styles.readonlyValue}>{field.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Text style={styles.helperText}>정산 정보가 아직 없습니다.</Text>
      )}

      {shouldShowForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{settlement ? '정산 수정' : '정산 생성'}</Text>
          {[
            { key: 'total_cost', label: '전체 비용 (원)', placeholder: '예: 210000' },
            { key: 'green_fee', label: '그린피 (원)', placeholder: '예: 150000' },
            { key: 'caddy_fee', label: '캐디피 (원)', placeholder: '예: 30000' },
            { key: 'cart_fee', label: '카트비 (원)', placeholder: '예: 30000' },
            { key: 'other_fee', label: '기타 비용 (원)', placeholder: '예: 0' },
          ].map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                value={settlementForm[field.key]}
                onChangeText={(value) => updateNumericField(field.key, value)}
                placeholder={field.placeholder}
                keyboardType="number-pad"
                style={styles.editInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
          ))}

          <Text style={styles.fieldLabel}>정산 방식</Text>
          <View style={styles.methodRow}>
            {methods.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.methodChip,
                  method === option.value && styles.methodChipActive,
                ]}
                onPress={() => setMethod(option.value)}
              >
                <Text
                  style={[
                    styles.methodChipText,
                    method === option.value && styles.methodChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {meetingType === 'ROUND' && (firstFiniteNumber(settlementForm.green_fee) > 0 || firstFiniteNumber(settlementForm.caddy_fee) > 0 || firstFiniteNumber(settlementForm.cart_fee) > 0) ? (
            <View style={styles.participantSection}>
              {method === 'EQUAL_SPLIT' ? (
                <>
                  <Text style={styles.participantSectionTitle}>정산 대상자 (N분의 1)</Text>
                  <Text style={styles.participantSectionHint}>
                    선택한 참가자에게 비용을 균등 분배합니다. 그린피·캐디피·카트비 모두 동일 대상으로 적용됩니다.
                  </Text>
                  <View style={styles.feeParticipantBlock}>
                    <View style={styles.feeParticipantHeader}>
                      <Text style={styles.feeParticipantLabel}>대상자 선택</Text>
                      <View style={styles.feeParticipantActions}>
                        <Pressable
                          style={styles.feeParticipantActionBtn}
                          onPress={() => {
                            setFeeParticipants({ green_fee: [...participantStorageKeys], caddy_fee: [...participantStorageKeys], cart_fee: [...participantStorageKeys] });
                          }}
                        >
                          <Text style={styles.feeParticipantActionText}>전체</Text>
                        </Pressable>
                        <Pressable
                          style={styles.feeParticipantActionBtn}
                          onPress={() => setFeeParticipants({ green_fee: [], caddy_fee: [], cart_fee: [] })}
                        >
                          <Text style={styles.feeParticipantActionText}>초기화</Text>
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.feeParticipantList}>
                      {participants.map((p, idx) => {
                        const storageKey = getParticipantStorageKey(p);
                        if (!storageKey) return null;
                        const isSelected = (feeParticipants.green_fee || []).includes(storageKey);
                        return (
                          <Pressable
                            key={getParticipantKey(p, idx)}
                            style={[
                              styles.feeParticipantChip,
                              isSelected && styles.feeParticipantChipActive,
                            ]}
                            onPress={() => {
                              const next = isSelected
                                ? (feeParticipants.green_fee || []).filter((k) => k !== storageKey)
                                : [...(feeParticipants.green_fee || []), storageKey];
                              setFeeParticipants({ green_fee: next, caddy_fee: next, cart_fee: next });
                            }}
                          >
                            <FontAwesome5
                              name={isSelected ? 'check-circle' : 'circle'}
                              size={14}
                              color={isSelected ? colors.primary[600] : colors.neutral[400]}
                              style={styles.feeParticipantIcon}
                            />
                            <Text
                              style={[
                                styles.feeParticipantChipText,
                                isSelected && styles.feeParticipantChipTextActive,
                              ]}
                            >
                              {getParticipantDisplayName(p)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.participantSectionTitle}>비용별 정산 대상 (개별 정산)</Text>
                  <Text style={styles.participantSectionHint}>
                    항목별로 부담 대상자를 다르게 선택할 수 있습니다.
                  </Text>
                  {[
                    { key: 'green_fee', label: '그린피', amount: firstFiniteNumber(settlementForm.green_fee) },
                    { key: 'caddy_fee', label: '캐디피', amount: firstFiniteNumber(settlementForm.caddy_fee) },
                    { key: 'cart_fee', label: '카트비', amount: firstFiniteNumber(settlementForm.cart_fee) },
                  ].filter((f) => f.amount > 0).map((fee) => (
                    <View key={fee.key} style={styles.feeParticipantBlock}>
                      <View style={styles.feeParticipantHeader}>
                        <Text style={styles.feeParticipantLabel}>{fee.label} ({formatCurrency(fee.amount)})</Text>
                        <View style={styles.feeParticipantActions}>
                          <Pressable
                            style={styles.feeParticipantActionBtn}
                            onPress={() => selectAllForFee(fee.key)}
                          >
                            <Text style={styles.feeParticipantActionText}>전체</Text>
                          </Pressable>
                          <Pressable
                            style={styles.feeParticipantActionBtn}
                            onPress={() => clearAllForFee(fee.key)}
                          >
                            <Text style={styles.feeParticipantActionText}>초기화</Text>
                          </Pressable>
                        </View>
                      </View>
                      <View style={styles.feeParticipantList}>
                        {participants.map((p, idx) => {
                          const storageKey = getParticipantStorageKey(p);
                          if (!storageKey) return null;
                          const isSelected = (feeParticipants[fee.key] || []).includes(storageKey);
                          return (
                            <Pressable
                              key={getParticipantKey(p, idx)}
                              style={[
                                styles.feeParticipantChip,
                                isSelected && styles.feeParticipantChipActive,
                              ]}
                              onPress={() => toggleFeeParticipant(fee.key, storageKey)}
                            >
                              <FontAwesome5
                                name={isSelected ? 'check-circle' : 'circle'}
                                size={14}
                                color={isSelected ? colors.primary[600] : colors.neutral[400]}
                                style={styles.feeParticipantIcon}
                              />
                              <Text
                                style={[
                                  styles.feeParticipantChipText,
                                  isSelected && styles.feeParticipantChipTextActive,
                                ]}
                              >
                                {getParticipantDisplayName(p)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {shouldShowForm ? (
        <Pressable
          style={[
            styles.fullButton,
            styles.editButton,
            saving && styles.buttonDisabled,
          ]}
          onPress={handleSaveSettlement}
          disabled={saving}
        >
          <Text style={styles.fullButtonText}>
            {saving ? '저장 중...' : settlement ? '정산 수정' : '정산 생성'}
          </Text>
        </Pressable>
      ) : canEditSettlement ? (
        <Pressable
          style={styles.fullButton}
          onPress={() => {
            setSettlementForm(makeSettlementForm(settlement, meeting));
            setShowEditForm(true);
          }}
        >
          <Text style={styles.fullButtonText}>정산 수정</Text>
        </Pressable>
      ) : null}

      {canConfirmSettlement ? (
        <Pressable style={[styles.fullButton, styles.confirmButton]} onPress={onConfirmSettlement}>
          <Text style={styles.fullButtonText}>정산 확정</Text>
        </Pressable>
      ) : null}

      {meeting?.settlement_confirmed ? (
        <View style={styles.confirmedNotice}>
          <Text style={styles.confirmedNoticeText}>정산이 확정되었습니다.</Text>
        </View>
      ) : null}

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
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: tokens.padding.md,
  },
  title: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm2,
  },
  helperText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  settlementContent: {
    gap: tokens.spacing.md,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
    gap: 12,
  },
  summaryHeaderText: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: '#1E3A8A',
  },
  summaryDetailLink: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.success[700],
  },
  summaryLine: {
    fontSize: tokens.font.lg,
    color: '#1D4ED8',
    marginBottom: tokens.spacing.xs,
  },
  costSection: {
    gap: tokens.spacing.sm,
  },
  costTitle: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  fieldBlock: {
    gap: tokens.spacing.xs,
  },
  fieldLabel: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
  },
  readonlyInput: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
  },
  readonlyValue: {
    fontSize: tokens.font.xl,
    color: colors.neutral[500],
  },
  formCard: {
    marginTop: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
    padding: tokens.padding.sm,
    gap: tokens.spacing.xs2,
  },
  formTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  editInput: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
    fontSize: tokens.font.lg,
    color: colors.neutral[900],
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: tokens.spacing.xs,
  },
  methodChip: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
  },
  methodChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  methodChipText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  methodChipTextActive: {
    color: colors.primary[700],
  },
  fullButton: {
    marginTop: tokens.spacing.sm2,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.success[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.padding.sm,
    paddingHorizontal: tokens.padding.sm,
  },
  editButton: {
    backgroundColor: colors.success[600],
  },
  confirmButton: {
    backgroundColor: '#4F46E5',
  },
  fullButtonText: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    marginTop: tokens.spacing.xs2,
    fontSize: tokens.font.sm,
    color: colors.error[600],
  },
  confirmedNotice: {
    marginTop: tokens.spacing.sm2,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.success[200],
    backgroundColor: colors.success[50],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
  },
  confirmedNoticeText: {
    fontSize: tokens.font.sm,
    color: colors.success[700],
    fontWeight: tokens.fontWeight.semibold,
    textAlign: 'center',
  },
  participantSection: {
    marginTop: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: tokens.spacing.md,
  },
  participantSectionTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[800],
  },
  participantSectionHint: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  feeParticipantBlock: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
    backgroundColor: colors.white,
  },
  feeParticipantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs2,
  },
  feeParticipantLabel: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
  },
  feeParticipantActions: {
    flexDirection: 'row',
    gap: 8,
  },
  feeParticipantActionBtn: {
    paddingHorizontal: tokens.padding.xs2,
    paddingVertical: 2,
  },
  feeParticipantActionText: {
    fontSize: tokens.font.xs,
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  feeParticipantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  feeParticipantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  feeParticipantChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  feeParticipantIcon: {
    marginRight: 2,
  },
  feeParticipantChipText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
  },
  feeParticipantChipTextActive: {
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
});
