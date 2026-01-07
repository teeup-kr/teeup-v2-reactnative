import { FontAwesome5 } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function RoundingCompleteModal({
  isOpen,
  visible,
  onClose,
  onInputNow,
  onInputLater,
}) {
  const isVisible = visible ?? isOpen;
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      title="라운딩 종료"
      onClose={onClose}
      footer={(
        <View style={styles.footerRow}>
          <Button size="sm" style={styles.footerButton} onPress={() => {
            if (onInputNow) onInputNow();
            onClose();
          }}>
            지금 입력하기
          </Button>
          <Button size="sm" variant="outline" style={styles.footerButton} onPress={() => {
            if (onInputLater) onInputLater();
            onClose();
          }}>
            나중에 입력하기
          </Button>
        </View>
      )}
    >
      <View style={styles.body}>
        <FontAwesome5 name="flag-checkered" size={26} color={colors.primary[600]} />
        <Text style={styles.text}>라운딩을 종료하시겠습니까?</Text>
        <Text style={styles.subText}>점수 입력은 지금 하거나 나중에 마이페이지에서 할 수 있습니다.</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
  },
  subText: {
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
