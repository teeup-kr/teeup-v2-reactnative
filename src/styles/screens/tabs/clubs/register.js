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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldGroupRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
    marginRight: 12,
  },
  halfFieldLast: {
    marginRight: 0,
  },
  label: {
    fontSize: 12,
    color: colors.neutral[700],
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.neutral[200],
  },
  toggleActive: {
    backgroundColor: colors.primary[600],
  },
  toggleText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
  },
  uploadTextWrap: {
    marginLeft: 12,
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  uploadSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  noticeText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 8,
  },
});

export default styles;
