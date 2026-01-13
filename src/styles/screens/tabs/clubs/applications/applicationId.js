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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: 12,
    color: colors.neutral[800],
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 12,
    color: colors.neutral[600],
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
});

export default styles;
