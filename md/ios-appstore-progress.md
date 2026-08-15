# iOS App Store 등록 진행 상황

- **최종 업데이트**: 2026-08-15
- **작업 환경**: macOS (Darwin 25.5.0), Xcode 26.6, CocoaPods 1.17.0
- **빌드 방식**: 로컬 Xcode 아카이브 (EAS Build 미사용, `eas.json` 없음)
- **현재 상태**: ⛔ **Archive 단계에서 중단** — Apple 계정에 등록된 기기가 0대

> 같은 폴더의 `ios-app-store-guide.md`는 개발 머신이 Linux이던 시절에 작성된
> EAS Build 기준 문서라 현재 상황과 맞지 않는다. 이 문서를 기준으로 진행할 것.

---

## 1. 프로젝트 기본 정보

| 항목 | 값 |
| --- | --- |
| 번들 ID | `com.pixencrew.teeup` |
| 앱 이름 | 티업링크 |
| 버전 (`version`) | `1.0.2` |
| 빌드 번호 (`ios.buildNumber`) | `1` |
| 최소 iOS 버전 | 15.1 (`IPHONEOS_DEPLOYMENT_TARGET`) |
| Apple Team ID | `2ZJV4Y7FV5` |
| 서명 인증서 | `Apple Development: EUIJOON JUNG` (배포용은 미발급) |
| Firebase 프로젝트 번호 | `668486530275` |
| Google OAuth 프로젝트 번호 | `791884628850` (Firebase와 다름 — 의도된 구성) |

---

## 2. 완료된 작업

| # | 항목 | 결과 |
| --- | --- | --- |
| 1 | `npm ci` 의존성 설치 | ✅ 1436 패키지 |
| 2 | `npm run ios:prebuild` (prebuild + pod install) | ✅ |
| 3 | Firebase SPM ↔ static framework 충돌 수정 | ✅ `app.json` 수정 |
| 4 | Info.plist / entitlements 검증 | ✅ |
| 5 | Xcode 첫 실행 컴포넌트 설치 | ✅ `sudo xcodebuild -runFirstLaunch` |
| 6 | iOS 26.5 플랫폼 SDK 설치 (8.52GB) | ✅ `xcodebuild -downloadPlatform iOS` |
| 7 | Release 컴파일 검증 | ✅ `BUILD SUCCEEDED`, 에러 0 |
| 8 | Xcode에 Apple ID 연결 + 자동 서명 설정 | ✅ Team `2ZJV4Y7FV5` |
| 9 | App Store Connect 앱 레코드 생성 | ✅ (기존 완료) |
| 10 | APNs 인증키(.p8) → Firebase 업로드 | ✅ (기존 완료) |

### 2-1. 반드시 커밋해야 할 변경

`app.json`의 Firebase 플러그인 설정 — **iOS 빌드 필수**, Android 영향 없음:

```json
[
  "@react-native-firebase/app",
  { "ios": { "disableSPM": true } }
]
```

이 설정이 없으면 `pod install`이 다음 에러로 실패한다:

```
[react-native-firebase] SPM + static linkage is not supported (target(s): Pods-app).
```

react-native-firebase v26이 기본으로 SPM을 쓰는데, `expo-build-properties`의
`useFrameworks: "static"`과 중복 심볼 충돌을 일으키기 때문이다.
`useFrameworks: static`은 Firebase / Google Sign-In에 필요하므로 유지하고 SPM만 끈다.

### 2-2. 검증된 네이티브 설정

- entitlements: `aps-environment: development`, `com.apple.developer.applesignin: Default`
- URL Scheme: `teeup`, `com.pixencrew.teeup`, `com.googleusercontent.apps.791884628850-...`
- `GoogleService-Info.plist` → `ios/app/` 로 정상 복사됨
- `ITSAppUsesNonExemptEncryption: false` 설정됨 (수출 규정 질문 자동 통과)
- FCM 백그라운드 핸들러 미사용 → `UIBackgroundModes: remote-notification` 불필요

---

## 3. 막힌 지점

`xcodebuild archive` 실행 시:

```
error: Communication with Apple failed: Your team has no devices from which to
generate a provisioning profile.
error: No profiles for 'com.pixencrew.teeup' were found
```

### 3-1. 왜 막혔는가 (원인 사슬)

세 가지 조건이 겹쳐서 발생했다. 하나씩 보면 각각은 정상이다.

**① Expo prebuild가 Release 설정에 개발용 서명 ID를 하드코딩한다**

`ios/app.xcodeproj/project.pbxproj`의 Debug/Release 양쪽 모두에 다음이 들어간다:

```
"CODE_SIGN_IDENTITY[sdk=iphoneos*]" = "iPhone Developer";
```

Release 빌드인데도 배포용(`Apple Distribution`)이 아니라 개발용을 쓰라고 지정되어 있다.
Expo가 생성하는 기본값이며, prebuild 할 때마다 다시 이렇게 만들어진다.

**② 그래서 아카이브가 "개발용 프로파일"을 요구한다**

서명 ID가 `iPhone Developer`이므로 Xcode는 그에 맞는
**iOS App Development** 프로비저닝 프로파일을 찾는다. 없으면 자동 생성을 시도한다.

**③ 개발용 프로파일은 등록된 기기가 최소 1대 있어야 발급된다**

Apple의 규칙이다. 개발용 프로파일은 "이 기기들에서만 실행 가능"을 명시하는 문서라
기기 목록이 비면 만들 자체가 없다. 현재 계정에 등록된 기기가 0대라 여기서 실패한다.

```
Your team has no devices from which to generate a provisioning profile.
```

**핵심**: App Store 업로드 자체는 기기가 전혀 필요 없다.
배포용(App Store Connect) 프로파일은 기기 목록과 무관하기 때문이다.
그런데 ①때문에 배포용이 아닌 개발용 경로로 들어가버려서, 불필요한 기기 요구에 걸린 것이다.

### 3-2. 시도했다가 실패한 우회

`CODE_SIGN_IDENTITY="Apple Distribution"` 을 명령행 인자로 덮어써서
①을 우회하려 했으나 거부됨:

```
error: app has conflicting provisioning settings. app is automatically signed for
development, but a conflicting code signing identity Apple Distribution has been
manually specified.
```

**이유**: 현재 `CODE_SIGN_STYLE`이 자동(Automatic)이다.
자동 서명은 Xcode가 인증서·프로파일을 전적으로 관리하는 모드라,
사용자가 서명 ID를 직접 지정하는 것과 양립할 수 없다.
즉 **자동 서명을 유지하면서 서명 ID만 배포용으로 바꾸는 것은 불가능**하다.

여기서 갈 수 있는 길이 두 갈래로 나뉜다 (→ 4장 1단계의 경로 A / B):

- **경로 A** — 자동 서명 유지 + 기기 1대 등록해서 ③을 충족시킨다.
  아카이브는 개발용으로 서명되지만, 이후 export 단계에서 배포용으로 재서명되므로 문제없다.
- **경로 B** — 수동 서명으로 전환하고 배포용 프로파일을 직접 지정한다.
  ①②③을 통째로 우회하므로 기기가 필요 없다.

**주의**: `project.pbxproj`를 직접 수정해서 ①을 고치는 방법은 권하지 않는다.
`ios/`는 gitignore 대상이고 prebuild 할 때마다 재생성되므로 수정이 사라진다.
영구적으로 바꾸려면 Expo config plugin으로 처리해야 한다.

---

## 4. 남은 단계

### 0단계 — 기기 없이 지금 가능

- [ ] `app.json` Firebase `disableSPM` 설정 커밋 (2-1 참조)
- [ ] App Store Connect 메타데이터 입력
  - [ ] 앱 설명 / 키워드 / 카테고리 / 연령 등급
  - [ ] 스크린샷 (6.9", 6.5" 필수)
  - [ ] 개인정보처리방침 URL
  - [ ] App Privacy 설문 — Google/Apple 로그인, 푸시 토큰 수집 있으므로 해당
  - [ ] **심사용 테스트 계정** — 로그인 필수 앱이라 없으면 즉시 리젝

### 1단계 — 서명 해결 (택 1)

**경로 A: 기기 등록** (기기 입수 후 / 권장)

1. iPhone 또는 iPad를 Mac에 USB 연결 → Xcode가 자동 등록
   - 수동: developer.apple.com → Devices → UDID 등록
   - 기종 무관, iOS 15.1 이상이면 앱 실행 가능
   - TestFlight 테스트까지 고려하면 iPhone SE(2세대) / iPhone 8 이상 권장
2. 등록 확인 후 2단계로

**경로 B: 배포용 프로파일 수동 서명** (기기 불필요)

1. developer.apple.com → Certificates → **Apple Distribution** 인증서 생성
2. Profiles → **App Store Connect** 프로파일 생성 (`com.pixencrew.teeup`)
3. 다운로드 후 더블클릭 설치
4. 수동 서명 인자를 붙여 아카이브

### 2단계 — Archive → 업로드

```bash
cd /Users/jungeuilab/golf/teeup-v2-reactnative/ios

# 경로 A (자동 서명, 기기 등록 후)
xcodebuild -workspace app.xcworkspace -scheme app \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath ~/Desktop/teeup.xcarchive \
  -allowProvisioningUpdates archive
```

- [ ] 아카이브 생성
- [ ] `xcodebuild -exportArchive` 로 App Store용 IPA 추출
  - **확인 필요**: entitlements의 `aps-environment` 가 `development` → `production` 으로
    교체되는지. 안 되면 TestFlight/실서비스 푸시가 동작하지 않는다.
- [ ] 업로드 (Xcode Organizer 또는 CLI)
  - CLI 사용 시 App Store Connect API 키 또는 앱 암호(app-specific password) 필요

### 3단계 — TestFlight 검증 (실기기 필수)

- [ ] **Sign in with Apple** 동작 — 심사 필수 확인 항목
- [ ] **푸시 알림** 수신 — APNs production 환경 검증
- [ ] **Google 로그인** — Firebase와 OAuth 프로젝트가 분리되어 있어
      `GoogleService-Info.plist`에 `CLIENT_ID`가 없다.
      `src/lib/util/authUtils.js`에서 `iosClientId`를 env로 직접 주입하는 구조라
      iOS 실기기 확인이 특히 중요.

### 4단계 — 심사 제출

- [ ] 빌드 선택 → 제출
- [ ] 재업로드 시 `app.json`의 `ios.buildNumber` 를 매번 증가시킬 것 (현재 `1`).
      동일 번호는 App Store Connect가 거부한다.

---

## 5. 다음 세션 재개 시 체크리스트

```bash
cd /Users/jungeuilab/golf/teeup-v2-reactnative

# ios/ 폴더는 .gitignore 대상 (41행) — 없으면 재생성
ls ios || npm run ios:prebuild

# 등록된 기기 확인 (막힌 지점)
xcrun devicectl list devices

# 서명 인증서 확인 (배포용 있는지)
security find-identity -v -p codesigning
```

- `ios/` 는 git에 포함되지 않으므로 언제든 `npm run ios:prebuild` 로 재생성 가능
- 단, prebuild는 Xcode에서 설정한 Team 정보를 초기화하므로 재설정 필요
- prebuild 시 `EAS_BUILD_PLATFORM=ios` 환경변수 필수 (`app.config.js`가 이걸로 iOS용
  Google Client ID를 선택) — `npm run ios:prebuild` 스크립트에 이미 포함됨
- Xcode로 열 때는 반드시 `ios/app.xcworkspace` (`.xcodeproj` 아님)
