import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

export default function AppFooter() {
  if (Platform.OS !== 'web') {
    return null;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.meta}>© 티업링크. All rights reserved.</Text>
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
