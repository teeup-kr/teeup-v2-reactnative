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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.white,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  participantName: {
    fontSize: 12,
    color: colors.neutral[800],
  },
  participantRole: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  emptyText: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  teamCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  teamTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  teamMember: {
    fontSize: 12,
    color: colors.neutral[700],
    marginBottom: 4,
  },
  stateRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});

export default styles;
