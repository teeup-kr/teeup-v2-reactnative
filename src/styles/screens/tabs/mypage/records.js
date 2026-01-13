import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 28,
  },

  /* Center states */
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
  },
  centerText: {
    fontSize: 13,
    color: colors.neutral[600],
  },

  /* Stats */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  statCardSkeleton: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[200],
    height: 88,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statUnit: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  statsErrorCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
  },
  statsErrorText: {
    fontSize: 12,
    color: colors.error[700],
  },
  statsEmptyCard: {
    marginBottom: 12,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    paddingVertical: 18,
  },
  statsEmptyText: {
    fontSize: 13,
    color: colors.neutral[600],
    fontWeight: '600',
  },

  /* Filter row */
  filterRow: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: 6,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterBtnNormal: {
    backgroundColor: colors.white,
    borderColor: colors.neutral[300],
  },
  filterBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterBtnDangerActive: {
    backgroundColor: colors.error[600],
    borderColor: colors.error[600],
  },
  filterBtnSuccessActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterBtnTextNormal: {
    color: colors.neutral[700],
  },
  filterBtnTextActive: {
    color: colors.white,
  },

  /* Section headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.neutral[900],
    marginLeft: 6,
  },
  badgeRed: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.error[100],
  },
  badgeRedText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.error[700],
  },

  /* Meeting card */
  meetingBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colors.white,
  },
  meetingMissing: {
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
  },
  meetingCompleted: {
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  meetingClub: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 8,
  },
  meetingDatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  meetingDateText: {
    fontSize: 11,
    color: colors.neutral[500],
  },
  meetingDot: {
    fontSize: 11,
    color: colors.neutral[400],
  },

  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    fontWeight: '700',
    marginBottom: 3,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  handicapGreen: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },

  cardBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  outlineBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    color: colors.neutral[700],
    fontSize: 12,
    fontWeight: '800',
  },
  softPrimaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  softPrimaryBtnText: {
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: '800',
  },

  /* Empty */
  emptyCard: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 26,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: colors.neutral[600],
    fontWeight: '700',
    textAlign: 'center',
  },

  /* Pagination */
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },
  paginationText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '700',
  },

  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  stateText: {
    fontSize: 12,
    color: colors.neutral[600],
  },

  /* Error */
  errorCard: {
    margin: 16,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.white,
    paddingVertical: 22,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.error[700],
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
  },

  /* Modal common */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 14,
    justifyContent: 'center',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.neutral[900],
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
  },
  modalBody: {
    padding: 16,
  },

  handicapBox: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handicapLabel: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '700',
  },
  handicapValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.neutral[900],
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputNormal: {
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error[300],
    backgroundColor: colors.error[50],
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.error[700],
    fontWeight: '700',
  },

  previewBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary[700],
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary[900] ?? colors.primary[700],
  },
  previewHint: {
    marginTop: 8,
    fontSize: 11,
    color: colors.primary[700],
    lineHeight: 16,
    fontWeight: '600',
  },

  submitErrorBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.error[300],
    backgroundColor: colors.error[50],
    borderRadius: 12,
    padding: 10,
  },
  submitErrorText: {
    fontSize: 12,
    color: colors.error[700],
    fontWeight: '700',
  },

  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnOutline: {
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  modalBtnOutlineText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.neutral[700],
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary[600],
  },
  modalBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.white,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: 6,
  },
  comingSoonSub: {
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '600',
  },
  fullPrimaryBtn: {
    marginTop: 6,
    backgroundColor: colors.primary[600],
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fullPrimaryBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
});

export default styles;
