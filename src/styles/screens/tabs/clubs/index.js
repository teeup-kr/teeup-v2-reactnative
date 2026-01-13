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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
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
  searchFilterRow: {
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.neutral[900],
  },
  statusFilterWrap: {
    position: 'relative',
    zIndex: 10,
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  statusFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  statusFilterMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  statusFilterMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  statusFilterMenuText: {
    fontSize: 13,
    color: colors.neutral[700],
    fontWeight: '600',
  },
  myStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  myStatusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
  },
  myStatusButtonActive: {
    backgroundColor: colors.primary[600],
  },
  myStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  myStatusTextActive: {
    color: colors.white,
  },
  loadingRow: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  errorCard: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: colors.error[700],
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  emptySubtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  cardList: {
    marginTop: 16,
  },
  cardPressable: {
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.95,
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoImage: {
    width: 22,
    height: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.neutral[900],
    flex: 1,
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  roleBadge: {
    paddingHorizontal: 8,
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
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontWeight: '600',
    color: colors.primary[600],
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  pageNavButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pageNavButtonDisabled: {
    opacity: 0.4,
  },
  pageNavText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  pageNumber: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pageNumberActive: {
    backgroundColor: colors.primary[600],
  },
  pageNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[500],
  },
  pageNumberTextActive: {
    color: colors.white,
  },
});

export default styles;
