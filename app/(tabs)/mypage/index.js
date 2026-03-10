import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppHeader from '@/components/layout/AppHeader';
import { mypageTabs, mypageValidTabs } from '@/constants/mypageConstants';
import { useAuth } from '@/context/AuthContext';
import { createTabPressHandler, getMyPageTabContent } from '@/lib/handler/mypage';
import { base, tokens } from '@/styles/style';

import UserProfileEditTab from './edit';
import MyMeetingsScreen from './meetings';
import NotificationsScreen from './notifications';
import OverviewScreen from './overview';
import RecordsScreen from './records';
import WithdrawScreen from './withdraw';


export default function MyPageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const tabParam = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab = mypageValidTabs.includes(tabParam) ? tabParam : 'overview';
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (!mypageValidTabs.includes(tabParam)) return;
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabPress = useMemo(
    () => createTabPressHandler({ setActiveTab, router }),
    [setActiveTab, router]
  );
  const handleMoveToWithdraw = useMemo(
    () => () => {
      setActiveTab('withdraw');
      router.setParams({ tab: 'withdraw' });
    },
    [setActiveTab, router]
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
          edit: <UserProfileEditTab onMoveToWithdraw={handleMoveToWithdraw} />,
          withdraw: <WithdrawScreen />,
        },
      }),
    [activeTab, handleMoveToWithdraw]
  );

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.safeArea}>
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <AppHeader />
      </SafeAreaView>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>마이페이지</Text>
        </View>
        <View style={styles.tabBar}>
          <View style={styles.tabBarRow}>
            {mypageTabs.map((tab) => {
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
          </View>
        </View>
      </View>
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          tabContent
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: base.tabScreenSafeArea,
  headerSafeArea: base.tabScreenHeaderSafeArea,
  headerContainer: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.md,
  },
  headerRow: base.tabScreenHeaderRow,
  title: base.tabScreenTitle,
  tabBar: base.tabScreenTabBar,
  tabBarRow: base.tabScreenTabBarRow,
  tabButton: base.tabScreenTabButton,
  tabButtonActive: base.tabScreenTabButtonActive,
  tabText: base.tabScreenTabText,
  tabTextActive: base.tabScreenTabTextActive,
  content: {
    flex: 1,
  },
  loadingContainer: {
    ...base.stateCenter,
  },
});
