import {
FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect,
useState } from 'react';
import { Pressable,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { noticeCategoryLabel } from '@/constants/noticesConstants';
import { noticesApi } from '@/lib/api';
import { normalizeNotice } from '@/lib/noticeUtils';
import { extractList } from '@/lib/responseUtils';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/notices/index';

export default function NoticeListScreen() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNotices = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await noticesApi.getNotices({ page: 1, size: 10, is_published: true });
        const list = extractList(response);
        const normalized = list.map(normalizeNotice);
        setNotices(normalized);
      } catch (apiError) {
        setError(apiError?.message || '공지사항을 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotices();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="공지사항" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>티업링크의 새로운 소식을 확인하세요.</Text>
        {isLoading ? (
          <Card style={styles.loadingCard}>
            <Text style={styles.loadingText}>공지사항을 불러오는 중입니다...</Text>
          </Card>
        ) : error ? (
          <Card style={styles.loadingCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : notices.length === 0 ? (
          <Card style={styles.loadingCard}>
            <Text style={styles.loadingText}>등록된 공지사항이 없습니다.</Text>
          </Card>
        ) : (
          notices.map((notice) => (
            <Pressable
              key={notice.id}
              style={({ pressed }) => [styles.noticeCard, pressed && styles.noticeCardPressed]}
              onPress={() => router.push(`/notices/${notice.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{noticeCategoryLabel[notice.category] || notice.category}</Text>
                </View>
                {notice.important ? (
                  <View style={styles.importantBadge}>
                    <FontAwesome5 name="exclamation-circle" size={10} color={colors.error[600]} />
                    <Text style={styles.importantText}>중요</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeSummary}>{notice.summary}</Text>
              <Text style={styles.noticeDate}>{notice.date}</Text>
            </Pressable>
          ))
        )}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>문의가 필요하신가요?</Text>
          <Text style={styles.infoText}>FAQ에서 답을 찾거나 고객센터로 문의해주세요.</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

