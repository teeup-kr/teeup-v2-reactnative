import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Card from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { noticeCategoryLabel } from './noticeData';
import { noticesApi } from '../../lib/api';

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
        const list = response?.notices || response?.value || response?.data || response?.items || [];
        const normalized = Array.isArray(list) ? list.map(normalizeNotice) : [];
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

const normalizeNotice = (notice) => ({
  id: notice?.id || notice?.notice_id || notice?.title,
  title: notice?.title || '공지사항',
  summary: notice?.summary || notice?.content || '',
  content: notice?.content || '',
  category: notice?.type || notice?.category || 'GENERAL',
  date: notice?.created_at ? notice.created_at.slice(0, 10) : notice?.date || '',
  important: notice?.is_important || notice?.important || false,
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 12,
  },
  noticeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  noticeCardPressed: {
    backgroundColor: colors.neutral[100],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: '600',
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.error[50],
  },
  importantText: {
    fontSize: 11,
    color: colors.error[600],
    marginLeft: 4,
    fontWeight: '600',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  noticeSummary: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 8,
  },
  noticeDate: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  infoCard: {
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  loadingCard: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});
