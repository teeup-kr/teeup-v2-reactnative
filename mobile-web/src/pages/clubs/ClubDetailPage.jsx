import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi, usersApi } from '../../lib';
import { useAuth } from '../../hooks/useAuth';
import { FaExclamationTriangle, FaArrowLeft, FaTimes, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import ProfileInputModal from '../../components/ProfileInputModal';

// 탭별 컴포넌트 import
import ClubOverviewTab from '../tabs/ClubOverviewTab';
import ClubNoticesTab from '../tabs/ClubNoticesTab';
import ClubMeetingsTab from '../tabs/ClubMeetingsTab';
import ClubRegulationsTab from '../tabs/ClubRegulationsTab';
import ClubMembersTab from '../tabs/ClubMembersTab';
import ClubFeesTab from '../tabs/ClubFeesTab';

const ClubDetailPage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('overview');
  
  // 해시 기반 탭 활성화 (초기 로드 시)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'notices', 'meetings', 'regulations', 'members', 'fees'].includes(hash)) {
      setActiveTab(hash);
    } else {
      // 기본값은 항상 'overview'
      setActiveTab('overview');
    }
  }, []);
  
  // 모달 및 폼 상태
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    additional_info: '',
    contact_info: '',
    location: '',
    representative_name: '',
    application_deadline: ''
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalData, setAlertModalData] = useState({
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    confirmText: '확인',
    showCancel: false
  });
  
  // 클럽 삭제 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActiveMeetingsModal, setShowActiveMeetingsModal] = useState(false);
  const [activeMeetingsInfo, setActiveMeetingsInfo] = useState(null);
  
  // 비활성 클럽 모달 상태
  const [showInactiveClubModal, setShowInactiveClubModal] = useState(false);

  // 클럽 상세 정보 조회
  const {
    data: club,
    isLoading: clubLoading,
    error: clubError
  } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => clubsApi.getClub(clubId),
    enabled: !!clubId,
    refetchOnMount: true, // 컴포넌트 마운트 시 항상 최신 데이터 가져오기
    staleTime: 0, // 데이터를 즉시 stale로 간주하여 항상 최신 데이터 확인
  });

  // 디버깅: club 객체 로그 출력
  console.log('🔍 ClubDetailPage 디버깅:');
  console.log('  - clubId:', clubId);
  console.log('  - club:', club);
  console.log('  - club?.display_id:', club?.display_id);
  console.log('  - club?.id:', club?.id);
  console.log('  - club?.member_count:', club?.member_count);
  console.log('  - club?.current_member_count:', club?.current_member_count);

  // 클럽 멤버 목록 조회
  const {
    data: membersData
  } = useQuery({
    queryKey: ['club-members-new', clubId],
    queryFn: () => clubsApi.getClubMembers(clubId, { allMembers: true }),
    enabled: !!clubId,
  });

  // 비활성 클럽 체크: 클럽 상태가 INACTIVE인 경우 모든 사용자에게 모달 표시
  useEffect(() => {
    if (club && club.status === 'INACTIVE') {
      setShowInactiveClubModal(true);
    }
  }, [club]);

  // 현재 사용자 프로필 조회
  const {
    data: currentUserProfile,
    isLoading: profileLoading
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getMyProfile,
    enabled: showJoinModal,
  });

  // 클럽 가입 성공 핸들러
  const handleJoinSuccess = async () => {
    console.log('가입 성공 핸들러 호출됨');
    
    // 클럽 가입 API 호출
    try {
      await clubsApi.joinClub(clubId);
      
      // 모든 관련 쿼리 무효화 및 즉시 refetch
      queryClient.invalidateQueries({ queryKey: ['club', clubId] });
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-summary', clubId] });
      queryClient.invalidateQueries({ queryKey: ['user-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['my-clubs'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      
      // 성공 토스트 표시
      setSuccessMessage('클럽 가입 신청이 완료되었습니다.');
      setShowSuccessToast(true);
      
      // 3초 후 토스트 숨김
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      
      // 모달 닫기
      setShowJoinModal(false);
    } catch (error) {
      handleJoinError(error);
    }
  };

  // 클럽 가입 실패 핸들러
  const handleJoinError = (error) => {
    console.error('가입 실패:', error);
    setAlertModalData({
      title: '가입 실패',
      message: error.response?.data?.detail || '클럽 가입에 실패했습니다.',
      type: 'error',
      onConfirm: () => setShowAlertModal(false),
      confirmText: '확인',
      showCancel: false
    });
    setShowAlertModal(true);
  };

  // 클럽 탈퇴 성공 핸들러
  const handleLeaveSuccess = () => {
    console.log('탈퇴 성공 핸들러 호출됨');
    
    // 모든 관련 쿼리 무효화
    queryClient.invalidateQueries({ queryKey: ['club', clubId] });
    queryClient.invalidateQueries({ queryKey: ['clubs'] });
    queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
    queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
    queryClient.invalidateQueries({ queryKey: ['club-summary', clubId] });
    queryClient.invalidateQueries({ queryKey: ['user-clubs'] });
    queryClient.invalidateQueries({ queryKey: ['my-clubs'] });
    
    // 성공 토스트 표시
    setSuccessMessage('클럽에서 탈퇴되었습니다.');
    setShowSuccessToast(true);
    
    // 3초 후 토스트 숨김
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  // 클럽 탈퇴 실패 핸들러
  const handleLeaveError = (error) => {
    console.error('탈퇴 실패:', error);
    setAlertModalData({
      title: '탈퇴 실패',
      message: error.response?.data?.detail || '클럽 탈퇴에 실패했습니다.',
      type: 'error',
      onConfirm: () => setShowAlertModal(false),
      confirmText: '확인',
      showCancel: false
    });
    setShowAlertModal(true);
  };

  // 클럽 가입신청 취소 성공 핸들러
  const handleCancelMembershipSuccess = async () => {
    console.log('가입신청 취소 성공 핸들러 호출됨');
    
    // 모든 관련 쿼리 무효화
    queryClient.invalidateQueries({ queryKey: ['club', clubId] });
    queryClient.invalidateQueries({ queryKey: ['clubs'] });
    queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
    queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
    queryClient.invalidateQueries({ queryKey: ['club-summary', clubId] });
    queryClient.invalidateQueries({ queryKey: ['user-clubs'] });
    queryClient.invalidateQueries({ queryKey: ['my-clubs'] });
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    
    // 성공 토스트 표시
    setSuccessMessage('가입 신청이 취소되었습니다.');
    setShowSuccessToast(true);
    
    // 3초 후 토스트 숨김
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  // 클럽 가입신청 취소 실패 핸들러
  const handleCancelMembershipError = (error) => {
    console.error('가입신청 취소 실패:', error);
    setAlertModalData({
      title: '취소 실패',
      message: error.response?.data?.detail || '가입 신청 취소에 실패했습니다.',
      type: 'error',
      onConfirm: () => setShowAlertModal(false),
      confirmText: '확인',
      showCancel: false
    });
    setShowAlertModal(true);
  };

  // 가입신청 취소 확인 모달 표시
  const handleCancelMembershipClick = () => {
    setAlertModalData({
      title: '가입신청 취소',
      message: '정말 가입신청을 취소하시겠습니까?',
      type: 'warning',
      onConfirm: handleCancelMembership,
      confirmText: '취소하기',
      showCancel: true
    });
    setShowAlertModal(true);
  };

  // 가입신청 취소 핸들러
  const handleCancelMembership = async () => {
    setShowAlertModal(false);
    try {
      await clubsApi.cancelMembership(clubId);
      handleCancelMembershipSuccess();
    } catch (error) {
      handleCancelMembershipError(error);
    }
  };

  // 클럽 탈퇴 클릭 핸들러
  const handleLeaveClick = () => {
    // 리더/매니저는 탈퇴 불가
    if (hasLeaderRole || hasManagerRole) {
      setAlertModalData({
        title: '탈퇴 불가',
        message: '클럽 리더라 탈퇴할 수 없습니다. 리더 권한을 다른 구성원에게 넘긴 후 다시 시도해 주세요.',
        type: 'error',
        onConfirm: () => setShowAlertModal(false),
        confirmText: '확인',
        showCancel: false
      });
      setShowAlertModal(true);
      return;
    }

    // 일반 회원인 경우 탈퇴 확인 모달 표시
    setAlertModalData({
      title: '클럽 탈퇴',
      message: '정말로 이 클럽에서 탈퇴하시겠습니까? 탈퇴 후에는 클럽 정보에 접근할 수 없습니다.',
      type: 'warning',
      onConfirm: handleLeave,
      confirmText: '탈퇴하기',
      showCancel: true
    });
    setShowAlertModal(true);
  };

  // 클럽 탈퇴 핸들러
  const handleLeave = async () => {
    setShowAlertModal(false);
    try {
      await clubsApi.leaveClub(clubId);
      handleLeaveSuccess();
      // 탈퇴 성공 후 클럽 목록으로 이동
      setTimeout(() => {
        navigate('/clubs');
      }, 1500);
    } catch (error) {
      handleLeaveError(error);
    }
  };

  // 클럽 수정 성공 핸들러
  const handleEditSuccess = () => {
    console.log('수정 성공 핸들러 호출됨');
    
    // 클럽 정보 쿼리 무효화
    queryClient.invalidateQueries({ queryKey: ['club', clubId] });
    
    // 성공 토스트 표시
    setSuccessMessage('클럽 정보가 수정되었습니다.');
    setShowSuccessToast(true);
    
    // 3초 후 토스트 숨김
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
    
    // 편집 모드 종료
    setIsEditing(false);
  };

  // 클럽 수정 실패 핸들러
  const handleEditError = (error) => {
    console.error('수정 실패:', error);
    setAlertModalData({
      title: '수정 실패',
      message: error.response?.data?.detail || '클럽 정보 수정에 실패했습니다.',
      type: 'error',
      onConfirm: () => setShowAlertModal(false),
      confirmText: '확인',
      showCancel: false
    });
    setShowAlertModal(true);
  };

  // 클럽 삭제 성공 핸들러
  const handleDeleteSuccess = () => {
    console.log('삭제 성공 핸들러 호출됨');
    
    // 성공 토스트 표시
    setSuccessMessage('클럽이 삭제되었습니다.');
    setShowSuccessToast(true);
    
    // 3초 후 클럽 목록으로 이동
    setTimeout(() => {
      navigate('/clubs');
    }, 3000);
  };

  // 클럽 삭제 실패 핸들러
  const handleDeleteError = (error) => {
    console.error('삭제 실패:', error);
    setAlertModalData({
      title: '삭제 실패',
      message: error.response?.data?.detail || '클럽 삭제에 실패했습니다.',
      type: 'error',
      onConfirm: () => setShowAlertModal(false),
      confirmText: '확인',
      showCancel: false
    });
    setShowAlertModal(true);
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    // 비회원일 때는 overview만 허용
    if (!isMember && tab !== 'overview') {
      return;
    }
    setActiveTab(tab);
    // URL 해시 업데이트
    window.history.replaceState(null, '', `#${tab}`);
  };

  // 편집 모드 토글
  const toggleEditMode = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditForm({
        description: '',
        additional_info: '',
        contact_info: '',
        location: '',
        representative_name: '',
        application_deadline: ''
      });
    } else {
      setIsEditing(true);
      // application_deadline을 datetime-local 형식으로 변환
      const formatDateTimeLocal = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return '';
          // 한국 시간으로 변환 (UTC+9)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return '';
        }
      };
      
      setEditForm({
        description: club?.description || '',
        additional_info: club?.additional_info || '',
        contact_info: club?.contact_info || '',
        location: club?.location || '',
        representative_name: club?.representative_name || '',
        application_deadline: formatDateTimeLocal(club?.application_deadline)
      });
    }
  };

  // 편집 폼 저장
  const handleEditSave = async () => {
    try {
      // application_deadline을 ISO 형식으로 변환
      const formatToISO = (dateTimeLocal) => {
        if (!dateTimeLocal) return null;
        try {
          // datetime-local 형식을 ISO 형식으로 변환
          const date = new Date(dateTimeLocal);
          if (isNaN(date.getTime())) return null;
          return date.toISOString();
        } catch {
          return null;
        }
      };
      
      await clubsApi.updateClub(clubId, {
        description: editForm.description,
        additional_info: editForm.additional_info,
        contact_info: editForm.contact_info,
        location: editForm.location,
        application_deadline: formatToISO(editForm.application_deadline)
        // representative_name은 개인정보이므로 수정 불가
      });
      handleEditSuccess();
    } catch (error) {
      handleEditError(error);
    }
  };

  // 편집 폼 취소
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({
      description: '',
      additional_info: '',
      contact_info: '',
      location: '',
      representative_name: ''
    });
  };

  // 삭제 로딩 상태
  const [isDeleting, setIsDeleting] = useState(false);

  // 클럽 삭제 핸들러 (활성 모임 체크 후 삭제 확인)
  const handleDeleteClub = async () => {
    if (!clubId || isDeleting) return;
    
    try {
      setIsDeleting(true);
      // 1단계: 활성화된 모임 체크
      const activeMeetingsResponse = await clubsApi.checkActiveMeetings(clubId);
      
      if (!activeMeetingsResponse.can_delete) {
        // 활성화된 모임이 있는 경우
        setActiveMeetingsInfo(activeMeetingsResponse);
        setShowActiveMeetingsModal(true);
        setIsDeleting(false);
        return;
      }
      
      // 2단계: 활성화된 모임이 없으면 삭제 확인 모달 표시
      setShowDeleteModal(true);
      setIsDeleting(false);
      
    } catch (err) {
      console.error('클럽 삭제 체크 에러:', err);
      setIsDeleting(false);
      setAlertModalData({
        title: '삭제 확인 실패',
        message: err.response?.data?.detail || err.message || '삭제 가능 여부를 확인할 수 없습니다.',
        type: 'error',
        onConfirm: () => {},
        confirmText: '확인',
        showCancel: false
      });
      setShowAlertModal(true);
    }
  };

  // 실제 클럽 삭제 실행
  const handleDeleteConfirm = async () => {
    if (!clubId || isDeleting) return;
    
    try {
      setIsDeleting(true);
      await clubsApi.deleteClub(clubId);
      setShowDeleteModal(false);
      setIsDeleting(false);
      
      // 모든 클럽 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      queryClient.invalidateQueries({ queryKey: ['club', clubId] });
      queryClient.invalidateQueries({ queryKey: ['my-clubs'] });
      
      // 클럽 목록으로 리다이렉트
      navigate('/clubs', { 
        state: { 
          successMessage: '클럽이 삭제되었습니다.' 
        } 
      });
      
    } catch (err) {
      console.error('클럽 삭제 에러:', err);
      setIsDeleting(false);
      setAlertModalData({
        title: '삭제 실패',
        message: err.response?.data?.detail || err.message || '클럽 삭제에 실패했습니다.',
        type: 'error',
        onConfirm: () => setShowDeleteModal(false),
        confirmText: '확인',
        showCancel: false
      });
      setShowAlertModal(true);
    }
  };

  // 클럽 삭제 취소
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // 사용자 권한 확인 (early return 이전에 계산)
  // membersData에서 현재 사용자의 멤버십 정보를 찾아서 권한 확인
  const userMembership = membersData?.data?.find(member => member.user_id === user?.id);
  
  // membersData에서 직접 권한 확인 (old-ts-version 방식)
  const isLeader = membersData?.data?.some(member => 
    member.user_id === user?.id && member.role === 'LEADER'
  ) || false;
  
  const isManager = membersData?.data?.some(member => 
    member.user_id === user?.id && member.role === 'MANAGER'
  ) || false;
  
  // 클럽 API 응답의 membership_role도 체크 (fallback)
  const isLeaderFromClub = club?.membership_role === 'LEADER';
  const isManagerFromClub = club?.membership_role === 'MANAGER';
  
  // 최종 권한: membersData 우선, 없으면 club.membership_role 사용
  const hasLeaderRole = isLeader || isLeaderFromClub;
  const hasManagerRole = isManager || isManagerFromClub;
  
  // membership_status를 문자열로 정규화하여 비교
  const normalizedMembershipStatus = club?.membership_status 
    ? String(club.membership_status).toUpperCase().trim() 
    : null;
  const userMembershipStatus = userMembership?.status 
    ? (typeof userMembership.status === 'string' ? userMembership.status.toUpperCase() : String(userMembership.status).toUpperCase())
    : null;
  
  const isMember = userMembershipStatus === 'APPROVED' || userMembershipStatus === 'ACTIVE' || 
                   normalizedMembershipStatus === 'APPROVED' || normalizedMembershipStatus === 'ACTIVE';
  const isPending = userMembershipStatus === 'PENDING' || normalizedMembershipStatus === 'PENDING';
  const canJoin = !isMember && !isPending && club?.status === 'APPROVED';
  
  // 비회원 체크: membership_status와 membership_role이 모두 없는 경우
  const isNotMember = !normalizedMembershipStatus && !club?.membership_role && !userMembership;

  // 비회원일 때 다른 탭으로 접근 시도 시 overview로 리다이렉트 (early return 이전에 Hook 호출)
  useEffect(() => {
    if (club && !isMember && activeTab !== 'overview') {
      setActiveTab('overview');
      window.history.replaceState(null, '', window.location.pathname + '#overview');
    }
  }, [club, isMember, activeTab]);

  // 로딩 중
  if (clubLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 처리
  if (clubError) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="text-center">
            <div className="text-error-600 mb-3 sm:mb-4">
              <FaExclamationTriangle className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">클럽 정보를 불러올 수 없습니다</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">잠시 후 다시 시도해주세요.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 클럽이 없는 경우
  if (!club) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">클럽을 찾을 수 없습니다</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">요청하신 클럽이 존재하지 않습니다.</p>
            <Link
              to="/clubs"
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
            >
              클럽 목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 수정 권한: 리더 또는 매니저만 가능 (비회원이 아닌 경우에만)
  const canEdit = !isNotMember && (hasLeaderRole || hasManagerRole);
  // 삭제 권한: 리더만 가능 (백엔드와 동일하게)
  const canDelete = !isNotMember && hasLeaderRole;
  // 클럽 관리 권한: 리더 또는 매니저만 가능 (비회원이 아닌 경우에만)
  const canManage = !isNotMember && (hasLeaderRole || hasManagerRole);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/clubs"
                className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                <FaArrowLeft className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">클럽 목록</span>
              </Link>
            </div>
            
            {/* 액션 버튼들 */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
              {canManage && (
                <button
                  onClick={() => navigate(`/clubs/${clubId}/manage`)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary-700 bg-primary-50 border border-primary-300 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  클럽 관리
                </button>
              )}
              {canEdit && (
                <>
                  <button
                    onClick={() => {
                      if (isEditing) {
                        handleEditCancel();
                      } else {
                        toggleEditMode();
                      }
                    }}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    {isEditing ? '취소' : '수정'}
                  </button>
                  {isEditing && (
                    <button
                      onClick={handleEditSave}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      저장
                    </button>
                  )}
                </>
              )}
              {canDelete && (
                <button
                  onClick={handleDeleteClub}
                  disabled={isDeleting}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? '처리 중...' : '삭제'}
                </button>
              )}
              
              {canJoin && (
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  가입 신청
                </button>
              )}
              
              {isPending && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    disabled
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-300 rounded-lg cursor-not-allowed opacity-75"
                  >
                    가입신청중
                  </button>
                  <button
                    onClick={handleCancelMembershipClick}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    가입신청 취소
                  </button>
                </div>
              )}
              
              {isMember && !hasLeaderRole && !hasManagerRole && (
                <button
                  onClick={handleLeaveClick}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 transition-colors"
                >
                  탈퇴
                </button>
              )}
            </div>
          </div>

          {/* 클럽 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-primary-50 flex-shrink-0">
                  <img 
                    src="/logo.png" 
                    alt={club.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 line-clamp-1">{club.name}</h1>
                  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      club.status === 'APPROVED' 
                        ? 'bg-success-100 text-success-800' 
                        : club.status === 'PENDING'
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {club.status === 'APPROVED' ? '승인됨' : club.status === 'PENDING' ? '승인 대기' : '거부됨'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      club.type === 'REGULAR' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {club.type === 'REGULAR' ? '정기 클럽' : '비정기 클럽'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 클럽 설명 */}
            <div className="mb-3 sm:mb-4">
              {isEditing ? (
                <textarea
                  value={editForm.description ?? club.description ?? ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              ) : (
                <p className="text-sm sm:text-base text-neutral-700">{club.description}</p>
              )}
            </div>

            {/* 클럽 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-medium text-neutral-500">위치:</span>
                <span className="ml-1.5 sm:ml-2 text-neutral-900">{club.location}</span>
              </div>
              <div>
                <span className="font-medium text-neutral-500">멤버 수:</span>
                <span className="ml-1.5 sm:ml-2 text-neutral-900">{club.current_member_count || club.member_count || 0}명</span>
              </div>
              <div>
                <span className="font-medium text-neutral-500">연락처:</span>
                <span className="ml-1.5 sm:ml-2 text-neutral-900">{club.contact_info}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 - 비회원일 때는 개요만, 회원일 때는 모든 탭 표시 */}
        <div className="border-b border-neutral-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: '개요' },
              ...(isMember ? [
                { id: 'notices', label: '공지사항' },
                { id: 'meetings', label: '모임' },
                { id: 'regulations', label: '규정' },
                { id: 'members', label: '멤버' },
                { id: 'fees', label: '회비' }
              ] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 탭 컨텐츠 - 비회원일 때는 개요만, 회원일 때는 모든 탭 표시 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          {activeTab === 'overview' && (
            <ClubOverviewTab 
              club={club} 
              membersData={membersData}
              isEditing={isEditing}
              editForm={editForm}
              onEditFormChange={setEditForm}
            />
          )}
          {isMember && (
            <>
              {activeTab === 'notices' && <ClubNoticesTab club={club} canManage={canManage} />}
              {activeTab === 'meetings' && <ClubMeetingsTab club={club} canManage={canManage} />}
              {activeTab === 'regulations' && <ClubRegulationsTab club={club} canManage={canManage} />}
              {activeTab === 'members' && <ClubMembersTab club={club} canManage={canManage} />}
              {activeTab === 'fees' && <ClubFeesTab club={club} canManage={canManage} />}
            </>
          )}
        </div>
      </div>

      {/* 성공 토스트 메시지 */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up">
          <FaCheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* 알림 모달 */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                alertModalData.type === 'success' ? 'bg-green-100' :
                alertModalData.type === 'error' ? 'bg-red-100' :
                alertModalData.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                {alertModalData.type === 'success' && <FaCheckCircle className="h-8 w-8 text-green-600" />}
                {alertModalData.type === 'error' && <FaExclamationCircle className="h-8 w-8 text-red-600" />}
                {alertModalData.type === 'warning' && <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />}
                {alertModalData.type === 'info' && <FaExclamationCircle className="h-8 w-8 text-blue-600" />}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {alertModalData.title}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {alertModalData.message}
              </p>
              
              <div className="flex space-x-3">
                {alertModalData.showCancel && (
                  <button
                    onClick={() => setShowAlertModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={alertModalData.onConfirm}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                    alertModalData.type === 'error' 
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  {alertModalData.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 활성 모임이 있어 삭제 불가 모달 */}
      {showActiveMeetingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ 클럽 삭제 불가
              </h3>
              
              <p className="text-gray-600 mb-4">
                모임이 있어 삭제가 불가능합니다.
              </p>
              
              {activeMeetingsInfo && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-yellow-800">
                    • 예정된 모임: {activeMeetingsInfo.active_meetings_count}개<br/>
                    • 진행 중인 이벤트: {activeMeetingsInfo.active_events_count}개
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowActiveMeetingsModal(false)}
                  className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setShowActiveMeetingsModal(false);
                    // 클럽 상세 페이지의 모임 탭으로 이동
                    handleTabChange('meetings');
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  내 모임 보러가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비활성 클럽 모달 */}
      {showInactiveClubModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <FaExclamationCircle className="h-8 w-8 text-yellow-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                클럽 비활성 상태
              </h3>
              
              <p className="text-gray-600 mb-6">
                이 클럽은 관리자에 의해 비활성 상태입니다.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowInactiveClubModal(false);
                    navigate('/clubs');
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  목록으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 클럽 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <FaExclamationTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                클럽 삭제
              </h3>
              
              <p className="text-gray-600 mb-6">
                정말로 이 클럽을 삭제하시겠습니까?<br />
                삭제된 클럽은 복구할 수 없습니다.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 클럽 가입 신청 모달 */}
      {showJoinModal && (
        <ProfileInputModal 
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
          currentUser={currentUserProfile}
        />
      )}
    </div>
  );
};

export default ClubDetailPage;
