# Android 빌드 인계 — 업로드 키스토어 보유자용

Play Console 에 `com.pixencrew.teeup` 등록 이력이 있으므로 **기존 업로드 키스토어로만**
서명해야 한다. 새 키로 서명한 AAB 는 업로드가 거부된다.

- 코드: `teeup-v2-reactnative` / 브랜치 `RUN-75` (versionCode 4 반영 완료)
- 산출물: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 1. 빌드하는 사람에게 따로 전달해야 하는 것

저장소에 없는 파일들이다. git 에 없으니 **안전한 경로로 직접 전달**한다.

| 파일 | 왜 필요한가 | 비고 |
| --- | --- | --- |
| 업로드 키스토어 `.jks` | release 서명 | 보유자가 이미 가지고 있음 |
| 키스토어 비밀번호 3종 | 아래 환경변수 | |
| `google-services.json` | FCM 푸시. 없으면 빌드 실패 | `.gitignore:56` |
| `.env` | `EXPO_PUBLIC_*` (API 주소·구글 OAuth) | `.gitignore:35` |

키스토어는 `credentials/teeup-upload.jks` 에 놓는다 (`android/app/build.gradle:6` 이 이 경로를 본다).

---

## 2. 빌드 절차

```bash
git clone <repo> && cd teeup-v2-reactnative
git checkout RUN-75
npm ci

# 위 1번 파일들을 배치
#   ./google-services.json
#   ./.env
#   ./credentials/teeup-upload.jks

export ANDROID_UPLOAD_STORE_PASSWORD=...
export ANDROID_UPLOAD_KEY_ALIAS=...
export ANDROID_UPLOAD_KEY_PASSWORD=...

cd android && ./gradlew bundleRelease
```

산출물: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 3. 빠지기 쉬운 함정

### 3-1. 오래된 `android/` 폴더

`android/` 는 대부분 `.gitignore` 대상이지만 `build.gradle` 3개만 추적된다.
예전에 받아둔 `android/` 가 남아 있으면 그 안의 값이 섞일 수 있다.

```bash
# 확실히 하려면
grep -E '^\s+versionCode' android/app/build.gradle   # 4 여야 한다
```

`npx expo prebuild -p android --clean` 을 돌리면 `app.json` 기준으로 재생성된다
(`app.json` 도 versionCode 4).

### 3-2. EAS 로 빌드하면 versionCode 가 달라진다

`eas.json` 이 `appVersionSource: "remote"` 라서 **EAS 빌드는 `app.json` 의 versionCode 를 무시**하고
자체 원격 카운터를 쓴다. 그런데 현재 원격 카운터가 비어 있다.

```
$ eas build:version:get -p android
No remote versions are configured for this project.
```

이 상태로 `eas build -p android --profile production` 을 돌리면 versionCode 가 1 부터
시작해 **Play 업로드가 거부된다.** EAS 로 굽는다면 먼저 원격 버전을 맞춰야 한다.

```bash
eas build:version:set -p android     # 대화형으로 현재 값 지정
```

**로컬 gradle 빌드(2번)는 이 문제가 없다.** 키스토어 보유자가 로컬에서 굽는 쪽을 권장한다.

### 3-3. EAS 에는 Android 자격증명이 없다

```
androidAppCredentials: []
```

EAS 로 빌드하면 EAS 가 **새 키스토어를 만들려 든다.** 기존 업로드 키를 써야 하므로
EAS 를 쓸 거면 `eas credentials` 로 기존 `.jks` 를 먼저 등록해야 한다.

---

## 4. 업로드 후

Play Console → 프로덕션(또는 내부 테스트) → 새 버전 만들기 → AAB 업로드.

versionCode 가 기존 최고값보다 커야 한다. 현재 저장소는 4 이며,
Play 에 이미 4 이상이 올라가 있다면 그보다 높은 값으로 다시 올려야 한다.
