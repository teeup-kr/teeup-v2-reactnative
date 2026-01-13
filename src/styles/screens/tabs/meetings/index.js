import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBlock: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noClubState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  noClubTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  noClubSubtitle: {
    marginTop: 10,
    marginBottom: 16,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createButtonPressed: {
    opacity: 0.9,
  },
  createButtonRounding: {
    backgroundColor: colors.primary[600],
  },
  createButtonSocial: {
    backgroundColor: colors.accent[600],
  },
  createButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    marginBottom: 16,
  },
  tabBarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginRight: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  tabTextActive: {
    color: colors.primary[600],
  },
  filtersBlock: {
    gap: 12,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: colors.white,
  },
  dateInputText: {
    fontSize: 12,
    color: colors.neutral[900],
    fontWeight: '600',
  },
  dateInputPlaceholder: {
    color: colors.neutral[400],
    fontWeight: '500',
  },
  dateDivider: {
    color: colors.neutral[500],
    fontSize: 12,
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  resetButtonText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.neutral[900],
  },
  searchButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
  },
  searchButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  statusButtonActive: {
    backgroundColor: colors.primary[600],
  },
  statusButtonInactive: {
    backgroundColor: colors.neutral[100],
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  statusDivider: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptySubtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  emptyCreateButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyCreateButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  cardList: {
    marginTop: 4,
  },
  cardPressable: {
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.96,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  cardTitleArea: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.neutral[500],
  },
  cardBadgeRow: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 12,
  },
  metaList: {
    gap: 6,
    marginBottom: 12,
  },
  extraList: {
    gap: 6,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  golfEmoji: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutral[600],
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 11,
    color: colors.neutral[400],
  },
  cardLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[600],
  },
  paginationRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  pageNavButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
  },
  pageNavButtonDisabled: {
    opacity: 0.5,
  },
  pageNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  pageNumbersRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  pageNumberActive: {
    backgroundColor: colors.primary[600],
  },
  pageNumberInactive: {
    backgroundColor: colors.neutral[100],
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  pageNumberTextActive: {
    color: colors.white,
  },
});

export default styles;
