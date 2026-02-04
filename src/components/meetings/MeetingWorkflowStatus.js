import { FontAwesome5 } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

const STEP_CONFIG = [
  { key: 'CREATED', label: '모임 생성', icon: 'clipboard-list' },
  { key: 'PARTICIPANTS_JOINED', label: '참가자 모집', icon: 'users-cog' },
  { key: 'TEAM_FORMATION', label: '팀 편성', icon: 'tools' },
  { key: 'COMPLETED', label: '모임 진행', icon: 'calendar-check' },
  { key: 'ROUNDING_COMPLETED', label: '라운딩 종료', icon: 'flag-checkered' },
  { key: 'SETTLEMENT_CONFIRMED', label: '정산 완료', icon: 'handshake' },
];

const isPastDateTime = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
};

const formatDateTime = (value) => {
  if (!value) return '미정';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR');
};

export default function MeetingWorkflowStatus({
  meeting,
  participants = [],
  teams = [],
  userRole,
  applicationStatus,
  confirmedParticipants = [],
  isApplicationDeadlinePassed,
  isApplicationClosedEarly,
  onCloseApplicationEarly,
  onAutoFormTeams,
  onConfirmTeamFormation,
  onStartRounding,
  onCompleteRounding,
  onCompleteMeeting,
}) {
  const isManager =
    userRole === 'ORGANIZER' ||
    userRole === 'HOST' ||
    userRole === 'LEADER' ||
    userRole === 'MANAGER';
  const isRoundingMeeting = meeting?.meeting_type === 'ROUND' || meeting?.meeting_type === 'ROUNDING';

  const workflowState = useMemo(() => {
    if (!meeting) return 'CREATED';
    if (meeting.status === 'CANCELED') return 'CANCELED';
    if (meeting.settlement_confirmed) return 'SETTLEMENT_CONFIRMED';
    if (meeting.rounding_completed_at) return 'ROUNDING_COMPLETED';
    if (meeting.rounding_started_at || meeting.is_completed) return 'COMPLETED';
    if (teams.length > 0) return 'TEAM_FORMED';

    const isClosed =
      meeting.application_closed_early ||
      isApplicationClosedEarly ||
      (meeting.application_deadline && isPastDateTime(meeting.application_deadline)) ||
      isApplicationDeadlinePassed;

    if (isClosed) return 'TEAM_FORMATION_READY';
    if (participants.length > 0) return 'PARTICIPANTS_JOINED';
    return 'CREATED';
  }, [
    meeting,
    participants.length,
    teams.length,
    isApplicationClosedEarly,
    isApplicationDeadlinePassed,
  ]);

  const workflowIndex = useMemo(() => {
    switch (workflowState) {
      case 'CREATED':
        return 0;
      case 'PARTICIPANTS_JOINED':
        return 1;
      case 'TEAM_FORMATION_READY':
      case 'TEAM_FORMED':
        return 2;
      case 'COMPLETED':
        return 3;
      case 'ROUNDING_COMPLETED':
        return 4;
      case 'SETTLEMENT_CONFIRMED':
        return 5;
      default:
        return 0;
    }
  }, [workflowState]);

  const isApplicationClosed = useMemo(() => {
    if (!meeting) return false;
    if (meeting.application_closed_early || isApplicationClosedEarly) return true;
    if (!meeting.application_deadline) return false;
    return isPastDateTime(meeting.application_deadline);
  }, [meeting, isApplicationClosedEarly]);

  const confirmedCount = confirmedParticipants?.length || participants.filter((p) => p.status === 'CONFIRMED').length;
  const canAutoFormTeams =
    isRoundingMeeting &&
    isApplicationClosed &&
    (workflowState === 'PARTICIPANTS_JOINED' || workflowState === 'TEAM_FORMATION_READY') &&
    confirmedCount >= 4;

  const canStartRounding =
    isRoundingMeeting &&
    meeting?.team_formation_confirmed_at &&
    !meeting?.rounding_started_at;

  const canCompleteRounding =
    isRoundingMeeting && meeting?.rounding_started_at && !meeting?.rounding_completed_at;

  const canConfirmSettlement =
    isRoundingMeeting && meeting?.rounding_completed_at && !meeting?.settlement_confirmed;

  const meetingStatusLabel = useMemo(() => {
    const status = String(meeting?.status || '').toUpperCase();
    if (status === 'IN_PROGRESS') return '진행 중';
    if (status === 'COMPLETED') return '완료';
    if (status === 'CANCELED') return '취소';
    return '진행 중';
  }, [meeting?.status]);

  const summaryRows = useMemo(() => {
    const currentCount = Number.isFinite(Number(meeting?.participant_count))
      ? Number(meeting.participant_count)
      : participants.length;
    const maxCount =
      meeting?.max_participants !== null && meeting?.max_participants !== undefined
        ? meeting.max_participants
        : '-';

    return [
      { label: '참가 신청', value: isApplicationClosed ? '마감' : '진행 중' },
      { label: '현재 참가자', value: `${currentCount} / ${maxCount}명` },
      { label: '확정 팀', value: teams.length > 0 ? `${teams.length}팀` : '미정' },
      { label: '모임 상태', value: meetingStatusLabel },
      { label: '참가 신청 마감', value: formatDateTime(meeting?.application_deadline) },
    ];
  }, [
    isApplicationClosed,
    meeting?.application_deadline,
    meeting?.max_participants,
    meeting?.participant_count,
    meetingStatusLabel,
    participants.length,
    teams.length,
  ]);

  const applicationSummary = useMemo(() => {
    if (!applicationStatus) return null;
    return {
      total: applicationStatus?.total_applications ?? participants.length,
      confirmed: applicationStatus?.confirmed_count ?? confirmedCount,
      max: applicationStatus?.max_participants ?? meeting?.max_participants ?? '-',
    };
  }, [applicationStatus, participants.length, confirmedCount, meeting?.max_participants]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>모임 진행 상황</Text>
      <Text style={styles.subtitle}>모임 마감에서 정산 확정까지 모임 진행 현황을 확인하세요.</Text>
      <View style={styles.stepList}>
        {STEP_CONFIG.map((step, index) => {
          const isCompleted = index < workflowIndex;
          const isActive = index === workflowIndex;
          const color = isCompleted
            ? colors.success[600]
            : isActive
              ? colors.primary[600]
              : colors.neutral[400];

          return (
            <View key={step.key} style={[styles.stepItem, isActive && styles.stepItemActive]}>
              <View style={[styles.stepIcon, { borderColor: color }]}
              >
                <FontAwesome5 name={step.icon} size={12} color={color} />
              </View>
              <View style={styles.stepTextGroup}>
                <Text style={[styles.stepLabel, { color }]}>{step.label}</Text>
                {isActive && <Text style={styles.stepHint}>현재 단계</Text>}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        {isManager && onCloseApplicationEarly && !isApplicationClosed && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.actionButtonAmberOutline,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={onCloseApplicationEarly}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextAmber]}>모집 마감</Text>
          </Pressable>
        )}
        {isManager && onAutoFormTeams && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.actionButtonBlue,
              !canAutoFormTeams && styles.actionButtonDisabled,
              pressed && canAutoFormTeams && styles.actionButtonPressed,
            ]}
            onPress={onAutoFormTeams}
            disabled={!canAutoFormTeams}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextWhite]}>팀 편성 시작</Text>
          </Pressable>
        )}
        {isManager && onConfirmTeamFormation && workflowState === 'TEAM_FORMED' && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.actionButtonGreen,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={onConfirmTeamFormation}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextWhite]}>팀 편성 확정</Text>
          </Pressable>
        )}
        {isManager && onStartRounding && canStartRounding && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.actionButtonBlue,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={onStartRounding}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextWhite]}>모임 진행 시작</Text>
          </Pressable>
        )}
        {isManager && onCompleteRounding && canCompleteRounding && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.actionButtonOrange,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={onCompleteRounding}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextWhite]}>라운딩 종료</Text>
          </Pressable>
        )}
        {isManager && onCompleteMeeting && canConfirmSettlement && (
          <Pressable
            style={({ pressed }) => [
              styles.actionButtonBase,
              styles.actionButtonPurple,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={onCompleteMeeting}
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextWhite]}>정산 완료 처리</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.summaryCard}>
        {summaryRows.map((row) => (
          <View key={row.label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{row.label}</Text>
            <Text style={styles.summaryValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {applicationSummary ? (
        <View style={styles.applicationCard}>
          <Text style={styles.applicationTitle}>참가 신청 현황</Text>
          <View style={styles.applicationGrid}>
            <View style={styles.applicationItem}>
              <Text style={styles.applicationLabel}>전체 신청</Text>
              <Text style={styles.applicationValue}>{applicationSummary.total}명</Text>
            </View>
            <View style={styles.applicationItem}>
              <Text style={styles.applicationLabel}>확정 인원</Text>
              <Text style={[styles.applicationValue, styles.applicationValueSuccess]}>
                {applicationSummary.confirmed}명
              </Text>
            </View>
            <View style={styles.applicationItem}>
              <Text style={styles.applicationLabel}>정원</Text>
              <Text style={styles.applicationValue}>
                {applicationSummary.max !== '-' ? `${applicationSummary.max}명` : '-'}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: tokens.padding.md,
  },
  title: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xxs,
  },
  subtitle: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginBottom: tokens.spacing.sm2,
  },
  stepList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.padding.base,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
  },
  stepItemActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: tokens.radius.baseLg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: tokens.spacing.sm,
    backgroundColor: colors.white,
  },
  stepTextGroup: {
    flex: 1,
  },
  stepLabel: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
  },
  stepHint: {
    fontSize: tokens.font.xxs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: tokens.spacing.sm2,
  },
  actionButtonBase: {
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonAmberOutline: {
    borderWidth: 1,
    borderColor: colors.warning[600],
    backgroundColor: colors.warning[50],
  },
  actionButtonBlue: {
    backgroundColor: colors.blue[600],
  },
  actionButtonGreen: {
    backgroundColor: colors.green[600],
  },
  actionButtonOrange: {
    backgroundColor: colors.warning[700],
  },
  actionButtonPurple: {
    backgroundColor: colors.violet[600],
  },
  actionButtonText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  actionButtonTextWhite: {
    color: colors.white,
  },
  actionButtonTextAmber: {
    color: colors.warning[700],
  },
  summaryCard: {
    marginTop: tokens.spacing.sm2,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  summaryValue: {
    fontSize: tokens.font.xs,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
    marginLeft: tokens.spacing.sm,
    textAlign: 'right',
    flex: 1,
  },
  applicationCard: {
    marginTop: tokens.spacing.sm2,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    padding: tokens.padding.sm,
  },
  applicationTitle: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs2,
  },
  applicationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  applicationItem: {
    minWidth: 90,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.sm,
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.xs2,
    paddingVertical: tokens.padding.xs,
  },
  applicationLabel: {
    fontSize: tokens.font.xxs,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  applicationValue: {
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
    fontWeight: tokens.fontWeight.bold,
  },
  applicationValueSuccess: {
    color: colors.success[700],
  },
});
