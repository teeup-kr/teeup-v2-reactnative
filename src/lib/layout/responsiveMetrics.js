import { createContext, useContext, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tokens } from '@/styles/style';

import { getShellMaxWidth } from './responsiveLayout';
import { clampNumber, getContentWindowHeight, vhToPx, vwToPx } from './viewportUnits';

export function getBreakpoint(width) {
  const w = Number(width) || 0;
  const tablet = tokens.layout.breakpointTablet ?? 768;
  const largePhone = tokens.layout.breakpointLargePhone ?? 480;
  const phone = tokens.layout.breakpointPhone ?? 360;
  if (w >= tablet) return 'tablet';
  if (w >= largePhone) return 'largePhone';
  if (w >= phone) return 'phone';
  return 'smallPhone';
}

/**
 * @param {number} width
 * @param {number} height
 * @param {import('react-native-safe-area-context').EdgeInsets} insets
 */
export function computeResponsiveMetrics(width, height, insets) {
  const ref = tokens.layout.referenceDesignWidth ?? 390;
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  const shortest = w > 0 && h > 0 ? Math.min(w, h) : 0;

  const uiMin = tokens.layout.uiScaleMin ?? 0.92;
  const uiMax = tokens.layout.uiScaleMax ?? 1.18;
  const uiScale = w > 0 ? clampNumber(uiMin, w / ref, uiMax) : 1;

  const spMin = tokens.layout.spacingScaleMin ?? 0.96;
  const spMax = tokens.layout.spacingScaleMax ?? 1.1;
  const spacingScale = w > 0 ? clampNumber(spMin, w / ref, spMax) : 1;

  const shMin = tokens.layout.shortScaleMin ?? 0.92;
  const shMax = tokens.layout.shortScaleMax ?? 1.15;
  const shortScale = shortest > 0 ? clampNumber(shMin, shortest / ref, shMax) : 1;

  const fontScaleWeak = 1 + (uiScale - 1) * 0.25;
  const breakpoint = getBreakpoint(w);
  const isTablet = breakpoint === 'tablet';

  const tabletMax = tokens.layout.tabletContentMaxWidth ?? 840;
  const gutter = tokens.layout.tabletContentGutter ?? 32;
  const maxContentWidth = isTablet && w > gutter ? Math.min(w - gutter, tabletMax) : w;

  const contentHeight = getContentWindowHeight(h, insets);
  const hForContentVh = contentHeight > 0 ? contentHeight : h;

  return {
    width: w,
    height: h,
    shortestSide: shortest,
    contentHeight,
    uiScale,
    spacingScale,
    shortScale,
    fontScaleWeak,
    breakpoint,
    isTablet,
    maxContentWidth: Math.max(280, maxContentWidth),
    minTouchTarget: tokens.layout.minTouchTarget ?? 44,
    vh: (pct) => vhToPx(pct, h),
    vw: (pct) => vwToPx(pct, w),
    contentVh: (pct) => vhToPx(pct, hForContentVh),
    shellMaxWidth: getShellMaxWidth(w),
  };
}

export const ResponsiveMetricsContext = createContext(
  /** @type {ReturnType<typeof computeResponsiveMetrics> | null} */ (null),
);

export function ResponsiveMetricsProvider({ children }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const value = useMemo(
    () => computeResponsiveMetrics(width, height, insets),
    [width, height, insets.top, insets.bottom, insets.left, insets.right],
  );
  return (
    <ResponsiveMetricsContext.Provider value={value}>{children}</ResponsiveMetricsContext.Provider>
  );
}

export function useResponsiveMetrics() {
  const ctx = useContext(ResponsiveMetricsContext);
  if (!ctx) {
    throw new Error('useResponsiveMetrics must be used within ResponsiveMetricsProvider');
  }
  return ctx;
}

/** Provider 밖(테스트 등)에서 null 가능 */
export function useOptionalResponsiveMetrics() {
  return useContext(ResponsiveMetricsContext);
}
