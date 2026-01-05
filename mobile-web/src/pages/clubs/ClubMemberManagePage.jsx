import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '../../lib';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaUsers, FaTimes, FaCheckCircle, FaCrown, FaUserShield, FaUser, FaTrash, FaEdit } from 'react-icons/fa';

const ClubMemberManagePage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('all'); // 기본값: 승인된 멤버 전체
  const [selectedMember, setSelectedMember] = useState(null);
  
  // 페이지네이션 상태 (각 탭별로 관리)
  const [currentPage, setCurrentPage] = useState(1);
  const MEMBERS_PER_PAGE = 5; // 페이지당 멤버 수
  
  // 멤버 프로필 모달 상태
  const [showMemberProfileModal, setShowMemberProfileModal] = useState(false);
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState(null);
  
  // 리더 교체 관련 상태
  const [newLeaderId, setNewLeaderId] = useState('');
  const [currentLeaderNewRole, setCurrentLeaderNewRole] = useState('MANAGER');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [roleChangeData, setRoleChangeData] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalData, setAlertModalData] = useState({
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    confirmText: '확인',
    showCancel: false
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // 거절 사유 모달 상태
  const [showRejectReasonModal, setShowRejectReasonModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [memberToReject, setMemberToReject] = useState(null);
  
  // 메모 모달 상태
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedMemberForNote, setSelectedMemberForNote] = useState(null);
  const [memberNote, setMemberNote] = useState('');

  // 토스트 알림 표시 함수
  const showToastNotification = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // 토스트 메시지 자동 숨김
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 클럽 정보 조회
  const {
    data: club,
    isLoading: clubLoading,
    error: clubError
  } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => clubsApi.getClub(clubId),
    enabled: !!clubId,
  });

  // 클럽 멤버 목록 조회 (모든 멤버 포함)
  const {
    data: membersData,
    isLoading: membersLoading
  } = useQuery({
    queryKey: ['club-members-new', clubId],
    queryFn: async () => {
      const result = await clubsApi.getClubMembers(clubId, { allMembers: true }); // all_members=true
      return result;
    },
    enabled: !!clubId,
  });

  // API 응답 구조: { data: [...], total, page, limit, total_pages }
  const members = membersData?.data || [];
  
  // 안전한 role/status 비교 함수
  const normalizeRole = (role) => {
    if (!role) return null;
    const roleStr = String(role).toUpperCase().trim();
    return roleStr === 'LEADER' ? 'LEADER' : roleStr === 'MANAGER' ? 'MANAGER' : roleStr === 'MEMBER' ? 'MEMBER' : roleStr;
  };
  
  const normalizeStatus = (status) => {
    if (!status) return null;
    return String(status).toUpperCase().trim();
  };
  
  // 디버깅: API 응답 로깅
  useEffect(() => {
    if (members.length > 0) {
      console.log('[DEBUG] 클럽 멤버 API 응답:', {
        total: membersData?.total,
        membersCount: members.length,
        allMembers: members.map(m => ({
          user_id: m.user_id,
          user_name: m.user_name,
          role: m.role,
          role_type: typeof m.role,
          status: m.status,
          status_type: typeof m.status
        }))
      });
      
      const leadersInResponse = members.filter(m => {
        const role = normalizeRole(m.role);
        const status = normalizeStatus(m.status);
        return role === 'LEADER' && (status === 'APPROVED' || status === 'ACTIVE');
      });
      
      console.log('[DEBUG] 필터링된 리더:', leadersInResponse);
      console.log('[DEBUG] 리더 수:', leadersInResponse.length);
    }
  }, [members, membersData]);
  
  const pendingMembers = members.filter(member => normalizeStatus(member.status) === 'PENDING');
  const approvedMembers = members.filter(member => {
    const status = normalizeStatus(member.status);
    return status === 'APPROVED' || status === 'ACTIVE';
  });
  const managers = members.filter(member => {
    const role = normalizeRole(member.role);
    const status = normalizeStatus(member.status);
    return role === 'MANAGER' && (status === 'APPROVED' || status === 'ACTIVE');
  });
  const leaders = members.filter(member => {
    const role = normalizeRole(member.role);
    const status = normalizeStatus(member.status);
    const isLeader = role === 'LEADER' && (status === 'APPROVED' || status === 'ACTIVE');
    if (isLeader) {
      console.log('[DEBUG] 리더 필터링 성공:', {
        user_id: member.user_id,
        user_name: member.user_name,
        role: member.role,
        normalized_role: role,
        status: member.status,
        normalized_status: status
      });
    }
    return isLeader;
  });

  // 리더/매니저 권한 확인
  const currentUserMembership = members.find(m => m.user_id === user?.id);
  const currentUserRole = currentUserMembership ? normalizeRole(currentUserMembership.role) : null;
  const isLeaderOrManager = currentUserRole === 'LEADER' || currentUserRole === 'MANAGER';
  
  // 디버깅: 권한 체크 로그 (early return 이전에 모든 Hook 호출)
  useEffect(() => {
    console.log('=== 권한 체크 디버깅 ===');
    console.log('현재 사용자 ID:', user?.id);
    console.log('전체 멤버:', members);
    console.log('현재 사용자 멤버십:', currentUserMembership);
    console.log('isLeaderOrManager:', isLeaderOrManager);
  }, [user?.id, members, currentUserMembership, isLeaderOrManager]);

  // 가입 승인 mutation
  const approveMembershipMutation = useMutation({
    mutationFn: ({ userId }) => 
      clubsApi.approveMembership(clubId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-summary', clubId] });
      showToastNotification('멤버가 승인되었습니다.', 'success');
    },
    onError: (error) => {
      showToastNotification(`승인 중 오류가 발생했습니다: ${error.response?.data?.detail || error.message}`, 'error');
    }
  });

  // 가입 거부 mutation
  const rejectMembershipMutation = useMutation({
    mutationFn: ({ userId, reason }) => 
      clubsApi.rejectMembership(clubId, userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-summary', clubId] });
      setShowRejectReasonModal(false);
      setRejectReason('');
      setMemberToReject(null);
      showToastNotification('멤버십이 거절되었습니다.', 'success');
    },
    onError: (error) => {
      showToastNotification(`거절 중 오류가 발생했습니다: ${error.response?.data?.detail || error.message}`, 'error');
    }
  });

  // 멤버 제거 mutation
  const removeMemberMutation = useMutation({
    mutationFn: ({ userId }) => 
      clubsApi.removeClubMember(clubId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-summary', clubId] });
      setSuccessMessage('멤버가 제거되었습니다.');
      setShowSuccessModal(true);
    },
    onError: (error) => {
      setSuccessMessage(`제거 중 오류가 발생했습니다: ${error.response?.data?.detail || error.message}`);
      setShowSuccessModal(true);
    }
  });

  // 역할 변경 mutation
  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => 
      clubsApi.updateMemberRole(clubId, userId, newRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
      setSuccessMessage('역할이 변경되었습니다.');
      setShowSuccessModal(true);
    },
    onError: (error) => {
      setSuccessMessage(`역할 변경 중 오류가 발생했습니다: ${error.response?.data?.detail || error.message}`);
      setShowSuccessModal(true);
    }
  });

  // 리더 교체 mutation
  const changeLeaderMutation = useMutation({
    mutationFn: async ({ newLeaderId, currentLeaderNewRole }) => {
      // transferLeadership API 호출
      await clubsApi.transferLeadership(clubId, {
        new_leader_id: newLeaderId,
        current_leader_new_role: currentLeaderNewRole
      });
    },
    onSuccess: () => {
      // 상태 초기화
      setNewLeaderId('');
      setCurrentLeaderNewRole('MANAGER');
      
      // 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club', clubId] });
      queryClient.invalidateQueries({ queryKey: ['club-summary', clubId] });
      
      // 성공 토스트 표시
      showToastNotification('리더가 성공적으로 교체되었습니다.', 'success');
    },
    onError: (error) => {
      setAlertModalData({
        title: '리더 교체 실패',
        message: `리더 교체 중 오류가 발생했습니다: ${error.response?.data?.detail || error.message}`,
        type: 'error',
        onConfirm: () => setShowAlertModal(false),
        confirmText: '확인',
        showCancel: false
      });
      setShowAlertModal(true);
    }
  });

  // 메모 조회 mutation
  const getMemberNoteMutation = useMutation({
    mutationFn: ({ userId }) => clubsApi.getMemberNote(clubId, userId),
    onSuccess: (data) => {
      setMemberNote(data.note || '');
    },
    onError: (error) => {
      // 조회 실패해도 모달은 열어둠 (메모가 없는 경우일 수 있음)
      setMemberNote('');
    }
  });

  // 메모 저장 mutation
  const updateMemberNoteMutation = useMutation({
    mutationFn: ({ userId, note }) => clubsApi.updateMemberNote(clubId, userId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members-new', clubId] });
      closeNoteModal();
      showToastNotification('메모가 저장되었습니다.', 'success');
    },
    onError: (error) => {
      showToastNotification(`메모 저장 중 오류가 발생했습니다: ${error.response?.data?.detail || error.message}`, 'error');
    }
  });

  const handleApproveMember = (member) => {
    // 즉시 승인 처리
    approveMembershipMutation.mutate({ userId: member.user_id });
  };

  const handleRejectMember = (member) => {
    // 거절 사유 모달 표시
    setMemberToReject(member);
    setRejectReason('');
    setShowRejectReasonModal(true);
  };
  
  const handleConfirmReject = () => {
    if (memberToReject) {
      rejectMembershipMutation.mutate({ 
        userId: memberToReject.user_id, 
        reason: rejectReason 
      });
    }
  };

  const handleRemoveMember = (member) => {
    const memberName = member.user_name || member.user_realname || member.user_nickname || '멤버';
    setAlertModalData({
      title: '멤버 제거',
      message: `정말로 ${memberName}님을 클럽에서 제거하시겠습니까?`,
      type: 'warning',
      onConfirm: () => {
        removeMemberMutation.mutate({ userId: member.user_id });
        setShowAlertModal(false);
      },
      confirmText: '제거',
      showCancel: true
    });
    setShowAlertModal(true);
  };

  const handleChangeRole = (member, newRole) => {
    setRoleChangeData({ member, newRole });
    setShowRoleChangeModal(true);
  };

  const handleTransferLeadership = (newLeaderId) => {
    setNewLeaderId(newLeaderId);
    setShowMemberModal(true);
  };

  // 리더 교체 핸들러
  const handleChangeLeader = () => {
    if (!newLeaderId) {
      setAlertModalData({
        title: '선택 필요',
        message: '새 리더를 선택해주세요.',
        type: 'warning',
        onConfirm: () => setShowAlertModal(false),
        confirmText: '확인',
        showCancel: false
      });
      setShowAlertModal(true);
      return;
    }

    const currentLeaders = members.filter(m => {
      const role = normalizeRole(m.role);
      const status = normalizeStatus(m.status);
      return role === 'LEADER' && (status === 'APPROVED' || status === 'ACTIVE');
    }) || [];
    const newLeader = members.find(m => m.user_id === newLeaderId);
    
    if (!newLeader) {
      setAlertModalData({
        title: '오류',
        message: '선택한 멤버를 찾을 수 없습니다.',
        type: 'error',
        onConfirm: () => setShowAlertModal(false),
        confirmText: '확인',
        showCancel: false
      });
      setShowAlertModal(true);
      return;
    }

    setAlertModalData({
      title: '리더 교체 확인',
      message: `현재 리더 ${currentLeaders.map(l => l.user_realname || l.user_nickname).join(', ')}를 ${currentLeaderNewRole === 'MANAGER' ? '매니저' : '일반 멤버'}로 변경하고, ${newLeader.user_realname || newLeader.user_nickname}님을 새 리더로 임명하시겠습니까?`,
      type: 'warning',
      onConfirm: () => {
        changeLeaderMutation.mutate({ newLeaderId, currentLeaderNewRole });
        setShowAlertModal(false);
      },
      confirmText: '리더 교체하기',
      showCancel: true
    });
    setShowAlertModal(true);
  };

  // 멤버 프로필 모달 열기 핸들러
  const handleOpenMemberProfile = (member) => {
    console.log('멤버 프로필 데이터:', member);
    setSelectedMemberForProfile(member);
    setShowMemberProfileModal(true);
  };

  // 멤버 프로필 모달에서 내보내기 핸들러
  const handleExportFromProfile = (member) => {
    setShowMemberProfileModal(false);
    handleRemoveMember(member);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      LEADER: { text: '리더', className: 'bg-purple-100 text-purple-800', icon: FaCrown },
      MANAGER: { text: '매니저', className: 'bg-blue-100 text-blue-800', icon: FaUserShield },
      MEMBER: { text: '일반회원', className: 'bg-gray-100 text-gray-800', icon: FaUser }
    };

    const config = roleConfig[role] || roleConfig.MEMBER;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: { text: '승인됨', className: 'bg-green-100 text-green-800' },
      ACTIVE: { text: '승인됨', className: 'bg-green-100 text-green-800' },
      PENDING: { text: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      REJECTED: { text: '거부됨', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (clubLoading || membersLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-neutral-600">멤버 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (clubError || !club) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-8 sm:py-12">
        <div className="text-center">
          <p className="text-sm sm:text-base text-error-600 mb-3 sm:mb-4">클럽 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => navigate('/clubs')}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
          >
            클럽 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 메모 모달 열기
  const openNoteModal = (member) => {
    console.log('=== openNoteModal 함수 실행 ===');
    console.log('받은 멤버:', member);
    
    if (!member) {
      console.error('멤버 정보가 없습니다');
      return;
    }
    
    if (!member.user_id) {
      console.error('멤버 user_id가 없습니다');
      return;
    }
    
    console.log('모달 상태 설정 시작');
    setSelectedMemberForNote(member);
    setShowNoteModal(true);
    setMemberNote('');
    
    console.log('메모 조회 시작:', member.user_id);
    // 메모 조회
    getMemberNoteMutation.mutate({ userId: member.user_id });
    console.log('메모 조회 요청 완료');
  };

  // 메모 모달 닫기
  const closeNoteModal = () => {
    setShowNoteModal(false);
    setMemberNote('');
    setSelectedMemberForNote(null);
  };

  // 메모 저장
  const saveNote = () => {
    if (!selectedMemberForNote) return;
    
    updateMemberNoteMutation.mutate({ 
      userId: selectedMemberForNote.user_id, 
      note: memberNote 
    });
  };

  const getFilteredMembers = useCallback(() => {
    switch (selectedTab) {
      case 'pending':
        return pendingMembers;
      case 'manager':
        return managers;
      case 'leader':
        return []; // 리더 탭에서는 멤버 목록 대신 리더 권한 관리 UI 표시
      case 'all':
      default:
        return approvedMembers; // 승인된 멤버 전체
    }
  }, [selectedTab, pendingMembers, managers, approvedMembers]);

  const allFilteredMembers = getFilteredMembers();
  
  // 페이지네이션 계산
  const totalPages = Math.ceil(allFilteredMembers.length / MEMBERS_PER_PAGE);
  const startIndex = (currentPage - 1) * MEMBERS_PER_PAGE;
  const endIndex = startIndex + MEMBERS_PER_PAGE;
  const filteredMembers = allFilteredMembers.slice(startIndex, endIndex);
  
  // 페이지네이션 유효성 검사: 필터링된 멤버 수가 변경되면 현재 페이지 조정
  useEffect(() => {
    const allFiltered = getFilteredMembers();
    const totalPagesForTab = Math.ceil(allFiltered.length / MEMBERS_PER_PAGE);
    if (currentPage > totalPagesForTab && totalPagesForTab > 0) {
      setCurrentPage(totalPagesForTab);
    } else if (currentPage < 1 && allFiltered.length > 0) {
      setCurrentPage(1);
    }
  }, [getFilteredMembers, currentPage]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => navigate(`/clubs/${club?.display_id || clubId}/manage`)}
                className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                <FaArrowLeft className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">클럽 관리</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt={club.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 line-clamp-1">{club.name}</h1>
                <p className="text-xs sm:text-sm text-neutral-600">멤버 관리</p>
              </div>
            </div>

            {/* 멤버 통계 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{approvedMembers.length}</div>
                <div className="text-xs sm:text-sm text-blue-800">총 멤버</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{pendingMembers.length}</div>
                <div className="text-xs sm:text-sm text-yellow-800">승인 대기</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{approvedMembers.length}</div>
                <div className="text-xs sm:text-sm text-green-800">승인됨</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{leaders.length}</div>
                <div className="text-xs sm:text-sm text-purple-800">리더</div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b border-neutral-200 mb-4 sm:mb-6">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: '전체', count: approvedMembers.length },
              { id: 'manager', label: '매니저', count: managers.length },
              { id: 'leader', label: '리더', count: leaders.length },
              { id: 'pending', label: '승인 대기', count: pendingMembers.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  setCurrentPage(1); // 탭 변경 시 페이지를 1로 리셋
                }}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* 멤버 목록 또는 리더 권한 관리 */}
        <div className="space-y-3 sm:space-y-4">
          {selectedTab === 'leader' ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">리더 권한 관리</h2>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">클럽 리더를 안전하게 교체할 수 있습니다</p>
              
              <div className="space-y-4 sm:space-y-6">
                {/* 현재 리더 정보 */}
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-neutral-900 mb-2 sm:mb-3">현재 리더 정보</h3>
                  {leaders.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {leaders.map((leader) => (
                        <div key={leader.user_id || leader.id} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 text-purple-800 rounded-lg flex items-center gap-1.5 sm:gap-2">
                          <FaUsers className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-xs sm:text-sm font-medium">
                            {leader.user_realname || leader.user_nickname}
                            {leader.user_realname && leader.user_nickname && ` (${leader.user_nickname})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-yellow-800">현재 리더가 없습니다. 새 리더를 임명해주세요.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-200"></div>

                {/* 새 리더 선택 */}
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-neutral-900 mb-2 sm:mb-3">새 리더 선택</h3>
                  <select
                    value={newLeaderId}
                    onChange={(e) => setNewLeaderId(e.target.value)}
                    disabled={changeLeaderMutation.isPending}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">새 리더를 선택하세요</option>
                    {approvedMembers
                      .filter(m => normalizeRole(m.role) !== 'LEADER')
                      .map((member) => (
                        <option key={member.user_id || member.id} value={member.user_id || member.id}>
                          {member.user_realname || member.user_nickname}
                          {member.user_realname && member.user_nickname && ` (${member.user_nickname})`}
                          {' - 현재: '}
                          {member.role === 'MANAGER' ? '매니저' : '멤버'}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="border-t border-neutral-200"></div>

                {/* 현재 리더의 새 역할 설정 */}
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-neutral-900 mb-2 sm:mb-3">현재 리더의 새 역할 설정</h3>
                  <select
                    value={currentLeaderNewRole}
                    onChange={(e) => setCurrentLeaderNewRole(e.target.value)}
                    disabled={changeLeaderMutation.isPending}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-1.5 sm:mb-2"
                  >
                    <option value="MANAGER">매니저</option>
                    <option value="MEMBER">일반 멤버</option>
                  </select>
                  <p className="text-xs sm:text-sm text-neutral-600">
                    현재 리더들은 선택한 역할로 변경됩니다.
                  </p>
                </div>

                <div className="border-t border-neutral-200"></div>

                {/* 변경 버튼 */}
                <div className="text-center pt-3 sm:pt-4">
                  <button
                    onClick={handleChangeLeader}
                    disabled={!newLeaderId || changeLeaderMutation.isPending}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] sm:min-w-[200px]"
                  >
                    {changeLeaderMutation.isPending ? '변경 중...' : '리더 교체하기'}
                  </button>
                </div>
              </div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-neutral-400 mb-3 sm:mb-4">
                <FaUsers className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">멤버가 없습니다</h3>
              <p className="text-sm sm:text-base text-neutral-600">해당 조건에 맞는 멤버가 없습니다.</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div key={member.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 cursor-pointer" onClick={() => handleOpenMemberProfile(member)}>
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shadow-md">
                      <FaUser className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-neutral-900 hover:text-primary-600 transition-colors">
                        {member.user_name || member.user_realname || member.user_nickname}
                      </h4>
                      <p className="text-sm text-neutral-500">{member.user_email}</p>
                      {member.user_realname && member.user_nickname && member.user_name !== member.user_nickname && (
                        <p className="text-sm text-neutral-500">닉네임: {member.user_nickname}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3" onClick={(e) => e.stopPropagation()}>
                    {getRoleBadge(member.role)}
                    {getStatusBadge(member.status)}
                    
                    <div className="flex items-center space-x-1">
                      {member.status === 'PENDING' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveMember(member);
                            }}
                            className="p-2 text-green-600 hover:text-green-700 transition-colors"
                            title="승인"
                          >
                            <FaCheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectMember(member);
                            }}
                            className="p-2 text-red-600 hover:text-red-700 transition-colors"
                            title="거부"
                          >
                            <FaTimes className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      
                      {(member.status === 'APPROVED' || member.status === 'ACTIVE') && member.role !== 'LEADER' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChangeRole(member, member.role === 'MANAGER' ? 'MEMBER' : 'MANAGER');
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                            title="역할 변경"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          {/* 일반회원만 제거 가능 */}
                          {member.role === 'MEMBER' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(member);
                            }}
                            className="p-2 text-red-600 hover:text-red-700 transition-colors"
                            title="제거"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <div className="flex items-center space-x-4">
                      <span>가입일: {new Date(member.joined_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    {member.role === 'LEADER' && (
                      <span className="text-purple-600 font-medium">클럽 리더</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* 페이지네이션 UI (리더 탭 제외) */}
          {selectedTab !== 'leader' && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {(() => {
                  // 표시할 페이지 번호 계산 (5개씩 정렬)
                  const pageNumbers = [];
                  
                  if (totalPages <= 5) {
                    // 5개 이하면 모두 표시
                    for (let i = 1; i <= totalPages; i++) {
                      pageNumbers.push(i);
                    }
                  } else {
                    // 6개 이상: 항상 5개씩 표시 (5의 배수 단위로 그룹화)
                    const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
                    const groupEnd = Math.min(groupStart + 4, totalPages);
                    
                    for (let i = groupStart; i <= groupEnd; i++) {
                      pageNumbers.push(i);
                    }
                  }
                  
                  return pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ));
                })()}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <FaCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                완료
              </h3>
              
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>
              
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                확인
              </button>
            </div>
          </div>
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
                {alertModalData.type === 'error' && <FaTimes className="h-8 w-8 text-red-600" />}
                {alertModalData.type === 'warning' && <FaTimes className="h-8 w-8 text-yellow-600" />}
                {alertModalData.type === 'info' && <FaTimes className="h-8 w-8 text-blue-600" />}
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

      {/* 멤버 프로필 모달 */}
      {showMemberProfileModal && selectedMemberForProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pb-20">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center shadow-md">
                  <FaUser className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900">
                    멤버 프로필
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {selectedMemberForProfile.user_name || selectedMemberForProfile.user_realname || selectedMemberForProfile.user_nickname}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMemberProfileModal(false);
                  setSelectedMemberForProfile(null);
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  이름
                </label>
                <p className="text-base text-neutral-900">
                  {selectedMemberForProfile.user_realname || selectedMemberForProfile.user_name || 'N/A'}
                </p>
              </div>

              {/* 전화번호 */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  전화번호
                </label>
                <p className="text-base text-neutral-900">
                  {selectedMemberForProfile.user_phone_number || 'N/A'}
                </p>
              </div>

              {/* 생년월일 */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  생년월일
                </label>
                <p className="text-base text-neutral-900">
                  {selectedMemberForProfile.user_birthdate
                    ? new Date(selectedMemberForProfile.user_birthdate).toLocaleDateString('ko-KR')
                    : 'N/A'}
                </p>
              </div>

              {/* 성별 */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  성별
                </label>
                <p className="text-base text-neutral-900">
                  {selectedMemberForProfile.user_gender === 'MALE' ? '남성' :
                   selectedMemberForProfile.user_gender === 'FEMALE' ? '여성' :
                   selectedMemberForProfile.user_gender === 'OTHER' ? '기타' :
                   'N/A'}
                </p>
              </div>

              {/* 핸디캡 */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  핸디캡
                </label>
                <p className="text-base text-neutral-900">
                  {selectedMemberForProfile.user_handicap !== null && selectedMemberForProfile.user_handicap !== undefined
                    ? selectedMemberForProfile.user_handicap
                    : 'N/A'}
                </p>
              </div>

              {/* 평균 스코어 */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  평균 스코어
                </label>
                <p className="text-base text-neutral-900">
                  {selectedMemberForProfile.user_average_score !== null && selectedMemberForProfile.user_average_score !== undefined
                    ? selectedMemberForProfile.user_average_score
                    : 'N/A'}
                </p>
              </div>

              {/* 역할 */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  클럽 내 역할
                </label>
                <div className="mt-1">
                  {getRoleBadge(selectedMemberForProfile.role)}
                </div>
              </div>

              {/* 가입일 */}
              <div>
                <label className="block text-sm font-medium text-neutral-500 mb-1">
                  가입일
                </label>
                <p className="text-base text-neutral-900">
                  {selectedMemberForProfile.joined_at
                    ? new Date(selectedMemberForProfile.joined_at).toLocaleDateString('ko-KR')
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* 내보내기 버튼 (리더 제외) */}
            {selectedMemberForProfile.role !== 'LEADER' && (
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <button
                  onClick={() => handleExportFromProfile(selectedMemberForProfile)}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  내보내기
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메모 모달 */}
      {showNoteModal && selectedMemberForNote ? (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeNoteModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">구성원 메모</h3>
                <button
                  onClick={closeNoteModal}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  type="button"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              
              {/* 멤버 정보 */}
              <div className="mb-4 pb-4 border-b border-neutral-200">
                <h4 className="font-medium text-neutral-900 mb-1">
                  {selectedMemberForNote.user_name || selectedMemberForNote.user_realname || selectedMemberForNote.user_nickname}
                </h4>
                <p className="text-sm text-neutral-500">{selectedMemberForNote.user_email}</p>
              </div>
              
              {/* 모달 내용 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  메모
                </label>
                {getMemberNoteMutation.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <textarea
                    value={memberNote}
                    onChange={(e) => setMemberNote(e.target.value)}
                    placeholder="구성원에 대한 메모를 입력하세요"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={8}
                  />
                )}
              </div>
              
              {/* 모달 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={closeNoteModal}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  type="button"
                >
                  취소
                </button>
                <button
                  onClick={saveNote}
                  disabled={updateMemberNoteMutation.isPending || getMemberNoteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                >
                  {updateMemberNoteMutation.isPending ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 거절 사유 모달 */}
      {showRejectReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">가입 거절</h3>
                <button
                  onClick={() => {
                    setShowRejectReasonModal(false);
                    setRejectReason('');
                    setMemberToReject(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              
              {/* 모달 내용 */}
              <div className="mb-6">
                <p className="text-neutral-600 mb-4">거절 사유를 입력해주세요</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="거절 사유를 입력하세요"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  rows={4}
                />
              </div>
              
              {/* 모달 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectReasonModal(false);
                    setRejectReason('');
                    setMemberToReject(null);
                  }}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmReject}
                  disabled={rejectMembershipMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {rejectMembershipMutation.isPending ? '처리 중...' : '거절 완료'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 역할 변경 확인 모달 */}
      {showRoleChangeModal && roleChangeData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">역할 변경</h3>
                <button
                  onClick={() => {
                    setShowRoleChangeModal(false);
                    setRoleChangeData(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              
              {/* 모달 내용 */}
              <div className="mb-6">
                <p className="text-neutral-600 mb-4">
                  <strong>{roleChangeData.member.user_name || roleChangeData.member.user_realname || roleChangeData.member.user_nickname}</strong>님의 역할을 변경하시겠습니까?
                </p>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">현재 역할:</span>
                    <span className="font-medium">
                      {roleChangeData.member.role === 'MEMBER' ? '일반회원' :
                       roleChangeData.member.role === 'MANAGER' ? '매니저' :
                       roleChangeData.member.role === 'LEADER' ? '리더' : roleChangeData.member.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">변경할 역할:</span>
                    <span className="font-medium text-primary-600">
                      {roleChangeData.newRole === 'MEMBER' ? '일반회원' :
                       roleChangeData.newRole === 'MANAGER' ? '매니저' :
                       roleChangeData.newRole === 'LEADER' ? '리더' : roleChangeData.newRole}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 모달 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRoleChangeModal(false);
                    setRoleChangeData(null);
                  }}
                  className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    changeRoleMutation.mutate({
                      userId: roleChangeData.member.user_id,
                      newRole: roleChangeData.newRole
                    });
                    setShowRoleChangeModal(false);
                    setRoleChangeData(null);
                  }}
                  disabled={changeRoleMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changeRoleMutation.isPending ? '처리 중...' : '변경하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
          toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toastType === 'success' ? (
            <FaCheckCircle className="w-5 h-5" />
          ) : (
            <FaTimes className="w-5 h-5" />
          )}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ClubMemberManagePage;
