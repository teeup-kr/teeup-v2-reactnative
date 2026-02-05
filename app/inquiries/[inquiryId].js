import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { inquiriesApi } from '@/lib/api/api';
import { extractData } from '@/lib/util/responseUtils';
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

export default function InquiryDetailScreen() {
  const { inquiryId } = useLocalSearchParams();
  const resolvedId = Array.isArray(inquiryId) ? inquiryId[0] : inquiryId;
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await inquiriesApi.getInquiry(resolvedId);
        const parsed = extractData(response) || response;
        setData(parsed);
      } catch (e) {
        setError(e?.message || '문의를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [resolvedId]);

  const inquiry = data?.inquiry ?? null;
  const responses = Array.isArray(data?.responses) ? data.responses : [];
  const publicResponses = responses.filter((r) => !r.is_internal);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="문의 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <Card style={styles.card}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.loadingText}>문의를 불러오는 중입니다...</Text>
          </Card>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : inquiry ? (
          <>
            <Card style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {INQUIRY_TYPE_LABEL[inquiry.type] || inquiry.type}
                  </Text>
                </View>
                <Text style={styles.statusText}>{STATUS_LABEL[inquiry.status] || inquiry.status}</Text>
              </View>
              <Text style={styles.title}>{inquiry.title}</Text>
              <Text style={styles.date}>{formatDate(inquiry.created_at)}</Text>
              <Text style={styles.content}>{inquiry.content}</Text>
            </Card>

            {publicResponses.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>답변 ({publicResponses.length})</Text>
                {publicResponses.map((r) => (
                  <Card key={r.id} style={styles.responseCard}>
                    <View style={styles.responseHeader}>
                      <Text style={styles.responseAuthor}>{r.admin_name || '관리자'}</Text>
                      <Text style={styles.responseDate}>{formatDate(r.created_at)}</Text>
                    </View>
                    <Text style={styles.responseContent}>{r.content}</Text>
                  </Card>
                ))}
              </View>
            ) : (
              <Card style={styles.card}>
                <View style={styles.emptyResponse}>
                  <FontAwesome5 name="comment-dots" size={24} color={colors.neutral[300]} />
                  <Text style={styles.emptyResponseText}>아직 답변이 없습니다.</Text>
                  <Text style={styles.emptyResponseSub}>답변 등록 시 알림으로 안내해 드립니다.</Text>
                </View>
              </Card>
            )}
          </>
        ) : (
          <Card style={styles.card}>
            <Text style={styles.loadingText}>문의를 찾을 수 없습니다.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  card: {
    marginBottom: tokens.spacing.md,
  },
  loadingText: {
    ...base.textSmSubtle,
    marginTop: tokens.spacing.sm,
  },
  errorText: base.textSmError,
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
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
  title: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  date: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
    marginBottom: tokens.spacing.sm,
  },
  content: {
    fontSize: tokens.font.base,
    color: colors.neutral[800],
    lineHeight: 22,
  },
  section: {
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm,
  },
  responseCard: {
    marginBottom: tokens.spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[400],
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  responseAuthor: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
  },
  responseDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
  },
  responseContent: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    lineHeight: 20,
  },
  emptyResponse: {
    alignItems: 'center',
    paddingVertical: tokens.padding.lg,
  },
  emptyResponseText: {
    marginTop: tokens.spacing.sm,
    fontSize: tokens.font.base,
    color: colors.neutral[600],
  },
  emptyResponseSub: {
    marginTop: tokens.spacing.xs,
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
});
