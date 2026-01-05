import { FontAwesome5 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/theme/colors';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const baseTabBarHeight = 56;
  const tabBarHeight = baseTabBarHeight + bottomInset;
  const visibleTabs = new Set(['index', 'clubs/index', 'meetings/index', 'mypage/index']);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarStyle: {
          borderTopColor: colors.neutral[200],
          paddingTop: 6,
          paddingBottom: bottomInset,
          height: tabBarHeight,
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarButton: visibleTabs.has(route.name) ? undefined : () => null,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clubs/index"
        options={{
          title: '클럽',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="meetings/index"
        options={{
          title: '모임',
          tabBarIcon: ({ color }) => <FontAwesome5 name="calendar-alt" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mypage/index"
        options={{
          title: '마이',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user" size={18} color={color} />,
        }}
      />
    </Tabs>
  );
}
