import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { roundsApi } from '@/lib/api/api';
import { backOrHome } from '@/lib/navigation/cappedHistory';
import { formatDateTime } from '@/lib/util/meetingUtils';
import { ensureProfileCompleted } from '@/lib/util/mypageUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

function formatAmount(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return `${Number(value).toLocaleString('ko-KR')}원`;
}

function getParticipantName(participant) {
  return (
    participant?.user_name ||
    participant?.name ||
    participant?.user?.realname ||
    participant?.user?.nickname ||
    `참가자 ${participant?.user_id || participant?.id || ''}`
  );
}

function getStatusConfig(status) {
  const key = String(status || 'PENDING').toUpperCase();
  if (key === 'APPROVED') {
    return { label: '승인', textColor: colors.success[700], bgColor: colors.success[50] };
  }
  if (key === 'REJECTED') {
    return { label: '거부', textColor: colors.error[700], bgColor: colors.error[50] };
  }
  return { label: '대기', textColor: colors.warning[700], bgColor: colors.warning[50] };
}

export default function ExpenseScreen() {
  const router = useRouter();
  const { meetingId } = useLocalSearchParams();
  const resolvedId = Array.isArray(meetingId) ? meetingId[0] : meetingId;

  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    participant_ids: [],
  });

  const loadData = useCallback(async () => {
    if (!resolvedId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError('');

      const [participantsResponse, expensesResponse] = await Promise.all([
        roundsApi.getRoundParticipants(resolvedId),
        roundsApi.getRoundExpenses(resolvedId),
      ]);

      setParticipants(extractList(participantsResponse));
      setExpenses(extractList(expensesResponse));
    } catch (fetchError) {
      console.error('지출/참가자 조회 실패:', fetchError);
      setError(fetchError?.message || '지출 정보를 불러오지 못했습니다.');
      setParticipants([]);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ensureMeetingProfile = useCallback(
    () =>
      ensureProfileCompleted({
        router,
        alertMessage: '모임 이용 전 프로필을 완성해 주세요!',
      }),
    [router]
  );

  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + (Number(expense?.amount) || 0), 0),
    [expenses]
  );

  const allParticipantIds = useMemo(
    () =>
      participants
        .map((participant) => participant?.user_id || participant?.id)
        .filter(Boolean),
    [participants]
  );

  const toggleParticipant = useCallback((userId) => {
    setForm((prev) => {
      const selected = prev.participant_ids.includes(userId);
      return {
        ...prev,
        participant_ids: selected
          ? prev.participant_ids.filter((id) => id !== userId)
          : [...prev.participant_ids, userId],
      };
    });
  }, []);

  const toggleAllParticipants = useCallback(() => {
    setForm((prev) => {
      const allSelected =
        allParticipantIds.length > 0 &&
        allParticipantIds.every((participantId) => prev.participant_ids.includes(participantId));
      return {
        ...prev,
        participant_ids: allSelected ? [] : allParticipantIds,
      };
    });
  }, [allParticipantIds]);

  const openCreateModal = useCallback(() => {
    setEditingExpense(null);
    setForm({
      title: '',
      description: '',
      amount: '',
      category: '',
      participant_ids: allParticipantIds,
    });
    setModalVisible(true);
  }, [allParticipantIds]);

  const openEditModal = useCallback((expense) => {
    setEditingExpense(expense);
    setForm({
      title: expense?.title || '',
      description: expense?.description || '',
      amount: expense?.amount !== undefined && expense?.amount !== null ? String(expense.amount) : '',
      category: expense?.category || '',
      participant_ids: Array.isArray(expense?.participants)
        ? expense.participants
            .map((participant) => participant?.user_id || participant?.id)
            .filter(Boolean)
        : Array.isArray(expense?.participant_ids)
          ? expense.participant_ids
          : [],
    });
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isSaving) return;
    setModalVisible(false);
    setEditingExpense(null);
  }, [isSaving]);

  const handleSubmit = useCallback(async () => {
    if (!resolvedId) return;

    const title = form.title.trim();
    const category = form.category.trim();
    const amount = Number(form.amount);

    if (!title) {
      Alert.alert('확인', '지출 제목을 입력해주세요.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert('확인', '지출 금액을 올바르게 입력해주세요.');
      return;
    }

    const payload = {
      title,
      description: form.description.trim() || null,
      amount,
      category: category || '기타',
      participant_ids: form.participant_ids,
      split_type: 'EQUAL',
    };

    const isCompleted = await ensureMeetingProfile();
    if (!isCompleted) return;

    try {
      setIsSaving(true);
      if (editingExpense?.id) {
        await roundsApi.updateExpense(resolvedId, editingExpense.id, payload);
      } else {
        await roundsApi.createRoundExpense(resolvedId, payload);
      }
      setModalVisible(false);
      setEditingExpense(null);
      await loadData();
    } catch (saveError) {
      console.error('지출 저장 실패:', saveError);
      Alert.alert('오류', saveError?.message || '지출 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [editingExpense?.id, ensureMeetingProfile, form, loadData, resolvedId]);

  const handleDelete = useCallback(
    (expense) => {
      if (!expense?.id || !resolvedId) return;
      Alert.alert('지출 삭제', '이 지출 내역을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const isCompleted = await ensureMeetingProfile();
            if (!isCompleted) return;
            try {
              await roundsApi.deleteExpense(resolvedId, expense.id);
              await loadData();
            } catch (deleteError) {
              console.error('지출 삭제 실패:', deleteError);
              Alert.alert('오류', deleteError?.message || '지출 삭제에 실패했습니다.');
            }
          },
        },
      ]);
    },
    [ensureMeetingProfile, loadData, resolvedId]
  );

  const canSubmit = !isSaving && !!form.title.trim() && form.amount !== '';
  const allParticipantsSelected =
    allParticipantIds.length > 0 &&
    allParticipantIds.every((participantId) => form.participant_ids.includes(participantId));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="모임 정산" />
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.backButton} onPress={() => backOrHome(router)}>
          <FontAwesome5 name="arrow-left" size={13} color={colors.neutral[600]} />
          <Text style={styles.backText}>모임 상세</Text>
        </Pressable>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>지출 요약</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 지출</Text>
              <Text style={styles.summaryValue}>{formatAmount(totalAmount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>지출 건수</Text>
              <Text style={styles.summaryValue}>{expenses.length}건</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>참가자</Text>
              <Text style={styles.summaryValue}>{participants.length}명</Text>
            </View>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>지출 목록</Text>
          <Button size="sm" style={styles.addButton} onPress={openCreateModal}>
            <FontAwesome5 name="plus" size={11} color={colors.white} />
            <Text style={styles.addButtonText}>지출 추가</Text>
          </Button>
        </View>

        {isLoading ? (
          <Card style={styles.stateCard}>
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>지출 정보를 불러오는 중...</Text>
            </View>
          </Card>
        ) : error ? (
          <Card style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : expenses.length === 0 ? (
          <Card style={styles.stateCard}>
            <View style={styles.emptyStateWrap}>
              <FontAwesome5 name="receipt" size={20} color={colors.neutral[400]} />
              <Text style={styles.stateText}>등록된 지출이 없습니다.</Text>
              <Button size="sm" onPress={openCreateModal}>
                지출 추가
              </Button>
            </View>
          </Card>
        ) : (
          expenses.map((expense) => {
            const status = getStatusConfig(expense?.status);
            return (
              <Card key={expense?.id || `${expense?.title}-${expense?.amount}`} style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseTitleWrap}>
                    <Text style={styles.expenseTitle}>{expense?.title || '지출'}</Text>
                    <Text style={styles.expenseAmount}>{formatAmount(expense?.amount)}</Text>
                  </View>
                  <View style={styles.expenseActions}>
                    <Pressable onPress={() => openEditModal(expense)} style={styles.iconButton}>
                      <FontAwesome5 name="edit" size={12} color={colors.neutral[600]} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(expense)} style={styles.iconButton}>
                      <FontAwesome5 name="trash" size={12} color={colors.error[600]} />
                    </Pressable>
                  </View>
                </View>

                {!!expense?.description && <Text style={styles.expenseDescription}>{expense.description}</Text>}

                <View style={styles.expenseMetaRow}>
                  <Text style={styles.expenseMeta}>{expense?.category || '기타'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                    <Text style={[styles.statusText, { color: status.textColor }]}>{status.label}</Text>
                  </View>
                </View>

                <View style={styles.expenseMetaRow}>
                  <Text style={styles.expenseMetaDate}>{formatDateTime(expense?.created_at)}</Text>
                  <Text style={styles.expenseMeta}>
                    {Array.isArray(expense?.participants)
                      ? `${expense.participants.length}명 참여`
                      : Array.isArray(expense?.participant_ids)
                        ? `${expense.participant_ids.length}명 참여`
                        : '-'}
                  </Text>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingExpense ? '지출 수정' : '지출 추가'}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>제목</Text>
              <TextInput
                value={form.title}
                onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
                style={styles.input}
                placeholder="예: 카트비"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>설명</Text>
              <TextInput
                value={form.description}
                onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="선택 입력"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>금액</Text>
              <TextInput
                value={form.amount}
                onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value.replace(/[^0-9]/g, '') }))}
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>카테고리</Text>
              <TextInput
                value={form.category}
                onChangeText={(value) => setForm((prev) => ({ ...prev, category: value }))}
                style={styles.input}
                placeholder="예: 식비"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>분할 대상</Text>
              <View style={styles.participantSelectHeader}>
                <Pressable
                  style={[styles.selectAllChip, allParticipantsSelected && styles.selectAllChipSelected]}
                  onPress={toggleAllParticipants}
                >
                  <Text
                    style={[
                      styles.selectAllText,
                      allParticipantsSelected && styles.selectAllTextSelected,
                    ]}
                  >
                    전체 선택
                  </Text>
                </Pressable>
                <Text style={styles.participantSelectedCount}>
                  {form.participant_ids.length}명 선택
                </Text>
              </View>
              <View style={styles.participantList}>
                {participants.map((participant) => {
                  const userId = participant?.user_id || participant?.id;
                  const selected = form.participant_ids.includes(userId);
                  return (
                    <Pressable
                      key={userId}
                      style={[styles.participantChip, selected && styles.participantChipSelected]}
                      onPress={() => toggleParticipant(userId)}
                    >
                      <Text
                        style={[
                          styles.participantChipText,
                          selected && styles.participantChipTextSelected,
                        ]}
                      >
                        {getParticipantName(participant)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button variant="outline" size="sm" onPress={closeModal}>
                취소
              </Button>
              <Button variant="primary" size="sm" onPress={handleSubmit} disabled={!canSubmit}>
                {isSaving ? '저장 중...' : editingExpense ? '수정' : '추가'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: tokens.spacing.sm2,
  },
  backText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
  },
  summaryCard: {
    marginBottom: tokens.spacing.md,
  },
  summaryTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[800],
    marginBottom: tokens.spacing.sm2,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  summaryValue: {
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
    fontWeight: tokens.fontWeight.bold,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  sectionTitle: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
  },
  addButtonText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.white,
  },
  stateCard: {
    marginBottom: tokens.spacing.sm2,
  },
  emptyStateWrap: {
    alignItems: 'center',
    gap: 10,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginLeft: tokens.spacing.xs2,
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  errorText: base.textSmError,
  expenseCard: {
    marginBottom: tokens.spacing.sm2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseTitleWrap: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  expenseAmount: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.bold,
    color: colors.primary[700],
    marginTop: 4,
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseDescription: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    marginTop: 6,
  },
  expenseMetaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseMeta: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  expenseMetaDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
  },
  statusBadge: {
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    padding: tokens.padding.md,
    maxHeight: '86%',
  },
  modalTitle: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm2,
  },
  fieldGroup: {
    marginBottom: tokens.spacing.sm2,
  },
  label: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  participantList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  participantSelectHeader: {
    marginBottom: tokens.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  selectAllChip: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectAllChipSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  selectAllText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  selectAllTextSelected: {
    color: colors.primary[700],
  },
  participantSelectedCount: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  participantChip: {
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.white,
  },
  participantChipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  participantChipText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
  },
  participantChipTextSelected: {
    color: colors.white,
  },
  modalActions: {
    marginTop: tokens.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
