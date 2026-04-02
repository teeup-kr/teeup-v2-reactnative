import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

export const toastMap = {
  club_registered: { tone: 'success', message: '클럽 등록 신청이 완료되었습니다.' },
};

const toneStyleMap = {
  success: 'toastSuccess',
  error: 'toastError',
  info: 'toastInfo',
};

export default function AppToast({
  toast,
  toastKey,
  autoHideMs = 2500,
  onClose,
}) {
  const resolvedToast = toastKey ? toastMap[toastKey] : toast;

  useEffect(() => {
    if (!resolvedToast) return undefined;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [resolvedToast, autoHideMs, onClose]);

  if (!resolvedToast) return null;
  const toneStyle = styles[toneStyleMap[resolvedToast.tone] || 'toastInfo'];

  return (
    <View style={[styles.toast, toneStyle]}>
      <Text style={styles.toastText}>{resolvedToast.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: tokens.padding.md,
    right: tokens.padding.md,
    bottom: tokens.spacing.lg2,
    paddingVertical: tokens.padding.sm,
    paddingHorizontal: tokens.padding.md,
    borderRadius: tokens.radius.md,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  toastSuccess: {
    backgroundColor: colors.emerald[600],
  },
  toastError: {
    backgroundColor: colors.red[600],
  },
  toastInfo: {
    backgroundColor: colors.blue[600],
  },
  toastText: {
    color: colors.white,
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    textAlign: 'center',
  },
});
