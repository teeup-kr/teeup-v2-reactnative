import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    backgroundColor: colors.neutral[50],
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heroInner: {
    alignItems: 'center',
  },
  heroLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroLogo: {
    width: 36,
    height: 36,
  },
  heroBrand: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  heroHeadline: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 12,
  },
  heroSubcopy: {
    color: '#D1FAE5',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  heroChecklist: {
    alignItems: 'center',
  },
  heroChecklistText: {
    color: '#D1FAE5',
    fontSize: 12,
    marginBottom: 4,
  },
  contentSection: {
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  pageTitle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pageHeadline: {
    color: colors.neutral[900],
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  pageSubcopy: {
    color: colors.neutral[600],
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureList: {
    marginBottom: 12,
  },
  featureCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 18,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: colors.neutral[900],
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  featureDescription: {
    color: colors.neutral[600],
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginHint: {
    marginTop: 18,
    textAlign: 'center',
    color: colors.neutral[500],
    fontSize: 12,
  },
  loginHintAccent: {
    color: '#059669',
    fontWeight: '600',
  },
});

export default styles;
