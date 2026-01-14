
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginRequired from '@/components/auth/LoginRequired';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { useAuth } from '@/context/AuthContext';
import { mypageApi } from '@/lib/api/api';
import { createFetchMyMeetingsHandler, createOpenMeetingHandler } from '@/lib/handler/meetings';
import { extractList, normalizeMyMeetings } from '@/lib/util/meetingUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function MyMeetingsScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMeetings = useMemo(
    () =>
      createFetchMyMeetingsHandler({
        fetchMyMeetings: mypageApi.fetchMyMeetings,
        extractList,
        setMeetings,
        setIsLoading,
        setError,
      }),
    [setMeetings, setIsLoading, setError]
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMeetings();
  }, [isAuthenticated, loadMeetings]);

  const normalizedMeetings = useMemo(
    () => normalizeMyMeetings(meetings),
    [meetings]
  );
  const handleMeetingPress = useMemo(
    () => createOpenMeetingHandler({ router }),
    [router]
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginRequired
        message="로그인 후 이용가능합니다"
        description="내 모임을 보려면 로그인이 필요합니다."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="내 모임" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>현재 참여 모임</Text>
          <Text style={styles.summaryValue}>{normalizedMeetings.length}개</Text>
        </Card>

        <View style={styles.list}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>모임을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : normalizedMeetings.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>참여 중인 모임이 없습니다.</Text>
            </View>
          ) : (
            normalizedMeetings.map((meeting) => (
              <Pressable
                key={meeting.id}
                style={styles.row}
                onPress={handleMeetingPress(meeting)}
              >
                <View style={styles.iconWrap}>
                  <FontAwesome5 name="calendar-check" size={14} color={colors.primary[600]} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{meeting.name}</Text>
                  <Text style={styles.date}>{meeting.date}</Text>
                </View>
                <Text style={styles.status}>{meeting.status}</Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  summaryCard: {
    marginBottom: tokens.spacing.md,
  },
  summaryTitle: {
    fontSize: tokens.font.base,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginTop: tokens.spacing.xs,
  },
  list: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.padding.xxs,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  date: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  status: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
});
