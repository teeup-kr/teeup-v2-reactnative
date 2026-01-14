import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/styles/style';
import { colors } from '@/theme/colors';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const formatDatetime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ko-KR');
};

export default function SocialJoinModal({
  isOpen,
  visible,
  onClose,
  meeting,
  userInfo,
  setUserInfo,
  userInfoLoading,
  isEditingUserInfo,
  onEditUserInfo,
  onUpdateUserInfo,
  onJoin,
  processingAction,
}) {
  const isVisible = visible ?? isOpen;
  if (!isVisible) return null;

  const handleEditToggle = () => {
    onEditUserInfo(!isEditingUserInfo);
  };

  return (
    <Modal
      visible={isVisible}
      title="소셜 모임 참가 신청"
      onClose={onClose}
      footer={(
        <View style={styles.footerRow}>
          <Button variant="outline" size="sm" style={styles.footerButton} onPress={onClose}>
            닫기
          </Button>
          <Button size="sm" style={styles.footerButton} onPress={onJoin} loading={processingAction}>
            참가 신청
          </Button>
        </View>
      )}
    >
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>모임 정보</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>클럽</Text>
          <Text style={styles.infoValue}>{meeting?.club_name || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>모임명</Text>
          <Text style={styles.infoValue}>{meeting?.name || meeting?.meeting_name || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>일시</Text>
          <Text style={styles.infoValue}>{formatDatetime(meeting?.meeting_time)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>장소</Text>
          <Text style={styles.infoValue}>{meeting?.location || meeting?.venue_name || '-'}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <FontAwesome5 name="user-edit" size={14} color={colors.neutral[600]} />
          <Text style={styles.sectionTitle}>내 참가 정보</Text>
        </View>
        <Button size="sm" variant="outline" onPress={handleEditToggle}>
          {isEditingUserInfo ? '취소' : '정보 수정'}
        </Button>
      </View>

      {isEditingUserInfo ? (
        <>
          <Input
            label="실명"
            value={userInfo?.realname || ''}
            onChangeText={(value) => setUserInfo((prev) => ({ ...prev, realname: value }))}
            placeholder="실명을 입력하세요"
          />
          <Input
            label="전화번호"
            value={userInfo?.phone_number || ''}
            onChangeText={(value) => setUserInfo((prev) => ({ ...prev, phone_number: value }))}
            placeholder="01012345678"
            keyboardType="number-pad"
          />
          <Input
            label="생년월일"
            value={userInfo?.birthdate || ''}
            onChangeText={(value) => setUserInfo((prev) => ({ ...prev, birthdate: value }))}
            placeholder="YYYY-MM-DD"
          />
          <Button size="sm" onPress={onUpdateUserInfo} loading={processingAction}>
            정보 저장
          </Button>
        </>
      ) : (
        <View style={styles.readonlyCard}>
          <Text style={styles.readonlyText}>실명: {userInfoLoading ? '불러오는 중...' : userInfo?.realname || '미등록'}</Text>
          <Text style={styles.readonlyText}>전화번호: {userInfoLoading ? '-' : userInfo?.phone_number || '미등록'}</Text>
          <Text style={styles.readonlyText}>생년월일: {userInfoLoading ? '-' : userInfo?.birthdate || '미등록'}</Text>
          <Text style={styles.readonlyText}>성별: {userInfo?.gender === 'MALE' ? '남성' : userInfo?.gender === 'FEMALE' ? '여성' : '미등록'}</Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: colors.primary[50],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  infoTitle: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.bold,
    color: colors.primary[700],
    marginBottom: tokens.spacing.xs2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  infoLabel: {
    fontSize: tokens.font.xs,
    color: colors.primary[500],
  },
  infoValue: {
    fontSize: tokens.font.sm,
    color: colors.primary[800],
    fontWeight: tokens.fontWeight.semibold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  readonlyCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  readonlyText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    marginBottom: tokens.spacing.xxs,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});
