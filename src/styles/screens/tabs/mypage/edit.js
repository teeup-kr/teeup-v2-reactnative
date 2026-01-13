import { StyleSheet } from 'react-native';

const PRIMARY_600 = '#16a34a';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { padding: 16, paddingBottom: 24 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },

  stackLg: { gap: 18 },
  stackSm: { gap: 8 },
  rowGap: { flexDirection: 'row', gap: 8 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelIcon: { marginRight: 8, color: '#374151' },
  required: { color: '#EF4444' },

  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  inputLike: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  inputLikeText: { fontSize: 15, color: '#111827' },
  inputPressed: { opacity: 0.9 },

  inputNormal: { borderColor: '#D1D5DB' },
  inputError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },

  readonlyBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  readonlyText: { color: '#374151', fontSize: 15 },

  helperText: { marginTop: 6, fontSize: 12, color: '#6B7280' },
  loadingText: { color: '#6B7280' },

  errorText: { marginTop: 6, color: '#DC2626', fontSize: 13 },
  successText: { marginTop: 6, color: '#16A34A', fontSize: 13 },

  primaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PRIMARY_600,
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  grayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },
  grayBtnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
  },

  btnDisabled: { opacity: 0.5 },
  btnPressed: { transform: [{ scale: 0.98 }] },

  infoBox: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    padding: 12,
  },
  infoTitle: { fontWeight: '800', color: '#166534' },
  infoSub: { fontSize: 11, color: '#16A34A', marginTop: 4 },

  autoBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    padding: 12,
  },
  autoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  autoTitle: { fontWeight: '800', color: '#14532D' },
  autoSub: { fontSize: 11, color: '#15803D' },
  autoHint: { fontSize: 11, color: '#16A34A', marginTop: 4 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: PRIMARY_600,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  footer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  saveBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PRIMARY_600,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  toast: {
    position: 'absolute',
    top: 24,
    right: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    elevation: 8,
  },
  toastError: { backgroundColor: '#DC2626' },
  toastInfo: { backgroundColor: '#2563EB' },
  toastSuccess: { backgroundColor: '#16A34A' },
  toastText: { color: '#fff', fontWeight: '800' },
});

export default styles;
