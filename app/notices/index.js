
import {
  FontAwesome5
} from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useEffect,
  useState
} from 'react';
import {
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { noticeCategoryLabel } from '@/constants/noticesConstants';
import { noticesApi } from '@/lib/api/api';
import { navigateWithCap } from '@/lib/navigation/cappedHistory';
import { normalizeNotice } from '@/lib/util/noticeUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';


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
              onPress={() => navigateWithCap(router, `/notices/${notice.id}`)}
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
        <Pressable
          style={({ pressed }) => [styles.infoCard, pressed && styles.infoCardPressed]}
          onPress={() => navigateWithCap(router, '/inquiries')}
        >
          <Text style={styles.infoTitle}>문의가 필요하신가요?</Text>
          <Text style={styles.infoText}>FAQ에서 답을 찾거나 1:1 문의를 등록해주세요.</Text>
          <Text style={styles.infoLink}>1:1 문의하기 →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  subtitle: { ...base.textSmMuted, marginBottom: tokens.spacing.sm2 },
  noticeCard: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    padding: tokens.padding.md,
    marginBottom: tokens.spacing.sm2,
  },
  noticeCardPressed: {
    backgroundColor: colors.neutral[100],
  },
  cardHeader: { ...base.row, marginBottom: tokens.spacing.xs2 },
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
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: tokens.spacing.xs2,
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.error[50],
  },
  importantText: {
    fontSize: tokens.font.xs,
    color: colors.error[600],
    marginLeft: tokens.spacing.xxs,
    fontWeight: tokens.fontWeight.semibold,
  },
  noticeTitle: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  noticeSummary: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    marginBottom: tokens.spacing.xs2,
  },
  noticeDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
  },
  infoCard: {
    marginTop: tokens.spacing.xs2,
  },
  infoCardPressed: {
    opacity: 0.9,
  },
  infoLink: {
    marginTop: tokens.spacing.xs,
    fontSize: tokens.font.sm,
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  infoTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  infoText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  loadingCard: {
    marginBottom: tokens.spacing.sm2,
  },
  loadingText: base.textSmSubtle,
  errorText: base.textSmError,
});
