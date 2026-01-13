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
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: '600',
  },
  importantText: {
    marginLeft: 8,
    fontSize: 11,
    color: colors.error[600],
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    color: colors.neutral[400],
    marginBottom: 16,
  },
  content: {
    fontSize: 13,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});

export default styles;
