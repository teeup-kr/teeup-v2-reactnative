import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  FaCheck,
  FaClipboardList,
  FaCalendarCheck,
  FaUsersCog,
  FaHandshake,
  FaTools,
  FaFlagCheckered,
  FaGolfBall
} from 'react-icons/fa';

const STEP_CONFIG = [
  { key: 'CREATED', label: '모임 생성', icon: FaClipboardList },
  { key: 'PARTICIPANTS_JOINED', label: '참가자 모집', icon: FaUsersCog },
  { key: 'TEAM_FORMATION', label: '팀 편성', icon: FaTools },
  { key: 'COMPLETED', label: '모임 진행', icon: FaCalendarCheck },
  { key: 'ROUNDING_COMPLETED', label: '라운딩 종료', icon: FaFlagCheckered },
  { key: 'SETTLEMENT_CONFIRMED', label: '정산 완료', icon: FaHandshake },
];

const MeetingWorkflowStatus = ({
  meeting,
  participants,
  teams,
  userRole,
  applicationStatus,
  confirmedParticipants = [],
  isApplicationDeadlinePassed = false,
  isApplicationClosedEarly = false,
  onCloseApplicationEarly,
  onAutoFormTeams,
  onConfirmTeamFormation,
  onStartRounding,
  onCompleteRounding,
  onCompleteMeeting,
}) => {
  const navigate = useNavigate();
  const isManager = userRole === 'ORGANIZER' || userRole === 'HOST';

  const workflowState = useMemo(() => {
    if (!meeting) {
      return 'CREATED';
    }

    if (meeting.status === 'CANCELED') {
      return 'CANCELED';
    }

    if (meeting.settlement_confirmed) {
      return 'SETTLEMENT_CONFIRMED';
    }

    // rounding_completed_at이 설정되면 "라운딩 종료" 상태로 표시
    if (meeting.rounding_completed_at) {
      return 'ROUNDING_COMPLETED';
    }

    // rounding_started_at이 설정되면 "모임 진행" 상태로 표시
    if (meeting.rounding_started_at) {
      return 'COMPLETED'; // STEP_CONFIG에서 "모임 진행"으로 표시됨
    }

    if (meeting.is_completed) {
      return 'COMPLETED';
    }

    if (teams.length > 0) {
      return 'TEAM_FORMED';
    }

    const isClosed =
      meeting.application_closed_early ||
      (meeting.application_deadline &&
        new Date(meeting.application_deadline) < new Date());

    if (isClosed) {
      return 'TEAM_FORMATION_READY';
    }

    if (participants.length >= 1) {
      return 'PARTICIPANTS_JOINED';
    }

    return 'CREATED';
  }, [meeting, participants, teams]);

  const isApplicationOpen = useMemo(() => {
    if (!meeting) return false;
    if (meeting.application_closed_early) return false;
    if (!meeting.application_deadline) return true;
    return new Date(meeting.application_deadline) > new Date();
  }, [meeting]);

  const renderStep = (step, index) => {
    const Icon = step.icon;
    const currentIndex = STEP_CONFIG.findIndex((config) => config.key === step.key);
    const workflowIndex = (() => {
      switch (workflowState) {
        case 'CREATED':
          return 0;
        case 'PARTICIPANTS_JOINED':
          return 1;
        case 'TEAM_FORMATION_READY':
        case 'TEAM_FORMED':
          return 2;
        case 'COMPLETED':
          return 3;
        case 'ROUNDING_COMPLETED':
          return 4;
        case 'SETTLEMENT_CONFIRMED':
          return 5;
        default:
          return 0;
      }
    })();

    const isCompleted = index < workflowIndex;
    const isActive = index === workflowIndex;

    const baseClasses =
      'flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-lg border transition-colors';
    const stateClasses = isActive
      ? 'border-primary-500 bg-primary-50 text-primary-700'
      : isCompleted
        ? 'border-green-500 bg-green-50 text-green-700'
        : 'border-neutral-200 bg-neutral-50 text-neutral-500';

    return (
      <div key={step.key} className={`${baseClasses} ${stateClasses}`}>
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white shadow-sm flex-shrink-0">
          {isCompleted ? <FaCheck className="text-green-600 h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-semibold">{step.label}</div>
          {isActive && (
            <div className="text-[10px] sm:text-xs text-neutral-500">현재 단계</div>
          )}
        </div>
      </div>
    );
  };

  const renderActionButtons = () => {
    if (!meeting) return null;

    const buttons = [];
    const buttonBase =
      'flex items-center gap-1.5 sm:gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    // 신청이 마감된 경우에만 팀 자동 편성 버튼 표시 (라운딩 모임만, 매니저만)
    const isApplicationClosed = !isApplicationOpen;
    const isRoundingMeeting = meeting?.meeting_type === 'ROUND' || meeting?.meeting_type === 'ROUNDING';
    const confirmedCount = participants.filter((p) => p.status === 'CONFIRMED').length;
    const canAutoFormTeams =
      isRoundingMeeting &&
      isApplicationClosed &&
      (workflowState === 'PARTICIPANTS_JOINED' ||
        workflowState === 'TEAM_FORMATION_READY') &&
      confirmedCount >= 4;

    if (isManager && isRoundingMeeting && isApplicationClosed && workflowState !== 'TEAM_FORMED' && workflowState !== 'COMPLETED' && workflowState !== 'SETTLEMENT_CONFIRMED') {
      buttons.push(
        <button
          key="auto-form-teams"
          type="button"
          onClick={onAutoFormTeams}
          disabled={!canAutoFormTeams}
          className={`${buttonBase} ${canAutoFormTeams
            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
            : 'cursor-not-allowed bg-neutral-200 text-neutral-500'
            }`}
        >
          팀 편성 시작
        </button>,
      );
    }

    // 기록 입력하기 버튼 (라운딩 종료 후, 모든 참가자에게 표시)
    if (isRoundingMeeting && meeting.rounding_completed_at) {
      buttons.push(
        <button
          key="input-records"
          type="button"
          onClick={() => {
            navigate('/mypage#records');
          }}
          className={`${buttonBase} bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500`}
        >
          <FaGolfBall className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          기록 입력하기
        </button>,
      );
    }

    // 매니저 전용 버튼들
    if (isManager) {
      if (workflowState === 'TEAM_FORMED' && teams.length > 0) {
        buttons.push(
          <button
            key="confirm-teams"
            type="button"
            onClick={onConfirmTeamFormation}
            className={`${buttonBase} bg-green-600 text-white hover:bg-green-700 focus:ring-green-500`}
          >
            팀 편성 확정
          </button>,
        );
      }

      const meetingTimePassed =
        meeting?.meeting_time && new Date(meeting.meeting_time) < new Date();

      // 모임 진행하기 버튼 (라운딩 모임만, 팀 편성 확정 후, 모임 진행 시작 전, 모임 일자가 지나지 않았을 때만)
      if (isRoundingMeeting && meeting?.team_formation_confirmed_at && !meeting?.rounding_started_at && !meetingTimePassed && onStartRounding) {
        buttons.push(
          <button
            key="start-rounding"
            type="button"
            onClick={onStartRounding}
            className={`${buttonBase} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`}
          >
            모임 진행하기
          </button>,
        );
      }

      // 라운딩 종료 버튼 (라운딩 모임만, 모임 진행 중, 아직 종료되지 않았을 때)
      if (isRoundingMeeting && meeting?.rounding_started_at && !meeting?.rounding_completed_at && onCompleteRounding) {
        buttons.push(
          <button
            key="complete-rounding"
            type="button"
            onClick={onCompleteRounding}
            className={`${buttonBase} bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500`}
          >
            라운딩 종료
          </button>,
        );
      }

      if (workflowState === 'TEAM_FORMED' && meetingTimePassed) {
        buttons.push(
          <button
            key="complete-meeting"
            type="button"
            onClick={onCompleteMeeting}
            className={`${buttonBase} bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500`}
          >
            모임 완료
          </button>,
        );
      }
    }

    if (buttons.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {buttons}
      </div>
    );
  };

  if (workflowState === 'CANCELED') {
    return null;
  }

  // 참가신청 마감 완료 조건 확인
  const isApplicationClosed = isApplicationDeadlinePassed || isApplicationClosedEarly;
  // 인원 미달 조건 확인
  const shouldShowCancellationNotice =
    isApplicationClosed &&
    confirmedParticipants.length >= 1 &&
    confirmedParticipants.length <= 3;

  return (
    <div className="space-y-4 sm:space-y-6 rounded-xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900">모임 진행 상황</h3>
        <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-neutral-500">
          모집 마감에서 정산 확정까지 모임 진행 현황을 확인하세요.
        </p>
      </div>

      {shouldShowCancellationNotice && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6 text-xs sm:text-sm text-red-700">
          <h3 className="text-sm sm:text-base font-semibold text-red-800">모임 취소 안내</h3>
          <p className="mt-1.5 sm:mt-2">
            참가인원 미달로 모임이 취소되었습니다. 팀편성 및 정산을 진행할 수 없습니다.
          </p>
        </div>
      )}

      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {STEP_CONFIG.map((step, index) => renderStep(step, index))}
      </div>

      <div className="rounded-lg bg-neutral-50 p-3 sm:p-4">
        <dl className="grid gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-700 md:grid-cols-2">
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">참가 신청</dt>
            <dd className={isApplicationOpen ? 'font-semibold text-green-600' : 'font-semibold text-red-600'}>
              {isApplicationOpen ? '진행 중' : '마감됨'}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">현재 참가자</dt>
            <dd className="font-semibold text-neutral-900">
              {participants.length}명
              {meeting?.max_participants ? ` / ${meeting.max_participants}명` : ''}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">확정 팀</dt>
            <dd className={teams.length > 0 ? 'font-semibold text-green-600' : 'font-semibold text-neutral-900'}>
              {teams.length > 0 ? `${teams.length}팀` : '미정'}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500">모임 상태</dt>
            <dd className={
              shouldShowCancellationNotice || meeting?.status === 'CANCELED'
                ? 'font-semibold text-red-600'
                : meeting?.settlement_confirmed
                ? 'font-semibold text-green-600'
                : meeting?.rounding_completed_at
                ? 'font-semibold text-orange-600'
                : meeting?.rounding_started_at
                ? 'font-semibold text-blue-600'
                : meeting?.is_completed
                ? 'font-semibold text-green-600'
                : 'font-semibold text-blue-600'
            }>
              {shouldShowCancellationNotice || meeting?.status === 'CANCELED'
                ? '취소됨'
                : meeting?.settlement_confirmed
                ? '정산 완료'
                : meeting?.rounding_completed_at
                ? '라운딩 종료'
                : meeting?.rounding_started_at
                ? '진행 중'
                : meeting?.is_completed
                ? '완료'
                : '진행 중'}
            </dd>
          </div>
        </dl>
        {meeting?.application_deadline && (
          <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-blue-600">
            <strong>참가 신청 마감:</strong>{' '}
            {new Date(meeting.application_deadline).toLocaleString('ko-KR')}
          </p>
        )}
      </div>

      {renderActionButtons()}

      {applicationStatus && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
          <h4 className="text-xs sm:text-sm font-semibold text-neutral-900">
            참가 신청 현황
          </h4>
          <dl className="mt-2 sm:mt-3 grid gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-neutral-600 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <dt>전체 신청</dt>
              <dd className="font-semibold text-neutral-900">
                {applicationStatus.total_applications ?? '-'}명
              </dd>
            </div>
            {/* 대기 인원 제거 - 참가 신청은 바로 확정됨 */}
            <div className="flex items-center justify-between">
              <dt>확정 인원</dt>
              <dd className="font-semibold text-green-600">
                {applicationStatus.confirmed_count ?? '-'}명
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>정원</dt>
              <dd className="font-semibold text-neutral-900">
                {applicationStatus.max_participants ?? '-'}명
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
};

MeetingWorkflowStatus.propTypes = {
  meeting: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    meeting_type: PropTypes.oneOf(['ROUND', 'SOCIAL']).isRequired,
    meeting_time: PropTypes.string.isRequired,
    application_deadline: PropTypes.string,
    application_closed_early: PropTypes.bool,
    team_formation_mode: PropTypes.string,
    team_size: PropTypes.number,
    is_completed: PropTypes.bool,
    settlement_confirmed: PropTypes.bool,
    status: PropTypes.string,
    team_formation_confirmed_at: PropTypes.string,
    rounding_started_at: PropTypes.string,
    rounding_completed_at: PropTypes.string,
  }),
  participants: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string,
  })),
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      members: PropTypes.arrayOf(PropTypes.object),
    }),
  ),
  confirmedParticipants: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string,
  })),
  isApplicationDeadlinePassed: PropTypes.bool,
  isApplicationClosedEarly: PropTypes.bool,
  userRole: PropTypes.oneOf(['ORGANIZER', 'PARTICIPANT', 'HOST', 'ATTENDEE']).isRequired,
  applicationStatus: PropTypes.shape({
    total_applications: PropTypes.number,
    pending_count: PropTypes.number,
    confirmed_count: PropTypes.number,
    max_participants: PropTypes.number,
    application_closed_early: PropTypes.bool,
    application_deadline: PropTypes.string,
  }),
  onCloseApplicationEarly: PropTypes.func.isRequired,
  onAutoFormTeams: PropTypes.func.isRequired,
  onConfirmTeamFormation: PropTypes.func.isRequired,
  onStartRounding: PropTypes.func,
  onCompleteRounding: PropTypes.func,
  onCompleteMeeting: PropTypes.func.isRequired,
};

MeetingWorkflowStatus.defaultProps = {
  meeting: null,
  participants: [],
  teams: [],
  applicationStatus: null,
};

export default MeetingWorkflowStatus;

