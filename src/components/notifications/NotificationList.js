import { FontAwesome5 } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { notificationsApi } from '../../lib/api';
import { extractList } from '../../lib/responseUtils';
import { colors } from '../../theme/colors';

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR');
};

const getIconConfig = (type) => {
  switch (type) {
    case 'MEETING_CANCELLATION':
      return { name: 'exclamation-circle', color: colors.error[500] };
    default:
      return { name: 'bell', color: colors.primary[600] };
  }
};

export default function NotificationList({ meetingId, limit = 10 }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationsApi.getNotifications({
        limit,
        type_filter: meetingId ? undefined : 'MEETING_CANCELLATION',
      });

      let items = extractList(response);
      if (meetingId) {
        items = items.filter(
          (notification) => notification.related_entity_id === meetingId,
        );
      }

      setNotifications(items);
    } catch (fetchError) {
      console.error('알림 목록 조회 실패:', fetchError);
      setError('알림을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [limit, meetingId]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
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
    } catch (markError) {
      console.error('알림 읽음 처리 실패:', markError);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: 'READ',
          read_at: new Date().toISOString(),
        })),
      );
    } catch (markError) {
      console.error('모든 알림 읽음 처리 실패:', markError);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.status === 'UNREAD').length,
    [notifications],
  );

  if (loading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="small" color={colors.primary[600]} />
        <Text style={styles.stateText}>알림을 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-circle" size={28} color={colors.error[500]} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={fetchNotifications} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="bell" size={28} color={colors.neutral[400]} />
        <Text style={styles.emptyText}>알림이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>알림 ({notifications.length})</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllAsRead}>
            <Text style={styles.markAllText}>모두 읽음</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.list}>
        {notifications.map((notification) => {
          const iconConfig = getIconConfig(notification.type);
          const isUnread = notification.status === 'UNREAD';
          return (
            <View
              key={notification.id}
              style={[
                styles.item,
                isUnread ? styles.itemUnread : styles.itemRead,
              ]}
            >
              <View style={styles.iconWrap}>
                <FontAwesome5
                  name={iconConfig.name}
                  size={14}
                  color={iconConfig.color}
                />
              </View>
              <View style={styles.itemContent}>
                <View style={styles.itemHeaderRow}>
                  <Text
                    style={[
                      styles.itemTitle,
                      isUnread ? styles.itemTitleUnread : styles.itemTitleRead,
                    ]}
                    numberOfLines={1}
                  >
                    {notification.title}
                  </Text>
                  {isUnread && (
                    <Pressable
                      onPress={() => markAsRead(notification.id)}
                      style={styles.readButton}
                    >
                      <FontAwesome5 name="check" size={12} color={colors.neutral[500]} />
                    </Pressable>
                  )}
                </View>
                <Text style={styles.itemBody}>{notification.content}</Text>
                <Text style={styles.itemDate}>{formatDateTime(notification.created_at)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  unreadBadge: {
    backgroundColor: colors.error[500],
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  markAllText: {
    color: colors.primary[600],
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  itemUnread: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  itemRead: {
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  itemTitleUnread: {
    color: colors.neutral[900],
  },
  itemTitleRead: {
    color: colors.neutral[700],
  },
  readButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  itemBody: {
    marginTop: 4,
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  itemDate: {
    marginTop: 6,
    fontSize: 10,
    color: colors.neutral[500],
  },
  stateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  stateText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.error[500],
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
});
