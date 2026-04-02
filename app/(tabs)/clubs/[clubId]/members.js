import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import Modal from '@/components/ui/Modal';
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
const VIEWABLE_MEMBERSHIP_STATUSES = ['ACTIVE', 'APPROVED'];
const STAFF_ROLES = ['LEADER', 'MANAGER'];

function calcAgeFromBirthdate(birthdate) {
  if (!birthdate) return null;
  const parsed = new Date(birthdate);
  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();
  const dayDiff = today.getDate() - parsed.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age >= 0 && Number.isFinite(age) ? age : null;
}

function formatGenderLabel(gender) {
  const value = String(gender || '').toUpperCase();
  if (value === 'MALE' || value === 'M') return '남';
  if (value === 'FEMALE' || value === 'F') return '여';
  return null;
}

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
  const [membershipStatus, setMembershipStatus] = useState('');
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [membershipError, setMembershipError] = useState('');

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [recordSummary, setRecordSummary] = useState(null);

  const canViewMembers = VIEWABLE_MEMBERSHIP_STATUSES.includes(
    String(membershipStatus || '').toUpperCase().trim()
  );

  const loadMembership = useCallback(async () => {
    if (!resolvedId) {
      setMembershipStatus('');
      setMembershipLoading(false);
      setMembershipError('');
      return;
    }
    try {
      setMembershipLoading(true);
      setMembershipError('');
      const membership = extractData(await clubsApi.getClubMembership(resolvedId));
      const status = String(membership?.status || membership?.membership_status || '').toUpperCase().trim();
      setMembershipStatus(status);
    } catch (err) {
      setMembershipStatus('');
      setMembershipError(err?.message || '클럽 가입 상태를 확인하지 못했습니다.');
    } finally {
      setMembershipLoading(false);
    }
  }, [resolvedId]);

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

  useFocusEffect(
    useCallback(() => {
      loadMembership();
      loadRole();
    }, [loadMembership, loadRole])
  );

  useFocusEffect(
    useCallback(() => {
      if (membershipLoading) return;
      if (!canViewMembers) {
        setMembers([]);
        setIsLoading(false);
        if (!membershipError) setError('클럽 가입 후 이용할 수 있습니다.');
        return;
      }
      loadMembers();
    }, [membershipLoading, canViewMembers, membershipError, loadMembers])
  );

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

  const handleOpenRecordPress = useCallback((member) => async () => {
    if (!resolvedId || !member?.userId) return;
    try {
      setSelectedMember(member);
      setRecordModalOpen(true);
      setRecordSummary(null);
      setRecordError('');
      setRecordLoading(true);
      const response = await clubsApi.getClubMemberRecordSummary(resolvedId, member.userId);
      const data = extractData(response);
      setRecordSummary(data);
    } catch (err) {
      setRecordSummary(null);
      setRecordError(err?.message || '기록을 불러오지 못했습니다.');
    } finally {
      setRecordLoading(false);
    }
  }, [resolvedId]);

  const handleCloseRecordModal = useCallback(() => {
    setRecordModalOpen(false);
    setSelectedMember(null);
    setRecordSummary(null);
    setRecordError('');
    setRecordLoading(false);
  }, []);

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
          {membershipLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>가입 상태를 확인하는 중...</Text>
            </View>
          ) : membershipError ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{membershipError}</Text>
            </View>
          ) : !canViewMembers ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>클럽 가입 후 회원목록을 확인할 수 있습니다.</Text>
            </View>
          ) : isLoading || (isRoleManageMode && isRoleLoading) ? (
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
                  <Text style={styles.memberRole}>
                    {[
                      STAFF_ROLES.includes(member.role) ? member.roleLabel : null,
                      (() => {
                        const age = calcAgeFromBirthdate(member.birthdate);
                        return age !== null ? `${age}세` : null;
                      })(),
                      formatGenderLabel(member.gender),
                      STAFF_ROLES.includes(member.role) ? (member.phoneNumber || null) : null,
                    ].filter(Boolean).join(' · ') || member.roleLabel}
                  </Text>
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
                ) : !isManageMode && !isRoleManageMode && (member.status === 'ACTIVE' || member.status === 'APPROVED') ? (
                  <View style={styles.actionButtons}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={handleOpenRecordPress(member)}
                      textStyle={styles.recordButtonText}
                    >
                      기록보기
                    </Button>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={recordModalOpen}
        title={selectedMember?.name ? `${selectedMember.name} 기록` : '기록'}
        onClose={handleCloseRecordModal}
        animationType="fade"
        containerStyle={styles.modalCard}
        backdropStyle={styles.modalBackdrop}
        footer={(
          <View style={styles.modalActionRow}>
            <Button size="sm" variant="outline" onPress={handleCloseRecordModal}>
              닫기
            </Button>
          </View>
        )}
      >
        {recordLoading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.stateText}>기록을 불러오는 중...</Text>
          </View>
        ) : recordError ? (
          <Text style={styles.errorText}>{recordError}</Text>
        ) : recordSummary ? (
          <View>
            <Text style={styles.recordRowText}>
              핸디캡: {recordSummary?.handicap ?? recordSummary?.handicap_index ?? '-'}
            </Text>
            <Text style={styles.recordRowText}>
              평균타수: {recordSummary?.average_score ?? recordSummary?.avg_score ?? '-'}
            </Text>
            <Text style={styles.recordRowText}>
              최근 라운드: {recordSummary?.recent_rounds_count ?? recordSummary?.recentRoundsCount ?? '-'}
            </Text>
          </View>
        ) : (
          <Text style={styles.stateText}>표시할 기록이 없습니다.</Text>
        )}
      </Modal>
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
  recordButtonText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
  },
  modalCard: {
    width: '100%',
    maxWidth: 462,
    alignSelf: 'center',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: tokens.spacing.xs,
  },
  recordRowText: {
    fontSize: tokens.font.base,
    color: colors.neutral[800],
    marginBottom: tokens.spacing.xs2,
  },
});
