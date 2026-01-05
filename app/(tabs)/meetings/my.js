import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ScreenHeader from '../../../src/components/ui/ScreenHeader';
import Card from '../../../src/components/ui/Card';
import { colors } from '../../../src/theme/colors';
import { usersApi } from '../../../src/lib/api';

const formatMeetingDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('ko-KR');
};

export default function MyMeetingsScreen() {
  const router = useRouter();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await usersApi.getMyMeetings({ page: 1, limit: 20 });
        const payload = response?.data ? response : { data: response };
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(response?.items)
            ? response.items
            : Array.isArray(response)
              ? response
              : [];
        setMeetings(Array.isArray(list) ? list : []);
      } catch (fetchError) {
        console.error('내 모임 조회 실패:', fetchError);
        setError(fetchError?.message || '모임을 불러오는데 실패했습니다.');
        setMeetings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetings();
  }, []);

  const normalizedMeetings = useMemo(() => (
    meetings.map((meeting) => {
      const meetingType = meeting?.meeting_type || meeting?.type || 'ROUND';
      const typeSlug = meetingType === 'ROUND' || meetingType === 'ROUNDING' ? 'rounding' : 'social';
      return {
        id: meeting?.id || meeting?.meeting_id,
        name: meeting?.meeting_name || meeting?.title || '모임',
        type: typeSlug,
        date: formatMeetingDate(meeting?.meeting_time || meeting?.date),
        status: meeting?.status || meeting?.application_status || '-',
      };
    })
  ), [meetings]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="내 모임" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>현재 참여 모임</Text>
          <Text style={styles.summaryValue}>{normalizedMeetings.length}개</Text>
        </Card>

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
          ) : normalizedMeetings.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>참여 중인 모임이 없습니다.</Text>
            </View>
          ) : (
            normalizedMeetings.map((meeting) => (
              <Pressable
                key={meeting.id}
                style={styles.row}
                onPress={() => router.push(`/meetings/${meeting.type}/${meeting.id}`)}
              >
                <View style={styles.iconWrap}>
                  <FontAwesome5 name="calendar-check" size={14} color={colors.primary[600]} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{meeting.name}</Text>
                  <Text style={styles.date}>{meeting.date}</Text>
                </View>
                <Text style={styles.status}>{meeting.status}</Text>
              </Pressable>
            ))
          )}
        </View>
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
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 6,
  },
  list: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 4,
  },
  stateRow: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  date: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  status: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '600',
  },
});
