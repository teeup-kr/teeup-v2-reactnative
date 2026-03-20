import { Platform } from 'react-native';

const MAX_STACK = 5;
const history = [];
const TAB_ROOT_ROUTES = ['/app', '/clubs', '/meetings', '/mypage'];
const WEB_HARD_REPLACE_TARGETS = ['/app', '/terms-agree'];
const BACK_EXCLUDED_ROUTE_RULES = [
  { pattern: /^\/meetings\/social\/create$/, fallback: '/meetings/my' },
  { pattern: /^\/meetings\/social\/[^/]+\/edit$/, fallback: '/meetings/my' },
  { pattern: /^\/meetings\/rounding\/create$/, fallback: '/meetings/my' },
  { pattern: /^\/meetings\/rounding\/[^/]+\/edit$/, fallback: '/meetings/my' },
  {
    pattern: /^\/meetings\/([^/]+)\/score$/,
    fallback: (match) => `/meetings/${match[1]}/stats`,
  },
  {
    pattern: /^\/meetings\/([^/]+)\/expense$/,
    fallback: (match) => `/meetings/${match[1]}/stats`,
  },
  { pattern: /^\/clubs\/register$/, fallback: '/app' },
  {
    pattern: /^\/clubs\/([^/]+)\/notices\/create$/,
    fallback: (match) => `/clubs/${match[1]}/notices`,
  },
  {
    pattern: /^\/clubs\/([^/]+)\/notices\/([^/]+)\/edit$/,
    fallback: (match) => `/clubs/${match[1]}/notices/${match[2]}`,
  },
  {
    pattern: /^\/clubs\/([^/]+)\/regulations\/create$/,
    fallback: (match) => `/clubs/${match[1]}/regulations`,
  },
  {
    pattern: /^\/clubs\/([^/]+)\/regulations\/([^/]+)\/edit$/,
    fallback: (match) => `/clubs/${match[1]}/regulations/${match[2]}`,
  },
  {
    pattern: /^\/clubs\/([^/]+)\/fees\/create$/,
    fallback: (match) => `/clubs/${match[1]}/fees`,
  },
  {
    pattern: /^\/clubs\/([^/]+)\/fees\/([^/]+)\/edit$/,
    fallback: (match) => `/clubs/${match[1]}/fees`,
  },
  { pattern: /^\/inquiries\/create$/, fallback: '/inquiries' },
  { pattern: /^\/mypage\/edit$/, fallback: '/mypage' },
  { pattern: /^\/mypage\/withdraw$/, fallback: '/mypage' },
  { pattern: /^\/profile\/complete$/, fallback: '/app' },
];
let isHistoryTraversalPending = false;
let pendingForcedRoute = '';

function normalizeRoute(route) {
  if (Array.isArray(route)) return String(route[0] || '');
  return String(route || '');
}

function stripQueryAndHash(route) {
  return String(route || '').split('?')[0].split('#')[0];
}

function isTabRootRoute(route) {
  const path = stripQueryAndHash(route);
  return TAB_ROOT_ROUTES.includes(path);
}

function isWebRuntime() {
  return Platform.OS === 'web';
}

function blurActiveElementOnWeb() {
  if (!isWebRuntime() || typeof document === 'undefined') return;

  const activeElement = document.activeElement;
  if (activeElement && typeof activeElement.blur === 'function') {
    activeElement.blur();
  }
}

function shouldUseWebHardReplace(route) {
  const path = stripQueryAndHash(route);
  return WEB_HARD_REPLACE_TARGETS.includes(path);
}

function getBackExcludedRouteMatch(route) {
  const path = stripQueryAndHash(route);
  if (!path) return null;

  for (const rule of BACK_EXCLUDED_ROUTE_RULES) {
    const match = path.match(rule.pattern);
    if (match) {
      return { rule, match };
    }
  }

  return null;
}

function isBackExcludedRoute(route) {
  return Boolean(getBackExcludedRouteMatch(route));
}

function resolveBackFallback(route, home = '/app') {
  const defaultFallback = normalizeRoute(home) || '/app';
  const matched = getBackExcludedRouteMatch(route);
  if (!matched) return defaultFallback;

  const fallback =
    typeof matched.rule.fallback === 'function'
      ? matched.rule.fallback(matched.match)
      : matched.rule.fallback;

  return normalizeRoute(fallback) || defaultFallback;
}

function findBackTargetIndex() {
  for (let index = history.length - 2; index >= 0; index -= 1) {
    if (!isBackExcludedRoute(history[index])) {
      return index;
    }
  }

  return -1;
}

function markForcedHistoryTraversal(targetRoute) {
  const target = normalizeRoute(targetRoute);
  if (!target) return;
  pendingForcedRoute = target;
  isHistoryTraversalPending = true;
}

function getBackNavigationState(home = '/app') {
  const currentRoute = history[history.length - 1];
  const fallbackRoute = resolveBackFallback(currentRoute, home);
  const targetIndex = findBackTargetIndex();

  if (targetIndex < 0) {
    return {
      fallbackRoute,
      stepCount: 0,
      targetRoute: fallbackRoute,
      useFallback: true,
    };
  }

  return {
    fallbackRoute,
    stepCount: history.length - 1 - targetIndex,
    targetRoute: history[targetIndex],
    useFallback: false,
  };
}

function recordRoute(route) {
  const next = normalizeRoute(route);
  if (!next) return;

  const last = history[history.length - 1];
  if (last === next) return;

  history.push(next);
  if (history.length > MAX_STACK) {
    history.shift();
  }
}

export function syncRouteHistory(route) {
  const next = normalizeRoute(route);
  if (!next) return;

  if (pendingForcedRoute) {
    if (next !== pendingForcedRoute) return;

    pendingForcedRoute = '';
    isHistoryTraversalPending = false;

    const existingIndex = history.lastIndexOf(next);
    if (existingIndex >= 0) {
      history.splice(existingIndex + 1);
      return;
    }

    recordRoute(next);
    return;
  }

  const last = history[history.length - 1];
  if (last === next) {
    isHistoryTraversalPending = false;
    return;
  }

  if (isHistoryTraversalPending) {
    isHistoryTraversalPending = false;

    const existingIndex = history.lastIndexOf(next);
    if (existingIndex >= 0) {
      history.splice(existingIndex + 1);
      return;
    }
  }

  recordRoute(next);
}

export function markHistoryTraversal() {
  if (!isWebRuntime()) return;
  isHistoryTraversalPending = true;
}

export function replaceWithPolicy(router, href, options = {}) {
  const next = normalizeRoute(href);
  if (!next) return;

  recordRoute(next);
  blurActiveElementOnWeb();

  const useWebHardReplace =
    options.webHardReplace === true &&
    shouldUseWebHardReplace(next) &&
    isWebRuntime();

  if (useWebHardReplace) {
    window.location.replace(next);
    return;
  }

  router.replace(next);
}

export function navigateWithCap(router, href) {
  const next = normalizeRoute(href);
  if (!next) return;

  const current = history[history.length - 1];
  if (current === next) {
    blurActiveElementOnWeb();
    return;
  }

  recordRoute(next);
  blurActiveElementOnWeb();

  if (isWebRuntime()) {
    router.push(next);
    return;
  }

  if (isTabRootRoute(next)) {
    router.navigate(next);
    return;
  }
  replaceWithPolicy(router, next);
}

export function backOrHome(router, home = '/app') {
  const { fallbackRoute, stepCount, targetRoute, useFallback } = getBackNavigationState(home);

  if (useFallback || !targetRoute) {
    history.length = 0;
    history.push(fallbackRoute);
    markForcedHistoryTraversal(fallbackRoute);
    replaceWithPolicy(router, fallbackRoute, { webHardReplace: isWebRuntime() });
    return;
  }

  if (isWebRuntime()) {
    blurActiveElementOnWeb();
    markForcedHistoryTraversal(targetRoute);
    window.history.go(-stepCount);
    return;
  }

  history.splice(findBackTargetIndex() + 1);
  replaceWithPolicy(router, targetRoute);
}

export function handleWebPopstateBack(router, home = '/app') {
  if (!isWebRuntime()) return false;

  const { fallbackRoute, stepCount, targetRoute, useFallback } = getBackNavigationState(home);

  if (useFallback || !targetRoute) {
    history.length = 0;
    history.push(fallbackRoute);
    markForcedHistoryTraversal(fallbackRoute);
    replaceWithPolicy(router, fallbackRoute, { webHardReplace: true });
    return true;
  }

  markForcedHistoryTraversal(targetRoute);

  if (stepCount <= 1) {
    return false;
  }

  blurActiveElementOnWeb();
  window.history.go(-(stepCount - 1));
  return true;
}

/**
 * 모임 생성/수정 화면 이탈: `router.push`로 들어온 경우 capped history와 달라질 수 있어
 * 실제 스택의 `back()`을 우선 사용한다.
 */
export function leaveMeetingFormScreen(router, fallbackHref = '/meetings/my') {
  if (typeof router?.canGoBack === 'function' && router.canGoBack()) {
    router.back();
    return;
  }
  const fallback = normalizeRoute(fallbackHref) || '/meetings/my';
  router.replace(fallback);
}

export function getHistorySnapshot() {
  return [...history];
}

export { MAX_STACK };
