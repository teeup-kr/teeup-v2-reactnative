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
import { ensureProfileCompleted } from '@/lib/util/mypageUtils';
import { extractData, extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const CURRENT_PARTICIPANT_ID = 'current';

function getScoreDiff(score, par) {
  const numericScore = Number(score);
  const numericPar = Number(par);
  if (!Number.isFinite(numericScore) || !Number.isFinite(numericPar)) return '-';
  const diff = numericScore - numericPar;
  if (diff === 0) return 'PAR';
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

function getScoreDiffColor(score, par) {
  const numericScore = Number(score);
  const numericPar = Number(par);
  if (!Number.isFinite(numericScore) || !Number.isFinite(numericPar)) return colors.neutral[500];
  const diff = numericScore - numericPar;
  if (diff === 0) return colors.info[700];
  if (diff > 0) return colors.error[700];
  return colors.success[700];
}

function getScoreType(score, par) {
  const numericScore = Number(score);
  const numericPar = Number(par);
  if (!Number.isFinite(numericScore) || !Number.isFinite(numericPar)) return null;
  const diff = numericScore - numericPar;

  if (diff === -3) return { text: '알바트로스', bg: colors.secondary[100], color: colors.secondary[800] };
  if (diff === -2) return { text: '이글', bg: colors.warning[50], color: colors.warning[700] };
  if (diff === -1) return { text: '버디', bg: colors.success[50], color: colors.success[700] };
  if (diff === 0) return { text: '파', bg: colors.info[50], color: colors.info[700] };
  if (diff === 1) return { text: '보기', bg: colors.warning[50], color: colors.warning[700] };
  if (diff === 2) return { text: '더블보기', bg: colors.error[50], color: colors.error[700] };
  if (diff >= 3) return { text: '트리플보기+', bg: colors.error[200], color: colors.error[700] };
  return null;
}

export default function ScoreInputScreen() {
  const router = useRouter();
  const { meetingId } = useLocalSearchParams();
  const resolvedId = Array.isArray(meetingId) ? meetingId[0] : meetingId;

  const [scores, setScores] = useState([]);
  const [scoreStats, setScoreStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [form, setForm] = useState({
    hole_number: '1',
    score: '',
    par: '4',
  });

  const loadScores = useCallback(async () => {
    if (!resolvedId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const [scoresResponse, statsResponse] = await Promise.all([
        roundsApi.getParticipantScores(resolvedId, CURRENT_PARTICIPANT_ID),
        roundsApi.getParticipantScoreStats(resolvedId, CURRENT_PARTICIPANT_ID),
      ]);

      setScores(extractList(scoresResponse));
      setScoreStats(extractData(statsResponse));
    } catch (fetchError) {
      console.error('스코어 조회 실패:', fetchError);
      setError(fetchError?.message || '점수 정보를 불러오지 못했습니다.');
      setScores([]);
      setScoreStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    loadScores();
  }, [loadScores]);

  const ensureMeetingProfile = useCallback(
    () =>
      ensureProfileCompleted({
        router,
        alertMessage: '모임 이용 전 프로필을 완성해 주세요!',
      }),
    [router]
  );

  const openCreateModal = useCallback(() => {
    setEditingScore(null);
    setForm({ hole_number: '1', score: '', par: '4' });
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((score) => {
    setEditingScore(score);
    setForm({
      hole_number: String(score?.hole_number ?? '1'),
      score: String(score?.strokes ?? score?.score ?? ''),
      par: String(score?.par ?? '4'),
    });
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isSaving) return;
    setModalVisible(false);
    setEditingScore(null);
  }, [isSaving]);

  const submitScore = useCallback(async () => {
    if (!resolvedId) return;

    const holeNumber = Number(form.hole_number);
    const score = Number(form.score);
    const par = Number(form.par);

    if (!Number.isInteger(holeNumber) || holeNumber < 1 || holeNumber > 18) {
      Alert.alert('확인', '홀 번호는 1~18 사이로 입력해주세요.');
      return;
    }
    if (!Number.isFinite(score) || score <= 0) {
      Alert.alert('확인', '타수를 올바르게 입력해주세요.');
      return;
    }
    if (!Number.isFinite(par) || par <= 0) {
      Alert.alert('확인', '파 수를 올바르게 입력해주세요.');
      return;
    }

    const payload = { hole_number: holeNumber, strokes: score, par };

    const isCompleted = await ensureMeetingProfile();
    if (!isCompleted) return;

    try {
      setIsSaving(true);
      if (editingScore?.id) {
        await roundsApi.updateScore(resolvedId, CURRENT_PARTICIPANT_ID, editingScore.id, payload);
      } else {
        await roundsApi.createScore(resolvedId, CURRENT_PARTICIPANT_ID, payload);
      }
      setModalVisible(false);
      setEditingScore(null);
      await loadScores();
    } catch (saveError) {
      console.error('점수 저장 실패:', saveError);
      Alert.alert('오류', saveError?.message || '점수 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [editingScore?.id, ensureMeetingProfile, form, loadScores, resolvedId]);

  const deleteScore = useCallback(
    (score) => {
      if (!score?.id || !resolvedId) return;
      Alert.alert('점수 삭제', '선택한 홀 점수를 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const isCompleted = await ensureMeetingProfile();
            if (!isCompleted) return;
            try {
              await roundsApi.deleteScore(resolvedId, CURRENT_PARTICIPANT_ID, score.id);
              await loadScores();
            } catch (deleteError) {
              console.error('점수 삭제 실패:', deleteError);
              Alert.alert('오류', deleteError?.message || '점수 삭제에 실패했습니다.');
            }
          },
        },
      ]);
    },
    [ensureMeetingProfile, loadScores, resolvedId]
  );

  const canSubmit =
    !isSaving && form.hole_number.trim() !== '' && form.score.trim() !== '' && form.par.trim() !== '';

  const orderedScores = useMemo(
    () =>
      [...scores].sort((left, right) => {
        const leftHole = Number(left?.hole_number);
        const rightHole = Number(right?.hole_number);
        if (!Number.isFinite(leftHole) && !Number.isFinite(rightHole)) return 0;
        if (!Number.isFinite(leftHole)) return 1;
        if (!Number.isFinite(rightHole)) return -1;
        return leftHole - rightHole;
      }),
    [scores]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="점수 입력" />
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable style={styles.backButton} onPress={() => backOrHome(router)}>
          <FontAwesome5 name="arrow-left" size={13} color={colors.neutral[600]} />
          <Text style={styles.backText}>모임 상세</Text>
        </Pressable>

        {scoreStats ? (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>점수 통계</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>총 스트로크</Text>
                <Text style={styles.summaryValue}>{scoreStats?.total_strokes ?? '-'}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>평균 스코어</Text>
                <Text style={styles.summaryValue}>{scoreStats?.average_score ?? '-'}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>최고 홀</Text>
                <Text style={[styles.summaryValue, { color: colors.success[700] }]}>
                  {scoreStats?.best_hole ?? '-'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>최악 홀</Text>
                <Text style={[styles.summaryValue, { color: colors.error[700] }]}>
                  {scoreStats?.worst_hole ?? '-'}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>점수 목록</Text>
          <Pressable style={styles.addButton} onPress={openCreateModal}>
            <FontAwesome5 name="plus" size={11} color={colors.white} />
            <Text style={styles.addButtonText}>점수 추가</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <Card style={styles.stateCard}>
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>점수 정보를 불러오는 중...</Text>
            </View>
          </Card>
        ) : error ? (
          <Card style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : orderedScores.length === 0 ? (
          <Card style={styles.stateCard}>
            <View style={styles.emptyStateWrap}>
              <FontAwesome5 name="golf-ball" size={20} color={colors.neutral[400]} />
              <Text style={styles.stateText}>등록된 점수가 없습니다.</Text>
              <Button size="sm" onPress={openCreateModal}>
                점수 추가
              </Button>
            </View>
          </Card>
        ) : (
          <View style={styles.scoreGrid}>
            {orderedScores.map((score) => {
              const scoreValue = score?.strokes ?? score?.score;
              const type = getScoreType(scoreValue, score?.par);
              return (
                <Card key={score?.id || `${score?.hole_number}-${scoreValue}`} style={styles.scoreCard}>
                  <View style={styles.scoreHeader}>
                    <View style={styles.holeBadge}>
                      <Text style={styles.holeText}>{score?.hole_number}</Text>
                    </View>
                    <View style={styles.scoreActions}>
                      <Pressable style={styles.iconButton} onPress={() => openEditModal(score)}>
                        <FontAwesome5 name="edit" size={11} color={colors.neutral[600]} />
                      </Pressable>
                      <Pressable style={styles.iconButton} onPress={() => deleteScore(score)}>
                        <FontAwesome5 name="trash" size={11} color={colors.error[600]} />
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.scoreMain}>{scoreValue ?? '-'}</Text>
                  <Text style={[styles.scoreDiff, { color: getScoreDiffColor(scoreValue, score?.par) }]}>
                    {getScoreDiff(scoreValue, score?.par)}
                  </Text>
                  <Text style={styles.scorePar}>PAR {score?.par ?? '-'}</Text>

                  {type ? (
                    <View style={[styles.typeBadge, { backgroundColor: type.bg }]}>
                      <Text style={[styles.typeText, { color: type.color }]}>{type.text}</Text>
                    </View>
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingScore ? '점수 수정' : '점수 추가'}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>홀 번호</Text>
              <TextInput
                value={form.hole_number}
                onChangeText={(value) => setForm((prev) => ({ ...prev, hole_number: value.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                style={styles.input}
                placeholder="1"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>타수</Text>
              <TextInput
                value={form.score}
                onChangeText={(value) => setForm((prev) => ({ ...prev, score: value.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PAR</Text>
              <TextInput
                value={form.par}
                onChangeText={(value) => setForm((prev) => ({ ...prev, par: value.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
                style={styles.input}
                placeholder="4"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <View style={styles.modalActions}>
              <Button variant="outline" size="sm" onPress={closeModal}>
                취소
              </Button>
              <Button variant="primary" size="sm" onPress={submitScore} disabled={!canSubmit}>
                {isSaving ? '저장 중...' : editingScore ? '수정' : '추가'}
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
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryItem: {
    width: '48%',
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
  },
  summaryLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  summaryValue: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
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
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreCard: {
    width: '48%',
    marginBottom: tokens.spacing.sm2,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  holeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
  },
  holeText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.white,
  },
  scoreActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreMain: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  scoreDiff: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.semibold,
    marginTop: 2,
  },
  scorePar: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
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
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
  },
  modalActions: {
    marginTop: tokens.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
