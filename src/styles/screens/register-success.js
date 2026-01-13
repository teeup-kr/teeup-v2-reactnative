import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 18,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: colors.primary[600],
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default styles;
