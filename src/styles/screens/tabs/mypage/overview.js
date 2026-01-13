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
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rowContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  infoSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: colors.neutral[500],
  },
  handicapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: colors.primary[700],
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  clubRowPressed: {
    backgroundColor: colors.primary[50],
  },
  clubIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  clubMeta: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 10,
    color: colors.primary[700],
    fontWeight: '600',
  },
});

export default styles;
