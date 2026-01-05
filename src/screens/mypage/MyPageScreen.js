import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import LoginRequired from '../../components/auth/LoginRequired';

const tabRoutes = {
  overview: '/mypage/overview',
  meetings: '/mypage/meetings',
  records: '/mypage/records',
  notifications: '/mypage/notifications',
  edit: '/mypage/edit',
  withdraw: '/mypage/withdraw',
};

export default function MyPageScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const { tab } = useLocalSearchParams();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <LoginRequired
        message="로그인 후 이용 가능합니다"
        description="마이페이지를 사용하려면 로그인이 필요합니다."
      />
    );
  }

  const tabValue = tab ? String(tab) : null;
  const target = (tabValue && tabRoutes[tabValue]) || tabRoutes.overview;

  return <Redirect href={target} />;
}
