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
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginTop: 6,
  },
  list: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 4,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  date: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  status: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '600',
  },
});

export default styles;
