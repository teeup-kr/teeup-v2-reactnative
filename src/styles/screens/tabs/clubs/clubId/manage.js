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
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  sectionList: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 6,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  sectionHint: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
});

export default styles;
