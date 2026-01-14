import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/Card';
import { asNumber } from '@/lib/value/mypageRecords';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

export default function RoundingStatsCard({ stats, isLoading, error }) {
  if (isLoading) {
    return (
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={[styles.statCard, styles.statCardSkeleton]} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <Card style={styles.statsErrorCard}>
        <Text style={styles.statsErrorText}>통계 정보를 불러오는데 실패했습니다.</Text>
      </Card>
    );
  }

  const totalGames = asNumber(stats?.total_games, 0);
  if (!stats || totalGames === 0) {
    return (
      <Card style={styles.statsEmptyCard}>
        <Text style={styles.statsEmptyText}>아직 기록된 라운딩이 없습니다.</Text>
      </Card>
    );
  }

  const cards = [
    {
      id: 'total',
      label: '총 경기 수',
      value: `${asNumber(stats?.total_games, 0)}`,
      unit: '경기',
      icon: 'history',
      color: colors.primary?.[700] ?? colors.primary[600],
      bg: colors.primary?.[50] ?? colors.neutral[50],
      border: colors.primary?.[200] ?? colors.neutral[200],
    },
    {
      id: 'average',
      label: '평균 스코어',
      value:
        stats?.average_score !== null && stats?.average_score !== undefined
          ? asNumber(stats?.average_score, 0).toFixed(1)
          : '-',
      unit: '',
      icon: 'chart-line',
      color: colors.neutral[800],
      bg: colors.neutral[50],
      border: colors.neutral[200],
    },
    {
      id: 'recent5',
      label: '최근 5경기 평균',
      value:
        stats?.recent_5_avg !== null && stats?.recent_5_avg !== undefined
          ? asNumber(stats?.recent_5_avg, 0).toFixed(1)
          : '-',
      unit: '',
      icon: 'trophy',
      color: colors.neutral[800],
      bg: colors.neutral[50],
      border: colors.neutral[200],
    },
    {
      id: 'best-worst',
      label: '최고/최저',
      value:
        stats?.best_score !== null &&
          stats?.best_score !== undefined &&
          stats?.worst_score !== null &&
          stats?.worst_score !== undefined
          ? `${stats.best_score} / ${stats.worst_score}`
          : '-',
      unit: '',
      icon: 'medal',
      color: colors.neutral[800],
      bg: colors.neutral[50],
      border: colors.neutral[200],
    },
  ];

  return (
    <View style={styles.statsGrid}>
      {cards.map((card) => (
        <View
          key={card.id}
          style={[
            styles.statCard,
            { backgroundColor: card.bg, borderColor: card.border },
          ]}
        >
          <View style={styles.statHeaderRow}>
            <FontAwesome5 name={card.icon} size={12} color={card.color} />
            <Text style={styles.statLabel}>{card.label}</Text>
          </View>
          <View style={styles.statValueRow}>
            <Text style={[styles.statValue, { color: card.color }]}>
              {card.value}
            </Text>
            {!!card.unit && <Text style={styles.statUnit}>{card.unit}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: tokens.spacing.md2,
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: tokens.radius.baseLg,
    padding: tokens.padding.sm,
  },
  statCardSkeleton: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
    height: 88,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: tokens.spacing.sm,
  },
  statLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statValue: {
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.extrabold,
  },
  statUnit: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  statsErrorCard: {
    marginBottom: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
  },
  statsErrorText: {
    fontSize: tokens.font.sm,
    color: colors.error[700],
  },
  statsEmptyCard: {
    marginBottom: tokens.spacing.sm2,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    paddingVertical: tokens.padding.lg2,
  },
  statsEmptyText: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
});
