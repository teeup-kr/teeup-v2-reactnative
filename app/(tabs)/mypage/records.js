
import {
FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React,
{ useCallback,
useMemo,
useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  ActivityIndicator,
Alert,
Modal,
Pressable,
ScrollView,
Text,
TextInput,
View,
} from 'react-native';

import Card from '@/components/ui/Card';
import { roundsApi, usersApi } from '@/lib/api';
import { base, tokens } from '@/styles/style';

/**
 * RecordsTab (React Native)
 * - Web RecordsTab UI를 RN 스타일로 재구현
 * - usersApi / roundsApi는 기존 프로젝트 경로 사용
 * - SimpleScoreInputModal 포함(내부 컴포넌트)
 *
 * 기대 응답 형태가 서로 달라도 동작하도록 최대한 방어적으로 파싱함.
 */

/* =========================
   Utils
========================= */
const asNumber = (v, fallback = 0) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : fallback;
};

const pickData = (resp) => {
  // axios 응답(resp.data) or plain object 대응
  if (!resp) return null;
  if (resp.data !== undefined) return resp.data;
  return resp;
};

const formatKoreanDate = (dateLike) => {
  if (!dateLike) return '-';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}년 ${m}월 ${day}일`;
};

/* =========================
   RoundingStatsCard (RN)
========================= */
const RoundingStatsCard = ({ stats, isLoading, error }) => {
  if (isLoading) {
    return (
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.statCard, styles.statCardSkeleton]} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <Card style={styles.statsErrorCard}>
        <Text style={styles.statsErrorText}>통계 정보를 불러오는데 실패했습니다.</Text>
      </Card>
    );
  }

  const totalGames = asNumber(stats?.total_games, 0);
  if (!stats || totalGames === 0) {
    return (
      <Card style={styles.statsEmptyCard}>
        <Text style={styles.statsEmptyText}>아직 기록된 라운딩이 없습니다.</Text>
      </Card>
    );
  }

  const cards = [
    {
      id: 'total',
      label: '총 경기 수',
      value: `${asNumber(stats?.total_games, 0)}`,
      unit: '경기',
      icon: 'history',
      color: tokens.colors.primary?.[700] ?? tokens.colors.primary[600],
      bg: tokens.colors.primary?.[50] ?? tokens.colors.neutral[50],
      border: tokens.colors.primary?.[200] ?? tokens.colors.neutral[200],
    },
    {
      id: 'average',
      label: '평균 스코어',
      value:
        stats?.average_score !== null && stats?.average_score !== undefined
          ? asNumber(stats?.average_score, 0).toFixed(1)
          : '-',
      unit: '',
      icon: 'chart-line',
      color: tokens.colors.neutral[800],
      bg: tokens.colors.neutral[50],
      border: tokens.colors.neutral[200],
    },
    {
      id: 'recent5',
      label: '최근 5경기 평균',
      value:
        stats?.recent_5_avg !== null && stats?.recent_5_avg !== undefined
          ? asNumber(stats?.recent_5_avg, 0).toFixed(1)
          : '-',
      unit: '',
      icon: 'trophy',
      color: tokens.colors.neutral[800],
      bg: tokens.colors.neutral[50],
      border: tokens.colors.neutral[200],
    },
    {
      id: 'best-worst',
      label: '최고/최저',
      value:
        stats?.best_score !== null &&
          stats?.best_score !== undefined &&
          stats?.worst_score !== null &&
          stats?.worst_score !== undefined
          ? `${stats.best_score} / ${stats.worst_score}`
          : '-',
      unit: '',
      icon: 'medal',
      color: tokens.colors.neutral[800],
      bg: tokens.colors.neutral[50],
      border: tokens.colors.neutral[200],
    },
  ];

  return (
    <View style={styles.statsGrid}>
      {cards.map((c) => (
        <View
          key={c.id}
          style={[
            styles.statCard,
            { backgroundColor: c.bg, borderColor: c.border },
          ]}
        >
          <View style={styles.statHeaderRow}>
            <FontAwesome5 name={c.icon} size={12} color={c.color} />
            <Text style={styles.statLabel}>{c.label}</Text>
          </View>
          <View style={styles.statValueRow}>
            <Text style={[styles.statValue, { color: c.color }]}>{c.value}</Text>
            {!!c.unit && <Text style={styles.statUnit}>{c.unit}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
};

/* =========================
   SimpleScoreInputModal (RN)
========================= */
const SimpleScoreInputModal = ({
  visible,
  onClose,
  meetingId,
  participantId,
  currentHandicap,
  onSuccess,
  shouldCompleteRounding = false,
}) => {
  const [grossScore, setGrossScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const newHandicap = useMemo(() => {
    if (!grossScore) return null;
    const gross = parseInt(grossScore, 10);
    if (Number.isNaN(gross)) return null;
    const handicap = gross - 72;
    const clamped = Math.max(0, Math.min(72, handicap));
    return clamped.toFixed(1);
  }, [grossScore]);

  const resetLocal = useCallback(() => {
    setGrossScore('');
    setIsSubmitting(false);
    setErrors({});
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!grossScore || grossScore.trim() === '') {
      next.grossScore = '라운딩 스코어를 입력해주세요.';
    } else {
      const score = parseInt(grossScore, 10);
      if (Number.isNaN(score)) next.grossScore = '숫자만 입력 가능합니다.';
      else if (score < 55 || score > 144)
        next.grossScore = '스코어는 55~144 사이의 값이어야 합니다.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [grossScore]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      setIsSubmitting(true);

      if (shouldCompleteRounding) {
        await roundsApi.completeRounding(meetingId);
      }

      await roundsApi.submitSimpleScore(meetingId, participantId, {
        gross_score: parseInt(grossScore, 10),
      });

      onSuccess?.(shouldCompleteRounding);
      onClose?.();
      resetLocal();
    } catch (err) {
      console.error('점수 입력 실패:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        '점수 입력에 실패했습니다.';
      setErrors({ submit: detail });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validate,
    shouldCompleteRounding,
    meetingId,
    participantId,
    grossScore,
    onSuccess,
    onClose,
    resetLocal,
  ]);

  const closeAndReset = () => {
    if (isSubmitting) return;
    onClose?.();
    resetLocal();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeAndReset}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>점수 입력</Text>
            <Pressable
              onPress={closeAndReset}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.7 },
              ]}
              disabled={isSubmitting}
            >
              <FontAwesome5 name="times" size={18} color={tokens.colors.neutral[500]} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {/* Current Handicap */}
            <View style={styles.handicapBox}>
              <Text style={styles.handicapLabel}>현재 핸디캡</Text>
              <Text style={styles.handicapValue}>
                {currentHandicap !== null &&
                  currentHandicap !== undefined &&
                  currentHandicap !== ''
                  ? asNumber(currentHandicap, 0).toFixed(1)
                  : '-'}
              </Text>
            </View>

            {/* Score input */}
            <Text style={styles.fieldLabel}>
              라운딩 스코어 <Text style={{ color: tokens.colors.error[600] }}>*</Text>
            </Text>
            <TextInput
              value={grossScore}
              onChangeText={(t) => {
                // 빈 값 허용
                if (t === '') {
                  setGrossScore('');
                  return;
                }
                // 숫자만
                if (!/^\d+$/.test(t)) return;

                // 앞 0 제거
                if (t.length > 1 && t[0] === '0') {
                  const stripped = t.replace(/^0+/, '') || '0';
                  if (stripped === '0') {
                    setGrossScore('');
                    return;
                  }
                  setGrossScore(stripped);
                  return;
                }

                setGrossScore(t);
              }}
              placeholder="55~144 사이의 숫자 입력"
              keyboardType="number-pad"
              editable={!isSubmitting}
              style={[
                styles.input,
                errors.grossScore ? styles.inputError : styles.inputNormal,
              ]}
            />
            {!!errors.grossScore && (
              <Text style={styles.errorText}>{errors.grossScore}</Text>
            )}

            {/* New handicap preview */}
            {newHandicap !== null && (
              <View style={styles.previewBox}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>새로운 핸디캡 (예상)</Text>
                  <Text style={styles.previewValue}>{newHandicap}</Text>
                </View>
                <Text style={styles.previewHint}>
                  라운딩 스코어 - 72 = 새로운 핸디캡{'\n'}(최근 5경기 평균으로
                  재계산됩니다)
                </Text>
              </View>
            )}

            {!!errors.submit && (
              <View style={styles.submitErrorBox}>
                <Text style={styles.submitErrorText}>{errors.submit}</Text>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={closeAndReset}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnOutline,
                  pressed && { opacity: 0.85 },
                  isSubmitting && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.modalBtnOutlineText}>취소</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || !grossScore}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnPrimary,
                  pressed && { opacity: 0.9 },
                  (isSubmitting || !grossScore) && { opacity: 0.5 },
                ]}
              >
                {isSubmitting ? (
                  <View style={styles.inlineRow}>
                    <ActivityIndicator size="small" color={tokens.colors.white} />
                    <Text style={styles.modalBtnPrimaryText}>저장 중...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>
                    {shouldCompleteRounding ? '라운딩 종료 후 저장' : '저장'}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

/* =========================
   ComingSoon Modal (RN)
========================= */
const ComingSoonModal = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>준비중</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
              <FontAwesome5 name="times" size={18} color={tokens.colors.neutral[500]} />
            </Pressable>
          </View>

          <View style={[styles.modalBody, { paddingBottom: tokens.padding.lg2 }]}>
            <View style={{ alignItems: 'center', marginBottom: tokens.spacing.sm2 }}>
              <FontAwesome5 name="golf-ball" size={40} color={tokens.colors.neutral[400]} />
            </View>
            <Text style={styles.comingSoonTitle}>이 기능은 현재 준비중입니다</Text>
            <Text style={styles.comingSoonSub}>상세 점수 입력 기능은 곧 제공될 예정입니다.</Text>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.fullPrimaryBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.fullPrimaryBtnText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/* =========================
   RecordsTab Screen (RN)
========================= */
export default function RecordsTab() {
  const router = useRouter();

  const [scoreStatus, setScoreStatus] = useState('all'); // all, missing, completed
  const [page, setPage] = useState(1);

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [meetings, setMeetings] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const [currentHandicap, setCurrentHandicap] = useState(null);

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);

  const limit = 10;

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      const resp = await usersApi.getRoundingStats();
      setStats(pickData(resp));
    } catch (e) {
      console.error(e);
      setStatsError(e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const resp = await usersApi.getMyRoundingMeetings({
        score_status: scoreStatus,
        page,
        limit,
      });

      const data = pickData(resp) || resp || {};
      // 가능한 케이스:
      // { data: [], total_pages: n } 또는 { data: { data: [] } } 등
      const list = data?.data ?? data?.list ?? [];
      setMeetings(Array.isArray(list) ? list : []);
      setTotalPages(asNumber(data?.total_pages, 1) || 1);
    } catch (e) {
      console.error(e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [scoreStatus, page]);

  const fetchHandicap = useCallback(async () => {
    // 웹은 userProfile + userId로 조회했지만,
    // RN에서는 프로젝트마다 구현이 다르므로 최대한 방어적으로 처리
    try {
      // 1) 내 프로필에서 id 얻기
      const profileResp = await usersApi.getMyProfile?.();
      const profile = pickData(profileResp);
      const userId = profile?.id || profile?.data?.id;

      if (!userId || !usersApi.getUserHandicap) return;

      const handicapResp = await usersApi.getUserHandicap(userId);
      const handicapData = pickData(handicapResp) || {};
      const info = handicapData?.data || handicapData;

      const calculated = info?.calculated_handicap;
      const initial = info?.initial_handicap;
      const value =
        calculated ?? initial ?? null;

      setCurrentHandicap(value);
    } catch (e) {
      // 핸디캡은 실패해도 치명적이지 않게 무시
      console.warn('handicap fetch failed:', e?.message || e);
    }
  }, []);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  React.useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  React.useEffect(() => {
    fetchHandicap();
  }, [fetchHandicap]);

  const missingMeetings = useMemo(
    () => meetings.filter((m) => !m?.has_score),
    [meetings]
  );
  const completedMeetings = useMemo(
    () => meetings.filter((m) => !!m?.has_score),
    [meetings]
  );

  const openScoreModal = useCallback(
    async (meeting) => {
      try {
        const participantsResp = await roundsApi.getRoundParticipants(
          meeting.meeting_id
        );
        const participants = pickData(participantsResp);
        const list = Array.isArray(participants)
          ? participants
          : participants?.data || [];

        // 웹은 user.id로 찾았는데 RN에서는 user hook이 없으니
        // 내 프로필로 다시 얻거나, API가 "me"를 내려준다면 그걸 쓰면 됨.
        // 여기서는 usersApi.getMyProfile을 재사용해서 userId 확보.
        const profileResp = await usersApi.getMyProfile?.();
        const profile = pickData(profileResp);
        const myUserId = profile?.id || profile?.data?.id;

        const mine = list.find((p) => p.user_id === myUserId);

        if (!mine) {
          Alert.alert('오류', '참가자 정보를 찾을 수 없습니다.');
          return;
        }

        setSelectedParticipantId(mine.id);
        setSelectedMeeting(meeting);
        setShowScoreModal(true);
      } catch (e) {
        console.error('참가자 조회 실패:', e);
        Alert.alert('오류', '참가자 정보를 불러오는데 실패했습니다.');
      }
    },
    [setShowScoreModal]
  );

  const onScoreSuccess = useCallback(async () => {
    setShowScoreModal(false);
    setSelectedMeeting(null);
    setSelectedParticipantId(null);
    // 재조회
    await fetchMeetings();
    await fetchStats();
    await fetchHandicap();
  }, [fetchMeetings, fetchStats, fetchHandicap]);

  const goToDetail = useCallback((meetingId) => {
    router.push(`/meetings/rounding/${meetingId}`);
  }, [router]);

  const renderMeetingCard = (meeting, isCompleted = false) => {
    return (
      <View
        key={meeting.meeting_id}
        style={[
          styles.meetingBox,
          isCompleted ? styles.meetingCompleted : styles.meetingMissing,
        ]}
      >
        <Pressable onPress={() => goToDetail(meeting.meeting_id)}>
          <Text style={styles.meetingTitle} numberOfLines={1}>
            {meeting.meeting_name}
          </Text>
        </Pressable>

        <Text style={styles.meetingClub}>{meeting.club_name}</Text>

        <View style={styles.meetingDatesRow}>
          <Text style={styles.meetingDateText}>
            경기일: {formatKoreanDate(meeting.meeting_time)}
          </Text>
          <Text style={styles.meetingDot}>•</Text>
          <Text style={styles.meetingDateText}>
            종료일: {formatKoreanDate(meeting.rounding_completed_at)}
          </Text>
        </View>

        {isCompleted && (
          <View style={styles.scoreRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreLabel}>라운딩 스코어</Text>
              <Text style={styles.scoreValue}>{meeting.gross_score}</Text>
            </View>
            {currentHandicap !== null && currentHandicap !== undefined && (
              <View style={{ flex: 1 }}>
                <Text style={styles.scoreLabel}>업데이트된 핸디캡</Text>
                <Text style={styles.handicapGreen}>
                  {asNumber(currentHandicap, 0).toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.cardBtnRow}>
          {!isCompleted ? (
            <>
              <Pressable
                onPress={() => openScoreModal(meeting)}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={styles.inlineRow}>
                  <FontAwesome5 name="golf-ball" size={14} color={tokens.colors.white} />
                  <Text style={styles.primaryBtnText}>점수 입력</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setShowComingSoonModal(true)}
                style={({ pressed }) => [
                  styles.outlineBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.outlineBtnText}>상세 입력</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => openScoreModal(meeting)}
                style={({ pressed }) => [
                  styles.outlineBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <View style={styles.inlineRow}>
                  <FontAwesome5
                    name="edit"
                    size={14}
                    color={tokens.colors.neutral[700]}
                  />
                  <Text style={styles.outlineBtnText}>수정</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setShowComingSoonModal(true)}
                style={({ pressed }) => [
                  styles.softPrimaryBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <Text style={styles.softPrimaryBtnText}>상세 수정</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading && meetings.length === 0) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={tokens.colors.primary[600]} />
          <Text style={styles.centerText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    const message =
      error?.response?.data?.detail ||
      error?.message ||
      '알 수 없는 오류가 발생했습니다.';
    return (
      <View style={styles.safeArea}>
        <Card style={styles.errorCard}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <FontAwesome5 name="times" size={36} color={tokens.colors.error[600]} />
            <Text style={styles.errorTitle}>기록 정보를 불러오는데 실패했습니다.</Text>
            <Text style={styles.errorSub}>{message}</Text>
          </View>
        </Card>
      </View>
    );
  }

  const showMissingSection =
    (scoreStatus === 'all' || scoreStatus === 'missing') &&
    missingMeetings.length > 0;

  const showCompletedSection =
    (scoreStatus === 'all' || scoreStatus === 'completed') &&
    completedMeetings.length > 0;

  const showEmpty = meetings.length === 0;

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Stats */}
        <RoundingStatsCard stats={stats} isLoading={statsLoading} error={statsError} />

        {/* Filter buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            onPress={() => {
              setScoreStatus('all');
              setPage(1);
            }}
            style={({ pressed }) => [
              styles.filterBtn,
              scoreStatus === 'all' ? styles.filterBtnActive : styles.filterBtnNormal,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                scoreStatus === 'all' ? styles.filterBtnTextActive : styles.filterBtnTextNormal,
              ]}
            >
              전체
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setScoreStatus('missing');
              setPage(1);
            }}
            style={({ pressed }) => [
              styles.filterBtn,
              scoreStatus === 'missing'
                ? styles.filterBtnDangerActive
                : styles.filterBtnNormal,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                scoreStatus === 'missing'
                  ? styles.filterBtnTextActive
                  : styles.filterBtnTextNormal,
              ]}
            >
              미입력 ({missingMeetings.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setScoreStatus('completed');
              setPage(1);
            }}
            style={({ pressed }) => [
              styles.filterBtn,
              scoreStatus === 'completed'
                ? styles.filterBtnSuccessActive
                : styles.filterBtnNormal,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                scoreStatus === 'completed'
                  ? styles.filterBtnTextActive
                  : styles.filterBtnTextNormal,
              ]}
            >
              입력완료 ({completedMeetings.length})
            </Text>
          </Pressable>
        </ScrollView>

        {/* Missing section */}
        {showMissingSection && (
          <View style={{ marginTop: tokens.spacing.xs }}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.inlineRow}>
                <FontAwesome5 name="exclamation-circle" size={16} color={tokens.colors.error[600]} />
                <Text style={styles.sectionTitle}>점수 입력 대기</Text>
              </View>
              <View style={styles.badgeRed}>
                <Text style={styles.badgeRedText}>{missingMeetings.length}</Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {missingMeetings.map((m) => renderMeetingCard(m, false))}
            </View>
          </View>
        )}

        {/* Completed section */}
        {showCompletedSection && (
          <View style={{ marginTop: tokens.spacing.sm }}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.inlineRow}>
                <FontAwesome5 name="check-circle" size={16} color={tokens.colors.success?.[600] ?? tokens.colors.emerald[600]} />
                <Text style={styles.sectionTitle}>기록 내역</Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {completedMeetings.map((m) => renderMeetingCard(m, true))}
            </View>
          </View>
        )}

        {/* Empty */}
        {showEmpty && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="golf-ball" size={32} color={tokens.colors.neutral[400]} />
            <Text style={styles.emptyText}>
              {scoreStatus === 'missing'
                ? '점수 입력이 필요한 모임이 없습니다.'
                : scoreStatus === 'completed'
                  ? '입력 완료된 기록이 없습니다.'
                  : '라운딩 종료된 모임이 없습니다.'}
            </Text>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <Pressable
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={({ pressed }) => [
                styles.pageBtn,
                page === 1 && styles.pageBtnDisabled,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.pageBtnText}>이전</Text>
            </Pressable>

            <Text style={styles.paginationText}>
              {page} / {totalPages}
            </Text>

            <Pressable
              onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={({ pressed }) => [
                styles.pageBtn,
                page === totalPages && styles.pageBtnDisabled,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.pageBtnText}>다음</Text>
            </Pressable>
          </View>
        )}

        {loading && meetings.length > 0 && (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={tokens.colors.primary[600]} />
            <Text style={styles.stateText}>불러오는 중...</Text>
          </View>
        )}
      </ScrollView>

      {/* Score Modal */}
      <SimpleScoreInputModal
        visible={showScoreModal}
        onClose={() => {
          setShowScoreModal(false);
          setSelectedMeeting(null);
          setSelectedParticipantId(null);
        }}
        meetingId={selectedMeeting?.meeting_id}
        participantId={selectedParticipantId}
        currentHandicap={currentHandicap}
        onSuccess={onScoreSuccess}
        shouldCompleteRounding={false}
      />

      {/* Coming soon */}
      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
      />
    </View>
  );
}

/* =========================
   Styles
========================= */

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: {
    padding: tokens.padding.md,
    paddingBottom: tokens.padding.xl2,
  },

  /* Center states */
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: tokens.padding.md,
  },
  centerText: {
    fontSize: tokens.font.md,
    color: tokens.colors.neutral[600],
  },

  /* Stats */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: tokens.spacing.md2,
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: tokens.radius.baseLg,
    padding: tokens.padding.sm,
  },
  statCardSkeleton: {
    backgroundColor: tokens.colors.neutral[100],
    borderColor: tokens.colors.neutral[200],
    height: 88,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: tokens.spacing.sm,
  },
  statLabel: {
    fontSize: tokens.font.xs,
    color: tokens.colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statValue: {
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.extrabold,
  },
  statUnit: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[500],
  },
  statsErrorCard: {
    marginBottom: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: tokens.colors.error[200],
    backgroundColor: tokens.colors.error[50],
  },
  statsErrorText: {
    fontSize: tokens.font.sm,
    color: tokens.colors.error[700],
  },
  statsEmptyCard: {
    marginBottom: tokens.spacing.sm2,
    backgroundColor: tokens.colors.neutral[50],
    borderWidth: 1,
    borderColor: tokens.colors.neutral[200],
    alignItems: 'center',
    paddingVertical: tokens.padding.lg2,
  },
  statsEmptyText: {
    fontSize: tokens.font.md,
    color: tokens.colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },

  /* Filter row */
  filterRow: {
    gap: 8,
    paddingBottom: tokens.padding.xs2,
    marginBottom: tokens.spacing.xs,
  },
  filterBtn: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.base,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
  },
  filterBtnNormal: {
    backgroundColor: tokens.colors.white,
    borderColor: tokens.colors.neutral[300],
  },
  filterBtnActive: {
    backgroundColor: tokens.colors.primary[600],
    borderColor: tokens.colors.primary[600],
  },
  filterBtnDangerActive: {
    backgroundColor: tokens.colors.error[600],
    borderColor: tokens.colors.error[600],
  },
  filterBtnSuccessActive: {
    backgroundColor: tokens.colors.emerald[600],
    borderColor: tokens.colors.emerald[600],
  },
  filterBtnText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
  },
  filterBtnTextNormal: {
    color: tokens.colors.neutral[700],
  },
  filterBtnTextActive: {
    color: tokens.colors.white,
  },

  /* Section headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
  },
  sectionTitle: {
    ...base.sectionTitleMd,
    fontWeight: tokens.fontWeight.extrabold,
    marginLeft: tokens.spacing.xs,
  },
  badgeRed: {
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.error[100],
  },
  badgeRedText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.extrabold,
    color: tokens.colors.error[700],
  },

  /* Meeting card */
  meetingBox: {
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    padding: tokens.padding.baseLg,
    backgroundColor: tokens.colors.white,
  },
  meetingMissing: {
    borderColor: tokens.colors.error[200],
    backgroundColor: tokens.colors.error[50],
  },
  meetingCompleted: {
    borderColor: tokens.colors.neutral[200],
    backgroundColor: tokens.colors.white,
  },
  meetingTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.extrabold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xxs,
  },
  meetingClub: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[600],
    marginBottom: tokens.spacing.xs2,
  },
  meetingDatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  meetingDateText: {
    fontSize: tokens.font.xs,
    color: tokens.colors.neutral[500],
  },
  meetingDot: {
    fontSize: tokens.font.xs,
    color: tokens.colors.neutral[400],
  },

  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: tokens.spacing.sm2,
  },
  scoreLabel: {
    fontSize: tokens.font.xs,
    color: tokens.colors.neutral[500],
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing.micro,
  },
  scoreValue: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.neutral[900],
  },
  handicapGreen: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.emerald[600],
  },

  cardBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: tokens.spacing.sm2,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.primary[600],
    paddingVertical: tokens.padding.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: tokens.colors.white,
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
  },
  outlineBtn: {
    ...base.btnOutline,
    flex: 1,
    borderWidth: 2,
    borderColor: tokens.colors.neutral[300],
    paddingVertical: tokens.padding.base,
  },
  outlineBtnText: { ...base.btnOutlineText, fontWeight: tokens.fontWeight.extrabold },
  softPrimaryBtn: {
    flex: 1,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.colors.primary[200],
    backgroundColor: tokens.colors.primary[50],
    paddingVertical: tokens.padding.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softPrimaryBtnText: {
    color: tokens.colors.primary[700],
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
  },

  /* Empty */
  emptyCard: {
    marginTop: tokens.spacing.md2,
    alignItems: 'center',
    paddingVertical: tokens.padding.xl3,
    gap: 10,
  },
  emptyText: {
    fontSize: tokens.font.md,
    color: tokens.colors.neutral[600],
    fontWeight: tokens.fontWeight.bold,
    textAlign: 'center',
  },

  /* Pagination */
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: tokens.spacing.md2,
  },
  pageBtn: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.base,
    borderWidth: 1,
    borderColor: tokens.colors.neutral[300],
    backgroundColor: tokens.colors.white,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.neutral[700],
  },
  paginationText: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[600],
    fontWeight: tokens.fontWeight.bold,
  },

  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: tokens.padding.baseLg,
  },
  stateText: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[600],
  },

  /* Error */
  errorCard: {
    margin: tokens.spacing.md,
    borderWidth: 1,
    borderColor: tokens.colors.error[200],
    backgroundColor: tokens.colors.white,
    paddingVertical: tokens.padding.lg3,
  },
  errorTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.error[700],
    textAlign: 'center',
  },
  errorSub: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[600],
    textAlign: 'center',
  },

  /* Modal common */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: tokens.padding.baseLg,
    justifyContent: 'center',
  },
  modalSheet: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.lg2,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.neutral[200],
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  modalTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.neutral[900],
  },
  iconBtn: {
    padding: tokens.padding.xs,
    borderRadius: tokens.radius.base,
  },
  modalBody: {
    padding: tokens.padding.md,
  },

  handicapBox: {
    borderWidth: 1,
    borderColor: tokens.colors.neutral[200],
    backgroundColor: tokens.colors.neutral[50],
    borderRadius: tokens.radius.baseLg,
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.md2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handicapLabel: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[600],
    fontWeight: tokens.fontWeight.bold,
  },
  handicapValue: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.neutral[900],
  },

  fieldLabel: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
    color: tokens.colors.neutral[700],
    marginBottom: tokens.spacing.xs2,
  },
  input: {
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
  },
  inputNormal: {
    borderColor: tokens.colors.neutral[300],
    backgroundColor: tokens.colors.white,
  },
  inputError: {
    borderColor: tokens.colors.error[300],
    backgroundColor: tokens.colors.error[50],
  },
  errorText: {
    ...base.textSmError,
    marginTop: tokens.spacing.xs,
    color: tokens.colors.error[700],
    fontWeight: tokens.fontWeight.bold,
  },

  previewBox: {
    marginTop: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: tokens.colors.primary[200],
    backgroundColor: tokens.colors.primary[50],
    borderRadius: tokens.radius.baseLg,
    padding: tokens.padding.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
    color: tokens.colors.primary[700],
  },
  previewValue: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.primary[900] ?? tokens.colors.primary[700],
  },
  previewHint: {
    marginTop: tokens.spacing.xs2,
    fontSize: tokens.font.xs,
    color: tokens.colors.primary[700],
    lineHeight: 16,
    fontWeight: tokens.fontWeight.semibold,
  },

  submitErrorBox: {
    marginTop: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: tokens.colors.error[300],
    backgroundColor: tokens.colors.error[50],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.base,
  },
  submitErrorText: {
    fontSize: tokens.font.sm,
    color: tokens.colors.error[700],
    fontWeight: tokens.fontWeight.bold,
  },

  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: tokens.spacing.md,
  },
  modalBtn: {
    flex: 1,
    borderRadius: tokens.radius.baseLg,
    paddingVertical: tokens.padding.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnOutline: {
    borderWidth: 2,
    borderColor: tokens.colors.neutral[300],
    backgroundColor: tokens.colors.white,
  },
  modalBtnOutlineText: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.neutral[700],
  },
  modalBtnPrimary: {
    backgroundColor: tokens.colors.primary[600],
  },
  modalBtnPrimaryText: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.white,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  comingSoonTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: tokens.colors.neutral[800],
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  comingSoonSub: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.md2,
    fontWeight: tokens.fontWeight.semibold,
  },
  fullPrimaryBtn: {
    marginTop: tokens.spacing.xs,
    backgroundColor: tokens.colors.primary[600],
    borderRadius: tokens.radius.baseLg,
    paddingVertical: tokens.padding.sm,
    alignItems: 'center',
  },
  fullPrimaryBtnText: {
    color: tokens.colors.white,
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.black,
  },
});
