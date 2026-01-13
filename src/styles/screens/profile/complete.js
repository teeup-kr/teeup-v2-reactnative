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
  hero: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#D1FAE5',
    lineHeight: 18,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  tipBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
  },
  tipText: {
    fontSize: 12,
    color: colors.primary[700],
  },
  saveButton: {
    marginTop: 8,
  },
});

export default styles;
