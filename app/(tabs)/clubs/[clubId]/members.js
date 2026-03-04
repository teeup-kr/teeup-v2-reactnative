import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubMemberStatusColors } from '@/constants/clubConstants';
import { clubsApi } from '@/lib/api/api';
import { createFetchMembersHandler } from '@/lib/handler/clubs';
import { buildMemberSummary, normalizeClubMembers } from '@/lib/util/clubUtils';
import { extractData, extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const CAN_MANAGE_ROLES = ['LEADER', 'MANAGER'];
const MEMBER_ROLE_OPTIONS = ['MEMBER', 'MANAGER'];

export default function ClubMemberManageScreen() {
  const { clubId, manage, role_manage } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const resolvedManage = Array.isArray(manage) ? manage[0] : manage;
  const resolvedRoleManage = Array.isArray(role_manage) ? role_manage[0] : role_manage;
  const isManageMode = String(resolvedManage || '') === '1' || String(resolvedManage || '').toLowerCase() === 'true';
  const isRoleManageMode =
    String(resolvedRoleManage || '') === '1' || String(resolvedRoleManage || '').toLowerCase() === 'true';

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState(null);
  const [canManageRole, setCanManageRole] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  const loadRole = useCallback(async () => {
    if (!resolvedId || !isRoleManageMode) return;
    try {
      setIsRoleLoading(true);
      const club = extractData(await clubsApi.getClub(resolvedId));
      const role = String(club?.membership_role || club?.my_role || '').toUpperCase();
      setCanManageRole(CAN_MANAGE_ROLES.includes(role));
    } catch {
      setCanManageRole(false);
    } finally {
      setIsRoleLoading(false);
    }
  }, [resolvedId, isRoleManageMode]);

  const loadMembers = useMemo(
    () =>
      createFetchMembersHandler({
        clubId: resolvedId,
        includePending: isManageMode && !isRoleManageMode,
        fetchClubMembers: clubsApi.getClubMembers,
        extractList,
        setMembers,
        setIsLoading,
        setError,
      }),
    [resolvedId, isManageMode, isRoleManageMode, setMembers, setIsLoading, setError]
  );

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const { normalizedMembers, pendingCount } = useMemo(
    () => normalizeClubMembers(members),
    [members]
  );

  const summaryText = useMemo(
    () =>
      isRoleManageMode
        ? '일반멤버와 매니저 권한을 변경할 수 있습니다.'
        : buildMemberSummary({ total: normalizedMembers.length, pending: pendingCount }),
    [isRoleManageMode, normalizedMembers.length, pendingCount]
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

  const handleRejectPress = async (member) => {
    if (!resolvedId || !member?.userId) return;
    try {
      setRejectingUserId(member.userId);
      await clubsApi.rejectClubMembership(resolvedId, member.userId);
      Alert.alert('가입 거절 완료', `${member.name}님의 가입 신청을 거절했습니다.`);
      await loadMembers();
    } catch (rejectError) {
      console.error('가입 거절 실패:', rejectError);
      Alert.alert('가입 거절 실패', rejectError?.message || '가입 거절 처리 중 오류가 발생했습니다.');
    } finally {
      setRejectingUserId(null);
    }
  };

  const updateMemberRole = async (member, nextRole) => {
    if (!resolvedId || !member?.userId) return;
    try {
      setUpdatingRoleUserId(member.userId);
      await clubsApi.updateClubMemberRole(resolvedId, member.userId, { role: nextRole });
      const nextRoleLabel = nextRole === 'MANAGER' ? '매니저' : '일반멤버';
      Alert.alert('권한 변경 완료', `${member.name}님의 권한을 ${nextRoleLabel}로 변경했습니다.`);
      await loadMembers();
    } catch (updateError) {
      console.error('멤버 권한 변경 실패:', updateError);
      Alert.alert('권한 변경 실패', updateError?.message || '멤버 권한 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  const handleRoleMenuPress = (member) => {
    const availableRoles = MEMBER_ROLE_OPTIONS.filter((role) => role !== member.role);
    const buttons = availableRoles.map((role) => ({
      text: role === 'MANAGER' ? '매니저' : '일반멤버',
      onPress: () => updateMemberRole(member, role),
    }));

    Alert.alert(`${member.name} 권한 변경`, '변경할 권한을 선택하세요.', [
      ...buttons,
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={isRoleManageMode ? '멤버 권한 관리' : isManageMode ? '멤버 관리' : '회원목록'} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{isRoleManageMode ? '멤버 권한' : isManageMode ? '멤버 현황' : '회원 현황'}</Text>
          <Text style={styles.summaryText}>{summaryText}</Text>
          {isRoleManageMode && !isRoleLoading && !canManageRole ? (
            <Text style={styles.permissionHint}>리더/매니저만 멤버 권한을 변경할 수 있습니다.</Text>
          ) : null}
        </Card>

        <View style={styles.listCard}>
          {isLoading || (isRoleManageMode && isRoleLoading) ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>{isRoleManageMode ? '권한 정보를 불러오는 중...' : '멤버를 불러오는 중...'}</Text>
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
                  <Text style={styles.memberRole}>{member.roleLabel}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: clubMemberStatusColors[member.status] || colors.neutral[400] },
                  ]}
                >
                  <Text style={styles.statusText}>{member.statusLabel}</Text>
                </View>
                {isManageMode && !isRoleManageMode && member.isPending ? (
                  <View style={styles.actionButtons}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleApprovePress(member)}
                      loading={approvingUserId === member.userId}
                      disabled={rejectingUserId === member.userId}
                      textStyle={styles.approveButtonText}
                    >
                      가입 승인
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleRejectPress(member)}
                      loading={rejectingUserId === member.userId}
                      disabled={approvingUserId === member.userId}
                      textStyle={styles.rejectButtonText}
                    >
                      가입 거절
                    </Button>
                  </View>
                ) : isRoleManageMode &&
                  canManageRole &&
                  (member.status === 'ACTIVE' || member.status === 'APPROVED') &&
                  MEMBER_ROLE_OPTIONS.includes(member.role) ? (
                  <View style={styles.actionButtons}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleRoleMenuPress(member)}
                      loading={updatingRoleUserId === member.userId}
                      disabled={updatingRoleUserId !== null && updatingRoleUserId !== member.userId}
                      textStyle={styles.roleButtonText}
                    >
                      권한 변경
                    </Button>
                  </View>
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
  permissionHint: {
    marginTop: tokens.spacing.xs2,
    fontSize: tokens.font.xs,
    color: colors.warning[700],
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs2,
  },
  approveButtonText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
  },
  rejectButtonText: {
    fontSize: tokens.font.xs,
    color: colors.error[700],
  },
  roleButtonText: {
    fontSize: tokens.font.xs,
    color: colors.info[700],
  },
});
