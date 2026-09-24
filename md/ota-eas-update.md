# OTA(EAS Update) 도입 가이드

작성일: 2026-09-24

스토어 심사 없이 JS·UI 변경을 즉시 배포하기 위한 설정. **한 번은 양 스토어에 새 빌드를 올려 심사를 받아야 하고**,
그 이후부터 JS 변경은 `eas update` 한 줄로 배포된다.

---

## 0. 지금까지 된 것 / 남은 것

| 항목 | 상태 |
| --- | --- |
| `expo-updates` 의존성 추가 | ☑ (`~29.0.20`) |
| `app.json` 에 `runtimeVersion` (`appVersion` 정책) | ☑ |
| `app.json` 에 `updates.url` | ☐ — projectId 가 있어야 하므로 `eas update:configure` 가 채운다 |
| Expo 계정 로그인 / projectId 발급 | ☐ |
| iOS 새 빌드 심사 | ☐ |
| Android 새 빌드 심사 | ☐ |

`runtimeVersion` 정책이 `appVersion` 이므로 **`expo.version` 이 같은 빌드끼리만** OTA 가 붙는다.
네이티브 변경(모듈 추가·권한 변경·SDK 업)을 하면 `version` 을 올리고 스토어 빌드를 새로 올려야 한다.

---

## 1. Expo 계정 연결 (최초 1회)

```bash
cd teeup-v2-reactnative
npx eas-cli login          # Expo 계정
npx eas-cli init           # projectId 발급 → app.json 의 extra.eas.projectId 에 기입됨
npx eas-cli update:configure   # updates.url 자동 기입 (https://u.expo.dev/<projectId>)
```

`update:configure` 는 `app.json` 만 건드린다. `ios/` 는 prebuild 가, `android/` 는 아래 2번이 반영한다.

---

## 2. 네이티브 반영

### iOS

`ios/` 는 gitignore 대상이라 prebuild 로 재생성한다.

```bash
npm run ios:prebuild
cd ios && pod install && cd ..
```

`ios/app/Supporting/Expo.plist` 에 아래가 들어갔는지 확인한다. (prebuild 가 자동 생성)

| 키 | 값 |
| --- | --- |
| `EXUpdatesEnabled` | `true` |
| `EXUpdatesURL` | `https://u.expo.dev/<projectId>` |
| `EXUpdatesRuntimeVersion` | `1.0` (= expo.version) |

> prebuild 를 돌리면 Xcode Team 설정과 `app-release.entitlements` 가 사라진다.
> `md/ios-appstore-progress.md` 의 "올바른 빌드 명령" 절차를 다시 따를 것.

### Android

`android/` 는 **저장소에 커밋되어 있어** prebuild 가 기존 수정사항을 덮을 수 있다.
`npx expo prebuild -p android` 를 돌린 뒤 **diff 를 반드시 확인**하고, 아래 meta-data 가
`android/app/src/main/AndroidManifest.xml` 의 `<application>` 안에 있어야 한다.

```xml
<meta-data android:name="expo.modules.updates.ENABLED" android:value="true"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="https://u.expo.dev/<projectId>"/>
<meta-data android:name="expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="1.0"/>
<meta-data android:name="expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH" android:value="ALWAYS"/>
```

---

## 3. 스토어 빌드 (각 1회 심사)

### iOS

`md/ios-appstore-progress.md` 의 아카이브 → export → altool 절차 그대로.
`expo.version` 1.0 유지, `ios.buildNumber` 만 올린다.

### Android

이 맥에는 **JDK·Android SDK·업로드 키스토어가 없다.** 본서버(또는 원래 빌드하던 머신)에서 진행한다.

```bash
# credentials/teeup-upload.jks 와 아래 환경변수가 필요하다
export ANDROID_UPLOAD_STORE_PASSWORD=...
export ANDROID_UPLOAD_KEY_ALIAS=...
export ANDROID_UPLOAD_KEY_PASSWORD=...

cd android && ./gradlew bundleRelease
# 산출물: android/app/build/outputs/bundle/release/app-release.aab
```

`android.versionCode` 를 올린 뒤 Play Console 에 업로드한다. (현재 3)

EAS 로 굽는 쪽이 편하면:

```bash
npx eas-cli build -p android --profile production
```

---

## 4. 이후 OTA 배포

```bash
npx eas-cli update --branch production --message "무엇을 고쳤는지"
```

- 사용자가 앱을 켤 때 새 JS 번들을 내려받아 다음 실행부터 반영된다.
- **OTA 로 되는 것**: JS/TS 로직, UI, 스타일, 번들에 포함된 이미지·폰트
- **OTA 로 안 되는 것**: 네이티브 모듈 추가·제거, 권한 변경, `app.json` 의 네이티브 설정, Expo SDK 업그레이드
- Apple 3.3.1 / Google 정책 모두 **앱의 주요 목적을 바꾸지 않는** 범위에서만 허용한다.

### 주의

- EAS Update 무료 플랜은 월간 활성 사용자 수 제한이 있다. 초과하면 유료 플랜 또는 자체 호스팅(`expo-updates` 는 임의의 URL 을 지원)으로 전환한다.
- 롤백은 `eas update:rollback` 또는 이전 업데이트를 다시 퍼블리시하는 방식으로 한다.
