import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
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

import ClubCard from '@/components/clubs/ClubCard';
import AppHeader from '@/components/layout/AppHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PaginationNav from '@/components/ui/PaginationNav';
import SelectableChip from '@/components/ui/SelectableChip';
import {
  clubMyStatusOptions,
  clubStatusFilterOptions,
  clubTabs,
  clubValidTabs,
} from '@/constants/clubConstants';
import { useAuth } from '@/context/AuthContext';
import { clubsApi, regionApi } from '@/lib/api/api';
import {
  createClubPressHandler,
  createCreateClubHandler,
  createFetchClubsHandler,
  createNextPageHandler,
  createPrevPageHandler,
  createSidoSelectHandler,
  createTabChangeHandler,
  createToggleGunguHandler,
} from '@/lib/handler/clubs';
import {
  getClubCardVariant,
  getClubPageNumbers,
  normalizePaginatedResponse,
} from '@/lib/util/clubUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

import LoginScreen from '../../login';

import LoginScreen from '../../login';


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
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [myClubStatusFilter, setMyClubStatusFilter] = useState('ACTIVE');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [debouncedGunguCodes, setDebouncedGunguCodes] = useState([]);

  const [clubs, setClubs] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [sidoOptions, setSidoOptions] = useState([]);
  const [gunguOptionsBySido, setGunguOptionsBySido] = useState({});
  const [gunguOptions, setGunguOptions] = useState([]);
  const [selectedSidoCode, setSelectedSidoCode] = useState('');
  const [selectedGunguCodes, setSelectedGunguCodes] = useState([]);
  const [isSidoLoading, setIsSidoLoading] = useState(false);
  const [isGunguLoading, setIsGunguLoading] = useState(false);
  const [regionFetchError, setRegionFetchError] = useState('');

  useEffect(() => {
    if (!tabParam || !clubValidTabs.includes(tabParam)) return;
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleDebouncedSearch = useMemo(
    () => () => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    },
    [searchTerm, setDebouncedSearchTerm, setCurrentPage]
  );

  useEffect(() => {
    const timer = setTimeout(handleDebouncedSearch, 500);
    return () => clearTimeout(timer);
  }, [handleDebouncedSearch]);

  const handleDebouncedGunguSearch = useMemo(
    () => () => {
      const isSameGunguCodes =
        debouncedGunguCodes.length === selectedGunguCodes.length &&
        debouncedGunguCodes.every((code, index) => code === selectedGunguCodes[index]);
      if (isSameGunguCodes) return;
      setDebouncedGunguCodes(selectedGunguCodes);
      setCurrentPage(1);
    },
    [selectedGunguCodes, debouncedGunguCodes, setCurrentPage, setDebouncedGunguCodes]
  );

  useEffect(() => {
    if (activeTab !== 'all') return;
    const timer = setTimeout(handleDebouncedGunguSearch, 1000);
    return () => clearTimeout(timer);
  }, [activeTab, handleDebouncedGunguSearch]);

  const handleSidoSelect = useMemo(() => {
    const baseHandler = createSidoSelectHandler({
      setSelectedSidoCode,
      setSelectedGunguCodes,
    });
    return (value) => {
      baseHandler(value);
      setDebouncedGunguCodes([]);
      setCurrentPage(1);
    };
  }, [setSelectedSidoCode, setSelectedGunguCodes, setDebouncedGunguCodes, setCurrentPage]);

  const handleToggleGungu = useMemo(
    () =>
      createToggleGunguHandler({
        setSelectedGunguCodes,
      }),
    [setSelectedGunguCodes]
  );

  const selectedSidoName = useMemo(() => {
    const match = sidoOptions.find((option) => String(option.code) === String(selectedSidoCode));
    return match?.name || '';
  }, [sidoOptions, selectedSidoCode]);

  useEffect(() => {
    let isActive = true;

    const fetchSidoOptions = async () => {
      try {
        setIsSidoLoading(true);
        setRegionFetchError('');
        const response = await regionApi.getSidoList();
        const list = extractList(response);
        if (isActive) {
          setSidoOptions(list);
        }
      } catch (fetchError) {
        console.error('시도 목록 조회 실패:', fetchError);
        if (isActive) {
          setRegionFetchError(fetchError?.message || '시/도 목록을 불러오지 못했습니다.');
          setSidoOptions([]);
        }
      } finally {
        if (isActive) {
          setIsSidoLoading(false);
        }
      }
    };

    fetchSidoOptions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!selectedSidoCode) {
      setGunguOptions([]);
      setSelectedGunguCodes([]);
      return () => {
        isActive = false;
      };
    }

    const cachedOptions = gunguOptionsBySido[selectedSidoCode];
    if (cachedOptions) {
      setGunguOptions(cachedOptions);
      setSelectedGunguCodes([]);
      return () => {
        isActive = false;
      };
    }

    const fetchGunguOptions = async () => {
      try {
        setIsGunguLoading(true);
        setRegionFetchError('');
        const response = await regionApi.getGunguList(selectedSidoCode);
        const list = extractList(response);
        if (isActive) {
          setGunguOptionsBySido((prev) => ({ ...prev, [selectedSidoCode]: list }));
          setGunguOptions(list);
          setSelectedGunguCodes([]);
        }
      } catch (fetchError) {
        console.error('시군구 목록 조회 실패:', fetchError);
        if (isActive) {
          setRegionFetchError(fetchError?.message || '시/군/구 목록을 불러오지 못했습니다.');
          setGunguOptions([]);
          setSelectedGunguCodes([]);
        }
      } finally {
        if (isActive) {
          setIsGunguLoading(false);
        }
      }
    };

    fetchGunguOptions();

    return () => {
      isActive = false;
    };
  }, [gunguOptionsBySido, selectedSidoCode]);

  const sidoNameMap = useMemo(() => {
    return sidoOptions.reduce((acc, option) => {
      acc[String(option.code)] = option.name;
      return acc;
    }, {});
  }, [sidoOptions]);

  const gunguNameMap = useMemo(() => {
    const map = {};
    Object.values(gunguOptionsBySido).forEach((list) => {
      list.forEach((option) => {
        map[String(option.code)] = option.name;
      });
    });
    return map;
  }, [gunguOptionsBySido]);

  useEffect(() => {
    let isActive = true;
    const uniqueSidoCodes = Array.from(
      new Set(
        clubs
          .map((club) => club?.sido_code || club?.sidoCode)
          .filter((code) => code !== undefined && code !== null && code !== '')
          .map((code) => String(code))
      )
    );

    if (uniqueSidoCodes.length === 0) return () => {
      isActive = false;
    };

    const missingSidoCodes = uniqueSidoCodes.filter(
      (code) => !gunguOptionsBySido[code]
    );

    if (missingSidoCodes.length === 0) return () => {
      isActive = false;
    };

    const fetchMissingGungu = async () => {
      try {
        await Promise.all(
          missingSidoCodes.map(async (code) => {
            const response = await regionApi.getGunguList(code);
            const list = extractList(response);
            if (isActive) {
              setGunguOptionsBySido((prev) => ({ ...prev, [code]: list }));
            }
          })
        );
      } catch (fetchError) {
        console.error('클럽 위치용 시군구 목록 조회 실패:', fetchError);
      }
    };

    fetchMissingGungu();

    return () => {
      isActive = false;
    };
  }, [clubs, gunguOptionsBySido]);

  const loadClubs = useMemo(
    () =>
      createFetchClubsHandler({
        activeTab,
        currentPage,
        debouncedSearchTerm,
        sidoCode: selectedSidoCode,
        gunguCodes: debouncedGunguCodes,
        myClubStatusFilter,
        statusFilter,
        userId: user?.id,
        fetchMyClubs: clubsApi.getMyClubs,
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
      debouncedGunguCodes,
      selectedSidoCode,
      myClubStatusFilter,
      statusFilter,
      user?.id,
      setClubs,
      setTotalPages,
      setError,
      setIsLoading,
    ]
  );

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadClubs();
      }
      return undefined;
    }, [isAuthenticated, loadClubs])
  );

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
    () => (club) => () => {
      handleClubPress(club);
    },
    [handleClubPress]
  );

  const handleSearchTermChange = useMemo(
    () => (value) => {
      setSearchTerm(value);
    },
    [setSearchTerm]
  );

  const toggleStatusFilter = useMemo(
    () => () => {
      setIsStatusFilterOpen((prev) => !prev);
    },
    [setIsStatusFilterOpen]
  );

  const handleStatusFilterSelect = useMemo(
    () => (value) => () => {
      setStatusFilter(value);
      setIsStatusFilterOpen(false);
      setCurrentPage(1);
    },
    [setStatusFilter, setIsStatusFilterOpen, setCurrentPage]
  );

  const handleMyStatusFilter = useMemo(
    () => (value) => () => {
      setMyClubStatusFilter(value);
      setCurrentPage(1);
    },
    [setMyClubStatusFilter, setCurrentPage]
  );

  const handleCreateClub = useMemo(
    () => createCreateClubHandler({ router }),
    [router]
  );

  const handleBrowseClubs = useMemo(
    () => () => {
      handleTabChange('all')();
    },
    [handleTabChange]
  );

  const handlePageChange = useMemo(
    () => (pageNum) => () => {
      setCurrentPage(pageNum);
    },
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
    return <LoginScreen />;
  }

  return (
    <View style={styles.safeArea}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <AppHeader />
      </SafeAreaView>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>클럽 목록</Text>
          <Button
            variant="primary"
            onPress={handleCreateClub}
            style={styles.createButton}
            textStyle={styles.createButtonText}
          >
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
      </View>
      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.container}>

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

        {activeTab === 'all' && (
          <View style={styles.regionFilterGroup}>
            <Text style={styles.label}>활동 지역 (시/도)</Text>
            <View style={styles.selectBox}>
              <Text style={styles.selectText}>
                {selectedSidoName ||
                  (isSidoLoading ? '시/도 목록을 불러오는 중...' : '시/도를 선택하세요')}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
              <Picker
                selectedValue={selectedSidoCode}
                onValueChange={handleSidoSelect}
                mode="dialog"
                style={styles.hiddenPicker}
                dropdownIconColor="transparent"
                enabled={!isSidoLoading}
              >
                <Picker.Item label="시/도를 선택하세요" value="" />
                {sidoOptions.map((option) => (
                  <Picker.Item key={option.code} label={option.name} value={String(option.code)} />
                ))}
              </Picker>
            </View>
            {regionFetchError ? (
              <Text style={styles.errorText}>{regionFetchError}</Text>
            ) : null}

            <Text style={styles.label}>시/군/구 선택</Text>
            <View style={[styles.input, styles.gunguBox]}>
              {isGunguLoading ? (
                <View style={styles.regionLoadingRow}>
                  <ActivityIndicator size="small" color={colors.primary[600]} />
                  <Text style={styles.helperText}>시/군/구 목록을 불러오는 중...</Text>
                </View>
              ) : selectedSidoCode ? (
                gunguOptions.length > 0 ? (
                  <ScrollView
                    style={styles.gunguScroll}
                    contentContainerStyle={styles.gunguScrollContent}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    keyboardShouldPersistTaps="handled"
                  >
                    {gunguOptions.map((option) => (
                      <SelectableChip
                        key={option.code}
                        label={option.name}
                        selected={selectedGunguCodes.includes(String(option.code))}
                        onPress={() => handleToggleGungu(option.code)}
                        styles={styles}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.helperText}>선택한 시/도에 시/군/구가 없습니다.</Text>
                )
              ) : (
                <Text style={styles.helperText}>시/도를 먼저 선택해주세요.</Text>
              )}
            </View>
            <Text style={styles.helperText}>
              <FontAwesome5 name="info-circle" size={10} color={colors.neutral[500]} />
              최소 1개, 최대 4개의 지역을 선택해주세요
            </Text>
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
            <FontAwesome5 name="users" size={44} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>
              {activeTab === 'all'
                ? '클럽이 없습니다'
                : activeTab === 'join-applications'
                  ? '가입 신청 내역'
                  : '내 클럽'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all'
                ? searchTerm || statusFilter !== 'ALL'
                  ? '검색 조건에 맞는 클럽이 없습니다.'
                  : '아직 등록된 클럽이 없습니다.'
                : activeTab === 'join-applications'
                  ? '가입 승인 대기 중인 클럽이 없습니다.'
                  : '가입한 클럽이 없습니다. 클럽에 가입해보세요!'}
            </Text>
            {activeTab === 'all' && !searchTerm && statusFilter === 'ALL' ? (
              <Button variant="primary" size="sm" onPress={handleCreateClub}>
                첫 번째 클럽 등록하기
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
                const sidoCode = club?.sido_code || club?.sidoCode || '';
                const rawGunguCodes = club?.gungu_codes || club?.gunguCodes || [];
                const gunguCodes = Array.isArray(rawGunguCodes) ? rawGunguCodes : [];
                const sidoName = sidoNameMap[String(sidoCode)] || '';
                const gunguNames = gunguCodes
                  .map((code) => gunguNameMap[String(code)])
                  .filter(Boolean);
                const locationLabel = sidoName
                  ? gunguNames.length > 0
                    ? `${sidoName}, ${gunguNames.join(', ')}`
                    : sidoName
                  : gunguNames.length > 0
                    ? gunguNames.join(', ')
                    : '-';

                return (
                  <ClubCard
                    key={key}
                    club={club}
                    variant={variant}
                    onPress={handleCardPress(club)}
                    locationLabel={locationLabel}
                    styles={styles}
                    logoImage={logoImage}
                  />
                );
              })}
            </View>

            {totalPages > 1 && (
              <PaginationNav
                mode="numbered"
                currentPage={currentPage}
                totalPages={totalPages}
                pageNumbers={pageNumbers}
                onPrev={handlePrevPage}
                onNext={handleNextPage}
                onPage={handlePageChange}
                styles={styles}
                styleKeys={{
                  container: 'paginationRow',
                  navButton: 'pageNavButton',
                  navButtonDisabled: 'pageNavButtonDisabled',
                  navText: 'pageNavText',
                  numberButton: 'pageNumber',
                  numberButtonActive: 'pageNumberActive',
                  numberText: 'pageNumberText',
                  numberTextActive: 'pageNumberTextActive',
                }}
              />
            )}
          </>
        )}

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: base.tabScreenSafeArea,
  headerSafeArea: base.tabScreenHeaderSafeArea,
  headerContainer: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
  },
  container: base.container,
  content: {
    flex: 1,
  },
  stateContainer: base.stateCenter,
  headerRow: base.tabScreenHeaderRow,
  title: base.tabScreenTitle,
  createButton: base.headerCreateButton,
  createButtonText: base.headerCreateButtonText,
  tabBar: base.tabScreenTabBar,
  tabBarRow: base.tabScreenTabBarRow,
  tabButton: base.tabScreenTabButton,
  tabButtonActive: base.tabScreenTabButtonActive,
  tabText: base.tabScreenTabText,
  tabTextActive: base.tabScreenTabTextActive,
  searchFilterRow: {
    gap: 12,
  },
  regionFilterGroup: {
    marginTop: tokens.padding.sm,
    gap: tokens.spacing.xs,
  },
  label: base.labelSm,
  input: base.formInput,
  textArea: base.formTextArea,
  gunguBox: {
    height: 140,
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  chipRow: { ...base.chipRow, marginTop: tokens.spacing.xxs },
  gunguScroll: {
    flex: 1,
  },
  gunguScrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: tokens.spacing.xs,
  },
  chip: base.chipBase,
  chipActive: base.chipBaseActive,
  chipText: base.chipBaseText,
  chipTextActive: base.chipBaseTextActive,
  selectBox: base.selectBox,
  selectText: base.selectBoxText,
  selectArrow: base.selectBoxArrow,
  hiddenPicker: base.hiddenPicker,
  helperText: base.formHelperText,
  regionLoadingRow: base.loadingRow,
  searchBox: base.searchBox,
  searchInput: base.searchInput,
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
  myStatusButton: base.filterButton,
  myStatusButtonActive: base.filterButtonActive,
  myStatusText: base.filterButtonText,
  myStatusTextActive: base.filterButtonTextActive,
  loadingRow: base.stateLoading,
  errorCard: {
    marginTop: tokens.padding.md,
  },
  errorText: { ...base.textSmError, color: colors.error[700] },
  emptyState: base.emptyState,
  emptyTitle: base.emptyStateTitle,
  emptySubtitle: base.emptyStateSubtitle,
  cardList: base.cardList,
  cardPressable: base.tabCardPressable,
  cardPressed: base.tabCardPressed,
  card: base.tabCard,
  cardHeader: base.tabCardHeader,
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
    ...base.badgeRow,
    gap: 8,
    marginBottom: tokens.spacing.sm,
  },
  badge: base.badgeBase,
  badgeText: base.badgeBaseText,
  roleBadge: {
    paddingHorizontal: tokens.padding.xs,
  },
  cardDescription: base.tabCardDescription,
  metaList: base.tabCardMetaList,
  metaItem: base.tabCardMetaItem,
  metaText: base.tabCardMetaText,
  cardFooter: base.tabCardFooter,
  cardDate: base.tabCardDate,
  cardLink: base.tabCardLink,
  paginationRow: { ...base.paginationRow, marginTop: tokens.padding.lg },
  pageNavButton: base.paginationNavButton,
  pageNavButtonDisabled: { opacity: 0.4 },
  pageNavText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[500],
  },
  pageNumber: base.paginationNumber,
  pageNumberActive: base.paginationNumberActive,
  pageNumberText: base.paginationNumberText,
  pageNumberTextActive: base.paginationNumberTextActive,
});
