/**
 * 뷰포트 비율을 RN에서 쓰기 좋은 px 숫자로 환산 (웹·네이티브 공통).
 * StyleSheet에 '10vh' 문자열을 넣지 않고 이 함수 결과를 사용합니다.
 */
import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** @param {number} min @param {number} value @param {number} max */
export function clampNumber(min, value, max) {
  const v = Number(value);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}

/**
 * @param {number} percent 0~100 (예: 80 = 80vh)
 * @param {number} windowHeight
 */
export function vhToPx(percent, windowHeight) {
  const h = Number(windowHeight);
  if (!Number.isFinite(h) || h <= 0) return 0;
  const p = Number(percent);
  if (!Number.isFinite(p)) return 0;
  return Math.round(h * (p / 100));
}

/**
 * @param {number} percent 0~100
 * @param {number} windowWidth
 */
export function vwToPx(percent, windowWidth) {
  const w = Number(windowWidth);
  if (!Number.isFinite(w) || w <= 0) return 0;
  const p = Number(percent);
  if (!Number.isFinite(p)) return 0;
  return Math.round(w * (p / 100));
}

/**
 * safe area를 뺀 세로 영역(콘텐츠 기준 vh 계산에 사용 가능).
 */
export function getContentWindowHeight(windowHeight, insets) {
  const h = Number(windowHeight);
  const top = Number(insets?.top) || 0;
  const bottom = Number(insets?.bottom) || 0;
  if (!Number.isFinite(h) || h <= 0) return 0;
  return Math.max(0, h - top - bottom);
}

/** 창 크기 + 인셋 기준 vh/vw 헬퍼 (훅) */
export function useViewport() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return useMemo(() => {
    const contentHeight = getContentWindowHeight(height, insets);
    const hBase = contentHeight > 0 ? contentHeight : height;
    return {
      width,
      height,
      contentHeight,
      insets,
      vh: (p) => vhToPx(p, height),
      vw: (p) => vwToPx(p, width),
      /** 탭바 등을 제외한 콘텐츠 영역 기준(없으면 전체 높이) */
      contentVh: (p) => vhToPx(p, hBase),
    };
  }, [width, height, insets]);
}
