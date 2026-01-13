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
  heroCard: {
    marginBottom: 16,
  },
  clubName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  clubSubtitle: {
    fontSize: 13,
    color: colors.neutral[600],
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutral[600],
    marginLeft: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    marginRight: 8,
  },
  badgeAccent: {
    backgroundColor: colors.success[50],
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: '600',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.neutral[500],
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: 12,
    color: colors.neutral[800],
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});

export default styles;
