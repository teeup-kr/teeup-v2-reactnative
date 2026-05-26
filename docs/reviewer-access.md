# 리뷰어(심사) 전용 접근 안내

## 목적

- Google OAuth 로그인만 있는 상태에서 심사/테스트 계정이 막히는 경우를 대비해 **리뷰어 전용 로컬 계정**으로 로그인할 수 있도록 합니다.
- 앱 기능 검증(클럽/모임/기록 등)을 심사자가 끊김 없이 수행할 수 있게 합니다.

## 1) 리뷰어 계정 생성 (MySQL)

> 비밀번호는 백엔드 로직과 동일하게 `SHA-256 hex`로 저장합니다. MySQL에서는 `SHA2(..., 256)`를 사용합니다.

```sql
INSERT INTO users (
  email,
  nickname,
  phone_number,
  password,
  provider,
  status,
  needs_terms_agreement,
  terms_agreement,
  privacy_policy,
  privacy_collection,
  marketing_consent,
  created_at,
  updated_at
) VALUES (
  'reviewer@teeup.run',
  'reviewer1',
  NULL,
  SHA2('reviewer1234!', 256),
  'LOCAL',
  'ACTIVE',
  0,
  1,
  1,
  1,
  0,
  NOW(),
  NOW()
);
```

중복 확인:

```sql
SELECT id, email, nickname, phone_number, status, provider
FROM users
WHERE email='reviewer@teeup.run' OR nickname='reviewer1';
```

심사 종료 후 비활성화(추천):

```sql
UPDATE users
SET status='INACTIVE', updated_at=NOW()
WHERE email='reviewer@teeup.run';
```

## 2) 리뷰어 로그인 화면 접근(숨김 진입)

- 경로: `/reviewer-login`
- 진입 방법: 로그인 화면(`/login`)에서 **로고를 7번 탭**하면 이동합니다.

## 3) 로그인 후 검증 포인트

- 클럽 목록/클럽 상세
- 모임 목록/모임 생성/참가
- 마이페이지/기록

## 보안 운영 메모

- 리뷰어 계정 비밀번호는 심사 종료 후 즉시 교체/비활성화합니다.
- 이 문서/계정 정보는 Play Console App access에만 제공하고 외부 공유를 금지합니다.

