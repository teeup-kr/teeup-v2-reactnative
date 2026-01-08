import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
import { roundsApi, socialsApi, usersApi } from '@/lib/api';
import { extractData, extractList, formatDateTime } from '@/lib/meetingUtils';
import { colors } from '@/theme/colors';

export default function MeetingDetailScreen() {
  const { meetingType, meetingId } = useLocalSearchParams();
  const meetingIdValue = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const typeSlug = meetingType === 'social' ? 'social' : 'rounding';
  const meetingDomainType = typeSlug === 'social' ? 'SOCIAL' : 'ROUND';
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

  const myParticipantId = useMemo(() => {
    if (!user?.id) return null;
    const match = participants.find((participant) => participant.user_id === user.id);
    return match?.id || null;
  }, [participants, user]);

  const currentHandicap = useMemo(() => {
    return handicapInfo?.calculated_handicap ?? handicapInfo?.initial_handicap ?? null;
  }, [handicapInfo]);

  const fetchUserInfo = useCallback(async () => {
    try {
      setUserInfoLoading(true);
      const response = await usersApi.getMyProfile();
      const profile = extractData(response);
      setUser(profile);
      setUserInfo({
        realname: profile?.realname || '',
        average_score: profile?.average_score || '',
        phone_number: profile?.phone_number || '',
        birthdate: profile?.birthdate ? profile.birthdate.split('T')[0] : '',
        gender: profile?.gender || '',
        handicap: '',
      });

      if (profile?.id) {
        setHandicapLoading(true);
        const handicapResponse = await usersApi.getUserHandicap(profile.id);
        setHandicapInfo(extractData(handicapResponse));
      }
    } catch (fetchError) {
      console.error('사용자 정보 조회 실패:', fetchError);
    } finally {
      setUserInfoLoading(false);
      setHandicapLoading(false);
    }
  }, []);

  const fetchMeeting = useCallback(async () => {
    if (!meetingIdValue) return;

    try {
      setLoading(true);
      setError(null);
      const response =
        typeSlug === 'social'
          ? await socialsApi.getSocial(meetingIdValue)
          : await roundsApi.getRound(meetingIdValue);
      const data = extractData(response);
      setMeeting(data);
    } catch (fetchError) {
      console.error('모임 조회 실패:', fetchError);
      setError('모임 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [meetingIdValue, typeSlug]);

  const fetchParticipants = useCallback(async () => {
    if (!meetingIdValue) return;

    try {
      if (typeSlug === 'social') {
        setParticipants(extractList(meeting?.participants));
        return;
      }

      const response = await roundsApi.getRoundParticipants(meetingIdValue);
      const list = extractList(response);
      setParticipants(list);
      setConfirmedParticipants(list.filter((participant) => participant.status === 'CONFIRMED'));
    } catch (fetchError) {
      console.error('참가자 조회 실패:', fetchError);
    }
  }, [meetingIdValue, meeting, typeSlug]);

  const fetchTeams = useCallback(async () => {
    if (!meetingIdValue || !isRoundingMeeting) return;

    try {
      const response = await roundsApi.getRoundTeams(meetingIdValue);
      setTeams(extractList(response));
    } catch (fetchError) {
      console.error('팀 조회 실패:', fetchError);
    }
  }, [meetingIdValue, isRoundingMeeting]);

  const fetchApplicationStatus = useCallback(async () => {
    if (!meetingIdValue || !isRoundingMeeting) return;
    try {
      const response = await roundsApi.getApplicationStatus(meetingIdValue);
      setApplicationStatus(extractData(response));
    } catch (fetchError) {
      console.error('신청 상태 조회 실패:', fetchError);
    }
  }, [meetingIdValue, isRoundingMeeting]);

  useEffect(() => {
    fetchUserInfo();
    fetchMeeting();
  }, [fetchMeeting, fetchUserInfo]);

  useEffect(() => {
    fetchParticipants();
    fetchTeams();
    fetchApplicationStatus();
  }, [fetchParticipants, fetchTeams, fetchApplicationStatus]);

  const handleUpdateUserInfo = async () => {
    try {
      setProcessingAction(true);
      await usersApi.updateMyProfile({
        realname: userInfo.realname,
        average_score: userInfo.average_score ? Number(userInfo.average_score) : null,
        phone_number: userInfo.phone_number || null,
        birthdate: userInfo.birthdate || null,
        gender: userInfo.gender || null,
      });
      setIsEditingUserInfo(false);
      fetchUserInfo();
    } catch (updateError) {
      Alert.alert('오류', updateError?.message || '회원정보 수정에 실패했습니다.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleJoin = async () => {
    try {
      setProcessingAction(true);
      if (typeSlug === 'social') {
        await socialsApi.joinSocial(meetingIdValue);
      } else {
        await roundsApi.joinRound(meetingIdValue);
      }
      setJoinModalOpen(false);
      fetchParticipants();
      fetchMeeting();
    } catch (joinError) {
      Alert.alert('오류', joinError?.message || '참가 신청에 실패했습니다.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert('참가 취소', '참가를 취소하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        onPress: async () => {
          try {
            setProcessingAction(true);
            if (typeSlug === 'social') {
              await socialsApi.leaveSocial(meetingIdValue);
            } else {
              await roundsApi.leaveRound(meetingIdValue);
            }
            fetchParticipants();
            fetchMeeting();
          } catch (leaveError) {
            Alert.alert('오류', leaveError?.message || '참가 취소에 실패했습니다.');
          } finally {
            setProcessingAction(false);
          }
        },
      },
    ]);
  };

  const handleAutoFormTeams = async (payload = {}) => {
    if (!meetingIdValue) return null;
    try {
      setProcessingAction(true);
      const response = await roundsApi.autoFormTeams(meetingIdValue, payload);
      const teamsData = extractList(response?.teams || response?.data?.teams || response);
      if (payload.preview || payload.batchMode) {
        setPreviewTeams(teamsData);
        setTeamPreviewOpen(true);
      } else {
        setTeams(teamsData);
      }
      return response;
    } catch (formationError) {
      Alert.alert('오류', formationError?.message || '팀 편성에 실패했습니다.');
      return null;
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmTeams = async () => {
    if (!meetingIdValue) return;
    try {
      setProcessingAction(true);
      await roundsApi.confirmTeamFormation(meetingIdValue);
      setTeamPreviewOpen(false);
      fetchTeams();
      fetchMeeting();
    } catch (confirmError) {
      Alert.alert('오류', confirmError?.message || '팀 편성 확정에 실패했습니다.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleStartRounding = async () => {
    if (!meetingIdValue) return;
    try {
      setProcessingAction(true);
      await roundsApi.startRounding(meetingIdValue);
      fetchMeeting();
    } catch (startError) {
      Alert.alert('오류', startError?.message || '모임 진행 시작에 실패했습니다.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCompleteRounding = async () => {
    if (!meetingIdValue) return;
    try {
      setProcessingAction(true);
      await roundsApi.completeRounding(meetingIdValue);
      setRoundingCompleteOpen(true);
      fetchMeeting();
    } catch (completeError) {
      Alert.alert('오류', completeError?.message || '라운딩 종료에 실패했습니다.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmSettlement = async () => {
    if (!meetingIdValue) return;
    try {
      setProcessingAction(true);
      await roundsApi.confirmSettlement(meetingIdValue);
      fetchMeeting();
    } catch (settlementError) {
      Alert.alert('오류', settlementError?.message || '정산 확정에 실패했습니다.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSaveHistory = () => {
    if (!previewTeams.length) return;
    setFormationHistory((prev) => [
      {
        id: Date.now(),
        title: `편성 ${prev.length + 1}`,
        created_at: new Date().toLocaleString('ko-KR'),
        teams: previewTeams,
      },
      ...prev,
    ]);
  };

  const handleRestoreHistory = (item) => {
    if (item?.teams) {
      setTeams(item.teams);
    }
  };

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

  const isJoined = participants.some((participant) => participant.user_id === user?.id);
  const userRole = meeting?.user_role || meeting?.role || user?.role;

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
              <Text style={styles.metaText}>{meeting?.participant_count || participants.length || 0}명 참여</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            {!isJoined ? (
              <Button size="sm" onPress={() => setJoinModalOpen(true)}>
                참가 신청
              </Button>
            ) : (
              <Button size="sm" variant="outline" onPress={handleLeave}>
                참가 취소
              </Button>
            )}
            {isRoundingMeeting && meeting?.rounding_completed_at && (
              <Button size="sm" variant="outline" onPress={() => setScoreModalOpen(true)}>
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
            onCloseApplicationEarly={() => roundsApi.closeApplicationEarly(meetingIdValue)}
            onAutoFormTeams={() => setTeamFormationOpen(true)}
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
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            ))}
        </View>

        {activeTab === 'participants' && (
          <Card style={styles.card}>
            {participants.length === 0 ? (
              <Text style={styles.emptyText}>참가자가 없습니다.</Text>
            ) : (
              participants.map((participant, index) => (
                <View key={participant.id || index} style={styles.participantRow}>
                  <Text style={styles.participantName}>{participant.user_name || participant.name || '참가자'}</Text>
                  <Text style={styles.participantRole}>{participant.status || '-'}</Text>
                </View>
              ))
            )}
          </Card>
        )}

        {activeTab === 'teams' && isRoundingMeeting && (
          <Card style={styles.card}>
            <View style={styles.actionRow}>
              <Button size="sm" variant="outline" onPress={() => setTeamFormationOpen(true)}>
                팀 편성
              </Button>
              <Button size="sm" variant="outline" onPress={() => setTeamEditorOpen(true)}>
                팀 편집
              </Button>
              <Button size="sm" variant="outline" onPress={() => setHistoryOpen(true)}>
                히스토리
              </Button>
            </View>
            {teams.length === 0 ? (
              <Text style={styles.emptyText}>편성된 팀이 없습니다.</Text>
            ) : (
              teams.map((team, index) => (
                <View key={team.id || index} style={styles.teamCard}>
                  <Text style={styles.teamTitle}>{team.name || `팀 ${index + 1}`}</Text>
                  {(team.members || team.team_members || []).map((member, memberIndex) => (
                    <Text key={member.id || memberIndex} style={styles.teamMember}>
                      {member.user_name || member.name || member.guest_name || '멤버'}
                    </Text>
                  ))}
                </View>
              ))
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
            onSettlementCreated={() => fetchMeeting()}
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
        onClose={() => setJoinModalOpen(false)}
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
        onClose={() => setJoinModalOpen(false)}
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
        onClose={() => setTeamFormationOpen(false)}
        onFormTeams={handleAutoFormTeams}
        meeting={meeting}
        processing={processingAction}
        onOpenBatch={() => setBatchFormationOpen(true)}
      />

      <TeamFormationPreviewModal
        visible={teamPreviewOpen}
        onClose={() => setTeamPreviewOpen(false)}
        teams={previewTeams}
        formationMode={meeting?.team_formation_mode}
        teamSize={meeting?.team_size || 4}
        onConfirm={handleConfirmTeams}
        onReform={() => handleAutoFormTeams({ preview: true })}
        onSaveHistory={handleSaveHistory}
        processing={processingAction}
      />

      <TeamEditorModal
        visible={teamEditorOpen}
        onClose={() => setTeamEditorOpen(false)}
        teams={teams}
        participants={participants}
        meetingId={meetingIdValue}
        onSave={(updatedTeams) => setTeams(updatedTeams)}
        processing={processingAction}
      />

      <BatchFormationModal
        visible={batchFormationOpen}
        onClose={() => setBatchFormationOpen(false)}
        meeting={meeting}
        onFormTeams={handleAutoFormTeams}
        onViewDetail={(result) => {
          setPreviewTeams(result.teams || []);
          setTeamPreviewOpen(true);
        }}
        processing={processingAction}
      />

      <FormationHistoryModal
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={formationHistory}
        onRestore={handleRestoreHistory}
        onViewDetail={(item) => {
          setPreviewTeams(item.teams || []);
          setTeamPreviewOpen(true);
        }}
        processing={processingAction}
      />

      <RoundingCompleteModal
        visible={roundingCompleteOpen}
        onClose={() => setRoundingCompleteOpen(false)}
        onInputNow={() => setScoreModalOpen(true)}
        onInputLater={() => setScoreModalOpen(false)}
      />

      <SimpleScoreInputModal
        visible={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        meetingId={meetingIdValue}
        participantId={myParticipantId}
        currentHandicap={currentHandicap}
        onSuccess={() => {
          setScoreModalOpen(false);
          fetchMeeting();
          fetchParticipants();
        }}
      />
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
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.white,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  participantName: {
    fontSize: 12,
    color: colors.neutral[800],
  },
  participantRole: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  emptyText: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  teamCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  teamTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  teamMember: {
    fontSize: 12,
    color: colors.neutral[700],
    marginBottom: 4,
  },
  stateRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});
