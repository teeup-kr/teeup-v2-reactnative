import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { marginTop: 8, color: colors.neutral[600] },

  filterBtnActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterText: { fontWeight: '700', color: colors.neutral[700] },

  notiCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: 'white',
    marginBottom: 10,
    alignItems: 'center',
  },
  unreadBorder: { borderLeftWidth: 4, borderLeftColor: '#10b981' },

  title: { fontSize: 14, fontWeight: '700', color: colors.neutral[800] },
  unreadTitle: { color: colors.neutral[900], fontWeight: '900' },
  content: { fontSize: 12, color: colors.neutral[600], marginTop: 4 },
  time: { fontSize: 11, color: colors.neutral[400], marginTop: 4 },

  bulkRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  bulkBtnBlue: { backgroundColor: '#dbeafe', padding: 10, borderRadius: 10 },
  bulkBtnRed: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 10 },
  bulkText: { fontWeight: '800' },

  emptyCard: { alignItems: 'center', padding: 32 },
  emptyText: { marginTop: 8, fontWeight: '700', color: colors.neutral[600] },
  emptyText2: { marginTop: 8, fontWeight: '400', color: colors.neutral[600] },

  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 14,
    width: '80%',
  },
  modalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 10 },

  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
  },

  toast: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 12,
    borderRadius: 12,
  },
  toastSuccess: { backgroundColor: '#059669' },
  toastError: { backgroundColor: '#dc2626' },

  errorCard: { alignItems: 'center', padding: 32 },
  errorTitle: { marginTop: 8, fontWeight: '800', color: colors.error[600] },
  filterCard: {
    marginBottom: 12,
  },

  select: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    marginRight: 8,
  },
  selectText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  bulkRead: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  bulkDelete: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  bulkTextBlue: {
    color: '#1d4ed8',
    fontWeight: '800',
    fontSize: 12,
  },
  bulkTextRed: {
    color: '#b91c1c',
    fontWeight: '800',
    fontSize: 12,
  },

  markAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[700],
  },

  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  selectAllText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    backgroundColor: colors.white,
    marginRight: 8,
    overflow: 'hidden',
    minWidth: 160,
    height: 42,
    justifyContent: 'center',
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 2,
    minWidth: 160,
    justifyContent: 'center',
  },
  filterBtn: {
    paddingHorizontal: 14,
    marginRight: 8,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#d4d4d8',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  hiddenPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  arrow: {
    marginLeft: 6,
    fontSize: 12,
    color: '#16a34a',
  },
});

export default styles;
