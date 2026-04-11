import { FontAwesome5 } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOptionalResponsiveMetrics } from '@/lib/layout/responsiveMetrics';
import { iconSize } from '@/lib/layout/responsiveTokenHelpers';
import { navigateWithCap } from '@/lib/navigation/cappedHistory';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import { useAppLayout } from '../../context/AppLayoutContext';
const TAB_HEIGHT = 56;

const isPathActive = (pathname, target) => {
  if (target === '/app') return pathname === '/app';
  return pathname.startsWith(target);
};

export default function BottomNavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toggleMenu } = useAppLayout();
  const [mounted, setMounted] = useState(false);
  const metrics = useOptionalResponsiveMetrics();
  const iconSz = useMemo(() => iconSize(18, metrics?.uiScale ?? 1, 16, 22), [metrics?.uiScale]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavigate = (path) => {
    navigateWithCap(router, path);
  };

  const isMyActive = pathname.startsWith('/mypage') || pathname.startsWith('/login');

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        <Pressable onPress={toggleMenu} style={styles.item} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          {mounted ? <FontAwesome5 name="th-large" size={iconSz} color={colors.neutral[500]} /> : null}
          <Text style={styles.label}>전체</Text>
        </Pressable>
        <Pressable onPress={() => handleNavigate('/app')} style={styles.item} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          {mounted ? (
            <FontAwesome5
              name="home"
              size={iconSz}
              color={isPathActive(pathname, '/app') ? colors.primary[600] : colors.neutral[500]}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              isPathActive(pathname, '/app') && styles.activeLabel,
            ]}
          >
            홈
          </Text>
        </Pressable>
        <Pressable onPress={() => handleNavigate('/clubs')} style={styles.item} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          {mounted ? (
            <FontAwesome5
              name="users"
              size={iconSz}
              color={isPathActive(pathname, '/clubs') ? colors.primary[600] : colors.neutral[500]}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              isPathActive(pathname, '/clubs') && styles.activeLabel,
            ]}
          >
            클럽
          </Text>
        </Pressable>
        <Pressable onPress={() => handleNavigate('/meetings')} style={styles.item} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          {mounted ? (
            <FontAwesome5
              name="calendar-alt"
              size={iconSz}
              color={isPathActive(pathname, '/meetings') ? colors.primary[600] : colors.neutral[500]}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              isPathActive(pathname, '/meetings') && styles.activeLabel,
            ]}
          >
            모임
          </Text>
        </Pressable>
        <Pressable onPress={() => handleNavigate('/mypage')} style={styles.item} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          {mounted ? (
            <FontAwesome5
              name="user"
              size={iconSz}
              color={isMyActive ? colors.primary[600] : colors.neutral[500]}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              isMyActive && styles.activeLabel,
            ]}
          >
            마이
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const bottomNavHeight = (insets) => TAB_HEIGHT + (insets?.bottom || 0);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  row: {
    height: TAB_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xxs,
  },
  activeLabel: {
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
  },
});
