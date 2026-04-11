import { tokens } from '@/styles/style';

import { clampNumber } from './viewportUnits';

/**
 * @param {keyof typeof tokens.spacing} key
 * @param {number} spacingScale
 */
export function space(key, spacingScale) {
  const base = tokens.spacing[key];
  if (base == null) return Math.round(16 * spacingScale);
  return Math.max(1, Math.round(base * spacingScale));
}

/**
 * @param {keyof typeof tokens.radius} key
 * @param {number} uiScale
 */
export function radius(key, uiScale) {
  const base = tokens.radius[key];
  if (base == null) return Math.max(2, Math.round(12 * uiScale));
  if (base >= 500) return base;
  return Math.max(2, Math.round(base * uiScale));
}

/**
 * 아이콘 한 변(px). 정사각 유지용으로 width·height에 동일 값 사용.
 * @param {number} baseSize
 * @param {number} uiScale
 */
export function iconSize(baseSize, uiScale, min = 16, max = 28) {
  return clampNumber(min, Math.round(baseSize * uiScale), max);
}

/**
 * 제목 등에만 약한 폰트 스케일 (본문 강결합 금지 정책과 함께 사용).
 * @param {keyof typeof tokens.font} fontKey
 * @param {number} fontScaleWeak
 */
export function fontTitle(fontKey, fontScaleWeak) {
  const base = tokens.font[fontKey] ?? tokens.font.title;
  return Math.max(14, Math.round(base * fontScaleWeak));
}
