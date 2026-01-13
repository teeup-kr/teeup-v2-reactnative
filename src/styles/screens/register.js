import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 48,
    height: 48,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  required: {
    color: colors.error[500],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  inlineField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineButton: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.primary[600],
    borderRadius: 10,
  },
  inlineButtonDisabled: {
    opacity: 0.5,
  },
  inlineButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.error[600],
  },
  successText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.success[600],
  },
  passwordChecks: {
    marginTop: 8,
  },
  checkItem: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  checkItemSuccess: {
    color: colors.success[600],
  },
  termsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 16,
    marginTop: 8,
  },
  termsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 10,
  },
  termsList: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 12,
    color: colors.neutral[700],
    marginRight: 6,
  },
  termsLink: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 12,
  },
  loginRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  loginLink: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default styles;
