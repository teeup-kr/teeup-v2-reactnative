import {
useRouter } from 'expo-router';
import { Pressable,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import styles from '@/styles/screens/register-success';

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

