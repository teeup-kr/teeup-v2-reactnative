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
  subtitle: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 12,
  },
  noticeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  noticeCardPressed: {
    backgroundColor: colors.neutral[100],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.error[50],
  },
  importantText: {
    fontSize: 11,
    color: colors.error[600],
    marginLeft: 4,
    fontWeight: '600',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  noticeSummary: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 8,
  },
  noticeDate: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  infoCard: {
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  loadingCard: {
    marginBottom: 12,
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
