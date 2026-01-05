# React Native (Expo) Layout/Pages Summary

## Layout structure (app/_layout.js + per-screen)
- Global providers: SafeAreaProvider, AuthProvider, AppLayoutProvider.
- Route guard: protected routes redirect to /login (in app/_layout.js).
- Global chrome:
  - BottomNavigationBar (fixed) + FullMenu overlay (fixed).
- Header/Footer are injected into each screen (ScrollView/SafeAreaView) rather than globally.

## Layout components
- AppHeader: back button + logo; authenticated users see bell/user/logout. No login/register buttons.
- AppFooter: PixenCrew/TeeUp copyright line.
- BottomNavigationBar: 전체/홈/클럽/모임/마이; 마이는 로그인 시 /mypage else /login.
- FullMenu: categorized items (주요 기능/클럽/모임/마이페이지/정보 및 설정/계정).

## Routes (from app/*)
Auth
- /login
- /register
- /register-success
- /forgot-password
- /reset-password
- /auth/google/callback
- /auth/terms
- /terms -> redirect to /auth/terms

Home
- /

Clubs
- /clubs
- /clubs/register
- /clubs/:clubId
- /clubs/:clubId/manage
- /clubs/:clubId/members
- /clubs/:clubId/notices
- /clubs/:clubId/regulations
- /clubs/:clubId/regulations/create
- /clubs/:clubId/regulations/:regulationId
- /clubs/:clubId/fees
- /clubs/:clubId/stats
- /clubs/:clubId/activities
- /clubs/applications/:applicationId

Meetings
- /meetings
- /meetings/my
- /meetings/:meetingType/:meetingId
- /meetings/:meetingId
- /meetings/rounding/create
- /meetings/rounding/:meetingId/edit
- /meetings/social/create
- /meetings/social/:meetingId/edit
- /meetings/:meetingId/expense
- /meetings/:meetingId/stats
- /meetings/:meetingId/score

My Page
- /mypage
- /mypage/overview
- /mypage/meetings
- /mypage/records
- /mypage/notifications
- /mypage/edit
- /mypage/change-password
- /mypage/withdraw

Content
- /notices
- /notices/:noticeId
- /faq

Redirect helpers
- /records -> /mypage/records
- /notifications -> /mypage/notifications
- /profile -> /mypage
- /profile/complete
- /profile/change-password
- /profile/delete-account
