import { Platform } from 'react-native';

const MAX_STACK = 5;
const history = [];
const TAB_ROOT_ROUTES = ['/app', '/clubs', '/meetings', '/mypage'];
const WEB_HARD_REPLACE_TARGETS = ['/app', '/terms-agree'];
const WEB_GUARD_STATE_KEY = '__teeupGuard';
const WEB_GUARD_ROUTE_KEY = '__teeupGuardRoute';
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
let pendingWebNavigationRoute = '';

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
  return Platform.OS === 'web';
}

function getNavigationStateSnapshot(route) {
  return {
    route: normalizeRoute(route) || history[history.length - 1] || '',
    history: [...history],
    pendingForcedRoute,
    pendingWebNavigationRoute,
    isHistoryTraversalPending,
    webRoute: getCurrentWebRoute(),
  };
}

function logNavigationTransition(action, currentState, nextState) {
  console.info('[Navigation]', {
    currentState,
    action,
    nextState,
  });
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

function getCurrentWebRoute() {
  if (!isWebRuntime() || typeof window === 'undefined') return '';
  return normalizeTrailingSlash(`${window.location.pathname}${window.location.search}`);
}

function shouldUseWebBackGuard(route) {
  const path = stripQueryAndHash(route);
  return path !== '/' && !isTabRootRoute(path);
}

function buildWebGuardState(route, guarded) {
  const state = window.history.state;
  const baseState = state && typeof state === 'object' ? state : {};

  return {
    ...baseState,
    [WEB_GUARD_ROUTE_KEY]: route,
    [WEB_GUARD_STATE_KEY]: guarded,
  };
}

function ensureWebBackGuard(route) {
  if (!isWebRuntime() || typeof window === 'undefined') return;

  const next = normalizeRoute(route);
  if (!next || !shouldUseWebBackGuard(next)) return;
  if (getCurrentWebRoute() !== next) return;

  const state = window.history.state;
  if (state?.[WEB_GUARD_STATE_KEY] === true && state?.[WEB_GUARD_ROUTE_KEY] === next) {
    return;
  }

  window.history.replaceState(buildWebGuardState(next, false), '', next);
  window.history.pushState(buildWebGuardState(next, true), '', next);
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
      targetIndex,
      targetRoute: fallbackRoute,
      useFallback: true,
    };
  }

  return {
    fallbackRoute,
    stepCount: history.length - 1 - targetIndex,
    targetIndex,
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
  if (!isWebRuntime() && history.length > MAX_STACK) {
    history.shift();
  }
}

export function syncRouteHistory(route) {
  const next = normalizeRoute(route);
  if (!next) return;
  const currentState = getNavigationStateSnapshot();

  if (pendingForcedRoute) {
    if (next !== pendingForcedRoute) return;

    pendingForcedRoute = '';
    isHistoryTraversalPending = false;

    const existingIndex = history.lastIndexOf(next);
    if (existingIndex >= 0) {
      history.splice(existingIndex + 1);
      ensureWebBackGuard(next);
      logNavigationTransition(
        {
          type: 'syncRouteHistory',
          route: next,
          reason: 'pendingForcedRoute-resolved-existing',
        },
        currentState,
        getNavigationStateSnapshot(next)
      );
      return;
    }

    recordRoute(next);
    ensureWebBackGuard(next);
    logNavigationTransition(
      {
        type: 'syncRouteHistory',
        route: next,
        reason: 'pendingForcedRoute-resolved-recorded',
      },
      currentState,
      getNavigationStateSnapshot(next)
    );
    return;
  }

  const last = history[history.length - 1];
  if (last === next) {
    isHistoryTraversalPending = false;
    ensureWebBackGuard(next);
    logNavigationTransition(
      {
        type: 'syncRouteHistory',
        route: next,
        reason: 'same-route',
      },
      currentState,
      getNavigationStateSnapshot(next)
    );
    return;
  }

  if (isHistoryTraversalPending) {
    isHistoryTraversalPending = false;

    const existingIndex = history.lastIndexOf(next);
    if (existingIndex >= 0) {
      history.splice(existingIndex + 1);
      ensureWebBackGuard(next);
      logNavigationTransition(
        {
          type: 'syncRouteHistory',
          route: next,
          reason: 'historyTraversal-existing',
        },
        currentState,
        getNavigationStateSnapshot(next)
      );
      return;
    }
  }

  recordRoute(next);
  ensureWebBackGuard(next);
  logNavigationTransition(
    {
      type: 'syncRouteHistory',
      route: next,
      reason: 'recorded',
    },
    currentState,
    getNavigationStateSnapshot(next)
  );
}

export function markHistoryTraversal() {
  if (!isWebRuntime()) return;
  isHistoryTraversalPending = true;
}

export function replaceWithPolicy(router, href, options = {}) {
  const next = normalizeRoute(href);
  if (!next) return;
  const currentState = getNavigationStateSnapshot();

  recordRoute(next);
  blurActiveElementOnWeb();

  const useWebHardReplace =
    options.webHardReplace === true &&
    shouldUseWebHardReplace(next) &&
    isWebRuntime();

  if (useWebHardReplace) {
    logNavigationTransition(
      {
        type: 'replaceWithPolicy',
        route: next,
        method: 'window.location.replace',
      },
      currentState,
      getNavigationStateSnapshot(next)
    );
    window.location.replace(next);
    return;
  }

  logNavigationTransition(
    {
      type: 'replaceWithPolicy',
      route: next,
      method: 'router.replace',
    },
    currentState,
    getNavigationStateSnapshot(next)
  );
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
      pendingWebNavigationRoute = normalizeTrailingSlash(next);
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
}

export function backOrHome(router, home = '/app') {
  const currentState = getNavigationStateSnapshot();
  const { fallbackRoute, targetIndex, targetRoute, useFallback } = getBackNavigationState(home);

  if (useFallback || !targetRoute) {
    history.length = 0;
    history.push(fallbackRoute);
    markForcedHistoryTraversal(fallbackRoute);
    logNavigationTransition(
      {
        type: 'backOrHome',
        method: 'fallback',
        route: fallbackRoute,
      },
      currentState,
      getNavigationStateSnapshot(fallbackRoute)
    );
    replaceWithPolicy(router, fallbackRoute, { webHardReplace: isWebRuntime() });
    return;
  }

  history.splice(targetIndex + 1);
  logNavigationTransition(
    {
      type: 'backOrHome',
      method: 'target',
      route: targetRoute,
      targetIndex,
    },
    currentState,
    getNavigationStateSnapshot(targetRoute)
  );
  replaceWithPolicy(router, targetRoute);
}

export function handleWebPopstateBack(router, home = '/app') {
  if (!isWebRuntime()) return false;
  const currentState = getNavigationStateSnapshot();
  const currentWebRoute = getCurrentWebRoute();

  if (pendingWebNavigationRoute) {
    const expectedRoute = pendingWebNavigationRoute;
    pendingWebNavigationRoute = '';

    if (currentWebRoute === expectedRoute) {
      logNavigationTransition(
        {
          type: 'handleWebPopstateBack',
          method: 'suppressed',
          route: expectedRoute,
          reason: 'pendingWebNavigation',
        },
        currentState,
        getNavigationStateSnapshot(expectedRoute)
      );
      return true;
    }
  }

  const { fallbackRoute, targetIndex, targetRoute, useFallback } = getBackNavigationState(home);

  if (useFallback || !targetRoute) {
    history.length = 0;
    history.push(fallbackRoute);
    markForcedHistoryTraversal(fallbackRoute);
    logNavigationTransition(
      {
        type: 'handleWebPopstateBack',
        method: 'fallback',
        route: fallbackRoute,
      },
      currentState,
      getNavigationStateSnapshot(fallbackRoute)
    );
    replaceWithPolicy(router, fallbackRoute, { webHardReplace: true });
    return true;
  }

  history.splice(targetIndex + 1);
  logNavigationTransition(
    {
      type: 'handleWebPopstateBack',
      method: 'target',
      route: targetRoute,
      targetIndex,
    },
    currentState,
    getNavigationStateSnapshot(targetRoute)
  );
  replaceWithPolicy(router, targetRoute);
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
