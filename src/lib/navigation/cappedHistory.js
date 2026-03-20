import { Platform } from 'react-native';

const MAX_STACK = 5;
const history = [];
const TAB_ROOT_ROUTES = ['/app', '/clubs', '/meetings', '/mypage'];
const WEB_HARD_REPLACE_TARGETS = ['/app', '/terms-agree'];
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
    if (next === pendingForcedRoute) {
      pendingForcedRoute = '';
      isHistoryTraversalPending = false;
    }
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
  const fallback = normalizeRoute(home) || '/app';

  if (history.length <= 1) {
    history.length = 0;
    history.push(fallback);
    pendingForcedRoute = fallback;
    replaceWithPolicy(router, fallback, { webHardReplace: isWebRuntime() });
    return;
  }

  if (isWebRuntime()) {
    blurActiveElementOnWeb();
    markHistoryTraversal();
    window.history.back();
    return;
  }

  history.pop();
  const previous = history[history.length - 1];
  replaceWithPolicy(router, previous || fallback);
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
