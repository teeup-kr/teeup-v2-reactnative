import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

const gradientColors = ['#059669', '#0F766E'];

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

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={style}
    >
      {({ pressed }) => {
        const containerStyles = [
          styles.buttonBase,
          sizeStyle,
          variant === 'outline' && styles.outline,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
        ];

        const content = (
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator color={variant === 'outline' ? colors.primary[600] : colors.white} />
            ) : (
              children
            )}
          </View>
        );

        if (variant === 'primary') {
          return (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={containerStyles}
            >
              {typeof children === 'string' ? (
                <Text style={[styles.textPrimary, textStyle]}>{children}</Text>
              ) : (
                content
              )}
            </LinearGradient>
          );
        }

        return (
          <View style={containerStyles}>
            {typeof children === 'string' ? (
              <Text style={[styles.textOutline, textStyle]}>{children}</Text>
            ) : (
              content
            )}
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sizeMedium: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sizeLarge: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
  textPrimary: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  textOutline: {
    color: colors.neutral[700],
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
