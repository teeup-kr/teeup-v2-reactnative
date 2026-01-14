import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { fetchClubNotices } from '@/lib/api/clubs';
import { createFetchNoticesHandler } from '@/lib/render/clubs/notices';
import { extractList } from '@/lib/responseUtils';
import { normalizeClubNotices } from '@/lib/value/clubNotices';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function ClubNoticesScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotices = useMemo(
    () =>
      createFetchNoticesHandler({
        clubId: resolvedId,
        fetchClubNotices,
        extractList,
        setNotices,
        setIsLoading,
        setError,
      }),
    [resolvedId, setNotices, setIsLoading, setError]
  );

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const normalizedNotices = useMemo(() => normalizeClubNotices(notices), [notices]);

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
          ) : normalizedNotices.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 공지사항이 없습니다.</Text>
            </View>
          ) : (
            normalizedNotices.map((notice) => (
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
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  noticeCard: {
    paddingVertical: tokens.padding.xxs,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  noticeInfo: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  noticeDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  noticeBadge: {
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.secondary[500],
  },
  noticeBadgeText: {
    fontSize: tokens.font.xxs,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.white,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
});
