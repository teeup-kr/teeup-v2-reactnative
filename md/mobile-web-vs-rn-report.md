# Mobile-Web vs React Native Comparison Report

This report compares layout and routing between mobile-web (`mobile-web/src`) and RN (Expo) (`app`, `src`).

## Layout differences
- Header placement
  - Web: global Header sits above Routes (`mobile-web/src/App.jsx`) and scrolls with the page.
  - RN: AppHeader is inserted into each screen (ScrollView) so it scrolls with page content (RootLayout에서 전역 고정 제거).
- Footer placement
  - Web: Footer is inside `<main>` after all Routes (`mobile-web/src/App.jsx`).
  - RN: AppFooter is inserted into each screen content (전역 고정 제거).
- Header contents
  - Web: desktop shows nav links + login/register or user controls; mobile hides these controls (`mobile-web/src/components/layout/Header.jsx`).
  - RN: 모바일 웹과 동일하게 로고/타이틀만 표시(우측 메뉴/로그인·회원가입 버튼 제거).
- Bottom navigation
  - Web: fixed bottom nav highlights `/login` as active for 마이.
  - RN: `/mypage*` 또는 `/login`에서 마이가 active.
- Full menu behavior
  - Web: hides auth-only items entirely when logged out.
  - RN: 로그인 상태에 따라 동일하게 숨김 처리.

## Route mismatches
### Present in mobile-web but missing in RN
- (대부분 추가됨) 과거 누락되었던 `/auth/google/drive-callback`, `/auth/forgot-password`, `/auth/reset-password`, `/clubs/:clubId/regulations/:regulationId/edit`는 RN에도 존재.

### Present in RN but not in mobile-web
- /mypage/overview
- /mypage/meetings
- /mypage/records
- /mypage/notifications
- /mypage/edit
- /mypage/change-password
- /mypage/withdraw
- /meetings/:meetingId (web redirects to /meetings/rounding/:meetingId)

### Similar intent, different structure
- /mypage tabs
  - Web: single page with hash tabs (`/mypage#overview|meetings|records|notifications|edit|withdraw`).
  - RN: URL hash 미지원 → `?tab=`로 받아 `/mypage/*`로 리다이렉트.
- /clubs tabs, /meetings tabs
  - Web: `/clubs#my|all|applications|join-applications`, `/meetings#rounding|social`.
  - RN: `?tab=`로 대체 (`/clubs?tab=...`, `/meetings?tab=...`).
- /notifications and /records
  - Web: redirects to `/mypage#notifications` and `/mypage#records`.
  - RN: `?tab=` 기반으로 `/mypage/*`로 연결.
- /terms
  - Web: content page at `/terms`.
  - RN: actual content at `/auth/terms`, `/terms` redirects.
- /profile/delete-account
  - Web: redirect to `/mypage#withdraw`.
  - RN: dedicated screen (`/profile/delete-account`) using WithdrawScreen.

## FullMenu content differences
- 현재 RN FullMenu는 라벨/노출 조건을 mobile-web 기준으로 맞춤(미로그인 시 auth-only 항목 숨김, “클럽 찾기/모임 목록/이용약관” 라벨 정렬).

## Auth gating differences
- Web: `/mypage` shows LoginRequired view when logged out.
- RN: route guard redirects unauthenticated users to `/login`.

## Notes
- RN has BottomNavigation and FullMenu wired globally; header/footer are per-screen.
- Mobile-web has ToastContainer for error alerts; RN uses native alerts.
