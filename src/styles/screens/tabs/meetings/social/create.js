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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.neutral[600],
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
  label: {
    fontSize: 12,
    color: colors.neutral[700],
    marginBottom: 6,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: colors.neutral[500],
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
    marginBottom: 12,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.error[600],
  },
});

export default styles;
