import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenHeader from '../../../../../src/components/ui/ScreenHeader';
import Card from '../../../../../src/components/ui/Card';
import { colors } from '../../../../../src/theme/colors';
import { clubsApi } from '../../../../../src/lib/clubsApi';

export default function ClubRegulationDetailScreen() {
  const router = useRouter();
  const { clubId, regulationId } = useLocalSearchParams();
  const resolvedClubId = Array.isArray(clubId) ? clubId[0] : clubId;
  const resolvedRegulationId = Array.isArray(regulationId) ? regulationId[0] : regulationId;
  const [regulation, setRegulation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRegulation = async () => {
      if (!resolvedClubId || !resolvedRegulationId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubRegulation(resolvedClubId, resolvedRegulationId);
        const data = response?.data || response || null;
        setRegulation(data);
      } catch (fetchError) {
        console.error('클럽 규정 상세 조회 실패:', fetchError);
        setError(fetchError?.message || '규정을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRegulation();
  }, [resolvedClubId, resolvedRegulationId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="규정 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>규정을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <Text style={styles.title}>{regulation?.title || '규정'}</Text>
              <Text style={styles.meta}>
                마지막 업데이트{' '}
                {regulation?.updated_at
                  ? regulation.updated_at.slice(0, 10)
                  : regulation?.created_at
                    ? regulation.created_at.slice(0, 10)
                    : '-'}
              </Text>
              <Text style={styles.body}>{regulation?.content || '등록된 내용이 없습니다.'}</Text>
            </>
          )}
        </Card>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/clubs/${resolvedClubId || clubId}/regulations/create`)}
        >
          <Text style={styles.editButtonText}>수정하기</Text>
        </Pressable>
        <Text style={styles.helperText}>규정 수정 화면은 동일한 작성 화면으로 연결됩니다.</Text>
        <Text style={styles.helperText}>Regulation ID: {resolvedRegulationId || regulationId}</Text>
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
    marginBottom: 6,
  },
  meta: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  body: {
    fontSize: 12,
    color: colors.neutral[700],
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
  editButton: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  helperText: {
    marginTop: 8,
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
