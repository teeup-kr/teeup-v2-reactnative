# Android Play Console 업로드 가이드

이 문서는 현재 저장소 기준으로 Android 업로드용 keystore 생성부터 AAB 생성 전 점검까지의 절차를 정리한다.

## 현재 저장소 상태

- `package.json`에 `npm run android:release:aab` 스크립트가 추가되어 있다.
- `android/app/build.gradle`의 `release`는 현재 `debug.keystore`를 사용한다.
- 루트 `.gitignore`에는 `*.jks` 규칙이 이미 있어서, 프로젝트 루트에 `.jks` 파일을 만들어도 Git 추적 대상이 아니다.
- 업로드용 keystore 연결 로직은 아직 적용되지 않았다.

## 1. 사전 준비

- JDK가 설치되어 있어야 한다.
- `keytool` 명령이 동작해야 한다.
- Play Console에 이미 같은 패키지명 `com.pixencrew.teeup`으로 업로드한 이력이 있으면, 새 keystore를 바로 사용할 수 없을 수 있다.
- 기존 업로드 키가 있으면 그 키를 계속 써야 하고, 키를 분실했으면 Play Console의 업로드 키 재설정 절차가 필요하다.

## 2. keystore 파일 위치 결정

현재 저장소에서는 두 가지 방식이 가능하다.

### 방법 A. 프로젝트 루트에 직접 생성

이 방식은 가장 단순하다.

예시 파일명:

- `teeup-upload.jks`

장점:

- 현재 위치에서 바로 생성할 수 있다.
- 루트 `.gitignore`의 `*.jks` 규칙에 의해 자동으로 무시된다.

### 방법 B. `credentials/` 디렉터리에 생성

예시 파일명:

- `credentials/teeup-upload.jks`

장점:

- 인증서 관련 파일을 한 디렉터리에 모아두기 쉽다.

주의:

- 현재 `.gitignore`에는 `credentials/`도 포함되어 있다.

## 3. keystore 생성 명령

### 프로젝트 루트에 생성하는 예시

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore teeup-upload.jks \
  -alias teeup-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### `credentials/`에 생성하는 예시

```bash
mkdir -p credentials
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore credentials/teeup-upload.jks \
  -alias teeup-upload \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

명령 실행 중 입력하게 되는 값:

- `keystore password`
- `key password`
- `first and last name`
- `organizational unit`
- `organization`
- `city or locality`
- `state or province`
- `two-letter country code`

권장 원칙:

- `alias`는 앱별로 구분 가능한 값으로 유지한다.
- `keystore password`와 `key password`는 별도로 안전하게 보관한다.
- 개인 PC 메모가 아니라 팀이 접근 가능한 보안 저장소에 함께 기록한다.

## 4. 생성된 keystore 확인

생성이 끝나면 아래 명령으로 내용을 확인할 수 있다.

```bash
keytool -list -v \
  -keystore teeup-upload.jks \
  -alias teeup-upload
```

`credentials/`에 만든 경우:

```bash
keytool -list -v \
  -keystore credentials/teeup-upload.jks \
  -alias teeup-upload
```

여기서 확인할 수 있는 정보:

- alias
- 유효기간
- SHA1
- SHA256

## 5. Git 추적 여부 확인

현재 저장소는 루트 `.gitignore`에서 아래를 이미 무시한다.

- `*.jks`
- `credentials/`

따라서 아래 두 경우 모두 별도 ignore 추가 없이 Git에 올라가지 않는다.

- `teeup-upload.jks`
- `credentials/teeup-upload.jks`

단, keystore 비밀번호를 별도 파일에 적어 둘 경우 그 파일은 반드시 추가로 Git 추적 제외해야 한다.

예:

- `android/key.properties`
- `android/signing.properties`
- `.env.local`

이 파일들은 현재 저장소에 아직 연결되어 있지 않으므로, 실제 파일명은 팀 규칙에 맞춰 정하면 된다.

## 6. 현재 프로젝트에서 반드시 바뀌어야 하는 지점

현재 `android/app/build.gradle`의 `release` 설정은 `signingConfigs.debug`를 사용한다.

즉, 지금 상태에서는:

- AAB 생성 자체는 가능할 수 있다.
- 그러나 Play Console 업로드용 release signing 상태는 아니다.

실제 업로드용으로 쓰려면 `release`가 업로드 keystore를 참조하도록 바뀌어야 한다.

정리하면 필요한 값은 아래 네 가지다.

- keystore 파일 경로
- key alias
- keystore password
- key password

이 네 값을 `android/app/build.gradle`에서 읽어 release signing에 연결해야 한다.

## 7. AAB 생성 명령

현재 저장소에서는 아래 명령으로 AAB 생성 스크립트를 실행할 수 있다.

```bash
npm run android:release:aab
```

이 스크립트는 다음 흐름으로 동작한다.

1. Expo Android prebuild 실행
2. `android` 디렉터리로 이동
3. `./gradlew :app:bundleRelease` 실행
4. 프로젝트 루트로 복귀

생성 위치:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

## 8. Play Console 업로드 전 체크

업로드 전에 반드시 확인할 항목:

- `applicationId`가 Play Console 등록 패키지명과 일치하는지
- `versionCode`가 기존 업로드보다 큰지
- release signing이 debug keystore가 아닌 업로드 keystore인지
- AAB 파일이 실제로 생성되었는지

현재 저장소 기준 확인 위치:

- 패키지명: `app.json`, `android/app/build.gradle`
- 버전 코드: `android/app/build.gradle`
- AAB 산출물: `android/app/build/outputs/bundle/release/app-release.aab`

## 9. 신규 앱과 기존 앱의 차이

### 신규 앱인 경우

- 새로 만든 keystore를 업로드 키로 사용할 수 있다.
- Play Console에서 App Signing 설정을 진행하면 된다.

### 기존 앱인 경우

- Play Console에 이미 등록된 업로드 키와 같은 키를 사용해야 한다.
- 다른 keystore를 새로 만들었다고 바로 대체되지는 않는다.
- 기존 업로드 키를 분실했다면 업로드 키 재설정 절차가 필요하다.

## 10. 현재 저장소 기준 다음 작업 순서

1. 업로드용 keystore를 생성한다.
2. keystore 경로, alias, 비밀번호를 안전한 위치에 보관한다.
3. `android/app/build.gradle`의 release signing을 업로드 keystore 기준으로 연결한다.
4. 필요하면 서명 비밀값 파일을 Git 추적 제외 처리한다.
5. `versionCode`를 확인하거나 증가시킨다.
6. `npm run android:release:aab`를 실행한다.
7. 생성된 AAB를 Play Console에 업로드한다.
