const MAX_STACK = 5;
const history = [];
const TAB_ROOT_ROUTES = ['/app', '/clubs', '/meetings', '/mypage'];

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

export function recordRoute(route) {
  const next = normalizeRoute(route);
  if (!next) return;

  const last = history[history.length - 1];
  if (last === next) return;

  history.push(next);
  if (history.length > MAX_STACK) {
    history.shift();
  }
}

export function navigateWithCap(router, href) {
  const next = normalizeRoute(href);
  if (!next) return;

  recordRoute(next);
  if (isTabRootRoute(next)) {
    router.navigate(next);
    return;
  }
  router.replace(next);
}

export function backOrHome(router, home = '/app') {
  if (history.length <= 1) {
    const fallback = normalizeRoute(home) || '/app';
    history.length = 0;
    history.push(fallback);
    router.replace(fallback);
    return;
  }

  history.pop();
  const previous = history[history.length - 1];
  router.replace(previous || '/app');
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
