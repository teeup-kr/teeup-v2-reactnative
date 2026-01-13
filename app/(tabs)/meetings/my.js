import {
FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect,
useMemo,
useState } from 'react';
import { ActivityIndicator,
Pressable,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginRequired from '@/components/auth/LoginRequired';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { usersApi } from '@/lib/api';
import { extractList, formatMeetingListDate } from '@/lib/meetingUtils';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/tabs/meetings/my';

export default function MyMeetingsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadMeetings = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await usersApi.getMyMeetings({ page: 1, limit: 20 });
        const list = extractList(response);
        setMeetings(list);
      } catch (fetchError) {
        console.error('내 모임 조회 실패:', fetchError);
        setError(fetchError?.message || '모임을 불러오는데 실패했습니다.');
        setMeetings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetings();
  }, [isAuthenticated]);

  const normalizedMeetings = useMemo(() => (
    meetings.map((meeting) => {
      const meetingType = meeting?.meeting_type || meeting?.type || 'ROUND';
      const typeSlug = meetingType === 'ROUND' || meetingType === 'ROUNDING' ? 'rounding' : 'social';
      return {
        id: meeting?.id || meeting?.meeting_id,
        name: meeting?.meeting_name || meeting?.title || '모임',
        type: typeSlug,
        date: formatMeetingListDate(meeting?.meeting_time || meeting?.date),
        status: meeting?.status || meeting?.application_status || '-',
      };
    })
  ), [meetings]);

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

