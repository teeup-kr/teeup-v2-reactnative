import { Alert, Platform } from 'react-native';

/**
 * 작성 취소 확인. 웹에서는 Alert 다중 버튼 onPress 이슈를 피하기 위해 window.confirm 사용.
 */
export function confirmDiscardDraft({ title, message, onConfirm }) {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    typeof window.confirm === 'function'
  ) {
    const ok = window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: '아니오', style: 'cancel' },
    { text: '취소', style: 'destructive', onPress: onConfirm },
  ]);
}
