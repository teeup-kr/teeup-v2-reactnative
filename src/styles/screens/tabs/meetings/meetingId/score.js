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
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: colors.neutral[700],
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
    color: colors.neutral[900],
  },
  stateRow: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});

export default styles;
