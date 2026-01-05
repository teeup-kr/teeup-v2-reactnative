import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { roundsApi, socialsApi, clubApi } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';

const tabs = [
  { id: 'rounding', label: '라운딩' },
  { id: 'social', label: '소셜' },
];

const statusTabs = [
  { id: 'active', label: '진행중/예정' },
  { id: 'completed', label: '완료/취소' },
];

const typeLabel = {
  ROUND: '라운딩',
  ROUNDING: '라운딩',
  SOCIAL: '소셜',
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR');
};

const isPastDateTime = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
};

const isMeetingActive = (meeting) => {
  const status = meeting?.status;
  const participantCount = meeting?.participant_count || 0;
  const meetingType = meeting?.meeting_type || meeting?.type || 'ROUND';
  const isRoundingMeeting = meetingType === 'ROUND' || meetingType === 'ROUNDING';
  const meetingTime = meeting?.meeting_time;

  const isMinParticipantsNotMet = isRoundingMeeting
    ? participantCount >= 1 && participantCount <= 3
    : participantCount === 1;

  const isDeadlinePassed = meeting?.application_deadline
    ? isPastDateTime(meeting.application_deadline)
    : false;

  const isApplicationClosed = isDeadlinePassed || meeting?.application_closed_early;

  const isCanceled =
    status === 'CANCELED' ||
    (status === 'SCHEDULED' && isApplicationClosed && isMinParticipantsNotMet);

  if (meeting?.settlement_confirmed || meeting?.is_completed || status === 'COMPLETED') {
    return false;
  }

  if (isRoundingMeeting) {
    if (meeting?.rounding_completed_at) {
      return false;
    }
    if (meetingTime && isPastDateTime(meetingTime) && !meeting?.rounding_completed_at) {
      return false;
    }
  } else if (meetingTime && isPastDateTime(meetingTime)) {
    return false;
  }

  return !isCanceled;
};

const filterByDate = (meetings, startDate, endDate) => {
  if (!startDate && !endDate) return meetings;
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  return meetings.filter((meeting) => {
    if (!meeting?.meeting_time) return false;
    const meetingDate = new Date(meeting.meeting_time);
    if (Number.isNaN(meetingDate.getTime())) return false;

    if (start && end) {
      return meetingDate >= start && meetingDate <= end;
    }
    if (start) {
      return meetingDate >= start;
    }
    if (end) {
      return meetingDate <= end;
    }
    return true;
  });
};

const MeetingCard = ({ meeting, onPress }) => {
  const meetingType = meeting?.meeting_type || meeting?.type || 'ROUND';
  const typeText = typeLabel[meetingType] || meetingType;
  const active = isMeetingActive(meeting);
  const statusText = active ? '진행중/예정' : '완료/취소';

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{meeting?.meeting_name || meeting?.name || '모임명 없음'}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{typeText}</Text>
          </View>
          <View style={[styles.statusBadge, !active && styles.statusBadgeInactive]}>
            <Text style={styles.statusBadgeText}>{statusText}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.cardSubtitle}>{meeting?.club_name || meeting?.club || '-'}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <FontAwesome5 name="calendar-alt" size={12} color={colors.neutral[500]} />
          <Text style={styles.metaText}>{formatDateTime(meeting?.meeting_time)}</Text>
        </View>
        <View style={styles.metaItem}>
          <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
          <Text style={styles.metaText}>{meeting?.location || meeting?.venue_name || '-'}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.participantText}>{meeting?.participant_count || 0}명 참여</Text>
        <Pressable style={styles.detailButton} onPress={onPress}>
          <Text style={styles.detailButtonText}>상세 보기</Text>
        </Pressable>
      </View>
    </Card>
  );
};

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

export default function MeetingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('rounding');
  const [hasClubs, setHasClubs] = useState(false);

  const [roundingMeetings, setRoundingMeetings] = useState([]);
  const [roundingLoading, setRoundingLoading] = useState(true);
  const [roundingError, setRoundingError] = useState(null);
  const [roundingPage, setRoundingPage] = useState(1);
  const [roundingTotalPages, setRoundingTotalPages] = useState(1);
  const [roundingSearchInput, setRoundingSearchInput] = useState('');
  const [roundingSearchQuery, setRoundingSearchQuery] = useState('');
  const [roundingStartDate, setRoundingStartDate] = useState('');
  const [roundingEndDate, setRoundingEndDate] = useState('');
  const [roundingStatusFilter, setRoundingStatusFilter] = useState('active');

  const [socialMeetings, setSocialMeetings] = useState([]);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialError, setSocialError] = useState(null);
  const [socialPage, setSocialPage] = useState(1);
  const [socialTotalPages, setSocialTotalPages] = useState(1);
  const [socialSearchInput, setSocialSearchInput] = useState('');
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [socialStartDate, setSocialStartDate] = useState('');
  const [socialEndDate, setSocialEndDate] = useState('');
  const [socialStatusFilter, setSocialStatusFilter] = useState('active');

  const fetchClubs = useCallback(async () => {
    try {
      const response = await clubApi.getMyClubs();
      const clubs = response?.data || response || [];
      const activeClubs = clubs.filter((club) => club.status === 'ACTIVE' || club.status === 'APPROVED');
      setHasClubs(activeClubs.length > 0);
    } catch (error) {
      console.error('클럽 목록 조회 실패:', error);
      setHasClubs(false);
    }
  }, []);

  const fetchRoundingMeetings = useCallback(async () => {
    try {
      setRoundingLoading(true);
      setRoundingError(null);
      const params = {
        page: roundingPage,
        limit: 6,
        ...(roundingSearchQuery ? { search: roundingSearchQuery } : {}),
      };
      const response = await roundsApi.getRounds(params);
      const payload = response?.data ? response : { data: response };
      const items = Array.isArray(payload?.data) ? payload.data : [];
      let filtered = filterByDate(items, roundingStartDate, roundingEndDate);
      filtered = filtered.filter((meeting) =>
        roundingStatusFilter === 'active' ? isMeetingActive(meeting) : !isMeetingActive(meeting),
      );
      setRoundingMeetings(filtered);
      setRoundingTotalPages(payload?.total_pages || 1);
    } catch (error) {
      console.error('라운딩 목록 조회 실패:', error);
      setRoundingError('라운딩 목록을 불러오는데 실패했습니다.');
    } finally {
      setRoundingLoading(false);
    }
  }, [roundingPage, roundingSearchQuery, roundingStartDate, roundingEndDate, roundingStatusFilter]);

  const fetchSocialMeetings = useCallback(async () => {
    try {
      setSocialLoading(true);
      setSocialError(null);
      const params = {
        page: socialPage,
        limit: 6,
        ...(socialSearchQuery ? { search: socialSearchQuery } : {}),
      };
      const response = await socialsApi.getSocials(params);
      const payload = response?.data ? response : { data: response };
      const items = Array.isArray(payload?.data) ? payload.data : [];
      let filtered = filterByDate(items, socialStartDate, socialEndDate);
      filtered = filtered.filter((meeting) =>
        socialStatusFilter === 'active' ? isMeetingActive(meeting) : !isMeetingActive(meeting),
      );
      setSocialMeetings(filtered);
      setSocialTotalPages(payload?.total_pages || 1);
    } catch (error) {
      console.error('소셜 목록 조회 실패:', error);
      setSocialError('소셜 목록을 불러오는데 실패했습니다.');
    } finally {
      setSocialLoading(false);
    }
  }, [socialPage, socialSearchQuery, socialStartDate, socialEndDate, socialStatusFilter]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    fetchRoundingMeetings();
  }, [fetchRoundingMeetings]);

  useEffect(() => {
    fetchSocialMeetings();
  }, [fetchSocialMeetings]);

  const activeMeetings = activeTab === 'rounding' ? roundingMeetings : socialMeetings;
  const isLoading = activeTab === 'rounding' ? roundingLoading : socialLoading;
  const errorText = activeTab === 'rounding' ? roundingError : socialError;
  const page = activeTab === 'rounding' ? roundingPage : socialPage;
  const totalPages = activeTab === 'rounding' ? roundingTotalPages : socialTotalPages;

  const handleSearch = () => {
    if (activeTab === 'rounding') {
      setRoundingSearchQuery(roundingSearchInput);
      setRoundingPage(1);
    } else {
      setSocialSearchQuery(socialSearchInput);
      setSocialPage(1);
    }
  };

  const handlePageChange = (nextPage) => {
    if (activeTab === 'rounding') {
      setRoundingPage(nextPage);
    } else {
      setSocialPage(nextPage);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>모임</Text>
            <Text style={styles.subtitle}>라운딩/소셜 일정을 관리하세요</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Button
            variant="primary"
            size="sm"
            onPress={() => router.push('/meetings/rounding/create')}
            disabled={!hasClubs}
          >
            라운딩 만들기
          </Button>
          <View style={styles.actionSpacer} />
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.push('/meetings/social/create')}
            disabled={!hasClubs}
          >
            소셜 만들기
          </Button>
        </View>
        {!hasClubs && (
          <Text style={styles.noticeText}>모임 생성은 승인된 클럽 멤버만 가능합니다.</Text>
        )}

        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card style={styles.filterCard}>
          <Text style={styles.sectionTitle}>검색</Text>
          <View style={styles.searchRow}>
            <FontAwesome5 name="search" size={14} color={colors.neutral[400]} />
            <TextInput
              value={activeTab === 'rounding' ? roundingSearchInput : socialSearchInput}
              onChangeText={activeTab === 'rounding' ? setRoundingSearchInput : setSocialSearchInput}
              placeholder="모임명으로 검색"
              style={styles.searchInput}
              placeholderTextColor={colors.neutral[400]}
            />
            <Pressable style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>검색</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>기간</Text>
          <View style={styles.dateRow}>
            <TextInput
              value={activeTab === 'rounding' ? roundingStartDate : socialStartDate}
              onChangeText={activeTab === 'rounding' ? setRoundingStartDate : setSocialStartDate}
              placeholder="시작일 (YYYY-MM-DD)"
              style={styles.dateInput}
              placeholderTextColor={colors.neutral[400]}
            />
            <TextInput
              value={activeTab === 'rounding' ? roundingEndDate : socialEndDate}
              onChangeText={activeTab === 'rounding' ? setRoundingEndDate : setSocialEndDate}
              placeholder="종료일 (YYYY-MM-DD)"
              style={styles.dateInput}
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          <Text style={styles.sectionTitle}>상태</Text>
          <View style={styles.chipRow}>
            {statusTabs.map((tab) => (
              <FilterChip
                key={tab.id}
                label={tab.label}
                selected={activeTab === 'rounding'
                  ? roundingStatusFilter === tab.id
                  : socialStatusFilter === tab.id}
                onPress={() => {
                  if (activeTab === 'rounding') {
                    setRoundingStatusFilter(tab.id);
                    setRoundingPage(1);
                  } else {
                    setSocialStatusFilter(tab.id);
                    setSocialPage(1);
                  }
                }}
              />
            ))}
          </View>
        </Card>

        {isLoading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.stateText}>모임을 불러오는 중...</Text>
          </View>
        ) : errorText ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{errorText}</Text>
          </Card>
        ) : activeMeetings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>표시할 모임이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>다른 필터를 선택해보세요.</Text>
          </Card>
        ) : (
          activeMeetings.map((meeting, index) => {
            const meetingType = meeting?.meeting_type || meeting?.type || 'ROUND';
            const slug = meetingType === 'SOCIAL' ? 'social' : 'rounding';
            const meetingId = meeting?.id || meeting?.meeting_id || `meeting-${index}`;

            return (
              <MeetingCard
                key={meetingId}
                meeting={meeting}
                onPress={() => router.push(`/meetings/${slug}/${meetingId}`)}
              />
            );
          })
        )}

        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <Pressable
              onPress={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>이전</Text>
            </Pressable>
            <Text style={styles.paginationText}>{page} / {totalPages}</Text>
            <Pressable
              onPress={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>다음</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 24,
  },
  headerRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  actionSpacer: {
    width: 8,
  },
  noticeText: {
    fontSize: 11,
    color: colors.warning[600],
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  tabText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.white,
  },
  filterCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: colors.neutral[900],
  },
  searchButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primary[600],
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 11,
    color: colors.neutral[900],
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
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary[700],
  },
  statusBadge: {
    backgroundColor: colors.success[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeInactive: {
    backgroundColor: colors.neutral[200],
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.neutral[600],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  participantText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  detailButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary[600],
    borderRadius: 10,
  },
  detailButtonText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
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
    fontSize: 12,
    color: colors.error[600],
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
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 12,
    color: colors.neutral[700],
  },
  paginationText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
});
