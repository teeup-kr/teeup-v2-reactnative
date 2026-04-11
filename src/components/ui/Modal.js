import { useMemo } from 'react';
import {
  Pressable,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getContentMaxWidth } from '@/lib/layout/responsiveLayout';
import { useResponsiveMetrics } from '@/lib/layout/responsiveMetrics';
import { fontTitle } from '@/lib/layout/responsiveTokenHelpers';
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
  /** 모달 카드 가로 최대값(선호). 화면 폭에 맞춰 더 좁아질 수 있습니다. */
  maxContentWidth,
  /** safe-area 반영 콘텐츠 높이 기준 vh% → px (기본 80). */
  maxContentHeightVh = 80,
}) {
  const metrics = useResponsiveMetrics();
  const preferred = maxContentWidth ?? tokens.layout.contentMaxPreferred;
  const effectivePreferred = useMemo(() => {
    if (metrics.isTablet) return Math.min(preferred, metrics.maxContentWidth);
    return preferred;
  }, [metrics.isTablet, metrics.maxContentWidth, preferred]);

  const resolvedMaxWidth = useMemo(
    () => getContentMaxWidth(metrics.width, effectivePreferred, 32),
    [metrics.width, effectivePreferred],
  );

  const maxModalHeight = useMemo(
    () => metrics.contentVh(maxContentHeightVh),
    [maxContentHeightVh, metrics],
  );

  const content = (
    <View
      style={[
        styles.container,
        containerStyle,
        { maxWidth: resolvedMaxWidth, maxHeight: maxModalHeight },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: fontTitle('title', metrics.fontScaleWeak) }]}>{title}</Text>
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
    width: '100%',
    alignSelf: 'center',
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
