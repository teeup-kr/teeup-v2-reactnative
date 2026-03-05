# 모임 목록 탭 단일 Fetch 최적화

## 목적
- `라운딩 모임`, `소셜 모임`, `내가 참가한 모임` 탭을 모두 **단일 API 요청(1회)** 으로 조회.
- 클라이언트 병합(클럽 모임 추가 조회), 클라이언트 재필터링(검색/날짜/상태), 클라이언트 재페이징 제거.
- 탭/필터 변경 시 요청 수 예측 가능하게 유지.

## 적용 파일
- `app/(tabs)/meetings/index.js`
- `src/lib/handler/meetings.js`
- `src/lib/api/api.js`

## 프론트 변경 상세
- `app/(tabs)/meetings/index.js`
  - 모임 목록 조회에서 `fetchClubs()` 선행 호출 제거.
  - `hasClubs`, `manageableClubIds` 상태 제거.
  - `라운딩/소셜/참여` 탭 조회를 각각 해당 API 한 번만 호출하도록 연결.
  - 클럽 미가입 전용 분기 UI 제거(목록/빈 상태 중심으로 단순화).

- `src/lib/handler/meetings.js`
  - 삭제:
    - `fetchManagedClubMeetings`
    - `dedupeMeetingsById`
    - 클라이언트 검색/날짜/상태/페이지 후처리 루프
  - 변경:
    - `createFetchRoundingMeetingsHandler`
    - `createFetchSocialMeetingsHandler`
    - `createFetchParticipatingMeetingsHandler`
  - 각 핸들러는 아래 공통 파라미터로 API 1회 호출:
    - `page`
    - `limit` (6)
    - `search`
    - `start_date`
    - `end_date`
    - `status_group` (`active` / `completed`)
  - 응답에서 `extractList(response)`로 목록, `response.total_pages`로 페이지 수 사용.

- `src/lib/api/api.js`
  - `buildMeetingListParams` 추가.
  - 아래 API 메서드가 `buildMeetingListParams`로 쿼리 파라미터를 정규화해 전송:
    - `fetchRounds`
    - `fetchSocials`
    - `fetchMyParticipatingMeetings`

## 백엔드 연동 전제
- 프론트는 목록 API가 다음 쿼리를 지원한다고 가정:
  - `status_group=active|completed`
  - `search`
  - `start_date`
  - `end_date`
  - `page`
  - `limit`
- 프론트는 응답에서 `total_pages`를 사용한다.
  - 이 필드가 없으면 기본값 `1`로 처리한다.
