import React, { useCallback, useEffect, useState } from 'react';
import { FaBell, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { roundsApi } from '../../lib/api';

const NotificationList = ({ meetingId, limit = 10 }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await roundsApi.getNotifications({
        limit,
        type_filter: meetingId ? undefined : 'MEETING_CANCELLATION',
      });

      let items = response?.data || [];

      if (meetingId) {
        items = items.filter(
          (notification) => notification.related_entity_id === meetingId,
        );
      }

      setNotifications(items);
    } catch (err) {
      console.error('알림 목록 조회 실패:', err);
      setError('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [limit, meetingId]);

  const markAsRead = async (notificationId) => {
    try {
      await roundsApi.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                status: 'READ',
                read_at: new Date().toISOString(),
              }
            : notification,
        ),
      );
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await roundsApi.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: 'READ',
          read_at: new Date().toISOString(),
        })),
      );
    } catch (err) {
      console.error('모든 알림 읽음 처리 실패:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MEETING_CANCELLATION':
        return <FaExclamationCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
      default:
        return <FaBell className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
    }
  };

  const getNotificationStyle = (status) => {
    return status === 'UNREAD'
      ? 'bg-green-50 border-l-4 border-green-500'
      : 'bg-green-25 border-l-4 border-green-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 sm:py-8">
        <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
        <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-neutral-600">알림을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 sm:py-8 text-center">
        <FaExclamationCircle className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
        <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={fetchNotifications}
          className="rounded-lg bg-green-600 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="py-6 sm:py-8 text-center">
        <FaBell className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-neutral-400" />
        <p className="text-xs sm:text-sm text-neutral-600">알림이 없습니다.</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((item) => item.status === 'UNREAD').length;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900">
          알림 ({notifications.length})
          {unreadCount > 0 && (
            <span className="ml-1.5 sm:ml-2 rounded-full bg-red-500 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-white">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-xs sm:text-sm font-medium text-green-600 transition-colors hover:text-green-700"
          >
            모두 읽음
          </button>
        )}
      </div>

      <div className="space-y-2 sm:space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-lg border p-3 sm:p-4 ${getNotificationStyle(notification.status)}`}
          >
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="mt-0.5 sm:mt-1 flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-xs sm:text-sm font-medium ${
                        notification.status === 'UNREAD'
                          ? 'text-neutral-900'
                          : 'text-neutral-700'
                      }`}
                    >
                      {notification.title}
                    </h4>
                    <p className="mt-1 whitespace-pre-line text-xs sm:text-sm text-neutral-600">
                      {notification.content}
                    </p>
                    <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-neutral-500">
                      {new Date(notification.created_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  {notification.status === 'UNREAD' && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className="ml-1 sm:ml-2 p-1 sm:p-1.5 text-neutral-400 transition-colors hover:text-neutral-600 flex-shrink-0"
                      title="읽음 처리"
                    >
                      <FaCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationList;


