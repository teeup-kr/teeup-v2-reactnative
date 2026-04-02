import {
  Pressable,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';
export default function Modal({
  visible,
  title,
  children,
  onClose,
  footer,
  animationType = 'fade',
  containerStyle,
  backdropStyle,
  bodyStyle,
  scroll = true,
  closeOnBackdropPress = false,
}) {
  const content = (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onClose ? (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>x</Text>
          </Pressable>
        ) : null}
      </View>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.body, bodyStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.body, bodyStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      {closeOnBackdropPress ? (
        <Pressable style={[styles.backdrop, backdropStyle]} onPress={onClose}>
          <Pressable onPress={(event) => event.stopPropagation?.()}>
            {content}
          </Pressable>
        </Pressable>
      ) : (
        <View style={[styles.backdrop, backdropStyle]}>
          {content}
        </View>
      )}
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.padding.md,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 470,
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
