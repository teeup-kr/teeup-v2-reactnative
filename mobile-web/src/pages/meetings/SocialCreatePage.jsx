import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaCalendarAlt, FaArrowLeft, FaCheck, FaUsers, FaMapMarkerAlt, FaDollarSign, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { clubsApi, socialsApi, api } from '../../lib';
import { useAuth } from '../../hooks/useAuth';

const SocialForm = ({ mode }) => {
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
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubs, setClubs] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [participantType, setParticipantType] = useState('ALL');
  const [fieldErrors, setFieldErrors] = useState({});
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
    type: 'CASUAL',
    venue_name: '',
    meeting_time: '',
    application_deadline: '',
    max_participants: 1,
    social_cost: 0,
    social_settlement_method: 'EQUAL_SPLIT',
    club_id: ''
  });

  const formatErrorMessage = (error, fallbackMessage) => {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const location = Array.isArray(item.loc) ? item.loc.join(' > ') : '';
          const message = item.msg || item.message || item.type || '';
          return location ? `${location}: ${message}` : message;
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
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

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

  // datetime-local 형식으로 변환 (수정 모드용)
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

  const validateFutureDate = (value, field) => {
    if (!value) return { valid: false, adjusted: '' };
    const selectedDate = new Date(value);
    const now = new Date();
    if (selectedDate < now) {
      showFieldError(field, '현재 시점 이후로만 선택할 수 있습니다.');
      return { valid: false, adjusted: getNowLocalISO() };
    }
    return { valid: true, adjusted: value };
  };

  const preventManualInput = (event) => {
    const allowedKeys = ['Tab', 'Shift', 'Escape', 'Enter'];
    if (!allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  };

  const syncMeetingWithDeadline = (deadlineValue) => {
    if (!deadlineValue || !formData.meeting_time) return;
    if (new Date(formData.meeting_time) < new Date(deadlineValue)) {
      handleInputChange('meeting_time', deadlineValue);
      showFieldError('meeting_time', '모임 시간은 신청 마감 이후여야 합니다.');
    }
  };

  const syncDeadlineWithMeeting = (meetingValue) => {
    if (!meetingValue || !formData.application_deadline) return;
    if (new Date(meetingValue) < new Date(formData.application_deadline)) {
      handleInputChange('application_deadline', meetingValue);
      showFieldError('application_deadline', '신청 마감일은 모임 시간 이전이어야 합니다.');
    }
  };

  const decimalNumberFields = new Set(['social_cost']);

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
      handleInputChange(field, '');
      return;
    }

    const parsed = parseNumberValue(field, value);
    handleInputChange(field, parsed === '' ? '' : parsed);
  };

  const handleNumberBlur = (field) => (event) => {
    const { value } = event.target;
    if (value === '') {
      handleInputChange(field, '');
      return;
    }

    const parsed = parseNumberValue(field, value);
    if (parsed === '') {
      event.target.value = '';
      handleInputChange(field, '');
      return;
    }

    event.target.value = formatNumberValue(field, parsed);
    handleInputChange(field, parsed);
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

  const isStepValid = (step) => {
    switch (step) {
      case 0:
        return formData.name.trim() && formData.club_id;
      case 1:
        return formData.meeting_time && formData.venue_name.trim() && formData.social_cost !== '' && formData.social_cost !== null && formData.social_cost !== undefined && Number(formData.social_cost) >= 0;
      case 2:
        {
          // participantType='LIMITED'일 때만 max_participants 검증
          if (participantType === 'LIMITED') {
            return formData.max_participants > 0;
          }
          return true; // participantType='ALL'일 때는 항상 true
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

    switch (step) {
      case 0:
        if (!formData.name.trim()) addError('name', '모임명을 입력해주세요.');
        if (!formData.club_id) addError('club_id', '클럽을 선택해주세요.');
        break;
      case 1:
        if (!formData.meeting_time) addError('meeting_time', '모임 시간을 선택해주세요.');
        if (!formData.venue_name.trim()) addError('venue_name', '장소명을 입력해주세요.');
        // 참가 비용 필수 검증
        if (formData.social_cost === '' || formData.social_cost === null || formData.social_cost === undefined) {
          addError('social_cost', '참가 비용을 입력해주세요.');
        } else {
          const numericValue = Number(formData.social_cost);
          if (Number.isNaN(numericValue)) {
            addError('social_cost', '참가 비용은 숫자만 입력해주세요.');
          } else if (numericValue < 0) {
            addError('social_cost', '참가 비용은 0 이상으로 입력해주세요.');
          }
        }
        break;
      case 2:
        // participantType='LIMITED'일 때만 max_participants 검증
        if (participantType === 'LIMITED') {
          if (formData.max_participants <= 0) {
            addError('max_participants', '참가자 수는 1명 이상이어야 합니다.');
          }
        }
        break;
      default:
        break;
    }

    return valid;
  };

  // 내가 속한 클럽 목록 조회 (모든 멤버 가능)
  const fetchClubs = async () => {
    try {
      setClubsLoading(true);
      closeErrorModal();
      const response = await clubsApi.getMyClubs();
      const source = Array.isArray(response.data) ? response.data : response.data?.data || [];
      
      // 권한 체크: 모든 클럽에서 리더/매니저 권한이 있는지 확인
      const hasPermission = source.some((club) => {
        const role = club?.membership_role || club?.my_role;
        return role === 'LEADER' || role === 'MANAGER';
      });
      
      if (!hasPermission && source.length > 0) {
        // 권한이 없는 경우 모달 표시
        setShowPermissionDeniedModal(true);
        setClubs([]);
      } else {
        setClubs(source);
      }
    } catch (err) {
      console.error('클럽 목록 조회 실패:', err);
      openErrorModal('클럽 목록을 불러오는데 실패했습니다. 다시 시도해주세요.');
    } finally {
      setClubsLoading(false);
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
      setMeetingData(meetingData);
      setFormData((prev) => ({
        ...prev,
        name: meetingData.name || '',
        description: meetingData.description || '',
        type: meetingData.type || prev.type,
        venue_name: meetingData.venue_name || '',
        meeting_time: toDateTimeLocalValue(meetingData.meeting_time),
        application_deadline: toDateTimeLocalValue(meetingData.application_deadline),
        max_participants:
          meetingData.max_participants !== null && meetingData.max_participants !== undefined
            ? meetingData.max_participants
            : 0,
        social_cost: meetingData.social_cost ?? 0,
        social_settlement_method: meetingData.social_settlement_method || prev.social_settlement_method,
        club_id: meetingData.club_id || '',
      }));

      // 편집 진입 시 참가자 유형 설정
      // max_participants가 null이거나 0이면 'ALL', 그렇지 않으면 'LIMITED'
      const maxParticipants = meetingData.max_participants !== null && meetingData.max_participants !== undefined
        ? meetingData.max_participants
        : 0;
      if (maxParticipants > 0) {
        setParticipantType('LIMITED');
      } else {
        setParticipantType('ALL');
      }
    };

    if (initialMeeting) {
      applyMeetingData(initialMeeting);
      setInitialLoading(false);
    } else {
      setInitialLoading(true);
    }

    const loadMeeting = async () => {
      try {
        const response = await socialsApi.getSocial(meetingId);
        const meetingData = response?.data || response;
        if (!meetingData) {
          openErrorModal('모임 정보를 불러오는 데 실패했습니다. 다시 시도해주세요.');
          return;
        }

        applyMeetingData(meetingData);
        
        // 수정 모드일 때 개설자 권한 확인 (user가 로드된 후에만 실행)
        try {
          const participantsResponse = await api.get(`/meetings/${meetingId}/participants`);
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
              const hasPermission = allClubs.some((club) => {
                const role = club?.membership_role || club?.my_role;
                return role === 'LEADER' || role === 'MANAGER';
              });
              
              if (!hasPermission && allClubs.length > 0) {
                setShowPermissionDeniedModal(true);
                setClubs([]);
              } else {
                setClubs(allClubs);
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
            
            const hasPermission = allClubs.some((club) => {
              const role = club?.membership_role || club?.my_role;
              return role === 'LEADER' || role === 'MANAGER';
            });
            
            if (!hasPermission && allClubs.length > 0) {
              setShowPermissionDeniedModal(true);
              setClubs([]);
            } else {
              setClubs(allClubs);
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
      } catch (err) {
        console.error('소셜 모임 정보 불러오기 실패:', err);
        openErrorModal('모임 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
        setInitialLoading(false);
      }
    };

    loadMeeting();
  }, [initialMeeting, isEditMode, meetingId, user]);

  // 폼 데이터 변경
  const showFieldError = (field, message) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: message,
    }));

    setTimeout(() => {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }, 5000);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      if (prev[field] !== value) {
        setIsDirty(true);
      }
      return {
        ...prev,
        [field]: value
      };
    });

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // 다음 단계
  const handleNext = () => {
    if (!validateStepFields(activeStep)) {
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  // 이전 단계
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

const handleCancel = () => {
  setConfirmCancelModal(true);
};

const handleConfirmCancel = () => {
  setConfirmCancelModal(false);
  setIsDirty(false);
  if (isEditMode) {
    navigate(`/meetings/social/${meetingId}`);
  } else {
    navigate('/meetings');
  }
};

  const handleParticipantTypeChange = (value) => {
    setParticipantType(value);
    setIsDirty(true);
  };

  // 폼 제출
  const handleSubmit = async () => {
    closeErrorModal();

    if (!formData.meeting_time) {
      showFieldError('meeting_time', '모임 시간을 선택해주세요.');
      return;
    }

    if (!formData.club_id) {
      showFieldError('club_id', '클럽을 선택해주세요.');
      return;
    }

    if (!validateStepFields(2)) {
      return;
    }

    if (
      formData.application_deadline &&
      formData.meeting_time &&
      new Date(formData.meeting_time) < new Date(formData.application_deadline)
    ) {
      showFieldError('meeting_time', '모임 시간은 신청 마감 이후여야 합니다.');
      showFieldError('application_deadline', '신청 마감일은 모임 시간 이전이어야 합니다.');
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

    try {
      setLoading(true);

      const normalizedSettlementMethod =
        formData.social_settlement_method === 'EQUAL_SPLIT' ? 'EQUAL_SPLIT' : 'INDIVIDUAL';

      const meetingTimeKST = convertToKST(formData.meeting_time);
      const deadlineKST = convertToKST(formData.application_deadline);
      
      // 디버깅: 제출 전 데이터 확인
      console.log('📤 소셜 모임 제출 데이터:', {
        원본_meeting_time: formData.meeting_time,
        변환_meeting_time: meetingTimeKST,
        원본_application_deadline: formData.application_deadline,
        변환_application_deadline: deadlineKST
      });
      
      const socialPayload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        meeting_time: meetingTimeKST,
        application_deadline: deadlineKST,
        max_participants: participantType === 'ALL' 
          ? null  // 모든 클럽 멤버인 경우 null
          : normalizeNumberForSubmit(formData.max_participants, 1),
        venue_name: formData.venue_name.trim(),
        social_cost: normalizeNumberForSubmit(formData.social_cost, 0),
        social_settlement_method: normalizedSettlementMethod,
        club_id: formData.club_id
      };

      if (isEditMode) {
        console.log('소셜 모임 수정 요청:', socialPayload);
        await socialsApi.updateSocial(meetingId, socialPayload);
        setIsDirty(false);
        navigate(`/meetings/social/${meetingId}`, {
          replace: true,
          state: {
            message: '소셜 모임 정보를 수정했습니다.',
            type: 'success',
          },
        });
        return;
      }

      console.log('소셜 모임 생성 요청:', socialPayload);

      await socialsApi.createSocial(socialPayload);

      setIsDirty(false);
      navigate('/meetings', {
        state: {
          message: '소셜 모임이 성공적으로 생성되었습니다.',
          type: 'success',
        },
      });
    } catch (err) {
      console.error('❌ 소셜 모임 저장 실패:', err);
      const message = formatErrorMessage(
        err,
        isEditMode ? '모임 수정에 실패했습니다.' : '모임 생성에 실패했습니다.',
      );
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        detail.forEach((item) => {
          const lastKey = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
          if (lastKey === 'club_id') {
            showFieldError('club_id', '클럽을 다시 선택해주세요.');
          }
          if (lastKey === 'social_settlement_method') {
            showFieldError('social_settlement_method', '지원하지 않는 정산 방식입니다.');
          }
        });
      }
      openErrorModal(message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: '기본 정보', description: '모임의 기본 정보를 입력하세요' },
    { title: '장소 및 비용', description: '장소와 비용 정보를 입력하세요' },
    { title: '참가자 설정', description: '참가자 수와 정산 방법을 설정하세요' }
  ];

  const canProceed = isStepValid(activeStep);
  const nextButtonClass = canProceed
    ? 'px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors'
    : 'px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm bg-neutral-300 text-neutral-500 rounded-lg cursor-not-allowed';

  if (initialLoading || clubsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button
              onClick={() =>
                navigate(isEditMode ? `/meetings/social/${meetingId}` : '/meetings')
              }
              className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              <FaArrowLeft className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">모임 목록</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1.5 sm:mb-2">
              {isEditMode ? '소셜 모임 수정' : '소셜 모임 생성'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600">
              {isEditMode ? '소셜 모임 정보를 수정할 수 있습니다.' : '새로운 소셜 모임을 만들어보세요'}
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
        <div className="space-y-4 sm:space-y-6">
          {/* 1단계: 기본 정보 */}
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
                    onChange={(e) => handleInputChange('name', e.target.value)}
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
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="모임에 대한 설명을 입력하세요"
                  />
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
                      const { adjusted } = validateFutureDate(e.target.value, 'meeting_time');
                      const nextValue = adjusted || getNowLocalISO();
                      handleInputChange('meeting_time', nextValue);
                      e.target.value = nextValue;
                      syncDeadlineWithMeeting(nextValue);
                    }}
                    onInput={(e) => {
                      const { valid, adjusted } = validateFutureDate(e.target.value, 'meeting_time');
                      if (!valid) {
                        const nextValue = adjusted || getNowLocalISO();
                        e.target.value = nextValue;
                        handleInputChange('meeting_time', nextValue);
                      }
                      syncDeadlineWithMeeting(e.target.value);
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
                    신청 마감일
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
                          const { adjusted } = validateFutureDate(e.target.value, 'application_deadline');
                          const nextValue = adjusted || getNowLocalISO();
                          handleInputChange('application_deadline', nextValue);
                          e.target.value = nextValue;
                          syncMeetingWithDeadline(nextValue);
                        }}
                        onInput={(e) => {
                          const { valid, adjusted } = validateFutureDate(e.target.value, 'application_deadline');
                          if (!valid) {
                            const nextValue = adjusted || getNowLocalISO();
                            e.target.value = nextValue;
                            handleInputChange('application_deadline', nextValue);
                          }
                          syncMeetingWithDeadline(e.target.value);
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
                    onChange={(e) => handleInputChange('club_id', e.target.value)}
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
            </div>
          )}

          {/* 2단계: 장소 및 비용 */}
          {activeStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4 sm:mb-6">장소 및 비용</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* 장소명 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    장소명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.venue_name}
                    onChange={(e) => handleInputChange('venue_name', e.target.value)}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.venue_name ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="장소명을 입력하세요"
                  />
                  {fieldErrors.venue_name && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.venue_name}</p>
                  )}
                </div>

                {/* 소셜 비용 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    참가 비용(원) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.social_cost === 0 || formData.social_cost === '' || formData.social_cost === null || formData.social_cost === undefined ? '' : formData.social_cost}
                    onChange={(e) => {
                      // 숫자만 입력 가능, 앞의 0 제거
                      const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만
                      const trimmed = value.replace(/^0+/, ''); // 앞의 0 제거
                      const finalValue = trimmed === '' ? '' : Number(trimmed);
                      handleInputChange('social_cost', finalValue);
                    }}
                    onBlur={handleNumberBlur('social_cost')}
                    className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      fieldErrors.social_cost ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="참가 비용을 입력하세요"
                  />
                  {fieldErrors.social_cost && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.social_cost}</p>
                  )}
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500">
                    * 사용자 안내를 위한 예상치이며, 실제 정산 시 금액이 달라질 수 있습니다.
                  </p>
                </div>

                {/* 정산 방법 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    정산 방법
                  </label>
                  <select
                    value={formData.social_settlement_method}
                    onChange={(e) => handleInputChange('social_settlement_method', e.target.value)}
                    className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="EQUAL_SPLIT">N분의 1</option>
                    <option value="TREASURER_PREPAID">총무 선결제</option>
                    <option value="CLUB_FUND">회비에서 지출</option>
                  </select>
                  {fieldErrors.social_settlement_method && (
                    <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.social_settlement_method}</p>
                  )}
                  <p className="mt-1 text-xs sm:text-sm text-neutral-500">
                    * 사용자 안내용이며, 실제 정산 시 변동될 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3단계: 참가자 설정 */}
          {activeStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4 sm:mb-6">참가자 설정</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* 참가자 수 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
                    참가자 수
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="participantType"
                          value="ALL"
                          checked={participantType === 'ALL'}
                          onChange={(e) => {
                            setParticipantType(e.target.value);
                            setIsDirty(true);
                            if (e.target.value === 'ALL') {
                              handleInputChange('max_participants', 0);
                            }
                          }}
                          className="mr-2 sm:mr-3"
                        />
                        <span className="text-xs sm:text-sm text-neutral-700">모든 클럽 멤버</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="participantType"
                          value="LIMITED"
                          checked={participantType === 'LIMITED'}
                          onChange={(e) => {
                            setParticipantType(e.target.value);
                            setIsDirty(true);
                            if (e.target.value === 'LIMITED' && formData.max_participants <= 0) {
                              handleInputChange('max_participants', 1);
                            }
                          }}
                          className="mr-2 sm:mr-3"
                        />
                        <span className="text-xs sm:text-sm text-neutral-700">참가자 수 설정</span>
                      </label>
                    </div>
                    {participantType === 'LIMITED' && (
                      <div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.max_participants <= 0 ? '' : formData.max_participants}
                          onChange={(e) => {
                            // 숫자만 입력 가능, 앞의 0 제거
                            const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만
                            const trimmed = value.replace(/^0+/, ''); // 앞의 0 제거
                            const finalValue = trimmed === '' ? 0 : Number(trimmed);
                            handleInputChange('max_participants', finalValue);
                          }}
                          onBlur={handleNumberBlur('max_participants')}
                          className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                            fieldErrors.max_participants ? 'border-red-300' : 'border-neutral-300'
                          }`}
                          placeholder="참가자 수를 입력해 주세요."
                        />
                        {fieldErrors.max_participants && (
                          <p className="mt-1 text-xs sm:text-sm text-red-600">{fieldErrors.max_participants}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mt-6 sm:mt-8">
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
                onClick={handleBack}
                className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                이전
              </button>
            )}
          </div>
          
          <div className="flex items-center">
            {activeStep < 2 ? (
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
                type="button"
                onClick={handleSubmit}
                disabled={loading || !isStepValid(2)}
                className="px-4 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {showPermissionDeniedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 sm:mb-3">권한이 부족합니다</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
                권한이 부족하여 소셜 모임을 생성할 수 없습니다.
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

const SocialCreatePage = () => <SocialForm mode="create" />;

export const SocialEditPage = () => <SocialForm mode="edit" />;

export default SocialCreatePage;
