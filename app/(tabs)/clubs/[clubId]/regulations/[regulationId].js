
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView, StyleSheet, Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import {
    createFetchRegulationDetailHandler,
    createRegulationEditHandler,
} from '@/lib/handler/clubs';
import { getRegulationUpdatedDate } from '@/lib/util/clubUtils';
import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export default function ClubRegulationDetailScreen() {
  const router = useRouter();
  const { clubId, regulationId } = useLocalSearchParams();
  const resolvedClubId = Array.isArray(clubId) ? clubId[0] : clubId;
  const resolvedRegulationId = Array.isArray(regulationId) ? regulationId[0] : regulationId;
  const [regulation, setRegulation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRegulation = useMemo(
    () =>
      createFetchRegulationDetailHandler({
        clubId: resolvedClubId,
        regulationId: resolvedRegulationId,
        fetchClubRegulation: clubsApi.getClubRegulation,
        extractData,
        setRegulation,
        setIsLoading,
        setError,
      }),
    [resolvedClubId, resolvedRegulationId, setRegulation, setIsLoading, setError]
  );

  useEffect(() => {
    loadRegulation();
  }, [loadRegulation]);

  const updatedDate = useMemo(
    () => getRegulationUpdatedDate(regulation),
    [regulation]
  );

  const handleEditPress = useMemo(
    () =>
      createRegulationEditHandler({
        router,
        clubId: resolvedClubId || clubId,
      }),
    [router, resolvedClubId, clubId]
  );

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
              <Text style={styles.meta}>마지막 업데이트 {updatedDate}</Text>
              <Text style={styles.body}>{regulation?.content || '등록된 내용이 없습니다.'}</Text>
            </>
          )}
        </Card>

        <Pressable style={styles.editButton} onPress={handleEditPress}>
          <Text style={styles.editButtonText}>수정하기</Text>
        </Pressable>
        <Text style={styles.helperText}>규정 수정 화면은 동일한 작성 화면으로 연결됩니다.</Text>
        <Text style={styles.helperText}>Regulation ID: {resolvedRegulationId || regulationId}</Text>
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
    marginBottom: tokens.spacing.xs,
  },
  meta: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginBottom: tokens.spacing.sm2,
  },
  body: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
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
  editButton: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: tokens.padding.base,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[700],
  },
  helperText: {
    marginTop: tokens.spacing.xs2,
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
