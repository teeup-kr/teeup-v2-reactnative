# iOS App Store 업로드 가이드

이 문서는 현재 저장소(`teeup-v2-reactnative`, Expo SDK 54 / RN 0.81.5) 기준으로
App Store Connect 업로드까지의 절차를 정리한다.

## 0. 현재 저장소 상태 진단

| 항목 | 상태 |
| --- | --- |
| 개발 머신 OS | Linux (Xcode 사용 불가) |
| `ios/` 네이티브 폴더 | 없음 (CNG / prebuild 방식) |
| `eas.json` | **없음** — 생성 필요 |
| `app.json`의 `ios` | `bundleIdentifier: com.pixencrew.teeup` 만 존재 |
| `GoogleService-Info.plist` | **없음** — Firebase iOS 앱 등록 필요 |
| `.env` | `.gitignore`에 포함 (35행) — EAS 클라우드에 안 올라감 |
| `google-services.json` | `.gitignore`에 포함 (56행) — 동일 문제 |
| npm scripts | Android용만 존재 (`android:release:aab` 등) |

**핵심 결론: 개발 머신이 Linux이므로 로컬 iOS 빌드는 불가능하다.**
선택지는 두 가지다.

- **(권장) EAS Build 클라우드 빌드** — macOS 없이 Linux에서 전 과정 수행 가능
- macOS + Xcode 장비 확보 후 `npx expo prebuild -p ios` → Xcode Archive

이 문서는 EAS Build 기준으로 작성한다.

---

## 1. 사전 준비 (계정 / 결제)

1. **Apple Developer Program 가입** — 연 $99(약 13만원), 승인까지 최대 24~48시간.
   개인이 아니라 법인 명의로 낼 경우 D-U-N-S 번호가 필요하고 수 주가 걸릴 수 있으니 먼저 시작할 것.
2. **App Store Connect에 앱 레코드 생성**
   - 번들 ID: `com.pixencrew.teeup` (Certificates, Identifiers & Profiles에서 먼저 등록)
   - Push Notifications capability를 Identifier에 체크 (앱이 `expo-notifications` 사용)
   - 앱 이름: `티업링크` (App Store 내 중복 불가 — 선점되어 있으면 변경 필요)
3. **Expo 계정** — https://expo.dev 무료 가입.

---

## 2. EAS CLI 설치 및 프로젝트 연결

`eas-cli`는 현재 설치되어 있지 않다.

```bash
cd teeup-v2-reactnative
npm i -g eas-cli          # 또는 npx eas-cli@latest 로 매번 실행
eas login
eas init                  # expo.dev 프로젝트 생성 + app.json에 extra.eas.projectId 주입
```

---

## 3. 누락된 iOS 설정 채우기

### 3-1. Firebase iOS 앱 등록

Google 로그인(`@react-native-google-signin/google-signin`)이 iOS에서 동작하려면
`GoogleService-Info.plist`가 필요하다.

1. Firebase 콘솔 → 기존 프로젝트 → iOS 앱 추가 → 번들 ID `com.pixencrew.teeup`
2. `GoogleService-Info.plist` 다운로드 → 프로젝트 루트에 배치
3. `.gitignore`에 추가 (google-services.json과 동일하게 비밀 취급)

### 3-2. `app.json`의 `ios` 블록 보강

```jsonc
"ios": {
  "bundleIdentifier": "com.pixencrew.teeup",
  "buildNumber": "1",
  "googleServicesFile": "./GoogleService-Info.plist",
  "supportsTablet": false,
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
},
```

- `buildNumber`는 업로드마다 반드시 증가해야 한다. eas.json에서 `autoIncrement`로 자동화 권장(3-4 참고).
- `ITSAppUsesNonExemptEncryption: false`를 넣지 않으면 업로드할 때마다 수출 규정 질문에 수동 응답해야 한다.

### 3-3. Google Sign-In 플러그인에 `iosUrlScheme` 지정

현재 `plugins`에 문자열로만 들어가 있어 iOS 빌드 시 URL scheme이 설정되지 않는다.

```jsonc
"plugins": [
  "expo-router",
  "expo-notifications",
  [
    "@react-native-google-signin/google-signin",
    {
      "iosUrlScheme": "com.googleusercontent.apps.<IOS_CLIENT_ID의 역순 문자열>"
    }
  ]
],
```

값은 `GoogleService-Info.plist`의 `REVERSED_CLIENT_ID` 키를 그대로 쓰면 된다.

### 3-4. `eas.json` 생성

```bash
eas build:configure -p ios
```

생성 후 아래 형태로 다듬는다.

```jsonc
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "local" },
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "env": { "EXPO_PUBLIC_API_BASE_URL": "https://..." }
    },
    "production": {
      "ios": { "autoIncrement": "buildNumber" },
      "env": { "EXPO_PUBLIC_API_BASE_URL": "https://..." }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "<Apple ID 이메일>",
        "ascAppId": "<App Store Connect 앱 ID(숫자)>",
        "appleTeamId": "<10자리 Team ID>"
      }
    }
  }
}
```

---

## 4. ⚠️ 환경변수·비밀파일 반입 (가장 흔한 실패 지점)

`app.config.js`는 빌드 시점에 `dotenv`로 `.env`를 읽는다.
그런데 `.env`와 `google-services.json`은 `.gitignore` 대상이고,
**EAS Build는 git에 추적되는 파일만 클라우드로 업로드한다.**
조치 없이 빌드하면 `⚠️ Warning: Missing env var: EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS`가 뜨면서
Google 로그인이 죽은 채로 빌드된다.

두 가지 방법 중 하나를 택한다.

**방법 A — EAS 환경변수 (권장)**

```bash
eas env:create --name EXPO_PUBLIC_API_BASE_URL   --value "https://..." --environment production
eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS    --value "..." --environment production
eas env:create --name EXPO_PUBLIC_GOOGLE_REDIRECT_URI_IOS --value "..." --environment production
eas env:create --name EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB    --value "..." --environment production
eas env:create --name EXPO_PUBLIC_WEB_ORIGIN     --value "..." --environment production
eas env:create --name EXPO_PUBLIC_API_VERSION    --value "v1"   --environment production
```

`GoogleService-Info.plist`는 파일이므로 별도 처리한다.

```bash
eas env:create --name GOOGLE_SERVICES_PLIST --type file \
  --value ./GoogleService-Info.plist --environment production --visibility secret
```

그리고 `app.json`의 `ios.googleServicesFile`을 `process.env.GOOGLE_SERVICES_PLIST` 경로로
읽도록 `app.config.js`에서 덮어쓴다.

**방법 B — `.easignore` 없이 eas.json의 `env` 블록에 직접 기입**

간단하지만 값이 git에 커밋되므로, 공개 저장소라면 쓰지 말 것.

> 참고: `app.config.js`의 `resolvePlatform()`은 `EAS_BUILD_PLATFORM`을 읽는다.
> EAS가 iOS 빌드 시 이 값을 `ios`로 자동 설정하므로 별도 조치는 필요 없다.
> `withAdiRegistration` 플러그인은 android일 때만 적용되므로 iOS에 영향 없다.

---

## 5. 자격증명(인증서 / 프로비저닝) 발급

EAS가 자동으로 처리한다. 첫 빌드 시 Apple 로그인을 요구하고
Distribution Certificate, Provisioning Profile, APNs Key를 만들어 저장한다.

```bash
eas credentials -p ios      # 수동 확인/관리가 필요할 때
```

2단계 인증(App-specific password 또는 앱 승인)이 필요하니 아이폰을 옆에 두고 진행할 것.

---

## 6. 빌드

```bash
# 내부 테스트용 (선택)
eas build -p ios --profile preview

# App Store 제출용
eas build -p ios --profile production
```

무료 플랜은 대기열이 길어 30분~수 시간 걸릴 수 있다.
완료되면 `.ipa` 아티팩트 URL이 출력된다.

---

## 7. App Store Connect 제출

```bash
eas submit -p ios --latest
```

또는 `--profile production`으로 eas.json의 submit 설정을 사용한다.
업로드 후 App Store Connect에서 처리(Processing)에 10~30분 소요된다.

---

## 8. TestFlight → 심사 제출

1. TestFlight 탭에서 빌드 확인 → 수출 규정 준수 응답(3-2에서 미리 처리했다면 생략)
2. 내부 테스터로 실기기 검증 — **특히 Google 로그인과 푸시 알림을 반드시 확인**
3. App Store 탭에서 심사 제출 시 준비물:
   - 스크린샷: 6.9"(iPhone 16 Pro Max) 및 6.5" 각 최소 3장
   - 앱 설명, 키워드, 프로모션 텍스트
   - **개인정보처리방침 URL (필수)**
   - 지원 URL
   - 연령 등급 설문
   - **심사용 데모 계정** — 로그인이 필요한 앱이므로 필수.
     `docs/reviewer-access.md`에 관련 내용이 있으니 참고할 것.

---

## 9. 예상 리젝 사유 (사전 점검)

| 항목 | 내용 |
| --- | --- |
| Guideline 5.1.1(v) | 계정 생성이 가능한 앱은 **계정 삭제 기능**을 앱 내에 제공해야 함 |
| Guideline 4.8 | Google 로그인을 제공하면 Sign in with Apple도 함께 제공해야 함 (제3자 소셜 로그인만 있을 경우) |
| Guideline 2.1 | 데모 계정 미제공 / 로그인 실패 |
| Guideline 5.1.1 | 개인정보처리방침 URL 누락, 앱 내 수집 항목과 App Privacy 신고 불일치 |

4.8 대응으로 **Sign in with Apple을 구현 완료**했다. 5.1.1(v) 계정 삭제는 기존에 구현되어 있다.

### Sign in with Apple 배포 시 필수 작업

1. **Apple Developer** → Identifiers → `com.pixencrew.teeup` → **Sign in with Apple 체크**
2. **백엔드 환경변수** 추가 — 없으면 Apple 로그인이 400으로 실패한다.
   ```
   APPLE_BUNDLE_ID=com.pixencrew.teeup
   ```
3. **DB enum 마이그레이션** — `users.provider`에 `APPLE` 값 추가 (alembic 미사용이므로 수동 실행)
   ```sql
   ALTER TABLE users
     MODIFY COLUMN provider ENUM('LOCAL','GOOGLE','APPLE') DEFAULT 'LOCAL';
   ```
4. `pip install -r requirements.txt` — `cryptography` 신규 추가(RS256 검증용)

---

## 10. 요약 체크리스트

- [ ] Apple Developer Program 가입 및 승인
- [ ] App Store Connect 앱 레코드 + Identifier(Push capability) 생성
- [ ] `eas-cli` 설치, `eas login`, `eas init`
- [ ] Firebase iOS 앱 등록 → `GoogleService-Info.plist` 배치
- [ ] `app.json` ios 블록 보강 (buildNumber / googleServicesFile / infoPlist)
- [ ] google-signin 플러그인 `iosUrlScheme` 지정
- [ ] `eas.json` 생성 및 submit 프로필 작성
- [ ] EAS 환경변수 등록 (.env가 git에 없음 — 필수)
- [ ] Sign in with Apple 도입 여부 결정
- [ ] 계정 삭제 기능 확인
- [ ] `eas build -p ios --profile production`
- [ ] `eas submit -p ios --latest`
- [ ] TestFlight 검증 → 심사 제출
