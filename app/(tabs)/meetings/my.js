import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginRequired from '@/components/auth/LoginRequired';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { mypageApi } from '@/lib/api/api';
import { navigateWithCap } from '@/lib/navigation/cappedHistory';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'upcoming', label: '예정된 모임' },
  { id: 'progress', label: '진행 중' },
  { id: 'completed', label: '완료된 모임' },
];

function toDateLabel(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTypeLabel(meeting) {
  const type = String(meeting?.meeting_type || meeting?.type || '').toUpperCase();
  return type === 'SOCIAL' ? '소셜' : '라운딩';
}

function getTypeSlug(meeting) {
  const type = String(meeting?.meeting_type || meeting?.type || '').toUpperCase();
  return type === 'SOCIAL' ? 'social' : 'rounding';
}

function getStatusBadgeConfig(status) {
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

function formatCost(value) {
  if (value === null || value === undefined || value === '') return '미정';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return `${numeric.toLocaleString('ko-KR')}원`;
}

function isUpcoming(meeting) {
  const meetingDate = new Date(meeting?.meeting_time || 0);
  return (
    !Number.isNaN(meetingDate.getTime()) &&
    meetingDate > new Date() &&
    String(meeting?.status || '').toUpperCase() === 'SCHEDULED'
  );
}

function isInProgress(meeting) {
  return String(meeting?.status || '').toUpperCase() === 'IN_PROGRESS';
}

function isCompleted(meeting) {
  return String(meeting?.status || '').toUpperCase() === 'COMPLETED';
}

export default function MyMeetingsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');

  const loadMeetings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await mypageApi.fetchMyMeetings({ page: 1, limit: 50 });
      setMeetings(extractList(response));
    } catch (fetchError) {
      console.error('내 모임 조회 실패:', fetchError);
      setError(fetchError?.message || '모임을 불러오는데 실패했습니다.');
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMeetings();
  }, [isAuthenticated, loadMeetings]);

  const filteredMeetings = useMemo(() => {
    if (tab === 'upcoming') return meetings.filter(isUpcoming);
    if (tab === 'progress') return meetings.filter(isInProgress);
    if (tab === 'completed') return meetings.filter(isCompleted);
    return meetings;
  }, [meetings, tab]);

  const tabCounts = useMemo(
    () => ({
      all: meetings.length,
      upcoming: meetings.filter(isUpcoming).length,
      progress: meetings.filter(isInProgress).length,
      completed: meetings.filter(isCompleted).length,
    }),
    [meetings]
  );

  const handleOpenMeeting = useCallback(
    (meeting) => () => {
      const id = meeting?.id || meeting?.meeting_id;
      if (!id) return;
      navigateWithCap(router, `/meetings/${getTypeSlug(meeting)}/${id}`);
    },
    [router]
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
        description="내 모임을 보려면 로그인이 필요합니다."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="내 모임" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>현재 참여 모임</Text>
            <Text style={styles.summaryValue}>{meetings.length}개</Text>
          </Card>

          <Pressable style={styles.refreshButton} onPress={loadMeetings}>
            <FontAwesome5 name="sync-alt" size={12} color={colors.neutral[700]} />
            <Text style={styles.refreshText}>새로고침</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.tabButton, selected && styles.tabButtonActive]}
                onPress={() => setTab(item.id)}
              >
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                  {item.label} {tabCounts[item.id]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>모임을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : filteredMeetings.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>표시할 모임이 없습니다.</Text>
            </View>
          ) : (
            filteredMeetings.map((meeting) => {
              const id = meeting?.id || meeting?.meeting_id;
              const typeLabel = getTypeLabel(meeting);
              const statusBadge = getStatusBadgeConfig(meeting?.status);
              const costValue =
                typeLabel === '라운딩'
                  ? formatCost(meeting?.total_cost)
                  : formatCost(meeting?.social_cost);
              return (
                <Pressable key={id} style={styles.row} onPress={handleOpenMeeting(meeting)}>
                  <View style={styles.iconWrap}>
                    <FontAwesome5
                      name={typeLabel === '라운딩' ? 'golf-ball' : 'users'}
                      size={13}
                      color={colors.primary[600]}
                    />
                  </View>

                  <View style={styles.info}>
                    <Text style={styles.name}>{meeting?.name || meeting?.meeting_name || '모임'}</Text>
                    <Text style={styles.date}>{toDateLabel(meeting?.meeting_time)}</Text>
                    <View style={styles.metaRow}>
                      {(meeting?.location || meeting?.venue_name) ? (
                        <View style={styles.metaItem}>
                          <FontAwesome5 name="map-marker-alt" size={11} color={colors.neutral[500]} />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {meeting?.location || meeting?.venue_name}
                          </Text>
                        </View>
                      ) : null}
                      <View style={styles.metaItem}>
                        <FontAwesome5 name="users" size={11} color={colors.neutral[500]} />
                        <Text style={styles.metaText}>
                          {meeting?.participant_count ?? 0}
                          {meeting?.max_participants ? `/${meeting.max_participants}` : ''}명
                        </Text>
                      </View>
                    </View>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <FontAwesome5 name="dollar-sign" size={11} color={colors.neutral[500]} />
                        <Text style={styles.metaText}>{costValue}</Text>
                      </View>
                    </View>
                    <View style={styles.badgeRow}>
                      <Text style={styles.typeBadge}>{typeLabel}</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
                    <Text style={[styles.statusBadgeText, { color: statusBadge.textColor }]}>
                      {statusBadge.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  headerRow: {
    marginBottom: tokens.spacing.md,
  },
  summaryCard: {
    marginBottom: tokens.spacing.sm2,
  },
  summaryTitle: {
    fontSize: tokens.font.base,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginTop: tokens.spacing.xs,
  },
  refreshButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[100],
  },
  refreshText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  tabRow: {
    gap: 8,
    marginBottom: tokens.spacing.sm2,
  },
  tabButton: {
    borderRadius: tokens.radius.pill,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.xs,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  tabTextActive: {
    color: colors.white,
  },
  list: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.padding.xxs,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  date: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  metaText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    maxWidth: 190,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  typeBadge: {
    fontSize: tokens.font.xs,
    color: colors.info[700],
    backgroundColor: colors.info[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.pill,
  },
  statusBadge: {
    marginLeft: tokens.spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
  },
  statusBadgeText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
});
