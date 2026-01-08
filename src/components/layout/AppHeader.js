import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

const logoImage = require('../../../assets/teeuplink-logo.png');

export default function AppHeader() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.left}>
          <Pressable onPress={() => router.push('/')} style={styles.brand}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginRight: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[900],
  },
});
