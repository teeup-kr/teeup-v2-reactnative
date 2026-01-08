import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import SimpleScoreInputModal from '@/components/meetings/SimpleScoreInputModal';
import RoundingStatsCard from '@/components/profile/RoundingStatsCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { recordStatusTabs } from '@/constants/mypageConstants';
import { roundsApi, usersApi } from '@/lib/api';
import { formatProfileDate } from '@/lib/mypageUtils';
import { extractData, extractList } from '@/lib/responseUtils';
import { colors } from '@/theme/colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FilterChip = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipActive,
      pressed && styles.chipPressed,
    ]}
  >
    <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

export default function RecordsScreen() {
  const router = useRouter();
  const [scoreStatus, setScoreStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [userProfile, setUserProfile] = useState(null);
  const [handicapInfo, setHandicapInfo] = useState(null);

  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);

  const userId = useMemo(() => {
    return userProfile?.id || userProfile?.data?.id || null;
  }, [userProfile]);

  const currentHandicap = useMemo(() => {
    if (!handicapInfo) return null;
    return handicapInfo.calculated_handicap ?? handicapInfo.initial_handicap ?? null;
  }, [handicapInfo]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await usersApi.getMyProfile();
      setUserProfile(extractData(response));
    } catch (fetchError) {
      console.error('프로필 조회 실패:', fetchError);
    }
  }, []);

  const fetchHandicap = useCallback(async (id) => {
    if (!id) return;
    try {
      const response = await usersApi.getUserHandicap(id);
      setHandicapInfo(extractData(response));
    } catch (fetchError) {
      console.error('핸디캡 조회 실패:', fetchError);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const response = await usersApi.getRoundingStats();
      setStatsData(extractData(response));
    } catch (fetchError) {
      console.error('통계 조회 실패:', fetchError);
      setStatsError(fetchError);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
        ...(scoreStatus !== 'all' ? { score_status: scoreStatus } : {}),
      };
      const response = await usersApi.getMyRoundingMeetings(params);
      const items = extractList(response);
      setMeetings(items);
      setTotalPages(response?.total_pages || response?.totalPages || 1);
    } catch (fetchError) {
      console.error('라운딩 기록 조회 실패:', fetchError);
      setError('기록 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, scoreStatus]);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [fetchProfile, fetchStats]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    if (userId) {
      fetchHandicap(userId);
    }
  }, [userId, fetchHandicap]);

  const handleOpenScoreModal = async (meeting) => {
    const meetingId = meeting?.meeting_id || meeting?.id;
    if (!meetingId) {
      Alert.alert('안내', '모임 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const participants = await roundsApi.getRoundParticipants(meetingId);
      const list = extractList(participants);
      const me = list.find((participant) => participant.user_id === userId);
      if (!me) {
        Alert.alert('안내', '참가자 정보를 찾을 수 없습니다.');
        return;
      }
      setSelectedMeeting(meeting);
      setSelectedParticipantId(me.id);
      setScoreModalOpen(true);
    } catch (fetchError) {
      console.error('참가자 조회 실패:', fetchError);
      Alert.alert('오류', '참가자 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleScoreSuccess = () => {
    setScoreModalOpen(false);
    setSelectedMeeting(null);
    setSelectedParticipantId(null);
    fetchMeetings();
    fetchStats();
    if (userId) {
      fetchHandicap(userId);
    }
  };

  const handleDetailNavigate = (meeting) => {
    const meetingId = meeting?.meeting_id || meeting?.id;
    if (meetingId) {
      router.push(`/meetings/rounding/${meetingId}`);
    }
  };

  const filteredMeetings = meetings.filter((meeting) => {
    if (scoreStatus === 'all') return true;
    const hasScore = meeting?.has_score || meeting?.gross_score !== null && meeting?.gross_score !== undefined;
    return scoreStatus === 'completed' ? hasScore : !hasScore;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />
        <RoundingStatsCard
          stats={statsData}
          isLoading={statsLoading}
          error={statsError}
        />

        <Card style={styles.filterCard}>
          <Text style={styles.sectionTitle}>스코어 입력 상태</Text>
          <View style={styles.chipRow}>
            {recordStatusTabs.map((tab) => (
              <FilterChip
                key={tab.id}
                label={tab.label}
                selected={scoreStatus === tab.id}
                onPress={() => {
                  setScoreStatus(tab.id);
                  setPage(1);
                }}
              />
            ))}
          </View>
        </Card>

        {loading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.stateText}>기록을 불러오는 중...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>표시할 기록이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>다른 필터를 선택해보세요.</Text>
          </Card>
        ) : (
          filteredMeetings.map((meeting, index) => {
            const hasScore = meeting?.has_score || meeting?.gross_score !== null && meeting?.gross_score !== undefined;
            const meetingId = meeting?.meeting_id || meeting?.id;
            const meetingKey = meetingId || `meeting-${index}`;
            const detailDate = meeting?.meeting_time ? formatProfileDate(meeting.meeting_time) : '-';
            const completedDate = meeting?.rounding_completed_at ? formatProfileDate(meeting.rounding_completed_at) : '-';

            return (
              <Card
                key={meetingKey}
                style={hasScore ? styles.recordCard : styles.missingCard}
              >
                <View style={styles.recordHeader}>
                  <View style={styles.recordTitleWrap}>
                    <Pressable onPress={() => handleDetailNavigate(meeting)}>
                      <Text style={styles.recordTitle}>{meeting?.meeting_name || '모임명 없음'}</Text>
                    </Pressable>
                    <Text style={styles.recordSubtitle}>{meeting?.club_name || '-'}</Text>
                  </View>
                  <View style={styles.recordHeaderActions}>
                    <View style={hasScore ? styles.completeBadge : styles.missingBadge}>
                      <Text style={hasScore ? styles.completeBadgeText : styles.missingBadgeText}>
                        {hasScore ? '완료' : '미입력'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.recordDateRow}>
                  <Text style={styles.recordDate}>경기일: {detailDate}</Text>
                  <Text style={styles.recordDate}>종료일: {completedDate}</Text>
                </View>

                {hasScore ? (
                  <View style={styles.scoreRow}>
                    <View>
                      <Text style={styles.scoreLabel}>라운딩 스코어</Text>
                      <Text style={styles.scoreValue}>{meeting?.gross_score}</Text>
                    </View>
                    {currentHandicap !== null && (
                      <View>
                        <Text style={styles.scoreLabel}>업데이트된 핸디캡</Text>
                        <Text style={styles.scoreValue}>
                          {Number(currentHandicap).toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.missingNotice}>
                    <FontAwesome5 name="exclamation-circle" size={14} color={colors.error[600]} />
                    <Text style={styles.missingNoticeText}>점수를 입력해야 핸디캡이 계산됩니다.</Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <Button
                    variant={hasScore ? 'outline' : 'primary'}
                    size="sm"
                    style={styles.actionButton}
                    onPress={() => handleOpenScoreModal(meeting)}
                  >
                    {hasScore ? '수정' : '점수 입력'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    style={styles.actionButton}
                    onPress={() => setComingSoonOpen(true)}
                  >
                    상세 {hasScore ? '수정' : '입력'}
                  </Button>
                </View>
              </Card>
            );
          })
        )}

        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onPress={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              이전
            </Button>
            <Text style={styles.paginationText}>{page} / {totalPages}</Text>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              다음
            </Button>
          </View>
        )}
        <AppFooter />
      </ScrollView>

      <SimpleScoreInputModal
        visible={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        meetingId={selectedMeeting?.meeting_id || selectedMeeting?.id}
        participantId={selectedParticipantId}
        currentHandicap={currentHandicap}
        onSuccess={handleScoreSuccess}
      />

      <Modal
        visible={comingSoonOpen}
        title="상세 입력"
        onClose={() => setComingSoonOpen(false)}
        footer={(
          <Button size="sm" onPress={() => setComingSoonOpen(false)}>
            확인
          </Button>
        )}
      >
        <Text style={styles.modalText}>상세 입력은 준비 중입니다.</Text>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  filterCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
  },
  chipPressed: {
    opacity: 0.9,
  },
  chipText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  stateText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  errorCard: {
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  errorText: {
    color: colors.error[600],
    fontSize: 12,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 6,
  },
  recordCard: {
    marginBottom: 16,
  },
  missingCard: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordTitleWrap: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  recordSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.neutral[500],
  },
  recordHeaderActions: {
    alignItems: 'flex-end',
  },
  missingBadge: {
    backgroundColor: colors.error[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  missingBadgeText: {
    fontSize: 11,
    color: colors.error[700],
    fontWeight: '600',
  },
  completeBadge: {
    backgroundColor: colors.success[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeBadgeText: {
    fontSize: 11,
    color: colors.success[700],
    fontWeight: '600',
  },
  recordDateRow: {
    marginTop: 8,
  },
  recordDate: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 4,
  },
  missingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  missingNoticeText: {
    fontSize: 12,
    color: colors.error[700],
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  paginationText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  modalText: {
    fontSize: 13,
    color: colors.neutral[700],
    textAlign: 'center',
  },
});
