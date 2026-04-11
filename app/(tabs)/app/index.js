import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppToast, { toastMap } from '@/components/ui/AppToast';
import StatusBadge from '@/components/ui/StatusBadge';
import { HOME_BANNER_SLIDES } from '@/constants/homeBannerSlides';
import { useAuth } from '@/context/AuthContext';
import { mypageApi } from '@/lib/api/api';
import { useResponsiveMetrics } from '@/lib/layout/responsiveMetrics';
import { fontTitle, iconSize, radius, space } from '@/lib/layout/responsiveTokenHelpers';
import { clampNumber } from '@/lib/layout/viewportUnits';
import { navigateWithCap } from '@/lib/navigation/cappedHistory';
import { getMeetingStatusBadgeConfigs, getMeetingTypeBadgeConfig } from '@/lib/util/meetingUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const QUICK_ACTIONS = [
  {
    id: 'clubs',
    icon: 'users',
    label: '클럽',
    route: '/clubs',
    bg: colors.success[50],
    fg: colors.success[700],
    fontColor : colors.neutral[900]
  },
  {
    id: 'rounding',
    icon: 'trophy',
    label: '라운딩',
    route: '/meetings?tab=rounding',
    bg: colors.success[50],
    fg: colors.success[700],
    fontColor : colors.neutral[900]
  },
  {
    id: 'social',
    icon: 'map-marker-alt',
    label: '소셜',
    route: '/meetings?tab=social',
    bg: colors.success[50],
    fg: colors.success[700],
    fontColor : colors.neutral[900]
  },
  {
    id: 'records',
    icon: 'edit',
    label: '기록',
    route: '/mypage?tab=records',
    bg: colors.success[50],
    fg: colors.success[700],
    fontColor : colors.neutral[900]
  },
];

const CAROUSEL_SCROLL_ANIMATION_DURATION = 420;
/** `onLayout` / 창 너비 힌트 간 스킵으로 불필요한 리렌더 완화 */
const CAROUSEL_WIDTH_EPS_PX = 2;
/** 초광폭에서 홈 본문만 살짝 캡 (가독성) */
const HOME_ULTRA_WIDE_BREAKPOINT_PX = 1200;
const HOME_SOFT_MAX_CONTENT_PX = 1120;
/**
 * 전역 `isTablet`(너비 ≥ breakpoint)만으로는 가로 모드 폰이 태블릿으로 분류됨.
 * 홈 2열(퀵액션·모임 카드)은 짧은 변이 충분히 큰 경우에만 켠다.
 */
const HOME_TWO_COLUMN_SHORTEST_SIDE_MIN_PX = 600;

function getMeetingId(meeting) {
  return meeting?.id || meeting?.meeting_id;
}

function getMeetingTypeSlug(meeting) {
  const type = String(meeting?.meeting_type || meeting?.type || '').toUpperCase();
  return type === 'SOCIAL' ? 'social' : 'rounding';
}

function isRoundingMeeting(meeting) {
  const type = String(meeting?.meeting_type || meeting?.type || '').toUpperCase();
  return type === 'ROUND' || type === 'ROUNDING';
}

function isUpcomingMeeting(meeting, nowMs) {
  const meetingMs = Date.parse(meeting?.meeting_time || '');
  if (!Number.isFinite(meetingMs)) return false;

  const status = String(meeting?.status || '').toUpperCase();
  return meetingMs > nowMs && status !== 'COMPLETED' && status !== 'CANCELED';
}

function formatMeetingDate(value) {
  if (!value) return '일정 미정';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '일정 미정';

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const metrics = useResponsiveMetrics();
  const viewportWidthHint = metrics.width;
  const { toast: toastParam } = useLocalSearchParams();
  const { isAuthenticated } = useAuth();

  const carouselRef = useRef(null);
  /** 마지막 `onLayout` 폭 — 창 너비가 셸 슬롯보다 클 때 힌트가 슬롯을 덮지 않게 함 */
  const carouselLayoutWidthRef = useRef(null);
  const [toastKey, setToastKey] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [carouselWidth, setCarouselWidth] = useState(() =>
    Math.max(280, Number(viewportWidthHint) > 0 ? Math.round(viewportWidthHint) : 320),
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [failedSlideMap, setFailedSlideMap] = useState({});
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentRoundingCount, setRecentRoundingCount] = useState(0);
  const [isMeetingLoading, setIsMeetingLoading] = useState(false);
  const [meetingError, setMeetingError] = useState('');

  const bannerSlides = HOME_BANNER_SLIDES;
  const carouselHeight = useMemo(() => {
    const w = carouselWidth;
    const ch = metrics.contentHeight > 0 ? metrics.contentHeight : metrics.height;
    const widthBased = Math.round(w * 0.58);
    const vhCap = Math.round((ch * 50) / 100);
    return Math.max(200, Math.min(widthBased, vhCap || widthBased));
  }, [carouselWidth, metrics.contentHeight, metrics.height]);
  const visibleUpcomingMeetings = useMemo(
    () => upcomingMeetings.filter((meeting) => getMeetingId(meeting)).slice(0, 2),
    [upcomingMeetings]
  );

  useEffect(() => {
    const toastValue = Array.isArray(toastParam) ? toastParam[0] : toastParam;
    if (!toastMap[toastValue]) return;

    setToastKey(toastValue);
    router.setParams({ toast: undefined });

    return undefined;
  }, [toastParam, router]);

  const loadHomeMeetings = useCallback(async () => {
    if (!isAuthenticated) {
      setUpcomingMeetings([]);
      setRecentRoundingCount(0);
      setMeetingError('');
      return;
    }

    try {
      setIsMeetingLoading(true);
      setMeetingError('');

      const response = await mypageApi.fetchMyMeetings({ page: 1, limit: 50 });
      const meetings = extractList(response);
      const nowMs = Date.now();

      const nextRoundingMeetings = meetings
        .filter((meeting) => isRoundingMeeting(meeting) && isUpcomingMeeting(meeting, nowMs))
        .sort((left, right) => Date.parse(left?.meeting_time || '') - Date.parse(right?.meeting_time || ''))
        .slice(0, 2);

      const completedRoundingCount = meetings.filter(
        (meeting) =>
          isRoundingMeeting(meeting) &&
          String(meeting?.status || '').toUpperCase() === 'COMPLETED'
      ).length;

      setUpcomingMeetings(nextRoundingMeetings);
      setRecentRoundingCount(completedRoundingCount);
    } catch (error) {
      console.error('홈 모임 정보 조회 실패:', error);
      setUpcomingMeetings([]);
      setRecentRoundingCount(0);
      setMeetingError(error?.message || '다음 라운딩 정보를 불러오지 못했습니다.');
    } finally {
      setIsMeetingLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      loadHomeMeetings();
      return undefined;
    }, [loadHomeMeetings])
  );

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  /** 회전·리사이즈 시 창 너비 힌트; 슬롯이 이미 더 좁게 잡혀 있으면(웹 셸 등) 덮어쓰지 않음 */
  useEffect(() => {
    const hint = Math.round(viewportWidthHint);
    if (!Number.isFinite(hint) || hint < 280) return;
    setCarouselWidth((prev) => {
      const slot = carouselLayoutWidthRef.current;
      if (slot != null && hint > slot + CAROUSEL_WIDTH_EPS_PX) {
        return prev;
      }
      if (Math.abs(prev - hint) <= CAROUSEL_WIDTH_EPS_PX) return prev;
      return hint;
    });
  }, [viewportWidthHint]);

  const handleCarouselLayout = useCallback((event) => {
    const measuredWidth = event.nativeEvent.layout.width;
    if (!Number.isFinite(measuredWidth) || measuredWidth <= 1) return;
    const nextWidth = Math.round(measuredWidth);
    carouselLayoutWidthRef.current = nextWidth;
    setCarouselWidth((prevWidth) => {
      if (Math.abs(prevWidth - nextWidth) <= CAROUSEL_WIDTH_EPS_PX) return prevWidth;
      return nextWidth;
    });
  }, []);

  const handleSnapToItem = useCallback((index) => {
    setActiveSlide(index);
  }, []);

  const handleDotPress = useCallback(
    (index) => {
      carouselRef.current?.scrollTo({ index, animated: true });
      setActiveSlide(index);
    },
    []
  );

  const handleImageError = useCallback(
    (index) => () => {
      setFailedSlideMap((prev) => ({ ...prev, [index]: true }));
    },
    []
  );

  const handleQuickActionPress = useCallback(
    (route) => () => {
      navigateWithCap(router, route);
    },
    [router]
  );

  const handleOpenMeeting = useCallback(
    (meeting) => () => {
      const meetingId = getMeetingId(meeting);
      if (!meetingId) return;
      navigateWithCap(router, `/meetings/${getMeetingTypeSlug(meeting)}/${meetingId}`);
    },
    [router]
  );

  const quickGap = space('sm', metrics.spacingScale);
  const quickSectionPadH = space('xl', metrics.spacingScale);
  const placeholderIconSz = iconSize(24, metrics.uiScale, 20, 28);
  const summaryEditIconSz = iconSize(20, metrics.uiScale, 18, 24);

  const quickActionBoxSide = useMemo(
    () => clampNumber(48, Math.round(56 * metrics.uiScale), 72),
    [metrics.uiScale],
  );
  const quickActionIconPx = useMemo(
    () => clampNumber(17, Math.round(quickActionBoxSide * 0.34), 26),
    [quickActionBoxSide],
  );
  const quickLabelFontSize = useMemo(
    () => fontTitle('base', metrics.fontScaleWeak),
    [metrics.fontScaleWeak],
  );

  const meetingIconWrapSide = useMemo(() => iconSize(32, metrics.uiScale, 28, 40), [metrics.uiScale]);
  const meetingGolfIconSz = useMemo(() => iconSize(14, metrics.uiScale, 12, 17), [metrics.uiScale]);
  const meetingMetaIconSz = useMemo(() => iconSize(11, metrics.uiScale, 10, 14), [metrics.uiScale]);

  const contentColumnStyle = useMemo(
    () => [
      styles.contentColumn,
      metrics.width > HOME_ULTRA_WIDE_BREAKPOINT_PX && {
        maxWidth: HOME_SOFT_MAX_CONTENT_PX,
        width: '100%',
        alignSelf: 'center',
      },
    ],
    [metrics.width],
  );

  const homeSupportsTwoColumn = useMemo(
    () =>
      Boolean(metrics.isTablet && metrics.shortestSide >= HOME_TWO_COLUMN_SHORTEST_SIDE_MIN_PX),
    [metrics.isTablet, metrics.shortestSide],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <View style={contentColumnStyle}>
        <View style={styles.carouselSection} onLayout={handleCarouselLayout}>
          <View style={[styles.carouselViewport, { height: carouselHeight }]}>
            {isHydrated ? (
              <Carousel
                ref={carouselRef}
                loop
                width={carouselWidth}
                height={carouselHeight}
                data={bannerSlides}
                windowSize={Math.max(1, bannerSlides.length)}
                pagingEnabled
                maxScrollDistancePerSwipe={carouselWidth}
                scrollAnimationDuration={CAROUSEL_SCROLL_ANIMATION_DURATION}
                onConfigurePanGesture={(pan) => {
                  pan.activeOffsetX([-12, 12]).failOffsetY([-8, 8]);
                }}
                onSnapToItem={handleSnapToItem}
                renderItem={({ item, index }) => (
                  <View style={[styles.heroSlide, { height: carouselHeight }]}>
                    <ImageBackground
                      source={item.source}
                      resizeMode="cover"
                      fadeDuration={0}
                      onError={handleImageError(index)}
                      style={styles.heroImage}
                    >
                      <View style={styles.heroOverlay}>
                        {failedSlideMap[index] ? (
                          <View style={styles.placeholderWrap}>
                            {isHydrated ? <FontAwesome5 name="camera" size={placeholderIconSz} color={colors.neutral[300]} /> : null}
                            <Text style={styles.placeholderText}>Placeholder</Text>
                          </View>
                        ) : null}
                      </View>
                    </ImageBackground>
                  </View>
                )}
              />
            ) : (
              <View style={[styles.heroSlide, { height: carouselHeight }]}>
                {bannerSlides[0] ? (
                  <ImageBackground
                    source={bannerSlides[0].source}
                    resizeMode="cover"
                    fadeDuration={0}
                    onError={handleImageError(0)}
                    style={styles.heroImage}
                  >
                    <View style={styles.heroOverlay}>
                      {failedSlideMap[0] ? (
                        <View style={styles.placeholderWrap}>
                          {isHydrated ? <FontAwesome5 name="camera" size={placeholderIconSz} color={colors.neutral[300]} /> : null}
                          <Text style={styles.placeholderText}>Placeholder</Text>
                        </View>
                      ) : null}
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={[styles.heroImage, styles.heroOverlay]}>
                    <View style={styles.placeholderWrap}>
                      {isHydrated ? <FontAwesome5 name="camera" size={placeholderIconSz} color={colors.neutral[300]} /> : null}
                      <Text style={styles.placeholderText}>Placeholder</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          <View pointerEvents="none" style={styles.heroTextWrap}>
            <Text style={[styles.heroCaption, { fontSize: fontTitle('xl', metrics.fontScaleWeak) }]}>
              편리한 골프 동호회 운영 관리 플랫폼
            </Text>
            <Text
              style={[
                styles.heroTitle,
                {
                  fontSize: fontTitle('mega', metrics.fontScaleWeak),
                  lineHeight: Math.round(fontTitle('mega', metrics.fontScaleWeak) * 1.08),
                },
              ]}
            >
              티업링크
            </Text>
          </View>

          <View style={styles.dotRow}>
            {bannerSlides.map((slide, index) => (
              <Pressable
                key={slide.id}
                onPress={() => handleDotPress(index)}
                style={[styles.dot, activeSlide === index && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        <View
          style={[
            styles.quickSection,
            homeSupportsTwoColumn && {
              flexWrap: 'wrap',
              rowGap: quickGap,
              columnGap: quickGap,
              justifyContent: 'flex-start',
              paddingHorizontal: quickSectionPadH,
            },
          ]}
        >
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={[styles.quickItem, homeSupportsTwoColumn && styles.quickItemTablet]}
              onPress={handleQuickActionPress(action.route)}
            >
              <View
                style={[
                  styles.quickIconWrap,
                  {
                    width: quickActionBoxSide,
                    height: quickActionBoxSide,
                    borderRadius: radius('md', metrics.uiScale),
                    backgroundColor: action.bg,
                  },
                ]}
              >
                {isHydrated ? (
                  <FontAwesome5 name={action.icon} size={quickActionIconPx} color={action.fg} />
                ) : null}
              </View>
              <Text
                style={[styles.quickLabel, { color: action.fontColor, fontSize: quickLabelFontSize }]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>최근 라운딩 기록</Text>
            <Text style={styles.summaryValue}>
              {isAuthenticated ? `${recentRoundingCount}회` : '로그인 필요'}
            </Text>
            <Text style={styles.summaryIcon}>⛳</Text>
          </View>

          <Pressable
            style={styles.summaryCard}
            onPress={() => navigateWithCap(router, '/mypage?tab=records')}
          >
            <Text style={styles.summaryTitle}>라운드 기록하기</Text>
            <Text style={styles.summarySubText}>스코어 등록</Text>
            {isHydrated ? <FontAwesome5 name="edit" size={summaryEditIconSz} color={colors.neutral[600]} /> : null}
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.summaryTitle}>다음 라운딩</Text>
          <Pressable onPress={() => navigateWithCap(router, isAuthenticated ? '/meetings/my' : '/meetings')}>
            <Text style={styles.sectionMore}>더보기</Text>
          </Pressable>
        </View>

        {!isAuthenticated ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>로그인 후 다음 라운딩 일정을 확인할 수 있습니다.</Text>
          </View>
        ) : isMeetingLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.stateText}>일정을 불러오는 중...</Text>
          </View>
        ) : meetingError ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{meetingError}</Text>
          </View>
        ) : visibleUpcomingMeetings.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>예정된 라운딩이 없습니다.</Text>
          </View>
        ) : (
          <View style={[styles.meetingList, homeSupportsTwoColumn && styles.meetingListTablet]}>
            {visibleUpcomingMeetings.map((meeting) => {
              const meetingId = getMeetingId(meeting);
              const participantCount = meeting?.participant_count ?? 0;
              const maxParticipants = meeting?.max_participants
                ? `/${meeting.max_participants}`
                : '';
              const typeBadge = getMeetingTypeBadgeConfig(meeting?.meeting_type || meeting?.type || 'ROUND');
              const statusBadges = getMeetingStatusBadgeConfigs(meeting);

              return (
                <Pressable
                  key={String(meetingId)}
                  style={[styles.meetingCard, homeSupportsTwoColumn && styles.meetingCardTablet]}
                  onPress={handleOpenMeeting(meeting)}
                >
                  <View
                    style={[
                      styles.meetingIconWrap,
                      {
                        width: meetingIconWrapSide,
                        height: meetingIconWrapSide,
                        borderRadius: radius('lg', metrics.uiScale),
                      },
                    ]}
                  >
                    {isHydrated ? (
                      <FontAwesome5 name="golf-ball" size={meetingGolfIconSz} color={colors.primary[600]} />
                    ) : null}
                  </View>

                  <View style={styles.meetingInfo}>
                    <Text style={styles.meetingName}>{meeting?.name || meeting?.meeting_name || '모임'}</Text>
                    <Text style={styles.meetingDate}>{formatMeetingDate(meeting?.meeting_time)}</Text>
                    {(meeting?.location || meeting?.venue_name) ? (
                      <View style={styles.meetingMetaRow}>
                        {isHydrated ? (
                          <FontAwesome5 name="map-marker-alt" size={meetingMetaIconSz} color={colors.neutral[500]} />
                        ) : null}
                        <Text
                          style={[styles.meetingMetaText, homeSupportsTwoColumn && styles.meetingMetaTextTablet]}
                          numberOfLines={1}
                        >
                          {meeting?.location || meeting?.venue_name}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.meetingMetaRow}>
                      {isHydrated ? (
                        <FontAwesome5 name="users" size={meetingMetaIconSz} color={colors.neutral[500]} />
                      ) : null}
                      <Text style={styles.meetingMetaText}>총원 {participantCount}{maxParticipants}명</Text>
                    </View>
                    <View style={styles.meetingBadgeRow}>
                      <StatusBadge
                        text={typeBadge.text}
                        backgroundColor={typeBadge.backgroundColor}
                        textColor={typeBadge.textColor}
                        style={styles.meetingTypeBadge}
                        textStyle={styles.meetingTypeBadgeText}
                      />
                    </View>
                  </View>

                  <View style={styles.meetingStatusBadgeWrap}>
                    {statusBadges.map((badge) => (
                      <StatusBadge
                        key={`${meetingId}-${badge.key}`}
                        text={badge.text}
                        backgroundColor={badge.backgroundColor}
                        textColor={badge.textColor}
                        style={styles.meetingStatusBadge}
                        textStyle={styles.meetingStatusBadgeText}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        </View>
      </ScrollView>

      <AppToast toastKey={toastKey} onClose={() => setToastKey(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaWhite,
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.neutral[100],
    paddingBottom: tokens.padding.xl,
  },
  contentColumn: {
    width: '100%',
  },
  carouselSection: {
    backgroundColor: colors.neutral[800],
  },
  carouselViewport: {
    width: '100%',
  },
  heroSlide: {
    width: '100%',
  },
  heroImage: {
    flex: 1,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: tokens.padding.xl,
    paddingVertical: tokens.padding.xl,
  },
  placeholderWrap: {
    alignSelf: 'center',
    marginTop: tokens.spacing.xxl,
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: tokens.spacing.xs,
    color: colors.neutral[300],
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
  },
  heroTextWrap: {
    position: 'absolute',
    left: tokens.padding.xl,
    right: tokens.padding.xl,
    bottom: 56,
  },
  heroCaption: {
    color: colors.white,
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.semibold,
    letterSpacing: 0.4,
    marginBottom: tokens.spacing.sm,
  },
  heroTitle: {
    color: colors.white,
    fontSize: tokens.font.mega,
    lineHeight: tokens.font.mega,
    fontWeight: tokens.fontWeight.bold,
    letterSpacing: -0.6,
  },
  dotRow: {
    height: 32,
    backgroundColor: colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: tokens.radius.pill,
    backgroundColor: colors.neutral[400],
    marginHorizontal: 4,
  },
  activeDot: {
    width: 10,
    height: 10,
    backgroundColor: colors.black,
  },
  quickSection: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: tokens.padding.xl,
    paddingTop: tokens.padding.md,
    paddingBottom: tokens.padding.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  quickItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  quickItemTablet: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  quickIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.xs,
  },
  quickLabel: {
    color: colors.neutral[900],
    fontWeight: tokens.fontWeight.semibold,
    textAlign: 'center',
  },
  summaryRow: {
    paddingHorizontal: tokens.padding.md,
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    paddingVertical: tokens.padding.lg,
    paddingHorizontal: tokens.padding.sm,
  },
  summaryTitle: {
    color: colors.neutral[900],
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
  },
  summaryValue: {
    color: colors.neutral[600],
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.semibold,
    marginBottom: tokens.spacing.xs2,
  },
  summarySubText: {
    color: colors.neutral[600],
    fontSize: tokens.font.base,
    marginBottom: tokens.spacing.sm,
  },
  summaryIcon: {
    fontSize: 24,
  },
  sectionHeader: {
    paddingHorizontal: tokens.padding.md,
    marginBottom: tokens.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.neutral[900],
    fontSize: 40,
    lineHeight: 46,
    fontWeight: tokens.fontWeight.bold,
  },
  sectionMore: {
    color: colors.primary[700],
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
  },
  stateCard: {
    marginHorizontal: tokens.padding.md,
    minHeight: 88,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.md,
  },
  stateText: {
    marginTop: tokens.spacing.xs,
    color: colors.neutral[700],
    fontSize: tokens.font.base,
    textAlign: 'center',
  },
  errorText: {
    color: colors.error[700],
    fontSize: tokens.font.base,
    textAlign: 'center',
  },
  meetingList: {
    paddingHorizontal: tokens.padding.md,
  },
  meetingListTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: tokens.spacing.sm,
    rowGap: tokens.spacing.sm,
  },
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.lg,
    paddingVertical: tokens.padding.md,
    marginBottom: tokens.spacing.sm2,
  },
  meetingCardTablet: {
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 0,
  },
  meetingIconWrap: {
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingName: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  meetingDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  meetingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  meetingMetaText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    maxWidth: 190,
  },
  meetingMetaTextTablet: {
    maxWidth: '100%',
  },
  meetingBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  meetingTypeBadge: {
    alignSelf: 'flex-start',
  },
  meetingTypeBadgeText: {
    fontSize: tokens.font.xs,
  },
  meetingStatusBadgeWrap: {
    marginLeft: tokens.spacing.xs,
    alignItems: 'flex-end',
    gap: 4,
  },
  meetingStatusBadge: {
    alignSelf: 'flex-end',
  },
  meetingStatusBadgeText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
});
