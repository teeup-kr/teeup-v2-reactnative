# Mobile-Web Layout/Pages Summary

## Layout structure (App.jsx)
- Global providers: QueryClientProvider, Router, AuthProvider.
- Shell: `div.min-h-screen.flex.flex-col.bg-gray-50`.
- Header: `components/layout/Header.jsx`.
- Main: `main.flex-1.pb-16` wraps all routes.
- Footer: `components/layout/Footer.jsx` rendered inside main after Routes.
- BottomNavigation: `components/layout/BottomNavigation.jsx` fixed at bottom.
- FullMenu overlay: `components/layout/FullMenu.jsx` opened by BottomNavigation menu.
- ToastContainer (react-toastify) global overlay.

## Layout component notes
- Header shows desktop nav + auth buttons only on md+; mobile hides auth buttons.
- BottomNavigation has 5 items: 전체(버튼), 홈, 클럽, 모임, 마이.
- FullMenu sections: 주요 기능 / 클럽 / 모임 / 정보 및 설정. 일부 항목은 로그인 시에만 표시.
- Footer is a small copyright line.

## Routes (from App.jsx)
Auth
- /login -> LoginPage
- /register -> RegisterPage
- /register-success -> RegisterSuccessPage
- /auth/google/callback -> GoogleCallbackPage
- /auth/google/drive-callback -> DriveTokenCallbackPage
- /auth/forgot-password -> ForgotPasswordPage
- /auth/reset-password -> ResetPasswordPage
- /terms -> TermsPage

Home
- / -> Index

Clubs
- /clubs -> ClubListPage
- /clubs/register -> ClubRegisterPage
- /clubs/:clubId -> ClubDetailPage
- /clubs/:clubId/manage -> ClubManagePage
- /clubs/:clubId/members -> ClubMemberManagePage
- /clubs/:clubId/notices -> ClubNoticesPage
- /clubs/:clubId/regulations -> ClubRegulationsPage
- /clubs/:clubId/fees -> ClubFeesPage
- /clubs/:clubId/stats -> ClubStatsPage
- /clubs/:clubId/regulations/create -> ClubRegulationCreatePage
- /clubs/:clubId/regulations/:regulationId -> ClubRegulationDetailPage
- /clubs/:clubId/regulations/:regulationId/edit -> ClubRegulationCreatePage
- /clubs/:clubId/activities -> ClubActivitiesPage
- /clubs/applications/:applicationId -> ClubApplicationDetailPage

Meetings
- /meetings -> MeetingListPage
- /meetings/my -> MyMeetingsPage
- /meetings/:meetingType/:meetingId -> MeetingDetailPage
- /meetings/:meetingId -> MeetingDetailLegacyRedirect (to /meetings/rounding/:meetingId)
- /meetings/rounding/create -> RoundingCreatePage
- /meetings/rounding/:meetingId/edit -> RoundingEditPage
- /meetings/social/create -> SocialCreatePage
- /meetings/social/:meetingId/edit -> SocialEditPage
- /meetings/:meetingId/expense -> ExpensePage
- /meetings/:meetingId/stats -> MeetingStatsPage
- /meetings/:meetingId/score -> ScoreInputPage

My Page / Profile
- /mypage -> MyPage (hash-based tabs: overview/meetings/records/notifications/edit/withdraw)
- /profile/complete -> UserProfileCompletePage
- /profile -> Navigate to /mypage#edit
- /profile/change-password -> ChangePasswordPage
- /profile/delete-account -> Navigate to /mypage#withdraw
- /notifications -> Navigate to /mypage#notifications
- /records -> Navigate to /mypage#records

Content
- /notices -> NoticeListPage
- /notices/:id -> NoticeDetailPage
- /faq -> FAQPage

Fallback
- * -> Navigate to /
