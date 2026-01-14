import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView, StyleSheet, Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginRequired from '@/components/auth/LoginRequired';
import ClubCard from '@/components/clubs/ClubCard';
import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
    clubMyStatusOptions,
    clubStatusFilterOptions,
    clubTabs,
    clubValidTabs,
} from '@/constants/clubConstants';
import { useAuth } from '@/context/AuthContext';
import { clubsApi } from '@/lib/api/api';
import {
    createBrowseClubsHandler,
    createCardPressHandler,
    createClubPressHandler,
    createCreateClubHandler,
    createDebouncedSearchHandler,
    createFetchClubsHandler,
    createMyStatusFilterHandler,
    createNextPageHandler,
    createPageChangeHandler,
    createPrevPageHandler,
    createSearchTermChangeHandler,
    createStatusFilterSelectHandler,
    createTabChangeHandler,
    createToggleStatusFilterHandler,
} from '@/lib/handler/clubs';
import {
    getClubCardVariant,
    getClubPageNumbers,
    normalizePaginatedResponse,
} from '@/lib/util/clubUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';


const logoImage = require('../../../public/icons/icon-512-transparent.png');

export default function ClubsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const initialTab = useMemo(() => {
    if (tabParam && clubValidTabs.includes(tabParam)) return tabParam;
    return 'my';
  }, [tabParam]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [myClubStatusFilter, setMyClubStatusFilter] = useState('ACTIVE');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [clubs, setClubs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);

  useEffect(() => {
    if (!tabParam || !clubValidTabs.includes(tabParam)) return;
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleDebouncedSearch = useMemo(
    () =>
      createDebouncedSearchHandler({
        searchTerm,
        setDebouncedSearchTerm,
        setCurrentPage,
      }),
    [searchTerm, setDebouncedSearchTerm, setCurrentPage]
  );

  useEffect(() => {
    const timer = setTimeout(handleDebouncedSearch, 500);
    return () => clearTimeout(timer);
  }, [handleDebouncedSearch]);

  const loadClubs = useMemo(
    () =>
      createFetchClubsHandler({
        activeTab,
        currentPage,
        debouncedSearchTerm,
        myClubStatusFilter,
        statusFilter,
        userId: user?.id,
        fetchMyClubs: clubsApi.getMyClubs,
        fetchMyClubApplications: clubsApi.getMyClubApplications,
        fetchClubs: clubsApi.getClubs,
        normalizePaginatedResponse,
        setClubs,
        setTotalPages,
        setError,
        setIsLoading,
      }),
    [
      activeTab,
      currentPage,
      debouncedSearchTerm,
      myClubStatusFilter,
      statusFilter,
      user?.id,
      setClubs,
      setTotalPages,
      setError,
      setIsLoading,
    ]
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadClubs();
    }
  }, [isAuthenticated, loadClubs]);

  const handleTabChange = useMemo(
    () =>
      createTabChangeHandler({
        router,
        setActiveTab,
        setIsStatusFilterOpen,
        setCurrentPage,
      }),
    [router, setActiveTab, setIsStatusFilterOpen, setCurrentPage]
  );

  const handleClubPress = useMemo(
    () => createClubPressHandler({ router, alert: Alert.alert }),
    [router]
  );

  const handleCardPress = useMemo(
    () =>
      createCardPressHandler({
        activeTab,
        router,
        onClubPress: handleClubPress,
      }),
    [activeTab, router, handleClubPress]
  );

  const handleSearchTermChange = useMemo(
    () => createSearchTermChangeHandler({ setSearchTerm }),
    [setSearchTerm]
  );

  const toggleStatusFilter = useMemo(
    () => createToggleStatusFilterHandler({ setIsStatusFilterOpen }),
    [setIsStatusFilterOpen]
  );

  const handleStatusFilterSelect = useMemo(
    () =>
      createStatusFilterSelectHandler({
        setStatusFilter,
        setIsStatusFilterOpen,
        setCurrentPage,
      }),
    [setStatusFilter, setIsStatusFilterOpen, setCurrentPage]
  );

  const handleMyStatusFilter = useMemo(
    () => createMyStatusFilterHandler({ setMyClubStatusFilter, setCurrentPage }),
    [setMyClubStatusFilter, setCurrentPage]
  );

  const handleCreateClub = useMemo(
    () => createCreateClubHandler({ router }),
    [router]
  );

  const handleBrowseClubs = useMemo(
    () => createBrowseClubsHandler({ onTabChange: handleTabChange }),
    [handleTabChange]
  );

  const handlePageChange = useMemo(
    () => createPageChangeHandler({ setCurrentPage }),
    [setCurrentPage]
  );

  const handlePrevPage = useMemo(
    () => createPrevPageHandler({ setCurrentPage }),
    [setCurrentPage]
  );

  const handleNextPage = useMemo(
    () => createNextPageHandler({ setCurrentPage, totalPages }),
    [setCurrentPage, totalPages]
  );

  const pageNumbers = useMemo(
    () => getClubPageNumbers({ currentPage, totalPages }),
    [currentPage, totalPages]
  );

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
        description="클럽 목록을 보려면 로그인이 필요합니다."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />

        <View style={styles.headerRow}>
          <Text style={styles.title}>클럽 목록</Text>
          <Button variant="primary" size="sm" onPress={handleCreateClub}>
            클럽 등록
          </Button>
        </View>

        <View style={styles.tabBar}>
          <View style={styles.tabBarRow}>
            {clubTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={handleTabChange(tab.id)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.searchFilterRow}>
          <View style={styles.searchBox}>
            <FontAwesome5 name="search" size={14} color={colors.neutral[400]} />
            <TextInput
              value={searchTerm}
              onChangeText={handleSearchTermChange}
              placeholder="클럽명, 설명, 위치로 검색..."
              style={styles.searchInput}
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          {activeTab === 'all' && (
            <View style={styles.statusFilterWrap}>
              <Pressable onPress={toggleStatusFilter} style={styles.statusFilterButton}>
                <Text style={styles.statusFilterText}>
                  {clubStatusFilterOptions.find((option) => option.value === statusFilter)?.label ||
                    '전체 상태'}
                </Text>
                <FontAwesome5
                  name={isStatusFilterOpen ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={colors.neutral[400]}
                />
              </Pressable>
              {isStatusFilterOpen && (
                <View style={styles.statusFilterMenu}>
                  {clubStatusFilterOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={handleStatusFilterSelect(option.value)}
                      style={styles.statusFilterMenuItem}
                    >
                      <Text style={styles.statusFilterMenuText}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {activeTab === 'my' && (
          <View style={styles.myStatusRow}>
            {clubMyStatusOptions.map((option) => {
              const selected = myClubStatusFilter === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={handleMyStatusFilter(option.value)}
                  style={[styles.myStatusButton, selected && styles.myStatusButtonActive]}
                >
                  <Text style={[styles.myStatusText, selected && styles.myStatusTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : clubs.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5
              name={activeTab === 'applications' ? 'file-alt' : 'users'}
              size={44}
              color={colors.neutral[300]}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'all'
                ? '클럽이 없습니다'
                : activeTab === 'applications'
                  ? '개설 신청 내역'
                  : activeTab === 'join-applications'
                    ? '가입 신청 내역'
                    : '내 클럽'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all'
                ? searchTerm || statusFilter !== 'ALL'
                  ? '검색 조건에 맞는 클럽이 없습니다.'
                  : '아직 등록된 클럽이 없습니다.'
                : activeTab === 'applications'
                  ? '클럽 개설 신청 내역이 없습니다.'
                  : activeTab === 'join-applications'
                    ? '가입 승인 대기 중인 클럽이 없습니다.'
                    : '가입한 클럽이 없습니다. 클럽에 가입해보세요!'}
            </Text>
            {activeTab === 'all' && !searchTerm && statusFilter === 'ALL' ? (
              <Button variant="primary" size="sm" onPress={handleCreateClub}>
                첫 번째 클럽 등록하기
              </Button>
            ) : activeTab === 'applications' ? (
              <Button variant="primary" size="sm" onPress={handleCreateClub}>
                클럽 등록하기
              </Button>
            ) : activeTab === 'my' || activeTab === 'join-applications' ? (
              <Button variant="primary" size="sm" onPress={handleBrowseClubs}>
                클럽 둘러보기
              </Button>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.cardList}>
              {clubs.map((club) => {
                const variant = getClubCardVariant(activeTab);
                const key = club?.id || club?.display_id || `${activeTab}-${club?.name}`;

                return (
                  <ClubCard
                    key={key}
                    club={club}
                    variant={variant}
                    onPress={handleCardPress(club)}
                    styles={styles}
                    logoImage={logoImage}
                  />
                );
              })}
            </View>

            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <Pressable
                  onPress={handlePrevPage}
                  disabled={currentPage === 1}
                  style={[styles.pageNavButton, currentPage === 1 && styles.pageNavButtonDisabled]}
                >
                  <Text style={styles.pageNavText}>이전</Text>
                </Pressable>

                {pageNumbers.map((pageNum) => {
                  const selected = pageNum === currentPage;
                  return (
                    <Pressable
                      key={`page-${pageNum}`}
                      onPress={handlePageChange(pageNum)}
                      style={[styles.pageNumber, selected && styles.pageNumberActive]}
                    >
                      <Text
                        style={[styles.pageNumberText, selected && styles.pageNumberTextActive]}
                      >
                        {pageNum}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={handleNextPage}
                  disabled={currentPage === totalPages}
                  style={[styles.pageNavButton, currentPage === totalPages && styles.pageNavButtonDisabled]}
                >
                  <Text style={styles.pageNavText}>다음</Text>
                </Pressable>
              </View>
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
  headerRow: {
    ...base.rowBetween,
    marginBottom: tokens.padding.sm,
  },
  title: {
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    marginBottom: tokens.padding.md,
  },
  tabBarRow: {
    ...base.row,
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
    marginRight: tokens.padding.sm,
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
  searchFilterRow: {
    gap: 12,
  },
  searchBox: {
    ...base.row,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    marginLeft: tokens.padding.xs,
    fontSize: tokens.font.md,
    color: colors.neutral[900],
  },
  statusFilterWrap: {
    position: 'relative',
    zIndex: 10,
  },
  statusFilterButton: {
    ...base.rowBetween,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  statusFilterText: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
  },
  statusFilterMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 48,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  statusFilterMenuItem: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  statusFilterMenuText: {
    fontSize: tokens.font.md,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  myStatusRow: {
    ...base.row,
    flexWrap: 'wrap',
    gap: 8,
    marginTop: tokens.padding.sm,
    marginBottom: tokens.padding.md,
  },
  myStatusButton: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.neutral[100],
  },
  myStatusButtonActive: {
    backgroundColor: colors.primary[600],
  },
  myStatusText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
  },
  myStatusTextActive: {
    color: colors.white,
  },
  loadingRow: {
    paddingVertical: tokens.spacing.xl,
    alignItems: 'center',
  },
  errorCard: {
    marginTop: tokens.padding.md,
  },
  errorText: { ...base.textSmError, color: colors.error[700] },
  emptyState: {
    paddingVertical: tokens.spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: tokens.padding.md,
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  emptySubtitle: {
    marginTop: tokens.padding.xs,
    marginBottom: tokens.padding.md,
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: tokens.padding.xl,
  },
  cardList: {
    marginTop: tokens.padding.md,
  },
  cardPressable: {
    marginBottom: tokens.padding.sm,
  },
  cardPressed: {
    opacity: 0.95,
  },
  card: {
    padding: tokens.padding.md,
    borderRadius: tokens.radius.md,
  },
  cardHeader: {
    ...base.rowBetween,
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm,
  },
  cardTitleRow: {
    ...base.row,
    flex: 1,
    minWidth: 0,
    marginRight: tokens.padding.xs,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm,
  },
  logoImage: {
    width: 22,
    height: 22,
  },
  cardTitle: {
    ...base.cardTitleSm,
    flex: 1,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badgeRow: {
    ...base.row,
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: tokens.spacing.sm,
  },
  badge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.pill,
  },
  badgeText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  roleBadge: {
    paddingHorizontal: tokens.padding.xs,
  },
  cardDescription: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: tokens.padding.sm,
  },
  metaList: {
    gap: 6,
    marginBottom: tokens.padding.sm,
  },
  metaItem: {
    ...base.row,
    gap: 6,
  },
  metaText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    flex: 1,
  },
  cardFooter: {
    ...base.rowBetween,
  },
  cardDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
  },
  cardLink: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.primary[600],
  },
  paginationRow: {
    ...base.row,
    justifyContent: 'center',
    marginTop: tokens.padding.lg,
    flexWrap: 'wrap',
    gap: 8,
  },
  pageNavButton: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.padding.xs,
  },
  pageNavButtonDisabled: {
    opacity: 0.4,
  },
  pageNavText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[500],
  },
  pageNumber: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.base,
  },
  pageNumberActive: {
    backgroundColor: colors.primary[600],
  },
  pageNumberText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[500],
  },
  pageNumberTextActive: {
    color: colors.white,
  },
});
