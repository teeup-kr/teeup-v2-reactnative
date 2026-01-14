
import {
useLocalSearchParams } from 'expo-router';
import { useEffect,
useState } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/clubsApi';
import { extractData } from '@/lib/responseUtils';
import { base, tokens } from '@/styles/style';

export default function ClubApplicationDetailScreen() {
  const { applicationId } = useLocalSearchParams();
  const resolvedId = Array.isArray(applicationId) ? applicationId[0] : applicationId;
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadApplication = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubApplication(resolvedId);
        const data = extractData(response);
        setApplication(data);
      } catch (fetchError) {
        console.error('클럽 신청 조회 실패:', fetchError);
        setError(fetchError?.message || '신청 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadApplication();
  }, [resolvedId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="개설 신청 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={tokens.colors.primary[600]} />
              <Text style={styles.stateText}>신청 정보를 불러오는 중...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <Text style={styles.title}>{application?.name || '클럽명 없음'}</Text>
              <Text style={styles.subtitle}>신청 번호: {resolvedId || applicationId}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>상태</Text>
                <Text style={styles.infoValue}>{application?.status || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>신청일</Text>
                <Text style={styles.infoValue}>
                  {application?.created_at ? application.created_at.slice(0, 10) : '-'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>담당자</Text>
                <Text style={styles.infoValue}>{application?.reviewer || '-'}</Text>
              </View>
            </>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>신청 내용</Text>
          <Text style={styles.sectionText}>
            {application?.description || application?.additional_info || '등록된 신청 내용이 없습니다.'}
          </Text>
        </Card>

        <Button variant="outline" size="lg">
          신청 취소
        </Button>
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
  title: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: tokens.colors.neutral[900],
    marginBottom: tokens.spacing.xxs,
  },
  subtitle: { ...base.textSmSubtle, marginBottom: tokens.spacing.sm2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs2,
  },
  infoLabel: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[500],
  },
  infoValue: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
  },
  sectionTitle: { ...base.sectionTitleMd, marginBottom: tokens.spacing.xs2 },
  sectionText: {
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[600],
    lineHeight: 18,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateText: {
    marginLeft: tokens.spacing.xs2,
    fontSize: tokens.font.sm,
    color: tokens.colors.neutral[500],
  },
  errorText: base.textSmError,
});
