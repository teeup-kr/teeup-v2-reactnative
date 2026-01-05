import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';

export default function DriveCallbackScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>드라이브 연동</Text>
        <Text style={styles.message}>이 기능은 웹에서 완료할 수 있습니다.</Text>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
  },
});
