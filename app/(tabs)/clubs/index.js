import LoginRequired from '@/components/auth/LoginRequired';
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
import { clubsApi } from '@/lib/clubsApi';
import {
  formatClubDate,
  getClubMembershipStatusBadgeConfig,
  getClubRoleBadgeConfig,
  getClubStatusBadgeConfig,
  getClubTypeBadgeConfig,
  normalizePaginatedResponse,
} from '@/lib/clubUtils';
import { colors } from '@/theme/colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const logoImage = require('../../../assets/teeuplink-logo.png');


const Badge = ({ text, backgroundColor, textColor, style }) => (
  <View style={[styles.badge, { backgroundColor }, style]}>
    <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
  </View>
);

const ClubCard = ({ club, variant, onPress }) => {
  const showStatus = variant === 'all' || variant === 'my' || variant === 'applications';
  const showMembershipStatus = variant === 'my' || variant === 'join-applications';
  const showMembershipRole = variant === 'my' || variant === 'join-applications';

  const statusConfig = showStatus ? getClubStatusBadgeConfig(club?.status, club?.club_deleted_at) : null;
  const membershipConfig = showMembershipStatus
    ? getClubMembershipStatusBadgeConfig(club?.membership_status)
    : null;
  const typeConfig = getClubTypeBadgeConfig(club?.type);
  const roleConfig = showMembershipRole ? getClubRoleBadgeConfig(club?.membership_role) : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.logoCircle}>
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {club?.name || '클럽명 없음'}
            </Text>
          </View>
          <View style={styles.badgeStack}>
            {statusConfig ? (
              <Badge text={statusConfig.text} backgroundColor={statusConfig.bg} textColor={statusConfig.fg} />
            ) : null}
            {membershipConfig ? (
              <Badge text={membershipConfig.text} backgroundColor={membershipConfig.bg} textColor={membershipConfig.fg} />
            ) : null}
          </View>
        </View>

        <View style={styles.badgeRow}>
          {typeConfig ? (
            <Badge text={typeConfig.text} backgroundColor={typeConfig.bg} textColor={typeConfig.fg} />
          ) : null}
          {roleConfig ? (
            <Badge
              text={roleConfig.text}
              backgroundColor={roleConfig.bg}
              textColor={roleConfig.fg}
              style={styles.roleBadge}
            />
          ) : null}
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {club?.description || ''}
        </Text>

        <View style={styles.metaList}>
          <View style={styles.metaItem}>
            <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {club?.location || '-'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome5 name="user-friends" size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText}>멤버 {club?.member_count ?? 0}명</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            {variant === 'applications' ? `신청일: ${formatClubDate(club?.created_at)}` : formatClubDate(club?.created_at || club?.joined_at)}
          </Text>
          <Text style={styles.cardLink}>자세히 보기 →</Text>
        </View>
      </Card>
    </Pressable>
  );
};

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const loadClubs = async () => {
      try {
        setIsLoading(true);
        setError('');
        let response;

        if (activeTab === 'my') {
          response = await clubsApi.getMyClubs({ page: currentPage, limit: 6 });
        } else if (activeTab === 'applications') {
          response = await clubsApi.getMyClubApplications({ page: currentPage, limit: 6 });
        } else if (activeTab === 'join-applications') {
          response = await clubsApi.getMyClubs({ page: currentPage, limit: 6, status_filter: 'PENDING' });
        } else {
          response = await clubsApi.getClubs({
            page: currentPage,
            limit: 6,
            ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
          });
        }

        const payload = normalizePaginatedResponse(response);
        let list = Array.isArray(payload?.data) ? payload.data : [];

        if (activeTab === 'my') {
          list = list.filter((club) => {
            const membershipStatus = club?.membership_status;
            const hasValidMembership =
              membershipStatus &&
              membershipStatus !== 'null' &&
              membershipStatus !== '' &&
              ['APPROVED', 'ACTIVE', 'PENDING'].includes(String(membershipStatus).toUpperCase().trim());
            return hasValidMembership;
          });

          if (myClubStatusFilter && myClubStatusFilter !== 'ALL') {
            if (myClubStatusFilter === 'ACTIVE') {
              list = list.filter((club) => club.status === 'ACTIVE' || club.status === 'APPROVED');
            } else {
              list = list.filter((club) => club.status === myClubStatusFilter);
            }
          }

          list = [...list].sort((a, b) => {
            const dateA = new Date(a.created_at || a.joined_at || 0);
            const dateB = new Date(b.created_at || b.joined_at || 0);
            return dateB - dateA;
          });
        }

        if (activeTab === 'join-applications') {
          const currentUserId = user?.id;
          list = list.filter((club) => club?.created_by !== currentUserId);
        }

        if (activeTab === 'all') {
          list = list.filter((club) => club?.status !== 'INACTIVE');
        }

        setClubs(list);
        setTotalPages(payload?.total_pages || 1);
      } catch (fetchError) {
        console.error('클럽 목록 조회 실패:', fetchError);
        setError(fetchError?.message || '클럽 목록을 불러올 수 없습니다');
        setClubs([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadClubs();
    }
  }, [
    activeTab,
    currentPage,
    debouncedSearchTerm,
    isAuthenticated,
    myClubStatusFilter,
    statusFilter,
    user?.id,
  ]);

  const handleTabChange = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      setIsStatusFilterOpen(false);
      setCurrentPage(1);
      router.setParams({ tab: tabId });
    },
    [router],
  );

  const handleClubPress = useCallback(
    (club) => {
      if (club?.status === 'INACTIVE') {
        Alert.alert('비공개 클럽', '해당 클럽은 비공개 상태입니다.');
        return;
      }
      router.push(`/clubs/${club?.display_id || club?.id}`);
    },
    [router],
  );

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
          <Button variant="primary" size="sm" onPress={() => router.push('/clubs/register')}>
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
                  onPress={() => handleTabChange(tab.id)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
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
              onChangeText={setSearchTerm}
              placeholder="클럽명, 설명, 위치로 검색..."
              style={styles.searchInput}
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          {activeTab === 'all' && (
            <View style={styles.statusFilterWrap}>
              <Pressable
                onPress={() => setIsStatusFilterOpen((prev) => !prev)}
                style={styles.statusFilterButton}
              >
                <Text style={styles.statusFilterText}>
                  {clubStatusFilterOptions.find((option) => option.value === statusFilter)?.label || '전체 상태'}
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
                      onPress={() => {
                        setStatusFilter(option.value);
                        setIsStatusFilterOpen(false);
                        setCurrentPage(1);
                      }}
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
                  onPress={() => {
                    setMyClubStatusFilter(option.value);
                    setCurrentPage(1);
                  }}
                  style={[styles.myStatusButton, selected && styles.myStatusButtonActive]}
                >
                  <Text style={[styles.myStatusText, selected && styles.myStatusTextActive]}>{option.label}</Text>
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
              <Button variant="primary" size="sm" onPress={() => router.push('/clubs/register')}>
                첫 번째 클럽 등록하기
              </Button>
            ) : activeTab === 'applications' ? (
              <Button variant="primary" size="sm" onPress={() => router.push('/clubs/register')}>
                클럽 등록하기
              </Button>
            ) : activeTab === 'my' || activeTab === 'join-applications' ? (
              <Button variant="primary" size="sm" onPress={() => handleTabChange('all')}>
                클럽 둘러보기
              </Button>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.cardList}>
              {clubs.map((club) => {
                const variant = activeTab === 'applications' ? 'applications' : activeTab;
                const key = club?.id || club?.display_id || `${activeTab}-${club?.name}`;
                const onPress = () => {
                  if (activeTab === 'applications') {
                    router.push(`/clubs/applications/${club.id}`);
                    return;
                  }
                  handleClubPress(club);
                };

                return <ClubCard key={key} club={club} variant={variant} onPress={onPress} />;
              })}
            </View>

            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <Pressable
                  onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                      onPress={() => setCurrentPage(pageNum)}
                      style={[styles.pageNumber, selected && styles.pageNumberActive]}
                    >
                      <Text style={[styles.pageNumberText, selected && styles.pageNumberTextActive]}>
                        {pageNum}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    marginBottom: 16,
  },
  tabBarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginRight: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  tabTextActive: {
    color: colors.primary[600],
  },
  searchFilterRow: {
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.neutral[900],
  },
  statusFilterWrap: {
    position: 'relative',
    zIndex: 10,
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  statusFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  statusFilterMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  statusFilterMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  statusFilterMenuText: {
    fontSize: 13,
    color: colors.neutral[700],
    fontWeight: '600',
  },
  myStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  myStatusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
  },
  myStatusButtonActive: {
    backgroundColor: colors.primary[600],
  },
  myStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  myStatusTextActive: {
    color: colors.white,
  },
  loadingRow: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  errorCard: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.error[700],
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  emptySubtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cardList: {
    marginTop: 16,
  },
  cardPressable: {
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.95,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: 22,
    height: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    flex: 1,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 12,
  },
  metaList: {
    gap: 6,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutral[600],
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  cardLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  pageNavButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pageNavButtonDisabled: {
    opacity: 0.4,
  },
  pageNavText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  pageNumber: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pageNumberActive: {
    backgroundColor: colors.primary[600],
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[500],
  },
  pageNumberTextActive: {
    color: colors.white,
  },
});
