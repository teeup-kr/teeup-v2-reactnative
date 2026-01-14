import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView, StyleSheet, Text,
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
import {
  autoFormTeams,
  closeApplicationEarly,
  completeRounding,
  confirmSettlement,
  confirmTeamFormation,
  fetchApplicationStatus,
  fetchRound,
  fetchRoundParticipants,
  fetchRoundTeams,
  fetchSocial,
  joinRound,
  joinSocial,
  leaveRound,
  leaveSocial,
  startRounding,
} from '@/lib/api/meetings';
import { fetchMyProfile, fetchUserHandicap, updateMyProfile } from '@/lib/api/mypage';
import { extractData, extractList, formatDateTime } from '@/lib/meetingUtils';
import {
  createAutoFormTeamsHandler,
  createCompleteRoundingHandler,
  createConfirmSettlementHandler,
  createConfirmTeamsHandler,
  createFetchApplicationStatusHandler,
  createFetchMeetingHandler,
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
} from '@/lib/render/meetings/detail';
import {
  buildUserInfoFromProfile,
  getCurrentHandicap,
  getIsJoined,
  getMeetingDomainType,
  getMyParticipantId,
  getTypeSlug,
  getUserRole,
} from '@/lib/value/meetingDetail';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function MeetingDetailScreen() {
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
        fetchMyProfile,
        fetchUserHandicap,
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
      createFetchMeetingHandler({
        meetingIdValue,
        typeSlug,
        fetchSocial,
        fetchRound,
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
        fetchRoundParticipants,
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
        fetchRoundTeams,
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
        fetchApplicationStatus,
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
        updateMyProfile,
        setProcessingAction,
        setIsEditingUserInfo,
        fetchUserInfo,
        alert: Alert.alert,
      }),
    [userInfo, setProcessingAction, setIsEditingUserInfo, fetchUserInfo]
  );

  const handleJoin = useMemo(
    () =>
      createJoinHandler({
        typeSlug,
        meetingIdValue,
        joinSocial,
        joinRound,
        setJoinModalOpen,
        setProcessingAction,
        fetchParticipants,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [typeSlug, meetingIdValue, setJoinModalOpen, setProcessingAction, fetchParticipants, fetchMeeting]
  );

  const handleLeave = useMemo(
    () =>
      createLeaveHandler({
        typeSlug,
        meetingIdValue,
        leaveSocial,
        leaveRound,
        setProcessingAction,
        fetchParticipants,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [typeSlug, meetingIdValue, setProcessingAction, fetchParticipants, fetchMeeting]
  );

  const handleAutoFormTeams = useMemo(
    () =>
      createAutoFormTeamsHandler({
        meetingIdValue,
        autoFormTeams,
        extractList,
        setProcessingAction,
        setPreviewTeams,
        setTeamPreviewOpen,
        setTeams,
        alert: Alert.alert,
      }),
    [meetingIdValue, setProcessingAction, setPreviewTeams, setTeamPreviewOpen, setTeams]
  );

  const handleConfirmTeams = useMemo(
    () =>
      createConfirmTeamsHandler({
        meetingIdValue,
        confirmTeamFormation,
        setProcessingAction,
        setTeamPreviewOpen,
        fetchTeams,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [meetingIdValue, setProcessingAction, setTeamPreviewOpen, fetchTeams, fetchMeeting]
  );

  const handleStartRounding = useMemo(
    () =>
      createStartRoundingHandler({
        meetingIdValue,
        startRounding,
        setProcessingAction,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [meetingIdValue, setProcessingAction, fetchMeeting]
  );

  const handleCompleteRounding = useMemo(
    () =>
      createCompleteRoundingHandler({
        meetingIdValue,
        completeRounding,
        setProcessingAction,
        setRoundingCompleteOpen,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [meetingIdValue, setProcessingAction, setRoundingCompleteOpen, fetchMeeting]
  );

  const handleConfirmSettlement = useMemo(
    () =>
      createConfirmSettlementHandler({
        meetingIdValue,
        confirmSettlement,
        setProcessingAction,
        fetchMeeting,
        alert: Alert.alert,
      }),
    [meetingIdValue, setProcessingAction, fetchMeeting]
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
    () => createTabPressHandler({ setActiveTab }),
    [setActiveTab]
  );

  const handleReformTeams = useMemo(
    () => () => handleAutoFormTeams({ preview: true }),
    [handleAutoFormTeams]
  );

  const handleCloseApplicationEarly = useMemo(
    () => () => closeApplicationEarly(meetingIdValue),
    [meetingIdValue]
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
  const handleTeamsSave = useMemo(() => (updatedTeams) => setTeams(updatedTeams), [setTeams]);

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

  const renderParticipantRow = useCallback(function renderParticipantRow(participant, index) {
    return (
      <View key={participant.id || index} style={styles.participantRow}>
        <Text style={styles.participantName}>
          {participant.user_name || participant.name || '참가자'}
        </Text>
        <Text style={styles.participantRole}>{participant.status || '-'}</Text>
      </View>
    );
  }, []);

  const renderTeamCard = useCallback(function renderTeamCard(team, index) {
    return (
      <View key={team.id || index} style={styles.teamCard}>
        <Text style={styles.teamTitle}>{team.name || `팀 ${index + 1}`}</Text>
        {(team.members || team.team_members || []).map((member, memberIndex) => (
          <Text key={member.id || memberIndex} style={styles.teamMember}>
            {member.user_name || member.name || member.guest_name || '멤버'}
          </Text>
        ))}
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

  const isJoined = getIsJoined({ participants, user });
  const userRole = getUserRole({ meeting, user });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="모임 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>{meeting?.name || meeting?.meeting_name || '모임명 없음'}</Text>
          <Text style={styles.subtitle}>{meeting?.club_name || '-'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <FontAwesome5 name="calendar-alt" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText}>{formatDateTime(meeting?.meeting_time)}</Text>
            </View>
            <View style={styles.metaItem}>
              <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText}>{meeting?.location || meeting?.venue_name || '-'}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <FontAwesome5 name="users" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText}>
                {meeting?.participant_count || participants.length || 0}명 참여
              </Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            {!isJoined ? (
              <Button size="sm" onPress={openJoinModal}>
                참가 신청
              </Button>
            ) : (
              <Button size="sm" variant="outline" onPress={handleLeave}>
                참가 취소
              </Button>
            )}
            {isRoundingMeeting && meeting?.rounding_completed_at && (
              <Button size="sm" variant="outline" onPress={openScoreModal}>
                점수 입력
              </Button>
            )}
          </View>
        </Card>

        {isRoundingMeeting && (
          <MeetingWorkflowStatus
            meeting={meeting}
            participants={participants}
            teams={teams}
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

        <View style={styles.tabRow}>
          {meetingDetailTabs
            .filter((tab) => (isRoundingMeeting ? true : tab.key === 'participants'))
            .map((tab) => (
              <Pressable
                key={tab.key}
                onPress={handleTabPress(tab.key)}
                style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
        </View>

        {activeTab === 'participants' && (
          <Card style={styles.card}>
            {participants.length === 0 ? (
              <Text style={styles.emptyText}>참가자가 없습니다.</Text>
            ) : (
              participants.map(renderParticipantRow)
            )}
          </Card>
        )}

        {activeTab === 'teams' && isRoundingMeeting && (
          <Card style={styles.card}>
            <View style={styles.actionRow}>
              <Button size="sm" variant="outline" onPress={openTeamFormation}>
                팀 편성
              </Button>
              <Button size="sm" variant="outline" onPress={openTeamEditor}>
                팀 편집
              </Button>
              <Button size="sm" variant="outline" onPress={openHistory}>
                히스토리
              </Button>
            </View>
            {teams.length === 0 ? (
              <Text style={styles.emptyText}>편성된 팀이 없습니다.</Text>
            ) : (
              teams.map(renderTeamCard)
            )}
          </Card>
        )}

        {activeTab === 'settlement' && isRoundingMeeting && (
          <SettlementManager
            meetingId={meetingIdValue}
            meetingType={meetingDomainType}
            canSettle
            canManageSettlement
            participants={confirmedParticipants}
            onSettlementCreated={fetchMeeting}
            onConfirmSettlement={handleConfirmSettlement}
            meeting={meeting}
          />
        )}

        {activeTab === 'my-settlement' && isRoundingMeeting && (
          <MySettlementView meetingId={meetingIdValue} />
        )}
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
  card: {
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xxs,
  },
  subtitle: { ...base.textSmSubtle, marginBottom: tokens.spacing.sm2 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: tokens.spacing.xs2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: tokens.spacing.xs2,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm2,
    flexWrap: 'wrap',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.neutral[100],
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  tabTextActive: {
    color: colors.white,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: tokens.padding.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  participantName: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
  },
  participantRole: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
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
  teamTitle: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  teamMember: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    marginBottom: tokens.spacing.xxs,
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
  errorText: base.textSmError,
});
