import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import { createFetchClubApplicationHandler } from '@/lib/render/clubs';
import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';



export default function ClubApplicationDetailScreen() {
  const { applicationId } = useLocalSearchParams();
  const resolvedId = Array.isArray(applicationId) ? applicationId[0] : applicationId;
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadApplication = useMemo(
    () =>
      createFetchClubApplicationHandler({
        applicationId: resolvedId,
        fetchClubApplication: clubsApi.getClubApplication,
        extractData,
        setApplication,
        setIsLoading,
        setError,
      }),
    [resolvedId, setApplication, setIsLoading, setError]
  );

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

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
            {application?.description ||
              application?.additional_info ||
              '등록된 신청 내용이 없습니다.'}
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
    color: colors.neutral[900],
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
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
  },
  sectionTitle: { ...base.sectionTitleMd, marginBottom: tokens.spacing.xs2 },
  sectionText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateText: {
    marginLeft: tokens.spacing.xs2,
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  errorText: base.textSmError,
});
