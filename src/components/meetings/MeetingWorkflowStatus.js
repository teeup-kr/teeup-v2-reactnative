import { FontAwesome5 } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import Button from '../ui/Button';

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

export default function MeetingWorkflowStatus({
  meeting,
  participants = [],
  teams = [],
  userRole,
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
  const isManager = userRole === 'ORGANIZER' || userRole === 'HOST' || userRole === 'LEADER';
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>진행 상태</Text>
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
          <Button size="sm" variant="outline" onPress={onCloseApplicationEarly}>
            모집 마감
          </Button>
        )}
        {isManager && onAutoFormTeams && (
          <Button size="sm" onPress={onAutoFormTeams} disabled={!canAutoFormTeams}>
            팀 편성 시작
          </Button>
        )}
        {isManager && onConfirmTeamFormation && workflowState === 'TEAM_FORMED' && (
          <Button size="sm" onPress={onConfirmTeamFormation}>
            팀 편성 확정
          </Button>
        )}
        {isManager && onStartRounding && canStartRounding && (
          <Button size="sm" onPress={onStartRounding}>
            모임 진행 시작
          </Button>
        )}
        {isManager && onCompleteRounding && canCompleteRounding && (
          <Button size="sm" onPress={onCompleteRounding}>
            라운딩 종료
          </Button>
        )}
        {isManager && onCompleteMeeting && canConfirmSettlement && (
          <Button size="sm" onPress={onCompleteMeeting}>
            정산 완료 처리
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  stepList: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
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
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
    backgroundColor: colors.white,
  },
  stepTextGroup: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepHint: {
    fontSize: 10,
    color: colors.neutral[500],
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
});
