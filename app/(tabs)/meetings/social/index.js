import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../../../src/theme/colors';

export default function SocialLandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>소셜 모임</Text>
        <Text style={styles.subtitle}>소셜 모임 목록은 모임 탭에서 확인해주세요.</Text>
        <Pressable onPress={() => router.replace('/meetings')} style={styles.button}>
          <Text style={styles.buttonText}>모임 목록으로 이동</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

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
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[600],
    marginBottom: 16,
    textAlign: 'center',
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
