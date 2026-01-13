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
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  meta: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  body: {
    fontSize: 12,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
  editButton: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  helperText: {
    marginTop: 8,
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});

export default styles;
