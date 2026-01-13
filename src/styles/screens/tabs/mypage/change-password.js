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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: colors.success[600],
    marginTop: 4,
  },
  saveButton: {
    marginTop: 8,
  },
});

export default styles;
