import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaGolfBall, FaArrowLeft, FaCheck, FaPlus, FaTrash, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaDollarSign, FaExclamationTriangle } from 'react-icons/fa';
import { clubsApi, roundsApi } from '../../lib';
import { useAuth } from '../../hooks/useAuth';

const RoundingForm = ({ mode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const routeMeetingId = params.meetingId;
  const derivedMode = mode || (routeMeetingId ? 'edit' : 'create');
  const isEditMode = derivedMode === 'edit';
  const meetingId = routeMeetingId;
  const initialMeeting = location.state?.meeting;
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMeetingName, setCreatedMeetingName] = useState('');
  const [clubs, setClubs] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [showDeadlinePassedModal, setShowDeadlinePassedModal] = useState(false);
  const [showPermissionDeniedModal, setShowPermissionDeniedModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmCancelModal, setConfirmCancelModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [meetingData, setMeetingData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    meeting_time: '',
    application_deadline: '',
    team_formation_mode: 'GENDER_SEPARATED',
    team_size: '',
    tee_times: [''],
    max_participants: '',
    meeting_subtype: 'REGULAR',
    total_cost: 0,
    green_fee: '',
    caddy_fee: '',
    cart_fee: '',
    settlement_method: 'EQUAL_SPLIT',
    course_name: '',
    hole_count: 18,
    reservation_name: '',
    club_id: ''
  });

  const fieldLabelMap = {
    name: '모임명',
    description: '설명',
    location: '장소',
    meeting_time: '모임 시간',
    application_deadline: '신청 마감일',
    tee_times: '티타임',
    max_participants: '최대 참가자 수',
    meeting_type: '모임 유형',
    meeting_subtype: '모임 하위 유형',
    total_cost: '총 비용',
    green_fee: '그린피',
    caddy_fee: '캐디피',
    cart_fee: '카트비',
    settlement_method: '정산 방식',
    course_name: '골프장명',
    hole_count: '홀 수',
    reservation_name: '예약자명',
    team_formation_mode: '팀 구성 방식',
    team_size: '한 조당 인원 수',
    club_id: '클럽',
  };

  const translateFieldLabel = (key) => fieldLabelMap[key] || key;

  // KST ISO 문자열을 datetime-local 형식으로 변환 (수정 모드용)
  const toDateTimeLocalValue = (value) => {
    if (!value) return '';
    const safeValue =
      typeof value === 'string' && value.includes(' ')
        ? value.replace(' ', 'T')
        : value;
    const date = new Date(safeValue);
    if (Number.isNaN(date.getTime())) return '';
    // 한국 시간으로 저장되어 있으므로 로컬 시간을 그대로 사용
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatErrorMessage = (error, fallbackMessage) => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const locSegments = Array.isArray(item.loc) ? item.loc.filter((segment) => !['body', 'query', 'path'].includes(segment)) : [];
          const fieldKey = locSegments[locSegments.length - 1];
          const fieldLabel = translateFieldLabel(fieldKey);
          const message = item.msg || item.message || item.type || '';
          if (!message) {
            return null;
          }
          if (fieldLabel) {
            return `${fieldLabel}: ${message}`;
          }
          if (locSegments.length > 0) {
            return `${locSegments.join(' > ')}: ${message}`;
          }
          return message;
        })
        .filter(Boolean)
        .join('\n');
    }
    if (typeof detail === 'string') {
      return detail;
    }
    if (detail && typeof detail === 'object') {
      return detail.msg || detail.message || JSON.stringify(detail);
    }
    if (error?.message) {
      if (error.message === 'Network Error') {
        return '네트워크 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      return error.message;
    }
    return fallbackMessage;
  };

  const openErrorModal = (message) => {
    const text = typeof message === 'string' ? message : JSON.stringify(message);
    setErrorModal({ visible: true, message: text });
  };

  const closeErrorModal = () => {
    setErrorModal({ visible: false, message: '' });
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty && !showSuccessModal) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, showSuccessModal]);

  const getNowLocalISO = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // 날짜/시간이 과거인지 확인하는 함수
  const isPastDateTime = (value) => {
    if (!value) return false;
    try {
      // 백엔드에서 한국 시간(KST)으로 저장되어 있으므로 로컬 타임존으로 해석 (한국에서 실행하면 KST)
      const deadlineDate = new Date(value);
      if (Number.isNaN(deadlineDate.getTime())) return false;
      
      // 현재 시간을 가져옴 (로컬 타임존, 한국에서 실행하면 KST)
      const now = new Date();
      
      return deadlineDate < now;
    } catch (error) {
      console.error('날짜 비교 오류:', error);
      return false;
    }
  };

  // datetime-local 값을 한국 시간 ISO 문자열로 변환 (+09:00 타임존 추가)
  const convertToKST = (localDateTimeString) => {
    if (!localDateTimeString) return undefined;
    // 타임존 정보 추가: +09:00 (한국 시간)
    return localDateTimeString + ':00+09:00';
  };

  const validateFutureDate = (value, field, clearError) => {
    if (!value) return { valid: false, adjusted: '' };
    const selectedDate = new Date(value);
    const now = new Date();
    if (selectedDate < now) {
      showFieldError(field, '현재 시점 이후로만 선택할 수 있습니다.');
      return { valid: false, adjusted: getNowLocalISO() };
    }
    // 검증 통과 시 에러 제거
    if (clearError) clearError(field);
    return { valid: true, adjusted: value };
  };

  const preventManualInput = (event) => {
    const allowedKeys = ['Tab', 'Shift', 'Escape', 'Enter'];
    if (!allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  };

const syncMeetingWithDeadline = (deadlineValue, currentMeeting, updateFn, showError) => {
  if (!deadlineValue || !currentMeeting) return;
  if (new Date(currentMeeting) < new Date(deadlineValue)) {
    updateFn('meeting_time', deadlineValue);
    showError('meeting_time', '모임 시간은 신청 마감 이후여야 합니다.');
  }
};

const syncDeadlineWithMeeting = (meetingValue, currentDeadline, updateFn, showError) => {
  if (!meetingValue || !currentDeadline) return;
  if (new Date(meetingValue) < new Date(currentDeadline)) {
    updateFn('application_deadline', meetingValue);
    showError('application_deadline', '신청 마감일은 모임 시간 이전이어야 합니다.');
  }
};

// 모임 시간보다 티업 시간이 먼저일 수 없도록 검증 (모임 시간 < 티업 시간)
const validateMeetingTimeWithTeeTimes = (meetingTime, teeTimes, showError, clearError) => {
  if (!meetingTime || !teeTimes || teeTimes.length === 0) {
    // 값이 없으면 에러 제거
    if (clearError) clearError('meeting_time');
    return true;
  }
  
  const validTeeTimes = teeTimes.filter(time => time && time.trim());
  if (validTeeTimes.length === 0) {
    // 유효한 티업시간이 없으면 에러 제거
    if (clearError) clearError('meeting_time');
    return true;
  }
  
  try {
    const meetingDate = new Date(meetingTime);
    
    // datetime-local 형식에서 날짜 부분 직접 추출 (로컬 타임존 유지)
    // "YYYY-MM-DDTHH:mm" 형식에서 "T"로 split하여 날짜만 추출
    // meetingTime이 문자열이 아니거나 "T"가 없는 경우를 대비
    const meetingTimeStr = typeof meetingTime === 'string' ? meetingTime : meetingTime.toString();
    const meetingDateStr = meetingTimeStr.includes('T') 
      ? meetingTimeStr.split('T')[0] 
      : meetingTimeStr.substring(0, 10); // YYYY-MM-DD
    
    // 가장 이른 티업시간 찾기
    const earliestTeeTime = validTeeTimes.sort()[0];
    const [teeHour, teeMinute] = earliestTeeTime.split(':').map(Number);
    
    // 모임 일시의 날짜와 티업시간을 합쳐서 datetime 생성 (로컬 타임존 기준)
    const teeDateTime = new Date(meetingDateStr + 'T00:00:00');
    teeDateTime.setHours(teeHour, teeMinute, 0, 0);
    
    // 모임 시간보다 티업 시간이 먼저일 수 없음 (모임 시간 < 티업 시간이어야 함)
    // 모임 일시가 티업시간보다 같거나 늦으면 오류
    if (meetingDate >= teeDateTime) {
      if (showError) {
        showError('meeting_time', `모임 일시는 티업시간(${earliestTeeTime})보다 이전이어야 합니다.`);
      }
      return false;
    } else {
      // 검증 통과 시 에러 제거
      if (clearError) clearError('meeting_time');
      return true;
    }
  } catch (error) {
    console.error('티업시간 검증 오류:', error);
    if (clearError) clearError('meeting_time');
    return true;
  }
};

  const decimalNumberFields = new Set(['total_cost', 'green_fee', 'caddy_fee', 'cart_fee']);

  const parseNumberValue = (field, rawValue) => {
    if (rawValue === '' || rawValue === null || rawValue === undefined) return '';

    const stringValue = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue);
    if (stringValue === '') return '';

    const parsed = Number(stringValue);

    if (Number.isNaN(parsed)) {
      return '';
    }

    if (!decimalNumberFields.has(field) && !Number.isInteger(parsed)) {
      return '';
    }

    return decimalNumberFields.has(field) ? parsed : Math.trunc(parsed);
  };

  const formatNumberValue = (field, numericValue) => {
    if (numericValue === '' || numericValue === null || numericValue === undefined) return '';
    return decimalNumberFields.has(field) ? `${numericValue}` : `${Math.trunc(numericValue)}`;
  };

  const handleNumberChange = (field) => (event) => {
    const { value } = event.target;
    if (value === '') {
      updateFormData(field, '');
      return;
    }

    const parsed = parseNumberValue(field, value);
    if (parsed === '') {
      updateFormData(field, '');
      return;
    }

    updateFormData(field, parsed);
  };

  const handleNumberBlur = (field) => (event) => {
    const { value } = event.target;
    if (value === '') {
      updateFormData(field, '');
      // 비용 필드인 경우 blur 시 검증
      if (['green_fee', 'caddy_fee', 'cart_fee'].includes(field)) {
        validateCostFields(showFieldError, clearFieldError);
      }
      return;
    }

    const parsed = parseNumberValue(field, value);
    if (parsed === '') {
      event.target.value = '';
      updateFormData(field, '');
      // 비용 필드인 경우 blur 시 검증
      if (['green_fee', 'caddy_fee', 'cart_fee'].includes(field)) {
        validateCostFields(showFieldError, clearFieldError);
      }
      return;
    }

    event.target.value = formatNumberValue(field, parsed);
    updateFormData(field, parsed);
    // 비용 필드인 경우 blur 시 검증
    if (['green_fee', 'caddy_fee', 'cart_fee'].includes(field)) {
      validateCostFields(showFieldError, clearFieldError);
    }
  };

  const normalizeNumberForSubmit = (value, fallback = 0) => {
    if (value === '' || value === null || value === undefined) {
      return fallback;
    }
    if (Number.isNaN(value)) {
      return fallback;
    }
    return Number(value);
  };

  // 비용 필드 검증: 그린피, 캐디피, 카트비 필수값 검증
  const validateCostFields = (showError, clearError) => {
    const greenFee = normalizeNumberForSubmit(formData.green_fee, 0);
    const caddyFee = normalizeNumberForSubmit(formData.caddy_fee, 0);
    const cartFee = normalizeNumberForSubmit(formData.cart_fee, 0);

    let isValid = true;

    // 그린피 필수값 검증
    if (greenFee === 0 || greenFee === null || greenFee === undefined) {
      if (showError) {
        showError('green_fee', '그린피를 입력해주세요.');
      }
      isValid = false;
    } else if (clearError) {
      clearError('green_fee');
    }

    // 캐디피 필수값 검증
    if (caddyFee === 0 || caddyFee === null || caddyFee === undefined) {
      if (showError) {
        showError('caddy_fee', '캐디피를 입력해주세요.');
      }
      isValid = false;
    } else if (clearError) {
      clearError('caddy_fee');
    }

    // 카트비 필수값 검증
    if (cartFee === 0 || cartFee === null || cartFee === undefined) {
      if (showError) {
        showError('cart_fee', '카트비를 입력해주세요.');
      }
      isValid = false;
    } else if (clearError) {
      clearError('cart_fee');
    }

    return isValid;
  };

  // 내가 속한 클럽 목록 조회 (리더/매니저만)
  const fetchClubs = async () => {
    try {
      console.log('클럽 목록 조회 시작...');
      const response = await clubsApi.getMyClubs();
      console.log('전체 클럽 목록:', response.data);
      
      const source = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const eligibleClubs = source.filter((club) => {
        const role = club?.membership_role || club?.my_role;
        console.log(`클럽: ${club.name}, 역할: ${role}`);
        return role === 'LEADER' || role === 'MANAGER';
      });
      
      console.log('권한 있는 클럽들:', eligibleClubs);
      
      // 권한이 있는 클럽이 없고, 전체 클럽 목록이 있으면 권한 부족 모달 표시
      if (eligibleClubs.length === 0 && source.length > 0) {
        setShowPermissionDeniedModal(true);
        setClubs([]);
      } else {
        setClubs(eligibleClubs);
      }
    } catch (err) {
      console.error('클럽 목록 조회 실패:', err);
      openErrorModal('클럽 목록을 불러오는데 실패했습니다. 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    // 수정 모드가 아닐 때만 클럽 목록 조회 (수정 모드는 모임 로드 후 개설자 권한 확인)
    if (!isEditMode) {
      fetchClubs();
    }
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode || !meetingId) return;
    // 수정 모드일 때는 초기에 권한 부족 모달을 숨김
    setShowPermissionDeniedModal(false);
    // user가 로드될 때까지 기다림
    if (!user) return;

    const applyMeetingData = (meetingData) => {
      if (!meetingData) return;
      const teeTimes =
        Array.isArray(meetingData.tee_times) && meetingData.tee_times.length > 0
          ? meetingData.tee_times
          : [''];

      setMeetingData(meetingData);
      setFormData((prev) => ({
        ...prev,
        name: meetingData.name || '',
        description: meetingData.description || '',
        location: meetingData.location || '',
        meeting_time: toDateTimeLocalValue(meetingData.meeting_time),
        application_deadline: toDateTimeLocalValue(meetingData.application_deadline),
        team_formation_mode: meetingData.team_formation_mode || prev.team_formation_mode,
        team_size:
          meetingData.team_size !== null && meetingData.team_size !== undefined
            ? meetingData.team_size
            : '',
        tee_times: teeTimes,
        max_participants:
          meetingData.max_participants !== null && meetingData.max_participants !== undefined
            ? meetingData.max_participants
            : '',
        meeting_subtype: meetingData.meeting_subtype || 'REGULAR',
        total_cost: meetingData.total_cost ?? 0,
        green_fee: (meetingData.green_fee !== null && meetingData.green_fee !== undefined && meetingData.green_fee !== 0) ? meetingData.green_fee : '',
        caddy_fee: (meetingData.caddy_fee !== null && meetingData.caddy_fee !== undefined && meetingData.caddy_fee !== 0) ? meetingData.caddy_fee : '',
        cart_fee: (meetingData.cart_fee !== null && meetingData.cart_fee !== undefined && meetingData.cart_fee !== 0) ? meetingData.cart_fee : '',
        settlement_method: meetingData.settlement_method || prev.settlement_method,
        course_name: meetingData.course_name || '',
        hole_count: meetingData.hole_count ?? 18,
        reservation_name: meetingData.reservation_name || '',
        club_id: meetingData.club_id || '',
      }));
    };

    if (initialMeeting) {
      applyMeetingData(initialMeeting);
      setInitialLoading(false);
    } else {
      setInitialLoading(true);
    }

    const loadMeeting = async () => {
      try {
        const response = await roundsApi.getRound(meetingId);
        const meetingData = response?.data || response;
        if (!meetingData) {
          openErrorModal('모임 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.');
          return;
        }
        applyMeetingData(meetingData);
        
        // 수정 모드일 때 개설자 권한 확인 (user가 로드된 후에만 실행)
        try {
          const participantsResponse = await roundsApi.getRoundParticipants(meetingId);
          console.log('참가자 목록 API 응답 (전체):', participantsResponse);
          console.log('참가자 목록 API 응답 타입:', typeof participantsResponse);
          console.log('참가자 목록 API 응답 isArray:', Array.isArray(participantsResponse));
          
          // api.get()은 이미 response.data를 반환하므로, 백엔드가 배열을 반환하면 바로 배열임
          let participants = [];
          if (Array.isArray(participantsResponse)) {
            participants = participantsResponse;
          } else if (participantsResponse && Array.isArray(participantsResponse.data)) {
            participants = participantsResponse.data;
          } else if (participantsResponse && participantsResponse.data && Array.isArray(participantsResponse.data.data)) {
            participants = participantsResponse.data.data;
          } else {
            console.warn('참가자 목록 파싱 실패 - 예상치 못한 응답 구조:', participantsResponse);
            participants = [];
          }
          
          console.log('파싱된 참가자 목록:', participants);
          console.log('파싱된 참가자 목록 길이:', participants.length);
          
          // 현재 사용자가 개설자인지 확인
          const isOrganizer = participants.length > 0 && participants.some(
            (p) => String(p.user_id) === String(user.id) && p.role === 'ORGANIZER'
          );
          
          console.log('개설자 권한 체크:', {
            userId: user.id,
            participantsCount: participants.length,
            participants: participants.map(p => ({ user_id: p.user_id, role: p.role })),
            isOrganizer,
            rawResponse: participantsResponse
          });
          
          // 참가자 목록이 비어있는 경우, 클럽 리더/매니저 권한으로 수정 가능하도록 처리
          if (participants.length === 0) {
            console.log('참가자 목록이 비어있음 - 클럽 리더/매니저 권한으로 수정 가능하도록 처리');
            const clubResponse = await clubsApi.getMyClubs();
            const allClubs = Array.isArray(clubResponse.data) 
              ? clubResponse.data 
              : clubResponse.data?.data || [];
            
            // 해당 모임의 클럽에서 리더/매니저 권한 확인
            const meetingClub = allClubs.find(
              (club) => (String(club.id) === String(meetingData.club_id) || 
                        String(club.display_id) === String(meetingData.club_id)) &&
                        (club.membership_role === 'LEADER' || club.membership_role === 'MANAGER' ||
                         club.my_role === 'LEADER' || club.my_role === 'MANAGER')
            );
            
            if (meetingClub) {
              setClubs([meetingClub]);
              setShowPermissionDeniedModal(false);
              console.log('참가자 목록 비어있음: 클럽 리더/매니저 권한 확인, 권한 부족 모달 숨김');
            } else {
              // 클럽을 찾지 못했거나 권한이 없는 경우
              const eligibleClubs = allClubs.filter((club) => {
                const role = club?.membership_role || club?.my_role;
                return role === 'LEADER' || role === 'MANAGER';
              });
              
              if (eligibleClubs.length === 0 && allClubs.length > 0) {
                setShowPermissionDeniedModal(true);
                setClubs([]);
              } else {
                setClubs(eligibleClubs);
                setShowPermissionDeniedModal(false);
              }
            }
          } else if (isOrganizer) {
            // 개설자인 경우 클럽 목록을 가져와서 해당 클럽만 표시
            const clubResponse = await clubsApi.getMyClubs();
            const allClubs = Array.isArray(clubResponse.data) 
              ? clubResponse.data 
              : clubResponse.data?.data || [];
            
            // 해당 모임의 클럽만 필터링
            const meetingClub = allClubs.find(
              (club) => String(club.id) === String(meetingData.club_id) || 
                        String(club.display_id) === String(meetingData.club_id)
            );
            
            if (meetingClub) {
              setClubs([meetingClub]);
              setShowPermissionDeniedModal(false);
              console.log('개설자: 클럽 찾음, 권한 부족 모달 숨김');
            } else {
              // 클럽을 찾지 못한 경우에도 개설자이므로 권한 부족 모달 표시 안 함
              setClubs([]);
              setShowPermissionDeniedModal(false);
              console.log('개설자: 클럽을 찾지 못했지만 권한 부족 모달 숨김');
            }
          } else {
            // 개설자가 아닌 경우 기존 로직대로 리더/매니저 권한 확인
            const clubResponse = await clubsApi.getMyClubs();
            const allClubs = Array.isArray(clubResponse.data) 
              ? clubResponse.data 
              : clubResponse.data?.data || [];
            
            const eligibleClubs = allClubs.filter((club) => {
              const role = club?.membership_role || club?.my_role;
              return role === 'LEADER' || role === 'MANAGER';
            });
            
            if (eligibleClubs.length === 0 && allClubs.length > 0) {
              setShowPermissionDeniedModal(true);
              setClubs([]);
            } else {
              setClubs(eligibleClubs);
              setShowPermissionDeniedModal(false);
            }
          }
        } catch (participantsErr) {
          console.error('참가자 목록 조회 실패:', participantsErr);
          // 참가자 목록 조회 실패해도 모임 수정은 계속 진행
          // 권한 체크 실패 시 기본적으로 권한 부족 모달을 표시하지 않음
          setShowPermissionDeniedModal(false);
        }
        
        setActiveStep(0);
        setIsDirty(false);
        setShowSuccessModal(false);
      } catch (err) {
        console.error('모임 정보 불러오기 실패:', err);
        openErrorModal('모임 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadMeeting();
  }, [initialMeeting, isEditMode, meetingId, user]);

  // 필드 에러 표시 함수
  const showFieldError = (field, message) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: message
    }));
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // 폼 데이터 업데이트
  const updateFormData = (field, value) => {
    setFormData(prev => {
      if (prev[field] !== value) {
        setIsDirty(true);
      }
      return {
        ...prev,
        [field]: value
      };
    });
    
    // 에러 메시지 제거
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 티업시간과 모임 시간 변경 시 실시간 검증
  useEffect(() => {
    if (activeStep === 0 && formData.meeting_time && formData.tee_times.length > 0) {
      const trimmedTeeTimes = formData.tee_times.filter((time) => time && time.trim());
      if (trimmedTeeTimes.length > 0) {
        validateMeetingTimeWithTeeTimes(formData.meeting_time, trimmedTeeTimes, showFieldError, clearFieldError);
      }
    }
  }, [formData.meeting_time, formData.tee_times, activeStep]);

  // 비용 필드 변경 시 실시간 검증 제거 (blur 이벤트에서만 검증)

  useEffect(() => {
    setFieldErrors((prev) => {
      const maxRaw = formData.max_participants;
      const teamSizeRaw = formData.team_size;
      const hasMax = maxRaw !== '' && maxRaw !== null && maxRaw !== undefined;
      const hasTeamSize = teamSizeRaw !== '' && teamSizeRaw !== null && teamSizeRaw !== undefined;
      const max = Number(maxRaw);
      const teamSize = Number(teamSizeRaw);
      const exceeds =
        hasMax &&
        hasTeamSize &&
        Number.isFinite(max) &&
        Number.isFinite(teamSize) &&
        teamSize > max;

      const currentMessage = prev.team_size;
      const limitMessage = '한 조당 인원 수는 최대 참가자 수보다 많을 수 없습니다.';

      if (exceeds) {
        if (currentMessage === limitMessage) {
          return prev;
        }
        return {
          ...prev,
          team_size: limitMessage,
        };
      }

      if (currentMessage === limitMessage) {
        const { team_size, ...rest } = prev;
        return rest;
      }

      return prev;
    });
  }, [formData.max_participants, formData.team_size]);

  // 티타임 추가
  const addTeeTime = () => {
    setFormData(prev => {
      setIsDirty(true);
      return {
        ...prev,
        tee_times: [...prev.tee_times, '']
      };
    });
  };

  // 티타임 제거
  const removeTeeTime = (index) => {
    if (formData.tee_times.length > 1) {
      setFormData(prev => {
        setIsDirty(true);
        return {
          ...prev,
          tee_times: prev.tee_times.filter((_, i) => i !== index)
        };
      });
    }
  };

  // 티타임 업데이트
  const updateTeeTime = (index, value) => {
    setFormData(prev => {
      setIsDirty(true);
      const newTeeTimes = prev.tee_times.map((time, i) => i === index ? value : time);
      // 티업시간 변경 시 모임 일시 검증
      validateMeetingTimeWithTeeTimes(prev.meeting_time, newTeeTimes, showFieldError, clearFieldError);
      return {
        ...prev,
        tee_times: newTeeTimes
      };
    });
  };

const isStepValid = (step) => {
    const trimmedTeeTimes = formData.tee_times.filter((time) => time && time.trim());
  switch (step) {
    case 0:
      // 1단계: 기본 정보 + 골프장 정보 모두 검증
      return (
        formData.name.trim() &&
        formData.location.trim() &&
        formData.meeting_time &&
        formData.application_deadline &&
        formData.club_id &&
        formData.course_name.trim() &&
        formData.reservation_name.trim() &&
        trimmedTeeTimes.length > 0
      );
    case 1: {
      // 2단계: 팀 구성 정보 검증
      const maxParticipants = Number(formData.max_participants);
      const teamSize = Number(formData.team_size);
      return (
        Number.isFinite(maxParticipants) &&
        Number.isFinite(teamSize) &&
        maxParticipants > 0 &&
        teamSize > 0 &&
        teamSize <= maxParticipants
      );
    }
    default:
      return true;
  }
};

const validateStepFields = (step) => {
  let valid = true;
  const addError = (field, message) => {
    showFieldError(field, message);
    valid = false;
  };
  const trimmedTeeTimes = formData.tee_times.filter((time) => time && time.trim());

  switch (step) {
    case 0:
      // 1단계: 기본 정보 + 골프장 정보 모두 검증
      if (!formData.name.trim()) addError('name', '모임명을 입력해주세요.');
      if (!formData.location.trim()) addError('location', '장소를 입력해주세요.');
      if (!formData.application_deadline) addError('application_deadline', '신청 마감일을 선택해주세요.');
      if (!formData.meeting_time) addError('meeting_time', '모임 시간을 선택해주세요.');
      if (!formData.club_id) addError('club_id', '클럽을 선택해주세요.');
      if (!formData.course_name.trim()) addError('course_name', '골프장명을 입력해주세요.');
      if (!formData.reservation_name.trim()) addError('reservation_name', '예약자명을 입력해주세요.');
      if (trimmedTeeTimes.length === 0) addError('tee_times', '최소 하나의 티타임을 입력해주세요.');
      
      // 티업시간과 모임 일시 검증
      if (formData.meeting_time && trimmedTeeTimes.length > 0) {
        validateMeetingTimeWithTeeTimes(formData.meeting_time, trimmedTeeTimes, showFieldError, clearFieldError);
      } else {
        // 값이 없으면 에러 제거
        clearFieldError('meeting_time');
      }
      
      // 비용 필드 검증
    // 그린피, 캐디피, 카트비 필수값 검증
    const costFields = ['green_fee', 'caddy_fee', 'cart_fee'];
    costFields.forEach((field) => {
      const raw = formData[field];
      if (raw === '' || raw === null || raw === undefined) {
        addError(field, `${fieldLabelMap[field]}를 입력해주세요.`);
        valid = false;
        return;
      }
      const numericValue = Number(raw);
      if (Number.isNaN(numericValue)) {
        addError(field, `${fieldLabelMap[field]}는 숫자만 입력해주세요.`);
        valid = false;
      } else if (numericValue < 0) {
        addError(field, `${fieldLabelMap[field]}는 0 이상으로 입력해주세요.`);
        valid = false;
      } else if (numericValue === 0) {
        addError(field, `${fieldLabelMap[field]}를 입력해주세요.`);
        valid = false;
      }
    });
    
    // 비용 필드 검증
    if (!validateCostFields(showFieldError, clearFieldError)) {
      valid = false;
    }
      break;
    case 1: {
      // 2단계: 팀 구성 정보 검증
      const maxParticipantsRaw = formData.max_participants;
      const teamSizeRaw = formData.team_size;
      const hasMax = maxParticipantsRaw !== '' && maxParticipantsRaw !== null && maxParticipantsRaw !== undefined;
      const hasTeamSize = teamSizeRaw !== '' && teamSizeRaw !== null && teamSizeRaw !== undefined;
      const maxParticipants = Number(maxParticipantsRaw);
      const teamSize = Number(teamSizeRaw);

      if (!hasMax || Number.isNaN(maxParticipants) || maxParticipants <= 0) {
        addError('max_participants', '최대 참가자 수는 1명 이상이어야 합니다.');
      }

      if (!hasTeamSize || Number.isNaN(teamSize) || teamSize <= 0) {
        addError('team_size', '한 조당 인원 수는 1명 이상이어야 합니다.');
      } else if (
        hasMax &&
        hasTeamSize &&
        Number.isFinite(maxParticipants) &&
        Number.isFinite(teamSize) &&
        teamSize > maxParticipants
      ) {
        addError('team_size', '한 조당 인원 수는 최대 참가자 수보다 많을 수 없습니다.');
      }
      break;
    }
    default:
      break;
  }

  return valid;
};

// 폼 유효성 검사
const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = '모임명을 입력해주세요.';
    }
    
    if (!formData.location.trim()) {
      errors.location = '장소를 입력해주세요.';
    }
    
    if (!formData.meeting_time) {
      errors.meeting_time = '모임 시간을 선택해주세요.';
    }
    
    if (!formData.application_deadline) {
      errors.application_deadline = '신청 마감일을 선택해주세요.';
    }
    
    if (
      formData.application_deadline &&
      formData.meeting_time &&
      new Date(formData.meeting_time) < new Date(formData.application_deadline)
    ) {
      errors.meeting_time = '모임 시간은 신청 마감 이후여야 합니다.';
    }
    
    if (!formData.club_id) {
      errors.club_id = '클럽을 선택해주세요.';
    }
    
    const maxParticipantsRaw = formData.max_participants;
    const teamSizeRaw = formData.team_size;
    const maxParticipants = Number(maxParticipantsRaw);
    const teamSize = Number(teamSizeRaw);
    const hasMaxParticipants = maxParticipantsRaw !== '' && maxParticipantsRaw !== null && maxParticipantsRaw !== undefined;
    const hasTeamSize = teamSizeRaw !== '' && teamSizeRaw !== null && teamSizeRaw !== undefined;

    if (!hasMaxParticipants || Number.isNaN(maxParticipants) || maxParticipants < 1) {
      errors.max_participants = '최대 참가자 수는 1명 이상이어야 합니다.';
    }
    
    if (!hasTeamSize || Number.isNaN(teamSize) || teamSize < 1) {
      errors.team_size = '한 조당 인원 수는 1명 이상이어야 합니다.';
    } else if (
      hasMaxParticipants &&
      Number.isFinite(maxParticipants) &&
      teamSize > maxParticipants
    ) {
      errors.team_size = '한 조당 인원 수는 최대 참가자 수보다 많을 수 없습니다.';
    }

    // 그린피, 캐디피, 카트비 필수값 검증
    const costFields = ['green_fee', 'caddy_fee', 'cart_fee'];
    costFields.forEach((field) => {
      const raw = formData[field];
      if (raw === '' || raw === null || raw === undefined) {
        errors[field] = `${fieldLabelMap[field]}를 입력해주세요.`;
        return;
      }
      const numericValue = Number(raw);
      if (Number.isNaN(numericValue)) {
        errors[field] = `${fieldLabelMap[field]}는 숫자만 입력해주세요.`;
      } else if (numericValue < 0) {
        errors[field] = `${fieldLabelMap[field]}는 0 이상으로 입력해주세요.`;
      } else if (numericValue === 0) {
        errors[field] = `${fieldLabelMap[field]}를 입력해주세요.`;
      }
    });
    
    if (!formData.course_name.trim()) {
      errors.course_name = '골프장명을 입력해주세요.';
    }
    
    if (formData.hole_count < 1) {
      errors.hole_count = '홀 수는 1 이상이어야 합니다.';
    }
    
    // 티타임 유효성 검사
    const validTeeTimes = formData.tee_times.filter(time => time.trim());
    if (validTeeTimes.length === 0) {
      errors.tee_times = '최소 하나의 티타임을 입력해주세요.';
    }
    
    // 모임 일시와 티업시간 검증
    if (formData.meeting_time && validTeeTimes.length > 0) {
      if (!validateMeetingTimeWithTeeTimes(formData.meeting_time, validTeeTimes, (field, message) => {
        errors[field] = message;
      }, () => {
        // clearError는 validateForm에서는 사용하지 않음
      })) {
        // 검증 실패 시 에러는 이미 설정됨
      }
    }
    
    return errors;
  };

// 폼 제출
const allowedSettlementMethods = ['EQUAL_SPLIT', 'INDIVIDUAL'];

const handleSubmit = async (e) => {
  e.preventDefault();

  // 2단계일 때만 제출
  if (activeStep !== 1) {
    handleNext();
    return;
  }

  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    return;
  }

  // application_deadline이 현재 시간보다 과거인지 체크 (모임 생성 시에만)
  // 수정 모드일 때는 신청 마감일이 지났어도 수정할 수 있어야 함
  if (!isEditMode && formData.application_deadline) {
    const deadlineDate = new Date(formData.application_deadline);
    const now = new Date();
    if (deadlineDate.getTime() <= now.getTime()) {
      setShowDeadlinePassedModal(true);
      return;
    }
  }

  closeErrorModal();
  setLoading(true);

  try {
    const validTeeTimes = formData.tee_times.filter((time) => time && time.trim());
    const settlementMethod = allowedSettlementMethods.includes(formData.settlement_method)
      ? formData.settlement_method
      : 'EQUAL_SPLIT';

    const roundPayload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      location: formData.location?.trim() || undefined,
      meeting_time: convertToKST(formData.meeting_time),
      tee_times: validTeeTimes,
      max_participants: normalizeNumberForSubmit(formData.max_participants, 0),
      meeting_type: 'ROUND',
      meeting_subtype: formData.meeting_subtype,
      team_size: normalizeNumberForSubmit(formData.team_size, 0),
      team_formation_mode: formData.team_formation_mode,
      green_fee: normalizeNumberForSubmit(formData.green_fee, 0),
      caddy_fee: normalizeNumberForSubmit(formData.caddy_fee, 0),
      cart_fee: normalizeNumberForSubmit(formData.cart_fee, 0),
      total_cost: normalizeNumberForSubmit(formData.green_fee, 0) + normalizeNumberForSubmit(formData.caddy_fee, 0) + normalizeNumberForSubmit(formData.cart_fee, 0),
      settlement_method: settlementMethod,
      course_name: formData.course_name?.trim() || undefined,
      hole_count: normalizeNumberForSubmit(formData.hole_count, 18),
      reservation_name: formData.reservation_name?.trim() || undefined,
      application_deadline: convertToKST(formData.application_deadline),
      club_id: formData.club_id || undefined,
    };

    const sanitizedPayload = Object.fromEntries(
      Object.entries(roundPayload).filter(([, value]) => value !== undefined && value !== null)
    );

    if (isEditMode) {
      console.log('라운딩 모임 수정 요청:', sanitizedPayload);
      await roundsApi.updateRound(meetingId, sanitizedPayload);
      setIsDirty(false);
      setLoading(false);
      navigate(`/meetings/rounding/${meetingId}`, {
        replace: true,
        state: {
          message: '모임 정보를 수정했습니다.',
          type: 'success',
        },
      });
      return;
    }

    const params = { club_id: formData.club_id };

    console.log('라운딩 모임 생성 요청:', sanitizedPayload, params);

    await roundsApi.createRound(sanitizedPayload, { params });

    setCreatedMeetingName(formData.name);
    setIsDirty(false);
    setShowSuccessModal(true);
  } catch (err) {
    const validationDetail = err?.response?.data?.detail;
    console.error('라운딩 모임 생성 실패 - 검증 상세:', {
      message: err?.message,
      status: err?.response?.status,
      detail: validationDetail,
    });
    const message = formatErrorMessage(err, isEditMode ? '모임 수정에 실패했습니다.' : '모임 생성에 실패했습니다.');
    if (Array.isArray(validationDetail)) {
      validationDetail.forEach((item) => {
        const lastKey = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
        if (lastKey === 'club_id') {
          showFieldError('club_id', '클럽을 다시 선택해주세요.');
        }
        if (lastKey === 'settlement_method') {
          showFieldError('settlement_method', '지원하지 않는 정산 방식입니다.');
        }
      });
    }
    openErrorModal(message);
  } finally {
    setLoading(false);
  }
};

  // 다음 단계로
  const handleNext = () => {
    if (!validateStepFields(activeStep)) {
      return;
    }
    if (activeStep < steps.length - 1) {
      setTimeout(() => {
        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
      }, 0);
    }
  };

  // 이전 단계로
const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

const handleCancel = () => {
  setConfirmCancelModal(true);
};

const handleConfirmCancel = () => {
  setConfirmCancelModal(false);
  setIsDirty(false);
  if (isEditMode) {
    navigate(`/meetings/rounding/${meetingId}`);
  } else {
    navigate('/meetings');
  }
};

  const handleFormKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="flex h-48 sm:h-64 items-center justify-center">
            <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // 성공 모달 닫기
  const handleSuccessModalClose = () => {
    setIsDirty(false);
    setShowSuccessModal(false);
    navigate('/meetings', {
      state: {
        message: '라운딩 모임이 성공적으로 생성되었습니다.',
        type: 'success',
      },
    });
  };

  const steps = [
    { title: '기본 정보 + 골프장 정보', description: '모임의 기본 정보와 골프장 정보를 입력하세요' },
    { title: '팀 구성', description: '팀 구성 방식을 설정하세요' }
  ];

  // 현재 단계의 필드 에러가 있는지 확인
  const hasStepErrors = () => {
    if (activeStep === 0) {
      // 1단계: 기본 정보 + 골프장 정보 관련 필드 에러 확인
      const step0Fields = ['name', 'location', 'meeting_time', 'application_deadline', 'club_id', 'course_name', 'reservation_name', 'tee_times', 'green_fee', 'caddy_fee', 'cart_fee'];
      return step0Fields.some(field => fieldErrors[field]);
    } else if (activeStep === 1) {
      // 2단계: 팀 구성 관련 필드 에러 확인
      const step1Fields = ['max_participants', 'team_size'];
      return step1Fields.some(field => fieldErrors[field]);
    }
    return false;
  };

  const canProceed = isStepValid(activeStep) && !hasStepErrors();
  const nextButtonClass = canProceed
    ? 'px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
    : 'px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm bg-neutral-300 text-neutral-500 rounded-lg cursor-not-allowed';

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() =>
                navigate(isEditMode ? `/meetings/rounding/${meetingId}` : '/meetings')
              }
              className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              <FaArrowLeft className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">모임 목록</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1.5 sm:mb-2">
              {isEditMode ? '라운딩 모임 수정' : '라운딩 모임 생성'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              {isEditMode ? '라운딩 모임 정보를 수정할 수 있습니다.' : '새로운 라운딩 모임을 만들어보세요'}
            </p>
          </div>
        </div>

        {/* 진행 단계 표시 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-shrink-0">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  index <= activeStep 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-neutral-200 text-neutral-500'
                }`}>
                  {index < activeStep ? <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" /> : index + 1}
                </div>
                <div className="ml-2 sm:ml-3 text-left">
                  <p className={`text-xs sm:text-sm font-medium ${
                    index <= activeStep ? 'text-primary-600' : 'text-neutral-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-neutral-500 hidden sm:block">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 sm:w-8 h-0.5 mx-2 sm:mx-4 ${
                    index < activeStep ? 'bg-primary-600' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4 sm:space-y-6">
          {/* 1단계: 기본 정보 + 골프장 정보 */}
          {activeStep === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4 sm:mb-6">기본 정보</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* 모임명 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    모임명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.name ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="모임명을 입력하세요"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.name}</p>
                  )}
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="모임에 대한 설명을 입력하세요"
                  />
                </div>

                {/* 모임 장소 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    모임 장소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.location ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="골프장 위치를 입력하세요"
                  />
                  {fieldErrors.location && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.location}</p>
                  )}
                </div>

                {/* 모임 시간 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    모임 시간 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.meeting_time}
                    onChange={(e) => {
                      const { adjusted } = validateFutureDate(e.target.value, 'meeting_time', clearFieldError);
                      const nextValue = adjusted || getNowLocalISO();
                      updateFormData('meeting_time', nextValue);
                      e.target.value = nextValue;
                      syncDeadlineWithMeeting(nextValue, formData.application_deadline, updateFormData, showFieldError);
                      // 티업시간과 비교하여 검증
                      validateMeetingTimeWithTeeTimes(nextValue, formData.tee_times, showFieldError, clearFieldError);
                    }}
                    onInput={(e) => {
                      const { valid, adjusted } = validateFutureDate(e.target.value, 'meeting_time', clearFieldError);
                      if (!valid) {
                        const nextValue = adjusted || getNowLocalISO();
                        e.target.value = nextValue;
                        updateFormData('meeting_time', nextValue);
                      }
                      syncDeadlineWithMeeting(e.target.value, formData.application_deadline, updateFormData, showFieldError);
                      // 티업시간과 비교하여 검증
                      validateMeetingTimeWithTeeTimes(e.target.value, formData.tee_times, showFieldError, clearFieldError);
                    }}
                    onKeyDown={preventManualInput}
                    onPaste={(e) => e.preventDefault()}
                    min={
                      formData.application_deadline
                        ? formData.application_deadline
                        : getNowLocalISO()
                    }
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.meeting_time ? 'border-red-300' : 'border-neutral-300'
                    }`}
                  />
                  <p className="mt-1 text-[10px] sm:text-xs text-neutral-500">
                    현재 시간 이후만 선택 가능합니다.
                  </p>
                  {fieldErrors.meeting_time && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.meeting_time}</p>
                  )}
                </div>

                {/* 신청 마감일 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    신청 마감일 <span className="text-red-500">*</span>
                  </label>
                  {(() => {
                    // 수정 모드에서 마감 상태 확인
                    const currentDeadline = meetingData?.application_deadline || formData.application_deadline;
                    const isApplicationDeadlinePassed = isEditMode && currentDeadline ? isPastDateTime(currentDeadline) : false;
                    const isApplicationClosedEarly = isEditMode && meetingData?.application_closed_early === true;
                    const isDeadlineDisabled = isEditMode && (isApplicationDeadlinePassed || isApplicationClosedEarly);
                    
                    return (
                      <input
                        type="datetime-local"
                        value={formData.application_deadline}
                        onChange={(e) => {
                          const { adjusted } = validateFutureDate(e.target.value, 'application_deadline', clearFieldError);
                          const nextValue = adjusted || getNowLocalISO();
                          updateFormData('application_deadline', nextValue);
                          e.target.value = nextValue;
                          syncMeetingWithDeadline(nextValue, formData.meeting_time, updateFormData, showFieldError);
                        }}
                        onInput={(e) => {
                          const { valid, adjusted } = validateFutureDate(e.target.value, 'application_deadline', clearFieldError);
                          if (!valid) {
                            const nextValue = adjusted || getNowLocalISO();
                            e.target.value = nextValue;
                            updateFormData('application_deadline', nextValue);
                          }
                          syncMeetingWithDeadline(e.target.value, formData.meeting_time, updateFormData, showFieldError);
                        }}
                        onKeyDown={preventManualInput}
                        onPaste={(e) => e.preventDefault()}
                        min={getNowLocalISO()}
                        disabled={isDeadlineDisabled}
                        className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          fieldErrors.application_deadline ? 'border-red-300' : 'border-neutral-300'
                        } ${isDeadlineDisabled ? 'cursor-not-allowed bg-neutral-100 opacity-50' : ''}`}
                      />
                    );
                  })()}
                  <p className="mt-1 text-[10px] sm:text-xs text-neutral-500">
                    현재 시간 이후만 선택 가능합니다.
                  </p>
                  {fieldErrors.application_deadline && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.application_deadline}</p>
                  )}
                </div>

                {/* 클럽 선택 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    클럽 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.club_id}
                    onChange={(e) => updateFormData('club_id', e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.club_id ? 'border-red-300' : 'border-neutral-300'
                    }`}
                  >
                    <option value="">클럽을 선택하세요</option>
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.club_id && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.club_id}</p>
                  )}
                </div>
              </div>
              
              {/* 골프장 정보 섹션 */}
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-neutral-200">
                <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4 sm:mb-6">골프장 정보</h2>
                
                <div className="space-y-4 sm:space-y-6">
                {/* 골프장명 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    골프장명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.course_name}
                    onChange={(e) => updateFormData('course_name', e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.course_name ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="골프장명을 입력하세요"
                  />
                  {fieldErrors.course_name && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.course_name}</p>
                  )}
                </div>

                {/* 홀 수 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    홀 수 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.hole_count}
                    onChange={handleNumberChange('hole_count')}
                    onBlur={handleNumberBlur('hole_count')}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.hole_count ? 'border-red-300' : 'border-neutral-300'
                    }`}
                  />
                  {fieldErrors.hole_count && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.hole_count}</p>
                  )}
                </div>

                {/* 예약자명 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    예약자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.reservation_name}
                    onChange={(e) => updateFormData('reservation_name', e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.reservation_name ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="예약자명을 입력하세요"
                  />
                  {fieldErrors.reservation_name && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.reservation_name}</p>
                  )}
                </div>

                {/* 티타임 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    티타임 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {formData.tee_times.map((time, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => updateTeeTime(index, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        {formData.tee_times.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTeeTime(index)}
                            className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTeeTime}
                      className="flex items-center space-x-1.5 sm:space-x-2 text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      <FaPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-medium">티타임 추가</span>
                    </button>
                  </div>
                  {fieldErrors.tee_times && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.tee_times}</p>
                  )}
                </div>

                {/* 비용 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                      그린피(원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.green_fee}
                    onChange={handleNumberChange('green_fee')}
                    onBlur={handleNumberBlur('green_fee')}
                      className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        fieldErrors.green_fee ? 'border-red-300' : 'border-neutral-300'
                      }`}
                      placeholder="0"
                    />
                    {fieldErrors.green_fee && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.green_fee}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                      캐디피(원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.caddy_fee}
                    onChange={handleNumberChange('caddy_fee')}
                    onBlur={handleNumberBlur('caddy_fee')}
                      className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        fieldErrors.caddy_fee ? 'border-red-300' : 'border-neutral-300'
                      }`}
                      placeholder="0"
                    />
                    {fieldErrors.caddy_fee && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.caddy_fee}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                      카트비(원) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cart_fee}
                    onChange={handleNumberChange('cart_fee')}
                    onBlur={handleNumberBlur('cart_fee')}
                      className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        fieldErrors.cart_fee ? 'border-red-300' : 'border-neutral-300'
                      }`}
                      placeholder="0"
                    />
                    {fieldErrors.cart_fee && (
                      <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.cart_fee}</p>
                    )}
                  </div>
                </div>

                {/* 정산 방법 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    정산 방법
                  </label>
                  <select
                    value={formData.settlement_method}
                    onChange={(e) => {
                      const nextValue = allowedSettlementMethods.includes(e.target.value)
                        ? e.target.value
                        : 'EQUAL_SPLIT';
                      updateFormData('settlement_method', nextValue);
                    }}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="EQUAL_SPLIT">N분의 1</option>
                    <option value="INDIVIDUAL">개별 정산</option>
                  </select>
                  {fieldErrors.settlement_method && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.settlement_method}</p>
                  )}
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500">
                    * 참가자에게 안내를 위한 설정이며, 실제 정산 생성 시, 달라질 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* 2단계: 팀 구성 */}
          {activeStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4 sm:mb-6">팀 구성</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* 최대 참가자 수 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    최대 참가자 수 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={handleNumberChange('max_participants')}
                    onBlur={handleNumberBlur('max_participants')}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.max_participants ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="0"
                  />
                  {fieldErrors.max_participants && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.max_participants}</p>
                  )}
                </div>

                {/* 한 조당 인원 수 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    한 조당 인원 수 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.team_size}
                    onChange={handleNumberChange('team_size')}
                    onBlur={handleNumberBlur('team_size')}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.team_size ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="0"
                  />
                  {fieldErrors.team_size && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.team_size}</p>
                  )}
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500">
                    * 예상치이며, 참가신청 상태에 따라 변경할 수 있습니다.
                  </p>
                </div>

                {/* 팀 구성 방식 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    팀 구성 방식
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="team_formation_mode"
                        value="GENDER_SEPARATED"
                        checked={formData.team_formation_mode === 'GENDER_SEPARATED'}
                        onChange={(e) => updateFormData('team_formation_mode', e.target.value)}
                        className="mr-2 sm:mr-3"
                      />
                      <span className="text-xs sm:text-sm text-neutral-700">성별 분리</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="team_formation_mode"
                        value="MIXED"
                        checked={formData.team_formation_mode === 'MIXED'}
                        onChange={(e) => updateFormData('team_formation_mode', e.target.value)}
                        className="mr-2 sm:mr-3"
                      />
                      <span className="text-xs sm:text-sm text-neutral-700">혼성</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500">
                    * 참가자 안내용이며, 구체적 방법은 팀 편성 시 선택할 수 있습니다.
                  </p>
                </div>

                {/* 모임 유형 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    모임 유형
                  </label>
                  <select
                    value={formData.meeting_subtype}
                    onChange={(e) => updateFormData('meeting_subtype', e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="REGULAR">정기</option>
                    <option value="IRREGULAR">비정기</option>
                    <option value="ONE_TIME">일회성</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  이전
                </button>
              )}
            </div>
            
            <div className="flex items-center">
              {activeStep < 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={nextButtonClass.replace('px-6 py-2', 'px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm')}
                >
                  다음
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canProceed || loading}
                  className={canProceed
                    ? 'px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm bg-neutral-300 text-neutral-500 rounded-lg cursor-not-allowed'}
                >
                  {loading
                    ? isEditMode
                      ? '수정 중...'
                      : '생성 중...'
                    : isEditMode
                      ? '모임 수정'
                      : '모임 생성'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 시간 경과 모달 */}
      {showDeadlinePassedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaClock className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-1.5 sm:mb-2">
                등록할 수 없습니다
              </h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
                시간이 경과해서 등록할 수 없습니다.<br />
                다시 시도해 주세요.
              </p>
              <button
                onClick={() => {
                  setShowDeadlinePassedModal(false);
                  navigate('/meetings');
                }}
                className="w-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                모임 목록으로 가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 에러 모달 */}
      {errorModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 sm:mb-3">문제가 발생했습니다</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 whitespace-pre-line">{errorModal.message}</p>
              <button
                type="button"
                onClick={closeErrorModal}
                className="px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm bg-neutral-800 text-white rounded-lg hover:bg-neutral-900 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 권한 부족 모달 */}
      {showPermissionDeniedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 sm:mb-3">권한이 부족합니다</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
                권한이 부족하여 라운딩을 생성할 수 없습니다.
                <br />
                클럽 운영진에게 문의하세요.
              </p>
              <button
                type="button"
                onClick={() => navigate('/meetings')}
                className="w-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                모임 목록으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaCheck className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                모임이 생성되었습니다!
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                "{createdMeetingName}" 모임이<br />
                성공적으로 생성되었습니다.
              </p>
              <button
                onClick={handleSuccessModalClose}
                className="w-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 취소 확인 모달 */}
      {confirmCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-yellow-100 mb-3 sm:mb-4">
                <FaExclamationTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                취소 확인
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                {isEditMode
                  ? '저장하지 않은 변경 사항이 모두 사라집니다. 수정을 취소하시겠습니까?'
                  : '작성 중인 내용이 모두 사라집니다. 모임 생성을 취소하시겠습니까?'}
              </p>
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={() => setConfirmCancelModal(false)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RoundingCreatePage = () => <RoundingForm mode="create" />;

export const RoundingEditPage = () => <RoundingForm mode="edit" />;

export default RoundingCreatePage;
