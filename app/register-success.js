
import {
useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Pressable,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { base, tokens } from '@/styles/style';
import { colors } from '@/theme/colors';
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
  safeArea: base.safeAreaNeutral,
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.padding.xl,
  },
  title: {
    fontSize: tokens.font.xxl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs2,
  },
  subtitle: {
    ...base.textSmMuted,
    fontSize: tokens.font.base,
    textAlign: 'center',
    marginBottom: tokens.spacing.md3,
  },
  button: {
    ...base.btnPrimary,
    paddingVertical: tokens.padding.base,
    paddingHorizontal: tokens.padding.md,
    borderRadius: tokens.radius.base,
  },
  buttonText: base.btnPrimaryText,
});