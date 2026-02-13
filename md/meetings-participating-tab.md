# 모임 목록: 내가 참가한 모임 탭 추가

## 변경 목적
- 모임 목록 화면(`app/(tabs)/meetings/index.js`)에
  `라운딩 모임`, `소셜 모임` 탭과 함께 `내가 참가한 모임` 탭을 추가.
- 기존 라운딩 모임 목록 화면의 검색/날짜/상태/페이지 UI를 동일하게 재사용.

## API 반영
- 파일: `src/lib/api/api.js`
- 추가 메서드: `meetingsApi.fetchMyParticipatingMeetings(params)`
- 호출 엔드포인트: `GET /meetings/my/participating`

요청 파라미터(백엔드 스펙 기준):
- `page`
- `limit`
- `status_filter` (optional)
- `meeting_type_filter` (optional)

## 프론트 반영
- 탭 상수 확장
  - 파일: `src/constants/meetingConstants.js`
  - `meetingTabs`에 `participating` 추가
  - `meetingValidTabs`에 `participating` 추가

- 목록 조회 핸들러 추가
  - 파일: `src/lib/handler/meetings.js`
  - `createFetchParticipatingMeetingsHandler` 추가
  - `/meetings/my/participating` 응답을 페이지 수집 후 화면 필터(검색어/날짜/상태) 적용
  - 백엔드 스펙에 `search` 파라미터가 없어 이름 검색은 클라이언트 필터로 처리

- 모임 목록 화면 연결
  - 파일: `app/(tabs)/meetings/index.js`
  - 참여 탭용 상태(목록/검색/날짜/상태/페이지) 추가
  - 탭 전환/검색/날짜/상태/페이지네이션 핸들러를 3탭(`rounding|social|participating`)으로 확장
  - 참여 탭 빈 상태에서는 생성 버튼 비노출

- 필터 유틸 확장
  - 파일: `src/lib/util/meetingUtils.js`
  - `getActiveFilters`가 참여 탭 조건을 인식하도록 확장
