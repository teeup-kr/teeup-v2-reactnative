
import {
useLocalSearchParams } from 'expo-router';
import { useEffect,
useState } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { noticeCategoryLabel } from '@/constants/noticesConstants';
import { noticesApi } from '@/lib/api';
import { normalizeNotice } from '@/lib/noticeUtils';
import { base, tokens } from '@/styles/style';
import { colors } from '@/theme/colors';
export default function NoticeDetailScreen() {
  const { noticeId } = useLocalSearchParams();
  const resolvedId = Array.isArray(noticeId) ? noticeId[0] : noticeId;
  const [notice, setNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNotice = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await noticesApi.getNotice(resolvedId);
        const normalized = normalizeNotice(response);
        setNotice(normalized);
      } catch (apiError) {
        setError(apiError?.message || '공지사항을 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotice();
  }, [resolvedId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="공지사항 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          {isLoading ? (
            <Text style={styles.loadingText}>공지사항을 불러오는 중입니다...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : notice ? (
            <>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{noticeCategoryLabel[notice.category] || notice.category}</Text>
                </View>
                {notice.important ? <Text style={styles.importantText}>중요 공지</Text> : null}
              </View>
              <Text style={styles.title}>{notice.title}</Text>
              <Text style={styles.date}>{notice.date}</Text>
              <Text style={styles.content}>{notice.content}</Text>
            </>
          ) : (
            <Text style={styles.loadingText}>공지사항을 찾을 수 없습니다.</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  card: {
    padding: tokens.padding.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  badge: {
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primary[50],
  },
  badgeText: {
    fontSize: tokens.font.xs,
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  importantText: {
    marginLeft: tokens.spacing.xs2,
    fontSize: tokens.font.xs,
    color: colors.error[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  title: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  date: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
    marginBottom: tokens.spacing.md,
  },
  content: {
    fontSize: tokens.font.md,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  loadingText: base.textSmSubtle,
  errorText: base.textSmError,
});