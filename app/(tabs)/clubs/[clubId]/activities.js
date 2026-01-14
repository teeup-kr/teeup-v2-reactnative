import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import { createFetchActivitiesHandler } from '@/lib/handler/clubs';
import { normalizeClubActivities } from '@/lib/util/clubUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';



export default function ClubActivitiesScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadActivities = useMemo(
    () =>
      createFetchActivitiesHandler({
        clubId: resolvedId,
        fetchClubActivities: clubsApi.getClubActivities,
        extractList,
        setActivities,
        setIsLoading,
        setError,
      }),
    [resolvedId, setActivities, setIsLoading, setError]
  );

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const normalizedActivities = useMemo(
    () => normalizeClubActivities(activities),
    [activities]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="활동 내역" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.listCard}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>활동 내역을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : normalizedActivities.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 활동 내역이 없습니다.</Text>
            </View>
          ) : (
            normalizedActivities.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                </View>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  listCard: {
    paddingVertical: tokens.padding.xxs,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  itemRow: {
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  itemInfo: {
    marginBottom: tokens.spacing.xs,
  },
  itemTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  itemDetail: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  itemDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[400],
  },
});
