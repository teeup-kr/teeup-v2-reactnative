import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

const getSizeStyle = (size) => {
  switch (size) {
    case 'sm':
      return styles.sizeSmall;
    case 'md':
      return styles.sizeMedium;
    case 'lg':
    default:
      return styles.sizeLarge;
  }
};

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
  const isDisabled = disabled || loading;
  const sizeStyle = getSizeStyle(size);
  const variantStyle = getVariantStyle(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
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
  sizeSmall: {
    paddingVertical: tokens.padding.xs,
    paddingHorizontal: tokens.padding.md,
  },
  sizeMedium: {
    paddingVertical: tokens.padding.base,
    paddingHorizontal: tokens.padding.lg2,
  },
  sizeLarge: {
    paddingVertical: tokens.padding.baseLg,
    paddingHorizontal: tokens.padding.lg,
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
