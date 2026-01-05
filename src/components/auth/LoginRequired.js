import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import AppHeader from '../layout/AppHeader';
import AppFooter from '../layout/AppFooter';

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
              <Pressable onPress={() => router.push('/login')} style={styles.primaryButton}>
                <Text style={styles.primaryLabel}>로그인</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/register')} style={styles.secondaryButton}>
                <Text style={styles.secondaryLabel}>회원가입</Text>
              </Pressable>
            </View>
          </View>
        </View>
        <AppFooter />
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
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 20,
  },
  actions: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryLabel: {
    color: colors.white,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.neutral[100],
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: colors.neutral[700],
    fontWeight: '600',
  },
});
