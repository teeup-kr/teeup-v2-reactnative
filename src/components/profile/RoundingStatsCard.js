import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

const statCards = (stats) => [
  {
    id: 'total',
    label: '총 경기 수',
    value: stats?.total_games ?? 0,
    unit: '경기',
    icon: 'history',
    color: colors.info[600],
    border: colors.info[500],
    background: colors.info[50],
  },
  {
    id: 'average',
    label: '평균 스코어',
    value: stats?.average_score ? stats.average_score.toFixed(1) : '-',
    unit: '',
    icon: 'chart-line',
    color: colors.success[600],
    border: colors.success[500],
    background: colors.success[50],
  },
  {
    id: 'recent5',
    label: '최근 5경기 평균',
    value: stats?.recent_5_avg ? stats.recent_5_avg.toFixed(1) : '-',
    unit: '',
    icon: 'trophy',
    color: colors.accent[600],
    border: colors.accent[100],
    background: colors.accent[50],
  },
  {
    id: 'best-worst',
    label: '최고/최저',
    value:
      stats?.best_score && stats?.worst_score
        ? `${stats.best_score} / ${stats.worst_score}`
        : '-',
    unit: '',
    icon: 'medal',
    color: colors.secondary[600],
    border: colors.secondary[100],
    background: colors.secondary[50],
  },
];

export default function RoundingStatsCard({ stats, isLoading, error }) {
  if (isLoading) {
    return (
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.cardBase, styles.skeletonCard]}>
            <View style={styles.skeletonLabel} />
            <View style={styles.skeletonValue} />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.cardBase, styles.errorCard]}>
        <Text style={styles.errorText}>통계 정보를 불러오는데 실패했습니다.</Text>
      </View>
    );
  }

  if (!stats || stats.total_games === 0) {
    return (
      <View style={[styles.cardBase, styles.emptyCard]}>
        <Text style={styles.emptyText}>아직 기록된 라운딩이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {statCards(stats).map((card) => (
        <View
          key={card.id}
          style={[
            styles.cardBase,
            {
              borderColor: card.border,
              backgroundColor: card.background,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: colors.white }]}
            >
              <FontAwesome5 name={card.icon} size={12} color={card.color} />
            </View>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
          <View style={styles.cardValueRow}>
            <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
            {card.unit ? <Text style={styles.cardUnit}>{card.unit}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cardBase: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  cardValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardUnit: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  skeletonCard: {
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[100],
  },
  skeletonLabel: {
    width: 72,
    height: 10,
    borderRadius: 6,
    backgroundColor: colors.neutral[200],
    marginBottom: 8,
  },
  skeletonValue: {
    width: 40,
    height: 16,
    borderRadius: 6,
    backgroundColor: colors.neutral[200],
  },
  errorCard: {
    borderColor: colors.error[500],
    backgroundColor: colors.error[50],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
  emptyCard: {
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
});
