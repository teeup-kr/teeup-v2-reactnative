# App Review 답변 초안 — Guideline 2.1 Information Needed

- 작성일: 2026-09-14
- 대상: 버전 1.0 (빌드 1) 첫 제출에 대한 Apple의 추가 정보 요청
- 회신 위치: App Store Connect → 앱 → 심사 메시지 회신 **+ 앱 심사 정보의 「메모」 필드에도 동일 내용 기재**

> Apple이 "Reply in App Store Connect ... and also add this information to the Notes field"
> 라고 명시했으므로 **두 곳 모두**에 넣어야 한다.

---

## 0. 회신 전 준비 체크리스트

| 순서 | 항목 | 상태 |
| --- | --- | --- |
| 1 | 리뷰어 로그인 백엔드 배포 (`origin/dev` pull + restart) | ☐ |
| 2 | iPhone 확보 (최신 iOS) → TestFlight 설치 | ☐ |
| 3 | 화면 녹화 촬영 | ☐ |
| 4 | 아래 답변 + 녹화 영상 회신, 메모 필드에도 기재 | ☐ |

**전략**: 신고·차단 기능은 구현하지 않고 기존 빌드 1 그대로 회신한다.
폐쇄형 클럽 구조를 설명하고, Guideline 1.2로 반려되면 그때 구현한다 (4장 참조).

---

## 1. 화면 녹화 촬영 가이드

### 준비

- iPhone (최신 iOS — 현재 iOS 26.x)
- TestFlight 앱 설치 → 티업링크 빌드 설치
- 설정 → 제어 센터 → 「화면 기록」 추가

### 녹화 흐름 (한 번에 이어서, 5~8분)

1. **홈 화면에서 앱 아이콘 탭** → 앱 실행 (반드시 여기서 시작)
2. 로그인 화면 → **Apple로 로그인** → 가입 → 프로필 완성
3. 홈 둘러보기
4. **클럽 만들기** → 클럽 생성 → 클럽 상세
5. **라운딩 모임 만들기** → 모임 생성 → 모임 상세 → 참가 신청
6. 소셜 모임 둘러보기
7. **라운드 기록하기** → 스코어 입력 → 마이페이지 기록 확인
8. 클럽 공지/모임 설명 등 **사용자 생성 콘텐츠** 화면 보여주기
   (클럽 멤버에게만 보이는 구조임을 자연스럽게 드러낼 것)
9. 전체메뉴 → 1:1 문의 화면
10. **마이페이지 → 회원정보 수정 → 회원 탈퇴** → 실제로 탈퇴 완료까지
11. 로그아웃된 로그인 화면에서 종료

### 주의

- 실명·전화번호 등 실제 개인정보가 화면에 나오지 않도록 **테스트용 값**으로 가입할 것
- 녹화 파일은 ASC 회신에 첨부 (용량 크면 iCloud/Drive 링크로)

---

## 2. 회신 본문 (영문 — App Review 표준)

```
Thank you for reviewing TeeUp Link. Please find the requested information below.

────────────────────────────────────────
1. SCREEN RECORDING
────────────────────────────────────────
Attached is a screen recording captured on an iPhone running iOS 26.x.
It begins with launching the app and demonstrates:
  • Account registration via Sign in with Apple
  • Creating a golf club and a rounding (golf outing) event
  • Recording a golf score
  • User-generated content (club and event details, visible to club members only)
  • Contacting support via 1:1 Inquiry
  • Account deletion (My Page → Edit Profile → Delete Account)

────────────────────────────────────────
2. APP PURPOSE AND TARGET AUDIENCE
────────────────────────────────────────
TeeUp Link is a management tool for amateur golf clubs (동호회) in Korea.

Problem it solves:
Club organizers typically coordinate golf outings through group chats and
spreadsheets — collecting attendees, splitting green fees and meal costs,
and tracking scores by hand. This is error-prone and time-consuming.

Value it provides:
  • Club creation and member management with leader/manager roles
  • Scheduling golf outings and social gatherings with sign-up deadlines
  • Per-outing expense tracking with automatic per-person cost split
  • Personal score history with average score and handicap
  • Push notifications for event updates

Target audience:
Amateur golfers in Korea who belong to or organize a golf club, and club
treasurers/organizers who manage outings and shared expenses.

The app is free. It contains no in-app purchases, subscriptions, or ads.

────────────────────────────────────────
3. SETUP AND ACCESS INSTRUCTIONS
────────────────────────────────────────
Login options:
  (a) Sign in with Apple — recommended. Any Apple ID works; the account is
      created on first sign-in.
  (b) Google Sign-In.
  (c) Demo account for review (email/password):

      On the login screen, tap the app logo 7 times to open the
      "Reviewer Login" screen, then enter:
        Email:    reviewer@teeup.run
        Password: reviewer1234!

      (This hidden entry exists only to provide reviewers with a
      password-based account, since regular users sign in with
      Apple or Google.)

Main features and where to find them:
  • Create a club        : Clubs tab → Create Club
  • Create an outing     : Meetings tab → Create Rounding
  • Create a social event: Meetings tab → Create Social
  • Record a score       : Home → Record Round
  • Expense settlement   : Meeting detail → Settlement
  • Delete account       : My tab → Edit Profile → Delete Account
  • Contact support      : Full Menu → 1:1 Inquiry

No sample files are required.

────────────────────────────────────────
4. EXTERNAL SERVICES
────────────────────────────────────────
  • Sign in with Apple           — authentication
  • Google Sign-In               — authentication
  • Firebase Cloud Messaging     — push notifications only
                                    (no Analytics, no Crashlytics, no Ads)
  • Our own backend API          — https://www.teeup.kr (FastAPI, hosted by us)

No payment processors, no AI services, no third-party data providers,
no advertising SDKs.

────────────────────────────────────────
5. REGIONAL DIFFERENCES
────────────────────────────────────────
The app functions identically in all regions. The UI and content are in
Korean and the service is intended for users in South Korea, but no
feature is enabled or disabled based on region.

────────────────────────────────────────
6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
────────────────────────────────────────
Not applicable. The app does not operate in a regulated industry and does
not include protected third-party material. All content is either created
by our team or by users within their own clubs.

────────────────────────────────────────
ADDITIONAL NOTES
────────────────────────────────────────
  • User-generated content (club descriptions, notices, event details) is
    visible only to members of the same club. There is no public feed,
    no search across clubs, and no direct messaging between users.
    Club leaders approve each membership request, and any member can
    leave a club at any time. Objectionable content can be reported to us
    through the in-app 1:1 Inquiry or by email, and we act on reports
    within 24 hours.
  • Account deletion is available in-app and takes effect immediately.
  • The "settlement" feature only records and splits real-world expenses
    among club members; no money is transferred or paid within the app.

Contact: pixencrew@gmail.com
```

---

## 3. 「메모」 필드용 축약본

앱 심사 정보 → 메모 (4,000자)에 넣을 버전. 위 본문 3·4번 + 추가 노트만 요약.

```
[LOGIN]
Sign in with Apple or Google works with any account.
Demo account: on the login screen, tap the app logo 7 times to open
"Reviewer Login", then use  reviewer@teeup.run / reviewer1234!

[KEY PATHS]
Create club: Clubs tab → Create Club
Create outing: Meetings tab → Create Rounding
Record score: Home → Record Round
Report content: Full Menu → 1:1 Inquiry (or pixencrew@gmail.com)
Delete account: My → Edit Profile → Delete Account

[SERVICES]
Sign in with Apple, Google Sign-In, Firebase Cloud Messaging (push only),
own backend at https://www.teeup.kr. No IAP, no ads, no payment processing.

[UGC]
Content is visible only within the user's own club (no public feed, no
cross-club search, no direct messaging). Club leaders approve membership.
Objectionable content can be reported via 1:1 Inquiry or email; we act
within 24 hours.

[REGION]
Functions identically in all regions. Korean-language service.

Contact: pixencrew@gmail.com
```

---

## 4. (반려 시 대비) 신고·차단 기능 — 최소 구현 범위

이번 회신에는 포함하지 않는다. Guideline 1.2 로 반려될 경우에만 구현한다.

Apple Guideline 1.2 (User-Generated Content) 요구사항:

| 요구 | 최소 구현 |
| --- | --- |
| 콘텐츠 **신고** 메커니즘 | 클럽 상세·모임 상세·공지에 「신고」 버튼 → 1:1 문의를 신고 유형으로 자동 생성 |
| 사용자 **차단** | 멤버 목록에 「차단」 → 차단한 사용자의 콘텐츠 숨김 |
| 운영자가 24시간 내 조치 | 백오피스에서 신고 문의 확인 → 조치 (운영 절차) |
| 연락처 공개 | 이미 있음 (`pixencrew@gmail.com`, 1:1 문의) |

신고는 기존 문의 시스템을 재활용하면 프론트 위주로 구현 가능하다.
차단은 백엔드에 차단 목록 저장 + 조회 시 필터링이 필요하다.

구현 후 `ios.buildNumber` 를 `2` 로 올려 재업로드하고, 녹화도 빌드 2로 찍을 것.
