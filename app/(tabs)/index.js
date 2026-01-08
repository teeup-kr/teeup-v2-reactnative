import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import { homeFeatures } from '@/constants/homeConstants';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const heroGradient = ['#059669', '#0F766E'];

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
                source={require('../../assets/teeuplink-logo.png')}
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
