import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { navigateWithCap } from '@/lib/navigation/cappedHistory';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

const logoImage = require('../../../public/icons/icon-600-transparent-full.png');

export default function AppHeader() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.left}>
          <Pressable onPress={() => navigateWithCap(router, '/app')} style={styles.brand}>
            <Image source={logoImage} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brandText}>티업링크</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  inner: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.padding.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: tokens.spacing.xs2,
  },
  brandText: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
});
