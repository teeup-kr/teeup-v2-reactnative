import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

export default function AppFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.meta}>© 티업링크. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.md,
    alignItems: 'center'
  },
  meta: {
    fontSize: tokens.font.xs,
    color: colors.emerald[100],
  },
});
