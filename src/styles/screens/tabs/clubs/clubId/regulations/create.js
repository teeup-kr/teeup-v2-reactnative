import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: colors.neutral[700],
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.neutral[900],
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
});

export default styles;
