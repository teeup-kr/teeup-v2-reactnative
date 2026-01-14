import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';

import ComingSoonModal from '@/components/mypage/ComingSoonModal';
import RecordMeetingCard from '@/components/mypage/RecordMeetingCard';
import RoundingStatsCard from '@/components/mypage/RoundingStatsCard';
import SimpleScoreInputModal from '@/components/mypage/SimpleScoreInputModal';
import Card from '@/components/ui/Card';
import { mypageApi } from '@/lib/api/api';
import {
  createCloseComingSoonHandler,
  createCloseScoreModalHandler,
  createFetchHandicapHandler,
  createFetchMeetingsHandler,
  createFetchStatsHandler,
  createGoToDetailHandler,
  createNextPageHandler,
  createOpenComingSoonHandler,
  createOpenScoreModalHandler,
  createPrevPageHandler,
  createScoreStatusHandler,
  createScoreStatusPressHandler,
  createScoreSuccessHandler,
} from '@/lib/render/mypage';
import { getRecordErrorMessage, pickData } from '@/lib/util/mypageUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';



export default function RecordsTab() {
  const router = useRouter();

  const [scoreStatus, setScoreStatus] = useState('all');
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

  const fetchStats = useMemo(
    () =>
      createFetchStatsHandler({
        fetchRoundingStats: mypageApi.fetchRoundingStats,
        pickData,
        setStatsLoading,
        setStatsError,
        setStats,
      }),
    [setStatsLoading, setStatsError, setStats]
  );

  const fetchMeetings = useMemo(
    () =>
      createFetchMeetingsHandler({
        fetchMyRoundingMeetings: mypageApi.fetchMyRoundingMeetings,
        scoreStatus,
        page,
        limit,
        pickData,
        setMeetings,
        setTotalPages,
        setLoading,
        setError,
      }),
    [scoreStatus, page, limit, setMeetings, setTotalPages, setLoading, setError]
  );

  const fetchHandicap = useMemo(
    () =>
      createFetchHandicapHandler({
        fetchMyProfile: mypageApi.fetchMyProfile,
        fetchUserHandicap: mypageApi.fetchUserHandicap,
        pickData,
        setCurrentHandicap,
      }),
    [setCurrentHandicap]
  );

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
    () => meetings.filter((meeting) => !meeting?.has_score),
    [meetings]
  );
  const completedMeetings = useMemo(
    () => meetings.filter((meeting) => !!meeting?.has_score),
    [meetings]
  );

  const handleScoreStatusSelect = useMemo(
    () => createScoreStatusHandler({ setScoreStatus, setPage }),
    [setScoreStatus, setPage]
  );
  const handleScoreStatusPress = useMemo(
    () => createScoreStatusPressHandler({ onSelect: handleScoreStatusSelect }),
    [handleScoreStatusSelect]
  );
  const handlePrevPage = useMemo(
    () => createPrevPageHandler({ setPage }),
    [setPage]
  );
  const handleNextPage = useMemo(
    () => createNextPageHandler({ setPage, totalPages }),
    [setPage, totalPages]
  );
  const handleCloseScoreModal = useMemo(
    () =>
      createCloseScoreModalHandler({
        setShowScoreModal,
        setSelectedMeeting,
        setSelectedParticipantId,
      }),
    [setShowScoreModal, setSelectedMeeting, setSelectedParticipantId]
  );
  const handleOpenComingSoon = useMemo(
    () => createOpenComingSoonHandler({ setShowComingSoonModal }),
    [setShowComingSoonModal]
  );
  const handleCloseComingSoon = useMemo(
    () => createCloseComingSoonHandler({ setShowComingSoonModal }),
    [setShowComingSoonModal]
  );
  const handleOpenScoreModal = useMemo(
    () =>
      createOpenScoreModalHandler({
        fetchRoundParticipants: mypageApi.fetchRoundParticipants,
        fetchMyProfile: mypageApi.fetchMyProfile,
        pickData,
        setSelectedParticipantId,
        setSelectedMeeting,
        setShowScoreModal,
        alert: Alert.alert,
      }),
    [setSelectedParticipantId, setSelectedMeeting, setShowScoreModal]
  );
  const handleScoreSuccess = useMemo(
    () =>
      createScoreSuccessHandler({
        setShowScoreModal,
        setSelectedMeeting,
        setSelectedParticipantId,
        fetchMeetings,
        fetchStats,
        fetchHandicap,
      }),
    [
      setShowScoreModal,
      setSelectedMeeting,
      setSelectedParticipantId,
      fetchMeetings,
      fetchStats,
      fetchHandicap,
    ]
  );
  const handleGoToDetail = useMemo(
    () => createGoToDetailHandler({ router }),
    [router]
  );

  if (loading && meetings.length === 0) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.centerText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    const message = getRecordErrorMessage(error);
    return (
      <View style={styles.safeArea}>
        <Card style={styles.errorCard}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <FontAwesome5 name="times" size={36} color={colors.error[600]} />
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
        <RoundingStatsCard stats={stats} isLoading={statsLoading} error={statsError} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Pressable
            onPress={handleScoreStatusPress('all')}
            style={({ pressed }) => [
              styles.filterBtn,
              scoreStatus === 'all' ? styles.filterBtnActive : styles.filterBtnNormal,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                scoreStatus === 'all'
                  ? styles.filterBtnTextActive
                  : styles.filterBtnTextNormal,
              ]}
            >
              전체
            </Text>
          </Pressable>

          <Pressable
            onPress={handleScoreStatusPress('missing')}
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
            onPress={handleScoreStatusPress('completed')}
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

        {showMissingSection && (
          <View style={{ marginTop: tokens.spacing.xs }}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.inlineRow}>
                <FontAwesome5 name="exclamation-circle" size={16} color={colors.error[600]} />
                <Text style={styles.sectionTitle}>점수 입력 대기</Text>
              </View>
              <View style={styles.badgeRed}>
                <Text style={styles.badgeRedText}>{missingMeetings.length}</Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {missingMeetings.map((meeting) => (
                <RecordMeetingCard
                  key={meeting.meeting_id}
                  meeting={meeting}
                  currentHandicap={currentHandicap}
                  onOpenDetail={handleGoToDetail}
                  onOpenScore={handleOpenScoreModal}
                  onOpenComingSoon={handleOpenComingSoon}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        )}

        {showCompletedSection && (
          <View style={{ marginTop: tokens.spacing.sm }}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.inlineRow}>
                <FontAwesome5
                  name="check-circle"
                  size={16}
                  color={colors.success?.[600] ?? colors.emerald[600]}
                />
                <Text style={styles.sectionTitle}>기록 내역</Text>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              {completedMeetings.map((meeting) => (
                <RecordMeetingCard
                  key={meeting.meeting_id}
                  meeting={meeting}
                  isCompleted
                  currentHandicap={currentHandicap}
                  onOpenDetail={handleGoToDetail}
                  onOpenScore={handleOpenScoreModal}
                  onOpenComingSoon={handleOpenComingSoon}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        )}

        {showEmpty && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="golf-ball" size={32} color={colors.neutral[400]} />
            <Text style={styles.emptyText}>
              {scoreStatus === 'missing'
                ? '점수 입력이 필요한 모임이 없습니다.'
                : scoreStatus === 'completed'
                  ? '입력 완료된 기록이 없습니다.'
                  : '라운딩 종료된 모임이 없습니다.'}
            </Text>
          </Card>
        )}

        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <Pressable
              onPress={handlePrevPage}
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
              onPress={handleNextPage}
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
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.stateText}>불러오는 중...</Text>
          </View>
        )}
      </ScrollView>

      <SimpleScoreInputModal
        visible={showScoreModal}
        onClose={handleCloseScoreModal}
        meetingId={selectedMeeting?.meeting_id}
        participantId={selectedParticipantId}
        currentHandicap={currentHandicap}
        onSuccess={handleScoreSuccess}
        shouldCompleteRounding={false}
      />

      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={handleCloseComingSoon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: {
    padding: tokens.padding.md,
    paddingBottom: tokens.padding.xl2,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: tokens.padding.md,
  },
  centerText: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
  },

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
    backgroundColor: colors.white,
    borderColor: colors.neutral[300],
  },
  filterBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterBtnDangerActive: {
    backgroundColor: colors.error[600],
    borderColor: colors.error[600],
  },
  filterBtnSuccessActive: {
    backgroundColor: colors.emerald[600],
    borderColor: colors.emerald[600],
  },
  filterBtnText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
  },
  filterBtnTextNormal: {
    color: colors.neutral[700],
  },
  filterBtnTextActive: {
    color: colors.white,
  },

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
    backgroundColor: colors.error[100],
  },
  badgeRedText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.extrabold,
    color: colors.error[700],
  },

  meetingBox: {
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    padding: tokens.padding.baseLg,
    backgroundColor: colors.white,
  },
  meetingMissing: {
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
  },
  meetingCompleted: {
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  meetingTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.extrabold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xxs,
  },
  meetingClub: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
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
    color: colors.neutral[500],
  },
  meetingDot: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
  },

  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: tokens.spacing.sm2,
  },
  scoreLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing.micro,
  },
  scoreValue: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.black,
    color: colors.neutral[900],
  },
  handicapGreen: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.black,
    color: colors.emerald[600],
  },

  cardBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: tokens.spacing.sm2,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primary[600],
    paddingVertical: tokens.padding.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
  },
  outlineBtn: {
    ...base.btnOutline,
    flex: 1,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    paddingVertical: tokens.padding.base,
  },
  outlineBtnText: { ...base.btnOutlineText, fontWeight: tokens.fontWeight.extrabold },
  softPrimaryBtn: {
    flex: 1,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    paddingVertical: tokens.padding.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softPrimaryBtnText: {
    color: colors.primary[700],
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
  },

  emptyCard: {
    marginTop: tokens.spacing.md2,
    alignItems: 'center',
    paddingVertical: tokens.padding.xl3,
    gap: 10,
  },
  emptyText: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.bold,
    textAlign: 'center',
  },

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
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[700],
  },
  paginationText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
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
    color: colors.neutral[600],
  },

  errorCard: {
    margin: tokens.spacing.md,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.white,
    paddingVertical: tokens.padding.lg3,
  },
  errorTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.black,
    color: colors.error[700],
    textAlign: 'center',
  },
  errorSub: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    textAlign: 'center',
  },

  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
