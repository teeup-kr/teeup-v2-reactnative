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
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 6,
  },
  summaryHint: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 6,
  },
  list: {
    marginBottom: 16,
  },
  expenseCard: {
    marginBottom: 12,
  },
  expenseLabel: {
    fontSize: 13,
    color: colors.neutral[600],
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 6,
  },
  stateRow: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});

export default styles;
