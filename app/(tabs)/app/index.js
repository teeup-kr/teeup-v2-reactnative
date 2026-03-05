import { FontAwesome5 } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppToast, { toastMap } from '@/components/ui/AppToast';
import { useAuth } from '@/context/AuthContext';
import { mypageApi } from '@/lib/api/api';
import { navigateWithCap } from '@/lib/navigation/cappedHistory';
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

const CAROUSEL_IMAGE_NAMES = ['main1.png', 'main2.png', 'main3.png', 'main4.png'];

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

function getMeetingStatusBadgeConfig(status) {
  const key = String(status || '').toUpperCase();
  if (key === 'IN_PROGRESS') {
    return {
      label: '진행중',
      backgroundColor: colors.success[50],
      textColor: colors.success[700],
    };
  }
  if (key === 'COMPLETED') {
    return {
      label: '완료',
      backgroundColor: colors.neutral[100],
      textColor: colors.neutral[700],
    };
  }
  if (key === 'CANCELED') {
    return {
      label: '취소',
      backgroundColor: colors.error[50],
      textColor: colors.error[700],
    };
  }
  return {
    label: '예정',
    backgroundColor: colors.info[50],
    textColor: colors.info[700],
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { toast: toastParam } = useLocalSearchParams();
  const { isAuthenticated } = useAuth();

  const baseUrl = Constants.expoConfig.extra.webOrigin;
  const carouselRef = useRef(null);
  const [toastKey, setToastKey] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [failedSlideMap, setFailedSlideMap] = useState({});
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentRoundingCount, setRecentRoundingCount] = useState(0);
  const [isMeetingLoading, setIsMeetingLoading] = useState(false);
  const [meetingError, setMeetingError] = useState('');

  const bannerImageUrls = useMemo(
    () => CAROUSEL_IMAGE_NAMES.map((name) => `${baseUrl}/image/${name}`),
    [baseUrl]
  );
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

  useEffect(() => {
    loadHomeMeetings();
  }, [loadHomeMeetings]);

  const carouselWidth = Math.max(width, 1);

  const handleCarouselEnd = useCallback(
    (event) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / carouselWidth);
      setActiveSlide(index);
    },
    [carouselWidth]
  );

  const handleDotPress = useCallback(
    (index) => {
      carouselRef.current?.scrollTo({ x: index * carouselWidth, animated: true });
      setActiveSlide(index);
    },
    [carouselWidth]
  );

  const handleImageError = useCallback(
    (index) => () => {
      setFailedSlideMap((prev) => ({ ...prev, [index]: true }));
    },
    []
  );

  const handleQuickActionPress = useCallback(
    (route) => () => {
      if (!isAuthenticated) {
        navigateWithCap(router, '/login');
        return;
      }
      navigateWithCap(router, route);
    },
    [isAuthenticated, router]
  );

  const handleOpenMeeting = useCallback(
    (meeting) => () => {
      const meetingId = getMeetingId(meeting);
      if (!meetingId) return;
      navigateWithCap(router, `/meetings/${getMeetingTypeSlug(meeting)}/${meetingId}`);
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.carouselSection}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCarouselEnd}
          >
            {bannerImageUrls.map((imageUrl, index) => (
              <View key={imageUrl} style={[styles.heroSlide, { width: carouselWidth }]}> 
                <ImageBackground
                  source={{ uri: imageUrl }}
                  resizeMode="cover"
                  onError={handleImageError(index)}
                  style={styles.heroImage}
                >
                  <View style={styles.heroOverlay}>
                    {failedSlideMap[index] ? (
                      <View style={styles.placeholderWrap}>
                        <FontAwesome5 name="camera" size={24} color={colors.neutral[300]} />
                        <Text style={styles.placeholderText}>Placeholder</Text>
                      </View>
                    ) : null}
                  </View>
                </ImageBackground>
              </View>
            ))}
          </ScrollView>

          <View pointerEvents="none" style={styles.heroTextWrap}>
            <Text style={styles.heroCaption}>편리한 골프 동호회 운영 관리 플랫폼</Text>
            <Text style={styles.heroTitle}>티업링크</Text>
          </View>

          <View style={styles.dotRow}>
            {bannerImageUrls.map((imageUrl, index) => (
              <Pressable
                key={imageUrl}
                onPress={() => handleDotPress(index)}
                style={[styles.dot, activeSlide === index && styles.activeDot]}
              />
            ))}
          </View>
        </View>

        <View style={styles.quickSection}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.id}
              style={styles.quickItem}
              onPress={handleQuickActionPress(action.route)}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: action.bg }]}>
                <FontAwesome5 name={action.icon} size={18} color={action.fg} />
              </View>
              <Text style={[styles.quickLabel, { color: action.fontColor }]}>{action.label}</Text>
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
            onPress={() => navigateWithCap(router, isAuthenticated ? '/mypage?tab=meetings' : '/login')}
          >
            <Text style={styles.summaryTitle}>라운드 기록하기</Text>
            <Text style={styles.summarySubText}>스코어 등록</Text>
            <FontAwesome5 name="edit" size={20} color={colors.neutral[600]} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.summaryTitle}>다음 라운딩</Text>
          <Pressable onPress={() => navigateWithCap(router, isAuthenticated ? '/meetings/my' : '/login')}>
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
          <View style={styles.meetingList}>
            {visibleUpcomingMeetings.map((meeting) => {
              const meetingId = getMeetingId(meeting);
              const participantCount = meeting?.participant_count ?? 0;
              const maxParticipants = meeting?.max_participants
                ? `/${meeting.max_participants}`
                : '';
              const statusBadge = getMeetingStatusBadgeConfig(meeting?.status);

              return (
                <Pressable key={String(meetingId)} style={styles.meetingCard} onPress={handleOpenMeeting(meeting)}>
                  <View style={styles.meetingIconWrap}>
                    <FontAwesome5 name="golf-ball" size={13} color={colors.primary[600]} />
                  </View>

                  <View style={styles.meetingInfo}>
                    <Text style={styles.meetingName}>{meeting?.name || meeting?.meeting_name || '모임'}</Text>
                    <Text style={styles.meetingDate}>{formatMeetingDate(meeting?.meeting_time)}</Text>
                    {(meeting?.location || meeting?.venue_name) ? (
                      <View style={styles.meetingMetaRow}>
                        <FontAwesome5 name="map-marker-alt" size={11} color={colors.neutral[500]} />
                        <Text style={styles.meetingMetaText} numberOfLines={1}>
                          {meeting?.location || meeting?.venue_name}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.meetingMetaRow}>
                      <FontAwesome5 name="users" size={11} color={colors.neutral[500]} />
                      <Text style={styles.meetingMetaText}>총원 {participantCount}{maxParticipants}명</Text>
                    </View>
                    <View style={styles.meetingBadgeRow}>
                      <Text style={styles.meetingTypeBadge}>라운딩</Text>
                    </View>
                  </View>

                  <View style={[styles.meetingStatusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
                    <Text style={[styles.meetingStatusBadgeText, { color: statusBadge.textColor }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <AppToast toastKey={toastKey} onClose={() => setToastKey(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaWhite,
  container: {
    backgroundColor: colors.neutral[100],
    paddingBottom: tokens.padding.xl,
  },
  carouselSection: {
    backgroundColor: colors.neutral[800],
  },
  heroSlide: {
    height: 420,
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
  },
  quickItem: {
    width: 72,
    alignItems: 'center',
  },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.xs,
  },
  quickLabel: {
    color: colors.neutral[900],
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
  },
  summaryRow: {
    paddingHorizontal: tokens.padding.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  summaryCard: {
    width: '48.5%',
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
    color: colors.neutral[700],
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
  meetingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
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
  meetingBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  meetingTypeBadge: {
    fontSize: tokens.font.xs,
    color: colors.info[700],
    backgroundColor: colors.info[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.pill,
  },
  meetingStatusBadge: {
    marginLeft: tokens.spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
  },
  meetingStatusBadgeText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
});
