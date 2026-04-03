import { FontAwesome5 } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { roundsApi } from '@/lib/api/api';
import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import Button from '../ui/Button';
import Modal from '../ui/Modal';

const ROUND_METHODS = [{ value: 'EQUAL_SPLIT', label: 'N분의 1' }];

const SOCIAL_METHODS = [
  { value: 'EQUAL_SPLIT', label: 'N분의 1' },
  { value: 'CLUB_FUND', label: '전체 회비에서 처리' },
];

function formatCurrency(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0원';
  const integer = Math.round(numeric);
  return `${integer.toLocaleString('ko-KR')}원`;
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

/** 라운딩 기타비용 항목 합계 */
function sumRoundingOtherItems(items) {
  return (items || []).reduce((s, i) => s + firstFiniteNumber(i?.amount), 0);
}

/** 소셜 비용: 회비 처리 항목은 N분의1·저장 total에서 제외 */
function sumSocialExpenseForSplit(items) {
  return (items || []).reduce((s, i) => {
    if (i?.covered_by_fee) return s;
    return s + firstFiniteNumber(i?.amount);
  }, 0);
}

function sumSocialExpenseAll(items) {
  return (items || []).reduce((s, i) => s + firstFiniteNumber(i?.amount), 0);
}

function onlyDigits(value) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

/** 소셜 비용 금액: 숫자만 + 앞자리 0 제거 (빈 값·단일 0은 유지) */
function normalizeSocialAmountDigits(value) {
  const digits = onlyDigits(value);
  if (digits === '') return '';
  const trimmed = digits.replace(/^0+/, '');
  return trimmed === '' ? '0' : trimmed;
}

/** 정산 금액을 100원 단위로 내림 (각자에서 떼어 낸 나머지는 개설자 부담) */
const SETTLEMENT_UNIT = 100;
function floorToSettlementUnit(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.floor(n / SETTLEMENT_UNIT) * SETTLEMENT_UNIT;
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
    // ROUND: 그린·캐디·카트 총액, 회비 지출, 메모
    membership_expense: onlyDigits(firstFiniteNumber(settlement?.membership_expense)),
    settlement_memo: String(settlement?.settlement_memo ?? settlement?.memo ?? '').trim(),
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
  _teams = [],
  canSettle,
  canManageSettlement,
  participants = [],
  onSettlementCreated,
  onConfirmSettlement,
  onSyncMeetingToSettlement,
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
    other_fee: [],
  });
  const [saving, setSaving] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [extraPayerId, setExtraPayerId] = useState(null);
  const [extraPayerByFee, setExtraPayerByFee] = useState({
    green_fee: null,
    caddy_fee: null,
    cart_fee: null,
    other_fee: null,
  });
  const [paySaving, setPaySaving] = useState(false);
  const [socialExpenseItems, setSocialExpenseItems] = useState([
    { id: '1', title: '', amount: '', memo: '', covered_by_fee: false },
    { id: '2', title: '', amount: '', memo: '', covered_by_fee: false },
  ]);
  /** ROUND 전용: 기타비용 항목 리스트 (항목명, 금액, 메모) */
  const [roundingOtherItems, setRoundingOtherItems] = useState([]);

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
      let nextMethod = String(settlement?.settlement_method || settlement?.method || 'EQUAL_SPLIT');
      if (meetingType === 'SOCIAL' && nextMethod === 'TREASURER_PREPAID') {
        nextMethod = 'CLUB_FUND';
      }
      setMethod(nextMethod);
      if (meetingType === 'SOCIAL') {
        const targets = settlement?.settlement_targets ?? settlement?.target_ids ?? [];
        const raw = Array.isArray(targets) ? targets : [];
        const ids = raw.map((t) => (typeof t === 'object' && t != null ? t?.user_id ?? t?.guest_id ?? t?.participant_id ?? t?.id : t));
        const keys = ids
          .filter((id) => id != null && id !== '')
          .map((id) => {
            const p = participants.find(
              (q) => Number(q?.user_id) === Number(id) || Number(q?.guest_id) === Number(id) || Number(q?.id) === Number(id)
            );
            return p ? getParticipantStorageKey(p) : null;
          })
          .filter(Boolean);
        setFeeParticipants((prev) => ({ ...prev, other_fee: keys }));
        if (settlement?.expense_items?.length > 0) {
          setSocialExpenseItems(
            settlement.expense_items.map((item, idx) => ({
              id: String(item.id ?? idx + 1),
              title: item.title != null && String(item.title).trim() !== '' ? String(item.title) : '',
              amount: normalizeSocialAmountDigits(String(item.amount ?? '')),
              memo: String(item.memo ?? '').trim(),
              covered_by_fee: Boolean(item.covered_by_fee),
            }))
          );
        } else if (settlement?.other_fee != null && Number(settlement.other_fee) > 0) {
          setSocialExpenseItems([
            {
              id: '1',
              title: '기타 비용',
              amount: normalizeSocialAmountDigits(String(settlement.other_fee)),
              memo: '',
              covered_by_fee: false,
            },
          ]);
        }
      }
      if (meetingType === 'ROUND') {
        const ep = settlement?.extra_payer_id ?? null;
        setExtraPayerId(ep);
        const idsToKeys = (ids) => (Array.isArray(ids) ? ids : [])
          .filter((id) => id != null && id !== '')
          .map((id) => {
            const p = participants.find(
              (q) => Number(q?.user_id) === Number(id) || Number(q?.guest_id) === Number(id) || Number(q?.id) === Number(id)
            );
            return p ? getParticipantStorageKey(p) : null;
          })
          .filter(Boolean);
        const g = idsToKeys(settlement.green_fee_participants);
        const c = idsToKeys(settlement.caddy_fee_participants);
        const k = idsToKeys(settlement.cart_fee_participants);
        const firstOther = settlement.other_expense_items?.[0];
        const o = firstOther ? idsToKeys(firstOther.participants) : [];
        if (g.length > 0 || c.length > 0 || k.length > 0 || o.length > 0) {
          const firstKey = g[0] ?? c[0] ?? k[0] ?? o[0];
          const firstP = participants.find((q) => getParticipantStorageKey(q) === firstKey);
          setExtraPayerId(
            settlement?.extra_payer_id ?? (firstP?.id != null ? firstP.id : null)
          );
          setExtraPayerByFee({
            green_fee: settlement?.green_fee_extra_payer_id ?? null,
            caddy_fee: settlement?.caddy_fee_extra_payer_id ?? null,
            cart_fee: settlement?.cart_fee_extra_payer_id ?? null,
            other_fee: settlement?.other_fee_extra_payer_id ?? null,
          });
          setFeeParticipants((prev) => ({
            ...prev,
            green_fee: g.length ? g : prev.green_fee || [],
            caddy_fee: c.length ? c : prev.caddy_fee || [],
            cart_fee: k.length ? k : prev.cart_fee || [],
            other_fee: o.length ? o : prev.other_fee || [],
          }));
        }
        // 기타비용 항목 리스트 복원
        const items = settlement?.other_expense_items;
        if (Array.isArray(items) && items.length > 0) {
          setRoundingOtherItems(
            items.map((item, idx) => ({
              id: String(item.id ?? idx + 1 ?? Date.now()),
              title: String(item.title ?? '기타').trim() || '기타',
              amount: String(item.amount ?? ''),
              memo: String(item.memo ?? '').trim(),
            }))
          );
        } else if (firstFiniteNumber(settlement?.other_fee) > 0) {
          setRoundingOtherItems([
            { id: '1', title: '기타 비용', amount: String(settlement.other_fee), memo: '' },
          ]);
        }
        setSettlementForm((prev) => ({
          ...prev,
          membership_expense: onlyDigits(firstFiniteNumber(settlement?.membership_expense)),
          settlement_memo: String(settlement?.settlement_memo ?? settlement?.memo ?? '').trim(),
        }));
      }
    }
  }, [settlement, meeting, meetingType, participants]);

  /** ROUND: 정산 대상자 = 항상 전체 인원, 나머지 부담 = 개설자 */
  const organizerParticipantId = useMemo(() => {
    const creatorId = meeting?.created_by ?? meeting?.creator_id;
    if (creatorId == null) return participants[0]?.id ?? null;
    const p = participants.find(
      (q) => `${q?.user_id}` === `${creatorId}` || `${q?.id}` === `${creatorId}`
    );
    return p?.id ?? participants[0]?.id ?? null;
  }, [meeting?.created_by, meeting?.creator_id, participants]);

  useEffect(() => {
    if (meetingType !== 'ROUND') return;
    const allKeys = participants.map(getParticipantStorageKey).filter(Boolean);
    if (allKeys.length === 0) return;
    setFeeParticipants((prev) => ({
      ...prev,
      green_fee: [...allKeys],
      caddy_fee: [...allKeys],
      cart_fee: [...allKeys],
      other_fee: [...allKeys],
    }));
  }, [meetingType, participants]);

  useEffect(() => {
    if (meetingType === 'ROUND' && extraPayerId == null && organizerParticipantId != null) {
      setExtraPayerId(organizerParticipantId);
    }
  }, [meetingType, extraPayerId, organizerParticipantId]);

  const participantStorageKeys = useMemo(
    () => participants.map(getParticipantStorageKey).filter(Boolean),
    [participants]
  );

  const _toggleFeeParticipant = useCallback((feeKey, storageKey) => {
    setFeeParticipants((prev) => {
      const current = prev[feeKey] || [];
      const next = current.includes(storageKey)
        ? current.filter((k) => k !== storageKey)
        : [...current, storageKey];
      return { ...prev, [feeKey]: next };
    });
  }, []);

  const _selectAllForFee = useCallback((feeKey) => {
    setFeeParticipants((prev) => ({ ...prev, [feeKey]: [...participantStorageKeys] }));
  }, [participantStorageKeys]);

  const _clearAllForFee = useCallback((feeKey) => {
    setFeeParticipants((prev) => ({ ...prev, [feeKey]: [] }));
  }, []);

  /** 선택된 storage key들을 MeetingParticipant.id 배열로 변환 (백엔드 전송용)
   * user_id/guest_id 대신 반드시 MeetingParticipant.id 사용 - user_id=1과 guest_id=1 충돌 방지 */
  const feeParticipantsToIds = useCallback((feeKey) => {
    const keys = feeParticipants[feeKey] || [];
    return keys
      .map((storageKey) => {
        const p = participants.find((q) => getParticipantStorageKey(q) === storageKey);
        if (!p) {
          if (storageKey.startsWith('id:')) return Number(storageKey.slice(3));
          return null;
        }
        return p?.id ?? null;
      })
      .filter((id) => id != null && id !== '');
  }, [feeParticipants, participants]);

  /** 소셜 정산용: 정산 대상자 = 전체 인원 (MeetingParticipant.id) */
  const settlementTargetsForSocial = useCallback(() => {
    return (participants || [])
      .map((p) => p?.id)
      .filter((id) => id != null && id !== '');
  }, [participants]);

  const methods = meetingType === 'SOCIAL' ? SOCIAL_METHODS : ROUND_METHODS;

  const _handleOpenPayModal = useCallback((p) => {
    setPayTarget(p);
    setPayAmount(p?.amount_paid != null && p.amount_paid > 0 ? String(p.amount_paid) : '');
    setPayModalOpen(true);
  }, []);

  const handleMarkPaid = useCallback(async () => {
    if (!payTarget || !settlement?.id || !meetingId) return;
    setPaySaving(true);
    try {
      const data = {
        user_id: payTarget.user_id ?? null,
        guest_id: payTarget.guest_id ?? null,
        is_paid: true,
        amount_paid: payAmount ? parseFloat(payAmount) : null,
      };
      await roundsApi.markParticipantPaid(meetingId, settlement.id, data);
      setPayModalOpen(false);
      setPayTarget(null);
      setPayAmount('');
      await fetchSettlement();
    } catch (err) {
      console.error('납부 완료 처리 실패:', err);
    } finally {
      setPaySaving(false);
    }
  }, [payTarget, payAmount, settlement?.id, meetingId, fetchSettlement]);

  const handleMarkUnpaid = useCallback(async () => {
    if (!payTarget || !settlement?.id || !meetingId) return;
    setPaySaving(true);
    try {
      const data = {
        user_id: payTarget.user_id ?? null,
        guest_id: payTarget.guest_id ?? null,
        is_paid: false,
      };
      await roundsApi.markParticipantPaid(meetingId, settlement.id, data);
      setPayModalOpen(false);
      setPayTarget(null);
      setPayAmount('');
      await fetchSettlement();
    } catch (err) {
      console.error('미납부 변경 실패:', err);
    } finally {
      setPaySaving(false);
    }
  }, [payTarget, settlement?.id, meetingId, fetchSettlement]);

  /** ROUND: 참가자 수 (안내 문구용) */
  const participantCount = participants.length || 0;

  /** 정산 생성/수정 폼: SOCIAL은 항목 전체 합계(표시용), ROUND는 소계(그린+캐디+카트+기타리스트) */
  const calculatedTotalCost = useMemo(() => {
    if (meetingType === 'SOCIAL') {
      return sumSocialExpenseAll(socialExpenseItems);
    }
    const g = firstFiniteNumber(settlementForm.green_fee);
    const caddy = firstFiniteNumber(settlementForm.caddy_fee);
    const cart = firstFiniteNumber(settlementForm.cart_fee);
    const otherSum = sumRoundingOtherItems(roundingOtherItems);
    return g + caddy + cart + otherSum;
  }, [meetingType, socialExpenseItems, settlementForm.green_fee, settlementForm.caddy_fee, settlementForm.cart_fee, roundingOtherItems]);

  /** 소셜 N분의1: 참가자가 나눌 금액(회비 처리 항목 제외) */
  const _socialExpenseSplitTotal = useMemo(
    () => (meetingType === 'SOCIAL' ? sumSocialExpenseForSplit(socialExpenseItems) : 0),
    [meetingType, socialExpenseItems]
  );

  /** ROUND 전용: 소계(비용 합), 회비 지출, 총계(소계 - 회비 지출) */
  const roundingSubtotal = calculatedTotalCost;
  const roundingMembershipExpense = firstFiniteNumber(settlementForm.membership_expense);
  const roundingTotal = Math.max(0, roundingSubtotal - roundingMembershipExpense);

  /** ROUND N분의1: 총 분배액(roundingTotal)을 참가자 수로 균등 분배, 100원 단위 내림 후 나머지는 개설자 */
  const roundParticipantAmounts = useMemo(() => {
    if (meetingType !== 'ROUND' || method !== 'EQUAL_SPLIT') return [];
    const n = participants.length || 1;
    if (n === 0) return [];
    const totalForSplit = roundingTotal;
    const perRaw = n > 0 ? Math.floor(totalForSplit / n) : 0;
    const share = floorToSettlementUnit(perRaw);
    const amounts = [];
    participants.forEach((p) => {
      const pid = p?.id ?? null;
      if (pid == null) return;
      amounts.push({
        participantId: pid,
        amount: share,
        name: getParticipantDisplayName(p),
      });
    });
    const sumFloored = amounts.reduce((s, a) => s + a.amount, 0);
    const remainder = totalForSplit - sumFloored;
    if (remainder !== 0 && organizerParticipantId != null) {
      const organ = amounts.find((a) => a.participantId === organizerParticipantId);
      if (organ) organ.amount += remainder;
    }
    return amounts;
  }, [meetingType, method, participants, roundingTotal, organizerParticipantId]);

  const targetCount = useMemo(() => {
    const fromField = firstFiniteNumber(
      settlement?.total_participants,
      settlement?.participant_count
    );
    if (fromField > 0) return fromField;
    if (Array.isArray(settlement?.settlement_targets)) return settlement.settlement_targets.length;
    return participants.length;
  }, [participants.length, settlement?.participant_count, settlement?.settlement_targets, settlement?.total_participants]);

  /** 개별 정산일 때 비용별·인당 부담액 (정산 정보 카드용) */
  const individualBreakdown = useMemo(() => {
    if (method !== 'INDIVIDUAL' || !settlement) return [];
    const rows = [];
    const findName = (id) => {
      const numId = Number(id);
      if (!Number.isFinite(numId)) return `#${id}`;
      const p = participants.find((q) => Number(q?.id) === numId)
        ?? participants.find((q) => Number(q?.user_id) === numId)
        ?? participants.find((q) => Number(q?.guest_id) === numId);
      return p ? getParticipantDisplayName(p) : `#${id}`;
    };
    if (meetingType === 'ROUND') {
      [
        { key: 'green_fee', label: '그린피', amount: firstFiniteNumber(settlement.green_fee), ids: settlement.green_fee_participants || [] },
        { key: 'caddy_fee', label: '캐디피', amount: firstFiniteNumber(settlement.caddy_fee), ids: settlement.caddy_fee_participants || [] },
        { key: 'cart_fee', label: '카트비', amount: firstFiniteNumber(settlement.cart_fee), ids: settlement.cart_fee_participants || [] },
      ].forEach(({ label, amount, ids }) => {
        if (amount <= 0) return;
        const count = ids.length || 1;
        const perPerson = Math.round(amount / count);
        const names = ids.length ? ids.map(findName) : ['-'];
        rows.push({
          label,
          total: amount,
          lines: names.map((name) => ({ name, amount: perPerson })),
        });
      });
      (settlement.other_expense_items || []).forEach((item) => {
        const amount = firstFiniteNumber(item.amount);
        const ids = item.participants || [];
        if (amount <= 0) return;
        const count = ids.length || 1;
        const perPerson = Math.round(amount / count);
        const names = ids.length ? ids.map(findName) : ['-'];
        rows.push({
          label: item.title || '기타',
          total: amount,
          lines: names.map((name) => ({ name, amount: perPerson })),
        });
      });
    } else {
      (settlement.expense_items || []).forEach((item) => {
        if (item?.covered_by_fee) return;
        const amount = firstFiniteNumber(item.amount);
        const ids = item.participants || [];
        if (amount <= 0) return;
        const count = ids.length || 1;
        const perPerson = Math.round(amount / count);
        const names = ids.length ? ids.map(findName) : ['-'];
        rows.push({
          label: item.title || '기타',
          total: amount,
          lines: names.map((name) => ({ name, amount: perPerson })),
        });
      });
    }
    return rows;
  }, [method, meetingType, settlement, participants]);

  const costFields = useMemo(() => {
    const otherFeeField = {
      key: 'other_fee',
      label: '기타 비용 (원)',
      value: formatInputNumber(settlement?.other_fee),
    };
    const roundingFeeFields = [
      { key: 'green_fee', label: '그린피(인당)', value: formatInputNumber(settlement?.green_fee) },
      { key: 'caddy_fee', label: '캐디비(팀당)', value: formatInputNumber(settlement?.caddy_fee) },
      { key: 'cart_fee', label: '카트비(팀당)', value: formatInputNumber(settlement?.cart_fee) },
      otherFeeField,
    ];
    if (meetingType === 'SOCIAL') {
      if (settlement?.expense_items?.length > 0) {
        const indexed = settlement.expense_items.map((item, idx) => ({ item, idx }));
        indexed.sort((a, b) => {
          const ac = Boolean(a.item.covered_by_fee);
          const bc = Boolean(b.item.covered_by_fee);
          if (ac !== bc) return ac ? -1 : 1;
          return a.idx - b.idx;
        });
        const items = indexed.map(({ item }) => {
          const raw = firstFiniteNumber(item.amount);
          const covered = Boolean(item.covered_by_fee);
          const memoOnly = item.memo && String(item.memo).trim();
          return {
            key: `item_${item.id}`,
            label: item.title || '항목',
            value: formatInputNumber(raw),
            memo: memoOnly || null,
            coveredByFee: covered,
          };
        });
        return items;
      }
      return [otherFeeField];
    }
    // ROUND: 기타비용은 other_expense_items로 따로 상세 표기하므로 목록에서 제외
    if (meetingType === 'ROUND' && Array.isArray(settlement?.other_expense_items) && settlement.other_expense_items.length > 0) {
      return roundingFeeFields.filter((f) => f.key !== 'other_fee');
    }
    return roundingFeeFields;
  }, [meetingType, settlement?.caddy_fee, settlement?.cart_fee, settlement?.expense_items, settlement?.green_fee, settlement?.other_fee, settlement?.other_expense_items]);

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

  const addSocialExpenseItem = useCallback(() => {
    setSocialExpenseItems((prev) => [
      ...prev,
      { id: String(Date.now()), title: '', amount: '', memo: '', covered_by_fee: false },
    ]);
  }, []);

  const removeSocialExpenseItem = useCallback((id) => {
    setSocialExpenseItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateSocialExpenseItem = useCallback((id, field, value) => {
    setSocialExpenseItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === 'amount'
                  ? normalizeSocialAmountDigits(value)
                  : field === 'covered_by_fee'
                    ? Boolean(value)
                    : value,
            }
          : item
      )
    );
  }, []);

  /** ROUND 기타비용 항목 추가/삭제/수정 */
  const addRoundingOtherItem = useCallback(() => {
    setRoundingOtherItems((prev) => [
      ...prev,
      { id: String(Date.now()), title: '', amount: '', memo: '' },
    ]);
  }, []);
  const removeRoundingOtherItem = useCallback((id) => {
    setRoundingOtherItems((prev) => prev.filter((item) => item.id !== id));
  }, []);
  const updateRoundingOtherItem = useCallback((id, field, value) => {
    setRoundingOtherItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: field === 'amount' ? onlyDigits(value) : value }
          : item
      )
    );
  }, []);

  const handleSaveSettlement = useCallback(async () => {
    if (!meetingId) return;

    const socialAll =
      meetingType === 'SOCIAL' ? sumSocialExpenseAll(socialExpenseItems) : 0;
    const socialSplit =
      meetingType === 'SOCIAL' ? sumSocialExpenseForSplit(socialExpenseItems) : 0;
    const numericTotalCost =
      meetingType === 'ROUND'
        ? roundingTotal
        : meetingType === 'SOCIAL' && method === 'EQUAL_SPLIT'
          ? socialSplit
          : calculatedTotalCost;
    if (!Number.isFinite(numericTotalCost) || numericTotalCost <= 0) {
      setError(
        meetingType === 'ROUND'
          ? '비용 합계에서 회비 지출을 뺀 금액이 0보다 커야 합니다.'
          : meetingType === 'SOCIAL' && method === 'EQUAL_SPLIT' && socialAll > 0
            ? '참가자가 분담할 금액이 없습니다. 항목을 해제하거나 「전체 회비에서 처리」를 선택하세요.'
            : '비용 항목을 입력해주세요. (총합이 0보다 커야 합니다)'
      );
      return;
    }

    const greenFee = meetingType === 'ROUND' ? firstFiniteNumber(settlementForm.green_fee) : 0;
    const caddyFee = meetingType === 'ROUND' ? firstFiniteNumber(settlementForm.caddy_fee) : 0;
    const cartFee = meetingType === 'ROUND' ? firstFiniteNumber(settlementForm.cart_fee) : 0;
    const otherFeeSum = meetingType === 'ROUND' ? sumRoundingOtherItems(roundingOtherItems) : 0;

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
      if (otherFeeSum > 0 && method === 'INDIVIDUAL' && (feeParticipants.other_fee || []).length === 0) {
        setError('기타 비용의 정산 대상자를 선택해주세요.');
        return;
      }
      if (otherFeeSum > 0 && method === 'EQUAL_SPLIT' && (feeParticipants.other_fee || []).length === 0) {
        setError('기타 비용의 정산 대상자를 선택해주세요.');
        return;
      }
    }

    if (meetingType === 'SOCIAL') {
      const validItems = socialExpenseItems.filter((item) => firstFiniteNumber(item.amount) > 0);
      if (validItems.length === 0) {
        setError('비용 항목을 1개 이상 입력해주세요. (점심비, 회의비, 대여비 등)');
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
        other_fee: meetingType === 'ROUND' ? otherFeeSum : firstFiniteNumber(settlementForm.other_fee),
        settlement_method: method,
      };

      if (meetingType === 'ROUND') {
        payload.membership_expense = roundingMembershipExpense;
        if (String(settlementForm.settlement_memo ?? '').trim()) {
          payload.settlement_memo = String(settlementForm.settlement_memo).trim();
        }
        payload.green_fee_participants = greenFee > 0 ? [...feeParticipantsToIds('green_fee')] : [];
        if (method === 'EQUAL_SPLIT') {
          payload.extra_payer_id = organizerParticipantId ?? extraPayerId ?? feeParticipantsToIds('green_fee')[0] ?? null;
          if (roundParticipantAmounts.length > 0) {
            payload.participant_amounts = roundParticipantAmounts.map(({ participantId, amount }) => ({
              participant_id: participantId,
              amount,
            }));
          }
        } else if (method === 'INDIVIDUAL') {
          const gIds = feeParticipantsToIds('green_fee');
          const cIds = feeParticipantsToIds('caddy_fee');
          const kIds = feeParticipantsToIds('cart_fee');
          payload.green_fee_extra_payer_id = extraPayerByFee.green_fee ?? gIds[0] ?? null;
          payload.caddy_fee_extra_payer_id = extraPayerByFee.caddy_fee ?? cIds[0] ?? null;
          payload.cart_fee_extra_payer_id = extraPayerByFee.cart_fee ?? kIds[0] ?? null;
        }
        payload.caddy_fee_participants = caddyFee > 0 ? [...feeParticipantsToIds('caddy_fee')] : [];
        payload.cart_fee_participants = cartFee > 0 ? [...feeParticipantsToIds('cart_fee')] : [];
        const otherParticipantIds =
          otherFeeSum > 0
            ? method === 'INDIVIDUAL'
              ? [...feeParticipantsToIds('other_fee')]
              : (() => {
                  const greenIds = payload.green_fee_participants || [];
                  const caddyIds = payload.caddy_fee_participants || [];
                  const cartIds = payload.cart_fee_participants || [];
                  let ids = greenIds.length ? greenIds : caddyIds.length ? caddyIds : cartIds.length ? cartIds : [];
                  if (ids.length === 0) ids = participants.map((p) => p.id).filter((id) => id != null);
                  return ids;
                })()
            : [];
        if (otherFeeSum > 0 && otherParticipantIds.length === 0) {
          setError('기타 비용의 정산 대상자를 선택해주세요.');
          setSaving(false);
          return;
        }
        const validOtherItems = (roundingOtherItems || []).filter(
          (item) => (item.title || '').trim() !== '' && firstFiniteNumber(item.amount) > 0
        );
        payload.other_expense_items = validOtherItems.map((item) => ({
          title: (item.title || '기타').trim(),
          amount: firstFiniteNumber(item.amount),
          memo: (item.memo || '').trim() || undefined,
          participants: otherParticipantIds,
          extra_payer_id:
            method === 'INDIVIDUAL' && otherParticipantIds.length > 0
              ? (extraPayerByFee.other_fee ?? otherParticipantIds[0])
              : null,
        }));
      }

      if (meetingType === 'SOCIAL') {
        const validItems = socialExpenseItems.filter((item) => firstFiniteNumber(item.amount) > 0);
        payload.expense_items = validItems.map((item) => ({
          title: (item.title || '항목').trim() || '항목',
          amount: firstFiniteNumber(item.amount),
          memo: (item.memo || '').trim() || undefined,
          covered_by_fee: Boolean(item.covered_by_fee),
        }));
        payload.total_cost = numericTotalCost;
        payload.exclude_remaining_amount = method === 'CLUB_FUND';
        if (method === 'EQUAL_SPLIT') {
          payload.settlement_targets = settlementTargetsForSocial();
        } else {
          payload.settlement_targets = [];
        }
      }

      if (meetingType === 'SOCIAL') {
        if (settlement?.id != null) {
          await roundsApi.updateEventSettlement(meetingId, payload);
        } else {
          await roundsApi.createEventSettlement(meetingId, payload);
        }
      } else {
        if (settlement?.id != null) {
          await roundsApi.updateRoundingSettlement(meetingId, payload);
        } else {
          await roundsApi.createRoundingSettlement(meetingId, payload);
        }
      }

      if (typeof onSyncMeetingToSettlement === 'function') {
        const meetingPayload =
          meetingType === 'ROUND'
            ? {
                green_fee: greenFee,
                caddy_fee: caddyFee,
                cart_fee: cartFee,
                other_fee: otherFeeSum,
                total_cost: numericTotalCost,
                total_amount: numericTotalCost,
                settlement_method: method,
              }
            : {
                other_fee: firstFiniteNumber(settlementForm.other_fee),
                total_cost: numericTotalCost,
                total_amount: numericTotalCost,
                settlement_method: method,
              };
        try {
          const result = onSyncMeetingToSettlement(meetingPayload);
          if (result && typeof result.then === 'function') {
            await result;
          }
        } catch (syncError) {
          console.warn('모임 정보 동기화 실패:', syncError);
        }
      }

      // 저장 직후 선택한 정산 방법을 UI에 즉시 반영 (refetch 전에도 개별정산 등으로 표시)
      setMethod(String(method || 'EQUAL_SPLIT'));

      if (onSettlementCreated) {
        const result = onSettlementCreated();
        if (result && typeof result.then === 'function') {
          await result;
        }
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
    calculatedTotalCost,
    fetchSettlement,
    feeParticipants,
    feeParticipantsToIds,
    meetingId,
    meetingType,
    method,
    onSettlementCreated,
    onSyncMeetingToSettlement,
    settlement,
    settlementForm,
    settlementTargetsForSocial,
    extraPayerId,
    extraPayerByFee,
    participants,
    socialExpenseItems,
    roundingTotal,
    roundingMembershipExpense,
    roundingOtherItems,
    organizerParticipantId,
    roundParticipantAmounts,
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
            </View>
            {method === 'INDIVIDUAL' && individualBreakdown.length > 0 ? (
              individualBreakdown.map((row, idx) => (
                <View key={`breakdown-${row.label}-${idx}`} style={styles.summaryBreakdownBlock}>
                  <Text style={styles.summaryBreakdownLabel}>
                    {row.label} {formatCurrency(row.total)}
                  </Text>
                  {row.lines.map((line, idx) => (
                    <Text key={idx} style={styles.summaryBreakdownLine}>
                      {line.name}: {formatCurrency(line.amount)}
                    </Text>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.summaryLine}>정산 대상자: {targetCount}명</Text>
            )}
          </View>

          <View style={styles.costSection}>
            <Text style={styles.costTitle}>비용 정보</Text>
            {costFields.map((field) => (
              <View
                key={field.key}
                style={[styles.fieldBlock, field.coveredByFee && styles.fieldBlockFeeCovered]}
              >
                <View style={styles.costFieldLabelRow}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  {field.coveredByFee ? (
                    <View style={styles.feeCoveredBadge}>
                      <FontAwesome5 name="wallet" size={11} color={colors.primary[800]} style={styles.feeCoveredBadgeIcon} />
                      <Text style={styles.feeCoveredBadgeText}>회비 처리</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.readonlyInput}>
                  <Text style={styles.readonlyValue}>{field.value}</Text>
                </View>
                {field.memo ? (
                  <Text style={styles.otherExpenseDetailMemo}>{field.memo}</Text>
                ) : null}
              </View>
            ))}
            {meetingType === 'ROUND' &&
            Array.isArray(settlement?.other_expense_items) &&
            settlement.other_expense_items.length > 0 ? (
              <View style={styles.otherExpenseDetailBlock}>
                <Text style={styles.fieldLabel}>기타 비용 (상세)</Text>
                {(settlement.other_expense_items || []).map((item, idx) => (
                  <View key={item.id ?? idx} style={styles.otherExpenseDetailRow}>
                    <View style={styles.otherExpenseDetailMain}>
                      <Text style={styles.otherExpenseDetailTitle}>{item.title || '항목'}</Text>
                      <Text style={styles.otherExpenseDetailAmount}>{formatCurrency(firstFiniteNumber(item.amount))}</Text>
                    </View>
                    {item.memo ? (
                      <Text style={styles.otherExpenseDetailMemo}>{item.memo}</Text>
                    ) : null}
                  </View>
                ))}
                <View style={styles.otherExpenseDetailTotal}>
                  <Text style={styles.fieldLabel}>기타 비용 합계</Text>
                  <View style={styles.readonlyInput}>
                    <Text style={styles.readonlyValue}>
                      {formatCurrency(firstFiniteNumber(settlement?.other_fee) || (settlement.other_expense_items || []).reduce((s, i) => s + firstFiniteNumber(i.amount), 0))}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

        </View>
      ) : (
        <Text style={styles.helperText}>정산 정보가 아직 없습니다.</Text>
      )}

      {shouldShowForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{settlement ? '정산 수정' : '정산 생성'}</Text>
          {meetingType === 'SOCIAL' ? (
            <>
            <View style={styles.socialExpenseItemsBlock}>
              <Text style={styles.fieldLabel}>비용 항목 (항목명, 금액, 메모)</Text>
              <Text style={styles.socialExpenseItemsHint}>
                N분의 1일 때 항목마다 아래 ✓를 켜면 해당 금액은 참가자 분담 합계에서 빠집니다.
              </Text>
              {socialExpenseItems.map((item, idx) => (
                <View key={`expense-${item.id}-${idx}`} style={styles.socialExpenseItemBlock}>
                  <View style={styles.socialExpenseItemRow}>
                    <TextInput
                      style={[styles.editInput, styles.socialExpenseItemTitle]}
                      value={item.title}
                      onChangeText={(v) => updateSocialExpenseItem(item.id, 'title', v)}
                      placeholder="항목명"
                      placeholderTextColor={colors.neutral[400]}
                    />
                    <TextInput
                      style={[styles.editInput, styles.socialExpenseItemAmount]}
                      value={item.amount}
                      onChangeText={(v) => updateSocialExpenseItem(item.id, 'amount', v)}
                      placeholder="금액"
                      placeholderTextColor={colors.neutral[400]}
                      keyboardType="number-pad"
                    />
                    <TextInput
                      style={[styles.editInput, styles.socialExpenseItemMemo]}
                      value={item.memo}
                      onChangeText={(v) => updateSocialExpenseItem(item.id, 'memo', v)}
                      placeholder="메모"
                      placeholderTextColor={colors.neutral[400]}
                    />
                    <View style={styles.socialExpenseItemRightCol}>
                      <Text style={styles.socialFeeCoveredHint}>
                        회비에서 처리 — 아래 ✓ 버튼으로 선택
                      </Text>
                      <View style={styles.socialExpenseItemActions}>
                        <Pressable
                          style={styles.socialExpenseItemRemove}
                          onPress={() => removeSocialExpenseItem(item.id)}
                        >
                          <FontAwesome5 name="times-circle" size={20} color={colors.error[500]} />
                        </Pressable>
                        <Pressable
                          style={[
                            styles.socialFeeCoveredCheckBtn,
                            item.covered_by_fee && styles.socialFeeCoveredCheckBtnActive,
                          ]}
                          onPress={() =>
                            updateSocialExpenseItem(item.id, 'covered_by_fee', !item.covered_by_fee)
                          }
                          accessibilityLabel="회비에서 처리"
                          accessibilityState={{ checked: Boolean(item.covered_by_fee) }}
                        >
                          <FontAwesome5
                            name="check"
                            size={16}
                            color={item.covered_by_fee ? colors.white : colors.neutral[400]}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              <Button variant="primary" style={styles.addSocialExpenseItemBtn} onPress={addSocialExpenseItem}>
                <FontAwesome5 name="plus-circle" size={16} color={colors.white} />
                <Text style={styles.addSocialExpenseItemBtnText}>항목 추가</Text>
              </Button>
            </View>
            </>
          ) : (
            <>
            {/* ROUND: 그린·캐디·카트 총액 · 기타비용 리스트 · 회비 지출 · 메모 */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>그린피 (원)</Text>
              <TextInput
                value={settlementForm.green_fee}
                onChangeText={(v) => updateNumericField('green_fee', v)}
                placeholder="0"
                keyboardType="number-pad"
                style={styles.editInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>캐디비 (원)</Text>
              <TextInput
                value={settlementForm.caddy_fee}
                onChangeText={(v) => updateNumericField('caddy_fee', v)}
                placeholder="0"
                keyboardType="number-pad"
                style={styles.editInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>카트비 (원)</Text>
              <TextInput
                value={settlementForm.cart_fee}
                onChangeText={(v) => updateNumericField('cart_fee', v)}
                placeholder="0"
                keyboardType="number-pad"
                style={styles.editInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>기타 비용 (항목명, 금액, 메모)</Text>
              {(roundingOtherItems || []).map((item) => (
                <View key={item.id} style={styles.roundingOtherItemRow}>
                  <TextInput
                    style={[styles.editInput, styles.roundingOtherTitle]}
                    value={item.title}
                    onChangeText={(v) => updateRoundingOtherItem(item.id, 'title', v)}
                    placeholder="항목명"
                    placeholderTextColor={colors.neutral[400]}
                  />
                  <TextInput
                    style={[styles.editInput, styles.roundingOtherAmount]}
                    value={item.amount}
                    onChangeText={(v) => updateRoundingOtherItem(item.id, 'amount', v)}
                    placeholder="금액"
                    placeholderTextColor={colors.neutral[400]}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={[styles.editInput, styles.roundingOtherMemo]}
                    value={item.memo}
                    onChangeText={(v) => updateRoundingOtherItem(item.id, 'memo', v)}
                    placeholder="메모(선택)"
                    placeholderTextColor={colors.neutral[400]}
                  />
                  <Pressable
                    style={styles.roundingOtherRemove}
                    onPress={() => removeRoundingOtherItem(item.id)}
                  >
                    <FontAwesome5 name="times-circle" size={20} color={colors.error[500]} />
                  </Pressable>
                </View>
              ))}
              <Button variant="primary" style={styles.addSocialExpenseItemBtn} onPress={addRoundingOtherItem}>
                <FontAwesome5 name="plus-circle" size={16} color={colors.white} />
                <Text style={styles.addSocialExpenseItemBtnText}>기타비용 항목 추가</Text>
              </Button>
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>회비 지출 금액 (원)</Text>
              <TextInput
                value={settlementForm.membership_expense}
                onChangeText={(v) =>
                  setSettlementForm((prev) => ({ ...prev, membership_expense: onlyDigits(v) }))
                }
                placeholder="0"
                keyboardType="number-pad"
                style={styles.editInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>메모 (특이사항, 선택)</Text>
              <TextInput
                value={settlementForm.settlement_memo}
                onChangeText={(v) =>
                  setSettlementForm((prev) => ({ ...prev, settlement_memo: v }))
                }
                placeholder="특이사항 입력"
                style={[styles.editInput, styles.memoInput]}
                placeholderTextColor={colors.neutral[400]}
                multiline
              />
            </View>
            </>
          )}

          <Text style={styles.fieldLabel}>정산 방식</Text>
          {meetingType === 'ROUND' ? (
            <View style={styles.methodRow}>
              <Text style={styles.roundSettlementMethodNote}>
                N분의 1 (전체 인원으로 균등 분배, 나머지는 개설자 부담)
              </Text>
            </View>
          ) : (
          <View style={styles.methodRow}>
            {methods.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.methodChip,
                  method === option.value && styles.methodChipActive,
                ]}
                onPress={() => {
                  setMethod(option.value);
                }}
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
          )}

          {meetingType === 'SOCIAL' && calculatedTotalCost > 0 && method === 'EQUAL_SPLIT' ? (
            <View style={styles.participantSection}>
              <Text style={styles.participantSectionTitle}>정산 방식</Text>
              <Text style={styles.participantSectionHint}>
                전체 인원 N분의 1로 분배하며, 10원 단위 나머지는 개설자가 부담합니다.
              </Text>
            </View>
          ) : meetingType === 'ROUND' && (firstFiniteNumber(settlementForm.green_fee) > 0 || firstFiniteNumber(settlementForm.caddy_fee) > 0 || firstFiniteNumber(settlementForm.cart_fee) > 0 || sumRoundingOtherItems(roundingOtherItems) > 0 || (roundingOtherItems || []).length > 0) ? (
            <View style={styles.participantSection}>
              <Text style={styles.participantSectionTitle}>정산 대상</Text>
              <Text style={styles.participantSectionHint}>
                비용 합계에서 회비 지출을 뺀 금액을 참가자 {participantCount}명에게 균등 분배합니다. 100원 단위로 내림된 나머지는 개설자가 부담합니다.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {shouldShowForm ? (
        <Button
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
        </Button>
      ) : canEditSettlement ? (
        <Button
          style={styles.fullButton}
          onPress={() => {
            setSettlementForm(makeSettlementForm(settlement, meeting));
            setShowEditForm(true);
          }}
        >
          <Text style={styles.fullButtonText}>정산 수정</Text>
        </Button>
      ) : null}

      {canConfirmSettlement ? (
        <Button style={[styles.fullButton, styles.confirmButton]} onPress={onConfirmSettlement}>
          <Text style={styles.fullButtonText}>정산 확정</Text>
        </Button>
      ) : null}

      {meeting?.settlement_confirmed ? (
        <View style={styles.confirmedNotice}>
          <Text style={styles.confirmedNoticeText}>정산이 확정되었습니다.</Text>
        </View>
      ) : null}

      <Modal
        visible={payModalOpen}
        title="납부 완료"
        onClose={() => !paySaving && setPayModalOpen(false)}
        footer={(
          <View style={styles.payModalFooter}>
            {payTarget?.is_paid && (
              <Button
                style={[styles.payModalBtn, styles.payModalBtnUnpaid]}
                onPress={handleMarkUnpaid}
                disabled={paySaving}
              >
                <Text style={styles.payModalBtnTextUnpaid}>미납부로 변경</Text>
              </Button>
            )}
            <Button
              style={[styles.payModalBtn, styles.payModalBtnCancel]}
              onPress={() => setPayModalOpen(false)}
              disabled={paySaving}
            >
              <Text style={styles.payModalBtnText}>취소</Text>
            </Button>
            <Button
              style={[styles.payModalBtn, styles.payModalBtnConfirm]}
              onPress={handleMarkPaid}
              disabled={paySaving}
            >
              {paySaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.payModalBtnTextWhite}>납부 완료</Text>
              )}
            </Button>
          </View>
        )}
      >
        {payTarget && (
          <View>
            <Text style={styles.payModalLabel}>
              {payTarget.user_name ?? payTarget.user_nickname ?? '-'} 참가자
            </Text>
            <TextInput
              style={styles.payModalInput}
              placeholder="납부 금액 (비워두면 부담금 전액)"
              placeholderTextColor={colors.neutral[400]}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="number-pad"
            />
            <Text style={styles.payModalHint}>빈 값이면 정산 부담금 전액으로 납부 완료 처리됩니다.</Text>
          </View>
        )}
      </Modal>

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
  summaryBreakdownBlock: {
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
    paddingLeft: tokens.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#93C5FD',
  },
  summaryBreakdownLabel: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: '#1E3A8A',
    marginBottom: 2,
  },
  summaryBreakdownLine: {
    fontSize: tokens.font.sm,
    color: '#1D4ED8',
    marginBottom: 2,
  },
  costSection: {
    gap: tokens.spacing.sm,
  },
  costTitle: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  otherExpenseDetailBlock: {
    marginTop: tokens.spacing.xs,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: tokens.spacing.sm,
  },
  otherExpenseDetailRow: {
    gap: tokens.spacing.xs,
  },
  otherExpenseDetailMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.xs2,
  },
  otherExpenseDetailTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.medium,
    color: colors.neutral[800],
  },
  otherExpenseDetailAmount: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
  },
  otherExpenseDetailMemo: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    marginLeft: 0,
  },
  otherExpenseDetailTotal: {
    marginTop: tokens.spacing.xs,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: tokens.spacing.xs,
  },
  fieldBlock: {
    gap: tokens.spacing.xs,
  },
  fieldBlockFeeCovered: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500],
    paddingLeft: tokens.padding.sm,
    marginLeft: -2,
    paddingVertical: tokens.padding.xs2,
    backgroundColor: colors.primary[50],
    borderRadius: tokens.radius.md,
  },
  costFieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs2,
  },
  feeCoveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary[100],
    borderWidth: 1.5,
    borderColor: colors.primary[500],
  },
  feeCoveredBadgeIcon: {
    marginRight: 0,
  },
  feeCoveredBadgeText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.primary[800],
    letterSpacing: -0.2,
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
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
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
  roundSettlementMethodNote: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
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
  socialExpenseItemsBlock: {
    marginBottom: tokens.spacing.sm2,
  },
  socialExpenseItemsHint: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginBottom: tokens.spacing.xs2,
  },
  socialExpenseItemBlock: {
    marginBottom: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  socialExpenseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  socialExpenseItemTitle: {
    minWidth: 70,
    flex: 1,
  },
  socialExpenseItemAmount: {
    width: 90,
  },
  socialExpenseItemMemo: {
    minWidth: 80,
    flex: 1,
  },
  socialExpenseItemRightCol: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 118,
  },
  socialFeeCoveredHint: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    textAlign: 'right',
    lineHeight: 16,
  },
  socialExpenseItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: tokens.spacing.xs2,
  },
  socialFeeCoveredCheckBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialFeeCoveredCheckBtnActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  socialExpenseItemRemove: {
    padding: tokens.padding.xs2,
  },
  addSocialExpenseItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: tokens.padding.xs2,
    marginTop: tokens.spacing.xs2,
    backgroundColor: colors.accent[600],
  },
  addSocialExpenseItemBtnText: {
    fontSize: tokens.font.sm,
    color: colors.white,
    fontWeight: tokens.fontWeight.semibold,
  },
  roundingOtherItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  roundingOtherTitle: {
    minWidth: 70,
    flex: 1,
  },
  roundingOtherAmount: {
    width: 90,
  },
  roundingOtherMemo: {
    minWidth: 80,
    flex: 1,
  },
  roundingOtherRemove: {
    padding: tokens.padding.xs2,
  },
  memoInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  paymentSection: {
    marginTop: tokens.spacing.sm2,
    paddingTop: tokens.spacing.sm2,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.padding.xs2,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  paymentNameBlock: {
    flex: 1,
  },
  paymentName: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.medium,
  },
  paymentAmountLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  paymentStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs2,
  },
  paymentStatusPaid: {
    fontSize: tokens.font.xs,
    color: colors.success[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  paymentStatusUnpaid: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  paymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: tokens.padding.xs2,
    paddingVertical: 4,
  },
  paymentBtnText: {
    fontSize: tokens.font.xs,
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  payModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.xs2,
    padding: tokens.padding.sm,
  },
  payModalBtn: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  payModalBtnCancel: {
    backgroundColor: colors.neutral[200],
  },
  payModalBtnUnpaid: {
    backgroundColor: colors.error[100],
  },
  payModalBtnConfirm: {
    backgroundColor: colors.primary[600],
  },
  payModalBtnText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
  },
  payModalBtnTextUnpaid: {
    fontSize: tokens.font.sm,
    color: colors.error[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  payModalBtnTextWhite: {
    fontSize: tokens.font.sm,
    color: colors.white,
    fontWeight: tokens.fontWeight.semibold,
  },
  payModalLabel: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    marginBottom: tokens.spacing.xs2,
  },
  payModalInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
    marginBottom: tokens.spacing.xs2,
  },
  payModalHint: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
});
