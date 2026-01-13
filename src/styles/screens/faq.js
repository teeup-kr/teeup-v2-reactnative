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
  subtitle: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 12,
  },
  card: {
    marginBottom: 12,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  answerText: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: 12,
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});

export default styles;
