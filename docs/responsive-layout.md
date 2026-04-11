# 반응형 레이아웃·스케일 규칙

## 역할 분리

- **`uiScale`**: 아이콘·버튼·radius 등 터치·컨트롤 밀도 (`computeResponsiveMetrics` → `useResponsiveMetrics`).
- **`spacingScale`**: 섹션·카드 간격. 화면이 커져도 여백이 과도해지지 않도록 `uiScale`보다 좁게 clamp.
- **레이아웃 분기**: 태블릿(`breakpoint === 'tablet'`, width ≥ `tokens.layout.breakpointTablet`)에서는 스케일만으로 부족함. `maxContentWidth`, 2열·그리드·모달 최대 폭 등으로 재배치.

## vh / vw

- 스타일에 `'80vh'`, `'100%'` 높이만으로 전역을 채우지 말고, `viewportUnits` / `metrics.vh` / **`metrics.contentVh`**(safe area 반영 콘텐츠 높이)의 **px 결과**를 사용.
- 껍데기는 `flex: 1` 우선. 히어로·모달 등 **필요한 구역만** vh 캡.

## 폰트

- 본문은 `tokens.font.*` 고정 크기 위주. 제목·캡션만 `fontTitle(..., metrics.fontScaleWeak)` 등 **약한 스케일**.
- `allowFontScaling` / 시스템 접근성 폰트는 화면별로 점검.

## 터치

- `tokens.layout.minTouchTarget`(44) 하한. `Button`·헤더·탭 등은 `hitSlop`으로 아이콘-only 보강.

## 공통 모달 (`src/components/ui/Modal.js`)

- 가로: `getContentMaxWidth` + 태블릿 시 `metrics.maxContentWidth` 캡.
- 세로: `maxContentHeightVh`(기본 80) → `metrics.contentVh(...)` px. 큰 폼은 prop으로 86~92 등 지정.

## QA 체크리스트

1. 폰 세로·가로 회전 후 홈: 히어로·퀵액션·다음 라운딩 카드 줄바꿈, `isTablet`(≥768) 경계에서 2열 전환, 배너 비율, 캐러셀 폭이 튀지 않는지.
2. 태블릿 폭(≥768): 홈·목록 탭 본문은 셸 내 가용 폭을 쓰고(`maxContentWidth`로 홈만 캡하지 않음), 퀵액션 2열·모임 카드 2열·모달 등은 여전히 `maxContentWidth` 등으로 재배치되는지 확인.
3. iOS 노치 / 홈 인디케이터: `SafeAreaView` + 모달 `contentVh`로 잘리지 않는지.
4. 안드로이드 뒤로가기·소프트 키: 하단 탭·모달 스크롤 영역.
5. 웹 리사이즈: 루트 `minHeight`·쉘 `maxWidth`와 모달 최대 높이.
6. 접근성 폰트 크게: 본문 레이아웃 붕괴 여부(주요 리스트·폼).
7. 초광폭 웹·가로 모드 폰: 홈 퀵액션 간격·카드 한 줄 길이·히어로 배너 비율이 과한지 확인; 극단적으로 무너지면 홈 전용 soft `maxWidth`(예: 1100~1200px) 도입을 후속 검토.

## 기대치

공통 UI와 폰·태블릿 **기본** 대응까지가 범위이며, 모든 화면 완전 자동 정렬은 기대하지 않음. 반복 화면은 수동 튜닝 가능.
