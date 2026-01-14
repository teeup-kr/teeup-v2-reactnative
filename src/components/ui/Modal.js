import {
  Pressable,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { tokens } from '@/styles/style';

import { colors } from '../../theme/colors';

export default function Modal({
  visible,
  title,
  children,
  onClose,
  footer,
}) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>x</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: tokens.padding.md,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  closeButton: {
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.xxs,
  },
  closeText: {
    fontSize: tokens.font.xxl,
    color: colors.neutral[500],
  },
  body: {
    padding: tokens.padding.md,
  },
  footer: {
    padding: tokens.padding.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
});
