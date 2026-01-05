import { Redirect } from 'expo-router';

export default function NotificationsRedirect() {
  return <Redirect href="/mypage?tab=notifications" />;
}
