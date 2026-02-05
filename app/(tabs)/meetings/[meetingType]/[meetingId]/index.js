import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView, StyleSheet, Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BatchFormationModal from '@/components/meetings/BatchFormationModal';
import FormationHistoryModal from '@/components/meetings/FormationHistoryModal';
import MeetingWorkflowStatus from '@/components/meetings/MeetingWorkflowStatus';
import MySettlementView from '@/components/meetings/MySettlementView';
import RoundingCompleteModal from '@/components/meetings/RoundingCompleteModal';
import RoundingJoinModal from '@/components/meetings/RoundingJoinModal';
import SettlementManager from '@/components/meetings/SettlementManager';
import SimpleScoreInputModal from '@/components/meetings/SimpleScoreInputModal';
import SocialJoinModal from '@/components/meetings/SocialJoinModal';
import TeamEditorModal from '@/components/meetings/TeamEditorModal';
import TeamFormationModal from '@/components/meetings/TeamFormationModal';
import TeamFormationPreviewModal from '@/components/meetings/TeamFormationPreviewModal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { meetingDetailTabs } from '@/constants/meetingConstants';
import { meetingsApi, mypageApi, roundsApi, socialsApi, usersApi } from '@/lib/api/api';
import {
    createAutoFormTeamsHandler,
    createCompleteRoundingHandler,
    createConfirmSettlementHandler,
    createConfirmTeamsHandler,
    createFetchApplicationStatusHandler,
    createFetchMeetingDetailHandler,
    createFetchParticipantsHandler,
    createFetchTeamsHandler,
    createFetchUserInfoHandler,
    createJoinHandler,
    createLeaveHandler,
    createRestoreHistoryHandler,
    createSaveHistoryHandler,
    createScoreSuccessHandler,
    createStartRoundingHandler,
    createTabPressHandler,
    createUpdateUserInfoHandler,
} from '@/lib/handler/meetings';
import {
    buildUserInfoFromProfile,
    extractData,
    extractList,
    formatBirthdateForApi,
    formatDateTime,
    getCurrentHandicap,
    getIsJoined,
    getMeetingDomainType,
    getMyParticipantId,
    getTypeSlug,
    getUserRole,
    normalizeBirthdateInput,
} from '@/lib/util/meetingUtils';
import { ensureProfileCompleted } from '@/lib/util/mypageUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const TEAM_FORMATION_MODE_LABELS = {
  MIXED: '혼성',
  GENDER_SEPARATED: '성별 분리',
  GENDER_SEPARATED_HANDICAP: '성별 분리 + 핸디캡 기준',
  GENDER_SEPARATED_PREVIOUS_RECORD: '성별 분리 + 직전대회 성적',
  GENDER_SEPARATED_RANDOM: '성별 분리 + 랜덤',
  GENDER_MIXED_HANDICAP: '성별 혼합 + 핸디캡 기준',
  GENDER_MIXED_PREVIOUS_RECORD: '성별 혼합 + 직전대회 성적',
  GENDER_MIXED_RANDOM: '성별 혼합 + 랜덤',
};

const MEETING_SUBTYPE_LABELS = {
  REGULAR: '정기',
  IRREGULAR: '비정기',
  ONE_TIME: '일회성',
};

const SETTLEMENT_METHOD_LABELS = {
  EQUAL_SPLIT: 'N분의 1',
  INDIVIDUAL: '개별 정산',
};

const SOCIAL_SETTLEMENT_METHOD_LABELS = {
  EQUAL_SPLIT: 'N분의 1',
  TREASURER_PREPAID: '총무 선결제',
  CLUB_FUND: '클럽 회비 사용',
  INDIVIDUAL: '개별 정산',
};

const SOCIAL_TYPE_LABELS = {
  CASUAL: '캐주얼 모임',
  DINNER: '식사 모임',
  PRACTICE: '연습 모임',
  EVENT: '행사',
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '미정';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return `${numeric.toLocaleString('ko-KR')}원`;
}

function formatOptional(value, fallback = '미입력') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? fallback : trimmed;
  }
  return `${value}`;
}

function formatParticipantsCount(meeting, isApplicationClosedEarly) {
  const current = Number.isFinite(Number(meeting?.participant_count))
    ? Number(meeting.participant_count)
    : 0;
  const max =
    meeting?.max_participants !== null && meeting?.max_participants !== undefined
      ? meeting.max_participants
      : null;
  const baseLabel = max ? `${current}/${max}명` : `${current}명`;
  return isApplicationClosedEarly ? `${baseLabel} (신청 마감)` : baseLabel;
}

function formatHoleCount(holeCount) {
  if (holeCount === null || holeCount === undefined) return '미정';
  if (Number.isNaN(Number(holeCount))) return `${holeCount}`;
  return `${holeCount}홀`;
}

function formatTeamSize(teamSize) {
  if (teamSize === null || teamSize === undefined || teamSize === '') return '미정';
  if (Number.isNaN(Number(teamSize))) return `${teamSize}`;
  return `${teamSize}명`;
}

function formatTeeTimes(teeTimes) {
  if (!Array.isArray(teeTimes) || teeTimes.length === 0) return '미정';
  const formatted = teeTimes
    .map((time) => {
      if (!time) return null;
      if (/^\d{1,2}:\d{2}$/.test(time)) return time;
      const parsed = new Date(time);
      if (Number.isNaN(parsed.getTime())) return `${time}`;
      return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
    })
    .filter(Boolean);
  if (formatted.length === 0) return '미정';
  return formatted.join(', ');
}

function isPastDateTime(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

function getMeetingStatusMeta(meeting) {
  const status = String(meeting?.status || '').toUpperCase();
  if (status === 'IN_PROGRESS') return { label: '진행중', tone: 'warning' };
  if (status === 'COMPLETED') return { label: '완료', tone: 'success' };
  if (status === 'CANCELED') return { label: '취소', tone: 'danger' };
  if (meeting?.settlement_confirmed) return { label: '정산 완료', tone: 'success' };
  if (meeting?.application_closed_early || isPastDateTime(meeting?.application_deadline)) {
    return { label: '모집 마감', tone: 'warning' };
  }
  return { label: '예정', tone: 'primary' };
}

function getToneStyle(tone) {
  if (tone === 'success') {
    return { backgroundColor: colors.success[50], color: colors.success[700], borderColor: colors.success[600] };
  }
  if (tone === 'warning') {
    return { backgroundColor: colors.warning[50], color: colors.warning[700], borderColor: colors.warning[600] };
  }
  if (tone === 'danger') {
    return { backgroundColor: colors.error[50], color: colors.error[700], borderColor: colors.error[600] };
  }
  return { backgroundColor: colors.info[50], color: colors.info[700], borderColor: colors.info[600] };
}


export default function MeetingDetailScreen() {
  const router = useRouter();
  const { meetingType, meetingId } = useLocalSearchParams();
  const meetingTypeValue = Array.isArray(meetingType) ? meetingType[0] : meetingType;
  const meetingIdValue = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const typeSlug = getTypeSlug(meetingTypeValue);
  const meetingDomainType = getMeetingDomainType(typeSlug);
  const isRoundingMeeting = meetingDomainType === 'ROUND';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('participants');
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [handicapInfo, setHandicapInfo] = useState(null);
  const [handicapLoading, setHandicapLoading] = useState(false);
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [confirmedParticipants, setConfirmedParticipants] = useState([]);

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [teamFormationOpen, setTeamFormationOpen] = useState(false);
  const [teamPreviewOpen, setTeamPreviewOpen] = useState(false);
  const [teamEditorOpen, setTeamEditorOpen] = useState(false);
  const [batchFormationOpen, setBatchFormationOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [roundingCompleteOpen, setRoundingCompleteOpen] = useState(false);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [previewTeams, setPreviewTeams] = useState([]);
  const [formationHistory, setFormationHistory] = useState([]);
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({
    name: '',
    birthdate: '',
    gender: 'MALE',
    handicap: '',
    average_score: '',
  });

  const myParticipantId = useMemo(
    () => getMyParticipantId({ user, participants }),
    [participants, user]
  );

  const currentHandicap = useMemo(
    () => getCurrentHandicap(handicapInfo),
    [handicapInfo]
  );

  const fetchUserInfo = useMemo(
    () =>
      createFetchUserInfoHandler({
        fetchMyProfile: mypageApi.fetchMyProfile,
        fetchUserHandicap: mypageApi.fetchUserHandicap,
        extractData,
        setUser,
        setUserInfo,
        setUserInfoLoading,
        setHandicapInfo,
        setHandicapLoading,
        buildUserInfoFromProfile,
      }),
    [
      setUser,
      setUserInfo,
      setUserInfoLoading,
      setHandicapInfo,
      setHandicapLoading,
    ]
  );

  const fetchMeeting = useMemo(
    () =>
      createFetchMeetingDetailHandler({
        meetingIdValue,
        typeSlug,
        fetchSocial: meetingsApi.fetchSocial,
        fetchRound: meetingsApi.fetchRound,
        extractData,
        setMeeting,
        setLoading,
        setError,
      }),
    [meetingIdValue, typeSlug, setMeeting, setLoading, setError]
  );

  const fetchParticipants = useMemo(
    () =>
      createFetchParticipantsHandler({
        meetingIdValue,
        typeSlug,
        meeting,
        fetchRoundParticipants: meetingsApi.fetchRoundParticipants,
        fetchSocialParticipants: meetingsApi.fetchSocialParticipants,
        extractList,
        setParticipants,
        setConfirmedParticipants,
      }),
    [meetingIdValue, typeSlug, meeting, setParticipants, setConfirmedParticipants]
  );

  const fetchTeams = useMemo(
    () =>
      createFetchTeamsHandler({
        meetingIdValue,
        isRoundingMeeting,
        fetchRoundTeams: meetingsApi.fetchRoundTeams,
        extractList,
        setTeams,
      }),
    [meetingIdValue, isRoundingMeeting, setTeams]
  );

  const fetchStatus = useMemo(
    () =>
      createFetchApplicationStatusHandler({
        meetingIdValue,
        isRoundingMeeting,
        fetchApplicationStatus: meetingsApi.fetchApplicationStatus,
        extractData,
        setApplicationStatus,
      }),
    [meetingIdValue, isRoundingMeeting, setApplicationStatus]
  );

  useEffect(() => {
    fetchUserInfo();
    fetchMeeting();
  }, [fetchMeeting, fetchUserInfo]);

  useEffect(() => {
    fetchParticipants();
    fetchTeams();
    fetchStatus();
  }, [fetchParticipants, fetchTeams, fetchStatus]);

  const handleUpdateUserInfo = useMemo(
    () =>
      createUpdateUserInfoHandler({
        userInfo,
        userId: user?.id,
        updateMyProfile: mypageApi.updateMyProfile,
        updateUserHandicap: usersApi.updateUserHandicap,
        setProcessingAction,
        setIsEditingUserInfo,
        fetchUserInfo,
        alert: Alert.alert,
      }),
    [userInfo, user?.id, setProcessingAction, setIsEditingUserInfo, fetchUserInfo]
  );

  const handleJoin = useMemo(
    () =>
      createJoinHandler({
        typeSlug,
        meetingIdValue,
        joinSocial: meetingsApi.joinSocial,
        joinRound: meetingsApi.joinRound,
        router,
        setJoinModalOpen,
        setProcessingAction,
        fetchParticipants,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [typeSlug, meetingIdValue, router, setJoinModalOpen, setProcessingAction, fetchParticipants, fetchMeeting]
  );

  const handleLeave = useMemo(
    () =>
      createLeaveHandler({
        typeSlug,
        meetingIdValue,
        leaveSocial: meetingsApi.leaveSocial,
        leaveRound: meetingsApi.leaveRound,
        router,
        setProcessingAction,
        fetchParticipants,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [typeSlug, meetingIdValue, router, setProcessingAction, fetchParticipants, fetchMeeting]
  );

  const handleAutoFormTeams = useMemo(
    () =>
      createAutoFormTeamsHandler({
        meetingIdValue,
        autoFormTeams: meetingsApi.autoFormTeams,
        router,
        extractList,
        setProcessingAction,
        setPreviewTeams,
        setTeamPreviewOpen,
        setTeams,
        fetchTeams,
        onCloseTeamFormation: () => setTeamFormationOpen(false),
        alert: Alert.alert,
      }),
    [meetingIdValue, router, setProcessingAction, setPreviewTeams, setTeamPreviewOpen, setTeams, fetchTeams]
  );

  const handleConfirmTeams = useMemo(
    () =>
      createConfirmTeamsHandler({
        meetingIdValue,
        confirmTeamFormation: meetingsApi.confirmTeamFormation,
        router,
        setProcessingAction,
        setTeamPreviewOpen,
        fetchTeams,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [meetingIdValue, router, setProcessingAction, setTeamPreviewOpen, fetchTeams, fetchMeeting]
  );

  const handleStartRounding = useMemo(
    () =>
      createStartRoundingHandler({
        meetingIdValue,
        startRounding: meetingsApi.startRounding,
        router,
        setProcessingAction,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [meetingIdValue, router, setProcessingAction, fetchMeeting]
  );

  const handleCompleteRounding = useMemo(
    () =>
      createCompleteRoundingHandler({
        meetingIdValue,
        completeRounding: meetingsApi.completeRounding,
        router,
        setProcessingAction,
        setRoundingCompleteOpen,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [meetingIdValue, router, setProcessingAction, setRoundingCompleteOpen, fetchMeeting]
  );

  const handleConfirmSettlement = useMemo(
    () =>
      createConfirmSettlementHandler({
        meetingIdValue,
        confirmSettlement: meetingsApi.confirmSettlement,
        router,
        setProcessingAction,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [meetingIdValue, router, setProcessingAction, fetchMeeting]
  );

  const ensureMeetingProfile = useMemo(
    () =>
      () =>
        ensureProfileCompleted({
          router,
          alertMessage: '모임 이용 전 프로필을 완성해 주세요!',
        }),
    [router]
  );

  const handleSaveHistory = useMemo(
    () => createSaveHistoryHandler({ previewTeams, setFormationHistory }),
    [previewTeams, setFormationHistory]
  );

  const handleRestoreHistory = useMemo(
    () => createRestoreHistoryHandler({ setTeams }),
    [setTeams]
  );

  const handleScoreSuccess = useMemo(
    () => createScoreSuccessHandler({ setScoreModalOpen, fetchMeeting, fetchParticipants }),
    [setScoreModalOpen, fetchMeeting, fetchParticipants]
  );

  const handleTabPress = useMemo(
    () => createTabPressHandler({ onTabChange: setActiveTab }),
    [setActiveTab]
  );

  const handleReformTeams = useMemo(
    () => () => handleAutoFormTeams({ preview: true }),
    [handleAutoFormTeams]
  );

  const handleCloseApplicationEarly = useMemo(
    () => async () => {
      const isCompleted = await ensureMeetingProfile();
      if (!isCompleted) return;
      try {
        await meetingsApi.closeApplicationEarly(meetingIdValue);
        fetchMeeting();
        fetchStatus();
      } catch (closeError) {
        Alert.alert('오류', closeError?.message || '모집 마감 처리에 실패했습니다.');
      }
    },
    [meetingIdValue, fetchMeeting, fetchStatus, ensureMeetingProfile]
  );

  const handleEditMeeting = useMemo(
    () => async () => {
      const isCompleted = await ensureMeetingProfile();
      if (!isCompleted) return;
      router.push(`/meetings/${typeSlug}/${meetingIdValue}/edit`);
    },
    [router, typeSlug, meetingIdValue, ensureMeetingProfile]
  );

  const handleCancelMeeting = useMemo(
    () => async () => {
      const isCompleted = await ensureMeetingProfile();
      if (!isCompleted) return;
      Alert.alert('모임 취소', '정말 이 모임을 취소하시겠습니까?', [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingAction(true);
              if (typeSlug === 'social') {
                await socialsApi.cancelSocial(meetingIdValue, '개설자에 의한 취소');
              } else {
                await roundsApi.cancelRound(meetingIdValue, '개설자에 의한 취소');
              }
              fetchMeeting();
              fetchParticipants();
              fetchStatus();
            } catch (cancelError) {
              Alert.alert('오류', cancelError?.message || '모임 취소에 실패했습니다.');
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]);
    },
    [typeSlug, meetingIdValue, fetchMeeting, fetchParticipants, fetchStatus, ensureMeetingProfile]
  );

  const handleCompleteMeeting = useMemo(
    () => async () => {
      const isCompleted = await ensureMeetingProfile();
      if (!isCompleted) return;
      try {
        setProcessingAction(true);
        await roundsApi.completeMeeting(meetingIdValue);
        fetchMeeting();
        fetchParticipants();
        fetchStatus();
      } catch (completeError) {
        Alert.alert('오류', completeError?.message || '모임 완료 처리에 실패했습니다.');
      } finally {
        setProcessingAction(false);
      }
    },
    [meetingIdValue, fetchMeeting, fetchParticipants, fetchStatus, ensureMeetingProfile]
  );

  const handleApproveParticipant = useMemo(
    () => async (participantId) => {
      if (!participantId) return;
      const isCompleted = await ensureMeetingProfile();
      if (!isCompleted) return;
      try {
        setProcessingAction(true);
        await roundsApi.approveParticipant(meetingIdValue, participantId);
        fetchParticipants();
        fetchMeeting();
      } catch (approveError) {
        Alert.alert('오류', approveError?.message || '참가 승인에 실패했습니다.');
      } finally {
        setProcessingAction(false);
      }
    },
    [meetingIdValue, fetchParticipants, fetchMeeting, ensureMeetingProfile]
  );

  const handleRejectParticipant = useMemo(
    () => async (participantId) => {
      if (!participantId) return;
      const isCompleted = await ensureMeetingProfile();
      if (!isCompleted) return;
      try {
        setProcessingAction(true);
        await roundsApi.rejectParticipant(meetingIdValue, participantId);
        fetchParticipants();
        fetchMeeting();
      } catch (rejectError) {
        Alert.alert('오류', rejectError?.message || '참가 거절에 실패했습니다.');
      } finally {
        setProcessingAction(false);
      }
    },
    [meetingIdValue, fetchParticipants, fetchMeeting, ensureMeetingProfile]
  );

  const handleOpenGuestModal = useMemo(() => () => setGuestModalOpen(true), []);
  const handleCloseGuestModal = useMemo(
    () => () => {
      if (processingAction) return;
      setGuestModalOpen(false);
      setGuestForm({
        name: '',
        birthdate: '',
        gender: 'MALE',
        handicap: '',
        average_score: '',
      });
    },
    [processingAction]
  );

  const handleGuestSubmit = useMemo(
    () => async () => {
      const guestName = guestForm.name.trim();
      if (!guestName) {
        Alert.alert('확인', '게스트 이름을 입력해주세요.');
        return;
      }
      const birthdateRaw = String(guestForm.birthdate || '').trim().replace(/\D/g, '');
      if (birthdateRaw.length === 8 && !formatBirthdateForApi(guestForm.birthdate)) {
        Alert.alert('확인', '생년월일을 확인해주세요. (1900년~올해, 올바른 월·일)');
        return;
      }

      const handicapValue =
        guestForm.handicap !== '' && Number.isFinite(Number(guestForm.handicap))
          ? Number(guestForm.handicap)
          : null;
      const averageScoreValue =
        guestForm.average_score !== '' && Number.isFinite(Number(guestForm.average_score))
          ? Number(guestForm.average_score)
          : null;

      const isCompleted = await ensureMeetingProfile();
      if (!isCompleted) return;

      try {
        setProcessingAction(true);
        await roundsApi.addGuest(meetingIdValue, {
          name: guestName,
          birthdate: formatBirthdateForApi(guestForm.birthdate) || null,
          gender: guestForm.gender || null,
          handicap: handicapValue,
          average_score: averageScoreValue,
        });
        setGuestModalOpen(false);
        setGuestForm({
          name: '',
          birthdate: '',
          gender: 'MALE',
          handicap: '',
          average_score: '',
        });
        fetchParticipants();
        fetchMeeting();
      } catch (guestError) {
        Alert.alert('오류', guestError?.message || '게스트 추가에 실패했습니다.');
      } finally {
        setProcessingAction(false);
      }
    },
    [guestForm, meetingIdValue, fetchParticipants, fetchMeeting, ensureMeetingProfile]
  );

  const openJoinModal = useMemo(() => () => setJoinModalOpen(true), []);
  const closeJoinModal = useMemo(() => () => setJoinModalOpen(false), []);
  const openTeamFormation = useMemo(() => () => setTeamFormationOpen(true), []);
  const closeTeamFormation = useMemo(() => () => setTeamFormationOpen(false), []);
  const openTeamEditor = useMemo(() => () => setTeamEditorOpen(true), []);
  const closeTeamEditor = useMemo(() => () => setTeamEditorOpen(false), []);
  const openHistory = useMemo(() => () => setHistoryOpen(true), []);
  const closeHistory = useMemo(() => () => setHistoryOpen(false), []);
  const openBatchFormation = useMemo(() => () => setBatchFormationOpen(true), []);
  const closeBatchFormation = useMemo(() => () => setBatchFormationOpen(false), []);
  const closeTeamPreview = useMemo(() => () => setTeamPreviewOpen(false), []);
  const closeRoundingComplete = useMemo(() => () => setRoundingCompleteOpen(false), []);
  const openScoreModal = useMemo(() => () => setScoreModalOpen(true), []);
  const closeScoreModal = useMemo(() => () => setScoreModalOpen(false), []);
  const handleInputLater = useMemo(() => () => setScoreModalOpen(false), []);
  const handleTeamsSave = useMemo(
    () =>
      async (updatedTeams) => {
        if (!isRoundingMeeting || !meetingIdValue) return;
        const isCompleted = await ensureMeetingProfile();
        if (!isCompleted) return;

        try {
          setProcessingAction(true);
          const previousTeams = Array.isArray(teams) ? teams : [];
          const nextTeams = Array.isArray(updatedTeams) ? updatedTeams : [];

          const previousById = new Map(
            previousTeams
              .filter((team) => team?.id)
              .map((team) => [team.id, team])
          );
          const nextIds = new Set(
            nextTeams
              .filter((team) => team?.id)
              .map((team) => team.id)
          );

          // 삭제된 팀 처리
          const removedTeamIds = [...previousById.keys()].filter((teamId) => !nextIds.has(teamId));
          for (const teamId of removedTeamIds) {
            await roundsApi.deleteTeamByMeeting(teamId);
          }

          // 기존 팀 수정 및 멤버 동기화
          for (const team of nextTeams.filter((item) => item?.id)) {
            const teamId = team.id;
            const previousTeam = previousById.get(teamId) || {};
            const nextName = team?.name || '';
            const previousName = previousTeam?.name || previousTeam?.team_name || '';

            if (nextName && nextName !== previousName) {
              await roundsApi.updateTeam(teamId, { name: nextName });
            }

            const previousMembers = previousTeam?.members || previousTeam?.team_members || [];
            const nextMembers = team?.members || team?.team_members || [];

            const previousMemberByUserId = new Map(
              previousMembers
                .map((member) => [member?.user_id, member])
                .filter(([userId]) => Boolean(userId))
            );
            const nextUserIds = new Set(
              nextMembers
                .map((member) => member?.user_id)
                .filter(Boolean)
            );

            for (const [userId, member] of previousMemberByUserId.entries()) {
              if (!nextUserIds.has(userId)) {
                const teamMemberId = member?.id || member?.team_member_id;
                if (teamMemberId) {
                  await roundsApi.removeTeamMember(meetingIdValue, teamId, teamMemberId);
                }
              }
            }

            const previousUserIds = new Set(previousMemberByUserId.keys());
            for (const member of nextMembers) {
              const userId = member?.user_id;
              if (userId && !previousUserIds.has(userId)) {
                await roundsApi.addTeamMember(meetingIdValue, teamId, userId);
              }
            }
          }

          // 신규 팀 생성
          for (const [index, team] of nextTeams.filter((item) => !item?.id).entries()) {
            const response = await roundsApi.createTeamByMeeting(meetingIdValue, {
              name: team?.name || `팀 ${index + 1}`,
            });
            const createdTeam = extractData(response);
            const createdTeamId = createdTeam?.id || createdTeam?.team_id;
            if (!createdTeamId) continue;

            const members = team?.members || team?.team_members || [];
            for (const member of members) {
              const userId = member?.user_id;
              if (userId) {
                await roundsApi.addTeamMember(meetingIdValue, createdTeamId, userId);
              }
            }
          }

          await fetchTeams();
          fetchMeeting();
          setTeamEditorOpen(false);
        } catch (teamSaveError) {
          Alert.alert('오류', teamSaveError?.message || '팀 편집 저장에 실패했습니다.');
        } finally {
          setProcessingAction(false);
        }
      },
    [isRoundingMeeting, meetingIdValue, teams, fetchTeams, fetchMeeting, ensureMeetingProfile]
  );

  const handleBatchViewDetail = useMemo(
    () =>
      (result) => {
        setPreviewTeams(result.teams || []);
        setTeamPreviewOpen(true);
      },
    []
  );

  const handleHistoryViewDetail = useMemo(
    () =>
      (item) => {
        setPreviewTeams(item.teams || []);
        setTeamPreviewOpen(true);
      },
    []
  );

  const userRole = useMemo(
    () => String(getUserRole({ meeting, user }) || '').toUpperCase(),
    [meeting, user]
  );

  const myParticipant = useMemo(
    () => participants.find((participant) => `${participant?.user_id}` === `${user?.id}`),
    [participants, user?.id]
  );

  const participantRole = useMemo(
    () => String(myParticipant?.role || '').toUpperCase(),
    [myParticipant?.role]
  );

  const isJoined = useMemo(
    () => getIsJoined({ participants, user }),
    [participants, user]
  );

  const isOrganizer = useMemo(
    () =>
      Boolean(
        (meeting?.creator_id !== undefined &&
          meeting?.creator_id !== null &&
          user?.id !== undefined &&
          user?.id !== null &&
          `${meeting.creator_id}` === `${user.id}`) ||
          participantRole === 'ORGANIZER' ||
          participantRole === 'HOST' ||
          userRole === 'ORGANIZER' ||
          userRole === 'HOST'
      ),
    [meeting?.creator_id, participantRole, user?.id, userRole]
  );

  const isParticipant = useMemo(
    () => Boolean(isJoined || myParticipant),
    [isJoined, myParticipant]
  );

  const isClubLeaderOrManager = useMemo(() => {
    const participantClubRole = String(myParticipant?.club_role || myParticipant?.membership_role || '').toUpperCase();
    return (
      participantRole === 'LEADER' ||
      participantRole === 'MANAGER' ||
      userRole === 'LEADER' ||
      userRole === 'MANAGER' ||
      participantClubRole === 'LEADER' ||
      participantClubRole === 'MANAGER'
    );
  }, [myParticipant?.club_role, myParticipant?.membership_role, participantRole, userRole]);

  const hasManagerPermission = useMemo(
    () => Boolean(isOrganizer || (isParticipant && isClubLeaderOrManager)),
    [isOrganizer, isParticipant, isClubLeaderOrManager]
  );

  const isManager = useMemo(
    () => hasManagerPermission,
    [hasManagerPermission]
  );

  const meetingStatusMeta = useMemo(
    () => getMeetingStatusMeta(meeting),
    [meeting]
  );

  const confirmedCount = useMemo(
    () => participants.filter((participant) => String(participant?.status || '').toUpperCase() === 'CONFIRMED').length,
    [participants]
  );

  const normalizedStatus = useMemo(
    () => String(meeting?.status || '').toUpperCase(),
    [meeting?.status]
  );

  const isApplicationClosed = useMemo(() => {
    if (!meeting) return false;
    return Boolean(meeting.application_closed_early) || isPastDateTime(meeting.application_deadline);
  }, [meeting]);

  const isApplicationClosedEarly = useMemo(
    () => Boolean(meeting?.application_closed_early),
    [meeting?.application_closed_early]
  );

  const hasApplicationClosedEarlyFlag = useMemo(
    () => meeting?.application_closed_early !== undefined,
    [meeting?.application_closed_early]
  );

  const isApplicationDeadlinePassed = useMemo(
    () => isPastDateTime(meeting?.application_deadline),
    [meeting?.application_deadline]
  );

  const isMeetingTimePassed = useMemo(
    () => isPastDateTime(meeting?.meeting_time),
    [meeting?.meeting_time]
  );

  const settlementConfirmedParticipants = useMemo(
    () => participants.filter((participant) => String(participant?.status || '').toUpperCase() === 'CONFIRMED'),
    [participants]
  );

  const isMinParticipantsNotMet = useMemo(() => {
    if (!meeting || !isApplicationClosed) return false;
    const count = settlementConfirmedParticipants.length;
    if (isRoundingMeeting) {
      return count >= 1 && count <= 3;
    }
    return count === 1;
  }, [meeting, isApplicationClosed, isRoundingMeeting, settlementConfirmedParticipants.length]);

  const canSettleMeeting = useMemo(() => {
    if (!meeting) return false;
    if (normalizedStatus === 'CANCELED') return false;
    if (isMinParticipantsNotMet) return false;

    if (!isRoundingMeeting) {
      if (meeting?.is_completed || normalizedStatus === 'COMPLETED') return true;
      return isApplicationClosed && isMeetingTimePassed;
    }

    if (meeting?.settlement_confirmed === false && teams.length > 0) return true;
    return teams.length > 0;
  }, [
    meeting,
    normalizedStatus,
    isMinParticipantsNotMet,
    isRoundingMeeting,
    isApplicationClosed,
    isMeetingTimePassed,
    teams.length,
  ]);

  const settlementBlockedMessage = useMemo(() => {
    if (normalizedStatus === 'CANCELED') {
      return '모임이 취소되어 정산을 진행할 수 없습니다.';
    }
    if (isMinParticipantsNotMet) {
      return '참가인원 미달로 모임이 취소되어 정산을 진행할 수 없습니다.';
    }
    return null;
  }, [normalizedStatus, isMinParticipantsNotMet]);

  const canManageSettlement = useMemo(() => isManager, [isManager]);

  const displayStatus = useMemo(() => {
    if (normalizedStatus === 'CANCELED') return 'CANCELED';
    if (meeting?.settlement_confirmed === true) return '종료';
    if (meeting?.settlement_confirmed === false && teams.length > 0) return '완료';
    if (teams.length > 0) return '진행중';

    if (isApplicationClosed) {
      if (isRoundingMeeting) {
        if (settlementConfirmedParticipants.length >= 1 && settlementConfirmedParticipants.length <= 3) {
          return 'CANCELED';
        }
      } else if (settlementConfirmedParticipants.length === 1) {
        return 'CANCELED';
      }
      return '모집마감';
    }

    return '예정';
  }, [
    normalizedStatus,
    meeting?.settlement_confirmed,
    teams.length,
    isApplicationClosed,
    isRoundingMeeting,
    settlementConfirmedParticipants.length,
  ]);

  /** 라운딩은 SCHEDULED만 참가 가능, 소셜은 취소/완료가 아니면 참가 가능(OPEN 등) */
  const isJoinableStatus = useMemo(
    () => {
      if (normalizedStatus === 'CANCELED' || normalizedStatus === 'COMPLETED') return false;
      if (normalizedStatus === 'SCHEDULED') return true;
      if (!isRoundingMeeting) return true;
      return false;
    },
    [normalizedStatus, isRoundingMeeting]
  );

  const canJoin = useMemo(
    () =>
      Boolean(
        isJoinableStatus &&
          !isOrganizer &&
          !isParticipant &&
          (meeting?.max_participants == null ||
            Number(meeting?.participant_count || participants.length) < Number(meeting?.max_participants)) &&
          !isApplicationClosed
      ),
    [
      isJoinableStatus,
      isOrganizer,
      isParticipant,
      meeting?.max_participants,
      meeting?.participant_count,
      participants.length,
      isApplicationClosed,
    ]
  );

  const canLeave = useMemo(
    () =>
      Boolean(
        normalizedStatus !== 'CANCELED' &&
          normalizedStatus !== 'COMPLETED' &&
          isParticipant &&
          !isOrganizer
      ),
    [normalizedStatus, isParticipant, isOrganizer]
  );

  const canLeaveActually = useMemo(
    () => canLeave && !isApplicationClosed,
    [canLeave, isApplicationClosed]
  );

  const canEditTopActions = useMemo(
    () =>
      Boolean(
        (isOrganizer || (isParticipant && isClubLeaderOrManager)) &&
          displayStatus !== 'CANCELED' &&
          displayStatus !== '종료' &&
          displayStatus !== '완료'
      ),
    [isOrganizer, isParticipant, isClubLeaderOrManager, displayStatus]
  );

  /** 소셜: 주최/참가자가 아니고 취소·완료가 아니면 참가 버튼 표시 (API 상태와 무관하게) */
  const showJoinButtonForSocial = useMemo(
    () =>
      Boolean(
        !isRoundingMeeting &&
          isJoinableStatus &&
          !isOrganizer &&
          !isParticipant
      ),
    [isRoundingMeeting, isJoinableStatus, isOrganizer, isParticipant]
  );

  const hasTopActions = useMemo(
    () => canEditTopActions || canJoin || canLeave || showJoinButtonForSocial,
    [canEditTopActions, canJoin, canLeave, showJoinButtonForSocial]
  );

  const canShowMySettlementTab = useMemo(() => {
    if (isRoundingMeeting) {
      return Boolean(meeting?.rounding_completed_at || meeting?.settlement_confirmed);
    }
    return meeting?.settlement_confirmed !== undefined;
  }, [isRoundingMeeting, meeting?.rounding_completed_at, meeting?.settlement_confirmed]);

  const visibleTabs = useMemo(
    () =>
      meetingDetailTabs.filter((tab) => {
        if (!isRoundingMeeting && tab.key === 'teams') return false;
        if (tab.key === 'my-settlement') return canShowMySettlementTab;
        return true;
      }),
    [isRoundingMeeting, canShowMySettlementTab]
  );

  const canAccessTeamTab = useMemo(
    () => Boolean(isRoundingMeeting && confirmedCount >= 4 && isApplicationClosed),
    [isRoundingMeeting, confirmedCount, isApplicationClosed]
  );

  const hasConfirmedTeams = useMemo(
    () => teams.some((team) => String(team?.status || '').toUpperCase() === 'CONFIRMED'),
    [teams]
  );

  const teamsForWorkflow = useMemo(
    () => (teams.length > 0 ? teams : extractList(meeting?.teams) || []),
    [teams, meeting?.teams]
  );

  const canCloseApplication = useMemo(
    () =>
      Boolean(
        isManager &&
          isRoundingMeeting &&
          !isApplicationClosed &&
          normalizedStatus === 'SCHEDULED' &&
          participants.length > 0 &&
          !processingAction
      ),
    [
      isManager,
      isRoundingMeeting,
      isApplicationClosed,
      normalizedStatus,
      participants.length,
      processingAction,
    ]
  );

  const canStartTeamFormation = useMemo(
    () =>
      Boolean(
        isManager &&
          isRoundingMeeting &&
          normalizedStatus === 'SCHEDULED' &&
          confirmedCount >= 4 &&
          isApplicationClosed &&
          !meeting?.team_formation_confirmed_at &&
          !meeting?.rounding_started_at &&
          !processingAction
      ),
    [
      isManager,
      isRoundingMeeting,
      normalizedStatus,
      confirmedCount,
      isApplicationClosed,
      meeting?.team_formation_confirmed_at,
      meeting?.rounding_started_at,
      processingAction,
    ]
  );

  const canModifyTeams = useMemo(
    () => Boolean(isManager && isRoundingMeeting && !meeting?.rounding_started_at && !processingAction),
    [isManager, isRoundingMeeting, meeting?.rounding_started_at, processingAction]
  );

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.key === activeTab)) {
      setActiveTab('participants');
    }
  }, [activeTab, visibleTabs]);

  const meetingInfoItems = useMemo(() => {
    if (!meeting) return [];

    const baseItems = [
      {
        key: 'meeting_time',
        label: '모임 일시',
        value: meeting.meeting_time ? formatDateTime(meeting.meeting_time) : '미정',
        icon: 'calendar-alt',
      },
      {
        key: 'application_deadline',
        label: '신청 마감',
        value: meeting.application_deadline ? formatDateTime(meeting.application_deadline) : '미정',
        icon: 'clock',
      },
      {
        key: 'location',
        label: '장소',
        value: formatOptional(isRoundingMeeting ? meeting.location : meeting.venue_name || meeting.location),
        icon: 'map-marker-alt',
      },
      {
        key: 'club_name',
        label: '소속 클럽',
        value: formatOptional(meeting.club_name),
        icon: 'users',
      },
      {
        key: 'participants',
        label: '참가자 수',
        value: formatParticipantsCount(meeting, Boolean(meeting.application_closed_early)),
        icon: 'user-friends',
      },
      {
        key: 'description',
        label: '설명',
        value: formatOptional(meeting.description, '등록된 설명이 없습니다.'),
        icon: 'sticky-note',
        multiline: true,
      },
    ];

    if (isRoundingMeeting) {
      return [
        ...baseItems,
        {
          key: 'course_name',
          label: '골프장명',
          value: formatOptional(meeting.course_name),
          icon: 'golf-ball',
        },
        {
          key: 'hole_count',
          label: '홀 수',
          value: formatHoleCount(meeting.hole_count),
          icon: 'list-ol',
        },
        {
          key: 'reservation_name',
          label: '예약자명',
          value: formatOptional(meeting.reservation_name),
          icon: 'user-tie',
        },
        {
          key: 'tee_times',
          label: '티타임',
          value: formatTeeTimes(meeting.tee_times),
          icon: 'clock',
        },
        {
          key: 'team_size',
          label: '한 조당 인원 수',
          value: formatTeamSize(meeting.team_size),
          icon: 'users-cog',
        },
        {
          key: 'team_formation_mode',
          label: '팀 구성 방식',
          value: formatOptional(
            TEAM_FORMATION_MODE_LABELS[meeting.team_formation_mode] || meeting.team_formation_mode,
            '미정'
          ),
          icon: 'project-diagram',
        },
        {
          key: 'meeting_subtype',
          label: '모임 유형',
          value: formatOptional(
            MEETING_SUBTYPE_LABELS[meeting.meeting_subtype] || meeting.meeting_subtype,
            '미정'
          ),
          icon: 'clipboard-list',
        },
        {
          key: 'settlement_method',
          label: '정산 방법',
          value: formatOptional(
            SETTLEMENT_METHOD_LABELS[meeting.settlement_method] || meeting.settlement_method,
            '미정'
          ),
          icon: 'dollar-sign',
        },
      ];
    }

    return [
      ...baseItems,
      {
        key: 'social_type',
        label: '모임 유형',
        value: formatOptional(SOCIAL_TYPE_LABELS[meeting.type] || meeting.type, '미정'),
        icon: 'clipboard-list',
      },
      {
        key: 'social_settlement_method',
        label: '정산 방법',
        value: formatOptional(
          SOCIAL_SETTLEMENT_METHOD_LABELS[meeting.social_settlement_method] ||
            meeting.social_settlement_method,
          '미정'
        ),
        icon: 'dollar-sign',
      },
    ];
  }, [meeting, isRoundingMeeting]);

  const costInfoItems = useMemo(() => {
    if (!meeting) return [];

    if (isRoundingMeeting) {
      const items = [];
      if (meeting.total_cost !== null && meeting.total_cost !== undefined) {
        items.push({ key: 'total_cost', label: '총 비용', value: formatCurrency(meeting.total_cost) });
      }
      if (meeting.green_fee !== null && meeting.green_fee !== undefined) {
        items.push({ key: 'green_fee', label: '그린피', value: formatCurrency(meeting.green_fee) });
      }
      if (meeting.caddy_fee !== null && meeting.caddy_fee !== undefined) {
        items.push({ key: 'caddy_fee', label: '캐디피', value: formatCurrency(meeting.caddy_fee) });
      }
      if (meeting.cart_fee !== null && meeting.cart_fee !== undefined) {
        items.push({ key: 'cart_fee', label: '카트비', value: formatCurrency(meeting.cart_fee) });
      }
      return items;
    }

    if (meeting.social_cost !== null && meeting.social_cost !== undefined) {
      return [{ key: 'social_cost', label: '소셜 비용', value: formatCurrency(meeting.social_cost) }];
    }
    return [];
  }, [meeting, isRoundingMeeting]);

  const currentUserId = user?.id ?? null;
  const currentUserGender = user?.gender ?? null;

  const renderParticipantRow = useCallback(function renderParticipantRow(participant, index) {
    const participantData = participant ?? {};
    const participantUser = participantData.user ?? {};
    const status = String(participantData.status ?? '').toUpperCase();
    const statusLabel =
      status === 'CONFIRMED'
        ? '확정'
        : status === 'PENDING'
          ? '대기'
          : status === 'REJECTED'
            ? '거절'
            : status || '-';
    const participantId = participantData.id ?? participantData.participant_id;
    const participantUserId = participantData.user_id ?? participantData.id;
    const isMine = currentUserId !== null && `${participantUserId}` === `${currentUserId}`;
    const participantGender =
      participantData.gender ??
      participantUser.gender ??
      participantData.user_gender ??
      (isMine ? userInfo?.gender ?? currentUserGender : null);
    const genderValue = String(participantGender ?? '').toUpperCase();
    const roleValue = String(participantData.role ?? '').toUpperCase();
    const genderLabel = genderValue === 'MALE' ? '남성' : genderValue === 'FEMALE' ? '여성' : '';
    const handicapRaw =
      participantData.handicap_index ??
      participantData.handicap ??
      participantUser.handicap_index ??
      participantUser.handicap ??
      participantData.user_handicap ??
      (isMine ? userInfo?.handicap ?? currentHandicap : null);
    const handicapNumber = Number(handicapRaw);
    const handicapLabel = Number.isFinite(handicapNumber)
      ? `핸디 ${handicapNumber % 1 === 0 ? handicapNumber.toFixed(0) : handicapNumber.toFixed(1)}`
      : '';
    const roleLabel =
      roleValue === 'ORGANIZER' ? '개설자' : roleValue === 'PARTICIPANT' ? '참가자' : '';
    const isGuest = participantData.is_guest === true;

    const statusTone = status === 'CONFIRMED'
      ? styles.statusConfirmed
      : status === 'PENDING'
        ? styles.statusPending
        : styles.statusRejected;

    return (
      <View key={participantData.id ?? index} style={styles.participantCard}>
        <View style={styles.participantTopRow}>
          <View style={styles.participantAvatar}>
            <FontAwesome5 name="user" size={14} color={colors.white} />
          </View>
          <View style={styles.participantMain}>
            <Text style={styles.participantName}>
              {isGuest
                ? participantData.guest_name ?? participantData.user_name ?? '게스트'
                : participantData.user_name ?? participantData.name ?? '참가자'}
            </Text>
            <Text style={styles.participantSubText}>
              {isGuest ? '게스트' : participantData.user_email ?? '-'}
            </Text>
            <View style={styles.participantBadgeRow}>
              {genderLabel ? (
                <View style={[styles.miniBadge, styles.genderBadge]}>
                  <Text style={[styles.miniBadgeText, styles.genderBadgeText]}>{genderLabel}</Text>
                </View>
              ) : null}
              {roleLabel ? (
                <View style={[styles.miniBadge, styles.roleBadge]}>
                  <Text style={[styles.miniBadgeText, styles.roleBadgeText]}>{roleLabel}</Text>
                </View>
              ) : null}
              {handicapLabel ? (
                <View style={[styles.miniBadge, styles.roleBadge]}>
                  <Text style={[styles.miniBadgeText, styles.roleBadgeText]}>{handicapLabel}</Text>
                </View>
              ) : null}
              <View style={[styles.miniBadge, statusTone]}>
                <Text style={[styles.miniBadgeText, styles.statusBadgeText]}>{statusLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {isManager && status === 'PENDING' && participantId ? (
          <View style={styles.participantActionRow}>
            <Pressable
              style={[styles.participantActionButton, styles.participantApproveButton]}
              onPress={() => handleApproveParticipant(participantId)}
            >
              <Text style={styles.participantActionText}>승인</Text>
            </Pressable>
            <Pressable
              style={[styles.participantActionButton, styles.participantRejectButton]}
              onPress={() => handleRejectParticipant(participantId)}
            >
              <Text style={styles.participantActionText}>거절</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }, [isManager, handleApproveParticipant, handleRejectParticipant, currentUserId, currentUserGender, userInfo?.gender, userInfo?.handicap, currentHandicap]);

  const renderTeamCard = useCallback(function renderTeamCard(team, index) {
    const members = team?.members ?? team?.team_members ?? [];
    return (
      <View key={team.id || index} style={styles.teamCard}>
        <View style={styles.teamHeaderRow}>
          <Text style={styles.teamTitle}>{team?.name ?? `팀 ${index + 1}`}</Text>
          <Text style={styles.teamCount}>{members.length}명</Text>
        </View>
        {members.map((member, memberIndex) => {
          const genderValue = String(member?.gender || '').toUpperCase();
          const genderLabel = genderValue === 'MALE' ? '남성' : genderValue === 'FEMALE' ? '여성' : '';
          const handicapValue =
            member?.handicap_index !== null && member?.handicap_index !== undefined
              ? `핸디 ${member.handicap_index}`
              : '';
          const recentScoreValue =
            member?.recent_avg_score !== null && member?.recent_avg_score !== undefined
              ? `직전 ${member.recent_avg_score}타`
              : '';

          return (
            <View key={member.id || memberIndex} style={styles.teamMemberCard}>
              <Text style={styles.teamMember}>
                {member?.user_name ?? member?.name ?? member?.guest_name ?? '멤버'}
              </Text>
              <View style={styles.teamMemberBadgeRow}>
                {genderLabel ? (
                  <View style={[styles.miniBadge, styles.genderBadge]}>
                    <Text style={[styles.miniBadgeText, styles.genderBadgeText]}>{genderLabel}</Text>
                  </View>
                ) : null}
                {handicapValue ? (
                  <View style={[styles.miniBadge, styles.roleBadge]}>
                    <Text style={[styles.miniBadgeText, styles.roleBadgeText]}>{handicapValue}</Text>
                  </View>
                ) : null}
                {recentScoreValue ? (
                  <View style={[styles.miniBadge, styles.statusPending]}>
                    <Text style={[styles.miniBadgeText, styles.statusBadgeText]}>{recentScoreValue}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    );
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="모임 상세" />
        <View style={styles.stateRow}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.stateText}>모임을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="모임 상세" />
        <View style={styles.stateRow}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="모임 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topActionRow}>
          <Pressable
            style={styles.iconGhostButton}
            onPress={() => Alert.alert('공유', '공유 기능은 준비 중입니다.')}
          >
            <FontAwesome5 name="share-alt" size={14} color={colors.neutral[500]} />
          </Pressable>
          <Pressable
            style={styles.iconGhostButton}
            onPress={() => Alert.alert('관심', '관심 등록 기능은 준비 중입니다.')}
          >
            <FontAwesome5 name="heart" size={14} color={colors.neutral[500]} />
          </Pressable>
        </View>

        <Card style={styles.card}>
          <View style={styles.meetingBadgeRow}>
            <View style={[styles.meetingTypeBadge, isRoundingMeeting ? styles.roundingTypeBadge : styles.socialTypeBadge]}>
              <Text style={[styles.meetingTypeBadgeText, isRoundingMeeting ? styles.roundingTypeBadgeText : styles.socialTypeBadgeText]}>
                {isRoundingMeeting ? '라운딩' : '소셜'}
              </Text>
            </View>
            <View
              style={[
                styles.meetingStatusBadge,
                {
                  backgroundColor: getToneStyle(meetingStatusMeta.tone).backgroundColor,
                  borderColor: getToneStyle(meetingStatusMeta.tone).borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.meetingStatusBadgeText,
                  { color: getToneStyle(meetingStatusMeta.tone).color },
                ]}
              >
                {meetingStatusMeta.label}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{meeting?.name || meeting?.meeting_name || '모임명 없음'}</Text>
          <Text style={styles.subtitle}>{meeting?.club_name || '-'}</Text>

          <View style={styles.topButtonsSection}>
            {hasTopActions ? (
              <View style={styles.topButtonsWrap}>
                {(canJoin || showJoinButtonForSocial) ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.topButtonBase,
                      styles.topButtonJoin,
                      pressed && styles.topButtonPressed,
                    ]}
                    onPress={openJoinModal}
                  >
                    <FontAwesome5 name="users" size={12} color={colors.white} />
                    <Text style={styles.topButtonText}>참가 신청</Text>
                  </Pressable>
                ) : null}

                {canLeave ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.topButtonBase,
                      styles.topButtonDanger,
                      !canLeaveActually && styles.topButtonDisabled,
                      pressed && canLeaveActually && styles.topButtonPressed,
                    ]}
                    onPress={() => {
                      if (canLeaveActually) {
                        handleLeave();
                      }
                    }}
                    disabled={!canLeaveActually}
                  >
                    <FontAwesome5 name="users" size={12} color={colors.white} />
                    <Text style={styles.topButtonText}>참가신청 취소</Text>
                  </Pressable>
                ) : null}

                {canEditTopActions ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.topButtonBase,
                        styles.topButtonEdit,
                        pressed && styles.topButtonPressed,
                      ]}
                      onPress={handleEditMeeting}
                    >
                      <FontAwesome5 name="edit" size={12} color={colors.white} />
                      <Text style={styles.topButtonText}>수정</Text>
                    </Pressable>

                    {isRoundingMeeting &&
                    normalizedStatus === 'SCHEDULED' &&
                    hasApplicationClosedEarlyFlag &&
                    !isApplicationDeadlinePassed ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.topButtonBase,
                          styles.topButtonWarning,
                          (processingAction || isApplicationClosedEarly || normalizedStatus === 'CANCELED') &&
                            styles.topButtonDisabled,
                          pressed && styles.topButtonPressed,
                        ]}
                        onPress={handleCloseApplicationEarly}
                        disabled={processingAction || isApplicationClosedEarly || normalizedStatus === 'CANCELED'}
                      >
                        <Text style={styles.topButtonText}>신청 마감하기</Text>
                      </Pressable>
                    ) : null}

                    {normalizedStatus === 'SCHEDULED' && !isMeetingTimePassed ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.topButtonBase,
                          styles.topButtonDanger,
                          pressed && styles.topButtonPressed,
                        ]}
                        onPress={handleCancelMeeting}
                      >
                        <FontAwesome5 name="times" size={12} color={colors.white} />
                        <Text style={styles.topButtonText}>모임 취소</Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.embeddedSection}>
            <Text style={styles.sectionHeading}>모임 정보</Text>
            <View style={styles.infoList}>
              {meetingInfoItems.map((item) => (
                <View key={item.key} style={styles.infoItemRow}>
                  <FontAwesome5 name={item.icon} size={13} color={colors.primary[600]} style={styles.infoIcon} />
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={[styles.infoValue, item.multiline && styles.infoValueMultiline]}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {costInfoItems.length > 0 ? (
            <View style={styles.embeddedSection}>
              <Text style={styles.sectionHeading}>비용 정보</Text>
              <View style={styles.infoList}>
                {costInfoItems.map((item) => (
                  <View key={item.key} style={styles.infoItemRow}>
                    <FontAwesome5 name="dollar-sign" size={13} color={colors.primary[600]} style={styles.infoIcon} />
                    <View style={styles.infoTextWrap}>
                      <Text style={styles.infoLabel}>{item.label}</Text>
                      <Text style={styles.infoValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </Card>

        {isRoundingMeeting && (
          <MeetingWorkflowStatus
            meeting={meeting}
            participants={participants}
            teams={teamsForWorkflow}
            userRole={userRole}
            applicationStatus={applicationStatus}
            confirmedParticipants={confirmedParticipants}
            onCloseApplicationEarly={handleCloseApplicationEarly}
            onAutoFormTeams={openTeamFormation}
            onConfirmTeamFormation={handleConfirmTeams}
            onStartRounding={handleStartRounding}
            onCompleteRounding={handleCompleteRounding}
            onCompleteMeeting={handleConfirmSettlement}
          />
        )}

        {!isRoundingMeeting ? (
          <Card style={styles.card}>
            <Text style={styles.sectionHeading}>모임 관리</Text>
            <Text style={styles.socialManageHint}>
              모임이 완료되면 정산 정보를 입력할 수 있습니다.
            </Text>
            {isManager &&
            String(meeting?.status || '').toUpperCase() === 'SCHEDULED' &&
            !meeting?.is_completed &&
            !meeting?.settlement_confirmed ? (
              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.manageActionButtonBase,
                    styles.manageActionButtonGreen,
                    processingAction && styles.manageActionButtonDisabled,
                    pressed && !processingAction && styles.manageActionButtonPressed,
                  ]}
                  onPress={handleCompleteMeeting}
                  disabled={processingAction}
                >
                  <FontAwesome5 name="check" size={12} color={colors.white} />
                  <Text style={[styles.manageActionTextBase, styles.manageActionTextWhite]}>
                    모임 완료
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </Card>
        ) : null}

        <Card style={styles.tabsContainerCard}>
          <View style={styles.tabRow}>
            {visibleTabs.map((tab) => {
              const disabled =
                tab.key === 'teams' &&
                (!canAccessTeamTab || (teams.length === 0 && !hasConfirmedTeams));

              return (
              <Pressable
                key={tab.key}
                onPress={handleTabPress(tab.key)}
                style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
                disabled={disabled}
              >
                <View style={styles.tabInner}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.tabTextActive,
                      disabled && styles.tabTextDisabled,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {tab.key === 'participants' ? (
                    <View style={[styles.tabCountChip, activeTab === tab.key && styles.tabCountChipActive]}>
                      <Text style={[styles.tabCountText, activeTab === tab.key && styles.tabCountTextActive]}>
                        {participants.length}
                      </Text>
                    </View>
                  ) : null}
                  {tab.key === 'teams' && isRoundingMeeting ? (
                    <View style={[styles.tabCountChip, activeTab === tab.key && styles.tabCountChipActive]}>
                      <Text style={[styles.tabCountText, activeTab === tab.key && styles.tabCountTextActive]}>
                        {teams.length}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
              );
            })}
          </View>

          <View style={styles.tabContentWrap}>
            {activeTab === 'participants' && (
              <View style={styles.tabSection}>
                {isManager && isRoundingMeeting ? (
              <View style={styles.participantSummaryCard}>
                <View style={styles.participantSummaryHeader}>
                  <View style={styles.participantSummaryHeaderText}>
                    <Text style={styles.participantSummaryTitle}>참가 신청 관리</Text>
                    {isRoundingMeeting ? (
                      <Text style={styles.participantSummaryDescription}>
                        참가자를 확인하고 조기 마감 또는 팀 편성을 진행할 수 있습니다.
                      </Text>
                    ) : null}
                  </View>
                  {isRoundingMeeting && isApplicationClosed ? (
                    <View style={styles.applicationClosedChip}>
                      <Text style={styles.applicationClosedChipText}>신청 마감됨</Text>
                    </View>
                  ) : null}
                </View>

                {isRoundingMeeting ? (
                  <View style={styles.participantManageActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.manageActionButtonBase,
                        styles.manageActionButtonAmberOutline,
                        !canCloseApplication && styles.manageActionButtonDisabled,
                        pressed && canCloseApplication && styles.manageActionButtonPressed,
                      ]}
                      onPress={handleCloseApplicationEarly}
                      disabled={!canCloseApplication}
                    >
                      <Text style={[styles.manageActionTextBase, styles.manageActionTextAmber]}>
                        신청 마감하기
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.manageActionButtonBase,
                        styles.manageActionButtonGreen,
                        !canModifyTeams && styles.manageActionButtonDisabled,
                        pressed && canModifyTeams && styles.manageActionButtonPressed,
                      ]}
                      onPress={handleOpenGuestModal}
                      disabled={!canModifyTeams}
                    >
                      <Text style={[styles.manageActionTextBase, styles.manageActionTextWhite]}>
                        게스트 추가
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.manageActionButtonBase,
                        styles.manageActionButtonBlue,
                        !canStartTeamFormation && styles.manageActionButtonDisabled,
                        pressed && canStartTeamFormation && styles.manageActionButtonPressed,
                      ]}
                      onPress={openTeamFormation}
                      disabled={!canStartTeamFormation}
                    >
                      <Text style={[styles.manageActionTextBase, styles.manageActionTextWhite]}>
                        팀 편성 시작
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.manageActionButtonBase,
                        styles.manageActionButtonPurple,
                        !canStartTeamFormation && styles.manageActionButtonDisabled,
                        pressed && canStartTeamFormation && styles.manageActionButtonPressed,
                      ]}
                      onPress={openBatchFormation}
                      disabled={!canStartTeamFormation}
                    >
                      <Text style={[styles.manageActionTextBase, styles.manageActionTextWhite]}>
                        일괄 편성
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.manageActionButtonBase,
                        styles.manageActionButtonIndigo,
                        (processingAction || meeting?.team_formation_confirmed_at !== null) &&
                          styles.manageActionButtonDisabled,
                        pressed &&
                          !(processingAction || meeting?.team_formation_confirmed_at !== null) &&
                          styles.manageActionButtonPressed,
                      ]}
                      onPress={openHistory}
                      disabled={processingAction || meeting?.team_formation_confirmed_at !== null}
                    >
                      <Text style={[styles.manageActionTextBase, styles.manageActionTextWhite]}>
                        편성 히스토리
                      </Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.manageActionButtonBase,
                        styles.manageActionButtonRoseTint,
                        (processingAction || normalizedStatus !== 'SCHEDULED') &&
                          styles.manageActionButtonDisabled,
                        pressed &&
                          !(processingAction || normalizedStatus !== 'SCHEDULED') &&
                          styles.manageActionButtonPressed,
                      ]}
                      onPress={handleCancelMeeting}
                      disabled={processingAction || normalizedStatus !== 'SCHEDULED'}
                    >
                      <Text style={[styles.manageActionTextBase, styles.manageActionTextRose]}>
                        모임 취소
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={styles.participantSummaryGrid}>
                  <View style={styles.participantSummaryItem}>
                    <Text style={styles.participantSummaryLabel}>전체 신청</Text>
                    <Text style={styles.participantSummaryValue}>
                      {applicationStatus?.total_applications ?? participants.length}명
                    </Text>
                  </View>
                  <View style={styles.participantSummaryItem}>
                    <Text style={styles.participantSummaryLabel}>확정 인원</Text>
                    <Text style={[styles.participantSummaryValue, styles.participantSummaryValueSuccess]}>
                      {confirmedCount}명
                    </Text>
                  </View>
                  <View style={styles.participantSummaryItem}>
                    <Text style={styles.participantSummaryLabel}>정원</Text>
                    <Text style={styles.participantSummaryValue}>
                      {meeting?.max_participants !== null && meeting?.max_participants !== undefined
                        ? `${meeting.max_participants}명`
                        : '-'}
                    </Text>
                  </View>
                </View>
              </View>
                ) : null}

                {participants.length === 0 ? (
                  <Text style={styles.emptyText}>참가자가 없습니다.</Text>
                ) : (
                  participants.map(renderParticipantRow)
                )}
              </View>
            )}

            {activeTab === 'teams' && isRoundingMeeting && (
              <View style={styles.tabSection}>
                {meeting?.team_formation_confirmed_at ? (
                  <View style={styles.teamConfirmedBanner}>
                    <Text style={styles.teamConfirmedText}>
                      편성 확정일: {formatDateTime(meeting.team_formation_confirmed_at)}
                    </Text>
                  </View>
                ) : null}
                {isManager && teams.length > 0 ? (
                  <View style={styles.teamEditRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.manageActionButtonBase,
                        styles.manageActionButtonBlue,
                        !canModifyTeams && styles.manageActionButtonDisabled,
                        pressed && canModifyTeams && styles.manageActionButtonPressed,
                      ]}
                      onPress={openTeamEditor}
                      disabled={!canModifyTeams}
                    >
                      <Text style={[styles.manageActionTextBase, styles.manageActionTextWhite]}>
                        팀 편성 수정
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
                {teams.length === 0 ? (
                  <View style={styles.teamEmptyState}>
                    <Text style={styles.emptyText}>생성된 팀이 없습니다.</Text>
                  </View>
                ) : (
                  teams.map(renderTeamCard)
                )}
              </View>
            )}

            {activeTab === 'settlement' && (
              settlementBlockedMessage ? (
                <View style={styles.tabSection}>
                  <Text style={styles.settlementBlockedTitle}>정산을 진행할 수 없습니다</Text>
                  <Text style={styles.settlementBlockedText}>{settlementBlockedMessage}</Text>
                </View>
              ) : (
                <SettlementManager
                  meetingId={meetingIdValue}
                  meetingType={meetingDomainType}
                  canSettle={canSettleMeeting}
                  canManageSettlement={canManageSettlement}
                  participants={
                    settlementConfirmedParticipants.length > 0
                      ? settlementConfirmedParticipants
                      : participants
                  }
                  onSettlementCreated={fetchMeeting}
                  onConfirmSettlement={handleConfirmSettlement}
                  meeting={meeting}
                />
              )
            )}

            {activeTab === 'my-settlement' && (
              <MySettlementView meetingId={meetingIdValue} />
            )}
          </View>
        </Card>
      </ScrollView>

      <RoundingJoinModal
        visible={joinModalOpen && isRoundingMeeting}
        onClose={closeJoinModal}
        meeting={meeting}
        userInfo={userInfo}
        setUserInfo={setUserInfo}
        userInfoLoading={userInfoLoading}
        handicapInfo={handicapInfo}
        handicapLoading={handicapLoading}
        isEditingUserInfo={isEditingUserInfo}
        onEditUserInfo={setIsEditingUserInfo}
        onUpdateUserInfo={handleUpdateUserInfo}
        onJoin={handleJoin}
        processingAction={processingAction}
      />

      <SocialJoinModal
        visible={joinModalOpen && !isRoundingMeeting}
        onClose={closeJoinModal}
        meeting={meeting}
        userInfo={userInfo}
        setUserInfo={setUserInfo}
        userInfoLoading={userInfoLoading}
        isEditingUserInfo={isEditingUserInfo}
        onEditUserInfo={setIsEditingUserInfo}
        onUpdateUserInfo={handleUpdateUserInfo}
        onJoin={handleJoin}
        processingAction={processingAction}
      />

      <Modal transparent visible={guestModalOpen} animationType="fade" onRequestClose={handleCloseGuestModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>게스트 추가</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>이름</Text>
              <TextInput
                value={guestForm.name}
                onChangeText={(value) => setGuestForm((prev) => ({ ...prev, name: value }))}
                style={styles.input}
                placeholder="게스트 이름"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>생년월일</Text>
              <TextInput
                value={guestForm.birthdate}
                onChangeText={(value) => setGuestForm((prev) => ({ ...prev, birthdate: normalizeBirthdateInput(value) }))}
                style={styles.input}
                placeholder="8글자 입력 (예: 20260205)"
                placeholderTextColor={colors.neutral[400]}
                keyboardType="number-pad"
                maxLength={8}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>성별</Text>
              <View style={styles.guestGenderRow}>
                <Pressable
                  style={[
                    styles.guestGenderChip,
                    guestForm.gender === 'MALE' && styles.guestGenderChipActive,
                  ]}
                  onPress={() => setGuestForm((prev) => ({ ...prev, gender: 'MALE' }))}
                >
                  <Text
                    style={[
                      styles.guestGenderText,
                      guestForm.gender === 'MALE' && styles.guestGenderTextActive,
                    ]}
                  >
                    남성
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.guestGenderChip,
                    guestForm.gender === 'FEMALE' && styles.guestGenderChipActive,
                  ]}
                  onPress={() => setGuestForm((prev) => ({ ...prev, gender: 'FEMALE' }))}
                >
                  <Text
                    style={[
                      styles.guestGenderText,
                      guestForm.gender === 'FEMALE' && styles.guestGenderTextActive,
                    ]}
                  >
                    여성
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.guestFieldRow}>
              <View style={styles.guestHalfField}>
                <Text style={styles.fieldLabel}>핸디캡</Text>
                <TextInput
                  value={guestForm.handicap}
                  onChangeText={(value) => setGuestForm((prev) => ({ ...prev, handicap: value }))}
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="예: 15.8"
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
              <View style={[styles.guestHalfField, styles.guestHalfFieldLast]}>
                <Text style={styles.fieldLabel}>평균타수</Text>
                <TextInput
                  value={guestForm.average_score}
                  onChangeText={(value) => setGuestForm((prev) => ({ ...prev, average_score: value }))}
                  style={styles.input}
                  keyboardType="number-pad"
                  placeholder="예: 95"
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <Button size="sm" variant="outline" onPress={handleCloseGuestModal}>
                닫기
              </Button>
              <Button size="sm" onPress={handleGuestSubmit} loading={processingAction}>
                추가
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <TeamFormationModal
        visible={teamFormationOpen}
        onClose={closeTeamFormation}
        onFormTeams={handleAutoFormTeams}
        meeting={meeting}
        processing={processingAction}
        onOpenBatch={openBatchFormation}
      />

      <TeamFormationPreviewModal
        visible={teamPreviewOpen}
        onClose={closeTeamPreview}
        teams={previewTeams}
        formationMode={meeting?.team_formation_mode}
        teamSize={meeting?.team_size || 4}
        onConfirm={handleConfirmTeams}
        onReform={handleReformTeams}
        onSaveHistory={handleSaveHistory}
        processing={processingAction}
      />

      <TeamEditorModal
        visible={teamEditorOpen}
        onClose={closeTeamEditor}
        teams={teams}
        participants={participants}
        meetingId={meetingIdValue}
        onSave={handleTeamsSave}
        processing={processingAction}
      />

      <BatchFormationModal
        visible={batchFormationOpen}
        onClose={closeBatchFormation}
        meeting={meeting}
        onFormTeams={handleAutoFormTeams}
        onViewDetail={handleBatchViewDetail}
        processing={processingAction}
      />

      <FormationHistoryModal
        visible={historyOpen}
        onClose={closeHistory}
        history={formationHistory}
        onRestore={handleRestoreHistory}
        onViewDetail={handleHistoryViewDetail}
        processing={processingAction}
      />

      <RoundingCompleteModal
        visible={roundingCompleteOpen}
        onClose={closeRoundingComplete}
        onInputNow={openScoreModal}
        onInputLater={handleInputLater}
      />

      <SimpleScoreInputModal
        visible={scoreModalOpen}
        onClose={closeScoreModal}
        meetingId={meetingIdValue}
        participantId={myParticipantId}
        currentHandicap={currentHandicap}
        onSuccess={handleScoreSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: tokens.spacing.xs2,
  },
  iconGhostButton: {
    width: 30,
    height: 30,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: tokens.spacing.md,
  },
  meetingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: tokens.spacing.xs2,
  },
  meetingTypeBadge: {
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    borderWidth: 1,
  },
  roundingTypeBadge: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[600],
  },
  socialTypeBadge: {
    backgroundColor: colors.info[50],
    borderColor: colors.info[600],
  },
  meetingTypeBadgeText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  roundingTypeBadgeText: {
    color: colors.success[700],
  },
  socialTypeBadgeText: {
    color: colors.info[700],
  },
  meetingStatusBadge: {
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    borderWidth: 1,
  },
  meetingStatusBadgeText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  title: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xxs,
  },
  subtitle: { ...base.textSmSubtle, marginBottom: tokens.spacing.sm2 },
  topButtonsSection: {
    marginBottom: tokens.spacing.xs2,
  },
  topButtonsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topButtonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
  },
  topButtonJoin: {
    backgroundColor: colors.success[600],
  },
  topButtonEdit: {
    backgroundColor: colors.primary[600],
  },
  topButtonWarning: {
    backgroundColor: colors.warning[600],
  },
  topButtonDanger: {
    backgroundColor: colors.error[600],
  },
  topButtonPressed: {
    opacity: 0.9,
  },
  topButtonDisabled: {
    opacity: 0.55,
  },
  topButtonText: {
    fontSize: tokens.font.xs,
    color: colors.white,
    fontWeight: tokens.fontWeight.semibold,
  },
  primaryActionRow: {
    marginTop: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  primaryActionButton: {
    alignSelf: 'flex-start',
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
  },
  managerActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: tokens.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: tokens.spacing.xs2,
  },
  manageActionButtonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
  },
  manageActionButtonPressed: {
    opacity: 0.9,
  },
  manageActionButtonDisabled: {
    opacity: 0.5,
  },
  manageActionButtonAmberOutline: {
    borderWidth: 1,
    borderColor: colors.warning[600],
    backgroundColor: colors.warning[50],
  },
  manageActionButtonGreen: {
    backgroundColor: colors.green[600],
  },
  manageActionButtonBlue: {
    backgroundColor: colors.blue[600],
  },
  manageActionButtonPurple: {
    backgroundColor: colors.violet[600],
  },
  manageActionButtonIndigo: {
    backgroundColor: colors.accent[700],
  },
  manageActionButtonRoseTint: {
    backgroundColor: colors.error[100],
  },
  manageActionTextBase: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  manageActionTextWhite: {
    color: colors.white,
  },
  manageActionTextAmber: {
    color: colors.warning[700],
  },
  manageActionTextRose: {
    color: colors.error[600],
  },
  embeddedSection: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    padding: tokens.padding.sm,
    marginTop: tokens.spacing.sm2,
  },
  sectionHeading: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm2,
  },
  infoList: {
    gap: tokens.spacing.xs2,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginTop: 3,
    marginRight: 8,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
    fontWeight: tokens.fontWeight.semibold,
  },
  infoValueMultiline: {
    lineHeight: 19,
  },
  tabsContainerCard: {
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tabButton: {
    flex: 1,
    minWidth: 90,
    paddingHorizontal: tokens.padding.xs2,
    paddingVertical: tokens.padding.sm,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[600],
  },
  tabText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  tabTextActive: {
    color: colors.primary[600],
  },
  tabTextDisabled: {
    color: colors.neutral[300],
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabCountChip: {
    borderRadius: tokens.radius.pill,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountChipActive: {
    backgroundColor: colors.neutral[100],
  },
  tabCountText: {
    fontSize: tokens.font.xxs,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.bold,
  },
  tabCountTextActive: {
    color: colors.neutral[700],
  },
  tabContentWrap: {
    padding: tokens.padding.md,
  },
  tabSection: {
    gap: tokens.spacing.sm2,
  },
  socialManageHint: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    marginBottom: tokens.spacing.xs2,
  },
  participantSummaryCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.sm,
  },
  participantSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: tokens.spacing.xs2,
  },
  participantSummaryHeaderText: {
    flex: 1,
  },
  participantSummaryTitle: {
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
    fontWeight: tokens.fontWeight.bold,
  },
  participantSummaryDescription: {
    marginTop: 2,
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  applicationClosedChip: {
    borderRadius: tokens.radius.pill,
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[600],
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  applicationClosedChipText: {
    fontSize: tokens.font.xxs,
    color: colors.warning[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  participantManageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: tokens.spacing.sm,
  },
  participantSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantSummaryItem: {
    minWidth: 90,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.sm,
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.xs2,
    paddingVertical: tokens.padding.xs,
  },
  participantSummaryLabel: {
    fontSize: tokens.font.xxs,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  participantSummaryValue: {
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
    fontWeight: tokens.fontWeight.bold,
  },
  participantSummaryValueSuccess: {
    color: colors.success[700],
  },
  participantCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.xs2,
  },
  participantTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.pill,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.xs2,
  },
  participantMain: {
    flexDirection: 'column',
    flex: 1,
  },
  participantName: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
  },
  participantSubText: {
    marginTop: 2,
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  participantBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  miniBadge: {
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  miniBadgeText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
  genderBadge: {
    backgroundColor: colors.info[50],
  },
  genderBadgeText: {
    color: colors.info[700],
  },
  roleBadge: {
    backgroundColor: colors.success[50],
  },
  roleBadgeText: {
    color: colors.success[700],
  },
  statusConfirmed: {
    backgroundColor: colors.success[50],
  },
  statusPending: {
    backgroundColor: colors.warning[50],
  },
  statusRejected: {
    backgroundColor: colors.error[50],
  },
  statusBadgeText: {
    color: colors.neutral[800],
  },
  participantActionRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  participantActionButton: {
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
  },
  participantApproveButton: {
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[600],
  },
  participantRejectButton: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[600],
  },
  participantActionText: {
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  emptyText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  teamCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
    marginTop: tokens.spacing.sm,
  },
  teamConfirmedBanner: {
    borderWidth: 1,
    borderColor: colors.success[200],
    borderRadius: tokens.radius.sm,
    backgroundColor: colors.success[50],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  teamConfirmedText: {
    fontSize: tokens.font.xs,
    color: colors.success[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  teamEditRow: {
    alignItems: 'flex-end',
    marginBottom: tokens.spacing.xs2,
  },
  teamEmptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
    paddingVertical: tokens.padding.xl,
    paddingHorizontal: tokens.padding.md,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  teamCount: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    fontWeight: tokens.fontWeight.semibold,
  },
  teamTitle: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  teamMemberCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.sm,
    backgroundColor: colors.white,
    padding: tokens.padding.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  teamMember: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    marginBottom: tokens.spacing.xxs,
  },
  teamMemberBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  settlementBlockedTitle: {
    fontSize: tokens.font.base,
    color: colors.error[700],
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing.xs,
  },
  settlementBlockedText: {
    fontSize: tokens.font.sm,
    color: colors.error[600],
    lineHeight: 20,
  },
  stateRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    paddingHorizontal: tokens.padding.md,
  },
  modalCard: {
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.white,
    padding: tokens.padding.md,
  },
  modalTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.sm2,
  },
  fieldGroup: {
    marginBottom: tokens.spacing.sm2,
  },
  fieldLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
    marginBottom: tokens.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.sm,
    backgroundColor: colors.white,
    color: colors.neutral[900],
    fontSize: tokens.font.sm,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
  },
  guestGenderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  guestGenderChip: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.baseLg,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    backgroundColor: colors.white,
  },
  guestGenderChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  guestGenderText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  guestGenderTextActive: {
    color: colors.white,
  },
  guestFieldRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm2,
  },
  guestHalfField: {
    flex: 1,
  },
  guestHalfFieldLast: {
    marginLeft: 8,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: tokens.spacing.xs,
  },
  errorText: base.textSmError,
});
