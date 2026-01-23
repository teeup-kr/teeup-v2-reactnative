import { Redirect } from 'expo-router';

export default function ResetPasswordRedirect() {
  // Google 로그인만 사용하므로 비밀번호 재설정 기능이 필요 없습니다.
  return <Redirect href="/login" />;
}
