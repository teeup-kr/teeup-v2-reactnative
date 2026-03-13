import { Platform } from 'react-native';

const MAX_STACK = 5;
const history = [];
const TAB_ROOT_ROUTES = ['/app', '/clubs', '/meetings', '/mypage'];
const WEB_HARD_REPLACE_TARGETS = ['/app', '/terms-agree'];

function normalizeRoute(route) {
  if (Array.isArray(route)) return String(route[0] || '');
  return String(route || '');
}

function stripQueryAndHash(route) {
  return String(route || '').split('?')[0].split('#')[0];
}

function normalizeTrailingSlash(route) {
  const value = normalizeRoute(route);
  if (!value || value === '/') return value;

  const match = value.match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] || '';
  const suffix = match?.[2] || '';
  if (!pathname || pathname === '/' || !pathname.endsWith('/')) {
    return `${pathname}${suffix}`;
  }

  return `${pathname.slice(0, -1)}${suffix}`;
}

function isTabRootRoute(route) {
  const path = stripQueryAndHash(route);
  return TAB_ROOT_ROUTES.includes(path);
}

function isWebRuntime() {
  return typeof window !== 'undefined' && typeof window.location !== 'undefined';
}

export function shouldUseWebHardReplace(route) {
  const path = stripQueryAndHash(route);
  return WEB_HARD_REPLACE_TARGETS.includes(path);
}

export function recordRoute(route) {
  const next = normalizeRoute(route);
  if (!next) return;

  const last = history[history.length - 1];
  if (last === next) return;

  history.push(next);
  if (!isWebRuntime() && history.length > MAX_STACK) {
    history.shift();
  }
}

export function replaceWithPolicy(router, href, options = {}) {
  const next = normalizeRoute(href);
  if (!next) return;

  recordRoute(next);

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
  const currentState = getNavigationStateSnapshot();

  const current = history[history.length - 1];
  if (current === next) {
    blurActiveElementOnWeb();
    logNavigationTransition(
      {
        type: 'navigateWithCap',
        route: next,
        method: 'noop',
      },
      currentState,
      getNavigationStateSnapshot(next)
    );
    return;
  }

  recordRoute(next);
  blurActiveElementOnWeb();

  if (isWebRuntime()) {
    if (isTabRootRoute(next)) {
      logNavigationTransition(
        {
          type: 'navigateWithCap',
          route: next,
          method: 'router.push',
        },
        currentState,
        getNavigationStateSnapshot(next)
      );
      router.push(next);
      return;
    }

    logNavigationTransition(
      {
        type: 'navigateWithCap',
        route: next,
        method: 'router.push',
      },
      currentState,
      getNavigationStateSnapshot(next)
    );
    router.push(next);
    return;
  }

  if (isTabRootRoute(next)) {
    logNavigationTransition(
      {
        type: 'navigateWithCap',
        route: next,
        method: 'router.navigate',
      },
      currentState,
      getNavigationStateSnapshot(next)
    );
    router.navigate(next);
    return;
  }
  replaceWithPolicy(router, next);
  replaceWithPolicy(router, next);
}

export function backOrHome(router, home = '/app') {
  const currentState = getNavigationStateSnapshot();
  const { fallbackRoute, targetIndex, targetRoute, useFallback } = getBackNavigationState(home);

  if (useFallback || !targetRoute) {
    history.length = 0;
    history.push(fallback);
    replaceWithPolicy(router, fallback);
    return;
  }

  history.pop();
  const previous = history[history.length - 1];
  replaceWithPolicy(router, previous || '/app');
}

export function getHistorySnapshot() {
  return [...history];
}

export { MAX_STACK };
