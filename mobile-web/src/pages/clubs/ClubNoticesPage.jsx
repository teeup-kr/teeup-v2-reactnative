import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '../../lib';
import { useAuth } from '../../hooks/useAuth';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaBell, FaEye, FaChevronDown, FaChevronUp, FaTimes } from 'react-icons/fa';

const ClubNoticesPage = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [editingImportant, setEditingImportant] = useState(false);
  const [editingPrivate, setEditingPrivate] = useState(false);
  const [expandedNoticeId, setExpandedNoticeId] = useState(null); // 확장된 공지사항 ID
  
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

  // HTML 태그 제거 함수
  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
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

  // 클럽 공지사항 목록 조회
  const {
    data: noticesData,
    isLoading: noticesLoading
  } = useQuery({
    queryKey: ['club-notices', clubId],
    queryFn: () => clubsApi.getClubNotices(clubId),
    enabled: !!clubId,
  });

  // 공지사항 생성 mutation
  const createNoticeMutation = useMutation({
    mutationFn: (noticeData) => 
      clubsApi.createClubNotice(clubId, noticeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-notices', clubId] });
      setDialogOpen(false);
      showToastNotification('공지사항이 성공적으로 등록되었습니다.', 'success');
    },
    onError: () => {
      showToastNotification('공지사항 등록에 실패했습니다.', 'error');
    },
  });

  // 공지사항 수정 mutation
  const updateNoticeMutation = useMutation({
    mutationFn: ({ noticeId, noticeData }) => 
      clubsApi.updateClubNotice(clubId, noticeId, noticeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-notices', clubId] });
      setDialogOpen(false);
      showToastNotification('공지사항이 성공적으로 수정되었습니다.', 'success');
    },
    onError: () => {
      showToastNotification('공지사항 수정에 실패했습니다.', 'error');
    },
  });

  // 공지사항 삭제 mutation
  const deleteNoticeMutation = useMutation({
    mutationFn: (noticeId) => 
      clubsApi.deleteClubNotice(clubId, noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-notices', clubId] });
      setConfirmModal({ ...confirmModal, isOpen: false });
      showToastNotification('공지사항이 성공적으로 삭제되었습니다.', 'success');
    },
    onError: () => {
      showToastNotification('공지사항 삭제에 실패했습니다.', 'error');
    },
  });

  // 공지사항 확장/축소 토글
  const handleToggleExpand = (noticeId) => {
    setExpandedNoticeId(prevId => (prevId === noticeId ? null : noticeId));
  };

  const handleCreateNotice = () => {
    setDialogMode('create');
    setSelectedNotice(null);
    setEditingTitle('');
    setEditingContent('');
    setEditingImportant(false);
    setEditingPrivate(false);
    setDialogOpen(true);
  };

  const handleEditNotice = (notice) => {
    setDialogMode('edit');
    setSelectedNotice(notice);
    setEditingTitle(notice.title);
    setEditingContent(notice.content);
    setEditingImportant(notice.is_important || false);
    setEditingPrivate(notice.is_private || false);
    setDialogOpen(true);
  };

  const handleViewNotice = (notice) => {
    setDialogMode('view');
    setSelectedNotice(notice);
    setDialogOpen(true);
  };

  const handleDeleteNotice = (notice) => {
    setConfirmModal({
      isOpen: true,
      title: '공지사항 삭제',
      message: `정말로 "${notice.title}" 공지사항을 삭제하시겠습니까?`,
      type: 'warning',
      onConfirm: () => {
        deleteNoticeMutation.mutate(notice.id);
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!editingTitle.trim() || !editingContent.trim()) {
      showToastNotification('제목과 내용을 모두 입력해주세요.', 'error');
      return;
    }

    const noticeData = {
      title: editingTitle.trim(),
      content: editingContent.trim(),
      is_important: editingImportant,
      is_private: editingPrivate
    };

    if (dialogMode === 'create') {
      createNoticeMutation.mutate(noticeData);
    } else {
      updateNoticeMutation.mutate({ noticeId: selectedNotice.id, noticeData });
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedNotice(null);
    setEditingTitle('');
    setEditingContent('');
    setEditingImportant(false);
    setEditingPrivate(false);
  };

  if (clubLoading || noticesLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-neutral-600">공지사항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (clubError || !club) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
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

  // 권한 확인 (ClubManagePage와 동일한 로직)
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

  const notices = noticesData?.data || [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
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
                onClick={handleCreateNotice}
                className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FaPlus className="h-4 w-4" />
                <span>공지사항 작성</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt={club.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 line-clamp-1">{club.name}</h1>
                <p className="text-xs sm:text-sm text-neutral-600">공지사항</p>
              </div>
            </div>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="space-y-4">
          {notices.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-neutral-400 mb-3 sm:mb-4">
                <FaBell className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">공지사항이 없습니다</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">아직 등록된 공지사항이 없습니다.</p>
              {(hasLeaderRole || hasManagerRole) && (
                <button
                  onClick={handleCreateNotice}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
                >
                  첫 번째 공지사항 작성하기
                </button>
              )}
            </div>
          ) : (
            notices.map((notice) => (
              <div key={notice.id} className="bg-white border border-neutral-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {notice.is_important && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          중요
                        </span>
                      )}
                      {notice.is_private && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          비공개
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-1">{notice.title}</h3>
                    </div>
                    
                    <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-500 mb-2">
                      <span>작성자: {notice.author_name || notice.author_nickname || '알 수 없음'}</span>
                      <span>조회수: {notice.view_count || notice.views || 0}</span>
                      <span>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>

                    {/* 확장된 내용 */}
                    {expandedNoticeId === notice.id && (
                      <div className="mt-3 pt-3 border-t border-neutral-200">
                        <p className="text-neutral-700 whitespace-pre-wrap">{notice.content}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {(hasLeaderRole || hasManagerRole) && (
                      <>
                        <button
                          onClick={() => handleEditNotice(notice)}
                          className="p-2 text-neutral-400 hover:text-primary-600 transition-colors"
                          title="수정"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotice(notice)}
                          className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleToggleExpand(notice.id)}
                      className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title={expandedNoticeId === notice.id ? '접기' : '펼치기'}
                    >
                      {expandedNoticeId === notice.id ? (
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

      {/* 공지사항 작성/수정/상세보기 모달 */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                {dialogMode === 'create' ? '공지사항 작성' : 
                 dialogMode === 'edit' ? '공지사항 수정' : '공지사항 상세'}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            {dialogMode === 'view' ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {selectedNotice.is_important && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        중요
                      </span>
                    )}
                    {selectedNotice.is_private && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        비공개
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{selectedNotice.title}</h4>
                </div>
                
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm sm:text-base text-gray-700 leading-relaxed">
                    {selectedNotice.content}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-500 pt-3 sm:pt-4 border-t">
                  <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                    <span>작성자: {selectedNotice.author_name}</span>
                    <span>조회수: {selectedNotice.view_count || 0}</span>
                  </div>
                  <span>{new Date(selectedNotice.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                
                <div className="flex justify-end pt-3 sm:pt-4">
                  <button
                    onClick={handleCloseDialog}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="block w-full px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="공지사항 제목을 입력하세요"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    내용
                  </label>
                  <textarea
                    rows={8}
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="block w-full px-2.5 py-2 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="공지사항 내용을 입력하세요"
                    required
                  />
                </div>
                
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_important"
                      checked={editingImportant}
                      onChange={(e) => setEditingImportant(e.target.checked)}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_important" className="ml-1.5 sm:ml-2 block text-xs sm:text-sm text-gray-700">
                      중요 공지사항으로 설정
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_private"
                      checked={editingPrivate}
                      onChange={(e) => setEditingPrivate(e.target.checked)}
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_private" className="ml-1.5 sm:ml-2 block text-xs sm:text-sm text-gray-700">
                      비공개 공지사항으로 설정 (리더/매니저만 볼 수 있음)
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleCloseDialog}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={createNoticeMutation.isPending || updateNoticeMutation.isPending}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {createNoticeMutation.isPending || updateNoticeMutation.isPending ? '처리 중...' : 
                     dialogMode === 'create' ? '작성' : '수정'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 확인 모달 */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 max-w-md w-full mx-3 sm:mx-4">
            <div className="text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full mb-3 sm:mb-4 ${
                confirmModal.type === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <FaTrash className={`h-6 w-6 sm:h-8 sm:w-8 ${
                  confirmModal.type === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`} />
              </div>
              
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {confirmModal.title}
              </h3>
              
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {confirmModal.message}
              </p>
              
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors font-medium ${
                    confirmModal.type === 'warning' 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
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

export default ClubNoticesPage;
