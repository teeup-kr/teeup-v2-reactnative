import {
FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams,
useRouter } from 'expo-router';
import { useCallback,
useEffect,
useMemo,
useState } from 'react';
import { ActivityIndicator,
Pressable,
ScrollView,
Text,
TextInput,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginRequired from '@/components/auth/LoginRequired';
import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { meetingTabs, meetingValidTabs } from '@/constants/meetingConstants';
import { useAuth } from '@/context/AuthContext';
import { clubApi, roundsApi, socialsApi } from '@/lib/api';
import {
  extractList,
  filterByDate,
  filterByStatus,
  formatCost,
  formatMeetingTime,
  formatYmd,
  getDateRange,
  getMeetingStatusBadgeConfigs,
  getMeetingTypeBadgeConfig,
  parseYmd,
} from '@/lib/meetingUtils';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/tabs/meetings/index';

const Badge = ({ text, backgroundColor, textColor }) => (
  <View style={[styles.badge, { backgroundColor }]}>
    <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
  </View>
);

const DateField = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const dateValue = parseYmd(value) || new Date();

  return (
    <View style={styles.dateField}>
      <Pressable onPress={() => setOpen(true)} style={styles.dateInput}>
        <Text style={[styles.dateInputText, !value && styles.dateInputPlaceholder]}>
          {value || 'YYYY-MM-DD'}
        </Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setOpen(false);
            if (event?.type === 'dismissed') return;
            if (!selectedDate) return;
            onChange(formatYmd(selectedDate));
          }}
        />
      )}
    </View>
  );
};

const MeetingCard = ({ meeting, onPress }) => {
  const meetingType = meeting?.meeting_type || meeting?.type || 'ROUND';
  const maxParticipants = meeting?.max_participants ?? meeting?.maxParticipants;
  const typeConfig = getMeetingTypeBadgeConfig(meetingType);
  const statusBadges = getMeetingStatusBadgeConfigs(meeting);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleArea}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {meeting?.name || '모임명 없음'}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {meeting?.club_name || '-'}
            </Text>
          </View>
          <View style={styles.cardBadgeRow}>
            {typeConfig ? (
              <Badge
                text={typeConfig.text}
                backgroundColor={typeConfig.backgroundColor}
                textColor={typeConfig.textColor}
              />
            ) : null}
            <View style={styles.statusBadgeRow}>
              {statusBadges.map((badge) => (
                <Badge
                  key={badge.key}
                  text={badge.text}
                  backgroundColor={badge.backgroundColor}
                  textColor={badge.textColor}
                />
              ))}
            </View>
          </View>
        </View>

        {meeting?.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {meeting.description}
          </Text>
        ) : null}

        <View style={styles.metaList}>
          <View style={styles.metaItem}>
            <FontAwesome5 name="calendar-alt" size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatMeetingTime(meeting?.meeting_time)}
            </Text>
          </View>
          {meeting?.location ? (
            <View style={styles.metaItem}>
              <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText} numberOfLines={1}>
                {meeting.location}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <FontAwesome5 name="users" size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText}>
              {meeting?.participant_count ?? 0}
              {maxParticipants ? `/${maxParticipants}` : ''}명
            </Text>
          </View>
          {meeting?.application_deadline ? (
            <View style={styles.metaItem}>
              <FontAwesome5 name="clock" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText} numberOfLines={1}>
                참가 신청 마감: {formatMeetingTime(meeting.application_deadline)}
              </Text>
            </View>
          ) : null}
        </View>

        {meetingType === 'ROUND' && (
          <View style={styles.extraList}>
            {meeting?.course_name ? (
              <View style={styles.metaItem}>
                <Text style={styles.golfEmoji}>🏌️</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {meeting.course_name}
                </Text>
              </View>
            ) : null}
            {meeting?.total_cost ? (
              <View style={styles.metaItem}>
                <FontAwesome5 name="dollar-sign" size={12} color={colors.neutral[500]} />
                <Text style={styles.metaText}>총 비용: {formatCost(meeting.total_cost)}</Text>
              </View>
            ) : null}
          </View>
        )}

        {meetingType === 'SOCIAL' && meeting?.social_cost ? (
          <View style={styles.extraList}>
            <View style={styles.metaItem}>
              <FontAwesome5 name="dollar-sign" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText}>참가 비용(원): {formatCost(meeting.social_cost)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            {meeting?.created_at ? new Date(meeting.created_at).toLocaleDateString('ko-KR') : '-'}
          </Text>
          <Text style={styles.cardLink}>자세히 보기 →</Text>
        </View>
      </Card>
    </Pressable>
  );
};

export default function MeetingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const initialTab = useMemo(() => (tabParam === 'social' ? 'social' : 'rounding'), [tabParam]);
  const [activeTab, setActiveTab] = useState(initialTab);

  const [roundingMeetings, setRoundingMeetings] = useState([]);
  const [socialMeetings, setSocialMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasClubs, setHasClubs] = useState(false);

  const [roundingPage, setRoundingPage] = useState(1);
  const [socialPage, setSocialPage] = useState(1);
  const [roundingTotalPages, setRoundingTotalPages] = useState(1);
  const [socialTotalPages, setSocialTotalPages] = useState(1);

  const [roundingSearchInput, setRoundingSearchInput] = useState('');
  const [roundingSearchQuery, setRoundingSearchQuery] = useState('');
  const [roundingStartDate, setRoundingStartDate] = useState('');
  const [roundingEndDate, setRoundingEndDate] = useState('');
  const [roundingStatusFilter, setRoundingStatusFilter] = useState('active');

  const [socialSearchInput, setSocialSearchInput] = useState('');
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [socialStartDate, setSocialStartDate] = useState('');
  const [socialEndDate, setSocialEndDate] = useState('');
  const [socialStatusFilter, setSocialStatusFilter] = useState('active');

  useEffect(() => {
    if (!tabParam) return;
    if (!meetingValidTabs.includes(tabParam)) return;
    setActiveTab(tabParam);
  }, [tabParam]);

  const fetchClubs = useCallback(async () => {
    try {
      const response = await clubApi.getMyClubs();
      const clubs = extractList(response);
      const activeClubs = clubs.filter((club) => club.status === 'ACTIVE' || club.status === 'APPROVED');
      setHasClubs(activeClubs.length > 0);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 403) {
        setError('AUTH_REQUIRED');
      } else {
        console.error('클럽 목록 조회 실패:', err);
        setHasClubs(false);
      }
    }
  }, []);

  const fetchRoundingMeetings = useCallback(
    async (page = roundingPage, search = roundingSearchQuery) => {
      try {
        const allPagesMeetings = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore && currentPage <= 10) {
          const requestParams = {
            page: currentPage,
            limit: 100,
            ...(search ? { search } : {}),
          };

          const pageResponse = await roundsApi.getRounds(requestParams);
          const pageMeetings = extractList(pageResponse);

          if (pageMeetings.length === 0) {
            hasMore = false;
          } else {
            allPagesMeetings.push(...pageMeetings);
            const totalPages = pageResponse?.total_pages || 1;
            if (currentPage >= totalPages) {
              hasMore = false;
            } else {
              currentPage += 1;
            }
          }
        }

        const dateRange = getDateRange(roundingStartDate, roundingEndDate);
        let filteredMeetings = filterByDate(allPagesMeetings, dateRange);
        filteredMeetings = filterByStatus(filteredMeetings, roundingStatusFilter);

        const itemsPerPage = 6;
        const calculatedTotalPages = Math.max(1, Math.ceil(filteredMeetings.length / itemsPerPage));
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedMeetings = filteredMeetings.slice(startIndex, startIndex + itemsPerPage);

        setRoundingMeetings(paginatedMeetings);
        setRoundingTotalPages(calculatedTotalPages);
      } catch (err) {
        console.error('라운딩 조회 실패:', err);
        setRoundingMeetings([]);
        setRoundingTotalPages(1);
      }
    },
    [roundingEndDate, roundingPage, roundingSearchQuery, roundingStartDate, roundingStatusFilter],
  );

  const fetchSocialMeetings = useCallback(
    async (page = socialPage, search = socialSearchQuery) => {
      try {
        const requestParams = { page, limit: 6, ...(search ? { search } : {}) };
        const response = await socialsApi.getSocials(requestParams);
        const socialData = extractList(response);

        const socials = socialData.map((social) => ({
          ...social,
          meeting_type: 'SOCIAL',
          meeting_time: social.meeting_time,
          participant_count: social.participant_count || 0,
        }));

        const dateRange = getDateRange(socialStartDate, socialEndDate);
        let filteredSocials = filterByDate(socials, dateRange);
        filteredSocials = filterByStatus(filteredSocials, socialStatusFilter);

        const itemsPerPage = 6;
        const calculatedTotalPages = Math.max(1, Math.ceil(filteredSocials.length / itemsPerPage));
        const startIndex = (page - 1) * itemsPerPage;
        const paginatedSocials = filteredSocials.slice(startIndex, startIndex + itemsPerPage);

        setSocialMeetings(paginatedSocials);
        setSocialTotalPages(calculatedTotalPages);
      } catch (err) {
        console.error('소셜 모임 조회 실패:', err);
        setSocialMeetings([]);
        setSocialTotalPages(1);
      }
    },
    [socialEndDate, socialPage, socialSearchQuery, socialStartDate, socialStatusFilter],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await fetchClubs();
        if (activeTab === 'rounding') {
          await fetchRoundingMeetings(roundingPage, roundingSearchQuery);
        } else {
          await fetchSocialMeetings(socialPage, socialSearchQuery);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    activeTab,
    fetchClubs,
    fetchRoundingMeetings,
    fetchSocialMeetings,
    isAuthenticated,
    roundingEndDate,
    roundingPage,
    roundingSearchQuery,
    roundingStartDate,
    roundingStatusFilter,
    socialEndDate,
    socialPage,
    socialSearchQuery,
    socialStartDate,
    socialStatusFilter,
  ]);

  const handleTabChange = useCallback(
    (tab) => {
      const nextTab = tab === 'social' ? 'social' : 'rounding';
      setActiveTab(nextTab);
      router.setParams({ tab: nextTab });

      if (nextTab === 'rounding') {
        setRoundingPage(1);
      } else {
        setSocialPage(1);
      }
    },
    [router],
  );

  const handleSearch = useCallback(() => {
    if (activeTab === 'rounding') {
      setRoundingSearchQuery(roundingSearchInput);
      setRoundingPage(1);
    } else {
      setSocialSearchQuery(socialSearchInput);
      setSocialPage(1);
    }
  }, [activeTab, roundingSearchInput, socialSearchInput]);

  const handleCreateMeeting = useCallback(
    (type) => {
      if (type === 'rounding') {
        router.push('/meetings/rounding/create');
      } else {
        router.push('/meetings/social/create');
      }
    },
    [router],
  );

  const handleMeetingClick = useCallback(
    (meeting) => {
      const meetingType = meeting?.meeting_type || meeting?.type;
      const slug = meetingType === 'SOCIAL' ? 'social' : 'rounding';
      const meetingId = meeting?.id || meeting?.meeting_id;
      if (!meetingId) return;
      router.push(`/meetings/${slug}/${meetingId}`);
    },
    [router],
  );

  const hasActiveFilters = useCallback(() => {
    if (activeTab === 'rounding') {
      return Boolean(roundingSearchQuery || roundingStartDate || roundingEndDate);
    }
    return Boolean(socialSearchQuery || socialStartDate || socialEndDate);
  }, [
    activeTab,
    roundingEndDate,
    roundingSearchQuery,
    roundingStartDate,
    socialEndDate,
    socialSearchQuery,
    socialStartDate,
  ]);

  const currentMeetings = activeTab === 'rounding' ? roundingMeetings : socialMeetings;
  const currentPage = activeTab === 'rounding' ? roundingPage : socialPage;
  const totalPages = activeTab === 'rounding' ? roundingTotalPages : socialTotalPages;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
    const groupEnd = Math.min(groupStart + 4, totalPages);
    const numbers = [];
    for (let page = groupStart; page <= groupEnd; page += 1) {
      numbers.push(page);
    }
    return numbers;
  }, [currentPage, totalPages]);

  const startDate = activeTab === 'rounding' ? roundingStartDate : socialStartDate;
  const endDate = activeTab === 'rounding' ? roundingEndDate : socialEndDate;
  const showResetDates = Boolean(startDate || endDate);
  const statusFilter = activeTab === 'rounding' ? roundingStatusFilter : socialStatusFilter;
  const searchInput = activeTab === 'rounding' ? roundingSearchInput : socialSearchInput;

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginRequired
        message="로그인 후 이용가능합니다"
        description="모임 목록을 보려면 로그인이 필요합니다."
      />
    );
  }

  if (error === 'AUTH_REQUIRED') {
    return (
      <LoginRequired
        message="로그인 후 이용가능합니다"
        description="모임 목록을 보려면 로그인이 필요합니다."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />

        {loading ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
        ) : !hasClubs ? (
          <View style={styles.noClubState}>
            <FontAwesome5 name="users" size={52} color={colors.neutral[300]} />
            <Text style={styles.noClubTitle}>소속된 클럽이 없습니다.</Text>
            <Text style={styles.noClubSubtitle}>
              모임을 개설하거나 참여하려면,{'\n'}먼저 클럽을 개설하거나, 클럽에 가입해 주세요.
            </Text>
            <Button variant="primary" size="lg" onPress={() => router.push('/clubs')}>
              클럽 가입하기
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>모임 목록</Text>
              <View style={styles.createRow}>
                <Pressable
                  onPress={() => handleCreateMeeting('rounding')}
                  style={({ pressed }) => [
                    styles.createButton,
                    styles.createButtonRounding,
                    pressed && styles.createButtonPressed,
                  ]}
                >
                  <FontAwesome5 name="plus" size={12} color={colors.white} />
                  <Text style={styles.createButtonText}>라운딩 생성</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleCreateMeeting('social')}
                  style={({ pressed }) => [
                    styles.createButton,
                    styles.createButtonSocial,
                    pressed && styles.createButtonPressed,
                  ]}
                >
                  <FontAwesome5 name="plus" size={12} color={colors.white} />
                  <Text style={styles.createButtonText}>소셜 생성</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.tabBar}>
              <View style={styles.tabBarRow}>
                {meetingTabs.map((tab) => {
                  const selected = activeTab === tab.id;
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => handleTabChange(tab.id)}
                      style={[styles.tabButton, selected && styles.tabButtonActive]}
                    >
                      <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filtersBlock}>
              <View style={styles.dateRow}>
                <DateField
                  value={startDate}
                  onChange={(value) => {
                    if (activeTab === 'rounding') {
                      setRoundingStartDate(value);
                      setRoundingPage(1);
                    } else {
                      setSocialStartDate(value);
                      setSocialPage(1);
                    }
                  }}
                />
                <Text style={styles.dateDivider}>~</Text>
                <DateField
                  value={endDate}
                  onChange={(value) => {
                    if (activeTab === 'rounding') {
                      setRoundingEndDate(value);
                      setRoundingPage(1);
                    } else {
                      setSocialEndDate(value);
                      setSocialPage(1);
                    }
                  }}
                />
                {showResetDates ? (
                  <Pressable
                    onPress={() => {
                      if (activeTab === 'rounding') {
                        setRoundingStartDate('');
                        setRoundingEndDate('');
                        setRoundingPage(1);
                      } else {
                        setSocialStartDate('');
                        setSocialEndDate('');
                        setSocialPage(1);
                      }
                    }}
                    style={styles.resetButton}
                  >
                    <Text style={styles.resetButtonText}>초기화</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <FontAwesome5 name="search" size={14} color={colors.neutral[400]} />
                  <TextInput
                    value={searchInput}
                    onChangeText={(value) => {
                      if (activeTab === 'rounding') {
                        setRoundingSearchInput(value);
                      } else {
                        setSocialSearchInput(value);
                      }
                    }}
                    placeholder="모임명으로 검색..."
                    placeholderTextColor={colors.neutral[400]}
                    style={styles.searchInput}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                </View>
                <Pressable onPress={handleSearch} style={styles.searchButton}>
                  <Text style={styles.searchButtonText}>검색</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.statusRow}>
              <Pressable
                onPress={() => {
                  if (activeTab === 'rounding') {
                    setRoundingStatusFilter('active');
                    setRoundingPage(1);
                  } else {
                    setSocialStatusFilter('active');
                    setSocialPage(1);
                  }
                }}
                style={[
                  styles.statusButton,
                  statusFilter === 'active' ? styles.statusButtonActive : styles.statusButtonInactive,
                ]}
              >
                <Text style={[styles.statusButtonText, statusFilter === 'active' && styles.statusButtonTextActive]}>
                  진행
                </Text>
              </Pressable>
              <Text style={styles.statusDivider}>|</Text>
              <Pressable
                onPress={() => {
                  if (activeTab === 'rounding') {
                    setRoundingStatusFilter('completed');
                    setRoundingPage(1);
                  } else {
                    setSocialStatusFilter('completed');
                    setSocialPage(1);
                  }
                }}
                style={[
                  styles.statusButton,
                  statusFilter === 'completed' ? styles.statusButtonActive : styles.statusButtonInactive,
                ]}
              >
                <Text style={[styles.statusButtonText, statusFilter === 'completed' && styles.statusButtonTextActive]}>
                  완료/취소
                </Text>
              </Pressable>
            </View>

            {currentMeetings.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome5 name="calendar-alt" size={44} color={colors.neutral[300]} />
                {hasActiveFilters() ? (
                  <>
                    <Text style={styles.emptyTitle}>
                      조건에 해당하는 {activeTab === 'rounding' ? '라운딩' : '소셜'} 모임이 없습니다
                    </Text>
                    <Text style={styles.emptySubtitle}>검색 조건을 변경해보세요.</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyTitle}>
                      {statusFilter === 'completed'
                        ? `완료/취소된 ${activeTab === 'rounding' ? '라운딩' : '소셜'} 모임이 없습니다`
                        : `진행 중인 ${activeTab === 'rounding' ? '라운딩' : '소셜'} 모임이 없습니다`}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {statusFilter === 'completed'
                        ? '완료되거나 취소된 모임이 없습니다.'
                        : '현재 진행 중이거나 진행 예정인 모임이 없습니다.'}
                    </Text>
                    {statusFilter !== 'completed' ? (
                      <Pressable
                        onPress={() => handleCreateMeeting(activeTab)}
                        style={[
                          styles.emptyCreateButton,
                          activeTab === 'rounding' ? styles.createButtonRounding : styles.createButtonSocial,
                        ]}
                      >
                        <Text style={styles.emptyCreateButtonText}>
                          {activeTab === 'rounding' ? '라운딩' : '소셜'} 모임 생성하기
                        </Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
              </View>
            ) : (
              <>
                <View style={styles.cardList}>
                  {currentMeetings.map((meeting) => {
                    const meetingId = meeting?.id || meeting?.meeting_id;
                    if (!meetingId) return null;
                    return (
                      <MeetingCard
                        key={meetingId}
                        meeting={{ ...meeting, id: meetingId }}
                        onPress={() => handleMeetingClick(meeting)}
                      />
                    );
                  })}
                </View>

                {totalPages > 0 && (
                  <View style={styles.paginationRow}>
                    <Pressable
                      onPress={() => {
                        if (activeTab === 'rounding') {
                          setRoundingPage(Math.max(1, roundingPage - 1));
                        } else {
                          setSocialPage(Math.max(1, socialPage - 1));
                        }
                      }}
                      disabled={currentPage === 1}
                      style={[
                        styles.pageNavButton,
                        currentPage === 1 && styles.pageNavButtonDisabled,
                      ]}
                    >
                      <Text style={styles.pageNavText}>이전</Text>
                    </Pressable>

                    <View style={styles.pageNumbersRow}>
                      {pageNumbers.map((pageNum) => {
                        const selected = pageNum === currentPage;
                        return (
                          <Pressable
                            key={`page-${pageNum}`}
                            onPress={() => {
                              if (activeTab === 'rounding') {
                                setRoundingPage(pageNum);
                              } else {
                                setSocialPage(pageNum);
                              }
                            }}
                            style={[
                              styles.pageNumber,
                              selected ? styles.pageNumberActive : styles.pageNumberInactive,
                            ]}
                          >
                            <Text style={[styles.pageNumberText, selected && styles.pageNumberTextActive]}>
                              {pageNum}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Pressable
                      onPress={() => {
                        if (activeTab === 'rounding') {
                          setRoundingPage(Math.min(roundingTotalPages, roundingPage + 1));
                        } else {
                          setSocialPage(Math.min(socialTotalPages, socialPage + 1));
                        }
                      }}
                      disabled={currentPage === totalPages}
                      style={[
                        styles.pageNavButton,
                        currentPage === totalPages && styles.pageNavButtonDisabled,
                      ]}
                    >
                      <Text style={styles.pageNavText}>다음</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </>
        )}

        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

