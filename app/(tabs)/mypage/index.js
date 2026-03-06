import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginRequired from '@/components/auth/LoginRequired';
import AppHeader from '@/components/layout/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { createTabPressHandler, getMyPageTabContent } from '@/lib/handler/mypage';
import { base, tokens } from '@/styles/style';

import UserProfileEditTab from './edit';
import MyMeetingsScreen from './meetings';
import NotificationsScreen from './notifications';
import OverviewScreen from './overview';
import RecordsScreen from './records';
import WithdrawScreen from './withdraw';



const TABS = [
  { id: 'overview', label: '개요' },
  { id: 'meetings', label: '내 참여내역' },
  { id: 'records', label: '기록' },
  { id: 'notifications', label: '알림' },
  { id: 'edit', label: '회원정보 수정' },
];
const VALID_TAB_IDS = ['overview', 'meetings', 'records', 'notifications', 'edit', 'withdraw'];

export default function MyPageScreen() {
  const params = useLocalSearchParams();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab = VALID_TAB_IDS.includes(tabParam) ? tabParam : 'overview';
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (!VALID_TAB_IDS.includes(tabParam)) return;
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabPress = useMemo(
    () => createTabPressHandler({ setActiveTab }),
    [setActiveTab]
  );

  const tabContent = useMemo(
    () =>
      getMyPageTabContent({
        activeTab,
        tabs: {
          overview: <OverviewScreen />,
          meetings: <MyMeetingsScreen />,
          records: <RecordsScreen />,
          notifications: <NotificationsScreen />,
          edit: <UserProfileEditTab onMoveToWithdraw={() => setActiveTab('withdraw')} />,
          withdraw: <WithdrawScreen />,
        },
      }),
    [activeTab]
  );

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <LoginRequired
        message="로그인 후 이용 가능합니다"
        description="마이페이지를 사용하려면 로그인이 필요합니다."
      />
    );
  }

  return (
    <View style={styles.safeArea}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <AppHeader />

        <View style={styles.titleWrap}>
          <Text style={styles.title}>마이페이지</Text>
        </View>

        <View style={styles.tabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScrollContent}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id || (activeTab === 'withdraw' && tab.id === 'edit');

              return (
                <Pressable
                  key={tab.id}
                  onPress={handleTabPress(tab.id)}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <View style={styles.content}>{tabContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: base.tabScreenSafeArea,
  headerSafeArea: base.tabScreenHeaderSafeArea,
  titleWrap: {
    paddingHorizontal: tokens.padding.md,
    paddingTop: tokens.padding.sm,
    paddingBottom: tokens.padding.xs,
  },
  title: base.tabScreenTitle,
  tabBar: {
    ...base.tabScreenTabBar,
    justifyContent: 'center',
    minHeight: 56,
  },
  tabBarScrollContent: {
    ...base.tabScreenTabBarRow,
    alignItems: 'center',
    paddingHorizontal: tokens.padding.xs,
  },
  tabButton: base.tabScreenTabButton,
  tabButtonActive: base.tabScreenTabButtonActive,
  tabText: base.tabScreenTabText,
  tabTextActive: base.tabScreenTabTextActive,
  content: {
    flex: 1,
  },
});
