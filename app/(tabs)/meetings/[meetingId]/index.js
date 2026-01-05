import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../../../../src/theme/colors';

export default function MeetingLegacyScreen() {
  const { meetingId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>모임 상세</Text>
        <Text style={styles.subtitle}>기본 경로 안내 화면입니다.</Text>
        <Pressable onPress={() => router.replace(`/meetings/rounding/${meetingId}`)} style={styles.button}>
          <Text style={styles.buttonText}>라운딩 상세로 이동</Text>
        </Pressable>
        <Text style={styles.helperText}>meetingId: {meetingId}</Text>
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
  helperText: {
    marginTop: 12,
    fontSize: 11,
    color: colors.neutral[500],
  },
});
