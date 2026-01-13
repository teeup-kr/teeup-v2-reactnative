import {
FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect,
useState } from 'react';
import { ActivityIndicator,
Pressable,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/clubsApi';
import { extractList } from '@/lib/responseUtils';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/tabs/clubs/clubId/notices';

export default function ClubNoticesScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNotices = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubNotices(resolvedId, { page: 1, limit: 20 });
        const list = extractList(response);
        const normalized = list.map((notice) => ({
          id: notice?.id || notice?.notice_id || notice?.title,
          title: notice?.title || '공지사항',
          date: notice?.created_at ? notice.created_at.slice(0, 10) : notice?.date || '-',
          pinned: notice?.is_pinned || notice?.is_important || notice?.pinned || false,
        }));
        setNotices(normalized);
      } catch (fetchError) {
        console.error('클럽 공지 조회 실패:', fetchError);
        setError(fetchError?.message || '공지사항을 불러오는데 실패했습니다.');
        setNotices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotices();
  }, [resolvedId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="공지사항" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.noticeCard}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>공지사항을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : notices.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 공지사항이 없습니다.</Text>
            </View>
          ) : (
            notices.map((notice) => (
              <Pressable key={notice.id} style={styles.noticeRow}>
                <View style={styles.noticeIcon}>
                  <FontAwesome5 name="bullhorn" size={14} color={colors.primary[600]} />
                </View>
                <View style={styles.noticeInfo}>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  <Text style={styles.noticeDate}>{notice.date}</Text>
                </View>
                {notice.pinned && (
                  <View style={styles.noticeBadge}>
                    <Text style={styles.noticeBadgeText}>고정</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

