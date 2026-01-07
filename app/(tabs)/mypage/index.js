import { Redirect, useLocalSearchParams } from 'expo-router';
import LoginRequired from '../../../src/components/auth/LoginRequired';
import { mypageTabRoutes } from '../../../src/constants/mypageConstants';
import { useAuth } from '../../../src/context/AuthContext';

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
  const target = (tabValue && mypageTabRoutes[tabValue]) || mypageTabRoutes.overview;

  return <Redirect href={target} />;
}
