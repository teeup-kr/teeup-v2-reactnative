import { FontAwesome5 } from '@expo/vector-icons';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bottomNavHeight } from '@/components/layout/BottomNavigationBar';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

// 사용설명서(Notion) 배너. 하단 탭바 바로 위에 고정되며, 탭하면 외부 브라우저로 연다.
export const GUIDE_URL = 'https://jungeui.notion.site/teeup-guide?source=copy_link';

export const GUIDE_BANNER_HEIGHT = 44;

export function guideBannerOffset(insets) {
  return bottomNavHeight(insets) + GUIDE_BANNER_HEIGHT;
}

export function openGuide() {
  if (Platform.OS === 'web') {
    window.open(GUIDE_URL, '_blank', 'noopener,noreferrer');
    return;
  }
  Linking.openURL(GUIDE_URL).catch(() => {});
}

export default function GuideBanner() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { bottom: bottomNavHeight(insets) }]}>
      <Pressable
        onPress={openGuide}
        style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
        accessibilityRole="link"
        accessibilityLabel="사용설명서 열기"
      >
        <FontAwesome5 name="book-open" size={13} color={colors.white} />
        <Text style={styles.text}>티업링크 사용설명서 보기</Text>
        <FontAwesome5 name="external-link-alt" size={11} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  banner: {
    height: GUIDE_BANNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.padding.xs,
    backgroundColor: colors.primary[600],
    paddingHorizontal: tokens.padding.md,
  },
  bannerPressed: {
    backgroundColor: colors.primary[700],
  },
  text: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.white,
  },
});
