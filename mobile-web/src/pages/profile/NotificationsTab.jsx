import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../lib/api';
import { 
  FaBell, FaCheck, FaTrash, FaUsers, FaCalendarAlt, 
  FaFileAlt, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaTimes
} from 'react-icons/fa';

const NotificationsTab = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, club, meeting, notice, etc.
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', tone: 'success' });

  // 알림 목록 조회
  const {
    data: notifications,
    isLoading,
    error
  } = useQuery({
    queryKey: ['notifications', filter, typeFilter],
    queryFn: () => {
      const params = { filter };
      if (typeFilter !== 'all') {
        params.type_filter = typeFilter;
      }
      return notificationsApi.getNotifications(params);
    },
  });

  // 알림 타입별 아이콘 반환
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CLUB_MEMBERSHIP_APPROVED':
      case 'CLUB_MEMBERSHIP_REJECTED':
      case 'CLUB_MEMBERSHIP_REQUEST':
      case 'CLUB_INVITATION':
        return <FaUsers className="w-5 h-5 text-blue-600" />;
      case 'MEETING_REMINDER':
      case 'MEETING_CANCELLATION':
      case 'MEETING_COMPLETED':
      case 'TEAM_FORMATION_COMPLETED':
        return <FaCalendarAlt className="w-5 h-5 text-emerald-600" />;
      case 'NEW_NOTICE':
        return <FaFileAlt className="w-5 h-5 text-yellow-600" />;
      case 'MEETING_SETTLEMENT_COMPLETED':
      case 'SOCIAL_SETTLEMENT_COMPLETED':
        return <FaMoneyBillWave className="w-5 h-5 text-purple-600" />;
      case 'SYSTEM':
      case 'GENERAL':
      default:
        return <FaBell className="w-5 h-5 text-neutral-600" />;
    }
  };

  // 알림 클릭 시 관련 페이지로 이동
  const handleNotificationClick = async (notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (notification.status === 'UNREAD') {
      markAsReadMutation.mutate(notification.id);
    }

    const { related_entity_type, related_entity_id } = notification;
    
    if (!related_entity_type || !related_entity_id) {
      return; // 관련 엔티티가 없으면 이동하지 않음
    }

    switch (related_entity_type) {
      case 'CLUB':
      case 'CLUB_MEMBERSHIP':
        navigate(`/clubs/${related_entity_id}`);
        break;
      case 'MEETING':
      case 'SOCIAL':
        // 모임 상세 페이지로 이동하지 않음
        break;
      case 'CLUB_NOTICE':
        // 클럽 공지사항의 경우 club_id를 extra_data에서 가져와야 할 수 있음
        if (notification.extra_data?.club_id) {
          navigate(`/clubs/${notification.extra_data.club_id}/notices`);
        }
        break;
      default:
        // 이동하지 않음
        break;
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    try {
      if (!dateString) {
        return '날짜 정보 없음';
      }
      
      const date = new Date(dateString);
      
      // Invalid Date 체크
      if (isNaN(date.getTime())) {
        return '날짜 정보 없음';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return '방금 전';
      } else if (diffMins < 60) {
        return `${diffMins}분 전`;
      } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
      } else if (diffDays < 7) {
        return `${diffDays}일 전`;
      } else {
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '날짜 정보 없음';
    }
  };

  // 읽지 않은 알림 확인
  const isUnread = (notification) => {
    return notification.status === 'UNREAD' || !notification.read_at;
  };

  // 알림 읽음 처리
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => notificationsApi.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['notifications', filter, typeFilter] });
      
      // 이전 값 백업
      const previousNotifications = queryClient.getQueryData(['notifications', filter, typeFilter]);
      
      // 낙관적 업데이트
      queryClient.setQueryData(['notifications', filter, typeFilter], (old) => {
        if (!old) return old;
        return old.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: 'READ', read_at: new Date().toISOString() }
            : notification
        );
      });
      
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // 에러 시 이전 값으로 롤백
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', filter, typeFilter], context.previousNotifications);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 알림 삭제
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => notificationsApi.deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['notifications', filter, typeFilter] });
      
      // 이전 값 백업
      const previousNotifications = queryClient.getQueryData(['notifications', filter, typeFilter]);
      
      // 낙관적 업데이트 - 삭제된 항목 제거
      queryClient.setQueryData(['notifications', filter, typeFilter], (old) => {
        if (!old) return old;
        return old.filter((notification) => notification.id !== notificationId);
      });
      
      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // 에러 시 이전 값으로 롤백
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', filter, typeFilter], context.previousNotifications);
      }
      setToast({ open: true, message: '알림 삭제에 실패했습니다.', tone: 'error' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setToast({ open: true, message: '알림이 삭제되었습니다.', tone: 'success' });
    },
  });

  // 전체 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onMutate: async () => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['notifications', filter, typeFilter] });
      
      // 이전 값 백업
      const previousNotifications = queryClient.getQueryData(['notifications', filter, typeFilter]);
      
      // 낙관적 업데이트 - 모든 알림을 읽음 처리
      queryClient.setQueryData(['notifications', filter, typeFilter], (old) => {
        if (!old) return old;
        const now = new Date().toISOString();
        return old.map((notification) => ({
          ...notification,
          status: 'READ',
          read_at: notification.read_at || now,
        }));
      });
      
      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      // 에러 시 이전 값으로 롤백
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', filter, typeFilter], context.previousNotifications);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setToast({ open: true, message: '모든 알림이 읽음 처리되었습니다.', tone: 'success' });
    },
  });

  // 알림 읽음 처리
  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  // 알림 삭제
  const handleDeleteNotification = (notificationId) => {
    setNotificationToDelete(notificationId);
    setDeleteModalOpen(true);
  };

  // 삭제 확인
  const confirmDelete = () => {
    if (notificationToDelete) {
      deleteNotificationMutation.mutate(notificationToDelete);
      setDeleteModalOpen(false);
      setNotificationToDelete(null);
    }
  };

  // 삭제 취소
  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setNotificationToDelete(null);
  };

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast.open) return undefined;
    const timeout = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.open]);

  // 전체 읽음 처리
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // 알림 선택 토글
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // 전체 선택 토글
  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications?.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications?.map(n => n.id) || []);
    }
  };

  // 선택된 알림들 일괄 처리
  const handleBulkAction = async (action) => {
    if (action === 'read') {
      // 읽음 처리는 병렬로 처리
      await Promise.all(
        selectedNotifications.map(notificationId => 
          markAsReadMutation.mutateAsync(notificationId)
        )
      );
    } else if (action === 'delete') {
      // 삭제는 순차적으로 처리 (낙관적 업데이트가 각각 적용되도록)
      for (const notificationId of selectedNotifications) {
        await deleteNotificationMutation.mutateAsync(notificationId);
      }
    }
    setSelectedNotifications([]);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">알림을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="text-center text-red-600">
          <FaTimes className="mx-auto h-12 w-12 mb-4" />
          <p>알림을 불러올 수 없습니다.</p>
          <p className="text-sm mt-2">{error?.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 필터 및 액션 버튼 */}
      <div className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* 필터 버튼 */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">전체 타입</option>
              <option value="CLUB_MEMBERSHIP_APPROVED">클럽 가입 승인</option>
              <option value="CLUB_MEMBERSHIP_REJECTED">클럽 가입 거절</option>
              <option value="CLUB_MEMBERSHIP_REQUEST">가입 신청</option>
              <option value="MEETING_REMINDER">모임 알림</option>
              <option value="TEAM_FORMATION_COMPLETED">팀 편성 완료</option>
              <option value="NEW_NOTICE">공지사항</option>
              <option value="MEETING_SETTLEMENT_COMPLETED">정산 완료</option>
              <option value="SOCIAL_SETTLEMENT_COMPLETED">소셜 정산 완료</option>
            </select>
            <button
              onClick={() => setFilter('all')}
              className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === 'unread'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
              }`}
            >
              읽지 않음
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`flex-shrink-0 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === 'read'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
              }`}
            >
              읽음
            </button>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkAction('read')}
                  className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  읽음 처리
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  삭제
                </button>
              </div>
            )}
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {markAllAsReadMutation.isPending ? '처리 중...' : '전체 읽음'}
            </button>
          </div>
        </div>

        {/* 전체 선택 체크박스 */}
        {notifications.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-600">전체 선택</span>
            </label>
          </div>
        )}
      </div>

      {/* 알림 목록 */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <FaBell className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              알림이 없습니다
            </h3>
            <p className="text-neutral-600">
              새로운 알림이 오면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const unread = isUnread(notification);
            const hasRelatedEntity = notification.related_entity_type && notification.related_entity_id;
            
            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl border transition-all ${
                  unread ? 'border-l-4 border-l-emerald-500 border-neutral-200' : 'border-neutral-200'
                } ${hasRelatedEntity ? 'cursor-pointer hover:shadow-md' : ''}`}
                onClick={() => hasRelatedEntity && handleNotificationClick(notification)}
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleNotificationSelection(notification.id);
                      }}
                      className="mt-1 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-base font-semibold ${
                          unread ? 'text-neutral-900' : 'text-neutral-600'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {unread && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              새 알림
                            </span>
                          )}
                          <span className="text-xs text-neutral-500 whitespace-nowrap">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="mt-2 text-sm text-neutral-600 whitespace-pre-line">
                        {notification.content}
                      </p>
                      
                      <div 
                        className="mt-3 flex items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {unread && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markAsReadMutation.isPending}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                          >
                            <FaCheck className="w-3 h-3" />
                            읽음 처리
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          disabled={deleteNotificationMutation.isPending}
                          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <FaTrash className="w-3 h-3" />
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                알림 삭제
              </h3>
              <p className="text-neutral-600 mb-6">
                이 알림을 삭제하시겠습니까?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteNotificationMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteNotificationMutation.isPending ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {toast.open && (
        <div
          className={`fixed top-6 right-6 z-50 flex max-w-xs items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.tone === 'error'
              ? 'bg-red-600 text-white'
              : toast.tone === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.tone === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
