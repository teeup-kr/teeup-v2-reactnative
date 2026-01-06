import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ScreenHeader from '../../../../src/components/ui/ScreenHeader';
import Card from '../../../../src/components/ui/Card';
import { colors } from '../../../../src/theme/colors';
import { clubsApi } from '../../../../src/lib/clubsApi';
import { extractList } from '../../../../src/lib/responseUtils';

export default function ClubNoticesScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNotices = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubNotices(resolvedId, { page: 1, limit: 20 });
        const list = extractList(response);
        const normalized = list.map((notice) => ({
          id: notice?.id || notice?.notice_id || notice?.title,
          title: notice?.title || '공지사항',
          date: notice?.created_at ? notice.created_at.slice(0, 10) : notice?.date || '-',
          pinned: notice?.is_pinned || notice?.is_important || notice?.pinned || false,
        }));
        setNotices(normalized);
      } catch (fetchError) {
        console.error('클럽 공지 조회 실패:', fetchError);
        setError(fetchError?.message || '공지사항을 불러오는데 실패했습니다.');
        setNotices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotices();
  }, [resolvedId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="공지사항" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.noticeCard}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>공지사항을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : notices.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 공지사항이 없습니다.</Text>
            </View>
          ) : (
            notices.map((notice) => (
              <Pressable key={notice.id} style={styles.noticeRow}>
                <View style={styles.noticeIcon}>
                  <FontAwesome5 name="bullhorn" size={14} color={colors.primary[600]} />
                </View>
                <View style={styles.noticeInfo}>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  <Text style={styles.noticeDate}>{notice.date}</Text>
                </View>
                {notice.pinned && (
                  <View style={styles.noticeBadge}>
                    <Text style={styles.noticeBadgeText}>고정</Text>
                  </View>
                )}
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
  noticeCard: {
    paddingVertical: 4,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noticeInfo: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  noticeDate: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  noticeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.secondary[500],
  },
  noticeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
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
});
