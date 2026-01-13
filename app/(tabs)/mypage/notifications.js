import {
FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useCallback,
useEffect,
useState } from 'react';
import {
  ActivityIndicator,
Alert,
Modal,
Pressable,
ScrollView,
Text,
View,
} from 'react-native';

import Card from '@/components/ui/Card';
import { notificationsApi } from '@/lib/api';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/tabs/mypage/notifications';

/* ------------------ Utils ------------------ */

const pickData = (resp) => (resp?.data !== undefined ? resp.data : resp);

const formatDate = (dateString) => {
  try {
    if (!dateString) return '날짜 정보 없음';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '날짜 정보 없음';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '날짜 정보 없음';
  }
};

const isUnread = (n) => n.status === 'UNREAD' || !n.read_at;

const getIcon = (type) => {
  switch (type) {
    case 'CLUB_MEMBERSHIP_APPROVED':
    case 'CLUB_MEMBERSHIP_REJECTED':
    case 'CLUB_MEMBERSHIP_REQUEST':
    case 'CLUB_INVITATION':
      return { name: 'users', color: '#2563eb' };
    case 'MEETING_REMINDER':
    case 'MEETING_CANCELLATION':
    case 'MEETING_COMPLETED':
    case 'TEAM_FORMATION_COMPLETED':
      return { name: 'calendar-alt', color: '#059669' };
    case 'NEW_NOTICE':
      return { name: 'file-alt', color: '#ca8a04' };
    case 'MEETING_SETTLEMENT_COMPLETED':
    case 'SOCIAL_SETTLEMENT_COMPLETED':
      return { name: 'money-bill-wave', color: '#7c3aed' };
    default:
      return { name: 'bell', color: colors.neutral[600] };
  }
};

/* ------------------ Screen ------------------ */

export default function NotificationsTab() {
  const router = useRouter();

  const [filter, setFilter] = useState('all'); // all | unread | read
  const [typeFilter, setTypeFilter] = useState('all');

  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  /* ---------- Load ---------- */

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { filter };
      if (typeFilter !== 'all') params.type_filter = typeFilter;

      const resp = await notificationsApi.getNotifications(params);
      setNotifications(pickData(resp) || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- Actions ---------- */

  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, status: 'READ', read_at: new Date().toISOString() } : n
        )
      );
    } catch {
      Alert.alert('오류', '읽음 처리에 실패했습니다.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ', read_at: n.read_at || now }))
      );
      setToast({ tone: 'success', msg: '모든 알림이 읽음 처리되었습니다.' });
    } catch {
      Alert.alert('오류', '처리에 실패했습니다.');
    }
  };
  const typeFilterLabelMap = {
    all: '전체 타입',
    CLUB_MEMBERSHIP_APPROVED: '클럽 가입 승인',
    CLUB_MEMBERSHIP_REJECTED: '클럽 가입 거절',
    CLUB_MEMBERSHIP_REQUEST: '가입 신청',
    MEETING_REMINDER: '모임 알림',
    TEAM_FORMATION_COMPLETED: '팀 편성 완료',
    NEW_NOTICE: '공지사항',
    MEETING_SETTLEMENT_COMPLETED: '정산 완료',
    SOCIAL_SETTLEMENT_COMPLETED: '소셜 정산 완료',
  };
  const deleteOne = async (id) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setToast({ tone: 'success', msg: '알림이 삭제되었습니다.' });
    } catch {
      Alert.alert('오류', '삭제에 실패했습니다.');
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selected.length === notifications.length) setSelected([]);
    else setSelected(notifications.map((n) => n.id));
  };

  const bulkRead = async () => {
    for (const id of selected) await markAsRead(id);
    setSelected([]);
  };

  const bulkDelete = async () => {
    for (const id of selected) await deleteOne(id);
    setSelected([]);
  };

  const openNotification = async (n) => {
    if (isUnread(n)) await markAsRead(n.id);

    if (!n.related_entity_type || !n.related_entity_id) return;

    if (n.related_entity_type === 'CLUB' || n.related_entity_type === 'CLUB_MEMBERSHIP') {
      router.push(`/clubs/${n.related_entity_id}`);
    }
    if (n.related_entity_type === 'CLUB_NOTICE' && n.extra_data?.club_id) {
      router.push(`/clubs/${n.extra_data.club_id}/notices`);
    }
  };

  /* ---------- Render ---------- */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.centerText}>알림을 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Card style={styles.errorCard}>
        <FontAwesome5 name="times" size={36} color={colors.error[600]} />
        <Text style={styles.errorTitle}>알림을 불러올 수 없습니다</Text>
      </Card>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/*Filter & Actions Card*/}
        <Card style={styles.filterCard}>
          {/* 필터 영역 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {/* 타입 필터 */}
            <View style={styles.filterBtn}>
              <Text style={styles.filterText}>
                {typeFilterLabelMap[typeFilter]}
              </Text>
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

            {/* 상태 필터 */}
            {['all', 'unread', 'read'].map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterBtn,
                  filter === f && styles.filterBtnActive,
                  f === 'unread' && filter === f && { backgroundColor: '#dc2626' },
                  f === 'read' && filter === f && { backgroundColor: '#059669' },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f && { color: 'white' },
                  ]}
                >
                  {f === 'all' ? '전체' : f === 'unread' ? '읽지 않음' : '읽음'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* 액션 버튼 */}
          <View style={styles.actionRow}>
            {selected.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={styles.bulkRead} onPress={bulkRead}>
                  <Text style={styles.bulkTextBlue}>읽음 처리</Text>
                </Pressable>
                <Pressable style={styles.bulkDelete} onPress={bulkDelete}>
                  <Text style={styles.bulkTextRed}>삭제</Text>
                </Pressable>
              </View>
            )}

            <Pressable style={styles.markAllBtn} onPress={markAllAsRead}>
              <Text style={styles.markAllText}>전체 읽음</Text>
            </Pressable>
          </View>

          {/* 전체 선택 */}
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

        {/* Bulk */}
        {selected.length > 0 && (
          <View style={styles.bulkRow}>
            <Pressable style={styles.bulkBtnBlue} onPress={bulkRead}>
              <Text style={styles.bulkText}>읽음 처리</Text>
            </Pressable>
            <Pressable style={styles.bulkBtnRed} onPress={bulkDelete}>
              <Text style={styles.bulkText}>삭제</Text>
            </Pressable>
          </View>
        )}

        {/* List */}
        {notifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="bell" size={32} color={colors.neutral[400]} />
            <Text style={styles.emptyText}>알림이 없습니다</Text>
            <Text style={styles.emptyText2}>새로운 알림이 오면 여기에 표시됩니다.</Text>
          </Card>
        ) : (
          notifications.map((n) => {
            const icon = getIcon(n.type);
            const unread = isUnread(n);

            return (
              <Pressable
                key={n.id}
                onPress={() => openNotification(n)}
                style={[
                  styles.notiCard,
                  unread && styles.unreadBorder,
                ]}
              >
                <Pressable onPress={() => toggleSelect(n.id)}>
                  <FontAwesome5
                    name={selected.includes(n.id) ? 'check-square' : 'square'}
                    size={18}
                    color={colors.primary[600]}
                  />
                </Pressable>

                <FontAwesome5 name={icon.name} size={20} color={icon.color} />

                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, unread && styles.unreadTitle]}>{n.title}</Text>
                  <Text style={styles.content}>{n.content}</Text>
                  <Text style={styles.time}>{formatDate(n.created_at)}</Text>
                </View>

                <Pressable onPress={() => setDeleteTarget(n.id)}>
                  <FontAwesome5 name="trash" size={16} color={colors.error[600]} />
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Delete Modal */}
      <Modal visible={!!deleteTarget} transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>알림 삭제</Text>
            <Text style={{ marginBottom: 16 }}>이 알림을 삭제하시겠습니까?</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable style={styles.modalBtn} onPress={() => setDeleteTarget(null)}>
                <Text>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.error[600] }]}
                onPress={() => {
                  deleteOne(deleteTarget);
                  setDeleteTarget(null);
                }}
              >
                <Text style={{ color: 'white' }}>삭제</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, toast.tone === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={{ color: 'white', fontWeight: '800' }}>{toast.msg}</Text>
        </View>
      )}
    </View>
  );
}

/* ------------------ Styles ------------------ */

