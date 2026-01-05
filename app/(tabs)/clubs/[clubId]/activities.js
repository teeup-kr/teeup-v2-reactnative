import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '../../../../src/components/ui/ScreenHeader';
import Card from '../../../../src/components/ui/Card';
import { colors } from '../../../../src/theme/colors';
import { clubsApi } from '../../../../src/lib/clubsApi';

export default function ClubActivitiesScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadActivities = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubActivities(resolvedId, { page: 1, limit: 50 });
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : response?.items || [];
        setActivities(Array.isArray(list) ? list : []);
      } catch (fetchError) {
        console.error('클럽 활동 내역 조회 실패:', fetchError);
        setError(fetchError?.message || '활동 내역을 불러오는데 실패했습니다.');
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [resolvedId]);

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
          ) : activities.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 활동 내역이 없습니다.</Text>
            </View>
          ) : (
            activities.map((item) => (
              <View key={item?.id || item?.activity_id || item?.title} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item?.title || '활동'}</Text>
                  <Text style={styles.itemDetail}>{item?.description || item?.detail || '-'}</Text>
                </View>
                <Text style={styles.itemDate}>
                  {item?.date
                    ? String(item.date).slice(0, 10)
                    : item?.created_at
                      ? item.created_at.slice(0, 10)
                      : '-'}
                </Text>
              </View>
            ))
          )}
        </Card>
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
  listCard: {
    paddingVertical: 4,
  },
  stateRow: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
  itemRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  itemInfo: {
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  itemDetail: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  itemDate: {
    fontSize: 11,
    color: colors.neutral[400],
  },
});
