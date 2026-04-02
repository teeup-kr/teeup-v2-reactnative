# 티업 v2 React Native — 전체 기술 스택 정리

> React Hook 및 상태관리 로직은 별도 문서를 참고하고, 이 문서는 프로젝트에 들어가는 **전체 기술**을 정리한 것입니다.

---

## 1. 런타임 & 프레임워크

| 구분 | 기술 | 비고 |
|------|------|------|
| **프레임워크** | React 19.1 | 함수형 컴포넌트, Hooks 기반 |
| **네이티브** | React Native 0.81.5 | 크로스 플랫폼 (Android / iOS / Web) |
| **메타프레임워크** | Expo ~54 | 빌드·설정·네이티브 모듈 통합 |
| **웹 렌더링** | react-native-web 0.21 | 웹 빌드 시 RN 컴포넌트 → DOM |
| **엔트리** | `index.js` → Expo | `main: "index.js"` (package.json) |

- **플랫폼**: `EAS_BUILD_PLATFORM`(또는 `EXPO_OS`)으로 `android` / `ios` / `web` 구분.
- **앱 설정**: `app.json` + `app.config.js`. `app.config.js`에서 `.env`와 플랫폼별 env(API URL, Google OAuth 등)를 읽어 `expo.extra`에 주입.

---

## 2. 네비게이션 & 라우팅

| 구분 | 기술 | 비고 |
|------|------|------|
| **라우터** | expo-router ~6.0 | 파일 기반 라우팅 (app/ 디렉터리) |
| **라우팅 방식** | Slot 기반 탭 + 파일 경로 | `app/(tabs)/`, `app/auth/` 등 |
| **훅** | `useRouter`, `usePathname`, `useLocalSearchParams` | expo-router 제공 |
| **히스토리 제한** | `navigateWithCap`, `recordRoute` | `@/lib/navigation/cappedHistory` (뒤로가기/스택 제한) |

- **웹**: 동일한 라우트가 URL 경로로 매핑 (예: `/app`, `/meetings`, `/clubs`).
- **Head(웹)** : `expo-router/head`의 `Head`로 `<title>`, `<meta>`, PWA manifest 링크 등 설정.

---

## 3. 상태 관리

| 구분 | 기술 | 비고 |
|------|------|------|
| **전역 상태** | React Context | `AuthContext`, `AppLayoutContext` |
| **로컬 상태** | useState / useReducer | 화면·컴포넌트 단위 |
| **부가 로직** | useCallback, useMemo, useEffect | 리렌더/비동기 제어 |
| **서버 상태** | 전용 라이브러리 없음 | `apiClient` + 수동 fetch 후 setState (TanStack Query 설치돼 있으나 미사용) |

- **AuthContext**: 로그인 유저, 토큰 갱신, 로그아웃, `refreshAuth()` 제공.
- **AppLayoutContext**: 메뉴 열림/닫힘(`isMenuOpen`, `closeMenu` 등) 등 레이아웃 UI 상태.

> 상세: Hook 사용 패턴·상태관리 로직은 별도 정리 문서 참고.

---

## 4. API & 데이터

| 구분 | 기술 | 비고 |
|------|------|------|
| **HTTP 클라이언트** | Fetch API 래퍼 | `@/lib/api/apiClient.js` |
| **API 모듈** | `@/lib/api/api.js` | authApi, clubsApi, meetingsApi, mypageApi 등 도메인별 함수 |
| **베이스 URL** | `expo.extra.apiBaseUrl` | `app.config.js` → `EXPO_PUBLIC_API_BASE_URL` + 버전 |
| **인증 부착** | Bearer Access Token | 요청 헤더 자동 첨부, 401 시 refresh 후 재시도 |
| **토큰 저장소** | `@/lib/tokenStorage` | AsyncStorage 기반, 웹/앱 공통 인터페이스 |

- **apiClient**: interceptors, refresh 로직, 에러/로그 처리, 쿼리 스트링 빌드 등 공통화.
- **플랫폼별 API URL**: `.env`에 `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_VERSION` 등으로 분리.

---

## 5. 인증

| 구분 | 기술 | 비고 |
|------|------|------|
| **일반 로그인** | 백엔드 API | 이메일/비밀번호 등 → 토큰 발급 |
| **OAuth(Google)** | react-native-app-auth | 웹/Android/iOS 각각 클라이언트 ID·리다이렉트 URI |
| **토큰** | JWT (Access + Refresh) | 저장: tokenStorage, 갱신: apiClient에서 자동 |
| **라우트 가드** | 컴포넌트/분기 | `LoginRequired`, `useAuth().isAuthenticated` 등 |

- **플랫폼별 Google 설정**: `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` / `_ANDROID` / `_IOS`, `EXPO_PUBLIC_GOOGLE_REDIRECT_URI_*` (app.config.js에서 `expo.extra.googleAuth`로 주입).

---

## 6. UI & 스타일

| 구분 | 기술 | 비고 |
|------|------|------|
| **스타일** | StyleSheet (React Native) | `StyleSheet.create()` |
| **디자인 토큰** | `@/styles/style.js` (tokens), `@/styles/colors.js` | padding, radius, spacing, font, colors |
| **공통 스타일** | `base` 객체 (style.js) | container, input, label, card 등 재사용 |
| **아이콘** | @expo/vector-icons (FontAwesome5), react-icons | 버튼·메뉴·카드 등 |
| **컴포넌트** | `@/components/ui/*`, `@/components/layout/*` | Button, Card, Modal, ScreenHeader, AppFooter, BottomNavigationBar, FullMenu 등 |
| **특수 UI** | expo-linear-gradient | 히어로/카드 그라데이션 |
| **HTML 렌더** | react-native-render-html + sanitize-html | 공지/약관 등 HTML 콘텐츠 |
| **날짜/시간** | @react-native-community/datetimepicker, @react-native-picker/picker | 날짜·시간·티타임 선택 |

- **플랫폼 분기**: `Platform.OS === 'web'` 등으로 웹 전용/앱 전용 레이아웃·푸터·Alert 대체(window.alert/confirm) 처리.

---

## 7. 플랫폼 (Web / Android / iOS)

| 구분 | 기술 | 비고 |
|------|------|------|
| **웹** | react-native-web, Metro, Expo export | 정적 웹: `npx expo export -p web` |
| **Android** | android/ (Gradle), google-services | APK/AAB 빌드, FCM용 google-services.json |
| **iOS** | app.json `ios.bundleIdentifier` | Expo 기반 (네이티브 ios/는 prebuild 시 생성) |
| **분기** | Platform.OS, EAS_BUILD_PLATFORM | 코드/빌드 시 `web` / `android` / `ios` 구분 |

- **앱 식별자**: Android `com.pixencrew.teeup`, iOS `com.pixencrew.teeup`.

---

## 8. 빌드 & 배포

| 구분 | 기술 | 비고 |
|------|------|------|
| **번들러** | Metro (Expo 기본) | JS/TS 번들 |
| **웹 개발** | `npm run web:dev` | EAS_BUILD_PLATFORM=web expo start --web |
| **웹 배포** | `npm run web:static` | EAS_BUILD_PLATFORM=web npx expo export -p web |
| **Android 개발** | `npm run android:dev` | expo run:android (디버그) |
| **Android APK** | `npm run android:release:apk` | Gradle assembleRelease |
| **Android AAB** | `npm run android:release:aab` | Play Store 업로드용 |
| **환경 변수** | .env + app.config.js | EXPO_PUBLIC_* 만 앱에 노출 |

- **경로 별칭**: babel `module-resolver`로 `@` → `./src` 매핑.

---

## 9. 분석 & 푸시

| 구분 | 기술 | 비고 |
|------|------|------|
| **웹 분석** | Google Tag Manager / GA4 (gtag) | _layout.js에서 웹일 때만 스크립트 주입 |
| **앱 푸시** | expo-notifications | FCM 연동(Android), 알림 클릭 시 딥링크 라우팅 |
| **Firebase** | google-services.json (Android) | FCM·Analytics 등 연동용, 패키지명 일치 필요 |

- 앱 스트림(GA4 Android)은 콘솔에서 별도 데이터 스트림 추가 후, 앱에서 SDK로 이벤트 전송해야 함 (현재 웹 스트림만 gtag로 설정됨).

---

## 10. 테스트 & 코드 품질

| 구분 | 기술 | 비고 |
|------|------|------|
| **테스트** | Jest, jest-expo, @testing-library/react-native | `npm run test` |
| **린트** | ESLint, eslint-config-expo | `npm run lint` / `lint:fix` |
| **타입** | @types/react (devDependencies) | 선택적 타입 참고용 |

---

## 11. 기타 라이브러리

| 패키지 | 용도 |
|--------|------|
| react-native-safe-area-context | 노치/상태바 등 세이프 영역 |
| react-native-screens | 네이티브 스크린 스택 성능 |
| react-native-url-polyfill | URLSearchParams 등 (웹/앱 호환) |
| expo-linking | 딥링크 / URL 스킴 |
| expo-device | 기기 정보 |
| react-native-reanimated-carousel | 캐러셀 UI |
| @tanstack/react-query | 설치만 되어 있음, 현재 코드에서 미사용 |

---

## 12. 파일 구조도

### 루트

```
teeup-v2-reactnative/
├── index.js              # Expo 엔트리
├── app.json              # Expo 설정 (이름, 아이콘, android/ios/web)
├── app.config.js         # 플랫폼별 env 주입 (API URL, OAuth 등)
├── babel.config.js       # preset-expo, @ → src alias
├── jest.config.js
├── jest.setup.js
├── package.json
├── tsconfig.json
├── __mocks__/            # Jest 목 (expo-constants, expo-router)
├── __tests__/            # app-quality.test.js 등
├── app/                  # 라우트 (expo-router 파일 기반)
├── public/               # 웹 정적 자산 (manifest.json, sw.js, icons 등)
├── src/                  # 소스 코드
├── android/              # 네이티브 Android (Gradle, google-services)
└── md/                   # 프로젝트 문서
```

### app/ (라우트)

```
app/
├── _layout.js            # 루트 레이아웃, SafeAreaProvider, AuthProvider, AppLayoutProvider, GTM/알림
├── login.js
├── register.js
├── register-success.js
├── terms.js
├── terms-agree.js
├── terms-agreement.js
├── faq.js
├── auth/
│   └── google/
│       └── callback.js   # Google OAuth 콜백
├── profile/
│   ├── complete.js
│   └── change-password.js
├── inquiries/
│   ├── index.js
│   ├── create.js
│   └── [inquiryId].js
├── notices/
│   ├── index.js
│   └── [noticeId].js
└── (tabs)/                # 탭 네비게이션
    ├── _layout.js         # 탭 레이아웃 (BottomNav 등)
    ├── index.js           # 탭 진입점 (index.native / index.web 분기)
    ├── index.native.js
    ├── index.web.js
    ├── app/
    │   └── index.js       # 홈(메인) 화면
    ├── clubs/
    │   ├── index.js       # 클럽 목록
    │   ├── register.js    # 클럽 등록
    │   ├── applications/
    │   │   └── [applicationId].js
    │   └── [clubId]/
    │       ├── index.js   # 클럽 상세
    │       ├── manage.js
    │       ├── members.js
    │       ├── stats.js
    │       ├── fees.js
    │       ├── activities.js
    │       ├── fees/
    │       │   ├── create.js
    │       │   └── [feeId]/edit.js
    │       ├── notices/
    │       │   ├── index.js
    │       │   ├── create.js
    │       │   └── [noticeId].js, [noticeId]/edit.js
    │       └── regulations/
    │           ├── index.js
    │           ├── create.js
    │           └── [regulationId].js, [regulationId]/edit.js
    ├── meetings/
    │   ├── index.js       # 모임 목록
    │   ├── my.js         # 내 모임
    │   ├── [meetingType]/[meetingId]/index.js   # 라운딩/소셜 모임 상세
    │   ├── [meetingId]/
    │   │   ├── expense.js
    │   │   ├── score.js
    │   │   └── stats.js
    │   ├── rounding/
    │   │   ├── create.js
    │   │   └── [meetingId]/edit.js
    │   └── social/
    │       ├── create.js
    │       └── [meetingId]/edit.js
    └── mypage/
        ├── index.js
        ├── overview.js   # 개요
        ├── edit.js       # 회원정보 수정
        ├── records.js
        ├── meetings.js
        ├── notifications.js
        ├── change-password.js
        ├── change-password-modal.js
        └── withdraw.js
```

### src/ (소스 코드)

```
src/
├── context/
│   ├── AuthContext.js      # 로그인 유저, 토큰 갱신, logout
│   └── AppLayoutContext.js # 메뉴 열림/닫힘 등 레이아웃 상태
├── styles/
│   ├── colors.js           # 색상 팔레트
│   └── style.js            # tokens, base 스타일
├── constants/
│   ├── homeConstants.js
│   ├── meetingConstants.js
│   ├── clubConstants.js
│   ├── authConstants.js
│   ├── mypageConstants.js
│   ├── noticesConstants.js
│   └── termsConstants.js
├── lib/
│   ├── api/
│   │   ├── apiClient.js    # Fetch 래퍼, refresh, interceptors
│   │   └── api.js          # authApi, clubsApi, meetingsApi, mypageApi 등
│   ├── tokenStorage.js     # AsyncStorage 기반 토큰/유저 저장
│   ├── navigation/
│   │   └── cappedHistory.js
│   ├── handler/
│   │   ├── clubs.js
│   │   ├── meetings.js
│   │   └── mypage.js
│   └── util/
│       ├── authUtils.js
│       ├── meetingUtils.js
│       ├── clubUtils.js
│       ├── mypageUtils.js
│       ├── responseUtils.js
│       ├── roundingForm.js
│       ├── socialForm.js
│       ├── noticeUtils.js
│       ├── faqUtils.js
│       └── pushToken.js
└── components/
    ├── layout/
    │   ├── AppHeader.js
    │   ├── AppFooter.js
    │   ├── BottomNavigationBar.js
    │   └── FullMenu.js
    ├── ui/
    │   ├── Button.js
    │   ├── Card.js
    │   ├── Input.js
    │   ├── Modal.js
    │   ├── ScreenHeader.js
    │   ├── DateTimeField.js
    │   ├── HtmlContent.js
    │   ├── AppToast.js
    │   ├── PaginationNav.js
    │   ├── SelectableChip.js
    │   └── StatusBadge.js
    ├── auth/
    │   └── LoginRequired.js
    ├── clubs/
    │   └── ClubCard.js
    ├── meetings/
    │   ├── MeetingCard.js
    │   ├── MeetingDateField.js
    │   ├── MeetingWorkflowStatus.js
    │   ├── SettlementManager.js
    │   ├── MySettlementView.js
    │   ├── SettlementViewModal.js
    │   ├── TeamFormationModal.js
    │   ├── TeamEditorModal.js
    │   ├── TeamFormationPreviewModal.js
    │   ├── BatchFormationModal.js
    │   ├── RoundingJoinModal.js
    │   ├── SocialJoinModal.js
    │   ├── RoundingCompleteModal.js
    │   ├── FormationHistoryModal.js
    │   └── SimpleScoreInputModal.js
    ├── mypage/
    │   ├── FormField.js
    │   ├── RecordMeetingCard.js
    │   ├── RoundingStatsCard.js
    │   ├── HoleScoreTableModal.js
    │   ├── SimpleScoreInputModal.js
    │   └── ComingSoonModal.js
    └── debug/
        └── DebugConsoleOverlay.js
```

### public/

```
public/
├── manifest.json    # PWA manifest
├── sw.js            # Service Worker (웹)
└── icons/           # 아이콘 (icon-1024.png 등, app.json에서 참조)
```

### android/ (요약)

```
android/
├── build.gradle
├── gradle.properties
└── app/
    └── build.gradle   # applicationId, react {}, signingConfigs
```

### md/ (문서)

```
md/
├── tech-stack-overview.md    # 본 문서 (기술 스택 + 파일 구조)
├── mobile-web-backend-api.md
├── mobile-web-layout-pages.md
├── mobile-web-vs-rn-report.md
├── mobile-web-vs-rn-unavoidable.md
├── rn-layout-pages.md
└── meetings-participating-tab.md
```

---

이 문서는 **Hook/상태관리 상세**를 제외한, 프로젝트 전반의 기술 스택과 파일 구조를 한 번에 보기 위한 요약입니다. 세부 동작은 각 디렉터리·파일 주석과 별도 md 문서를 참고하면 됩니다.
