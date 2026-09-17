# App Store 심사 회신 — Submission 2e08c43d (2026-09-17)

새 빌드를 올린 뒤 App Store Connect "앱 심사에 회신"에 아래 내용을 붙여넣는다.
회신은 **새 빌드 제출과 함께** 해야 한다. 회신만 보내면 같은 빌드로 재심사되어 1번이 그대로 재현된다.

---

Thank you for the detailed review. We have addressed both issues in build 1.0 (3).

## Guideline 2.1(a) — Sign in with Apple

We reproduced the failure: the Sign In with Apple capability was not correctly provisioned in the previous build, so the native authorization sheet failed before contacting our server. We have:

- Enabled the Sign In with Apple capability for the App ID (`com.pixencrew.teeup`) and regenerated the provisioning profile.
- Rebuilt and verified Sign in with Apple end-to-end on a physical iPhone and iPad via TestFlight — the identity token is issued by Apple, verified on our server against Apple's public keys (`https://appleid.apple.com/auth/keys`), and the user is signed in.

## Guideline 2.1 — Date of birth / gender

Date of birth and gender are **optional** and are not required for registration, sign-in, or any core feature. They are used only for two optional golf-specific features:

- **Automatic team formation** for rounds, which can balance groups by age range.
- **Tee box selection** (e.g., men's / ladies' tees), which uses gender.

In the previous build, the profile screen incorrectly treated date of birth as a required field. This has been corrected: both fields are now clearly labeled as optional, and all club and round features work without them.

Reviewer account (no changes): `reviewer@teeup.run` — the password is unchanged from the previous submission.

---

## 제출 전 체크리스트 (반드시 순서대로)

1. [ ] developer.apple.com → Identifiers → `com.pixencrew.teeup` → **Sign In with Apple** 체크됨
2. [ ] `eas build -p ios --profile production` — capability 동기화 물으면 **Yes**
3. [ ] TestFlight 설치 후 **iPhone 실기기**에서 Apple 로그인 성공
4. [ ] **iPad 실기기**에서도 Apple 로그인 성공 (심사관이 iPad Air로 테스트함)
5. [ ] 서버 로그에 `POST /api/v1/auth/oauth/apple/callback` **200** 찍힘 확인
6. [ ] 마이페이지 → 수정에서 생년월일 비운 채 저장 가능한지 확인
7. [ ] 클럽 가입 시 프로필 완성 팝업이 생년월일 없이도 안 뜨는지 확인
8. [ ] 위 회신문과 함께 제출

5번은 서버에서 이렇게 확인:
```
docker compose logs backend -f | grep "oauth/apple"
```
