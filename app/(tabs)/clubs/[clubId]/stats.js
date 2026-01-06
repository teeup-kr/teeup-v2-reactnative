import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '../../../../src/components/ui/ScreenHeader';
import Card from '../../../../src/components/ui/Card';
import { colors } from '../../../../src/theme/colors';
import { clubsApi } from '../../../../src/lib/clubsApi';
import { extractData } from '../../../../src/lib/responseUtils';

export default function ClubStatsScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      setError('');
      if (!resolvedId) {
        setStatsData(null);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await clubsApi.getClubStats(resolvedId);
        const data = extractData(response);
        setStatsData(data);
      } catch (fetchError) {
        console.error('클럽 통계 조회 실패:', fetchError);
        setError(fetchError?.message || '통계를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [resolvedId]);

  const activeMembers = statsData?.active_members ?? statsData?.activeMembers ?? '-';
  const totalMeetings = statsData?.total_meetings ?? statsData?.totalMeetings ?? '-';
  const settlementCompleted = statsData?.settlement_completed ?? statsData?.settlementCompleted ?? '-';

  const stats = [
    {
      id: 'members',
      label: '활성 멤버',
      value: activeMembers,
    },
    {
      id: 'meetings',
      label: '총 모임',
      value: totalMeetings,
    },
    {
      id: 'settlement',
      label: '정산 완료',
      value: settlementCompleted,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 통계" />
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <Card style={styles.stateCard}>
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>통계를 불러오는 중...</Text>
            </View>
          </Card>
        ) : error ? (
          <Card style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : (
          <View style={styles.grid}>
            {stats.map((item) => (
              <Card key={item.id} style={styles.statCard}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
              </Card>
            ))}
          </View>
        )}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>월별 모임 추이</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>차트 영역 (추후 연결)</Text>
          </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  chartCard: {
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  stateCard: {
    marginBottom: 12,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
