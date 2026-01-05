import React, { useState } from 'react';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';

const TeamFormationModal = ({ isOpen, onClose, onFormTeams, meeting, processing, onOpenBatch }) => {
  const [guests, setGuests] = useState([]);
  const [guestForm, setGuestForm] = useState({
    name: '',
    birthdate: '',
    gender: '',
    handicap: '',
    average_score: ''
  });
  const [errors, setErrors] = useState({});
  const [showGuestForm, setShowGuestForm] = useState(false);
  
  // 유효한 formation_mode 값 검증 함수
  const isValidFormationMode = (mode) => {
    const validModes = [
      'GENDER_SEPARATED_HANDICAP',
      'GENDER_SEPARATED_PREVIOUS_RECORD',
      'GENDER_SEPARATED_RANDOM',
      'GENDER_MIXED_HANDICAP',
      'GENDER_MIXED_PREVIOUS_RECORD',
      'GENDER_MIXED_RANDOM'
    ];
    return validModes.includes(mode);
  };
  
  // 편성 조건 선택
  const [formationMode, setFormationMode] = useState(
    (meeting?.team_formation_mode && isValidFormationMode(meeting.team_formation_mode))
      ? meeting.team_formation_mode
      : 'GENDER_MIXED_HANDICAP'
  );
  const [teamSize, setTeamSize] = useState(
    meeting?.team_size && meeting?.team_size !== 3 ? meeting.team_size : 4
  );

  // 만 14세 미만 입력 방지를 위한 최대 선택 가능 생년월일 (오늘 기준 14년 전)
  const maxBirthdate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 14);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  // 편성 모드 옵션
  const formationModeOptions = [
    { value: 'GENDER_SEPARATED_HANDICAP', label: '성별 분리 + 핸디캡 기준' },
    { value: 'GENDER_SEPARATED_PREVIOUS_RECORD', label: '성별 분리 + 직전대회 성적 기준' },
    { value: 'GENDER_SEPARATED_RANDOM', label: '성별 분리 + 랜덤' },
    { value: 'GENDER_MIXED_HANDICAP', label: '성별 혼합 + 핸디캡 기준' },
    { value: 'GENDER_MIXED_PREVIOUS_RECORD', label: '성별 혼합 + 직전대회 성적 기준' },
    { value: 'GENDER_MIXED_RANDOM', label: '성별 혼합 + 랜덤' }
  ];

  if (!isOpen) return null;

  // 게스트 추가 폼 검증
  const validateGuestForm = () => {
    const newErrors = {};

    // 이름 검증
    if (!guestForm.name || guestForm.name.trim() === '') {
      newErrors.name = '게스트 이름을 입력해주세요.';
    } else if (guestForm.name.trim().length > 255) {
      newErrors.name = '이름은 255자 이하여야 합니다.';
    }

    // 생년월일 검증 (클럽 가입과 동일)
    if (!guestForm.birthdate || guestForm.birthdate.trim() === '') {
      newErrors.birthdate = '생년월일을 선택해주세요.';
    } else {
      try {
        const birth = new Date(guestForm.birthdate);
        if (isNaN(birth.getTime())) {
          newErrors.birthdate = '올바른 생년월일을 입력해주세요.';
        } else {
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
          if (age < 14) {
            newErrors.birthdate = '만 14세 이상만 가입할 수 있습니다.';
          }
          if (birth.getFullYear() < 1900) {
            newErrors.birthdate = '올바른 생년월일을 입력해주세요.';
          }
          if (birth > today) {
            newErrors.birthdate = '생년월일은 미래 날짜일 수 없습니다.';
          }
        }
      } catch (e) {
        newErrors.birthdate = '올바른 생년월일을 입력해주세요.';
      }
    }

    // 성별 검증
    if (!guestForm.gender) {
      newErrors.gender = '성별을 선택해주세요.';
    } else if (guestForm.gender !== 'MALE' && guestForm.gender !== 'FEMALE') {
      newErrors.gender = '성별은 남성 또는 여성만 선택할 수 있습니다.';
    }

    // 핸디캡 또는 평균 타수 중 하나는 필수
    const hasHandicap = guestForm.handicap && guestForm.handicap.trim() !== '';
    const hasAverageScore = guestForm.average_score && guestForm.average_score.trim() !== '';

    if (!hasHandicap && !hasAverageScore) {
      newErrors.handicap = '핸디캡 또는 평균 타수 중 하나를 입력해주세요.';
    }

    // 핸디캡 검증 (입력된 경우)
    if (hasHandicap) {
      const handicapNum = Number(guestForm.handicap);
      if (isNaN(handicapNum) || handicapNum < 0 || handicapNum > 72) {
        newErrors.handicap = '핸디캡은 0-72 사이의 숫자여야 합니다.';
      }
    }

    // 평균 타수 검증 (입력된 경우)
    if (hasAverageScore) {
      const avgScoreNum = Number(guestForm.average_score);
      if (isNaN(avgScoreNum) || avgScoreNum < 55 || avgScoreNum > 144) {
        newErrors.average_score = '평균 타수는 55-144 사이의 숫자여야 합니다.';
      }
    }

    return newErrors;
  };

  // 게스트 추가
  const handleAddGuest = () => {
    const validationErrors = validateGuestForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newGuest = {
      id: Date.now().toString(),
      name: guestForm.name.trim(),
      birthdate: guestForm.birthdate,
      gender: guestForm.gender,
      handicap: guestForm.handicap ? parseFloat(guestForm.handicap) : null,
      average_score: guestForm.average_score ? parseInt(guestForm.average_score) : null
    };

    setGuests([...guests, newGuest]);
    setGuestForm({
      name: '',
      birthdate: '',
      gender: '',
      handicap: '',
      average_score: ''
    });
    setErrors({});
    setShowGuestForm(false);
  };

  // 게스트 삭제
  const handleRemoveGuest = (guestId) => {
    setGuests(guests.filter(g => g.id !== guestId));
  };

  // 숫자 입력만 허용
  const handleNumberChange = (field, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setGuestForm(prev => ({ ...prev, [field]: numericValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 편성 조건 검증
  const validateFormationSettings = () => {
    const newErrors = {};
    if (!formationMode) {
      newErrors.formationMode = '편성 모드를 선택해주세요.';
    }
    if (!teamSize || teamSize < 3 || teamSize > 4) {
      newErrors.teamSize = '팀 크기는 3-4명 사이여야 합니다.';
    }
    return newErrors;
  };

  // 팀 편성 실행 (미리보기용)
  const handleFormTeams = async () => {
    const validationErrors = validateFormationSettings();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...validationErrors }));
      return;
    }

    // 편성 조건을 부모 컴포넌트로 전달 (미리보기용)
    await onFormTeams({
      formation_mode: formationMode,
      team_size: teamSize,
      guests: undefined,
      preview: true // 미리보기 플래그
    });
  };

  // 모달 닫기
  const handleClose = () => {
    // setGuests([]); 제거 - 게스트 목록 유지 (모달을 다시 열 때도 유지)
    setGuestForm({
      name: '',
      birthdate: '',
      gender: '',
      handicap: '',
      average_score: ''
    });
    setErrors({});
    setShowGuestForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-3 sm:mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
            팀 편성 시작
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 sm:p-2"
            disabled={processing}
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 편성 조건 선택 */}
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">
              편성 모드 <span className="text-red-500">*</span>
            </label>
            <select
              value={formationMode}
              onChange={(e) => {
                setFormationMode(e.target.value);
                if (errors.formationMode) {
                  setErrors(prev => ({ ...prev, formationMode: '' }));
                }
              }}
              className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.formationMode ? 'border-red-300' : 'border-neutral-300'
              }`}
            >
              {formationModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.formationMode && (
              <p className="mt-1 text-[10px] sm:text-xs text-red-600">{errors.formationMode}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-neutral-700 mb-1.5 sm:mb-2">
              팀 크기 <span className="text-red-500">*</span>
            </label>
            <select
              value={teamSize}
              onChange={(e) => {
                setTeamSize(Number(e.target.value));
                if (errors.teamSize) {
                  setErrors(prev => ({ ...prev, teamSize: '' }));
                }
              }}
              className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.teamSize ? 'border-red-300' : 'border-neutral-300'
              }`}
            >
              <option value={4}>4명</option>
              <option value={3}>3명</option>
            </select>
            {errors.teamSize && (
              <p className="mt-1 text-[10px] sm:text-xs text-red-600">{errors.teamSize}</p>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-1.5 sm:gap-2 mt-4 sm:mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 font-medium"
            disabled={processing}
          >
            취소
          </button>
          {onOpenBatch && (
            <button
              type="button"
              onClick={onOpenBatch}
              className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={processing}
            >
              일괄 편성
            </button>
          )}
          <button
            type="button"
            onClick={handleFormTeams}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={processing || !formationMode || !teamSize}
          >
            {processing ? '처리 중...' : '편성 실행'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamFormationModal;

