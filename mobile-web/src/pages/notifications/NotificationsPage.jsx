import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationsApi, api } from '../../lib/api';
import { 
  FaBell, FaCheck, FaTrash, FaUsers, FaCalendarAlt, 
  FaFileAlt, FaCheckCircle, FaTimesCircle, FaUserPlus,
  FaUsersCog, FaMoneyBillWave, FaHandshake
} from 'react-icons/fa';

const NotificationsPage = () => {
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
        return <FaCalendarAlt className="w-5 h-5 text-green-600" />;
      case 'NEW_NOTICE':
        return <FaFileAlt className="w-5 h-5 text-yellow-600" />;
      case 'MEETING_SETTLEMENT_COMPLETED':
      case 'SOCIAL_SETTLEMENT_COMPLETED':
        return <FaMoneyBillWave className="w-5 h-5 text-purple-600" />;
      case 'SYSTEM':
      case 'GENERAL':
      default:
        return <FaBell className="w-5 h-5 text-gray-600" />;
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 알림 삭제
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => notificationsApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setToast({ open: true, message: '알림이 삭제되었습니다.', tone: 'success' });
    },
    onError: () => {
      setToast({ open: true, message: '알림 삭제에 실패했습니다.', tone: 'error' });
    },
  });

  // 전체 읽음 처리
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
  const handleBulkAction = (action) => {
    selectedNotifications.forEach(notificationId => {
      if (action === 'read') {
        markAsReadMutation.mutate(notificationId);
      } else if (action === 'delete') {
        deleteNotificationMutation.mutate(notificationId);
      }
    });
    setSelectedNotifications([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">알림을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">알림을 불러올 수 없습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <FaBell className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  알림
                </h1>
                <p className="text-sm text-gray-600">
                  새로운 소식과 업데이트를 확인하세요
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {markAllAsReadMutation.isPending ? '처리 중...' : '전체 읽음'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 필터 및 액션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === notifications?.length && notifications?.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">전체 선택</span>
                </div>
                
                {selectedNotifications.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleBulkAction('read')}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      읽음 처리
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">전체</option>
                  <option value="unread">읽지 않음</option>
                  <option value="read">읽음</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 목록 */}
        <div className="space-y-4">
          {notifications?.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <FaBell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                알림이 없습니다
              </h3>
              <p className="text-gray-600">
                새로운 알림이 오면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            notifications?.map((notification) => {
              const unread = isUnread(notification);
              const hasRelatedEntity = notification.related_entity_type && notification.related_entity_id;
              
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all ${
                    unread ? 'border-l-4 border-l-emerald-500' : ''
                  } ${hasRelatedEntity ? 'cursor-pointer hover:shadow-md' : ''}`}
                  onClick={() => hasRelatedEntity && handleNotificationClick(notification)}
                >
                  <div className="p-6">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleNotificationSelection(notification.id);
                        }}
                        className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="ml-3 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 ml-4">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-lg font-medium ${
                            unread ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {unread && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                새 알림
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="mt-2 text-gray-600 whitespace-pre-line">
                          {notification.content}
                        </p>
                        
                        <div 
                          className="mt-4 flex items-center space-x-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {unread && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              <FaCheck className="mr-1" />
                              읽음 처리
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            disabled={deleteNotificationMutation.isPending}
                            className="flex items-center text-sm text-red-600 hover:text-red-700 transition-colors"
                          >
                            <FaTrash className="mr-1" />
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
      </div>

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                알림 삭제
              </h3>
              <p className="text-gray-600 mb-6">
                이 알림을 삭제하시겠습니까?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
              : 'bg-green-600 text-white'
          }`}
        >
          {toast.tone === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
