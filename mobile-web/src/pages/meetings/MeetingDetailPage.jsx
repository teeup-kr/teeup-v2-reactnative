import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  FaArrowLeft,
  FaShare,
  FaHeart,
  FaRegHeart,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaGolfBall,
  FaUsers,
  FaDollarSign,
  FaEdit,
  FaUserEdit,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaClock,
  FaStickyNote,
  FaClipboardList,
  FaUser,
  FaUserTie,
  FaInfoCircle,
  FaCheckCircle,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { roundsApi, socialsApi, usersApi, api, clubsApi } from '../../lib/api';
import MeetingWorkflowStatus from '../../components/meetings/MeetingWorkflowStatus';
import SettlementManager from '../../components/meetings/SettlementManager';
import MySettlementView from '../../components/meetings/MySettlementView';
import TeamFormationModal from '../../components/meetings/TeamFormationModal';
import TeamFormationPreviewModal from '../../components/meetings/TeamFormationPreviewModal';
import TeamEditorModal from '../../components/meetings/TeamEditorModal';
import BatchFormationModal from '../../components/meetings/BatchFormationModal';
import FormationHistoryModal from '../../components/meetings/FormationHistoryModal';
import RoundingCompleteModal from '../../components/meetings/RoundingCompleteModal';
import SimpleScoreInputModal from '../../components/meetings/SimpleScoreInputModal';
import RoundingJoinModal from '../../components/meetings/RoundingJoinModal';
import SocialJoinModal from '../../components/meetings/SocialJoinModal';

const TAB_CONFIG = [
  { key: 'participants', label: '참가자' },
  { key: 'teams', label: '팀' },
  { key: 'settlement', label: '정산' },
];

const extractData = (payload) => {
  if (!payload) return null;
  if (payload.data && Object.keys(payload).length === 1) {
    return payload.data;
  }
  return payload.data ?? payload;
};

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const extractUserProfile = (payload) => {
  if (!payload) return null;
  if (payload.id && payload.email) return payload;
  if (payload.data && payload.data.id) return payload.data;
  return payload;
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '미정';
  return `${Number(value).toLocaleString()}원`;
};

const formatDatetime = (value) => {
  if (!value) return '-';
  try {
    // 백엔드에서 한국 시간으로 저장되어 있으므로 그대로 사용
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      console.warn('formatDatetime: Invalid date', value);
      return value;
    }
    return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  } catch (err) {
    console.error('formatDatetime error:', err, value);
    return value;
  }
};

const isPastDateTime = (value) => {
  if (!value) return false;
  try {
    // 백엔드에서 한국 시간(KST)으로 저장되어 있으므로 로컬 타임존으로 해석 (한국에서 실행하면 KST)
    const deadlineDate = new Date(value);
    if (Number.isNaN(deadlineDate.getTime())) return false;
    
    // 현재 시간을 가져옴 (로컬 타임존, 한국에서 실행하면 KST)
    const now = new Date();
    
    // 둘 다 로컬 타임존(한국에서 실행하면 KST)이므로 직접 비교
    return deadlineDate.getTime() <= now.getTime();
  } catch {
    return false;
  }
};

const isPastDate = (value) => {
  if (!value) return false;
  try {
    const date = new Date(value);
    const today = new Date();
    // 날짜만 비교 (시간 제외)
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // 라운딩 모임은 날짜만 의미가 있으므로, 오늘 날짜는 아직 지나지 않은 것으로 봄 (<)
    return dateOnly.getTime() < todayOnly.getTime();
  } catch {
    return false;
  }
};

const TEAM_FORMATION_MODE_LABELS = {
  MIXED: '혼성',
  GENDER_SEPARATED: '성별 분리',
  GENDER_SEPARATED_HANDICAP: '성별 분리 + 핸디캡 기준',
  GENDER_SEPARATED_PREVIOUS_RECORD: '성별 분리 + 직전대회 성적 기준',
  GENDER_SEPARATED_RANDOM: '성별 분리 + 랜덤',
  GENDER_MIXED_HANDICAP: '성별 혼합 + 핸디캡 기준',
  GENDER_MIXED_PREVIOUS_RECORD: '성별 혼합 + 직전대회 성적 기준',
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
};

const formatOptional = (value, fallback = '미입력') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    return value.trim() !== '' ? value : fallback;
  }
  return value;
};

const formatParticipantsCount = (meeting, isApplicationClosedEarly) => {
  const current = Number.isFinite(Number(meeting?.participant_count))
    ? Number(meeting.participant_count)
    : 0;
  const max =
    meeting?.max_participants !== null && meeting?.max_participants !== undefined
      ? meeting.max_participants
      : null;
  const base = max ? `${current}/${max}명` : `${current}명`;
  if (isApplicationClosedEarly) {
    return `${base} (신청 마감)`;
  }
  return base;
};

const formatHoleCount = (holeCount) => {
  if (holeCount === null || holeCount === undefined) return '미정';
  if (Number.isNaN(Number(holeCount))) return `${holeCount}`;
  return `${holeCount}홀`;
};

const formatTeamSize = (teamSize) => {
  if (teamSize === null || teamSize === undefined || teamSize === '') return '미정';
  if (Number.isNaN(Number(teamSize))) return `${teamSize}`;
  return `${teamSize}명`;
};

const formatTeeTimes = (teeTimes) => {
  if (!Array.isArray(teeTimes) || teeTimes.length === 0) return '미정';
  const formatted = teeTimes
    .map((time) => {
      if (!time) return null;
      if (/^\d{1,2}:\d{2}$/.test(time)) {
        return time;
      }
      const parsed = new Date(time);
      if (!Number.isNaN(parsed.getTime())) {
        try {
          return format(parsed, 'HH:mm');
        } catch {
          return time;
        }
      }
      return time;
    })
    .filter(Boolean);
  if (formatted.length === 0) return '미정';
  return formatted.join(', ');
};

const MeetingDetailPage = () => {
  const { meetingId, meetingType: routeMeetingType } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useAuth();

  const meetingType = routeMeetingType === 'social' ? 'social' : 'rounding';
  const meetingDomainType = meetingType === 'social' ? 'SOCIAL' : 'ROUND';
  const isRoundingMeeting = meetingDomainType === 'ROUND';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('participants');
  const [clubMemberships, setClubMemberships] = useState({}); // { userId: { role: 'LEADER' | 'MANAGER' | 'MEMBER' } }

  const [isFavorite, setIsFavorite] = useState(false);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showJoinSuccessModal, setShowJoinSuccessModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showTeamFormationModal, setShowTeamFormationModal] = useState(false);
  const [showTeamFormationPreviewModal, setShowTeamFormationPreviewModal] = useState(false);
  const [showTeamEditorModal, setShowTeamEditorModal] = useState(false);
  const [showBatchFormationModal, setShowBatchFormationModal] = useState(false);
  const [showFormationHistoryModal, setShowFormationHistoryModal] = useState(false);
  const [showRoundingCompleteModal, setShowRoundingCompleteModal] = useState(false);
  const [showSimpleScoreModal, setShowSimpleScoreModal] = useState(false);
  const [previewFormationData, setPreviewFormationData] = useState(null);
  const [previewTeams, setPreviewTeams] = useState([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestForm, setGuestForm] = useState({
    name: '',
    birthdate: '',
    gender: '',
    handicap: '',
    average_score: ''
  });
  const [guestFormErrors, setGuestFormErrors] = useState({});

  const [toast, setToast] = useState({ open: false, message: '', tone: 'success' });

  const [userInfo, setUserInfo] = useState({
    realname: '',
    average_score: '',
    phone_number: '',
    birthdate: '',
    gender: '',
    handicap: '',
  });
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false);
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  
  // 핸디캡 정보 상태 (Initial vs Calculated 구분)
  const [handicapInfo, setHandicapInfo] = useState({
    handicap: null, // 하위 호환성을 위한 기존 handicap 필드
    initial_handicap: null,
    calculated_handicap: null,
    handicap_update_method: null,
    handicap_calculation_count: 0,
    is_auto_calculated: false,
  });
  const [handicapLoading, setHandicapLoading] = useState(false);

  const [processingAction, setProcessingAction] = useState(false);
  const autoCancelTriggeredRef = useRef(false);

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ open: true, message, tone });
  }, []);

  useEffect(() => {
    if (!toast.open) return undefined;
    const timeout = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.open]);

  useEffect(() => {
    autoCancelTriggeredRef.current = false;
  }, [meetingId]);

  const fetchUserProfile = useCallback(async () => {
    try {
      setUserInfoLoading(true);
      const profileResponse = await usersApi.getMyProfile();
      const profile = extractUserProfile(profileResponse);
      if (profile) {
        setUserInfo({
          realname: profile.realname || '',
          average_score: profile.average_score ?? '',
          phone_number: profile.phone_number || '',
          birthdate: profile.birthdate ? profile.birthdate.split('T')[0] : '',
          gender: profile.gender || '',
          handicap: profile.handicap ?? '',
        });
      }
    } catch (err) {
      console.error('사용자 정보 조회 실패:', err);
      showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
    } finally {
      setUserInfoLoading(false);
    }
  }, [showToast]);

  // 핸디캡 정보 조회 (Initial vs Calculated 구분)
  const fetchHandicapInfo = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setHandicapLoading(true);
      const handicapResponse = await usersApi.getUserHandicap(user.id);
      const handicapData = handicapResponse?.data || handicapResponse;
      if (handicapData) {
        setHandicapInfo({
          handicap: handicapData.handicap ?? null, // 하위 호환성을 위한 기존 handicap 필드
          initial_handicap: handicapData.initial_handicap ?? null,
          calculated_handicap: handicapData.calculated_handicap ?? null,
          handicap_update_method: handicapData.handicap_update_method ?? null,
          handicap_calculation_count: handicapData.handicap_calculation_count ?? 0,
          is_auto_calculated: handicapData.is_auto_calculated ?? false,
        });
      }
    } catch (err) {
      console.error('핸디캡 정보 조회 실패:', err);
      // 핸디캡 정보 조회 실패는 조용히 처리 (기존 handicap 필드 사용)
    } finally {
      setHandicapLoading(false);
    }
  }, [user?.id]);

  // 클럽 멤버십 정보 조회
  const fetchClubMemberships = useCallback(async (clubId, participantUserIds) => {
    if (!clubId || !participantUserIds || participantUserIds.length === 0) {
      setClubMemberships({});
      return;
    }
    
    try {
      const membersResponse = await clubsApi.getClubMembers(clubId, { allMembers: true });
      const members = extractList(membersResponse);
      
      // 사용자 ID를 키로 하는 맵 생성
      const membershipsMap = {};
      members.forEach((member) => {
        if (member.user_id && member.role) {
          membershipsMap[member.user_id] = { role: member.role };
        }
      });
      
      setClubMemberships(membershipsMap);
    } catch (err) {
      console.error('클럽 멤버십 정보 조회 실패:', err);
      setClubMemberships({});
    }
  }, []);

  const fetchMeetingDetail = useCallback(async () => {
    if (!meetingId) return;
    try {
      setLoading(true);
      setError(null);

      // 먼저 범용 API로 모임 정보 조회하여 meeting_type 확인
      let meetingTypeResponse;
      try {
        meetingTypeResponse = await api.get(`/meetings/${meetingId}`);
      } catch (err) {
        console.error('모임 정보 조회 실패:', err);
        setError('모임 정보를 불러올 수 없습니다.');
        setLoading(false);
        return;
      }

      const meetingTypeData = extractData(meetingTypeResponse);
      const actualMeetingType = meetingTypeData?.meeting_type;
      const actualIsRoundingMeeting = actualMeetingType === 'ROUND' || actualMeetingType === 'ROUNDING';

      // URL 경로와 실제 모임 타입이 다르면 올바른 경로로 리다이렉트
      if (actualIsRoundingMeeting && routeMeetingType === 'social') {
        navigate(`/meetings/rounding/${meetingId}`, { replace: true });
        return;
      } else if (!actualIsRoundingMeeting && routeMeetingType === 'rounding') {
        navigate(`/meetings/social/${meetingId}`, { replace: true });
        return;
      }

      let meetingResponse;
      let participantsResponse = [];
      let teamsResponse = [];

      if (actualIsRoundingMeeting) {
        [meetingResponse, participantsResponse, teamsResponse] = await Promise.all([
          roundsApi.getRound(meetingId),
          roundsApi.getRoundParticipants(meetingId),
          roundsApi.getRoundTeams(meetingId),
        ]);
      } else {
        meetingResponse = await socialsApi.getSocial(meetingId);
        const socialData = extractData(meetingResponse);
        // 소셜 모임의 경우 participants 배열이 응답에 포함되지 않을 수 있으므로
        // 별도로 참가자 목록을 조회 (백엔드 API: /meetings/{meeting_id}/participants)
        try {
          // 소셜 모임은 /meetings/{meeting_id}/participants 엔드포인트 사용 (라운딩/소셜 모두 지원)
          const participantsApiResponse = await api.get(`/meetings/${meetingId}/participants`);
          participantsResponse = extractList(participantsApiResponse);
        } catch {
          // 참가자 조회 실패 시 socialData에서 가져오거나 빈 배열 사용
          participantsResponse = socialData?.participants || [];
        }
        teamsResponse = socialData?.teams || [];
      }

      const meetingData = extractData(meetingResponse);
      const participantList = extractList(participantsResponse);
      const teamList = extractList(teamsResponse);

      setMeeting(meetingData);
      setParticipants(participantList);
      setTeams(teamList);
      
      // 디버깅: 팀 멤버 데이터 확인
      if (teamList && teamList.length > 0) {
        console.log('팀 데이터:', teamList);
        teamList.forEach((team, index) => {
          console.log(`팀 ${index + 1} (${team.name}):`, team);
          if (team.members) {
            team.members.forEach((member, memberIndex) => {
              console.log(`  멤버 ${memberIndex + 1}:`, {
                name: member.user_name,
                handicap_index: member.handicap_index,
                recent_avg_score: member.recent_avg_score,
                gender: member.gender
              });
            });
          }
        });
      }
      
      // 데이터 새로고침 시 자동 전환 플래그 초기화
      setHasAutoSwitchedToTeams(false);

      // 클럽 멤버십 정보 조회 (배지 표시를 위해)
      if (meetingData?.club_id && participantList.length > 0) {
        const participantUserIds = participantList.map((p) => p.user_id).filter(Boolean);
        await fetchClubMemberships(meetingData.club_id, participantUserIds);
      } else {
        setClubMemberships({});
      }

      if (actualIsRoundingMeeting) {
        // 권한 계산 로직 (통일된 로직 사용)
        // 개설자 판단: meeting.creator_id가 있으면 그것으로, 없으면 참가자 중 ORGANIZER 역할
        const organizerParticipantForStatus = participantList.find(
          (p) => p.role === 'ORGANIZER'
        );
        const organizerUserIdForStatus = meetingData?.creator_id || organizerParticipantForStatus?.user_id;
        
        const isOrganizerForStatus = Boolean(
          user?.id &&
          organizerUserIdForStatus &&
          String(organizerUserIdForStatus) === String(user.id)
        );
        const isParticipantForStatus = participantList.some(
          (p) => p.user_id === user?.id
        );
        const currentUserClubRoleForStatus = clubMemberships[user?.id]?.role;
        const isClubLeaderOrManagerForStatus =
          currentUserClubRoleForStatus === 'LEADER' ||
          currentUserClubRoleForStatus === 'MANAGER';
        const hasManagerPermissionForStatus = Boolean(
          isOrganizerForStatus || (isParticipantForStatus && isClubLeaderOrManagerForStatus)
        );

        if (hasManagerPermissionForStatus) {
          try {
            const statusResponse = await roundsApi.getApplicationStatus(meetingId);
            setApplicationStatus(extractData(statusResponse));
          } catch (statusError) {
            if (statusError?.response?.status !== 404) {
              console.warn('참가 신청 현황 조회 실패:', statusError);
            }
            setApplicationStatus(null);
          }
        } else {
          setApplicationStatus(null);
        }
      } else {
        setApplicationStatus(null);
      }
    } catch (err) {
      console.error('모임 상세 조회 실패:', err);
      setError('모임 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [meetingId, routeMeetingType, navigate, user?.id, fetchClubMemberships]);

  useEffect(() => {
    fetchMeetingDetail();
  }, [fetchMeetingDetail]);

  // 소셜 모임에서 팀 탭이 활성화된 경우 기본 탭으로 전환
  useEffect(() => {
    if (!isRoundingMeeting && activeTab === 'teams') {
      setActiveTab('participants');
    }
  }, [isRoundingMeeting, activeTab]);

  // 팀이 있고 편성 확정된 경우 팀 탭을 기본으로 설정 (초기 로드 시에만)
  const [hasAutoSwitchedToTeams, setHasAutoSwitchedToTeams] = useState(false);
  useEffect(() => {
    if (isRoundingMeeting && teams.length > 0 && !hasAutoSwitchedToTeams && activeTab === 'participants') {
      const hasConfirmedTeams = teams.some(team => team.status === 'CONFIRMED');
      if (hasConfirmedTeams) {
        setActiveTab('teams');
        setHasAutoSwitchedToTeams(true);
      }
    }
  }, [isRoundingMeeting, teams, activeTab, hasAutoSwitchedToTeams]);

  const refreshAll = async () => {
    await fetchMeetingDetail();
  };

  const handleToggleFavorite = () => {
    setIsFavorite((prev) => !prev);
    showToast(isFavorite ? '즐겨찾기에서 제거했습니다.' : '즐겨찾기에 추가했습니다.');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: meeting?.name,
          text: meeting?.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('링크를 클립보드에 복사했습니다.');
      }
    } catch (err) {
      console.error('공유 실패:', err);
      showToast('공유 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleOpenJoinModal = async () => {
    await fetchUserProfile();
    if (isRoundingMeeting) {
      await fetchHandicapInfo();
    }
    setIsEditingUserInfo(false);
    setShowJoinModal(true);
  };

  const handleUpdateUserInfo = async () => {
    try {
      setProcessingAction(true);
      
      // 프로필 정보 업데이트 (핸디캡 제외)
      await usersApi.updateMyProfile({
        realname: userInfo.realname,
        average_score: userInfo.average_score,
        phone_number: userInfo.phone_number,
        birthdate: userInfo.birthdate || null,
        // handicap은 initial_handicap API로 별도 수정
      });
      
      // 핸디캡 정보가 있으면 initial_handicap만 별도로 수정
      let handicapUpdateSuccess = true;
      if (user?.id && userInfo.handicap !== '' && userInfo.handicap !== null && userInfo.handicap !== undefined) {
        try {
          const handicapValue = typeof userInfo.handicap === 'string' 
            ? parseFloat(userInfo.handicap) 
            : userInfo.handicap;
          
          console.log('핸디캡 수정 시도:', {
            userId: user.id,
            handicapValue,
            handicapType: typeof handicapValue,
            isNaN: isNaN(handicapValue),
            isValid: !isNaN(handicapValue) && handicapValue >= 0 && handicapValue <= 72
          });
          
          if (!isNaN(handicapValue) && handicapValue >= 0 && handicapValue <= 72) {
            const requestData = {
              initial_handicap: handicapValue,
            };
            console.log('핸디캡 수정 API 요청:', requestData);
            await usersApi.updateUserHandicap(user.id, requestData);
            console.log('핸디캡 수정 성공');
          } else {
            console.warn('핸디캡 값이 유효하지 않음:', handicapValue);
          }
        } catch (handicapErr) {
          console.error('핸디캡 수정 실패:', handicapErr);
          console.error('에러 상세:', {
            message: handicapErr?.message,
            response: handicapErr?.response?.data,
            status: handicapErr?.response?.status
          });
          handicapUpdateSuccess = false;
          const handicapMessage = handicapErr?.response?.data?.detail || '핸디캡 수정에 실패했습니다.';
          showToast(handicapMessage, 'error');
        }
      }
      
      // 핸디캡 수정이 실패한 경우 편집 모드를 유지하고 성공 메시지 표시 안 함
      if (!handicapUpdateSuccess) {
        await fetchUserProfile();
        if (isRoundingMeeting) {
          await fetchHandicapInfo();
        }
        return;
      }
      
      setIsEditingUserInfo(false);
      showToast('내 정보가 업데이트되었습니다.');
      await fetchUserProfile();
      if (isRoundingMeeting) {
        await fetchHandicapInfo();
      }
    } catch (err) {
      console.error('사용자 정보 업데이트 실패:', err);
      const message = err?.response?.data?.detail || '사용자 정보 업데이트에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!meetingId) return;
    try {
      setProcessingAction(true);
      if (isRoundingMeeting) {
        await roundsApi.joinRound(meetingId);
      } else {
        await socialsApi.joinSocial(meetingId);
      }
      setShowJoinModal(false);
      setShowJoinSuccessModal(true);
      await refreshAll();
    } catch (err) {
      console.error('모임 참가 실패:', err);
      const message =
        err?.response?.data?.detail ||
        (err?.response?.status === 403
          ? '클럽 멤버만 참가할 수 있습니다.'
          : '모임 참가 처리 중 오류가 발생했습니다.');
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleLeaveMeeting = async () => {
    if (!meetingId) return;
    try {
      setProcessingAction(true);
      if (isRoundingMeeting) {
        await roundsApi.leaveRound(meetingId);
      } else {
        await socialsApi.leaveSocial(meetingId);
      }
      showToast('참가신청이 취소되었습니다.', 'info');
      setShowLeaveModal(false);
      await refreshAll();
    } catch (err) {
      console.error('모임 참가 취소 실패:', err);
      const message =
        err?.response?.data?.detail || '참가 취소 처리 중 오류가 발생했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancelMeeting = async () => {
    if (!meetingId) return;
    try {
      setProcessingAction(true);
      if (isRoundingMeeting) {
        await roundsApi.cancelRound(meetingId, '개설자에 의한 취소');
      } else {
        await socialsApi.cancelSocial(meetingId, '개설자에 의한 취소');
      }
      showToast('모임이 취소되었습니다.');
      setShowCancelModal(false);
      await refreshAll();
    } catch (err) {
      console.error('모임 취소 실패:', err);
      const message = err?.response?.data?.detail || '모임 취소에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleApproveParticipant = async (participantId) => {
    if (!isRoundingMeeting) return;
    try {
      setProcessingAction(true);
      await roundsApi.approveParticipant(meetingId, participantId);
      showToast('참가자를 승인했습니다.');
      await refreshAll();
    } catch (err) {
      console.error('참가자 승인 실패:', err);
      const message = err?.response?.data?.detail || '참가자 승인에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectParticipant = async (participantId) => {
    if (!isRoundingMeeting) return;
    try {
      setProcessingAction(true);
      await roundsApi.rejectParticipant(meetingId, participantId);
      showToast('참가자를 거절했습니다.', 'info');
      await refreshAll();
    } catch (err) {
      console.error('참가자 거절 실패:', err);
      const message = err?.response?.data?.detail || '참가자 거절에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCloseApplicationEarly = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
      setProcessingAction(true);
      }
      const result = await roundsApi.closeApplicationEarly(meetingId);
      const outcome = result?.outcome;
      const confirmedTotal = result?.confirmed_count ?? confirmedParticipants.length;

      if (outcome === 'TEAM_FORMATION_READY') {
        showToast(
          result?.message ||
            `참가 신청을 마감했습니다. \n확정 ${confirmedTotal}명 기준으로 팀 편성을 준비하세요.`,
        );
      } else if (outcome === 'AUTO_CANCELED') {
        showToast(
          result?.message || '확정 인원이 부족해 \n모임이 자동 취소되었습니다.',
          'info',
        );
      } else if (outcome === 'ALREADY_CLOSED') {
        showToast(result?.message || '이미 신청이 마감된 모임입니다.', 'info');
      } else {
        showToast(result?.message || '참가 신청을 조기 마감했습니다.');
      }
      await refreshAll();
    } catch (err) {
      console.error('조기 마감 실패:', err);
      console.error('에러 상세:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        detail: err?.response?.data?.detail
      });
      // silent 모드일 때도 에러 로그는 남기고, 상태만 새로고침
      if (silent) {
        // 백엔드에서 이미 처리되었을 수 있으므로 상태만 새로고침
        try {
          await refreshAll();
        } catch (refreshError) {
          console.error('상태 새로고침 실패:', refreshError);
        }
        // silent 모드에서도 심각한 에러는 표시 (500 에러 등)
        if (err?.response?.status === 500) {
          const message = err?.response?.data?.detail || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          showToast(message, 'error');
        }
        return;
      }
      const message = err?.response?.data?.detail || '조기 마감 처리 중 오류가 발생했습니다.';
      showToast(message, 'error');
    } finally {
      if (!silent) {
      setProcessingAction(false);
      }
    }
  };

  const handleOpenTeamFormationModal = () => {
    setShowTeamFormationModal(true);
  };

  const handleOpenBatchFormationModal = () => {
    setShowBatchFormationModal(true);
  };

  // 게스트 추가 폼 검증
  const validateGuestForm = () => {
    const newErrors = {};
    
    // 이름 검증
    if (!guestForm.name || guestForm.name.trim() === '') {
      newErrors.name = '게스트 이름을 입력해주세요.';
    } else if (guestForm.name.trim().length > 255) {
      newErrors.name = '이름은 255자 이하여야 합니다.';
    }
    
    // 생년월일 검증 (선택적이지만 입력된 경우)
    if (guestForm.birthdate) {
      const birth = new Date(guestForm.birthdate);
      if (isNaN(birth.getTime())) {
        newErrors.birthdate = '올바른 생년월일을 입력해주세요.';
      } else {
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        
        if (age < 14) {
          newErrors.birthdate = '만 14세 이상만 참가할 수 있습니다.';
        }
        if (birth > today) {
          newErrors.birthdate = '생년월일은 미래 날짜일 수 없습니다.';
        }
      }
    }
    
    // 성별 검증 (선택적)
    if (guestForm.gender && guestForm.gender !== 'MALE' && guestForm.gender !== 'FEMALE') {
      newErrors.gender = '성별은 남성 또는 여성만 선택할 수 있습니다.';
    }
    
    // 평균 타수는 필수 (핸디캡은 자동 계산)
    const hasAverageScore = guestForm.average_score && guestForm.average_score.trim() !== '';
    
    if (!hasAverageScore) {
      newErrors.average_score = '평균 타수를 입력해주세요.';
    }
    
    // 평균 타수 검증
    if (hasAverageScore) {
      const avgScoreNum = Number(guestForm.average_score);
      if (isNaN(avgScoreNum) || avgScoreNum < 55 || avgScoreNum > 144) {
        newErrors.average_score = '평균 타수는 55-144 사이의 숫자여야 합니다.';
      }
    }
    
    return newErrors;
  };

  // 게스트 추가 핸들러
  const handleAddGuest = async () => {
    const validationErrors = validateGuestForm();
    if (Object.keys(validationErrors).length > 0) {
      setGuestFormErrors(validationErrors);
      return;
    }
    
    try {
      setProcessingAction(true);
      setGuestFormErrors({});
      
      // 평균 타수로부터 핸디캡 자동 계산
      let calculatedHandicap = null;
      if (guestForm.average_score && !isNaN(guestForm.average_score)) {
        const avgScore = parseFloat(guestForm.average_score);
        if (avgScore >= 55 && avgScore <= 144) {
          calculatedHandicap = Math.max(0, Math.min(72, avgScore - 72));
        }
      }
      
      // API 요청 데이터 구성
      const guestData = {
        name: guestForm.name.trim(),
        birthdate: guestForm.birthdate || null,
        gender: guestForm.gender || null,
        handicap: calculatedHandicap !== null ? calculatedHandicap : (guestForm.handicap ? parseFloat(guestForm.handicap) : null),
        average_score: guestForm.average_score ? parseInt(guestForm.average_score) : null
      };
      
      await roundsApi.addGuest(meetingId, guestData);
      showToast('게스트가 추가되었습니다.');
      
      // 폼 초기화
      setGuestForm({
        name: '',
        birthdate: '',
        gender: '',
        handicap: '',
        average_score: ''
      });
      setGuestFormErrors({});
      setShowGuestModal(false);
      
      // 참가자 목록 새로고침
      await fetchMeetingDetail();
    } catch (err) {
      console.error('게스트 추가 실패:', err);
      const message = formatApiError(err?.response?.data?.detail) || '게스트 추가에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // 숫자 입력만 허용
  const handleGuestNumberChange = (field, value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    setGuestForm(prev => {
      const updated = { ...prev, [field]: numericValue };
      
      // 평균 타수 입력 시 핸디캡 자동 계산 및 실시간 검증
      if (field === 'average_score') {
        if (numericValue && !isNaN(numericValue)) {
          const avgScore = parseFloat(numericValue);
          if (avgScore >= 55 && avgScore <= 144) {
            const calculatedHandicap = Math.max(0, Math.min(72, avgScore - 72));
            updated.handicap = calculatedHandicap.toFixed(1);
            // 유효한 값이면 에러 제거
            setGuestFormErrors(prevErrors => ({ ...prevErrors, average_score: '' }));
          } else {
            updated.handicap = '';
            // 범위를 벗어나면 에러 설정
            if (avgScore < 55) {
              setGuestFormErrors(prevErrors => ({ ...prevErrors, average_score: '평균 타수는 55 이상이어야 합니다.' }));
            } else if (avgScore > 144) {
              setGuestFormErrors(prevErrors => ({ ...prevErrors, average_score: '평균 타수는 144 이하여야 합니다.' }));
            }
          }
        } else {
          updated.handicap = '';
          // 숫자가 아니면 에러는 제거 (빈 값일 때는 검증하지 않음)
          if (numericValue === '') {
            setGuestFormErrors(prevErrors => ({ ...prevErrors, average_score: '' }));
          }
        }
      }
      
      return updated;
    });
    
    // 다른 필드의 에러는 기존 로직 유지
    if (field !== 'average_score' && guestFormErrors[field]) {
      setGuestFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // 평균 타수가 입력되면 핸디캡 에러 제거
    if (field === 'average_score' && numericValue && !isNaN(numericValue)) {
      const avgScore = parseFloat(numericValue);
      if (avgScore >= 55 && avgScore <= 144) {
        setGuestFormErrors(prev => ({ ...prev, handicap: '', average_score: '' }));
      }
    }
  };

  // 일괄 편성 결과 상세 보기
  const handleViewBatchDetail = (result) => {
    if (!result.success || !result.teams || result.teams.length === 0) return;
    
    // 편성 조건 데이터 저장 (일괄 편성 모달에서 선택한 teamSize 사용)
    setPreviewFormationData({
      formation_mode: result.mode,
      team_size: result.teamSize || meeting?.team_size || 4,
      guests: []
    });
    
    // 팀 목록 저장
    setPreviewTeams(result.teams);
    
    // 일괄 편성 모달 닫기
    setShowBatchFormationModal(false);
    
    // 미리보기 모달 열기
    setShowTeamFormationPreviewModal(true);
  };

  // 에러 메시지 변환 유틸리티 함수
  const formatApiError = (detail) => {
    if (!detail) return '알 수 없는 오류가 발생했습니다.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(item => item.msg || JSON.stringify(item)).join(', ');
    }
    if (typeof detail === 'object') {
      return detail.msg || detail.message || JSON.stringify(detail);
    }
    return String(detail);
  };

  const handleFormTeams = async (formationData) => {
    if (!isRoundingMeeting) return;
    
    // 일괄 편성 모드인 경우 - 결과를 반환만 함
    if (formationData.batchMode) {
      try {
        const { preview, batchMode, meeting_id, ...apiData } = formationData;
        const response = await roundsApi.autoFormTeams(meetingId, apiData);
        return response;
      } catch (err) {
        throw err;
      }
    }
    
    // 선택된 결과가 있는 경우 (일괄 편성에서 선택)
    if (formationData.selectedResult) {
      const { selectedResult, ...apiData } = formationData;
      await handlePreviewTeams({
        ...apiData,
        formation_mode: selectedResult.mode,
        preview: true
      });
      return;
    }
    
    // 미리보기 모드인 경우
    if (formationData.preview) {
      await handlePreviewTeams(formationData);
      return;
    }
    
    // 기존 동작: 바로 DB에 저장
    try {
      setProcessingAction(true);
      await roundsApi.autoFormTeams(meetingId, formationData);
      showToast('팀 자동 편성이 완료되었습니다.');
      setShowTeamFormationModal(false);
      await refreshAll();
    } catch (err) {
      console.error('팀 자동 편성 실패:', err);
      const message = formatApiError(err?.response?.data?.detail) || '팀 자동 편성에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // 미리보기용 팀 편성 실행
  const handlePreviewTeams = async (formationData) => {
    if (!isRoundingMeeting) return;
    try {
      setProcessingAction(true);
      
      // preview 플래그 제거하고 API 호출
      const { preview, ...apiData } = formationData;
      const response = await roundsApi.autoFormTeams(meetingId, apiData);
      
      // 응답 데이터에서 팀 목록 추출
      const teams = response?.data?.teams || response?.teams || [];
      
      // 팀이 없는 경우 에러 처리
      if (!teams || teams.length === 0) {
        showToast('편성된 팀이 없습니다. 참가자 수를 확인해주세요.', 'error');
        return;
      }
      
      // 팀 목록에 members 정보가 없거나, members에 gender 정보가 없는 경우 별도로 조회
      let teamsWithMembers = teams;
      const needsRequery = teams.length > 0 && (
        !teams[0].members || 
        teams[0].members.length === 0 ||
        // members가 있지만 gender 정보가 없는 경우도 재조회
        (teams[0].members.length > 0 && !teams[0].members[0].gender)
      );
      
      if (needsRequery) {
        // 팀 목록을 다시 조회하여 members 정보 가져오기
        try {
          const teamsResponse = await roundsApi.getRoundTeams(meetingId);
          const teamsList = teamsResponse?.data || teamsResponse || [];
          teamsWithMembers = teams.map(team => {
            const fullTeam = teamsList.find(t => t.id === team.id);
            return fullTeam || team;
          });
        } catch (err) {
          console.warn('팀 멤버 정보 조회 실패, 기본 정보만 사용:', err);
          // 조회 실패 시 기본 정보만 사용
        }
      }
      
      // 편성 조건 데이터 저장
      setPreviewFormationData({
        formation_mode: formationData.formation_mode,
        team_size: formationData.team_size,
        guests: formationData.guests
      });
      
      // 팀 목록 저장
      setPreviewTeams(teamsWithMembers);
      
      // 편성 히스토리에 저장
      saveFormationHistory(formationData.formation_mode, formationData.team_size, teamsWithMembers);
      
      // 조건 선택 모달 닫기
      setShowTeamFormationModal(false);
      
      // 미리보기 모달 열기
      setShowTeamFormationPreviewModal(true);
    } catch (err) {
      console.error('팀 편성 미리보기 실패:', err);
      const message = formatApiError(err?.response?.data?.detail) || '팀 편성 미리보기에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // 다시 편성하기
  const handleReformTeams = () => {
    setShowTeamFormationPreviewModal(false);
    setShowTeamFormationModal(true);
    // 기존 선택값은 TeamFormationModal에서 유지됨
  };

  // 편성 히스토리 저장
  const saveFormationHistory = (formationMode, teamSize, teams) => {
    try {
      const key = `team_formation_history_${meetingId}`;
      const existing = localStorage.getItem(key);
      const history = existing ? JSON.parse(existing) : [];
      
      const formationModeOptions = {
        'GENDER_SEPARATED_HANDICAP': '성별 분리 + 핸디캡 기준',
        'GENDER_SEPARATED_PREVIOUS_RECORD': '성별 분리 + 직전대회 성적 기준',
        'GENDER_SEPARATED_RANDOM': '성별 분리 + 랜덤',
        'GENDER_MIXED_HANDICAP': '성별 혼합 + 핸디캡 기준',
        'GENDER_MIXED_PREVIOUS_RECORD': '성별 혼합 + 직전대회 성적 기준',
        'GENDER_MIXED_RANDOM': '성별 혼합 + 랜덤'
      };

      const totalMembers = teams.reduce((sum, team) => {
        const members = team.members || team.team_members || [];
        return sum + members.length;
      }, 0);

      const historyItem = {
        formation_mode: formationMode,
        formationModeLabel: formationModeOptions[formationMode] || formationMode,
        team_size: teamSize,
        teams: teams,
        totalMembers: totalMembers,
        savedAt: new Date().toISOString()
      };

      // 최신 항목을 맨 앞에 추가 (최대 10개만 유지)
      const newHistory = [historyItem, ...history].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(newHistory));
    } catch (err) {
      console.error('편성 히스토리 저장 실패:', err);
    }
  };

  // 편성 히스토리 복원
  const handleRestoreHistory = (historyItem) => {
    setPreviewFormationData({
      formation_mode: historyItem.formation_mode,
      team_size: historyItem.team_size,
      guests: undefined
    });
    setPreviewTeams(historyItem.teams);
    setShowTeamFormationPreviewModal(true);
  };

  // 편성 히스토리 상세 보기
  const handleViewHistoryDetail = (historyItem) => {
    if (!historyItem || !historyItem.teams || historyItem.teams.length === 0) return;
    
    // 편성 조건 데이터 저장
    setPreviewFormationData({
      formation_mode: historyItem.formation_mode,
      team_size: historyItem.team_size,
      guests: []
    });
    
    // 팀 목록 저장
    setPreviewTeams(historyItem.teams);
    
    // 편성 히스토리 모달 닫기
    setShowFormationHistoryModal(false);
    
    // 미리보기 모달 열기
    setShowTeamFormationPreviewModal(true);
  };

  // 편성 확정 (미리보기 모달과 MeetingWorkflowStatus에서 공통 사용)
  const handleConfirmTeamFormation = async () => {
    if (!isRoundingMeeting) return;
    try {
      setProcessingAction(true);
      await roundsApi.confirmTeamFormation(meetingId);
      showToast('팀 편성을 확정했습니다.');
      
      // 미리보기 모달이 열려있는 경우 닫기
      if (showTeamFormationPreviewModal) {
        setShowTeamFormationPreviewModal(false);
        setPreviewFormationData(null);
        setPreviewTeams([]);
      }
      
      // 데이터 새로고침
      await refreshAll();
      
      // 편성 확정 후 팀 탭으로 자동 전환
      setActiveTab('teams');
    } catch (err) {
      console.error('팀 편성 확정 실패:', err);
      const message = err?.response?.data?.detail || '팀 편성 확정에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // 모임 진행하기
  const handleStartRounding = async () => {
    if (!isRoundingMeeting) return;
    try {
      setProcessingAction(true);
      await roundsApi.startRounding(meetingId);
      showToast('모임 진행이 시작되었습니다.');
      await refreshAll();
    } catch (err) {
      console.error('모임 진행 시작 실패:', err);
      const message = err?.response?.data?.detail || '모임 진행 시작에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // 라운딩 종료 선택 모달 열기
  const handleOpenCompleteRoundingModal = () => {
    if (!isRoundingMeeting) return;
    setShowRoundingCompleteModal(true);
  };

  // 지금 입력하기 선택
  const handleInputNow = async () => {
    setShowRoundingCompleteModal(false);
    // 핸디캡 정보가 없으면 먼저 로드
    if (!handicapInfo.calculated_handicap && !handicapInfo.initial_handicap && !handicapInfo.handicap && !userInfo.handicap) {
      await fetchHandicapInfo();
    }
    setShowSimpleScoreModal(true);
  };

  // 나중에 입력하기 선택
  const handleInputLater = async () => {
    if (!isRoundingMeeting) return;
    try {
      setProcessingAction(true);
      await roundsApi.completeRounding(meetingId);
      showToast('라운딩이 종료되었습니다.');
      await refreshAll();
    } catch (err) {
      console.error('라운딩 종료 실패:', err);
      const message = err?.response?.data?.detail || '라운딩 종료에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // 간단 점수 입력 성공 후 처리
  const handleScoreInputSuccess = async (wasRoundingCompleted) => {
    if (wasRoundingCompleted) {
      showToast('점수가 입력되었고 라운딩이 종료되었습니다.');
    } else {
      showToast('점수가 입력되었습니다.');
    }
    await refreshAll();
  };

  // 팀 편성 수정 모달 열기
  const handleOpenTeamEditorModal = () => {
    setShowTeamEditorModal(true);
  };

  // 팀 편성 변경사항 저장
  const handleSaveTeamChanges = async (updatedTeams, unassignedGuests = []) => {
    if (!isRoundingMeeting || !meetingId) return;
    
    // 라운딩 모임이므로 meetingId = roundId
    const roundId = meetingId;
    
    try {
      setProcessingAction(true);
      
      // ===== 0단계: 게스트를 먼저 DB에 저장 =====
      const guestIdMap = new Map(); // 임시 게스트 id -> 실제 user_id 매핑
      
      // 모든 팀에서 게스트 찾기
      const allGuests = [];
      updatedTeams.forEach(team => {
        (team.members || []).forEach(member => {
          if (member.is_guest === true && !member.user_id) {
            // 임시 게스트 (user_id가 없는 경우)
            // member.id가 guest-로 시작하는 임시 id인지 확인
            const guestId = member.id && String(member.id).startsWith('guest-') 
              ? member.id 
              : `guest-${Date.now()}-${Math.random()}`;
            
            if (!guestIdMap.has(guestId)) {
              allGuests.push({ guestId, member });
              guestIdMap.set(guestId, null); // 나중에 실제 user_id로 업데이트
              // member 객체에도 guestId 저장 (나중에 찾을 때 사용)
              member._tempGuestId = guestId;
            }
          }
        });
      });
      
      // 미할당 게스트도 추가
      unassignedGuests.forEach(guest => {
        if (guest.is_guest === true && !guest.user_id) {
          const guestId = guest.id && String(guest.id).startsWith('guest-') 
            ? guest.id 
            : `guest-${Date.now()}-${Math.random()}`;
          
          if (!guestIdMap.has(guestId)) {
            allGuests.push({ guestId, member: guest });
            guestIdMap.set(guestId, null);
            guest._tempGuestId = guestId;
          }
        }
      });
      
      // 게스트를 DB에 저장
      for (const { guestId, member } of allGuests) {
        try {
          const guestData = {
            name: member.guest_name || member.user_name || member.name || '게스트',
            birthdate: member.guest_birthdate || member.birthdate || null,
            gender: member.guest_gender || member.gender || null,
            handicap: member.guest_handicap || member.handicap_index || member.handicap || null,
            average_score: member.average_score || member.recent_avg_score || null
          };
          
          const response = await roundsApi.addGuest(meetingId, guestData);
          const savedGuest = extractData(response);
          
          // 게스트는 MeetingParticipant로 저장되므로, 참가자 목록을 다시 조회하여 user_id 가져오기
          // addGuest API 응답에는 user_id가 없으므로 참가자 목록에서 찾아야 함
          // savedGuest.id는 MeetingParticipant의 id이므로 이를 사용하여 정확히 찾기
          // 여러 번 재시도 (최대 3번)
          let savedGuestParticipant = null;
          let actualUserId = null;
          
          for (let retry = 0; retry < 3; retry++) {
            await new Promise(resolve => setTimeout(resolve, 200 * (retry + 1))); // 재시도마다 대기 시간 증가
            
            try {
              const participantsResponse = await roundsApi.getRoundParticipants(roundId);
              const allParticipants = extractList(participantsResponse);
              
              // savedGuest.id (MeetingParticipant id)로 정확히 찾기
              if (savedGuest?.id) {
                savedGuestParticipant = allParticipants.find(p => p.id === savedGuest.id);
              }
              
              // id로 찾지 못한 경우 이름과 is_guest로 찾기 (fallback)
              if (!savedGuestParticipant) {
                savedGuestParticipant = allParticipants.find(p => 
                  p.is_guest === true && 
                  p.guest_name === guestData.name
                );
              }
              
              actualUserId = savedGuestParticipant?.user_id;
              
              if (actualUserId) {
                break; // 찾았으면 루프 종료
              }
            } catch (err) {
              console.warn(`게스트 user_id 조회 재시도 ${retry + 1}/3 실패:`, err);
              if (retry === 2) {
                // 마지막 시도 실패
                throw err;
              }
            }
          }
          
          if (actualUserId) {
            guestIdMap.set(guestId, actualUserId);
          } else {
            console.error('게스트 user_id를 찾을 수 없습니다:', { 
              savedGuest, 
              savedGuestParticipant, 
              guestData,
              retries: 3
            });
            throw new Error(`게스트 저장 후 user_id를 찾을 수 없습니다: ${member.guest_name || member.name || '게스트'}`);
          }
        } catch (guestError) {
          console.error('게스트 저장 실패:', guestError);
          throw new Error(`게스트 저장에 실패했습니다: ${member.guest_name || member.name || '게스트'}`);
        }
      }
      
      // 게스트의 user_id를 업데이트
      updatedTeams = updatedTeams.map(team => ({
        ...team,
        members: (team.members || []).map(member => {
          if (member.is_guest === true && !member.user_id) {
            // _tempGuestId가 있으면 우선 사용, 없으면 member.id 사용
            const guestId = member._tempGuestId || (member.id && String(member.id).startsWith('guest-') ? member.id : null);
            
            if (!guestId) {
              console.error('게스트 ID를 찾을 수 없음:', member);
              return member; // user_id가 없으면 그대로 반환 (나중에 에러 발생)
            }
            
            const actualUserId = guestIdMap.get(guestId);
            
            if (actualUserId) {
              console.log('게스트 user_id 업데이트:', { 
                guestId, 
                actualUserId, 
                guestName: member.guest_name || member.name,
                memberId: member.id
              });
              return {
                ...member,
                user_id: actualUserId,
                // id는 그대로 유지 (team_member_id일 수 있음)
              };
            } else {
              console.error('게스트 user_id를 찾을 수 없음:', { 
                guestId, 
                member, 
                guestIdMap: Array.from(guestIdMap.entries()),
                allGuestIds: allGuests.map(g => g.guestId)
              });
              return member; // user_id가 없으면 그대로 반환 (나중에 에러 발생)
            }
          }
          return member;
        })
      }));
      
      // 원본 팀 목록과 비교하여 변경사항 파악
      const originalTeams = teams;
      const originalTeamMap = new Map(originalTeams.map(t => [t.id, t]));
      
      // 원본 팀의 멤버 매핑 생성 (user_id -> { teamId, teamMemberId } )
      const originalMemberMap = new Map();
      originalTeams.forEach(team => {
        const members = team.members || team.team_members || [];
        members.forEach(member => {
          const userId = member.user_id || member.id;
          if (userId) {
            originalMemberMap.set(String(userId), {
              teamId: team.id,
              teamMemberId: member.id || member.team_member_id
            });
          }
        });
      });

      // ===== 1단계: 모든 작업 수집 =====
      const operations = {
        createTeams: [], // { name, members: [{ user_id }] }
        deleteTeams: [], // { teamId }
        updateTeamNames: [], // { teamId, name }
        removeMembers: [], // { teamId, teamMemberId, userId (롤백용) }
        addMembers: [] // { teamId, userId }
      };
      
      // 새 팀 생성 작업 수집
      const newTeams = updatedTeams.filter(t => t.isNew);
      for (const newTeam of newTeams) {
        const members = (newTeam.members || []).map(m => {
          // 게스트는 이미 user_id가 업데이트되었을 수 있음
          const userId = m.user_id || m.id;
          return { userId };
        }).filter(m => m.userId);
        
        operations.createTeams.push({
          name: newTeam.name,
          members: members
        });
      }

      // 팀 삭제 작업 수집
      const deletedTeamIds = originalTeams
        .filter(ot => !updatedTeams.find(ut => ut.id === ot.id && !ut.isNew))
        .map(t => t.id);
      const deletedTeamIdSet = new Set(deletedTeamIds);
      for (const teamId of deletedTeamIds) {
        operations.deleteTeams.push({ teamId });
      }

      // 기존 팀 처리 작업 수집
      for (const updatedTeam of updatedTeams) {
        if (updatedTeam.isNew) continue; // 새 팀은 이미 처리됨
        
        const originalTeam = originalTeamMap.get(updatedTeam.id);
        if (!originalTeam) continue; // 삭제된 팀은 무시
        
        // 삭제된 팀의 멤버 제거 작업은 스킵 (팀 삭제 시 자동 제거됨)
        if (deletedTeamIdSet.has(updatedTeam.id)) continue;
        
        // 팀 이름 수정 작업 수집
        if (updatedTeam.name !== originalTeam.name) {
          operations.updateTeamNames.push({
            teamId: updatedTeam.id,
            name: updatedTeam.name
          });
        }
        
        // 멤버 변경 처리
        const originalMembers = (originalTeam.members || originalTeam.team_members || []);
        const updatedMembers = updatedTeam.members || [];
        
        // user_id 기준으로 비교 (member.id는 team_member_id일 수 있음)
        const originalUserIds = new Set(
          originalMembers.map(m => String(m.user_id || m.id)).filter(Boolean)
        );
        const updatedUserIds = new Set(
          updatedMembers.map(m => String(m.user_id || m.id)).filter(Boolean)
        );
        
        // 제거된 멤버 작업 수집
        for (const originalMember of originalMembers) {
          const userId = String(originalMember.user_id || originalMember.id);
          if (userId && !updatedUserIds.has(userId)) {
            // 멤버가 다른 팀으로 이동했거나 제거됨
            const teamMemberId = originalMember.id || originalMember.team_member_id;
            if (teamMemberId) {
              operations.removeMembers.push({
                teamId: updatedTeam.id,
                teamMemberId: teamMemberId,
                userId: userId // 롤백용
              });
            }
          }
        }
        
        // 추가된 멤버 작업 수집
        for (const updatedMember of updatedMembers) {
          const userId = String(updatedMember.user_id || updatedMember.id);
          if (userId && !originalUserIds.has(userId)) {
            // 새로 추가된 멤버
            const memberUserId = updatedMember.user_id || updatedMember.id;
            if (memberUserId) {
              // user_id 검증
              if (!memberUserId || memberUserId === null || memberUserId === undefined || memberUserId === 'null' || memberUserId === 'undefined') {
                console.error('잘못된 user_id로 멤버 추가 작업 수집:', { updatedMember, memberUserId });
                continue; // 이 멤버는 건너뛰기
              }
              
              operations.addMembers.push({
                teamId: updatedTeam.id,
                userId: Number(memberUserId) // 숫자로 변환
              });
            }
          }
        }
      }

      // ===== 2단계: 검증 (중복 체크) =====
      // 최종 상태에서 각 사용자가 한 팀에만 속하는지 확인
      const finalTeamMembers = new Map(); // userId -> teamId
      
      // 기존 팀의 멤버 (삭제되지 않은 팀)
      for (const updatedTeam of updatedTeams) {
        if (updatedTeam.isNew) continue;
        if (deletedTeamIdSet.has(updatedTeam.id)) continue;
        
        const members = updatedTeam.members || [];
        for (const member of members) {
          const userId = String(member.user_id || member.id);
          if (userId) {
            if (finalTeamMembers.has(userId)) {
              throw new Error(`한 사용자는 한 팀에만 속할 수 있습니다. (사용자 ID: ${userId})`);
            }
            finalTeamMembers.set(userId, updatedTeam.id);
          }
        }
      }
      
      // 새 팀의 멤버
      for (const createOp of operations.createTeams) {
        for (const member of createOp.members) {
          const userId = String(member.userId);
          if (finalTeamMembers.has(userId)) {
            throw new Error(`한 사용자는 한 팀에만 속할 수 있습니다. (사용자 ID: ${userId})`);
          }
          finalTeamMembers.set(userId, 'NEW_TEAM'); // 새 팀은 아직 ID가 없음
        }
      }

      // ===== 3단계: 모든 작업 실행 (트랜잭션) =====
      const executedOperations = [];
      
      try {
        // 3-1. 팀 이름 수정 (가장 안전한 작업부터)
        for (const op of operations.updateTeamNames) {
          await roundsApi.updateTeam(op.teamId, { name: op.name });
          executedOperations.push({ type: 'updateTeamName', data: op });
        }
        
        // 3-2. 새 팀 생성 (멤버 추가 전에 팀을 먼저 생성)
        for (const op of operations.createTeams) {
          // formation_mode는 필수 필드이므로 모임의 team_formation_mode를 사용하거나 기본값 사용
          const formationMode = meeting?.team_formation_mode || 'GENDER_MIXED_HANDICAP';
          const teamData = {
            name: op.name,
            formation_mode: formationMode
          };
          const response = await roundsApi.createTeamByMeeting(meetingId, teamData);
          const createdTeam = extractData(response);
          const createdTeamId = createdTeam?.id || createdTeam?.data?.id;
          
          if (createdTeamId) {
            executedOperations.push({ type: 'createTeam', data: { ...op, createdTeamId } });
            
            // 새 팀에 멤버 추가
            for (const member of op.members) {
              await roundsApi.addTeamMember(roundId, createdTeamId, member.userId);
              executedOperations.push({ 
                type: 'addMember', 
                data: { teamId: createdTeamId, userId: member.userId } 
              });
            }
          }
        }
        
        // 3-3. 기존 팀에 멤버 추가 (멤버 이동 시 먼저 새 팀에 추가)
        for (const op of operations.addMembers) {
          // user_id 검증
          if (!op.userId || op.userId === null || op.userId === undefined) {
            console.error('잘못된 user_id로 팀 멤버 추가 시도:', op);
            throw new Error(`팀 멤버 추가 실패: user_id가 유효하지 않습니다. (user_id: ${op.userId})`);
          }
          
          console.log('팀 멤버 추가 시도:', { roundId, teamId: op.teamId, userId: op.userId });
          await roundsApi.addTeamMember(roundId, op.teamId, op.userId);
          executedOperations.push({ type: 'addMember', data: op });
        }
        
        // 3-4. 멤버 제거 (이동을 위한 제거 - 새 팀에 추가한 후 원래 팀에서 제거)
        // 멤버 이동의 경우 이미 새 팀에 추가되었으므로, 원래 팀에서 제거 시도
        // 404 에러는 무시 (이미 이동했거나 팀이 삭제된 경우)
        for (const op of operations.removeMembers) {
          try {
            await roundsApi.removeTeamMember(roundId, op.teamId, op.teamMemberId);
            executedOperations.push({ type: 'removeMember', data: op });
          } catch (removeError) {
            // 404 에러는 무시 (이미 이동했거나 팀이 삭제된 경우)
            if (removeError?.response?.status === 404) {
              console.warn('멤버 제거 시도 중 404 에러 (이미 이동했거나 팀이 삭제됨):', {
                teamId: op.teamId,
                teamMemberId: op.teamMemberId,
                userId: op.userId
              });
              // 롤백용으로는 기록하지 않음 (이미 처리된 것으로 간주)
            } else {
              // 다른 에러는 다시 throw
              throw removeError;
            }
          }
        }
        
        // 3-5. 팀 삭제 (마지막에 실행 - 모든 작업이 성공한 후)
        for (const op of operations.deleteTeams) {
          await roundsApi.deleteTeamByMeeting(op.teamId);
          executedOperations.push({ type: 'deleteTeam', data: op });
        }

        showToast('팀 편성 변경사항을 저장했습니다.');
        setShowTeamEditorModal(false);
        await refreshAll();
        
      } catch (execError) {
        // ===== 4단계: 롤백 (실패 시) =====
        console.error('작업 실행 중 오류 발생, 롤백 시작:', execError);
        
        // 역순으로 롤백
        for (let i = executedOperations.length - 1; i >= 0; i--) {
          const executed = executedOperations[i];
          try {
            if (executed.type === 'addMember') {
              // 추가한 멤버 제거
              // 새로 추가된 멤버이므로 teamMemberId를 찾아야 함
              // 하지만 새로 추가된 멤버는 teamMemberId가 없을 수 있으므로
              // 팀 목록을 다시 조회하여 찾거나, 원본 상태로 복구 불가
              // 일단 팀에서 제거 시도 (실패할 수 있음)
              try {
                // 팀 목록을 다시 조회하여 teamMemberId 찾기
                const teamsResponse = await roundsApi.getRoundTeams(roundId);
                const currentTeams = extractList(teamsResponse);
                const targetTeam = currentTeams.find(t => t.id === executed.data.teamId);
                if (targetTeam) {
                  const members = targetTeam.members || targetTeam.team_members || [];
                  const member = members.find(m => 
                    String(m.user_id || m.id) === String(executed.data.userId)
                  );
                  if (member && (member.id || member.team_member_id)) {
                    await roundsApi.removeTeamMember(roundId, executed.data.teamId, member.id || member.team_member_id);
                  }
                }
              } catch (removeError) {
                console.warn('추가한 멤버 제거 실패 (롤백):', removeError);
              }
            } else if (executed.type === 'removeMember') {
              // 제거한 멤버를 원래 팀에 다시 추가
              // executed.data에는 teamId와 userId가 있음
              await roundsApi.addTeamMember(roundId, executed.data.teamId, executed.data.userId);
            } else if (executed.type === 'createTeam') {
              // 생성한 팀 삭제
              if (executed.data.createdTeamId) {
                await roundsApi.deleteTeamByMeeting(executed.data.createdTeamId);
              }
            } else if (executed.type === 'updateTeamName') {
              // 팀 이름 원복
              const originalTeam = originalTeamMap.get(executed.data.teamId);
              if (originalTeam) {
                await roundsApi.updateTeam(executed.data.teamId, { name: originalTeam.name });
              }
            }
            // deleteTeam은 롤백 불가 (이미 삭제됨)
          } catch (rollbackError) {
            console.error('롤백 중 오류 발생:', rollbackError);
            // 롤백 실패는 로그만 남기고 계속 진행
          }
        }
        
        // 원래 에러를 다시 throw
        throw execError;
      }
      
    } catch (err) {
      console.error('팀 편성 변경사항 저장 실패:', err);
      let message = '팀 편성 변경사항 저장에 실패했습니다.';
      
      if (err.message && err.message.includes('한 사용자는 한 팀에만 속할 수 있습니다')) {
        message = err.message;
      } else if (err?.response?.data?.detail) {
        message = formatApiError(err.response.data.detail);
      }
      
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCompleteMeeting = async () => {
    try {
      setProcessingAction(true);
      if (isRoundingMeeting) {
        await roundsApi.completeMeeting(meetingId);
      } else {
        // 소셜 모임은 범용 API 사용
        await api.post(`/meetings/${meetingId}/complete`);
      }
      showToast('모임을 완료 처리했습니다.');
      await refreshAll();
    } catch (err) {
      console.error('모임 완료 처리 실패:', err);
      const message = err?.response?.data?.detail || '모임 완료 처리에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmSettlement = async () => {
    if (!isRoundingMeeting) return;
    try {
      setProcessingAction(true);
      await roundsApi.confirmSettlement(meetingId);
      showToast('정산을 확정했습니다.');
      await refreshAll();
    } catch (err) {
      console.error('정산 확정 실패:', err);
      const message = err?.response?.data?.detail || '정산 확정에 실패했습니다.';
      showToast(message, 'error');
    } finally {
      setProcessingAction(false);
    }
  };

  // 승인 대기 제거 - 참가 신청은 바로 확정됨
  const confirmedParticipants = participants.filter(
    (participant) => participant.status === 'CONFIRMED',
  );

  const hasApplicationClosedEarlyFlag =
    meeting !== null && Object.prototype.hasOwnProperty.call(meeting, 'application_closed_early');
  const isApplicationClosedEarly =
    hasApplicationClosedEarlyFlag && Boolean(meeting?.application_closed_early);

  const isApplicationDeadlinePassed = isPastDateTime(meeting?.application_deadline);
  // 라운딩 모임은 날짜만 비교, 소셜 모임은 시간까지 비교
  const isMeetingTimePassed = isRoundingMeeting
    ? isPastDate(meeting?.meeting_time)
    : isPastDateTime(meeting?.meeting_time);

  useEffect(() => {
    if (!isRoundingMeeting) return;
    if (!meetingId || !meeting) return;
    if (loading) return;
    if (meeting.status !== 'SCHEDULED') return;
    if (!meeting.application_deadline) return;
    if (!isApplicationDeadlinePassed) return;
    
    // 이미 조기 마감된 경우는 백엔드 API 호출하지 않음
    if (isApplicationClosedEarly) {
      // 이미 마감되었고 인원이 부족하면 상태만 확인
      if (confirmedParticipants.length < 4) {
        // 백엔드에서 이미 취소 처리되었을 수 있으므로 상태만 새로고침
        // 단, 한 번만 실행되도록 체크
        if (!autoCancelTriggeredRef.current) {
          autoCancelTriggeredRef.current = true;
          fetchMeetingDetail().catch((err) => {
            console.error('상태 새로고침 실패:', err);
            autoCancelTriggeredRef.current = false;
          });
        }
      }
      return;
    }
    
    // 백엔드 기준: 4명 이상이어야 함 (3명 이하면 취소)
    if (confirmedParticipants.length >= 4) return;
    if (autoCancelTriggeredRef.current) return;

    autoCancelTriggeredRef.current = true;

    const autoCancel = async () => {
      try {
        // silent 모드로 호출 (에러 발생 시 조용히 처리)
        await handleCloseApplicationEarly({ silent: true });
        // 자동 취소 후 즉시 상태 새로고침
        await fetchMeetingDetail();
      } catch (error) {
        console.error('자동 취소 실패:', error);
        // 에러가 발생해도 상태는 새로고침 (백엔드에서 이미 처리되었을 수 있음)
        try {
          await fetchMeetingDetail();
        } catch (refreshError) {
          console.error('상태 새로고침 실패:', refreshError);
        }
        // 에러가 발생했어도 다음에 다시 시도할 수 있도록 플래그 리셋하지 않음
        // (이미 처리되었을 수 있으므로)
      }
    };

    autoCancel();
  }, [
    confirmedParticipants.length,
    handleCloseApplicationEarly,
    isApplicationDeadlinePassed,
    isApplicationClosedEarly,
    isRoundingMeeting,
    loading,
    meeting,
    meetingId,
    fetchMeetingDetail,
  ]);

  // 소셜 모임 자동 취소 로직 (마감일 경과 후 1명일 때)
  useEffect(() => {
    if (isRoundingMeeting) return;
    if (!meetingId || !meeting) return;
    if (loading) return;
    if (meeting.status !== 'SCHEDULED') return;
    if (!meeting.application_deadline) return;
    if (!isApplicationDeadlinePassed) return;
    
    // 이미 조기 마감된 경우는 백엔드 API 호출하지 않음
    if (isApplicationClosedEarly) {
      // 이미 마감되었고 인원이 부족하면 상태만 확인
      if (confirmedParticipants.length === 1) {
        // 백엔드에서 이미 취소 처리되었을 수 있으므로 상태만 새로고침
        // 단, 한 번만 실행되도록 체크
        if (!autoCancelTriggeredRef.current) {
          autoCancelTriggeredRef.current = true;
          fetchMeetingDetail().catch((err) => {
            console.error('상태 새로고침 실패:', err);
            autoCancelTriggeredRef.current = false;
          });
        }
      }
      return;
    }
    
    // 소셜 모임 기준: 1명이면 취소
    if (confirmedParticipants.length !== 1) return;
    if (autoCancelTriggeredRef.current) return;

    autoCancelTriggeredRef.current = true;

    const autoCancel = async () => {
      try {
        // silent 모드로 호출 (에러 발생 시 조용히 처리)
        await handleCloseApplicationEarly({ silent: true });
        // 자동 취소 후 즉시 상태 새로고침
        await fetchMeetingDetail();
      } catch (error) {
        console.error('자동 취소 실패:', error);
        // 에러가 발생해도 상태는 새로고침 (백엔드에서 이미 처리되었을 수 있음)
        try {
          await fetchMeetingDetail();
        } catch (refreshError) {
          console.error('상태 새로고침 실패:', refreshError);
        }
        // 에러가 발생했어도 다음에 다시 시도할 수 있도록 플래그 리셋하지 않음
        // (이미 처리되었을 수 있으므로)
      }
    };

    autoCancel();
  }, [
    confirmedParticipants.length,
    handleCloseApplicationEarly,
    isApplicationDeadlinePassed,
    isApplicationClosedEarly,
    isRoundingMeeting,
    loading,
    meeting,
    meetingId,
    fetchMeetingDetail,
  ]);

  // 권한 계산을 useMemo로 감싸서 clubMemberships가 업데이트될 때마다 재계산
  const {
    isParticipant,
    currentParticipant,
    currentUserRole,
    currentUserClubRole,
    isOrganizer,
    isClubLeaderOrManager,
    hasManagerPermission,
  } = useMemo(() => {
    // user가 로드되지 않았으면 모든 권한을 false로 반환
    if (!user || !user.id) {
      return {
        isParticipant: false,
        currentParticipant: null,
        currentUserRole: 'PARTICIPANT',
        currentUserClubRole: undefined,
        isOrganizer: false,
        isClubLeaderOrManager: false,
        hasManagerPermission: false,
      };
    }

    // 타입 안전성을 위해 String 변환 사용
    const userIdString = String(user.id);
    const isParticipantValue = participants.some(
      (participant) => String(participant.user_id) === userIdString
    );
    const currentParticipantValue = participants.find(
      (participant) => String(participant.user_id) === userIdString
    );
    const currentUserRoleValue = currentParticipantValue?.role || 'PARTICIPANT';
    const currentUserClubRoleValue = clubMemberships[user.id]?.role;
    
    // 개설자 판단: 
    // 1) meeting.creator_id가 있으면 그것으로 판단 (하지만 Meeting 모델에 creator_id 필드가 없음)
    // 2) 참가자 중 ORGANIZER 역할을 가진 사용자가 개설자
    const organizerParticipantValue = participants.find(
      (p) => p.role === 'ORGANIZER'
    );
    const organizerUserIdValue = organizerParticipantValue?.user_id;
    
    const isOrganizerValue = Boolean(
      organizerUserIdValue &&
      String(organizerUserIdValue) === userIdString
    );
    
    // 클럽에서 리더/매니저인지
    const isClubLeaderOrManagerValue =
      currentUserClubRoleValue === 'LEADER' || currentUserClubRoleValue === 'MANAGER';
    
    // "관리 권한" = 개설자 OR (참가자이면서 클럽 리더/매니저)
    const hasManagerPermissionValue = Boolean(
      isOrganizerValue || (isParticipantValue && isClubLeaderOrManagerValue)
    );
    
    return {
      isParticipant: isParticipantValue,
      currentParticipant: currentParticipantValue,
      currentUserRole: currentUserRoleValue,
      currentUserClubRole: currentUserClubRoleValue,
      isOrganizer: isOrganizerValue,
      isClubLeaderOrManager: isClubLeaderOrManagerValue,
      hasManagerPermission: hasManagerPermissionValue,
    };
  }, [participants, user, clubMemberships, meeting]);

  // 디버깅: 권한 계산 로그 (항상 출력)
  useEffect(() => {
    const organizerParticipant = participants.find((p) => p.role === 'ORGANIZER');
    const organizerUserId = meeting?.creator_id || organizerParticipant?.user_id;
    
    console.log('권한 계산 디버깅 (상세):', {
      user: user,
      userId: user?.id,
      userLoading: userLoading,
      meeting: meeting ? { id: meeting.id, name: meeting.name } : null,
      creatorId: meeting?.creator_id,
      organizerParticipant: organizerParticipant,
      organizerParticipantUserId: organizerParticipant?.user_id,
      organizerUserId,
      participants: participants.map((p) => ({
        user_id: p.user_id,
        role: p.role,
        status: p.status,
      })),
      participantsCount: participants.length,
      currentParticipantRole: currentUserRole,
      isOrganizer,
      isParticipant,
      currentUserClubRole,
      isClubLeaderOrManager,
      hasManagerPermission,
      clubMemberships: clubMemberships,
      meetingId: meetingId,
    });
  }, [user, userLoading, meeting, participants, currentUserRole, isOrganizer, isParticipant, currentUserClubRole, isClubLeaderOrManager, hasManagerPermission, clubMemberships, meetingId]);

  const isApplicationClosed = isApplicationDeadlinePassed || isApplicationClosedEarly;
  const canJoin =
    meeting?.status === 'SCHEDULED' &&
    !isOrganizer &&  // 개설자는 참가 버튼을 볼 수 없음
    !isParticipant &&  // 참가자 목록에 없는 경우에만 참가 신청 가능
    (meeting?.max_participants == null || meeting?.participant_count < meeting?.max_participants) &&
    !isApplicationClosed;
  // 모집마감 후에도 취소 버튼은 표시하되 비활성화 상태로 표시
  // 참가자이고 개설자가 아니면 버튼 표시 (모집 마감 여부와 관계없이, 취소/완료 상태 제외)
  const canLeave = 
    meeting?.status !== 'CANCELED' && 
    meeting?.status !== 'COMPLETED' &&
    isParticipant && 
    !isOrganizer;
  // 실제 취소 가능 여부 (모집 마감 전에만 취소 가능)
  const canLeaveActually = canLeave && !isApplicationClosed;

  // 모임 상태 판단 로직 (프론트엔드 표시용)
  const getDisplayStatus = () => {
    // 취소 상태 처리
    if (meeting?.status === 'CANCELED') {
      return 'CANCELED';
    }

    // 정산 완료 판단
    if (meeting?.settlement_confirmed === true) {
      return '종료';
    }

    // 정산 진행 중 판단 (정산 정보 입력 중)
    if (meeting?.settlement_confirmed === false && teams.length > 0) {
      return '완료';
    }

    // 팀편성 완료 판단
    if (teams.length > 0) {
      return '진행중';
    }

    // 모집 마감 판단
    const isApplicationClosed = isApplicationDeadlinePassed || isApplicationClosedEarly;
    if (isApplicationClosed) {
      // 인원 미달 시 취소로 표시
      // 라운딩: 1-3명, 소셜: 1명
      if (isRoundingMeeting) {
        if (confirmedParticipants.length >= 1 && confirmedParticipants.length <= 3) {
          return 'CANCELED';
        }
      } else {
        if (confirmedParticipants.length === 1) {
          return 'CANCELED';
        }
      }
      return '모집마감';
    }

    // 예정 상태: 마감 처리되지 않은 경우 인원 미달만으로는 취소 표시하지 않음
    // 취소 배지는 마감 처리됨 AND 최소 인원 미달일 때만 표시
    return '예정';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case '예정':
        return 'bg-blue-100 text-blue-800';
      case '모집마감':
        return 'bg-amber-100 text-amber-800';
      case '진행중':
        return 'bg-amber-100 text-amber-800';
      case '완료':
        return 'bg-green-100 text-green-800';
      case '종료':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      // 백엔드 상태값도 지원 (하위 호환성)
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ORGANIZER':
        return 'bg-purple-100 text-purple-700';
      case 'PARTICIPANT':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  // 참가자 배지 표시 (역할 + 클럽 멤버십 역할 + 성별)
  const getParticipantBadges = (participant) => {
    const badges = [];
    const clubRole = clubMemberships[participant.user_id]?.role;
    const isCreator = meeting?.creator_id === participant.user_id;
    const isGuest = participant.is_guest === true;
    
    // 게스트 배지 추가 (게스트는 다른 배지와 함께 표시)
    if (isGuest) {
      badges.push({
        text: '게스트',
        className: 'bg-orange-100 text-orange-700',
      });
    }
    
    // 성별 배지 추가
    if (participant.gender) {
      const genderText = participant.gender === 'MALE' || participant.gender === '남성' ? '남성' : 
                        participant.gender === 'FEMALE' || participant.gender === '여성' ? '여성' : 
                        participant.gender;
      badges.push({
        text: genderText,
        className: 'bg-blue-100 text-blue-700',
      });
    }
    
    // 개설자는 "개설자" 배지만
    if (participant.role === 'ORGANIZER' || isCreator) {
      badges.push({
        text: '개설자',
        className: 'bg-purple-100 text-purple-700',
      });
    } else {
      // 참가자 배지 (게스트가 아닌 경우에만)
      if (!isGuest) {
        badges.push({
          text: '참가자',
          className: 'bg-green-100 text-green-700',
        });
      }
      
      // 리더/매니저 배지 추가 (게스트가 아닌 경우에만)
      if (!isGuest) {
        if (clubRole === 'LEADER') {
          badges.push({
            text: '리더',
            className: 'bg-purple-100 text-purple-800',
          });
        } else if (clubRole === 'MANAGER') {
          badges.push({
            text: '매니저',
            className: 'bg-blue-100 text-blue-800',
          });
        }
      }
    }
    
    return badges;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="flex h-48 sm:h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="rounded-xl border border-red-200 bg-white p-4 sm:p-6 md:p-8 text-center shadow-sm">
            <FaExclamationTriangle className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
            <h3 className="mb-2 text-lg sm:text-xl font-semibold text-neutral-900">모임 정보를 불러올 수 없습니다</h3>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-neutral-600">
              {error || '요청하신 모임이 존재하지 않거나 접근 권한이 없습니다.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/meetings')}
              className="rounded-lg bg-primary-600 px-4 py-2 sm:px-5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              모임 목록으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/meetings')}
            className="flex items-center text-xs sm:text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <FaArrowLeft className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            목록으로
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition-colors hover:text-primary-600"
              title="공유하기"
            >
              <FaShare className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              type="button"
              onClick={handleToggleFavorite}
              className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition-colors hover:text-red-600"
              title="즐겨찾기"
            >
              {isFavorite ? <FaHeart className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" /> : <FaRegHeart className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        <div className="mb-4 sm:mb-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold text-primary-600">
                  {meetingDomainType === 'ROUND' ? '라운딩' : '소셜'}
                </span>
                {(() => {
                  const displayStatus = getDisplayStatus();
                  
                  // 모집마감 배지 표시 여부
                  const showApplicationClosed = isApplicationClosed;
                  
                  // 모임완료 배지 표시 여부
                  const isMeetingCompleted = 
                    meeting?.is_completed === true || 
                    meeting?.status === 'COMPLETED' || 
                    isMeetingTimePassed;
                  
                  // 취소 상태는 단일 배지만 표시
                  if (displayStatus === 'CANCELED') {
                    return (
                      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-800">
                        취소
                      </span>
                    );
                  }
                  
                  // 종료 상태는 단일 배지만 표시
                  if (displayStatus === '종료') {
                    return (
                      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800">
                        종료
                      </span>
                    );
                  }
                  
                  // 진행중, 완료 상태는 단일 배지만 표시
                  if (displayStatus === '진행중' || displayStatus === '완료') {
                    const statusLabel = displayStatus === '진행중' ? '진행중' : '완료';
                    return (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(displayStatus)}`}>
                        {statusLabel}
                      </span>
                    );
                  }
                  
                  // 모집마감 또는 예정 상태에서 모집마감/모임완료 배지 표시
                  // 취소 상태가 아닐 때만 모집마감 배지 표시
                  return (
                    <>
                      {displayStatus === '모집마감' && (
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-800">
                          모집마감
                        </span>
                      )}
                      {isMeetingCompleted && displayStatus !== 'CANCELED' && (
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-green-100 text-green-800">
                          모임완료
                        </span>
                      )}
                      {meeting?.settlement_confirmed === true && (
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800">
                          정산완료
                        </span>
                      )}
                      {displayStatus === '예정' && !isMeetingCompleted && (
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                          예정
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
              <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold text-neutral-900 line-clamp-2">{meeting.name}</h1>
            </div>
            <div className="flex flex-col items-start gap-2 sm:gap-3 md:items-end">
              {(() => {
                const displayStatus = getDisplayStatus();
                const canEdit =
                  (isOrganizer || (isParticipant && isClubLeaderOrManager)) &&  // 개설자는 참가자 여부와 관계없이 수정 가능, 참가자이면서 리더/매니저도 가능
                  displayStatus !== 'CANCELED' &&
                  displayStatus !== '종료' &&
                  displayStatus !== '완료';
                const hasButtons = canEdit || canJoin || canLeave;
                return hasButtons ? (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full md:w-auto">
                    {canJoin && (
                      <button
                        type="button"
                        onClick={handleOpenJoinModal}
                        className="flex items-center gap-1 sm:gap-2 rounded-lg bg-green-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-green-700"
                      >
                        <FaUsers className="w-3 h-3 sm:w-4 sm:h-4" />
                        참가 신청
                      </button>
                    )}
                    {/* 참가자이고 개설자가 아니면 버튼 표시 (모집 마감 여부와 관계없이) */}
                    {canLeave && (
                      <button
                        type="button"
                        onClick={() => {
                          // 모집 마감 시에는 모달을 열지 않음
                          if (canLeaveActually) {
                            setShowLeaveModal(true);
                          }
                        }}
                        disabled={!canLeaveActually}
                        className="flex items-center gap-1 sm:gap-2 rounded-lg bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FaUsers className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">참가신청 취소</span>
                        <span className="sm:hidden">취소</span>
                      </button>
                    )}
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (!meeting) return;
                            const navigationState = {
                              mode: 'edit',
                              meeting,
                            };
                            navigate(
                              meetingType === 'social'
                                ? `/meetings/social/${meetingId}/edit`
                                : `/meetings/rounding/${meetingId}/edit`,
                              { state: navigationState },
                            );
                          }}
                          className="flex items-center gap-1 sm:gap-2 rounded-lg bg-primary-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                        >
                          <FaEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                          수정
                        </button>
                        {isRoundingMeeting &&
                          meeting.status === 'SCHEDULED' &&
                          hasApplicationClosedEarlyFlag &&
                          !isApplicationDeadlinePassed && (
                          <button
                            type="button"
                            onClick={() => handleCloseApplicationEarly()}
                            disabled={processingAction || isApplicationClosedEarly || meeting.status === 'CANCELED'}
                            className="flex items-center gap-1 sm:gap-2 rounded-lg bg-amber-500 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="hidden sm:inline">신청 마감하기</span>
                            <span className="sm:hidden">마감</span>
                          </button>
                        )}
                        {meeting.status === 'SCHEDULED' && !isMeetingTimePassed && (
                          <button
                            type="button"
                            onClick={() => setShowCancelModal(true)}
                            className="flex items-center gap-1 sm:gap-2 rounded-lg bg-red-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-red-700"
                          >
                            <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">모임 취소</span>
                            <span className="sm:hidden">취소</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : null;
              })()}
                </div>
                  </div>

          <div className="mt-4 sm:mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900">모임 정보</h3>
            <div className="mt-2 sm:mt-3 grid gap-3 sm:gap-4 md:grid-cols-2">
              {[
                {
                  key: 'meeting_time',
                  label: '모임 일시',
                  value: meeting.meeting_time ? formatDatetime(meeting.meeting_time) : '미정',
                  icon: FaCalendarAlt,
                },
                {
                  key: 'application_deadline',
                  label: '신청 마감',
                  value: meeting.application_deadline
                    ? formatDatetime(meeting.application_deadline)
                    : '미정',
                  icon: FaClock,
                },
                {
                  key: 'location',
                  label: '장소',
                  value: formatOptional(
                    meetingDomainType === 'ROUND'
                      ? meeting.location
                      : meeting.venue_name || meeting.location,
                  ),
                  icon: FaMapMarkerAlt,
                },
                {
                  key: 'club_name',
                  label: '소속 클럽',
                  value: formatOptional(meeting.club_name),
                  icon: FaUser,
                },
                {
                  key: 'participants',
                  label: '참가자 수',
                  value: formatParticipantsCount(meeting, isApplicationClosedEarly),
                  icon: FaUsers,
                },
                {
                  key: 'description',
                  label: '설명',
                  value: formatOptional(meeting.description, '등록된 설명이 없습니다.'),
                  icon: FaStickyNote,
                  fullWidth: true,
                  multiline: true,
                },
                ...(isRoundingMeeting
                  ? [
                      {
                        key: 'course_name',
                        label: '골프장명',
                        value: formatOptional(meeting.course_name),
                        icon: FaGolfBall,
                      },
                      {
                        key: 'hole_count',
                        label: '홀 수',
                        value: formatHoleCount(meeting.hole_count),
                        icon: FaClipboardList,
                      },
                      {
                        key: 'reservation_name',
                        label: '예약자명',
                        value: formatOptional(meeting.reservation_name),
                        icon: FaUserTie,
                      },
                      {
                        key: 'tee_times',
                        label: '티타임',
                        value: formatTeeTimes(meeting.tee_times),
                        icon: FaClock,
                        fullWidth: true,
                      },
                      {
                        key: 'team_size',
                        label: '한 조당 인원 수',
                        value: formatTeamSize(meeting.team_size),
                        icon: FaUsers,
                      },
                      {
                        key: 'team_formation_mode',
                        label: '팀 구성 방식',
                        value: formatOptional(
                          TEAM_FORMATION_MODE_LABELS[meeting.team_formation_mode] ||
                            meeting.team_formation_mode,
                          '미정',
                        ),
                        icon: FaClipboardList,
                      },
                      {
                        key: 'meeting_subtype',
                        label: '모임 유형',
                        value: formatOptional(
                          MEETING_SUBTYPE_LABELS[meeting.meeting_subtype] || meeting.meeting_subtype,
                          '미정',
                        ),
                        icon: FaClipboardList,
                      },
                      {
                        key: 'settlement_method',
                        label: '정산 방법',
                        value: formatOptional(
                          SETTLEMENT_METHOD_LABELS[meeting.settlement_method] ||
                            meeting.settlement_method,
                          '미정',
                        ),
                        icon: FaDollarSign,
                      },
                    ]
                  : [
                      {
                        key: 'social_type',
                        label: '모임 유형',
                        value: formatOptional(
                          SOCIAL_TYPE_LABELS[meeting.type] || meeting.type,
                          '미정',
                        ),
                        icon: FaClipboardList,
                      },
                      {
                        key: 'social_settlement_method',
                        label: '정산 방법',
                        value: formatOptional(
                          SOCIAL_SETTLEMENT_METHOD_LABELS[meeting.social_settlement_method] ||
                            meeting.social_settlement_method,
                          '미정',
                        ),
                        icon: FaDollarSign,
                      },
                    ]),
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.key}
                    className={`flex items-start gap-2 sm:gap-3 text-neutral-700 ${
                      item.fullWidth ? 'md:col-span-2' : ''
                    }`}
                  >
                    {IconComponent && (
                      <IconComponent className="mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-neutral-500">{item.label}</p>
                      <p
                        className={`text-sm sm:text-base font-semibold text-neutral-900 ${
                          item.multiline ? 'whitespace-pre-line' : ''
                        }`}
                      >
                        {item.value}
                      </p>
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {(meeting.total_cost || meeting.green_fee || meeting.caddy_fee || meeting.social_cost) && (
            <div className="mt-4 sm:mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900">비용 정보</h3>
              <div className="mt-2 sm:mt-3 grid gap-3 sm:gap-4 md:grid-cols-2">
                {meetingDomainType === 'ROUND' && (
                  <>
                    {meeting.total_cost && (
                      <div className="flex items-center gap-2 text-neutral-700">
                        <FaDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-500">총 비용</p>
                          <p className="text-sm sm:text-base font-semibold text-neutral-900">
                            {formatCurrency(meeting.total_cost)}
                          </p>
                        </div>
                      </div>
                    )}
                    {meeting.green_fee && (
                      <div className="flex items-center gap-2 text-neutral-700">
                        <FaDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-500">그린피</p>
                          <p className="text-sm sm:text-base font-semibold text-neutral-900">
                            {formatCurrency(meeting.green_fee)}
                          </p>
                        </div>
                      </div>
                    )}
                    {meeting.caddy_fee && (
                      <div className="flex items-center gap-2 text-neutral-700">
                        <FaDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-500">캐디피</p>
                          <p className="text-sm sm:text-base font-semibold text-neutral-900">
                            {formatCurrency(meeting.caddy_fee)}
                          </p>
                        </div>
                      </div>
                    )}
                    {meeting.cart_fee && (
                      <div className="flex items-center gap-2 text-neutral-700">
                        <FaDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-neutral-500">카트비</p>
                          <p className="text-sm sm:text-base font-semibold text-neutral-900">
                            {formatCurrency(meeting.cart_fee)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {meetingDomainType === 'SOCIAL' && meeting.social_cost && (
                  <div className="flex items-center gap-2 text-neutral-700">
                    <FaDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-neutral-500">소셜 비용</p>
                      <p className="text-sm sm:text-base font-semibold text-neutral-900">
                        {formatCurrency(meeting.social_cost)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {meeting.status === 'CANCELED' &&
            meeting.cancel_reason &&
            (meeting.cancel_reason.includes('인원') ||
              meeting.cancel_reason.includes('미달') ||
              meeting.cancel_reason.includes('자동 취소')) && (
              <div className="mt-4 sm:mt-6 rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6 text-xs sm:text-sm text-red-700">
                <h3 className="text-sm sm:text-base font-semibold text-red-800">모임 취소 안내</h3>
                <p className="mt-1.5 sm:mt-2">
                  모임이 최소신청인원 미달로 취소되었습니다.
                </p>
              </div>
            )}
        </div>

        {isRoundingMeeting && (
          <div className="mb-4 sm:mb-6">
            <MeetingWorkflowStatus
              meeting={meeting}
              participants={participants}
              teams={teams}
              userRole={currentUserRole}
              applicationStatus={applicationStatus}
              confirmedParticipants={confirmedParticipants}
              isApplicationDeadlinePassed={isApplicationDeadlinePassed}
              isApplicationClosedEarly={isApplicationClosedEarly}
              onCloseApplicationEarly={handleCloseApplicationEarly}
              onAutoFormTeams={handleOpenTeamFormationModal}
              onConfirmTeamFormation={handleConfirmTeamFormation}
              onStartRounding={handleStartRounding}
              onCompleteRounding={handleOpenCompleteRoundingModal}
              onCompleteMeeting={handleCompleteMeeting}
            />
          </div>
        )}

        {!isRoundingMeeting && (
          <div className="mb-4 sm:mb-6 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900">모임 관리</h3>
                <p className="mt-1 text-xs sm:text-sm text-neutral-500">
                  모임이 완료되면 정산 정보를 입력할 수 있습니다.
                </p>
              </div>
              {hasManagerPermission &&
                meeting.status === 'SCHEDULED' &&
                !isMeetingTimePassed &&
                !meeting?.is_completed && (
                  <button
                    type="button"
                    onClick={handleCompleteMeeting}
                    disabled={processingAction || !isParticipant}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-green-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    모임 완료
                  </button>
                )}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-wrap border-b border-neutral-200 overflow-x-auto scrollbar-hide">
            {TAB_CONFIG.filter((tab) => isRoundingMeeting || tab.key !== 'teams').map((tab) => {
              // 팀 탭 활성화 조건 (라운딩 모임만)
              const canAccessTeamTab =
                isRoundingMeeting &&
                confirmedParticipants.length >= 4 &&
                (isApplicationDeadlinePassed || isApplicationClosedEarly);
              // 팀이 있거나, 편성 확정된 경우(팀 상태가 CONFIRMED) 탭 활성화
              const hasConfirmedTeams = teams.some(team => team.status === 'CONFIRMED');
              const disabled =
                (tab.key === 'teams' && (!canAccessTeamTab || (teams.length === 0 && !hasConfirmedTeams)));
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  disabled={disabled}
                  className={`flex-1 min-w-[90px] px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-neutral-500 hover:text-neutral-900'
                  } ${disabled ? 'cursor-not-allowed text-neutral-300 hover:text-neutral-300' : ''}`}
                >
                  {tab.label}
                  {tab.key === 'participants' && (
                    <span className="ml-1 sm:ml-2 rounded-full bg-neutral-100 px-1.5 sm:px-2 py-0.5 text-xs text-neutral-600">
                      {participants.length}
                    </span>
                  )}
                  {tab.key === 'teams' && teams.length > 0 && (
                    <span className="ml-1 sm:ml-2 rounded-full bg-neutral-100 px-1.5 sm:px-2 py-0.5 text-xs text-neutral-600">
                      {teams.length}
                    </span>
                  )}
                </button>
              );
            })}
            {/* 라운딩 모임: rounding_completed_at이 있을 때, 소셜 모임: settlement_confirmed가 true이거나 정산이 생성되었을 때 */}
            {((isRoundingMeeting && meeting?.rounding_completed_at) || 
              (!isRoundingMeeting && meeting?.settlement_confirmed !== undefined)) && (
              <button
                type="button"
                onClick={() => setActiveTab('my-settlement')}
                className={`flex-1 min-w-[90px] px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'my-settlement'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                내 정산 보기
              </button>
            )}
          </div>

          <div className="p-3 sm:p-4 md:p-6">
            {activeTab === 'participants' && (
              <div className="space-y-4 sm:space-y-6">
                {hasManagerPermission && isRoundingMeeting && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
                    <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-neutral-900">참가 신청 관리</h3>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1">
                          참가자를 확인하고 조기 마감 또는 팀 편성을 시작할 수 있습니다.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                        {hasApplicationClosedEarlyFlag && !isApplicationClosedEarly && !isApplicationDeadlinePassed && (
                          <button
                            type="button"
                            onClick={handleCloseApplicationEarly}
                            disabled={
                              processingAction ||
                              participants.length === 0 ||
                              isApplicationClosedEarly ||
                              meeting.status === 'CANCELED'
                            }
                            className="rounded-lg border border-amber-400 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <span className="hidden sm:inline">신청 마감하기</span>
                            <span className="sm:hidden">마감</span>
                          </button>
                        )}
                        {hasApplicationClosedEarlyFlag && isApplicationClosedEarly && (
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 sm:px-3 text-xs font-semibold text-amber-700">
                            신청 마감됨
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowGuestModal(true)}
                          disabled={processingAction || meeting.status === 'CANCELED' || meeting?.rounding_started_at !== null}
                          className="rounded-lg bg-green-600 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          게스트 추가
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenTeamFormationModal}
                          disabled={
                            processingAction ||
                            confirmedParticipants.length < 4 ||
                                !isApplicationClosed ||
                                meeting.status !== 'SCHEDULED' ||
                                meeting?.team_formation_confirmed_at !== null
                          }
                          className="rounded-lg bg-blue-600 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="hidden sm:inline">팀 편성 시작</span>
                          <span className="sm:hidden">팀 편성</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenBatchFormationModal}
                          disabled={
                            processingAction ||
                            confirmedParticipants.length < 4 ||
                                !isApplicationClosed ||
                                meeting.status !== 'SCHEDULED' ||
                                meeting?.team_formation_confirmed_at !== null
                          }
                          className="rounded-lg bg-purple-600 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          일괄 편성
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFormationHistoryModal(true)}
                          disabled={processingAction || meeting?.team_formation_confirmed_at !== null}
                          className="rounded-lg bg-indigo-600 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="hidden sm:inline">편성 히스토리</span>
                          <span className="sm:hidden">히스토리</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelModal(true)}
                          disabled={processingAction || meeting.status !== 'SCHEDULED'}
                          className="rounded-lg bg-rose-100 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-200"
                        >
                          모임 취소
                        </button>
                      </div>
                    </div>
                    {applicationStatus && (
                      <div className="grid gap-2 sm:gap-3 text-sm text-neutral-700 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg bg-white p-2.5 sm:p-3 shadow-sm">
                          <p className="text-xs text-neutral-500">전체 신청</p>
                          <p className="text-base sm:text-lg font-semibold text-neutral-900">
                            {applicationStatus.total_applications ?? '-'}명
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 sm:p-3 shadow-sm">
                          <p className="text-xs text-neutral-500">확정 인원</p>
                          <p className="text-base sm:text-lg font-semibold text-green-600">
                            {applicationStatus.confirmed_count ?? '-'}명
                          </p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 sm:p-3 shadow-sm">
                          <p className="text-xs text-neutral-500">정원</p>
                          <p className="text-base sm:text-lg font-semibold text-neutral-900">
                            {applicationStatus.max_participants ?? '-'}명
                          </p>
                        </div>
                      </div>
                    )}
                    {/* 승인 대기 섹션 제거 - 참가 신청은 바로 확정됨 */}
                  </div>
                )}

                <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-3 sm:gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4"
                    >
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-500 text-white shadow-sm flex-shrink-0">
                        <FaUser className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-neutral-900 line-clamp-1">
                          {participant.is_guest ? participant.guest_name || participant.user_name : participant.user_name}
                        </p>
                        <p className="text-xs text-neutral-500 line-clamp-1">
                          {participant.is_guest ? '게스트' : participant.user_email}
                        </p>
                        <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                          {getParticipantBadges(participant).map((badge, index) => (
                            <span
                              key={index}
                              className={`rounded-full px-2 py-0.5 font-semibold ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          ))}
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold ${
                              participant.status === 'CONFIRMED'
                                ? 'bg-green-100 text-green-700'
                                : participant.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {participant.status === 'CONFIRMED'
                              ? '확정'
                              : participant.status === 'REJECTED'
                              ? '거절'
                              : '취소'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'teams' && isRoundingMeeting && (
              <div className="space-y-4">
                {/* 팀 편성 확정일자 표시 */}
                {meeting?.team_formation_confirmed_at && (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2">
                    <p className="text-sm font-medium text-green-800">
                      편성 확정일: {new Date(meeting.team_formation_confirmed_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                {hasManagerPermission && teams.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleOpenTeamEditorModal}
                      disabled={processingAction || meeting?.rounding_started_at !== null}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                    >
                      <FaEdit className="w-4 h-4" />
                      팀 편성 수정
                    </button>
                  </div>
                )}
                {teams.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-neutral-500">
                    생성된 팀이 없습니다.
                  </div>
                ) : (
                  teams.map((team) => (
                    <div key={team.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-900">{team.name}</h3>
                        <span className="text-sm text-neutral-500">
                          {team.members?.length ?? 0}명
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {team.members?.map((member) => {
                          const genderText = member.gender === 'MALE' ? '남' : member.gender === 'FEMALE' ? '여' : '';
                          // 핸디캡: null/undefined가 아니면 표시 (0도 표시)
                          const handicapText = (member.handicap_index !== null && member.handicap_index !== undefined)
                            ? `핸디: ${member.handicap_index}` 
                            : '';
                          // 직전대회성적: null/undefined가 아니면 표시 (0도 표시)
                          const scoreText = (member.recent_avg_score !== null && member.recent_avg_score !== undefined)
                            ? `직전대회: ${member.recent_avg_score}타`
                            : '';
                          
                          return (
                            <div
                              key={member.id}
                              className="rounded-lg border border-neutral-200 bg-white p-3"
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-purple-500 text-white">
                                  <FaUser className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-neutral-900 truncate">
                                    {member.user_name}
                                  </p>
                                  {member.user_nickname && member.user_name !== member.user_nickname && (
                                    <p className="text-xs text-neutral-500 truncate">
                                      {member.user_nickname}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                                {genderText && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                    {genderText}
                                  </span>
                                )}
                                {handicapText && (
                                  <span className="px-2 py-0.5 rounded bg-green-50 text-green-700">
                                    {handicapText}
                                  </span>
                                )}
                                {scoreText && (
                                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                    {scoreText}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'settlement' && (
              (() => {
                // 정산 대상자는 CONFIRMED 상태의 참가자만
                const confirmedParticipants = participants.filter(
                  (p) => p.status === 'CONFIRMED'
                );
                
                // 정산 가능 여부 판단 함수
                const canSettle = () => {
                  // 모임이 취소된 경우 정산 불가
                  if (meeting.status === 'CANCELED') {
                    return false;
                  }

                  const isApplicationClosed = isApplicationDeadlinePassed || isApplicationClosedEarly;
                  
                  // 인원 미달 조건: 마감 후에만 체크
                  let isMinParticipantsNotMet = false;
                  if (isApplicationClosed) {
                    if (isRoundingMeeting) {
                      // 라운딩: 마감 후 1-3명
                      isMinParticipantsNotMet =
                        confirmedParticipants.length >= 1 &&
                        confirmedParticipants.length <= 3;
                    } else {
                      // 소셜: 마감 후 1명
                      isMinParticipantsNotMet = confirmedParticipants.length === 1;
                    }
                  }

                  // 인원 미달로 취소된 경우 정산 불가
                  if (isMinParticipantsNotMet) {
                    return false;
                  }

                  // 소셜 모임의 정산 가능 조건
                  if (!isRoundingMeeting) {
                    // 모임 완료 처리됨
                    if (meeting?.is_completed === true || meeting?.status === 'COMPLETED') {
                      return true;
                    }
                    // 또는 모집 완료 + 모임 일시 경과
                    if (isApplicationClosed && isMeetingTimePassed) {
                      return true;
                    }
                    return false;
                  }

                  // 라운딩 모임의 정산 가능 조건
                  // 정산 진행 중인 경우 정산 가능
                  if (meeting?.settlement_confirmed === false && teams.length > 0) {
                    return true;
                  }

                  // 팀 편성이 완료되고 모임이 완료된 경우 정산 가능
                  // teams.length > 0이면 팀 편성 완료로 간주
                  if (teams.length > 0) {
                    return true;
                  }

                  // 그 외의 경우 (예정 상태, 팀 편성 안 됨 등) 정산 불가
                  return false;
                };

                // 정산 탭 안내 메시지 함수
                const getSettlementMessage = () => {
                  const isCanceled = meeting.status === 'CANCELED';
                  const isApplicationClosed = isApplicationDeadlinePassed || isApplicationClosedEarly;
                  
                  // 인원 미달 조건: 마감 후에만 체크
                  let isMinParticipantsNotMet = false;
                  if (isApplicationClosed) {
                    if (isRoundingMeeting) {
                      // 라운딩: 마감 후 1-3명
                      isMinParticipantsNotMet =
                        confirmedParticipants.length >= 1 &&
                        confirmedParticipants.length <= 3;
                    } else {
                      // 소셜: 마감 후 1명
                      isMinParticipantsNotMet = confirmedParticipants.length === 1;
                    }
                  }

                  if (isCanceled) {
                    return '모임이 취소되어 정산을 진행할 수 없습니다.';
                  }
                  if (isMinParticipantsNotMet) {
                    return '참가인원 미달로 모임이 취소되어 정산을 진행할 수 없습니다.';
                  }
                  return null;
                };

                const settlementMessage = getSettlementMessage();
                const isSettlable = canSettle();

                // 정산 관리 권한: 상단에서 계산한 hasManagerPermission 사용
                const canManageSettlementForTab = hasManagerPermission;
                
                // 디버깅: 정산 탭 권한 확인 (상세)
                const organizerParticipantForDebug = participants.find((p) => p.role === 'ORGANIZER');
                console.log('정산 탭 권한 디버깅 (상세):', {
                  user: user,
                  userId: user?.id,
                  userLoading: userLoading,
                  meeting: meeting ? { id: meeting.id, name: meeting.name, creator_id: meeting.creator_id } : null,
                  participants: participants.map((p) => ({
                    user_id: p.user_id,
                    role: p.role,
                    status: p.status,
                  })),
                  organizerParticipant: organizerParticipantForDebug,
                  organizerParticipantUserId: organizerParticipantForDebug?.user_id,
                  hasManagerPermission,
                  canManageSettlementForTab,
                  isOrganizer,
                  isParticipant,
                  isClubLeaderOrManager,
                  currentUserClubRole,
                  clubMemberships: clubMemberships,
                  meetingCreatorId: meeting?.creator_id,
                });

                if (settlementMessage) {
                  return (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                      <h3 className="text-base font-semibold text-red-800">정산을 진행할 수 없습니다</h3>
                      <p className="mt-2">{settlementMessage}</p>
                    </div>
                  );
                }
                
                return (
                  <SettlementManager
                    meetingId={meetingId}
                    meetingType={meetingDomainType}
                    canSettle={isSettlable}
                    canManageSettlement={canManageSettlementForTab}
                    participants={confirmedParticipants}
                    onSettlementCreated={refreshAll}
                    onConfirmSettlement={handleConfirmSettlement}
                    meeting={meeting}
                  />
                );
              })()
            )}

            {activeTab === 'my-settlement' && (
              <MySettlementView meetingId={meetingId} />
            )}

          </div>
        </div>
      </div>

      {toast.open && (
        <div
          className={`fixed top-3 right-3 sm:top-6 sm:right-6 z-50 flex max-w-xs items-center gap-2 sm:gap-3 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold shadow-lg ${
            toast.tone === 'error'
              ? 'bg-red-600 text-white'
              : toast.tone === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {toast.tone === 'error' ? <FaTimes className="w-3 h-3 sm:w-4 sm:h-4" /> : <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {showJoinModal && isRoundingMeeting && (
        <RoundingJoinModal
          isOpen={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setIsEditingUserInfo(false);
            fetchUserProfile();
            fetchHandicapInfo();
          }}
          meeting={meeting}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          userInfoLoading={userInfoLoading}
          handicapInfo={handicapInfo}
          handicapLoading={handicapLoading}
          isEditingUserInfo={isEditingUserInfo}
          onEditUserInfo={(editing) => {
            if (!editing) {
              fetchUserProfile();
              fetchHandicapInfo();
            }
            setIsEditingUserInfo(editing);
          }}
          onUpdateUserInfo={handleUpdateUserInfo}
          onJoin={handleJoinMeeting}
          processingAction={processingAction}
        />
      )}

      {showJoinModal && !isRoundingMeeting && (
        <SocialJoinModal
          isOpen={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setIsEditingUserInfo(false);
            fetchUserProfile();
          }}
          meeting={meeting}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          userInfoLoading={userInfoLoading}
          isEditingUserInfo={isEditingUserInfo}
          onEditUserInfo={(editing) => {
            if (!editing) {
              fetchUserProfile();
            }
            setIsEditingUserInfo(editing);
          }}
          onUpdateUserInfo={handleUpdateUserInfo}
          onJoin={handleJoinMeeting}
          processingAction={processingAction}
        />
      )}

      {/* 참가 신청 완료 모달 */}
      {showJoinSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <FaCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">참가 신청 완료</h3>
              <p className="mb-6 text-neutral-600">
                모임 참가 신청이 완료되었습니다.
              </p>
              <button
                type="button"
                onClick={() => setShowJoinSuccessModal(false)}
                className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-neutral-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-neutral-900">참가 신청 취소</h3>
            </div>
            <div className="px-5 py-6">
              <p className="text-sm text-neutral-700">
                정말 참가신청을 취소하시겠습니까?
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-neutral-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleLeaveMeeting}
                disabled={processingAction}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-neutral-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-neutral-900">모임 취소</h3>
            </div>
            <div className="px-5 py-6">
              <p className="text-sm text-neutral-700">
                모임을 취소 상태로 변경합니다. 참가자에게 취소 알림이 발송될 수 있습니다. 계속
                진행하시겠습니까?
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-neutral-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCancelMeeting}
                disabled={processingAction}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                모임 취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 게스트 추가 모달 */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 pb-20 sm:pb-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[calc(100vh-8rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-neutral-900">게스트 추가</h3>
              <button
                type="button"
                onClick={() => {
                  setShowGuestModal(false);
                  setGuestForm({
                    name: '',
                    birthdate: '',
                    gender: '',
                    handicap: '',
                    average_score: ''
                  });
                  setGuestFormErrors({});
                }}
                className="text-neutral-400 transition-colors hover:text-neutral-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-6 space-y-4">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => {
                    setGuestForm(prev => ({ ...prev, name: e.target.value }));
                    if (guestFormErrors.name) {
                      setGuestFormErrors(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    guestFormErrors.name ? 'border-red-300' : 'border-neutral-300'
                  }`}
                  placeholder="게스트 이름"
                  maxLength={255}
                />
                {guestFormErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.name}</p>
                )}
              </div>

              {/* 생년월일 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  생년월일
                </label>
                <input
                  type="date"
                  value={guestForm.birthdate}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    
                    // 실시간 만 14세 검증
                    if (selectedDate) {
                      const birth = new Date(selectedDate);
                      if (!isNaN(birth.getTime())) {
                        const today = new Date();
                        let age = today.getFullYear() - birth.getFullYear();
                        const m = today.getMonth() - birth.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                        
                        // 만 14세 미만인 경우 입력값 초기화 및 에러 메시지 표시
                        if (age < 14) {
                          setGuestForm(prev => ({ ...prev, birthdate: '' }));
                          setGuestFormErrors(prev => ({ ...prev, birthdate: '만 14세 이상만 참가할 수 있습니다.' }));
                          return;
                        }
                        if (birth.getFullYear() < 1900) {
                          setGuestForm(prev => ({ ...prev, birthdate: '' }));
                          setGuestFormErrors(prev => ({ ...prev, birthdate: '올바른 생년월일을 입력해주세요.' }));
                          return;
                        }
                        if (birth > today) {
                          setGuestForm(prev => ({ ...prev, birthdate: '' }));
                          setGuestFormErrors(prev => ({ ...prev, birthdate: '생년월일은 미래 날짜일 수 없습니다.' }));
                          return;
                        }
                      }
                    }
                    
                    // 검증 통과 시 값 설정 및 에러 초기화
                    setGuestForm(prev => ({ ...prev, birthdate: selectedDate }));
                    if (guestFormErrors.birthdate) {
                      setGuestFormErrors(prev => ({ ...prev, birthdate: '' }));
                    }
                  }}
                  max={(() => {
                    const today = new Date();
                    const maxDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    guestFormErrors.birthdate ? 'border-red-300' : 'border-neutral-300'
                  }`}
                />
                {guestFormErrors.birthdate && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.birthdate}</p>
                )}
              </div>

              {/* 성별 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  성별
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="guest_gender"
                      value="MALE"
                      checked={guestForm.gender === 'MALE'}
                      onChange={(e) => {
                        setGuestForm(prev => ({ ...prev, gender: e.target.value }));
                        if (guestFormErrors.gender) {
                          setGuestFormErrors(prev => ({ ...prev, gender: '' }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-neutral-700">남성</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="guest_gender"
                      value="FEMALE"
                      checked={guestForm.gender === 'FEMALE'}
                      onChange={(e) => {
                        setGuestForm(prev => ({ ...prev, gender: e.target.value }));
                        if (guestFormErrors.gender) {
                          setGuestFormErrors(prev => ({ ...prev, gender: '' }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-neutral-700">여성</span>
                  </label>
                </div>
                {guestFormErrors.gender && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.gender}</p>
                )}
              </div>

              {/* 평균 타수 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  평균 타수 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="55"
                  max="144"
                  value={guestForm.average_score}
                  onChange={(e) => handleGuestNumberChange('average_score', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    guestFormErrors.average_score ? 'border-red-300 bg-red-50' : 'border-neutral-300'
                  }`}
                  placeholder="55-144"
                />
                {!guestFormErrors.average_score && (
                  <p className="mt-1 text-xs text-neutral-500">55-144 사이의 숫자를 입력해주세요.</p>
                )}
                {guestFormErrors.average_score && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{guestFormErrors.average_score}</p>
                )}
              </div>

              {/* 핸디캡 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  핸디캡
                  <span className="text-xs text-neutral-500 ml-2">(평균 타수로 자동 계산)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="72"
                  step="0.1"
                  value={
                    guestForm.average_score && !isNaN(guestForm.average_score) && guestForm.average_score >= 55 && guestForm.average_score <= 144
                      ? Math.max(0, Math.min(72, parseFloat(guestForm.average_score) - 72)).toFixed(1)
                      : (guestForm.handicap || '')
                  }
                  onChange={() => {}}
                  disabled={true}
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-neutral-50 border-neutral-300"
                  placeholder="평균 타수 입력 시 자동 계산됩니다"
                />
                {guestFormErrors.handicap && (
                  <p className="mt-1 text-xs text-red-600">{guestFormErrors.handicap}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-neutral-200 px-5 py-4 pb-6 sm:pb-4">
              <button
                type="button"
                onClick={() => {
                  setShowGuestModal(false);
                  setGuestForm({
                    name: '',
                    birthdate: '',
                    gender: '',
                    handicap: '',
                    average_score: ''
                  });
                  setGuestFormErrors({});
                }}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddGuest}
                disabled={processingAction}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 팀 편성 모달 */}
      <TeamFormationModal
        isOpen={showTeamFormationModal}
        onClose={() => setShowTeamFormationModal(false)}
        onFormTeams={handleFormTeams}
        meeting={meeting}
        processing={processingAction}
        onOpenBatch={() => {
          setShowTeamFormationModal(false);
          setShowBatchFormationModal(true);
        }}
      />

      {/* 일괄 편성 모달 */}
      <BatchFormationModal
        isOpen={showBatchFormationModal}
        onClose={() => setShowBatchFormationModal(false)}
        onFormTeams={handleFormTeams}
        onViewDetail={handleViewBatchDetail}
        meeting={meeting}
        processing={processingAction}
      />

      {/* 팀 편성 미리보기 모달 */}
      <TeamFormationPreviewModal
        isOpen={showTeamFormationPreviewModal}
        onClose={() => {
          setShowTeamFormationPreviewModal(false);
          setPreviewFormationData(null);
          setPreviewTeams([]);
        }}
        teams={previewTeams}
        formationMode={previewFormationData?.formation_mode}
        teamSize={previewFormationData?.team_size}
        onConfirm={handleConfirmTeamFormation}
        onReform={handleReformTeams}
        onSaveHistory={() => {
          if (previewFormationData && previewTeams.length > 0) {
            saveFormationHistory(previewFormationData.formation_mode, previewFormationData.team_size, previewTeams);
            showToast('편성 결과가 히스토리에 저장되었습니다.', 'success');
          }
        }}
        processing={processingAction}
      />

      {/* 팀 편성 수정 모달 */}
      <TeamEditorModal
        isOpen={showTeamEditorModal}
        onClose={() => setShowTeamEditorModal(false)}
        teams={teams}
        participants={confirmedParticipants}
        meetingId={meetingId}
        onSave={handleSaveTeamChanges}
        processing={processingAction}
      />

      {/* 편성 히스토리 모달 */}
      <FormationHistoryModal
        isOpen={showFormationHistoryModal}
        onClose={() => setShowFormationHistoryModal(false)}
        meetingId={meetingId}
        onRestore={handleRestoreHistory}
        onViewDetail={handleViewHistoryDetail}
        processing={processingAction}
      />

      {/* 라운딩 종료 선택 모달 */}
      <RoundingCompleteModal
        isOpen={showRoundingCompleteModal}
        onClose={() => setShowRoundingCompleteModal(false)}
        onInputNow={handleInputNow}
        onInputLater={handleInputLater}
      />

      {/* 간단 점수 입력 모달 */}
      {currentParticipant && (
        <SimpleScoreInputModal
          isOpen={showSimpleScoreModal}
          onClose={() => setShowSimpleScoreModal(false)}
          meetingId={meetingId}
          participantId={currentParticipant.id}
          currentHandicap={
            handicapInfo?.calculated_handicap ?? 
            handicapInfo?.initial_handicap ?? 
            handicapInfo?.handicap ??
            (userInfo?.handicap && userInfo.handicap !== '' ? parseFloat(userInfo.handicap) : null)
          }
          onSuccess={handleScoreInputSuccess}
          shouldCompleteRounding={!meeting?.rounding_completed_at}
        />
      )}
    </div>
  );
};

export default MeetingDetailPage;

