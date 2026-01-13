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
  warningCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    marginBottom: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.error[700],
  },
  warningText: {
    fontSize: 12,
    color: colors.error[700],
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.error[600],
    borderColor: colors.error[600],
  },
  agreeText: {
    fontSize: 12,
    color: colors.neutral[700],
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
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
  inputError: {
    borderColor: colors.error[500],
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.error[600],
  },
  successText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.success[600],
    textAlign: 'center',
  },
  withdrawButton: {
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
  },
  modalButtonSpacing: {
    marginRight: 8,
  },
  modalText: {
    fontSize: 13,
    color: colors.neutral[700],
    marginBottom: 8,
  },
});

export default styles;
