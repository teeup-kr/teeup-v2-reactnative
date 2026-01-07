import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

export default function AppFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.company}>티업링크</Text>
      <Text style={styles.meta}>© 2025 티업링크. All rights reserved.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  company: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  meta: {
    fontSize: 11,
    color: colors.neutral[500],
  },
});
