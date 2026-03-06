import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppToast from '@/components/ui/AppToast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { notificationsApi } from '@/lib/api/api';
import {
  createBulkDeleteHandler,
  createBulkReadHandler,
  createClearDeleteTargetHandler,
  createConfirmDeleteHandler,
  createDeleteNotificationHandler,
  createDeleteTargetHandler,
  createFilterPressHandler,
  createLoadNotificationsHandler,
  createMarkAllAsReadHandler,
  createMarkAsReadHandler,
  createOpenNotificationHandler,
  createOpenNotificationPressHandler,
  createSelectAllHandler,
  createToggleSelectHandler,
  createToggleSelectPressHandler,
} from '@/lib/handler/mypage';
import {
  formatNotificationDate,
  getNotificationIcon,
  isUnreadNotification,
  notificationTypeLabels,
  pickData,
} from '@/lib/util/mypageUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';



export default function NotificationsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const safeAreaEdges = pathname === '/mypage/notifications' ? ['top'] : [];

  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useMemo(
    () =>
      createLoadNotificationsHandler({
        notificationsApi,
        filter,
        typeFilter,
        pickData,
        setNotifications,
        setLoading,
        setError,
      }),
    [filter, typeFilter, setNotifications, setLoading, setError]
  );

  useEffect(() => {
    load();
  }, [load]);

  const markAsRead = useMemo(
    () =>
      createMarkAsReadHandler({
        notificationsApi,
        setNotifications,
        alert: Alert.alert,
      }),
    [setNotifications]
  );

  const markAllAsRead = useMemo(
    () =>
      createMarkAllAsReadHandler({
        notificationsApi,
        setNotifications,
        setToast,
        alert: Alert.alert,
      }),
    [setNotifications, setToast]
  );

  const deleteOne = useMemo(
    () =>
      createDeleteNotificationHandler({
        notificationsApi,
        setNotifications,
        setToast,
        alert: Alert.alert,
      }),
    [setNotifications, setToast]
  );

  const toggleSelect = useMemo(
    () => createToggleSelectHandler({ setSelected }),
    [setSelected]
  );

  const handleToggleSelect = useMemo(
    () => createToggleSelectPressHandler({ onToggle: toggleSelect }),
    [toggleSelect]
  );

  const selectAll = useMemo(
    () => createSelectAllHandler({ notifications, selected, setSelected }),
    [notifications, selected, setSelected]
  );

  const bulkRead = useMemo(
    () => createBulkReadHandler({ selected, markAsRead, setSelected }),
    [selected, markAsRead, setSelected]
  );

  const bulkDelete = useMemo(
    () => createBulkDeleteHandler({ selected, deleteOne, setSelected }),
    [selected, deleteOne, setSelected]
  );

  const openNotification = useMemo(
    () =>
      createOpenNotificationHandler({
        isUnreadNotification,
        markAsRead,
        router,
      }),
    [markAsRead, router]
  );

  const handleOpenNotification = useMemo(
    () => createOpenNotificationPressHandler({ onOpen: openNotification }),
    [openNotification]
  );

  const handleFilterPress = useMemo(
    () => createFilterPressHandler({ setFilter }),
    [setFilter]
  );

  const handleDeleteTarget = useMemo(
    () => createDeleteTargetHandler({ setDeleteTarget }),
    [setDeleteTarget]
  );

  const clearDeleteTarget = useMemo(
    () => createClearDeleteTargetHandler({ setDeleteTarget }),
    [setDeleteTarget]
  );

  const confirmDelete = useMemo(
    () => createConfirmDeleteHandler({ deleteTarget, deleteOne, setDeleteTarget }),
    [deleteTarget, deleteOne, setDeleteTarget]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.centerText}>알림을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
        <Card style={styles.errorCard}>
          <FontAwesome5 name="times" size={36} color={colors.error[600]} />
          <Text style={styles.errorTitle}>알림을 불러올 수 없습니다</Text>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={safeAreaEdges}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.filterCard}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: tokens.spacing.xs2 }}
          >
            <View style={styles.filterBtn}>
              <Text style={styles.filterText}>{notificationTypeLabels[typeFilter]}</Text>
              <Text style={styles.arrow}>▼</Text>

              <Picker
                selectedValue={typeFilter}
                onValueChange={setTypeFilter}
                mode="dialog"
                style={styles.hiddenPicker}
                dropdownIconColor="transparent"
              >
                <Picker.Item label="전체 타입" value="all" />
                <Picker.Item label="클럽 가입 승인" value="CLUB_MEMBERSHIP_APPROVED" />
                <Picker.Item label="클럽 가입 거절" value="CLUB_MEMBERSHIP_REJECTED" />
                <Picker.Item label="가입 신청" value="CLUB_MEMBERSHIP_REQUEST" />
                <Picker.Item label="모임 알림" value="MEETING_REMINDER" />
                <Picker.Item label="팀 편성 완료" value="TEAM_FORMATION_COMPLETED" />
                <Picker.Item label="공지사항" value="NEW_NOTICE" />
                <Picker.Item label="정산 완료" value="MEETING_SETTLEMENT_COMPLETED" />
                <Picker.Item label="소셜 정산 완료" value="SOCIAL_SETTLEMENT_COMPLETED" />
              </Picker>
            </View>

            {['all', 'unread', 'read'].map((value) => (
              <Pressable
                key={value}
                onPress={handleFilterPress(value)}
                style={[
                  styles.filterBtn,
                  filter === value && styles.filterBtnActive,
                  value === 'unread' && filter === value && { backgroundColor: colors.red[600] },
                  value === 'read' && filter === value && { backgroundColor: colors.emerald[600] },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === value && { color: 'white' },
                  ]}
                >
                  {value === 'all' ? '전체' : value === 'unread' ? '읽지 않음' : '읽음'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.actionRow}>
            {selected.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button style={styles.bulkRead} onPress={bulkRead}>
                  <Text style={styles.bulkTextBlue}>읽음 처리</Text>
                </Button>
                <Button style={styles.bulkDelete} onPress={bulkDelete}>
                  <Text style={styles.bulkTextRed}>삭제</Text>
                </Button>
              </View>
            )}

            <Button style={styles.markAllBtn} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>전체 읽음</Text>
            </Button>
          </View>

          {notifications.length > 0 && (
            <Pressable style={styles.selectAllRow} onPress={selectAll}>
              <FontAwesome5
                name={selected.length === notifications.length ? 'check-square' : 'square'}
                size={18}
                color={colors.primary[600]}
              />
              <Text style={styles.selectAllText}>전체 선택</Text>
            </Pressable>
          )}
        </Card>

        {selected.length > 0 && (
          <View style={styles.bulkRow}>
            <Button style={styles.bulkBtnBlue} onPress={bulkRead}>
              <Text style={styles.bulkText}>읽음 처리</Text>
            </Button>
            <Button style={styles.bulkBtnRed} onPress={bulkDelete}>
              <Text style={styles.bulkText}>삭제</Text>
            </Button>
          </View>
        )}

        {notifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="bell" size={32} color={colors.neutral[400]} />
            <Text style={styles.emptyText}>알림이 없습니다</Text>
            <Text style={styles.emptyText2}>새로운 알림이 오면 여기에 표시됩니다.</Text>
          </Card>
        ) : (
          notifications.map((notification) => {
            const icon = getNotificationIcon(notification.type);
            const unread = isUnreadNotification(notification);

            return (
              <Pressable
                key={notification.id}
                onPress={handleOpenNotification(notification)}
                style={[styles.notiCard, unread && styles.unreadBorder]}
              >
                <Pressable onPress={handleToggleSelect(notification.id)}>
                  <FontAwesome5
                    name={selected.includes(notification.id) ? 'check-square' : 'square'}
                    size={18}
                    color={colors.primary[600]}
                  />
                </Pressable>

                <FontAwesome5 name={icon.name} size={20} color={icon.color} />

                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, unread && styles.unreadTitle]}>
                    {notification.title}
                  </Text>
                  <Text style={styles.content}>{notification.content}</Text>
                  <Text style={styles.time}>
                    {formatNotificationDate(notification.created_at)}
                  </Text>
                </View>

                <Pressable onPress={handleDeleteTarget(notification.id)}>
                  <FontAwesome5 name="trash" size={16} color={colors.error[600]} />
                </Pressable>
              </Pressable>
            );
          })
        )}
        </ScrollView>

        <Modal visible={!!deleteTarget} transparent>
          <View style={styles.modalBg}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>알림 삭제</Text>
              <Text style={{ marginBottom: tokens.spacing.md }}>이 알림을 삭제하시겠습니까?</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button style={styles.modalBtn} variant="outline" onPress={clearDeleteTarget}>
                  <Text>취소</Text>
                </Button>
                <Button
                  style={[styles.modalBtn, { backgroundColor: colors.error[600] }]}
                  onPress={confirmDelete}
                >
                  <Text style={{ color: 'white' }}>삭제</Text>
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        <AppToast
          toast={toast ? { tone: toast.tone, message: toast.message } : null}
          onClose={() => setToast(null)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.tabScreenSafeArea,
  root: { flex: 1 },
  container: base.container,
  center: base.stateCenter,
  centerText: { marginTop: tokens.spacing.xs2, color: colors.neutral[600] },

  filterBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterText: { fontWeight: tokens.fontWeight.bold, color: colors.neutral[700] },

  notiCard: {
    ...base.card,
    ...base.row,
    gap: tokens.spacing.sm2,
    padding: tokens.padding.baseLg,
    borderRadius: tokens.radius.baseLg,
    marginBottom: tokens.spacing.sm,
  },
  unreadBorder: { borderLeftWidth: 4, borderLeftColor: colors.emerald[500] },

  title: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[800],
  },
  unreadTitle: { color: colors.neutral[900], fontWeight: tokens.fontWeight.black },
  content: { fontSize: tokens.font.sm, color: colors.neutral[600], marginTop: tokens.spacing.xxs },
  time: { fontSize: tokens.font.xs, color: colors.neutral[400], marginTop: tokens.spacing.xxs },

  bulkRow: { ...base.row, gap: tokens.spacing.xs2, marginBottom: tokens.spacing.sm2 },
  bulkBtnBlue: {
    backgroundColor: colors.blue[100],
    padding: tokens.padding.base,
    borderRadius: tokens.radius.base,
  },
  bulkBtnRed: { backgroundColor: colors.red[100], padding: tokens.padding.base, borderRadius: tokens.radius.base },
  bulkText: { fontWeight: tokens.fontWeight.extrabold },

  emptyCard: { alignItems: 'center', padding: tokens.padding.xxl },
  emptyText: { marginTop: tokens.spacing.xs2, fontWeight: tokens.fontWeight.bold, color: colors.neutral[600] },
  emptyText2: {
    marginTop: tokens.spacing.xs2,
    fontWeight: tokens.fontWeight.regular,
    color: colors.neutral[600],
  },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    padding: tokens.padding.lg,
    borderRadius: tokens.radius.baseLg,
    width: '80%',
  },
  modalTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    marginBottom: tokens.spacing.sm,
  },

  modalBtn: {
    flex: 1,
    padding: tokens.padding.sm,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
  },

  errorCard: { alignItems: 'center', padding: tokens.padding.xxl },
  errorTitle: {
    marginTop: tokens.spacing.xs2,
    fontWeight: tokens.fontWeight.extrabold,
    color: colors.error[600],
  },
  filterCard: {
    marginBottom: tokens.spacing.sm2,
  },

  actionRow: { ...base.rowBetween, marginTop: tokens.spacing.sm },

  bulkRead: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.blue[100],
    borderWidth: 1,
    borderColor: colors.blue[300],
  },
  bulkDelete: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.red[100],
    borderWidth: 1,
    borderColor: colors.red[200],
  },
  bulkTextBlue: {
    color: colors.blue[700],
    fontWeight: tokens.fontWeight.extrabold,
    fontSize: tokens.font.sm,
  },
  bulkTextRed: {
    color: colors.red[700],
    fontWeight: tokens.fontWeight.extrabold,
    fontSize: tokens.font.sm,
  },

  markAllBtn: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.base,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  markAllText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[700],
  },

  selectAllRow: {
    ...base.row,
    gap: tokens.spacing.xs2,
    marginTop: tokens.spacing.sm2,
    paddingTop: tokens.padding.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  selectAllText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  filterBtn: {
    paddingHorizontal: tokens.padding.baseLg,
    marginRight: tokens.spacing.xs2,
    height: 40,
    borderWidth: 1,
    borderRadius: tokens.radius.sm,
    borderColor: colors.zinc[300],
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  hiddenPicker: base.hiddenPicker,
  arrow: {
    marginLeft: tokens.spacing.xs,
    fontSize: tokens.font.sm,
    color: colors.green[600],
  },
});
