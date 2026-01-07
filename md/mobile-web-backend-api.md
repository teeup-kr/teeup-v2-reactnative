# Mobile-Web ↔ Backend API Specification

## Executive Summary
- Describes the contract between `apps/mobile-web` (`src/lib/*` helpers) and the FastAPI backend in `apps/backend`.
- Mirrors the `apiClient` base URL, authentication, and CSRF handling defined in `apps/mobile-web/src/lib/api.js`.
- Groups endpoints by feature so front-end owners know which backend routers/schemas back each helper.

## 1. Base contract & headers
| Topic | Details |
| --- | --- |
| Base URL | `${VITE_API_BASE_URL || ""}/api/v1` (see `apps/mobile-web/src/lib/api.js` lines 12‑56 for `getApiBaseUrl` + Axios config). |
| Credentials | `withCredentials: true` is set, so cookies (session/CSRF) are sent. |
| Authorization | `Authorization: Bearer <access_token>` is injected from `localStorage.access_token` before every request. |
| CSRF | Every mutating request (`POST/PUT/PATCH/DELETE`) first fetches `/auth/csrf-token` (see lines 60‑90) and attaches `X-CSRF-Token`. |
| Response helpers | `api` unpacks `response.data`; `apiUtils` is the single place for message extraction. |

## 2. Authentication & session
Tracks the helpers in `apps/mobile-web/src/lib/auth.js`.

| Method | Path | Description | Request | Response |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | Local login using `email+password`. | `{ email, password }` (see `RegisterRequest`/`LoginRequest` near `apps/backend/routers/auth.py#L302` and `L143` lines). | `LoginResponse` (`access_token`, `refresh_token`, `user`, `expires_in`). |
| `POST` | `/auth/register` | Creates a local user; returns the same login payload plus tokens. | `RegisterRequest` requires `email`, `password`, `nickname`, `terms_agreement`, `privacy_*` (see `auth.py#L302-322`). | `LoginResponse`. |
| `POST` | `/auth/refresh` | Refresh access tokens using saved `refresh_token`. | `{ refresh_token }` (`TokenRefreshRequest` at `auth.py#L820`). | `TokenResponse` (`access_token`, `refresh_token`, `user`). |
| `GET` | `/auth/me` | Returns `UserResponse` (`backends/schemas.py#940-984`). | None (requires `Authorization`). | Authenticated user record. |
| `POST` | `/auth/logout` | Clears tokens server-side (mostly no-op). | None (Bearer token). | `MessageResponse`. |
| `PUT` | `/auth/change-password` | Sends `current_password`, `new_password`, `confirm_password` via query params (see `auth.js` line 56). | Query params (no body). | `204`/`MessageResponse` style. |
| `POST` | `/auth/oauth/google/callback` | Google login callback (front calls `googleLogin`). | `{ provider:"google", code, state }`. | Aliased login data (tokens + user). |
| `POST` | `/auth/verify-email`, `/auth/resend-verification`, `/auth/request-password-reset`, `/auth/reset-password`, `/auth/withdraw` | Standard verification/password flows (see `auth.js`). | Minimal payloads (`{ token }`, `{ token, new_password }`, etc.) | `MessageResponse`. |
| `GET` | `/auth/terms/{type}` | Public terms HTML used in `/lib/termsApi.js`. | `type` ∈ `service|privacy|collection|marketing`. | `{ title, content, updated_at }` (see `auth.py#L1221-1269`). |
| `GET` | `/auth/csrf-token` | Supplies CSRF token for mutating requests; invoked before every non-GET request in `api.js`. | None. | `{ csrf_token, expires_in }` (see `auth.py#L1095-1121`). |

> Tokens are persisted via `tokenManager.setTokens` (auth.js lines 65‑95), and invalidated via `tokenManager.clearTokens` plus `csrfManager.clearToken` when logout/withdraw occurs.

## 3. Club & membership management (routers/clubs.py + clubsApi.js)
`apps/mobile-web/src/lib/clubApi.js` (wrapped around `clubsApi`) drives these routes.

### 3.1 Club discovery & detail
| Method | Path | Backend schema | Notes |
| --- | --- | --- | --- |
| `GET` | `/clubs` | `PaginatedResponse[ClubResponse]` (`schemas.py#199-268`). Supports `page`, `limit`, `status_filter`, `search`. | Returns `membership_status` + `membership_role` for current user. |
| `GET` | `/clubs/my` | Same schema. Filters clubs that the requester belongs to with optional `status_filter`. |
| `GET` | `/clubs/{club_id}` | `ClubResponse`. Accepts numeric `club_id` or `display_id`. |
| `POST` | `/clubs` | Body: `ClubCreate` (`schemas.py#199-218`). Response: `ClubResponse`. Current user becomes leader automatically. |
| `PUT` | `/clubs/{club_id}` | Partially updates club via `ClubUpdate`. |
| `DELETE` | `/clubs/{club_id}` | Soft deletes; returns `MessageResponse`. |
| `GET` | `/clubs/{club_id}/membership` | `ClubMembershipResponse`. | Used to show current user's role. |

### 3.2 Applications & membership workflow
| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/clubs/register` | Creates `ClubApplication` (`schemas.py#261-316`). | Front-end `registerClubApplication`. |
| `GET` | `/clubs/applications/my` | `PaginatedResponse[ClubApplicationResponse]` for current user (see `clubsApi.js`). |
| `GET` | `/clubs/applications/{id}` | Single `ClubApplicationResponse`. |
| `PUT` | `/clubs/applications/{id}` | Updates via `ClubApplicationUpdate`. |
| `PUT` | `/clubs/applications/{id}/cancel` | Cancels application; returns `MessageResponse`. |
| `POST` | `/clubs/{club_id}/join` | Submits membership request (requires `realname`, `phone_number`, `birthdate`, `gender`). No body currently used, but front-end may attach extra profile info (handled in `updateClubJoinApplication`). |
| `PUT` | `/clubs/{club_id}/join` | Updates pending join request with profile details. |
| `DELETE` | `/clubs/{club_id}/leave` | Withdraw membership. |

### 3.3 Membership management (leaders/managers)
| Method | Path | Body | Purpose |
| --- | --- | --- | --- |
| `GET` | `/clubs/{club_id}/members` | Query `all_members`, `page`, `limit`. Returns `PaginatedResponse` of `ClubMembersResponse`. |
| `PUT` | `/clubs/{club_id}/members/{user_id}/role` | `{ role }` using `ClubRole`. |
| `DELETE` | `/clubs/{club_id}/members/{user_id}` | Remove member. |
| `POST` | `/clubs/{club_id}/members/{user_id}/approve` | Approves pending member (`MessageResponse`). |
| `POST` | `/clubs/{club_id}/members/{user_id}/reject` | Optionally include `reason`. |
| `GET/PUT` | `/clubs/{club_id}/members/{user_id}/note` | Manage `MemberNoteResponse` (`note`, `updated_at`). |
| `POST` | `/clubs/{club_id}/transfer-leadership` | Body: `new_leader_id`, optional `current_leader_new_role`. |
| `DELETE` | `/clubs/{club_id}/membership` | Cancels pending membership (front `cancelMembership`). |

### 3.4 Club financials & content
| Endpoint | Purpose | Schema |
| --- | --- | --- |
| `/clubs/{club_id}/regular-fee` (GET/PUT) | Manages `RegularFeeResponse`/`RegularFeeUpdate`. |
| `/clubs/{club_id}/fees` (GET/POST) | `ClubFeeResponse` list; create uses `ClubFeeCreate`. |
| `/clubs/{club_id}/fees/{fee_id}` (PUT/DELETE) | Updates or deletes fee items. |
| `/clubs/{club_id}/notices` (GET/POST/PUT/DELETE) | Creates notices via `ClubNoticeCreate/Update` and receives `ClubNoticeResponse`. |
| `/clubs/{club_id}/regulations` | `ClubRegulationsResponse`. Sub-endpoints cover listing, detail, create/update/delete via `ClubRegulationCreate/Update`. |
| `/upload/` | File upload used for club attachments (see `routers/upload.py#L25-125`). Returns Drive `web_view_link`. |
| `/clubs/{club_id}/active-meetings-check` | Helper for UI to disable deletion when activities exist. |
| `/meetings/clubs/{club_id}` | Retrieves all meetings for club filtered by query params. |

## 4. Meetings, rounds, and social events
### 4.1 Rounds (`routers/rounds.py` + `roundsApi`)
| Method | Path | Description | Schema |
| --- | --- | --- | --- |
| `GET` | `/rounds` | Lists Rounding meetings for member's clubs; accepts `page`, `limit`, `status`, `search`. | `PaginatedResponse[MeetingResponse]`. |
| `GET` | `/rounds/{id}` | Meeting detail (same schema). |
| `POST` | `/rounds` | Creates rounding meeting; body `RoundingMeetingCreate` (`schemas.py#526-561`). | Returns `MeetingResponse`. |
| `PUT`/`DELETE` | `/rounds/{id}` | Updates or deletes (DELETE just removes the meeting). |
| `/rounds/{id}/join` (POST) and `/rounds/{id}/leave` (DELETE) | Join/leave rounding. |
| `/rounds/{id}/participants` | List, patch status/role, or delete participant via `/rounds/{roundId}/participants/{participantId}`. | `MeetingParticipantResponse`. |
| `/rounds/{id}/teams` | GET creates team list; POST to add team. `/rounds/{id}/teams/{teamId}/members` to add/remove. |
| `/rounds/{id}/participants/{participantId}/scores` | CRUD scores; forms use `ScoreCreate/Update`. |
| `/rounds/{id}/expenses` | Expense list plus create/update/delete (goes through `expenses` router). |
| `/rounds/{meetingId}/notifications` + `/rounds/{meetingId}/reminder` | Send notifications or reminders (fire-and-forget). |

### 4.2 Meeting workflows (`routers/meeting_workflow.py`)
Mobile helpers from `api.js` call these paths:
- `POST /meetings/{meetingId}/apply` → create `MeetingParticipant` pending entry.
- `POST /meetings/{meetingId}/participants/{participantId}/approve|reject` → Accept or reject applications.
- `POST /meetings/{meetingId}/close-application` → Flags `application_closed_early`.
- `GET /meetings/{meetingId}/application-status` → Returns `MeetingResponse` + status fields.
- `POST /meetings/{meetingId}/start-team-formation` → Kicks off team creation (request body includes `TeamFormationRequest`).
- `POST /meetings/{meetingId}/teams/confirm` → Persists teams after preview.
- `POST /meetings/{meetingId}/start-rounding` and `/complete-rounding` → Transition meeting state.
- Simple scores: POST/PUT `/meetings/{meetingId}/participants/{participantId}/simple-score` using `SimpleScoreCreate/Response`.
- `POST /meetings/{meetingId}/teams/{teamId}/members/{memberId}/confirm` → Explicitly confirm team members.
- `POST /meetings/{meetingId}/complete` and `/settlement/confirm` → Mark meeting and settlement as done.
- `POST /meetings/{meetingId}/guests` + `GET /meetings/{meetingId}/guests` → Guest management (see `GuestCreate/Response` in `schemas`).

### 4.3 Settlement (`routers/meeting_settlement.py` and `routers/expenses.py`)
| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `POST` | `/meetings/{meetingId}/settlement/rounding` | Create/replace rounding settlement. Body is a flexible dict of participants and user shares (front passes result of settlement tool). |
| `GET` | `/meetings/{meetingId}/settlement/my` | Returns settlement view for current user (json built in router). |
| `POST` | `/meetings/{meetingId}/settlement/social` | Social settlement using `social_cost` breakdown (front `createEventSettlement`). |
| `GET` | `/meetings/{meetingId}/settlement` | Full settlement summary (aggregated `participants`, `expenses`). |
| `GET` | `/meetings/{meetingId}/settlement/available-participants` | Fetch eligible participants for refunds. |
| Expenses (`/expenses/meetings/{meetingId}`) and `/expenses/{meetingId}` (POST/PUT/DELETE) are used via `roundsApi.createRoundExpense`, etc. Request bodies follow `ExpenseCreate/ExpenseUpdate` (`schemas.py#1224-1244`).

### 4.4 Social events (`routers/socials.py` + `socialsApi`)
| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/socials` | Paged list of social meetings (filters same as `/rounds`). |
| `POST` | `/socials` | Creates a `SocialMeetingCreate` (see `schemas.py#647-664`). Requires `max_participants`, `social_cost`, `social_settlement_method`, `club_id`. |
| `GET` | `/socials/{id}` | Retrieve `MeetingResponse`. |
| `PUT`/`DELETE` | `/socials/{id}` | Update or cancel (cancellation POST includes `{ reason }`). |
| `/socials/{id}/join|leave` | Manage participation. |
| `/socials/{id}/cancel` | POST with `{ reason }` for cancellations. |

## 5. User profile, stats, and notifications
Covered by `usersApi`, `notificationsApi`, and `usersApi.*` helpers.

### 5.1 Profile & admin user CRUD
| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/users/profile` | Current user's `UserResponse`. |
| `PUT` | `/users/me` | Update profile via `UserUpdate` (same schema used by admin). |
| `GET` | `/users/{id}` | Admin detail view (`UserResponse`). |
| `PUT` | `/users/{id}` | Admin update any user. |
| `DELETE` | `/users/{id}` | Admin soft delete (`MessageResponse`). |
| `GET` | `/users` | Admin listing with `page`, `limit`, `role_filter`, `status_filter`, `search`, `sort_order`. Returns `PaginatedResponse[UserResponse]`. |
| `GET` | `/users/stats` | Admin-only statistics (`UserStatsResponse` at `users.py#2025`). |

### 5.2 Handicaps & scores
| Helper | Backend Path | Notes |
| --- | --- | --- |
| `getUserHandicap` | `GET /users/{id}/handicap` | `HandicapResponse` includes `initial_handicap`, `calculated_handicap`, `handicap_update_method`, `is_auto_calculated` (see `users.py#1409-1470`). |
| `updateUserHandicap` | `PUT /users/{id}/handicap` | Accepts `HandicapUpdate` (requires `average_score` or `initial_handicap`). |
| `calculateHandicap` | `GET /users/handicap/calculate/{id}` | Returns `HandicapResponse` derived from `average_score`. |
| `getUserScoreHistory` | `GET /users/{id}/score-history?limit=...` | Returns list of `ScoreHistoryResponse` (`users.py#1620-1708`). |
| `getLastMeetingResult` | `GET /users/{id}/last-meeting-result` | `MeetingResultResponse` with `gross_score`, `rank`, `handicap_used`. |
| `getMyRoundingMeetings` | `GET /users/me/rounding-meetings` | Returns paginated `RoundingMeetingItem` list plus `has_score`, `gross_score`, `net_score`. |
| `getRoundingStats` | `GET /users/me/rounding-stats` | `RoundingStatsResponse` (totals + averages). |
| `getMyMeetings` | `GET /users/my-meetings` | Filters by `status_filter`, `meeting_type_filter`, `start_date`, `end_date`; returns `PaginatedResponse` of meeting summaries. |

### 5.3 Notifications & settings
| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/users/notifications` | List with optional `page`, `limit`, `status_filter`, `type_filter` returning `NotificationResponse` (`schemas.py#1012`). |
| `PUT` | `/users/notifications/{id}/read` | Marks single notification as read. |
| `PUT` | `/users/notifications/read-all` | Bulk mark read. |
| `DELETE` | `/users/notifications/{id}` | Deletes a notification. |
| `GET` | `/users/notification-settings` | `NotificationSettingsResponse` (schema in `schemas.py#1019`). |

## 6. Content endpoints
| Feature | Path | Notes |
| --- | --- | --- |
| Notices (`noticesApi`) | `/notices` (page filters) and `/notices/{id}` | `NoticeListResponse`/`NoticeResponse` (see `routers/notices.py`). Supports `type`, `is_published`, `is_important`, `search`. |
| FAQ (`faqApi`) | `/faq`, `/faq/{id}`, `/faq-categories` | `/faq` returns `FAQPageResponse` (`schemas.py#1390-1418`), `/faq-categories` returns list of `FAQCategoryResponse`. |
| Terms (`getTerms`) | `/auth/terms/{type}` | Public terms (see above). |

## 7. Utilities & upload
- `/upload/` (multipart/form-data, `folder_type=club|notice`, optional `share=link`) uploads files to Google Drive via `routers/upload.py`. Returns `web_view_link` + metadata used by club attachments.
- `/auth/csrf-token` (see above) is invoked implicitly.
- `apiClient` interceptors log regulator-specific calls (e.g., `regulations`).

## References
- `apps/mobile-web/src/lib/api.js` (base URL, token/csrf helpers, exported API groups). 
- `apps/mobile-web/src/lib/auth.js`, `clubsApi.js` (per-feature wrappers). 
- Backend routers (`apps/backend/routers/auth.py`, `clubs.py`, `rounds.py`, `meeting_workflow.py`, `meeting_settlement.py`, `socials.py`, `users.py`, `notices.py`, `faq.py`, `upload.py`) and schemas (`apps/backend/schemas.py`) define request/response shapes.
