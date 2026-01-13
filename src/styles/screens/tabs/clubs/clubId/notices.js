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
  noticeCard: {
    paddingVertical: 4,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noticeInfo: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  noticeDate: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  noticeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.secondary[500],
  },
  noticeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
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
