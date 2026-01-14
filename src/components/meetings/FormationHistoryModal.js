import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/styles/style';
import { colors } from '@/theme/colors';

import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function FormationHistoryModal({
  isOpen,
  visible,
  onClose,
  history = [],
  onRestore,
  onViewDetail,
  processing,
}) {
  const isVisible = visible ?? isOpen;
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      title="편성 히스토리"
      onClose={onClose}
      footer={(
        <Button size="sm" onPress={onClose} disabled={processing}>
          닫기
        </Button>
      )}
    >
      <ScrollView style={styles.list}>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>저장된 편성 히스토리가 없습니다.</Text>
        ) : (
          history.map((item, index) => (
            <View key={item.id || index} style={styles.historyCard}>
              <Text style={styles.historyTitle}>{item.title || `편성 ${index + 1}`}</Text>
              <Text style={styles.historyMeta}>{item.created_at || item.createdAt || '-'}</Text>
              <View style={styles.actionRow}>
                {onViewDetail ? (
                  <Button size="sm" variant="outline" onPress={() => onViewDetail(item)}>
                    상세 보기
                  </Button>
                ) : null}
                {onRestore ? (
                  <Button size="sm" onPress={() => onRestore(item)}>
                    복원
                  </Button>
                ) : null}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 320,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.sm,
    backgroundColor: colors.neutral[50],
  },
  historyTitle: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  historyMeta: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xxs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: tokens.spacing.sm,
  },
  emptyText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});
