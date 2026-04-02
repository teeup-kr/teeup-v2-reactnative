import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/styles/style';

export default function FormField({ label, children }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.sm2,
  },
  label: {
    marginBottom: tokens.spacing.xs,
    fontWeight: tokens.fontWeight.semibold,
  },
});
