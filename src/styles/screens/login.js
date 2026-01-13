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
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.neutral[600],
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 16,
  },
  generalError: {
    textAlign: 'center',
    color: colors.error[600],
    fontSize: 12,
    marginBottom: 12,
  },
  buttonSpacing: {
    marginTop: 4,
  },
  helperRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  helperLink: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 6,
  },
  dividerRow: {
    marginVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: colors.neutral[500],
  },
  iconGap: {
    marginRight: 8,
  },
  outlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  registerRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  registerLink: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default styles;
