import { Redirect } from 'expo-router';

export default function ForgotPasswordRedirect() {
  // Google 로그인만 사용하므로 비밀번호 찾기 기능이 필요 없습니다.
  return <Redirect href="/login" />;
}
