import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaUser, FaPhone, FaCalendarAlt, FaVenusMars, FaGolfBall, FaChartLine, FaCheckCircle, FaInfoCircle, FaEdit, FaArrowLeft, FaSave, FaTimes, FaTimesCircle } from 'react-icons/fa';
import { usersApi } from '../../lib/api';
import LastMeetingResultCard from '../../components/handicap/LastMeetingResultCard';
import ScoreHistoryCard from '../../components/handicap/ScoreHistoryCard';

const UserProfileCompletePage = () => {
  console.log('UserProfileCompletePage 컴포넌트 렌더링 시작!');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    realname: '',
    phone_number: '',
    birthdate: '',
    gender: '',
    handicap: '',
    average_score: '',
    calculatedHandicap: null  // 자동 계산된 핸디캡
  });
  
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isNameComposing, setIsNameComposing] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', tone: 'info' });

  // 만 14세 미만 입력 방지를 위한 최대 선택 가능 생년월일 (오늘 기준 14년 전)
  const maxBirthdate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 14);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  // 평균 스코어로부터 핸디캡 계산 함수
  const calculateHandicapFromAverageScore = (averageScore) => {
    // null, undefined, 빈 문자열 체크
    if (averageScore === null || averageScore === undefined || averageScore === '') {
      return null;
    }
    
    // 문자열인 경우 숫자로 변환
    let avgScore;
    if (typeof averageScore === 'number') {
      avgScore = averageScore;
    } else if (typeof averageScore === 'string') {
      // 빈 문자열이나 공백만 있는 경우
      const trimmed = averageScore.trim();
      if (trimmed === '') return null;
      avgScore = parseFloat(trimmed);
    } else {
      avgScore = Number(averageScore);
    }
    
    // NaN 체크
    if (isNaN(avgScore) || !isFinite(avgScore)) {
      return null;
    }
    
    // 55-144 범위 체크
    if (avgScore >= 55 && avgScore <= 144) {
      const calculated = Math.max(0, Math.min(72, Math.round(avgScore - 72)));
      return calculated;
    }
    
    return null;
  };

  // 사용자 정보 조회
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getMyProfile
  });

  // 사용자 ID 추출 (핸디캡 정보 조회용)
  const userId = currentUser?.id || (currentUser?.data && currentUser.data.id) || null;

  // 핸디캡 정보 조회 (Initial vs Calculated 구분)
  const { data: handicapResponse, isLoading: handicapLoading } = useQuery({
    queryKey: ['user-handicap', userId],
    queryFn: () => usersApi.getUserHandicap(userId),
    enabled: !!userId, // userId가 있을 때만 조회
    retry: false, // 실패 시 재시도 안 함 (핸디캡 정보는 선택적)
  });

  // 핸디캡 정보 추출
  const handicapInfo = handicapResponse?.data || handicapResponse || {
    initial_handicap: null,
    calculated_handicap: null,
    handicap_update_method: null,
    handicap_calculation_count: 0,
    is_auto_calculated: false,
  };

  // 프로필 업데이트 뮤테이션
  const updateProfileMutation = useMutation({
    mutationFn: (data) => usersApi.updateMyProfile(data),
    onSuccess: (response) => {
      console.log('프로필 업데이트 성공:', response);
      // 사용자 프로필 쿼리 무효화하여 최신 데이터 다시 불러오기
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      console.log('사용자 프로필 쿼리 무효화 완료');
      
      // 편집 모드에서 저장한 경우 편집 모드 비활성화
      if (isEditing) {
        setIsEditing(false);
        console.log('편집 모드 비활성화');
      }
      // 성공 모달 표시 (사용자 확인 후 이동하도록 변경)
      setShowSuccessModal(true);
    },
    onError: (error) => {
      console.log('프로필 업데이트 실패:', error);
      const errorMessage = error.response?.data?.detail || '프로필 업데이트에 실패했습니다.';
      setToast({ open: true, message: errorMessage, tone: 'error' });
    }
  });

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast.open) return undefined;
    const timeout = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.open]);

  // 사용자 데이터 로드 및 폼 초기화
  useEffect(() => {
    console.log('currentUser 전체 데이터:', currentUser);
    console.log('currentUser?.data:', currentUser?.data);
    
    // API 응답 구조 확인: currentUser 자체가 사용자 데이터인지, currentUser.data가 사용자 데이터인지 확인
    let userData = null;
    
    if (currentUser) {
      const currentUserAny = currentUser;
      // currentUser 자체가 사용자 데이터인 경우 (백엔드에서 직접 UserResponse 반환)
      if (currentUserAny.id && currentUserAny.email) {
        userData = currentUserAny;
        console.log('currentUser 자체가 사용자 데이터:', userData);
      }
      // currentUser.data가 사용자 데이터인 경우
      else if (currentUserAny.data && currentUserAny.data.id && currentUserAny.data.email) {
        userData = currentUserAny.data;
        console.log('currentUser.data가 사용자 데이터:', userData);
      }
      // currentUser가 객체이지만 사용자 데이터가 아닌 경우
      else {
        console.log('currentUser 구조 분석:', {
          hasId: !!currentUserAny.id,
          hasEmail: !!currentUserAny.email,
          hasData: !!currentUserAny.data,
          dataHasId: !!(currentUserAny.data && currentUserAny.data.id),
          dataHasEmail: !!(currentUserAny.data && currentUserAny.data.email),
          keys: Object.keys(currentUserAny),
          dataKeys: currentUserAny.data ? Object.keys(currentUserAny.data) : []
        });
      }
    }
    
    if (userData) {
      console.log('사용자 데이터 로드 성공:', userData);
      
      // 생년월일을 yyyy-MM-dd 형식으로 변환
      let formattedBirthdate = '';
      if (userData.birthdate) {
        try {
          const date = new Date(userData.birthdate);
          if (!isNaN(date.getTime())) {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            formattedBirthdate = `${yyyy}-${mm}-${dd}`;
          }
        } catch (e) {
          console.error('생년월일 변환 에러:', e);
        }
      }
      
      // 평균 스코어로부터 핸디캡 자동 계산
      const averageScoreRaw = userData.average_score ?? '';
      // 평균 스코어가 숫자 문자열이면 숫자로 변환, 아니면 그대로 유지
      const averageScore = averageScoreRaw === '' ? '' : (typeof averageScoreRaw === 'number' ? averageScoreRaw : (isNaN(parseFloat(averageScoreRaw)) ? averageScoreRaw : parseFloat(averageScoreRaw)));
      const calculatedHandicap = calculateHandicapFromAverageScore(averageScore);
      // calculatedHandicap이 0일 수도 있으므로 !== null 체크 필요
      const finalHandicap = calculatedHandicap !== null && calculatedHandicap !== undefined 
        ? String(calculatedHandicap) 
        : (userData.handicap !== null && userData.handicap !== undefined && userData.handicap !== '' ? String(userData.handicap) : '');
      
      // 폼 데이터 초기화
      setFormData({
        realname: userData.realname || '',
        phone_number: userData.phone_number || '',
        birthdate: formattedBirthdate,
        gender: userData.gender || '',
        handicap: finalHandicap,
        average_score: averageScore,
        calculatedHandicap: calculatedHandicap
      });
      
      // 프로필 완성도 확인
      const isComplete = checkProfileCompleteness(userData);
      setIsProfileComplete(isComplete);
      // 미완성 사용자라면 즉시 편집 모드로 전환
      if (!isComplete) {
        setIsEditing(true);
      }
      console.log('프로필 완성도:', isComplete);
    }
  }, [currentUser]);

  // 핸디캡 정보는 평균 타수로부터 자동 계산되므로 이 useEffect는 제거

  // 프로필 완성도 확인
  const checkProfileCompleteness = (userData) => {
    const requiredFields = ['realname', 'phone_number', 'birthdate', 'gender'];
    return requiredFields.every(field => userData[field] && userData[field].trim() !== '');
  };

  // 폼 데이터 업데이트
  const handleInputChange = (field, value) => {
    // 한글 IME 조합 중에는 필터/검증을 적용하지 않고 그대로 입력을 반영한다
    if (field === 'realname' && isNameComposing) {
      setFormData(prev => ({ ...prev, realname: value }));
      // 조합 중이라도 값이 비어있지 않으면 즉시 에러 메시지를 지워 UX 깜빡임 방지
      if ((value || '').trim()) {
        setErrors(prev => ({ ...prev, realname: '' }));
      }
      return;
    }
    // 실명 입력 규칙:
    // - 한글 포함 시: 한글만 허용(띄어쓰기 불가)
    // - 그 외(영문 등): 알파벳과 공백만 허용(숫자/특수문자 불가)
    if (field === 'realname') {
      const hasKorean = /[\uAC00-\uD7A3]/.test(value);
      if (hasKorean) {
        value = value.replace(/[^\uAC00-\uD7A3]/g, '');
      } else {
        value = value.replace(/[^A-Za-z ]/g, '');
      }
    }

    // 전화번호: 숫자만, 11자리 제한
    if (field === 'phone_number') {
      value = value.replace(/[^0-9]/g, '').slice(0, 11);
    }

    // 핸디캡: 정수만 허용
    if (field === 'handicap') {
      // 숫자만 허용 (소수점 제거)
      value = value.replace(/[^0-9]/g, '');
    }
    // 평균 스코어: 정수만 허용 (55-144)
    if (field === 'average_score') {
      value = value.replace(/[^0-9]/g, '');
    }

    // 평균 스코어 입력 시 핸디캡 자동 계산
    let calculatedHandicap = null;
    if (field === 'average_score') {
      calculatedHandicap = calculateHandicapFromAverageScore(value);
    }

    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      // 평균 스코어 입력 시 핸디캡 자동 계산
      if (field === 'average_score') {
        if (calculatedHandicap !== null && calculatedHandicap !== undefined) {
          // 유효한 범위 내에서 핸디캡 계산 (0도 포함)
          newData.handicap = String(calculatedHandicap);
          newData.calculatedHandicap = calculatedHandicap;
        } else if (value === '' || value === null || value === undefined) {
          // 평균 스코어가 비어있으면 핸디캡도 비우기
          newData.handicap = '';
          newData.calculatedHandicap = null;
        } else {
          // 범위를 벗어나면 핸디캡 비우기
          newData.handicap = '';
          newData.calculatedHandicap = null;
        }
      }
      return newData;
    });
    
    // 실시간 필드 검증 및 에러 업데이트
    const fieldError = (() => {
      switch (field) {
        case 'realname': {
          const name = (value || '').trim();
          if (!name) return '실명을 입력해주세요.';
          if (name.length < 2) return '실명은 2자 이상 입력해주세요.';
          const hasKorean = /[\uAC00-\uD7A3]/.test(name);
          if (hasKorean) {
            if (!/^[\uAC00-\uD7A3]+$/.test(name)) return '한글 이름은 공백 없이 한글만 입력해주세요.';
          } else {
            if (!/^[A-Za-z ]+$/.test(name)) return '영문 이름은 알파벳과 공백만 입력해주세요.';
          }
          return '';
        }
        case 'phone_number': {
          if (!value) return '전화번호를 입력해주세요.';
          if (!/^\d{11}$/.test(value)) return '전화번호는 11자리 숫자여야 합니다.';
          return '';
        }
        case 'birthdate': {
          if (!value) return '생년월일을 선택해주세요.';
          try {
            const birth = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
            if (age < 14) return '만 14세 이상만 가입할 수 있습니다.';
          } catch (e) {
            return '올바른 생년월일을 입력해주세요.';
          }
          return '';
        }
        case 'gender': {
          if (!value) return '성별을 선택해주세요.';
          return '';
        }
        case 'handicap': {
          // 핸디캡은 이제 평균 타수로부터 자동 계산되므로 검증 제거 (하위 호환성 유지)
          return '';
        }
        case 'average_score': {
          if (value === '' || value === null || value === undefined) return '평균 스코어를 입력해주세요.';
          const num = Number(value);
          if (Number.isNaN(num) || num < 55 || num > 144) return '평균 스코어는 55-144 사이의 숫자여야 합니다.';
          return '';
        }
        default:
          return '';
      }
    })();

    setErrors(prev => ({
      ...prev,
      [field]: fieldError
    }));
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.realname.trim()) {
      newErrors.realname = '실명을 입력해주세요.';
    } else if (formData.realname.trim().length < 2) {
      newErrors.realname = '실명은 2자 이상 입력해주세요.';
    } else {
      const hasKorean = /[\uAC00-\uD7A3]/.test(formData.realname);
      if (hasKorean) {
        // 한글만, 공백 불가
        if (!/^[\uAC00-\uD7A3]+$/.test(formData.realname)) {
          newErrors.realname = '한글 이름은 공백 없이 한글만 입력해주세요.';
        }
      } else {
        // 영문 및 공백만 허용
        if (!/^[A-Za-z ]+$/.test(formData.realname)) {
          newErrors.realname = '영문 이름은 알파벳과 공백만 입력해주세요.';
        }
      }
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = '전화번호를 입력해주세요.';
    } else if (!/^\d{11}$/.test(formData.phone_number)) {
      newErrors.phone_number = '전화번호는 11자리 숫자여야 합니다.';
    }
    
    if (!formData.birthdate) {
      newErrors.birthdate = '생년월일을 선택해주세요.';
    } else {
      // 만 14세 이상 프론트 검증
      try {
        const birth = new Date(formData.birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        if (age < 14) {
          newErrors.birthdate = '만 14세 이상만 가입할 수 있습니다.';
        }
      } catch (e) {
        newErrors.birthdate = '올바른 생년월일을 입력해주세요.';
      }
    }
    
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요.';
    }
    
    // 평균 타수(필수) 범위 55-144 (핸디캡 자동 계산용)
    if (formData.average_score === '' || formData.average_score === null || formData.average_score === undefined) {
      newErrors.average_score = '평균 스코어를 입력해주세요.';
    } else if (isNaN(formData.average_score) || Number(formData.average_score) < 55 || Number(formData.average_score) > 144) {
      newErrors.average_score = '평균 스코어는 55-144 사이의 숫자여야 합니다.';
    }
    
    return newErrors;
  };

  // 프로필 저장
  const handleSave = async () => {
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      // 프로필 정보 업데이트 (핸디캡은 평균 타수로 자동 계산)
      const submitData = {
        ...formData,
        // handicap은 average_score로부터 자동 계산되므로 제거
        handicap: undefined,
        average_score: formData.average_score ? parseInt(formData.average_score) : undefined,
        calculatedHandicap: undefined  // UI 전용 필드이므로 제거
      };
      
      // UI 전용 필드 제거
      delete submitData.handicap;
      delete submitData.calculatedHandicap;
      
      console.log('프로필 저장 요청:', submitData);
      await updateProfileMutation.mutateAsync(submitData);
      
      // 평균 타수가 있으면 average_score로 핸디캡 자동 계산
      if (userId && formData.average_score && formData.average_score !== '' && formData.average_score !== null && formData.average_score !== undefined) {
        try {
          const averageScoreValue = parseInt(formData.average_score);
          
          if (!isNaN(averageScoreValue) && averageScoreValue >= 55 && averageScoreValue <= 144) {
            await usersApi.updateUserHandicap(userId, {
              average_score: averageScoreValue,
            });
            // 핸디캡 정보 쿼리 무효화
            queryClient.invalidateQueries({ queryKey: ['user-handicap', userId] });
          }
        } catch (handicapErr) {
          console.error('핸디캡 수정 실패:', handicapErr);
          const handicapMessage = handicapErr?.response?.data?.detail || '핸디캡 수정에 실패했습니다.';
          setToast({ open: true, message: handicapMessage, tone: 'error' });
        }
      }
    } catch (error) {
      // updateProfileMutation의 onError에서 처리됨
      console.error('프로필 저장 실패:', error);
    }
  };

  // 편집 모드 토글
  const toggleEdit = () => {
    if (!isEditing) {
      // 편집 모드로 전환 (평균 타수는 이미 formData에 있음)
    } else {
      // 편집 취소 시 원래 데이터로 복원
      if (currentUser) {
        const userData = currentUser.data || currentUser;
        setFormData({
          realname: userData.realname || '',
          phone_number: userData.phone_number || '',
          birthdate: userData.birthdate || '',
          gender: userData.gender || '',
          handicap: userData.handicap || '',
          average_score: userData.average_score || '',
          calculatedHandicap: null
        });
      }
    }
    setIsEditing(!isEditing);
    setErrors({});
  };

  // 성공 모달 닫기
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    const returnTo = location.state?.returnTo;
    const fromClubRegister = location.state?.fromClubRegister;
    if (fromClubRegister || returnTo) {
      navigate(returnTo || '/clubs/register', { state: { fromProfileComplete: true }, replace: true });
    } else if (!isProfileComplete) {
      navigate('/');
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span className="text-sm font-medium">홈</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">프로필 완성</h1>
            <p className="text-sm sm:text-base text-neutral-600">프로필 정보를 입력하여 서비스를 완전히 이용하세요</p>
          </div>
        </div>

        {/* 프로필 완성도 표시 */}
        {!isProfileComplete && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-center">
                <FaInfoCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">프로필을 완성해주세요</h3>
                  <p className="text-sm text-yellow-700">모든 필수 정보 입력 후, 클럽을 등록할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 프로필 폼 */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">프로필 정보</h2>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center space-x-2 px-3 py-2 sm:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    <FaSave className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">{updateProfileMutation.isPending ? '저장 중...' : '저장'}</span>
                  </button>
                  <button
                    onClick={toggleEdit}
                    className="flex items-center space-x-2 px-3 py-2 sm:px-4 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">취소</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleEdit}
                  className="flex items-center space-x-2 px-3 py-2 sm:px-4 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <FaEdit className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">편집</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* 실명 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <FaUser className="inline w-4 h-4 mr-2" />
                실명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.realname}
                onChange={(e) => handleInputChange('realname', e.target.value)}
                onCompositionStart={() => setIsNameComposing(true)}
                onCompositionEnd={(e) => { setIsNameComposing(false); handleInputChange('realname', e.target.value); }}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.realname ? 'border-red-300' : 'border-neutral-300'
                } ${!isEditing ? 'bg-neutral-50' : ''}`}
                placeholder="실명을 입력하세요"
              />
              {errors.realname && (
                <p className="mt-1 text-sm text-red-600">{errors.realname}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <FaPhone className="inline w-4 h-4 mr-2" />
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.phone_number ? 'border-red-300' : 'border-neutral-300'
                } ${!isEditing ? 'bg-neutral-50' : ''}`}
                placeholder="전화번호를 입력하세요"
              />
              {errors.phone_number && (
                <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
              )}
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <FaCalendarAlt className="inline w-4 h-4 mr-2" />
                생년월일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => handleInputChange('birthdate', e.target.value)}
                disabled={!isEditing}
                max={maxBirthdate}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.birthdate ? 'border-red-300' : 'border-neutral-300'
                } ${!isEditing ? 'bg-neutral-50' : ''}`}
              />
              {errors.birthdate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>
              )}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <FaVenusMars className="inline w-4 h-4 mr-2" />
                성별 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={formData.gender === 'MALE'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    disabled={!isEditing}
                    className="mr-3"
                  />
                  <span className="text-sm text-neutral-700">남성</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={formData.gender === 'FEMALE'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    disabled={!isEditing}
                    className="mr-3"
                  />
                  <span className="text-sm text-neutral-700">여성</span>
                </label>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* 평균 타수 (핸디캡 자동 계산) */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <FaChartLine className="inline w-4 h-4 mr-2" />
                평균 타수 <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    min="55"
                    max="144"
                    step="1"
                    value={formData.average_score || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      handleInputChange('average_score', value);
                      // 평균 타수 입력 시 자동으로 핸디캡 계산
                      if (value && !isNaN(value)) {
                        const calculatedHandicap = Math.max(0, Math.min(72, parseFloat(value) - 72));
                        setFormData(prev => ({ ...prev, calculatedHandicap: calculatedHandicap.toFixed(1) }));
                      } else {
                        setFormData(prev => ({ ...prev, calculatedHandicap: null }));
                      }
                    }}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.average_score ? 'border-red-300' : 'border-neutral-300'
                    }`}
                    placeholder="평균 타수를 입력하세요 (55-144)"
                  />
                  {formData.calculatedHandicap && (
                    <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                      <p className="font-semibold">계산된 핸디캡: {formData.calculatedHandicap}</p>
                      <p className="text-xs text-primary-600 mt-1">
                        평균 타수 {formData.average_score}타 → 핸디캡 {formData.calculatedHandicap}
                      </p>
                    </div>
                  )}
                  {handicapInfo.calculated_handicap !== null && handicapInfo.calculated_handicap !== undefined && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                      <p className="font-semibold">자동 계산 핸디캡: {handicapInfo.calculated_handicap}</p>
                      <p className="text-blue-600">
                        ({handicapInfo.handicap_calculation_count}경기 기준)
                      </p>
                      <p className="mt-1 text-blue-600">
                        자동 계산된 핸디캡은 경기 기록 기반으로 자동 업데이트됩니다.
                      </p>
                    </div>
                  )}
                  {errors.average_score && (
                    <p className="mt-1 text-sm text-red-600">{errors.average_score}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {handicapLoading ? (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800">
                      불러오는 중...
                    </div>
                  ) : (
                    <>
                      {handicapInfo.calculated_handicap !== null && handicapInfo.calculated_handicap !== undefined ? (
                        <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-semibold text-primary-900">
                              자동 계산: {handicapInfo.calculated_handicap}
                            </div>
                            {handicapInfo.handicap_update_method === 'AUTO' && (
                              <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full font-medium">
                                자동
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-primary-700 mt-1">
                            ({handicapInfo.handicap_calculation_count}경기 기준)
                          </div>
                          {handicapInfo.handicap_update_method === 'AUTO' && (
                            <div className="text-xs text-primary-600 mt-1">
                              경기 기록 기반으로 자동 업데이트됩니다
                            </div>
                          )}
                        </div>
                      ) : null}
                      <div className={`rounded-lg border px-3 py-2 text-sm ${
                        handicapInfo.calculated_handicap !== null && handicapInfo.calculated_handicap !== undefined
                          ? 'border-neutral-200 bg-neutral-50 text-neutral-700'
                          : 'border-neutral-200 bg-white text-neutral-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span>
                            {/* 평균 타수로 계산된 핸디캡이 있으면 우선 표시 */}
                            {(() => {
                              // 평균 스코어를 숫자로 변환
                              const avgScoreValue = formData.average_score === '' || formData.average_score === null || formData.average_score === undefined
                                ? null
                                : (typeof formData.average_score === 'number' 
                                    ? formData.average_score 
                                    : (isNaN(parseFloat(formData.average_score)) ? null : parseFloat(formData.average_score)));
                              
                              const avgScoreHandicap = avgScoreValue !== null ? calculateHandicapFromAverageScore(avgScoreValue) : null;
                              
                              if (avgScoreHandicap !== null && avgScoreHandicap !== undefined) {
                                return `평균 타수 기반: ${avgScoreHandicap}`;
                              }
                              if (handicapInfo.initial_handicap !== null && handicapInfo.initial_handicap !== undefined) {
                                return `수동 입력: ${handicapInfo.initial_handicap}`;
                              }
                              if (formData.handicap !== null && formData.handicap !== undefined && formData.handicap !== '') {
                                return `수동 입력: ${formData.handicap}`;
                              }
                              return '미등록';
                            })()}
                          </span>
                          {/* 평균 타수 기반 핸디캡이 계산되지 않았을 때만 "수동" 버튼 표시 */}
                          {(() => {
                            const avgScoreHandicap = calculateHandicapFromAverageScore(formData.average_score);
                            return avgScoreHandicap === null && handicapInfo.handicap_update_method === 'MANUAL';
                          })() && (
                            <span className="px-2 py-0.5 bg-neutral-600 text-white text-xs rounded-full font-medium ml-2">
                              수동
                            </span>
                          )}
                        </div>
                      </div>
                      {handicapInfo.calculated_handicap === null || handicapInfo.calculated_handicap === undefined ? (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                          <div className="flex items-start">
                            <FaInfoCircle className="mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-semibold mb-1">💡 더 정확한 핸디캡을 위해</p>
                              {handicapInfo.handicap_calculation_count === 0 ? (
                                <p className="text-yellow-700">
                                  경기 기록이 없습니다. 경기를 완료하면 자동으로 핸디캡이 계산됩니다.
                                </p>
                              ) : handicapInfo.handicap_calculation_count < 5 ? (
                                <p className="text-yellow-700">
                                  5경기 이상 참가하시면 더 정확한 핸디캡을 제공받을 수 있습니다. (현재 {handicapInfo.handicap_calculation_count}경기)
                                </p>
                              ) : (
                                <p className="text-yellow-700">
                                  경기 기록을 입력해주세요.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : handicapInfo.handicap_calculation_count >= 5 ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                          <div className="flex items-center">
                            <FaCheckCircle className="mr-2" />
                            <span className="font-semibold">
                              자동 계산 핸디캡 사용 중 ({handicapInfo.handicap_calculation_count}경기 기준)
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 핸디캡 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <FaGolfBall className="inline w-4 h-4 mr-2" />
                핸디캡 <span className="text-red-500">*</span>
                <span className="text-xs text-neutral-500 ml-2">(평균 스코어로 자동 계산)</span>
              </label>
              <input
                type="number"
                min="0"
                max="72"
                step="1"
                value={(() => {
                  // 평균 타수로 계산된 핸디캡 우선 표시
                  const avgScoreValue = formData.average_score === '' || formData.average_score === null || formData.average_score === undefined
                    ? null
                    : (typeof formData.average_score === 'number' 
                        ? formData.average_score 
                        : (isNaN(parseFloat(formData.average_score)) ? null : parseFloat(formData.average_score)));
                  
                  const avgScoreHandicap = avgScoreValue !== null ? calculateHandicapFromAverageScore(avgScoreValue) : null;
                  
                  if (avgScoreHandicap !== null && avgScoreHandicap !== undefined) {
                    return avgScoreHandicap;
                  }
                  if (formData.calculatedHandicap !== null && formData.calculatedHandicap !== undefined) {
                    return Math.round(parseFloat(formData.calculatedHandicap));
                  }
                  if (formData.handicap !== null && formData.handicap !== undefined && formData.handicap !== '') {
                    return typeof formData.handicap === 'number' ? formData.handicap : parseFloat(formData.handicap);
                  }
                  return '';
                })()}
                onChange={() => {}}
                disabled={true}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50 border-neutral-300"
                placeholder="평균 스코어 입력 시 자동 계산됩니다"
              />
            </div>

          </div>

          {/* 직전 대회 성적 섹션 */}
          {isProfileComplete && !isEditing && userId && (
            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <LastMeetingResultCard userId={userId} />
              <ScoreHistoryCard userId={userId} initialLimit={10} />
            </div>
          )}

          {/* 프로필이 이미 완성된 경우: 폼 하단에 진행 버튼 표시 */}
          {isProfileComplete && !isEditing && (
            <div className="mt-4 sm:mt-6 pt-4 border-t border-neutral-200 flex justify-end gap-2 sm:gap-3">
              <button
                onClick={() => {
                  const fromClubRegister = location.state?.fromClubRegister;
                  if (fromClubRegister) {
                    navigate('/clubs');
                  } else {
                    navigate('/');
                  }
                }}
                className="px-3 py-2 sm:px-4 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-xs sm:text-sm"
              >
                취소
              </button>
              <button
                onClick={() => {
                  const returnTo = location.state?.returnTo;
                  navigate(returnTo || '/', { replace: true, state: { fromProfileComplete: true } });
                }}
                className="px-3 py-2 sm:px-5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                프로필이 업데이트되었습니다!
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                프로필 정보가 성공적으로 저장되었습니다.
              </p>
              <button
                onClick={handleSuccessModalClose}
                className="w-full px-3 py-2 sm:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {toast.open && (
        <div
          className={`fixed top-6 right-6 z-50 flex max-w-xs items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.tone === 'error'
              ? 'bg-red-600 text-white'
              : toast.tone === 'info'
              ? 'bg-blue-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {toast.tone === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default UserProfileCompletePage;
