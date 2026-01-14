
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

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/clubsApi';
import { extractList } from '@/lib/responseUtils';
import { base, tokens } from '@/styles/style';

export default function ClubActivitiesScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadActivities = async () => {
      setError('');
      if (!resolvedId) {
        setActivities([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await clubsApi.getClubActivities(resolvedId, { page: 1, limit: 50 });
        const list = extractList(response);
        setActivities(list);
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
              <ActivityIndicator size="small" color={tokens.colors.primary[600]} />
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
            activities.map((item, index) => {
              const activityKey = item?.id || item?.activity_id || item?.title || `activity-${index}`;
              const title = item?.title || '활동';
              const detail = item?.description || item?.detail || '-';
              let activityDate = '-';

              if (item?.date) {
                activityDate = String(item.date).slice(0, 10);
              } else if (item?.created_at) {
                activityDate = item.created_at.slice(0, 10);
              }

              return (
                <View key={activityKey} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{title}</Text>
                    <Text style={styles.itemDetail}>{detail}</Text>
                  </View>
                  <Text style={styles.itemDate}>{activityDate}</Text>
                </View>
              );
            })
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
    borderBottomColor: tokens.colors.neutral[100],
  },
  itemInfo: {
    marginBottom: tokens.spacing.xs,
  },
  itemTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.neutral[800],
  },
  itemDetail: {
    fontSize: tokens.font.xs,
    color: tokens.colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  itemDate: {
    fontSize: tokens.font.xs,
    color: tokens.colors.neutral[400],
  },
});
