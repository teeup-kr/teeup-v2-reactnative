import { FontAwesome5 } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { usersApi } from '../../lib/api';
import { extractList } from '../../lib/responseUtils';
import { colors } from '../../theme/colors';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR');
};

export default function ScoreHistoryCard({ userId, initialLimit = 10 }) {
  const [displayLimit, setDisplayLimit] = useState(5);
  const [fetchLimit, setFetchLimit] = useState(initialLimit);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getUserScoreHistory(userId, fetchLimit);
      const data = extractList(response);
      setHistory(data);
    } catch (fetchError) {
      console.error('스코어 히스토리 조회 실패:', fetchError);
      setError('스코어 히스토리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId, fetchLimit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleShowMore = () => {
    if (displayLimit < fetchLimit) {
      setDisplayLimit((prev) => Math.min(prev + 5, fetchLimit));
    } else {
      setFetchLimit((prev) => prev + 10);
      setDisplayLimit((prev) => prev + 5);
    }
  };

  const handleShowLess = () => {
    setDisplayLimit(5);
  };

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

  if (!history.length) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>
            <FontAwesome5 name="history" size={14} color={colors.primary[500]} />{' '}
            최근 경기 스코어
          </Text>
        </View>
        <View style={styles.emptyState}>
          <FontAwesome5 name="golf-ball" size={28} color={colors.neutral[300]} />
          <Text style={styles.emptyText}>경기 기록이 없습니다.</Text>
          <Text style={styles.emptySubText}>경기를 완료하면 스코어가 표시됩니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          <FontAwesome5 name="history" size={14} color={colors.primary[500]} />{' '}
          최근 경기 스코어
        </Text>
      </View>

      <View style={styles.list}>
        {history.slice(0, displayLimit).map((score, index) => (
          <View key={score.id || index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {score.meeting_name || '모임명 없음'}
              </Text>
              <View style={styles.itemDateRow}>
                <FontAwesome5 name="calendar-alt" size={10} color={colors.neutral[500]} />
                <Text style={styles.itemDateText}>{formatDate(score.played_at)}</Text>
              </View>
            </View>

            <View style={styles.scoreRow}>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreLabel}>
                  <FontAwesome5 name="golf-ball" size={10} color={colors.neutral[500]} /> 실제 타수
                </Text>
                <Text style={styles.scoreValue}>{score.gross_score}타</Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreLabel, styles.scoreLabelPrimary]}>
                  <FontAwesome5 name="chart-line" size={10} color={colors.primary[600]} /> 넷 스코어
                </Text>
                <Text style={styles.scoreValuePrimary}>
                  {score.net_score ? score.net_score.toFixed(1) : '-'}타
                </Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreLabel}>핸디캡</Text>
                <Text style={styles.scoreValueSmall}>{score.handicap_used}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {displayLimit < history.length && (
        <Pressable onPress={handleShowMore} style={styles.actionButton}>
          <FontAwesome5 name="chevron-down" size={12} color={colors.primary[600]} />
          <Text style={styles.actionText}>{history.length - displayLimit}개 더보기</Text>
        </Pressable>
      )}

      {displayLimit > 5 && (
        <Pressable onPress={handleShowLess} style={styles.actionButton}>
          <FontAwesome5 name="chevron-up" size={12} color={colors.neutral[600]} />
          <Text style={styles.actionTextMuted}>접기</Text>
        </Pressable>
      )}
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
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  list: {
    gap: 10,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.white,
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  itemDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemDateText: {
    fontSize: 10,
    color: colors.neutral[500],
  },
  scoreRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingTop: 10,
    gap: 8,
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    color: colors.neutral[500],
    marginBottom: 4,
    textAlign: 'center',
  },
  scoreLabelPrimary: {
    color: colors.primary[600],
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  scoreValuePrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary[700],
  },
  scoreValueSmall: {
    fontSize: 11,
    fontWeight: '600',
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
  actionButton: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[600],
  },
  actionTextMuted: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
});
