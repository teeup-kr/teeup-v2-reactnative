
import {
FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker,
{ DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useCallback,
useEffect,
useMemo,
useState } from 'react';
import { StyleSheet } from 'react-native';
import {
  ActivityIndicator,
Platform,
Pressable,
ScrollView,
Text,
View,
} from 'react-native';

import Card from '@/components/ui/Card';
import {
  myMeetingsRoleConfig,
  myMeetingsStatusConfig,
  myMeetingsTypeConfig,
  myMeetingsTypeTabs
} from '@/constants/mypageConstants';
import { usersApi } from '@/lib/api';
import {
  extractList,
  formatMeetingTimeShort,
  getMeetingStatusKey,
} from '@/lib/meetingUtils';
import { base, tokens } from '@/styles/style';
import { colors } from '@/theme/colors';
/* =========================
   Filter Chip
========================= */
const FilterChip = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipActive,
      pressed && { opacity: 0.9 },
    ]}
  >
    <Text style={[styles.chipText, selected && styles.chipTextActive]}>
      {label}
    </Text>
  </Pressable>
);

export default function MyMeetingsScreen() {
  const router = useRouter();

  /* =========================
     State
  ========================= */
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const [meetings, setMeetings] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  /* =========================
     Date helpers (MUST be inside component)
  ========================= */
  const toYmd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fromYmd = (s) => (s ? new Date(`${s}T00:00:00`) : new Date());

  const openStartPicker = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'date';
      input.value = startDate;
      input.onchange = (e) => {
        setStartDate(e.target.value);
        setPage(1);
      };
      input.click();
      return;
    }

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: fromYmd(startDate),
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'dismissed') return;
          if (date) {
            setStartDate(toYmd(date));
            setPage(1);
          }
        },
      });
      return;
    }

    // iOS
    setShowStartPicker(true);
  };

  const openEndPicker = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'date';
      input.value = endDate;
      input.onchange = (e) => {
        setEndDate(e.target.value);
        setPage(1);
      };
      input.click();
      return;
    }

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: fromYmd(endDate),
        mode: 'date',
        onChange: (event, date) => {
          if (event.type === 'dismissed') return;
          if (date) {
            setEndDate(toYmd(date));
            setPage(1);
          }
        },
      });
      return;
    }

    setShowEndPicker(true);
  };

  /* =========================
     Fetch
  ========================= */
  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 5,
        ...(typeFilter !== 'all' && { meeting_type_filter: typeFilter }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      };

      const response = await usersApi.getMyMeetings(params);
      setMeetings(extractList(response));
      setTotalPages(response?.total_pages || 1);
    } catch (e) {
      console.error(e);
      setError('모임 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, startDate, endDate]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  /* =========================
     Status Filter (Client)
  ========================= */
  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const statusKey = getMeetingStatusKey(meeting);
      return statusFilter === 'all' || statusKey === statusFilter;
    });
  }, [meetings, statusFilter]);

  const hasActiveFilters =
    typeFilter !== 'all' || startDate !== '' || endDate !== '';

  const resetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* =========================
            Filters
        ========================= */}
        <Card style={styles.filterCard}>
          {/* 타입 */}
          <View style={styles.chipRow}>
            {myMeetingsTypeTabs.map(tab => (
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

          {/* 날짜 */}
          {/* 시작일 */}
          <Text style={styles.dateText}>시작일</Text>
          <Pressable style={styles.dateInput} onPress={openStartPicker}>

            <Text style={{ fontSize: tokens.font.sm, color: startDate ? colors.neutral[800] : colors.neutral[400] }}>
              {startDate || 'YYYY-MM-DD'}
            </Text>
          </Pressable>

          {/* 종료일 */}
          <Text style={styles.dateText}>종료일</Text>
          <Pressable style={styles.dateInput} onPress={openEndPicker}>
            <Text style={{ fontSize: tokens.font.sm, color: endDate ? colors.neutral[800] : colors.neutral[400] }}>
              {endDate || 'YYYY-MM-DD'}
            </Text>
          </Pressable>

          {Platform.OS === 'ios' && showStartPicker && (
            <DateTimePicker
              value={fromYmd(startDate)}
              mode="date"
              onChange={(e, d) => {
                if (d) {
                  setStartDate(toYmd(d));
                  setPage(1);
                }
              }}
            />
          )}

          {Platform.OS === 'ios' && showEndPicker && (
            <DateTimePicker
              value={fromYmd(endDate)}
              mode="date"
              onChange={(e, d) => {
                if (d) {
                  setEndDate(toYmd(d));
                  setPage(1);
                }
              }}
            />
          )}

          {hasActiveFilters && (
            <Pressable style={styles.resetButton} onPress={resetFilters}>
              <Text style={styles.resetButtonText}>필터 초기화</Text>
            </Pressable>
          )}
        </Card>

        {/* =========================
            States
        ========================= */}
        {loading && (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.stateText}>모임을 불러오는 중...</Text>
          </View>
        )}

        {!loading && error && (
          <Card>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {!loading && !error && filteredMeetings.length === 0 && (
          <Card style={styles.emptyCard}>
            <FontAwesome5
              name="golf-ball"
              size={28}
              color={colors.neutral[400]}
            />
            <Text style={styles.emptyTitle}>참가한 모임이 없습니다.</Text>
            <Text style={styles.emptySubtitle}>
              모임에 참가하면 여기에 표시됩니다.
            </Text>
          </Card>
        )}

        {/* =========================
            Meeting Cards
        ========================= */}
        {!loading && !error && filteredMeetings.map((meeting, index) => {
          const meetingType = meeting?.meeting_type || 'ROUND';
          const type = myMeetingsTypeConfig[meetingType];
          const statusKey = getMeetingStatusKey(meeting);
          const status = myMeetingsStatusConfig[statusKey];
          const role = myMeetingsRoleConfig[meeting?.role || 'PARTICIPANT'];
          const meetingId = meeting?.id;
          const slug = meetingType === 'ROUND' ? 'rounding' : 'social';

          return (
            <Card key={meetingId || index} style={styles.meetingCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {meeting?.meeting_name || meeting?.title}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: type.bg }]}>
                    <Text style={[styles.badgeText, { color: type.color }]}>
                      {type.label}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.badgeText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.cardSubtitle}>
                {meeting?.club_name || '-'}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="calendar-alt" size={12} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>
                    {formatMeetingTimeShort(meeting?.meeting_time)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>
                    {meeting?.location || '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="users" size={12} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>
                    {meeting?.participant_count ?? 0}명 참여
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: role.bg }]}>
                  <Text style={[styles.badgeText, { color: role.color }]}>
                    {role.label}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.detailButton}
                onPress={() =>
                  router.push(`/meetings/${slug}/${meetingId}`)
                }
              >
                <Text style={styles.detailButtonText}>상세 보기</Text>
              </Pressable>
            </Card>
          );
        })}

        {/* =========================
            Pagination
        ========================= */}
        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <Pressable
              onPress={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>이전</Text>
            </Pressable>

            <Text style={styles.paginationText}>
              {page} / {totalPages}
            </Text>

            <Pressable
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>다음</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  filterCard: {
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: { ...base.sectionTitleSm, marginBottom: tokens.spacing.sm },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: tokens.spacing.sm2,
  },
  chip: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.neutral[100],
    marginRight: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
  },
  chipText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.white,
  },

  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: tokens.spacing.sm2,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingVertical: tokens.padding.base,
    paddingHorizontal: tokens.padding.sm,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
  },

  resetButton: {
    marginTop: tokens.spacing.xxs,
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  resetButtonText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },

  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: tokens.padding.md,
  },
  stateText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  errorText: base.textSmError,

  emptyCard: {
    alignItems: 'center',
    paddingVertical: tokens.padding.xxl,
    gap: 8,
  },
  emptyTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[800],
    marginTop: tokens.spacing.xs,
  },
  emptySubtitle: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },

  meetingCard: {
    marginBottom: tokens.spacing.md,
  },
  cardHeader: base.rowBetween,
  cardTitle: {
    ...base.cardTitle,
    flex: 1,
    marginRight: tokens.spacing.xs2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.md,
  },
  badgeText: {
    fontSize: tokens.font.xxs,
    fontWeight: tokens.fontWeight.semibold,
  },

  cardSubtitle: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xs,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.xs2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
  },

  detailButton: {
    marginTop: tokens.spacing.sm2,
    backgroundColor: colors.primary[600],
    paddingVertical: tokens.padding.base,
    borderRadius: tokens.radius.base,
    alignItems: 'center',
  },
  detailButtonText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.white,
  },

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: tokens.spacing.xs2,
  },
  pageButton: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
  },
  paginationText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
});