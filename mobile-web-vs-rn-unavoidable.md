# Unavoidable Differences (Web vs RN)

## Routing mechanics
- Web uses hash tabs on `/mypage#overview|meetings|records|notifications|edit|withdraw`.
  - RN does not support URL hash navigation; RN uses `?tab=` and redirects to `/mypage/*` screens.
- Web also uses hash tabs on `/clubs#my|all|applications|join-applications`, `/meetings#rounding|social`.
  - RN uses `?tab=` (`/clubs?tab=...`, `/meetings?tab=...`) to preserve the same tab behavior.

## Header behavior
- Web header is part of the page flow and scrolls with the page.
  - RN screens use their own `ScrollView`, so a global header stays fixed unless each screen embeds it, which causes nested scroll issues.

## Date input UI
- Web uses native HTML `<input type="date">`.
  - RN uses `@react-native-community/datetimepicker` to provide the closest native date selection experience.

## Toast notifications
- Web uses `react-toastify` for global toasts.
  - RN uses native alerts or inline states; no identical toast system is available without additional native UI patterns.

## OAuth Drive callback
- Web supports `/auth/google/drive-callback` for Drive OAuth.
  - RN shows a placeholder screen; full OAuth Drive flow needs native deep-link & browser session handling.

## Desktop-only UI
- Web header has desktop-only navigation and auth buttons (hidden on mobile).
  - RN is mobile-only; desktop nav is not applicable.
