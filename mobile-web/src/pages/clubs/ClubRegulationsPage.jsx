import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '../../lib';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaFileAlt, FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaTimes, FaBell, FaCheckCircle } from 'react-icons/fa';

const ClubRegulationsPage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedRegulation, setSelectedRegulation] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [expandedRegulationId, setExpandedRegulationId] = useState(null); // 확장된 규정 ID
  
  // 토스트 알림 상태
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // 토스트 메시지 자동 숨김
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 모달 상태
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  });

  // 토스트 알림 표시 함수
  const showToastNotification = (message, type) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

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

  // 클럽 멤버 목록 조회 (권한 확인용)
  const {
    data: membersData
  } = useQuery({
    queryKey: ['club-members', clubId],
    queryFn: () => clubsApi.getClubMembers(clubId),
    enabled: !!clubId,
  });

  // 규정 목록 조회
  const {
    data: regulationsData,
    isLoading: regulationsLoading,
    error: regulationsError
  } = useQuery({
    queryKey: ['club-regulations', clubId],
    queryFn: () => clubsApi.getClubRegulations(clubId),
    enabled: !!clubId,
  });

  // 카테고리와 조항을 평탄화하여 표시 (early return 이전에 Hook 호출)
  const regulations = React.useMemo(() => {
    if (!regulationsData?.categories) return [];
    const flattened = [];
    regulationsData.categories.forEach(category => {
      if (category.articles && category.articles.length > 0) {
        category.articles.forEach(article => {
          flattened.push({
            id: article.id,
            title: article.title,
            content: article.content,
            category: category.name,
            author_name: article.author_name || '시스템',  // 백엔드에서 제공하는 작성자 실명 사용
            created_at: article.created_at,
            updated_at: article.updated_at || article.created_at
          });
        });
      }
    });
    return flattened;
  }, [regulationsData]);

  // 규정 생성 mutation
  const createRegulationMutation = useMutation({
    mutationFn: (regulationData) => 
      clubsApi.createClubRegulation(clubId, regulationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-regulations', clubId] });
      setDialogOpen(false);
      showToastNotification('규정이 성공적으로 등록되었습니다.', 'success');
    },
    onError: () => {
      showToastNotification('규정 등록에 실패했습니다.', 'error');
    },
  });

  // 규정 수정 mutation
  const updateRegulationMutation = useMutation({
    mutationFn: ({ regulationId, regulationData }) => 
      clubsApi.updateClubRegulation(clubId, regulationId, regulationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-regulations', clubId] });
      setDialogOpen(false);
      showToastNotification('규정이 성공적으로 수정되었습니다.', 'success');
    },
    onError: () => {
      showToastNotification('규정 수정에 실패했습니다.', 'error');
    },
  });

  // 규정 삭제 mutation
  const deleteRegulationMutation = useMutation({
    mutationFn: (regulationId) => 
      clubsApi.deleteClubRegulation(clubId, regulationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-regulations', clubId] });
      setConfirmModal({ ...confirmModal, isOpen: false });
      showToastNotification('규정이 성공적으로 삭제되었습니다.', 'success');
    },
    onError: () => {
      showToastNotification('규정 삭제에 실패했습니다.', 'error');
    },
  });

  // 규정 확장/축소 토글
  const handleToggleExpand = (regulationId) => {
    setExpandedRegulationId(prevId => (prevId === regulationId ? null : regulationId));
  };

  const handleCreateRegulation = () => {
    setDialogMode('create');
    setSelectedRegulation(null);
    setEditingTitle('');
    setEditingContent('');
    setDialogOpen(true);
  };

  const handleEditRegulation = (regulation) => {
    setDialogMode('edit');
    setSelectedRegulation(regulation);
    setEditingTitle(regulation.title);
    setEditingContent(regulation.content);
    setDialogOpen(true);
  };

  const handleDeleteRegulation = (regulation) => {
    setConfirmModal({
      isOpen: true,
      title: '규정 삭제',
      message: `정말로 "${regulation.title}" 규정을 삭제하시겠습니까?`,
      type: 'warning',
      onConfirm: () => {
        deleteRegulationMutation.mutate(regulation.id);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!editingTitle.trim() || !editingContent.trim()) {
      showToastNotification('제목과 내용을 모두 입력해주세요.', 'error');
      return;
    }

    const regulationData = {
      title: editingTitle.trim(),
      content: editingContent.trim(),
      version: '1.0', // 기본 버전
      is_required: false
    };

    if (dialogMode === 'create') {
      createRegulationMutation.mutate(regulationData);
    } else {
      updateRegulationMutation.mutate({ regulationId: selectedRegulation.id, regulationData });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRegulation(null);
    setEditingTitle('');
    setEditingContent('');
  };

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      GENERAL: { text: '일반', className: 'bg-blue-100 text-blue-800' },
      MEMBERSHIP: { text: '회원', className: 'bg-green-100 text-green-800' },
      MEETING: { text: '모임', className: 'bg-purple-100 text-purple-800' },
      FEE: { text: '회비', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = categoryConfig[category] || categoryConfig.GENERAL;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { text: '활성', className: 'bg-green-100 text-green-800' },
      INACTIVE: { text: '비활성', className: 'bg-gray-100 text-gray-800' },
      DRAFT: { text: '초안', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status] || statusConfig.DRAFT;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (clubLoading || regulationsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">규정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (clubError || !club) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 mb-4">클럽 정보를 불러올 수 없습니다.</p>
          <button
            onClick={() => navigate('/clubs')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            클럽 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 권한 확인 (ClubNoticesPage와 동일한 로직)
  // membersData에서 직접 권한 확인
  const isLeader = membersData?.members?.some(member => 
    member.user_id === user?.id && member.role === 'LEADER'
  ) || false;
  
  const isManager = membersData?.members?.some(member => 
    member.user_id === user?.id && member.role === 'MANAGER'
  ) || false;
  
  // 클럽 API 응답의 membership_role도 체크 (fallback)
  const isLeaderFromClub = club?.membership_role === 'LEADER';
  const isManagerFromClub = club?.membership_role === 'MANAGER';
  
  // 최종 권한: membersData 우선, 없으면 club.membership_role 사용
  const hasLeaderRole = isLeader || isLeaderFromClub;
  const hasManagerRole = isManager || isManagerFromClub;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/clubs/${club?.display_id || clubId}/manage`)}
                className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                <span className="text-sm font-medium">클럽 관리</span>
              </button>
            </div>
            
            {(hasLeaderRole || hasManagerRole) && (
              <button
                onClick={handleCreateRegulation}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FaPlus className="h-4 w-4" />
                <span>규정 작성</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white">
                <img 
                  src="/logo.png" 
                  alt={club.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{club.name}</h1>
                <p className="text-neutral-600">클럽 규정</p>
              </div>
            </div>
          </div>
        </div>

        {/* 규정 목록 */}
        <div className="space-y-4">
          {regulations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-neutral-400 mb-4">
                <FaFileAlt className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">규정이 없습니다</h3>
              <p className="text-neutral-600 mb-4">아직 등록된 규정이 없습니다.</p>
              {(hasLeaderRole || hasManagerRole) && (
                <button
                  onClick={handleCreateRegulation}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  첫 번째 규정 작성하기
                </button>
              )}
            </div>
          ) : (
            regulations.map((regulation) => (
              <div key={regulation.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryBadge(regulation.category)}
                      <h3 className="text-lg font-semibold text-neutral-900">{regulation.title}</h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-neutral-500 mb-2">
                      <span>작성자: {regulation.author_name}</span>
                      <span>생성일: {new Date(regulation.created_at).toLocaleDateString('ko-KR')}</span>
                      {regulation.updated_at !== regulation.created_at && (
                        <span>수정일: {new Date(regulation.updated_at).toLocaleDateString('ko-KR')}</span>
                      )}
                    </div>

                    {/* 확장된 내용 */}
                    {expandedRegulationId === regulation.id && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <p className="text-neutral-700 whitespace-pre-wrap">{regulation.content}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {(hasLeaderRole || hasManagerRole) && (
                      <>
                        <button
                          onClick={() => handleEditRegulation(regulation)}
                          className="p-2 text-neutral-400 hover:text-primary-600 transition-colors"
                          title="수정"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRegulation(regulation)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleToggleExpand(regulation.id)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title={expandedRegulationId === regulation.id ? '접기' : '펼치기'}
                    >
                      {expandedRegulationId === regulation.id ? (
                        <FaChevronUp className="h-4 w-4" />
                      ) : (
                        <FaChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 규정 작성/수정 모달 */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {dialogMode === 'create' ? '규정 작성' : '규정 수정'}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="규정 제목을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  rows={10}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="규정 내용을 입력하세요"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={createRegulationMutation.isPending || updateRegulationMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {createRegulationMutation.isPending || updateRegulationMutation.isPending ? '처리 중...' : 
                   dialogMode === 'create' ? '작성' : '수정'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 확인 모달 */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${
                confirmModal.type === 'success' ? 'bg-green-100' :
                confirmModal.type === 'error' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                {confirmModal.type === 'success' && <FaCheckCircle className="h-8 w-8 text-green-600" />}
                {confirmModal.type === 'error' && <FaTimes className="h-8 w-8 text-red-600" />}
                {confirmModal.type === 'warning' && <FaTimes className="h-8 w-8 text-yellow-600" />}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {confirmModal.title}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {confirmModal.message}
              </p>
              
              <div className="flex space-x-3">
                {confirmModal.type === 'warning' && (
                  <button
                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    취소
                  </button>
                )}
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                    confirmModal.type === 'success' 
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : confirmModal.type === 'error'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                >
                  확인
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
          <FaBell className="w-5 h-5" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ClubRegulationsPage;
