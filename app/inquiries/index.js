import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { inquiriesApi } from '@/lib/api/api';
import { navigateWithCap } from '@/lib/navigation/cappedHistory';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const INQUIRY_TYPE_LABEL = {
  GENERAL: '일반 문의',
  TECHNICAL: '기술 문의',
  BILLING: '결제/청구 문의',
  FEATURE_REQUEST: '기능 요청',
  BUG_REPORT: '버그 신고',
  ACCOUNT: '계정 문의',
  PAYMENT: '결제 문의',
};

const STATUS_LABEL = {
  PENDING: '대기중',
  SUBMITTED: '접수됨',
  IN_PROGRESS: '처리중',
  RESOLVED: '해결됨',
  COMPLETED: '완료',
  CLOSED: '종료',
};

function formatDate(value) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InquiryListScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [list, setList] = useState([]);
  const [page] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const size = 20;

  useEffect(() => {
    if (!isAuthenticated) {
        setIsLoading(false);
      return;
    }
    const load = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await inquiriesApi.getMyInquiries({ page, size });
        const inquiries = extractList(response);
        setList(Array.isArray(inquiries) ? inquiries : []);
      } catch (e) {
        setError(e?.message || '문의 목록을 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isAuthenticated, page]);

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="1:1 문의" />
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginRequired
        message="로그인 후 이용 가능합니다"
        description="1:1 문의를 보려면 로그인이 필요합니다."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="1:1 문의" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>등록한 문의를 확인하고 답변을 받아보세요.</Text>

        <Button
          style={styles.createButton}
          onPress={() => navigateWithCap(router, '/inquiries/create')}
        >
          <FontAwesome5 name="plus" size={14} color={colors.white} />
          <Text style={styles.createButtonText}>문의하기</Text>
        </Button>

        {isLoading ? (
          <Card style={styles.card}>
            <Text style={styles.loadingText}>문의 목록을 불러오는 중입니다...</Text>
          </Card>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : list.length === 0 ? (
          <Card style={styles.card}>
            <FontAwesome5 name="inbox" size={40} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>등록한 문의가 없습니다</Text>
            <Text style={styles.emptySub}>문의하기 버튼으로 질문을 남겨주세요.</Text>
          </Card>
        ) : (
          list.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.itemCard, pressed && styles.itemCardPressed]}
              onPress={() => navigateWithCap(router, `/inquiries/${item.id}`)}
            >
              <View style={styles.itemHeader}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {INQUIRY_TYPE_LABEL[item.type] || item.type}
                  </Text>
                </View>
                <Text style={styles.statusText}>{STATUS_LABEL[item.status] || item.status}</Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemDate}>{formatDate(item.created_at)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...base.textSmMuted,
    marginBottom: tokens.spacing.sm2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primary[600],
    marginBottom: tokens.spacing.md,
  },
  createButtonPressed: {
    opacity: 0.9,
  },
  createButtonText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.white,
  },
  card: {
    marginBottom: tokens.spacing.sm2,
    alignItems: 'center',
    paddingVertical: tokens.padding.lg,
  },
  loadingText: base.textSmSubtle,
  errorText: base.textSmError,
  emptyTitle: {
    marginTop: tokens.spacing.sm,
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[700],
  },
  emptySub: {
    marginTop: tokens.spacing.xs,
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    padding: tokens.padding.md,
    marginBottom: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  itemCardPressed: {
    backgroundColor: colors.neutral[50],
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primary[50],
  },
  typeBadgeText: {
    fontSize: tokens.font.xs,
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  statusText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  itemTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  itemDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
  },
});
