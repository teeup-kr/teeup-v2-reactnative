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
  listCard: {
    paddingVertical: 4,
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
  itemRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  itemInfo: {
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  itemDetail: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  itemDate: {
    fontSize: 11,
    color: colors.neutral[400],
  },
});

export default styles;
