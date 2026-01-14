import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/styles/style';
import { colors } from '@/theme/colors';
export default function AppFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.meta}>© 2025 티업링크. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.md,
    alignItems: 'center'
  },
  meta: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
});
