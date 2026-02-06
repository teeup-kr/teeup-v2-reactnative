import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView, StyleSheet, Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginRequired from '@/components/auth/LoginRequired';
import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import MeetingCard from '@/components/meetings/MeetingCard';
import MeetingDateField from '@/components/meetings/MeetingDateField';
import Button from '@/components/ui/Button';
import { meetingTabs, meetingValidTabs } from '@/constants/meetingConstants';
import { useAuth } from '@/context/AuthContext';
import { meetingsApi } from '@/lib/api/api';
import {
    createCreateMeetingHandler,
    createDateChangeHandler,
    createFetchClubsHandler,
    createFetchRoundingMeetingsHandler,
    createFetchSocialMeetingsHandler,
    createMeetingPressHandler,
    createNextPageHandler,
    createPageNumberHandler,
    createPrevPageHandler,
    createResetDatesHandler,
    createSearchHandler,
    createSearchInputChangeHandler,
    createStatusFilterHandler,
    createTabChangeHandler,
    createTabPressHandler,
} from '@/lib/handler/meetings';
import {
    extractList,
    filterByDate,
    filterByStatus,
    getActiveFilters,
    getDateRange,
    getPageNumbers,
} from '@/lib/util/meetingUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';


export default function MeetingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const initialTab = useMemo(
    () => (tabParam === 'social' ? 'social' : 'rounding'),
    [tabParam]
  );
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

  const fetchClubs = useMemo(
    () =>
      createFetchClubsHandler({
        fetchMyClubs: meetingsApi.fetchMyClubs,
        extractList,
        setHasClubs,
        setError,
      }),
    [setHasClubs, setError]
  );

  const fetchRoundingMeetings = useMemo(
    () =>
      createFetchRoundingMeetingsHandler({
        fetchRounds: meetingsApi.fetchRounds,
        extractList,
        filterByDate,
        filterByStatus,
        getDateRange,
        roundingPage,
        roundingSearchQuery,
        roundingStartDate,
        roundingEndDate,
        roundingStatusFilter,
        setRoundingMeetings,
        setRoundingTotalPages,
      }),
    [
      roundingPage,
      roundingSearchQuery,
      roundingStartDate,
      roundingEndDate,
      roundingStatusFilter,
      setRoundingMeetings,
      setRoundingTotalPages,
    ]
  );

  const fetchSocialMeetings = useMemo(
    () =>
      createFetchSocialMeetingsHandler({
        fetchSocials: meetingsApi.fetchSocials,
        extractList,
        filterByDate,
        filterByStatus,
        getDateRange,
        socialPage,
        socialSearchQuery,
        socialStartDate,
        socialEndDate,
        socialStatusFilter,
        setSocialMeetings,
        setSocialTotalPages,
      }),
    [
      socialPage,
      socialSearchQuery,
      socialStartDate,
      socialEndDate,
      socialStatusFilter,
      setSocialMeetings,
      setSocialTotalPages,
    ]
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

  const handleTabChange = useMemo(
    () =>
      createTabChangeHandler({
        setActiveTab,
        setRoundingPage,
        setSocialPage,
        router,
      }),
    [setActiveTab, setRoundingPage, setSocialPage, router]
  );

  const handleTabPress = useMemo(
    () => createTabPressHandler({ onTabChange: handleTabChange }),
    [handleTabChange]
  );

  const handleSearch = useMemo(
    () =>
      createSearchHandler({
        activeTab,
        roundingSearchInput,
        socialSearchInput,
        setRoundingSearchQuery,
        setSocialSearchQuery,
        setRoundingPage,
        setSocialPage,
      }),
    [
      activeTab,
      roundingSearchInput,
      socialSearchInput,
      setRoundingSearchQuery,
      setSocialSearchQuery,
      setRoundingPage,
      setSocialPage,
    ]
  );

  const handleCreateMeeting = useMemo(
    () => createCreateMeetingHandler({ router }),
    [router]
  );
  const handleOpenClubs = useMemo(() => () => router.push('/clubs'), [router]);

  const handleMeetingClick = useMemo(
    () => createMeetingPressHandler({ router }),
    [router]
  );

  const handleStartDateChange = useMemo(
    () =>
      createDateChangeHandler({
        activeTab,
        setRoundingDate: setRoundingStartDate,
        setSocialDate: setSocialStartDate,
        setRoundingPage,
        setSocialPage,
      }),
    [
      activeTab,
      setRoundingStartDate,
      setSocialStartDate,
      setRoundingPage,
      setSocialPage,
    ]
  );

  const handleEndDateChange = useMemo(
    () =>
      createDateChangeHandler({
        activeTab,
        setRoundingDate: setRoundingEndDate,
        setSocialDate: setSocialEndDate,
        setRoundingPage,
        setSocialPage,
      }),
    [
      activeTab,
      setRoundingEndDate,
      setSocialEndDate,
      setRoundingPage,
      setSocialPage,
    ]
  );

  const handleResetDates = useMemo(
    () =>
      createResetDatesHandler({
        activeTab,
        setRoundingStartDate,
        setRoundingEndDate,
        setSocialStartDate,
        setSocialEndDate,
        setRoundingPage,
        setSocialPage,
      }),
    [
      activeTab,
      setRoundingStartDate,
      setRoundingEndDate,
      setSocialStartDate,
      setSocialEndDate,
      setRoundingPage,
      setSocialPage,
    ]
  );

  const handleSearchInputChange = useMemo(
    () =>
      createSearchInputChangeHandler({
        activeTab,
        setRoundingSearchInput,
        setSocialSearchInput,
      }),
    [activeTab, setRoundingSearchInput, setSocialSearchInput]
  );

  const handleStatusFilterChange = useMemo(
    () =>
      createStatusFilterHandler({
        activeTab,
        setRoundingStatusFilter,
        setSocialStatusFilter,
        setRoundingPage,
        setSocialPage,
      }),
    [
      activeTab,
      setRoundingStatusFilter,
      setSocialStatusFilter,
      setRoundingPage,
      setSocialPage,
    ]
  );

  const handlePrevPage = useMemo(
    () =>
      createPrevPageHandler({
        activeTab,
        roundingPage,
        socialPage,
        setRoundingPage,
        setSocialPage,
      }),
    [activeTab, roundingPage, socialPage, setRoundingPage, setSocialPage]
  );

  const handleNextPage = useMemo(
    () =>
      createNextPageHandler({
        activeTab,
        roundingPage,
        socialPage,
        roundingTotalPages,
        socialTotalPages,
        setRoundingPage,
        setSocialPage,
      }),
    [
      activeTab,
      roundingPage,
      socialPage,
      roundingTotalPages,
      socialTotalPages,
      setRoundingPage,
      setSocialPage,
    ]
  );

  const handlePageNumberChange = useMemo(
    () => createPageNumberHandler({ activeTab, setRoundingPage, setSocialPage }),
    [activeTab, setRoundingPage, setSocialPage]
  );

  const hasActiveFilters = getActiveFilters({
    activeTab,
    roundingSearchQuery,
    roundingStartDate,
    roundingEndDate,
    socialSearchQuery,
    socialStartDate,
    socialEndDate,
  });

  const currentMeetings = activeTab === 'rounding' ? roundingMeetings : socialMeetings;
  const currentPage = activeTab === 'rounding' ? roundingPage : socialPage;
  const totalPages = activeTab === 'rounding' ? roundingTotalPages : socialTotalPages;

  const pageNumbers = useMemo(
    () => getPageNumbers({ currentPage, totalPages }),
    [currentPage, totalPages]
  );

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
            <Button variant="primary" size="lg" onPress={handleOpenClubs}>
              클럽 가입하기
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title}>모임 목록</Text>
              <View style={styles.createRow}>
                <Pressable
                  onPress={handleCreateMeeting('rounding')}
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
                  onPress={handleCreateMeeting('social')}
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
                      onPress={handleTabPress(tab.id)}
                      style={[styles.tabButton, selected && styles.tabButtonActive]}
                    >
                      <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filtersBlock}>
              <View style={styles.dateRow}>
                <MeetingDateField value={startDate} onChange={handleStartDateChange} styles={styles} />
                <Text style={styles.dateDivider}>~</Text>
                <MeetingDateField value={endDate} onChange={handleEndDateChange} styles={styles} />
                {showResetDates ? (
                  <Pressable onPress={handleResetDates} style={styles.resetButton}>
                    <Text style={styles.resetButtonText}>초기화</Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <FontAwesome5 name="search" size={14} color={colors.neutral[400]} />
                  <TextInput
                    value={searchInput}
                    onChangeText={handleSearchInputChange}
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
                onPress={handleStatusFilterChange('active')}
                style={[
                  styles.statusButton,
                  statusFilter === 'active'
                    ? styles.statusButtonActive
                    : styles.statusButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    statusFilter === 'active' && styles.statusButtonTextActive,
                  ]}
                >
                  진행
                </Text>
              </Pressable>
              <Text style={styles.statusDivider}>|</Text>
              <Pressable
                onPress={handleStatusFilterChange('completed')}
                style={[
                  styles.statusButton,
                  statusFilter === 'completed'
                    ? styles.statusButtonActive
                    : styles.statusButtonInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    statusFilter === 'completed' && styles.statusButtonTextActive,
                  ]}
                >
                  완료/취소
                </Text>
              </Pressable>
            </View>

            {currentMeetings.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome5 name="calendar-alt" size={44} color={colors.neutral[300]} />
                {hasActiveFilters ? (
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
                        onPress={handleCreateMeeting(activeTab)}
                        style={[
                          styles.emptyCreateButton,
                          activeTab === 'rounding'
                            ? styles.createButtonRounding
                            : styles.createButtonSocial,
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
                        onPress={handleMeetingClick(meeting)}
                        styles={styles}
                        currentUserId={user?.id ?? null}
                      />
                    );
                  })}
                </View>

                {totalPages > 0 && (
                  <View style={styles.paginationRow}>
                    <Pressable
                      onPress={handlePrevPage}
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
                            onPress={handlePageNumberChange(pageNum)}
                            style={[
                              styles.pageNumber,
                              selected ? styles.pageNumberActive : styles.pageNumberInactive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.pageNumberText,
                                selected && styles.pageNumberTextActive,
                              ]}
                            >
                              {pageNum}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>

                    <Pressable
                      onPress={handleNextPage}
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

const styles = StyleSheet.create({
  safeArea: base.safeAreaWhite,
  container: base.container,
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBlock: {
    paddingVertical: tokens.padding.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noClubState: {
    paddingVertical: tokens.padding.xxxl,
    alignItems: 'center',
  },
  noClubTitle: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  noClubSubtitle: {
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: tokens.spacing.sm2,
  },
  title: {
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.base,
  },
  createButtonPressed: {
    opacity: 0.9,
  },
  createButtonRounding: {
    backgroundColor: colors.primary[600],
  },
  createButtonSocial: {
    backgroundColor: colors.accent[600],
  },
  createButtonText: {
    color: colors.white,
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    marginBottom: tokens.spacing.md,
  },
  tabBarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingVertical: tokens.padding.base,
    paddingHorizontal: tokens.padding.xs2,
    marginRight: tokens.spacing.sm2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[500],
  },
  tabTextActive: {
    color: colors.primary[600],
  },
  filtersBlock: {
    gap: 12,
    marginBottom: tokens.spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.base,
    backgroundColor: colors.white,
  },
  dateInputText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
    fontWeight: tokens.fontWeight.semibold,
  },
  dateInputPlaceholder: {
    color: colors.neutral[400],
    fontWeight: tokens.fontWeight.medium,
  },
  dateDivider: {
    color: colors.neutral[500],
    fontSize: tokens.font.sm,
  },
  resetButton: {
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.base,
  },
  resetButtonText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.base,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
  },
  searchButton: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.base,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.primary[600],
  },
  searchButtonText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: tokens.spacing.md,
  },
  statusButton: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.base,
    borderRadius: tokens.radius.base,
  },
  statusButtonActive: {
    backgroundColor: colors.primary[600],
  },
  statusButtonInactive: {
    backgroundColor: colors.neutral[100],
  },
  statusButtonText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[700],
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  statusDivider: {
    fontSize: tokens.font.sm,
    color: colors.neutral[400],
  },
  emptyState: {
    paddingVertical: tokens.padding.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    textAlign: 'center',
    paddingHorizontal: tokens.padding.lg,
  },
  emptySubtitle: {
    marginTop: tokens.spacing.xs2,
    marginBottom: tokens.spacing.md,
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: tokens.padding.lg,
    lineHeight: 18,
  },
  emptyCreateButton: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.base,
    borderRadius: tokens.radius.base,
  },
  emptyCreateButtonText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.white,
  },
  cardList: {
    marginTop: tokens.spacing.xxs,
  },
  cardPressable: {
    marginBottom: tokens.spacing.sm2,
  },
  cardPressed: {
    opacity: 0.96,
  },
  card: {
    padding: tokens.padding.md,
    borderRadius: tokens.radius.md,
  },
  cardHeader: { ...base.rowBetween, gap: 10, marginBottom: tokens.spacing.sm },
  cardTitleArea: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: base.cardTitleSm,
  cardSubtitle: { ...base.sectionSubtitle, marginTop: tokens.spacing.hairline },
  cardBadgeRow: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  badge: {
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.pill,
  },
  badgeText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.bold,
  },
  cardDescription: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: tokens.spacing.sm2,
  },
  metaList: {
    gap: 6,
    marginBottom: tokens.spacing.sm2,
  },
  extraList: {
    gap: 6,
    marginBottom: tokens.spacing.sm2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  golfEmoji: {
    fontSize: tokens.font.sm,
  },
  metaText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
  },
  cardLink: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.primary[600],
  },
  paginationRow: {
    marginTop: tokens.spacing.sm2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  pageNavButton: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.neutral[100],
  },
  pageNavButtonDisabled: {
    opacity: 0.5,
  },
  pageNavText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[700],
  },
  pageNumbersRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pageNumber: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    borderRadius: tokens.radius.base,
  },
  pageNumberActive: {
    backgroundColor: colors.primary[600],
  },
  pageNumberInactive: {
    backgroundColor: colors.neutral[100],
  },
  pageNumberText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[700],
  },
  pageNumberTextActive: {
    color: colors.white,
  },
});
