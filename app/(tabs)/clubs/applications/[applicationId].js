import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/clubsApi';
import { extractData } from '@/lib/responseUtils';
import { colors } from '@/theme/colors';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
              <ActivityIndicator size="small" color={colors.primary[600]} />
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: 12,
    color: colors.neutral[800],
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});
