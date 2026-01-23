import { StyleSheet, View, Platform } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';
export default function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    padding: tokens.padding.xl,
    // Web에서는 boxShadow 사용, 네이티브에서는 shadow* 속성 사용
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 8px 12px rgba(0, 0, 0, 0.08)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
        }),
  },
});
