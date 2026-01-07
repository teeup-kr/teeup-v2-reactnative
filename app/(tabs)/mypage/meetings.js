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
import Card from '../../../src/components/ui/Card';
import ScreenHeader from '../../../src/components/ui/ScreenHeader';
import {
    myMeetingsRoleConfig,
    myMeetingsStatusConfig,
    myMeetingsStatusTabs,
    myMeetingsTypeConfig,
    myMeetingsTypeTabs,
} from '../../../src/constants/mypageConstants';
import { usersApi } from '../../../src/lib/api';
import { extractList, formatMeetingTimeShort, getMeetingStatusKey } from '../../../src/lib/meetingUtils';
import { colors } from '../../../src/theme/colors';

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

export default function MyMeetingsScreen() {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 5,
        ...(typeFilter !== 'all' ? { meeting_type_filter: typeFilter } : {}),
      };
      const response = await usersApi.getMyMeetings(params);
      const items = extractList(response);
      setMeetings(items);
      setTotalPages(response?.total_pages || response?.totalPages || 1);
    } catch (fetchError) {
      console.error('내 참여내역 조회 실패:', fetchError);
      setError('내 참여내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const statusKey = getMeetingStatusKey(meeting);
      const statusMatch = statusFilter === 'all' || statusKey === statusFilter;
      return statusMatch;
    });
  }, [meetings, statusFilter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="내 참여내역" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.filterCard}>
          <Text style={styles.sectionTitle}>모임 유형</Text>
          <View style={styles.chipRow}>
            {myMeetingsTypeTabs.map((tab) => (
              <FilterChip
                key={tab.id}
                label={tab.label}
                selected={typeFilter === tab.id}
                onPress={() => {
                  setTypeFilter(tab.id);
                  setPage(1);
                }}
              />
            ))}
          </View>
          <Text style={styles.sectionTitle}>상태</Text>
          <View style={styles.chipRow}>
            {myMeetingsStatusTabs.map((tab) => (
              <FilterChip
                key={tab.id}
                label={tab.label}
                selected={statusFilter === tab.id}
                onPress={() => setStatusFilter(tab.id)}
              />
            ))}
          </View>
        </Card>

        {loading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.stateText}>모임을 불러오는 중...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>조건에 맞는 모임이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>필터를 변경해 다른 모임을 확인해보세요.</Text>
          </Card>
        ) : (
          filteredMeetings.map((meeting, index) => {
            const meetingType = meeting?.meeting_type || meeting?.type || 'ROUND';
            const type = myMeetingsTypeConfig[meetingType] || myMeetingsTypeConfig.ROUND;
            const statusKey = getMeetingStatusKey(meeting);
            const status = myMeetingsStatusConfig[statusKey] || myMeetingsStatusConfig.UPCOMING;
            const roleKey = meeting?.role || meeting?.user_role || 'PARTICIPANT';
            const role = myMeetingsRoleConfig[roleKey] || myMeetingsRoleConfig.PARTICIPANT;
            const meetingId = meeting?.id || meeting?.meeting_id;
            const meetingKey = meetingId || `meeting-${index}`;
            const typeSlug = meetingType === 'ROUND' ? 'rounding' : 'social';
            const participantCount = meeting?.participant_count ?? meeting?.participants ?? 0;

            return (
              <Card key={meetingKey} style={styles.meetingCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{meeting?.meeting_name || meeting?.title || '모임명 없음'}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: type.bg }]}
                    >
                      <Text style={[styles.badgeText, { color: type.color }]}
                      >
                        {type.label}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: status.bg }]}
                    >
                      <Text style={[styles.badgeText, { color: status.color }]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>{meeting?.club_name || meeting?.club || '-'}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="calendar-alt" size={12} color={colors.neutral[500]} />
                    <Text style={styles.metaText}>{formatMeetingTimeShort(meeting?.meeting_time || meeting?.date)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
                    <Text style={styles.metaText}>{meeting?.location || '-'}</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="users" size={12} color={colors.neutral[500]} />
                    <Text style={styles.metaText}>{participantCount}명 참여</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: role.bg }]}
                  >
                    <Text style={[styles.badgeText, { color: role.color }]}>{role.label}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push(`/meetings/${typeSlug}/${meetingId}`)}
                  style={styles.detailButton}
                >
                  <Text style={styles.detailButtonText}>상세 보기</Text>
                </Pressable>
              </Card>
            );
          })
        )}

        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <Pressable
              onPress={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              style={[styles.pageButton, page <= 1 && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>이전</Text>
            </Pressable>
            <Text style={styles.paginationText}>{page} / {totalPages}</Text>
            <Pressable
              onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
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
    marginBottom: 12,
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
  meetingCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
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
  detailButton: {
    marginTop: 12,
    backgroundColor: colors.primary[600],
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
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
