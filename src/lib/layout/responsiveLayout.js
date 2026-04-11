import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { tokens } from '@/styles/style';

const cap = () => tokens.layout.shellMaxCap ?? 680;

/**
 * 웹·큰 화면에서 가운데 정렬되는 앱 컬럼 너비. 좁은 기기에서는 뷰포트 전체를 씁니다.
 */
export function getShellMaxWidth(screenWidth) {
  const w = Number(screenWidth);
  if (!Number.isFinite(w) || w <= 0) return 430;
  return Math.min(w, cap());
}

export function useShellMaxWidth() {
  const { width } = useWindowDimensions();
  return useMemo(() => getShellMaxWidth(width), [width]);
}

/**
 * 모달·카드 등: 선호 너비와 화면 폭 중 작은 값(여백 고려).
 */
export function getContentMaxWidth(screenWidth, preferred = 470, horizontalGutter = 32) {
  const w = Number(screenWidth);
  if (!Number.isFinite(w) || w <= 0) return preferred;
  return Math.min(preferred, Math.max(280, w - horizontalGutter));
}

export function useContentMaxWidth(preferred = 470, horizontalGutter = 32) {
  const { width } = useWindowDimensions();
  return useMemo(
    () => getContentMaxWidth(width, preferred, horizontalGutter),
    [width, preferred, horizontalGutter],
  );
}
