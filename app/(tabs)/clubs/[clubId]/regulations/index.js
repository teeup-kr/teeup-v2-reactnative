import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/clubsApi';
import { extractList } from '@/lib/responseUtils';
import { colors } from '@/theme/colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClubRegulationsScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [regulations, setRegulations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRegulations = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubRegulations(resolvedId, { page: 1, limit: 50 });
        const list = extractList(response);
        const normalized = list.map((item) => ({
          id: item?.id || item?.regulation_id || item?.title,
          title: item?.title || '규정',
          updated: item?.updated_at
            ? item.updated_at.slice(0, 10)
            : item?.created_at
              ? item.created_at.slice(0, 10)
              : '-',
        }));
        setRegulations(normalized);
      } catch (fetchError) {
        console.error('클럽 규정 조회 실패:', fetchError);
        setError(fetchError?.message || '규정을 불러오는데 실패했습니다.');
        setRegulations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadRegulations();
  }, [resolvedId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 규정" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>클럽 운영 규정을 확인하세요.</Text>
          <Button variant="primary" size="sm" onPress={() => router.push(`/clubs/${clubId}/regulations/create`)}>
            규정 작성
          </Button>
        </View>

        <Card style={styles.listCard}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>규정을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : regulations.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 규정이 없습니다.</Text>
            </View>
          ) : (
            regulations.map((item) => (
              <Pressable
                key={item.id}
                style={styles.listRow}
                onPress={() => router.push(`/clubs/${resolvedId || clubId}/regulations/${item.id}`)}
              >
                <View style={styles.listIcon}>
                  <FontAwesome5 name="file-alt" size={14} color={colors.primary[600]} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listDate}>업데이트: {item.updated}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
              </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[600],
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
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  listDate: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
});
