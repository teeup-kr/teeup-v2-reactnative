import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppLayout } from '../../context/AppLayoutContext';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

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
        { icon: 'home', label: '홈', onPress: () => navigate('/') },
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
        <View style={[styles.menuFooter, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <Text style={styles.menuFooterText}>© 2025 티업링크. All rights reserved.</Text>
        </View>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  closeButton: {
    padding: 6,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuCategory: {
    marginBottom: 24,
  },
  menuCategoryLast: {
    marginBottom: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  menuFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: colors.neutral[50],
  },
  menuFooterText: {
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
