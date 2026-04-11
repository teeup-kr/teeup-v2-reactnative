import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useOptionalResponsiveMetrics } from '@/lib/layout/responsiveMetrics';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

function getScaledSizeStyle(size, uiScale, minTouch) {
  const u = uiScale > 0 ? uiScale : 1;
  const pad = (v) => Math.max(1, Math.round(v * u));
  let paddingVertical;
  let paddingHorizontal;
  switch (size) {
    case 'sm':
      paddingVertical = pad(tokens.padding.xs);
      paddingHorizontal = pad(tokens.padding.md);
      break;
    case 'md':
      paddingVertical = pad(tokens.padding.base);
      paddingHorizontal = pad(tokens.padding.lg2);
      break;
    case 'lg':
    default:
      paddingVertical = pad(tokens.padding.baseLg);
      paddingHorizontal = pad(tokens.padding.lg);
      break;
  }
  const minHeight = Math.max(minTouch, paddingVertical * 2 + Math.round(18 * u));
  return { paddingVertical, paddingHorizontal, minHeight };
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const metrics = useOptionalResponsiveMetrics();
  const uiScale = metrics?.uiScale ?? 1;
  const minTouch = metrics?.minTouchTarget ?? 44;
  const sizeStyle = useMemo(
    () => getScaledSizeStyle(size, uiScale, minTouch),
    [size, uiScale, minTouch],
  );
  const isDisabled = disabled || loading;
  const variantStyle = getVariantStyle(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={size === 'sm' ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined}
      style={(state) => [
        styles.buttonBase,
        sizeStyle,
        variantStyle.container,
        typeof style === 'function' ? style(state) : style,
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator color={variantStyle.loaderColor} />
        </View>
      ) : typeof children === 'string' ? (
        <Text style={[variantStyle.text, textStyle]}>{children}</Text>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </Pressable>
  );
}

function getVariantStyle(variant) {
  if (variant === 'outline') {
    return {
      container: styles.outline,
      text: styles.textOutline,
      loaderColor: colors.primary[600],
    };
  }
  if (variant === 'secondary') {
    return {
      container: styles.secondary,
      text: styles.textSecondary,
      loaderColor: colors.primary[600],
    };
  }
  return {
    container: styles.primary,
    text: styles.textPrimary,
    loaderColor: colors.white,
  };
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary[600],
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  secondary: {
    backgroundColor: colors.primary[50],
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  textPrimary: {
    color: colors.white,
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.semibold,
  },
  textOutline: {
    color: colors.neutral[700],
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.semibold,
  },
  textSecondary: {
    color: colors.primary[700],
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.semibold,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
