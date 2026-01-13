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
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  summaryHint: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  list: {
    marginBottom: 16,
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
  feeCard: {
    marginBottom: 12,
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 6,
  },
  feeStatus: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
  },
});

export default styles;
