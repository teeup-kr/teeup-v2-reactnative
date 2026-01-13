import { StyleSheet } from 'react-native';
import { tokens } from '@/styles/style';

import {
useRouter } from 'expo-router';
import { Pressable,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function RegisterSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>회원가입 완료</Text>
        <Text style={styles.subtitle}>회원가입이 완료되었습니다.</Text>
        <Pressable onPress={() => router.replace('/login')} style={styles.button}>
          <Text style={styles.buttonText}>로그인으로 이동</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: tokens.colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: tokens.colors.neutral[600],
    textAlign: 'center',
    marginBottom: 18,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: tokens.colors.primary[600],
  },
  buttonText: {
    color: tokens.colors.white,
    fontWeight: '600',
  },
});
