import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import { useAppLayout } from '../../context/AppLayoutContext';
import { useAuth } from '../../context/AuthContext';
const MenuItem = ({ icon, label, onPress, isLast }) => (
  <View>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <View style={styles.menuIcon}>
        <FontAwesome5 name={icon} size={16} color={colors.neutral[600]} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
    {!isLast ? <View style={styles.menuDivider} /> : null}
  </View>
);

export default function FullMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isMenuOpen, closeMenu } = useAppLayout();
  const { isAuthenticated, logout } = useAuth();

  if (!isMenuOpen) {
    return null;
  }

  const navigate = (path, requiresAuth = false) => {
    closeMenu();
    if (requiresAuth && !isAuthenticated) return;
    router.push(path);
  };

  const handleLogout = async () => {
    await logout();
    closeMenu();
    router.replace('/');
  };

  const menuCategories = [
    {
      items: [
        { icon: 'home', label: '홈', onPress: () => navigate('/app') },
        { icon: 'users', label: '클럽 찾기', onPress: () => navigate('/clubs') },
        { icon: 'list', label: '모임 목록', onPress: () => navigate('/meetings') },
        ...(isAuthenticated
          ? [
            { icon: 'calendar-check', label: '내 모임', onPress: () => navigate('/meetings/my', true) },
            { icon: 'clipboard-list', label: '기록 관리', onPress: () => navigate('/mypage?tab=records', true) },
            { icon: 'user', label: '마이페이지', onPress: () => navigate('/mypage', true) },
          ]
          : []),
      ],
    },
    ...(isAuthenticated
      ? [
        {
          items: [
            { icon: 'users', label: '내 클럽 보기', onPress: () => navigate('/clubs', true) },
            { icon: 'user-friends', label: '클럽 만들기', onPress: () => navigate('/clubs/register', true) },
          ],
        },
      ]
      : []),
    ...(isAuthenticated
      ? [
        {
          items: [
            { icon: 'golf-ball', label: '라운딩 모임 만들기', onPress: () => navigate('/meetings/rounding/create', true) },
            { icon: 'calendar-plus', label: '소셜 모임 만들기', onPress: () => navigate('/meetings/social/create', true) },
          ],
        },
      ]
      : []),
    {
      items: [
        { icon: 'file-alt', label: '공지사항', onPress: () => navigate('/notices') },
        { icon: 'question-circle', label: 'FAQ', onPress: () => navigate('/faq') },
        ...(isAuthenticated
          ? [{ icon: 'envelope', label: '1:1 문의', onPress: () => navigate('/inquiries', true) }]
          : []),
        { icon: 'file-alt', label: '이용약관', onPress: () => navigate('/terms') },
        ...(isAuthenticated ? [{ icon: 'sign-out-alt', label: '로그아웃', onPress: handleLogout }] : []),
      ],
    },
  ];

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>
        <View style={[styles.sheetHeader, { paddingTop: insets.top, height: 56 + insets.top }]}>
          <Text style={styles.sheetTitle}>전체메뉴</Text>
          <Pressable onPress={closeMenu} style={styles.closeButton}>
            <FontAwesome5 name="times" size={20} color={colors.neutral[400]} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.sheetContent}>
          {menuCategories.map((category, categoryIndex) => (
            <View
              key={`category-${categoryIndex}`}
              style={[styles.menuCategory, categoryIndex === menuCategories.length - 1 && styles.menuCategoryLast]}
            >
              {category.items.map((item, itemIndex) => (
                <MenuItem
                  key={`${item.label}-${itemIndex}`}
                  icon={item.icon}
                  label={item.label}
                  onPress={item.onPress}
                  isLast={itemIndex === category.items.length - 1}
                />
              ))}
            </View>
          ))}
        </ScrollView>
        {Platform.OS === 'web' && (
          <View style={[styles.menuFooter, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <Text style={styles.menuFooterText}>© {new Date().getFullYear()} 티업링크. All rights reserved.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: colors.white,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.white,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  sheetTitle: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[900],
  },
  closeButton: {
    padding: tokens.padding.xs2,
  },
  sheetContent: {
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.md,
  },
  menuCategory: {
    marginBottom: tokens.spacing.lg,
  },
  menuCategoryLast: {
    marginBottom: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
  },
  menuItemPressed: {
    backgroundColor: colors.neutral[50],
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  menuIcon: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  menuLabel: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[900],
  },
  menuFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingVertical: tokens.padding.base,
    paddingHorizontal: tokens.padding.lg,
    backgroundColor: colors.neutral[50],
  },
  menuFooterText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
