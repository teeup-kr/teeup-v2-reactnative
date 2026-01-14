
import {
  LinearGradient
} from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import { homeFeatures } from '@/constants/homeConstants';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';
const FeatureCard = ({ title, description, emoji, background, accent }) => {
  return (
    <View style={[styles.featureCard, { backgroundColor: background }]}>
      <View style={[styles.featureIcon, { backgroundColor: accent }]}>
        <Text style={styles.featureEmoji}>{emoji}</Text>
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const heroGradient = [colors.emerald[600], colors.teal[700]];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroInner}>
            <View style={styles.heroLogoWrap}>
              <Image
                source={require('../../public/icons/icon-512-transparent.png')}
                style={styles.heroLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.heroBrand}>티업링크</Text>
            <Text style={styles.heroHeadline}>
              골프 모임 관리의{'\n'}새로운 경험을 시작하세요
            </Text>
            <Text style={styles.heroSubcopy}>
              자동 조편성부터 정산까지{'\n'}모든 것을 한 곳에서 관리하세요
            </Text>
            <View style={styles.heroChecklist}>
              <Text style={styles.heroChecklistText}>✓ 5분 만에 모임 만들기</Text>
              <Text style={styles.heroChecklistText}>✓ 편리한 구성원 관리</Text>
              <Text style={styles.heroChecklistText}>✓ 간편한 클럽 관리</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentSection}>
          <View style={styles.pageTitle}>
            <Text style={styles.pageHeadline}>티업링크에 오신 것을 환영합니다</Text>
            <Text style={styles.pageSubcopy}>
              골프 모임 관리의 모든 것을{'\n'}간편하게 해결해드립니다
            </Text>
          </View>

          <View style={styles.featureList}>
            {homeFeatures.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                emoji={feature.emoji}
                background={feature.background}
                accent={feature.accent}
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={() => {
              const target = isAuthenticated ? '/clubs' : '/login';
              router.push(target);
            }}
          >
            <LinearGradient
              colors={heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>지금 시작하기</Text>
            </LinearGradient>
          </Pressable>

          {!isAuthenticated && (
            <Text style={styles.loginHint}>
              이미 계정이 있으신가요? <Text style={styles.loginHintAccent}>로그인</Text>하세요
            </Text>
          )}
        </View>
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaWhite,
  container: {
    backgroundColor: colors.neutral[50],
  },
  heroSection: {
    paddingHorizontal: tokens.padding.xl,
    paddingVertical: tokens.padding.xxl,
  },
  heroInner: {
    alignItems: 'center',
  },
  heroLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: tokens.radius.xxl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  heroLogo: {
    width: 36,
    height: 36,
  },
  heroBrand: {
    color: colors.white,
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.bold,
    marginBottom: tokens.spacing.sm2,
  },
  heroHeadline: {
    color: colors.white,
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: tokens.spacing.sm2,
  },
  heroSubcopy: {
    color: colors.emerald[100],
    fontSize: tokens.font.base,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: tokens.spacing.md,
  },
  heroChecklist: {
    alignItems: 'center',
  },
  heroChecklistText: {
    color: colors.emerald[100],
    fontSize: tokens.font.sm,
    marginBottom: tokens.spacing.xxs,
  },
  contentSection: {
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.xl,
    paddingVertical: tokens.padding.xl2,
  },
  pageTitle: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg2,
  },
  pageHeadline: {
    color: colors.neutral[900],
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.bold,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs2,
  },
  pageSubcopy: {
    color: colors.neutral[600],
    fontSize: tokens.font.base,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureList: {
    marginBottom: tokens.spacing.sm2,
  },
  featureCard: {
    borderRadius: tokens.radius.md,
    padding: tokens.padding.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm2,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  featureEmoji: {
    fontSize: tokens.font.xl,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: colors.neutral[900],
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.semibold,
    marginBottom: tokens.spacing.xs,
  },
  featureDescription: {
    color: colors.neutral[600],
    fontSize: tokens.font.sm,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: tokens.radius.md,
    overflow: 'hidden',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonGradient: {
    paddingVertical: tokens.padding.baseLg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.semibold,
  },
  loginHint: {
    marginTop: tokens.spacing.md3,
    textAlign: 'center',
    color: colors.neutral[500],
    fontSize: tokens.font.sm,
  },
  loginHintAccent: {
    color: colors.emerald[600],
    fontWeight: tokens.fontWeight.semibold,
  },
});