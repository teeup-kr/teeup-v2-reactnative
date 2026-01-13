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
  filterCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.white,
  },

  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 12,
    color: colors.neutral[700],
  },

  resetButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  resetButtonText: {
    fontSize: 12,
    color: colors.neutral[700],
    fontWeight: '600',
  },

  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  stateText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[800],
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
  },

  meetingCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },

  cardSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 6,
  },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.neutral[600],
  },

  detailButton: {
    marginTop: 12,
    backgroundColor: colors.primary[600],
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 12,
    color: colors.neutral[700],
  },
  paginationText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
});

export default styles;
