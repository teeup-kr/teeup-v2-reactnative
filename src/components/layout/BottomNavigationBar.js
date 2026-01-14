import { FontAwesome5 } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tokens } from '@/styles/style';

import { useAppLayout } from '../../context/AppLayoutContext';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

const TAB_HEIGHT = 56;

const isPathActive = (pathname, target) => {
  if (target === '/') return pathname === '/';
  return pathname.startsWith(target);
};

export default function BottomNavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toggleMenu } = useAppLayout();
  const { isAuthenticated } = useAuth();

  const handleNavigate = (path) => {
    router.push(path);
  };

  const isMyActive = pathname.startsWith('/mypage') || pathname.startsWith('/login');

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        <Pressable onPress={toggleMenu} style={styles.item}>
          <FontAwesome5 name="th-large" size={18} color={colors.neutral[500]} />
          <Text style={styles.label}>전체</Text>
        </Pressable>
        <Pressable onPress={() => handleNavigate('/')} style={styles.item}>
          <FontAwesome5
            name="home"
            size={18}
            color={isPathActive(pathname, '/') ? colors.primary[600] : colors.neutral[500]}
          />
          <Text
            style={[
              styles.label,
              isPathActive(pathname, '/') && styles.activeLabel,
            ]}
          >
            홈
          </Text>
        </Pressable>
        <Pressable onPress={() => handleNavigate('/clubs')} style={styles.item}>
          <FontAwesome5
            name="users"
            size={18}
            color={isPathActive(pathname, '/clubs') ? colors.primary[600] : colors.neutral[500]}
          />
          <Text
            style={[
              styles.label,
              isPathActive(pathname, '/clubs') && styles.activeLabel,
            ]}
          >
            클럽
          </Text>
        </Pressable>
        <Pressable onPress={() => handleNavigate('/meetings')} style={styles.item}>
          <FontAwesome5
            name="calendar-alt"
            size={18}
            color={isPathActive(pathname, '/meetings') ? colors.primary[600] : colors.neutral[500]}
          />
          <Text
            style={[
              styles.label,
              isPathActive(pathname, '/meetings') && styles.activeLabel,
            ]}
          >
            모임
          </Text>
        </Pressable>
        <Pressable onPress={() => handleNavigate(isAuthenticated ? '/mypage' : '/login')} style={styles.item}>
          <FontAwesome5
            name="user"
            size={18}
            color={isMyActive ? colors.primary[600] : colors.neutral[500]}
          />
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
