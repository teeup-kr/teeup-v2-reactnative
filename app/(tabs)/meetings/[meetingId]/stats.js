import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '../../../../src/components/ui/ScreenHeader';
import Card from '../../../../src/components/ui/Card';
import { colors } from '../../../../src/theme/colors';
import { roundsApi } from '../../../../src/lib/api';

export default function MeetingStatsScreen() {
  const { meetingId } = useLocalSearchParams();
  const resolvedId = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const [meetingResponse, participantsResponse] = await Promise.all([
          roundsApi.getRound(resolvedId),
          roundsApi.getRoundParticipants(resolvedId),
        ]);
        const meetingData = meetingResponse?.data || meetingResponse || null;
        const participantList = Array.isArray(participantsResponse?.data)
          ? participantsResponse.data
          : Array.isArray(participantsResponse)
            ? participantsResponse
            : participantsResponse?.items || [];
        setMeeting(meetingData);
        setParticipants(Array.isArray(participantList) ? participantList : []);
      } catch (fetchError) {
        console.error('모임 통계 조회 실패:', fetchError);
        setError(fetchError?.message || '모임 통계를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [resolvedId]);

  const stats = useMemo(() => {
    const participantCount = participants.length;
    const scoreValues = participants
      .map((participant) => {
        const score = participant?.score ?? participant?.total_score ?? participant?.average_score;
        return score !== undefined && score !== null ? Number(score) : null;
      })
      .filter((value) => Number.isFinite(value));
    const average = scoreValues.length
      ? (scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length).toFixed(1)
      : meeting?.average_score ?? '-';
    const best = scoreValues.length
      ? Math.min(...scoreValues)
      : meeting?.best_score ?? '-';

    return [
      { id: 'participants', label: '참가자', value: `${participantCount}명` },
      { id: 'average', label: '평균 타수', value: average },
      { id: 'best', label: '베스트 스코어', value: best },
    ];
  }, [meeting, participants]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="모임 통계" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>모임 통계 요약</Text>
          <Text style={styles.summaryHint}>모임 ID: {resolvedId || meetingId}</Text>
        </Card>

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
          <Text style={styles.chartTitle}>스코어 분포</Text>
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
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  summaryHint: {
    fontSize: 11,
    color: colors.neutral[500],
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
    marginTop: 4,
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
