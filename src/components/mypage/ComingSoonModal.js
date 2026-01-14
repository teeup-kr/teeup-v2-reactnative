import { FontAwesome5 } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

export default function ComingSoonModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>준비중</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
            >
              <FontAwesome5 name="times" size={18} color={colors.neutral[500]} />
            </Pressable>
          </View>

          <View style={[styles.modalBody, { paddingBottom: tokens.padding.lg2 }]}>
            <View style={{ alignItems: 'center', marginBottom: tokens.spacing.sm2 }}>
              <FontAwesome5 name="golf-ball" size={40} color={colors.neutral[400]} />
            </View>
            <Text style={styles.comingSoonTitle}>이 기능은 현재 준비중입니다</Text>
            <Text style={styles.comingSoonSub}>
              상세 점수 입력 기능은 곧 제공될 예정입니다.
            </Text>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.fullPrimaryBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.fullPrimaryBtnText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: tokens.padding.baseLg,
    justifyContent: 'center',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg2,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  modalTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: colors.neutral[900],
  },
  iconBtn: {
    padding: tokens.padding.xs,
    borderRadius: tokens.radius.base,
  },
  modalBody: {
    padding: tokens.padding.md,
  },
  comingSoonTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  comingSoonSub: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.md2,
    fontWeight: tokens.fontWeight.semibold,
  },
  fullPrimaryBtn: {
    marginTop: tokens.spacing.xs,
    backgroundColor: colors.primary[600],
    borderRadius: tokens.radius.baseLg,
    paddingVertical: tokens.padding.sm,
    alignItems: 'center',
  },
  fullPrimaryBtnText: {
    color: colors.white,
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.black,
  },
};
