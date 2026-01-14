import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginRequired from '@/components/auth/LoginRequired';
import AppHeader from '@/components/layout/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { createTabPressHandler, getMyPageTabContent } from '@/lib/render/mypage/index';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

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
  { id: 'withdraw', label: '회원탈퇴' },
];

export default function MyPageScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

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
          edit: <UserProfileEditTab />,
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
    <View style={{ flex: 1, backgroundColor: colors.neutral[50] }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.neutral[50] }}>
        <AppHeader />

        <View
          style={{
            height: 56,
            justifyContent: 'center',
            backgroundColor: colors.neutral[50],
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: tokens.padding.xs,
              alignItems: 'center',
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;

              return (
                <Pressable
                  key={tab.id}
                  onPress={handleTabPress(tab.id)}
                  style={{
                    paddingVertical: tokens.padding.base,
                    paddingHorizontal: tokens.padding.md,
                    marginRight: tokens.spacing.xs2,
                    borderRadius: tokens.radius.md,
                    backgroundColor: active ? colors.emerald[600] : colors.white,
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.font.base,
                      fontWeight: tokens.fontWeight.semibold,
                      color: active ? colors.white : colors.textStrong,
                    }}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>{tabContent}</View>
    </View>
  );
}
