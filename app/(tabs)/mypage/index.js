import LoginRequired from '@/components/auth/LoginRequired';
import AppHeader from '@/components/layout/AppHeader';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import UserProfileEditTab from './edit';
import MyMeetingsScreen from './meetings';
import NotificationsScreen from './notifications';
import OverviewScreen from './overview';
import RecordsScreen from './records';
import WithdrawScreen from './withdraw';

export default function MyPageScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <LoginRequired
        message="로그인 후 이용 가능합니다"
        description="마이페이지를 사용하려면 로그인이 필요합니다."
      />
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewScreen />;
      case 'meetings':
        return <MyMeetingsScreen />;
      case 'records':
        return <RecordsScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'edit':
        return <UserProfileEditTab />;
      case 'withdraw':
        return <WithdrawScreen />;
      default:
        return <OverviewScreen />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fafafa' }}>
      {/* 상단 SafeArea */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fafafa' }}>
        <AppHeader />

        {/* 탭 영역 */}
        <View
          style={{
            height: 56,
            justifyContent: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 8,
              alignItems: 'center',
            }}
          >
            {TABS.map(tab => {
              const active = activeTab === tab.id;

              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    marginRight: 8,
                    borderRadius: 12,
                    backgroundColor: active ? '#059669' : '#ffffff',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: active ? '#ffffff' : '#404040',
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


      {/* ✅ 콘텐츠는 flex:1 영역 */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const TABS = [
  { id: 'overview', label: '개요' },
  { id: 'meetings', label: '내 참여내역' },
  { id: 'records', label: '기록' },
  { id: 'notifications', label: '알림' },
  { id: 'edit', label: '회원정보 수정' },
  { id: 'withdraw', label: '회원탈퇴' },
];
