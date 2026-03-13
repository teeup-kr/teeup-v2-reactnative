import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { navigateWithCap } from '@/lib/navigation/cappedHistory';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import AppHeader from '../layout/AppHeader';

export default function LoginRequired({
  message = '로그인 후 이용 가능합니다.',
  description = '이 기능을 사용하려면 로그인이 필요합니다.',
}) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppHeader />
        <View style={styles.container}>
          <View style={styles.card}>
            <FontAwesome5 name="lock" size={36} color={colors.primary[600]} style={styles.icon} />
            <Text style={styles.title}>{message}</Text>
            <Text style={styles.subtitle}>{description}</Text>
            <View style={styles.actions}>
              <Pressable onPress={() => navigateWithCap(router, '/login')} style={styles.primaryButton}>
                <Text style={styles.primaryLabel}>로그인</Text>
              </Pressable>
              <Pressable onPress={() => navigateWithCap(router, '/register')} style={styles.secondaryButton}>
                <Text style={styles.secondaryLabel}>회원가입</Text>
              </Pressable>
            </View>
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.padding.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: tokens.padding.lg,
    paddingVertical: tokens.padding.xl,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon: {
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: tokens.spacing.lg2,
  },
  actions: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: tokens.padding.sm,
    borderRadius: tokens.radius.base,
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  primaryLabel: {
    color: colors.white,
    fontWeight: tokens.fontWeight.semibold,
  },
  secondaryButton: {
    backgroundColor: colors.neutral[100],
    paddingVertical: tokens.padding.sm,
    borderRadius: tokens.radius.base,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.semibold,
  },
});
