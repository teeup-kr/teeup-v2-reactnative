import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const features = [
  {
    title: '자동 조편성',
    description: '핸디캡과 선호도를 고려한\n공정한 조편성을 자동으로 제공합니다',
    emoji: '🎯',
    background: '#ECFDF5',
    accent: '#059669',
  },
  {
    title: '자동 정산',
    description: '회비와 경비를 자동으로 계산하고\n정확한 정산 내역을 제공합니다',
    emoji: '💰',
    background: '#FFF7ED',
    accent: '#D97706',
  },
  {
    title: '기록 관리',
    description: '라운딩 기록과 통계를 체계적으로\n관리하고 분석할 수 있습니다',
    emoji: '📊',
    background: '#EEF2FF',
    accent: '#4F46E5',
  },
];

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
  const isAuthenticated = false;
  const heroGradient = ['#059669', '#0F766E'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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
            {features.map((feature) => (
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
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
