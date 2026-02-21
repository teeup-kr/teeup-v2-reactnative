import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView, StyleSheet, Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubMemberStatusColors } from '@/constants/clubConstants';
import { clubsApi } from '@/lib/api/api';
import { createFetchMembersHandler } from '@/lib/handler/clubs';
import { buildMemberSummary, normalizeClubMembers } from '@/lib/util/clubUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export default function ClubMemberManageScreen() {
  const { clubId, manage } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const resolvedManage = Array.isArray(manage) ? manage[0] : manage;
  const isManageMode = String(resolvedManage || '') === '1' || String(resolvedManage || '').toLowerCase() === 'true';
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingUserId, setApprovingUserId] = useState(null);

  const loadMembers = useMemo(
    () =>
      createFetchMembersHandler({
        clubId: resolvedId,
        includePending: isManageMode,
        fetchClubMembers: clubsApi.getClubMembers,
        extractList,
        setMembers,
        setIsLoading,
        setError,
      }),
    [resolvedId, isManageMode, setMembers, setIsLoading, setError]
  );

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const { normalizedMembers, pendingCount } = useMemo(
    () => normalizeClubMembers(members),
    [members]
  );

  const summaryText = useMemo(
    () => buildMemberSummary({ total: normalizedMembers.length, pending: pendingCount }),
    [normalizedMembers.length, pendingCount]
  );

  const handleApprovePress = async (member) => {
    if (!resolvedId || !member?.userId) return;
    try {
      setApprovingUserId(member.userId);
      await clubsApi.approveClubMembership(resolvedId, member.userId);
      Alert.alert('가입 승인 완료', `${member.name}님의 가입 신청을 승인했습니다.`);
      await loadMembers();
    } catch (approveError) {
      console.error('가입 승인 실패:', approveError);
      Alert.alert('가입 승인 실패', approveError?.message || '가입 승인 처리 중 오류가 발생했습니다.');
    } finally {
      setApprovingUserId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={isManageMode ? '멤버 관리' : '회원목록'} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{isManageMode ? '멤버 현황' : '회원 현황'}</Text>
          <Text style={styles.summaryText}>{summaryText}</Text>
        </Card>

        <View style={styles.listCard}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>멤버를 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : normalizedMembers.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>표시할 멤버가 없습니다.</Text>
            </View>
          ) : (
            normalizedMembers.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.avatar}>
                  <FontAwesome5 name="user" size={14} color={colors.neutral[500]} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: clubMemberStatusColors[member.status] || colors.neutral[400] },
                  ]}
                >
                  <Text style={styles.statusText}>{member.status}</Text>
                </View>
                {isManageMode && member.isPending ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleApprovePress(member)}
                    loading={approvingUserId === member.userId}
                    textStyle={styles.approveButtonText}
                  >
                    가입 승인
                  </Button>
                ) : null}
              </View>
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
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  summaryText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.padding.xxs,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  memberRole: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  statusBadge: {
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.base,
    marginRight: tokens.spacing.xs2,
  },
  statusText: {
    fontSize: tokens.font.xxs,
    color: colors.white,
    fontWeight: tokens.fontWeight.semibold,
  },
  approveButtonText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
  },
});
