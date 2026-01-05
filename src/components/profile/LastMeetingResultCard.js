import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { usersApi } from '../../lib/api';
import { colors } from '../../theme/colors';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const getRankBadge = (rank) => {
  if (rank === 1) {
    return { background: colors.secondary[100], text: colors.secondary[800] };
  }
  if (rank === 2) {
    return { background: colors.neutral[200], text: colors.neutral[800] };
  }
  if (rank === 3) {
    return { background: colors.warning[50], text: colors.warning[700] };
  }
  return { background: colors.info[50], text: colors.info[700] };
};

export default function LastMeetingResultCard({ userId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResult = useCallback(async () => {
    if (!userId) {
      setResult(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getLastMeetingResult(userId);
      const data = response?.data || response || null;
      setResult(data);
    } catch (fetchError) {
      console.error('직전 대회 성적 조회 실패:', fetchError);
      setError('직전 대회 성적을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.centerRow}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            <FontAwesome5 name="trophy" size={14} color={colors.secondary[500]} />{' '}
            직전 대회 성적
          </Text>
        </View>
        <View style={styles.emptyState}>
          <FontAwesome5 name="info-circle" size={28} color={colors.neutral[300]} />
          <Text style={styles.emptyText}>직전 대회 기록이 없습니다.</Text>
          <Text style={styles.emptySubText}>경기를 완료하면 성적이 표시됩니다.</Text>
        </View>
      </View>
    );
  }

  const badge = result.rank ? getRankBadge(result.rank) : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRowBetween}>
        <Text style={styles.headerTitle}>
          <FontAwesome5 name="trophy" size={14} color={colors.secondary[500]} />{' '}
          직전 대회 성적
        </Text>
        {badge && (
          <View style={[styles.rankBadge, { backgroundColor: badge.background }]}
          >
            <FontAwesome5 name="medal" size={12} color={badge.text} />
            <Text style={[styles.rankBadgeText, { color: badge.text }]}
            >
              {result.rank}위
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>모임명</Text>
        <Text style={styles.sectionValue}>{result.meeting_name || '모임명 없음'}</Text>
      </View>

      {result.completed_at && (
        <View style={styles.dateRow}>
          <FontAwesome5 name="calendar-alt" size={12} color={colors.neutral[500]} />
          <Text style={styles.dateText}>{formatDate(result.completed_at)}</Text>
        </View>
      )}

      <View style={styles.scoreGrid}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>
            <FontAwesome5 name="golf-ball" size={10} color={colors.neutral[500]} /> 실제 타수
          </Text>
          <Text style={styles.scoreValue}>{result.gross_score}타</Text>
        </View>
        <View style={[styles.scoreCard, styles.scoreCardPrimary]}>
          <Text style={[styles.scoreLabel, styles.scoreLabelPrimary]}>
            <FontAwesome5 name="chart-line" size={10} color={colors.primary[600]} /> 넷 스코어
          </Text>
          <Text style={styles.scoreValuePrimary}>
            {result.net_score ? result.net_score.toFixed(1) : '-'}타
          </Text>
        </View>
      </View>

      <View style={styles.handicapRow}>
        <Text style={styles.handicapText}>
          사용된 핸디캡: <Text style={styles.handicapValue}>{result.handicap_used}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
  },
  centerRow: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  headerRow: {
    marginBottom: 12,
  },
  headerRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 11,
    color: colors.neutral[600],
  },
  scoreGrid: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 12,
  },
  scoreCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    padding: 10,
  },
  scoreCardPrimary: {
    backgroundColor: colors.primary[50],
  },
  scoreLabel: {
    fontSize: 10,
    color: colors.neutral[500],
    marginBottom: 6,
  },
  scoreLabelPrimary: {
    color: colors.primary[600],
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  scoreValuePrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary[700],
  },
  handicapRow: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    marginTop: 12,
    paddingTop: 8,
  },
  handicapText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  handicapValue: {
    fontWeight: '700',
    color: colors.neutral[700],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  emptySubText: {
    fontSize: 10,
    color: colors.neutral[400],
  },
});
