import { Redirect } from 'expo-router';

export default function ResetPasswordRedirect() {
  return <Redirect href="/auth/reset-password" />;
}
