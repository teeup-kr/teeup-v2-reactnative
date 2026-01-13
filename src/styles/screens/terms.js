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
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    marginRight: 8,
    marginBottom: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabButtonPressed: {
    opacity: 0.9,
  },
  tabButtonText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  card: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  contentBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: 12,
  },
  contentText: {
    fontSize: 12,
    color: colors.neutral[700],
    lineHeight: 18,
    marginBottom: 8,
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
