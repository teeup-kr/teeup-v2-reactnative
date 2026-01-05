import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FaUser, FaPhone, FaCalendarAlt, FaVenusMars, FaGolfBall, FaChartLine, FaEdit, FaTimes, FaSave } from 'react-icons/fa';
import { usersApi } from '../lib';

const ProfileInputModal = ({ isOpen, onClose, onSuccess, currentUser }) => {
  const [formData, setFormData] = useState({
    realname: '',
    phone_number: '',
    birthdate: '',
    gender: '',
    handicap: '',
    average_score: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isNameComposing, setIsNameComposing] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (!averageScore || isNaN(averageScore)) return null;
    const avgScore = parseFloat(averageScore);
    if (avgScore >= 55 && avgScore <= 144) {
      return Math.max(0, Math.min(72, Math.round(avgScore - 72)));
    }
    return null;
  };

  // 사용자 데이터 로드 및 폼 초기화
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    
    const userData = currentUser.data || currentUser;
    
    // 폼 데이터 초기화
    // birthdate를 yyyy-MM-dd 형식으로 변환
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
    
    // 평균 스코어로부터 핸디캡 자동 계산 (평균 스코어가 유효한 경우)
    const averageScore = userData.average_score ?? '';
    const calculatedHandicap = calculateHandicapFromAverageScore(averageScore);
    const finalHandicap = calculatedHandicap !== null ? String(calculatedHandicap) : (userData.handicap ?? '');
    
    setFormData({
      realname: userData.realname || '',
      phone_number: userData.phone_number || '',
      birthdate: formattedBirthdate,
      gender: userData.gender || '',
      handicap: finalHandicap,
      average_score: averageScore
    });
    
    // 프로필 완성도 확인
    const isComplete = checkProfileCompleteness(userData);
    setIsProfileComplete(isComplete);
    // 미완성 사용자라면 즉시 편집 모드로 전환
    if (!isComplete) {
      setIsEditing(true);
    }
  }, [isOpen, currentUser]);

  // 모달 열릴 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 body 스크롤 막기
      document.body.style.overflow = 'hidden';
    } else {
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = '';
    }
    
    // cleanup 함수
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        realname: '',
        phone_number: '',
        birthdate: '',
        gender: '',
        handicap: '',
        average_score: ''
      });
      setErrors({});
      setIsEditing(false);
      setSaving(false);
    }
  }, [isOpen]);

  // 프로필 완성도 확인
  const checkProfileCompleteness = (userData) => {
    const requiredFields = ['realname', 'phone_number', 'birthdate', 'gender', 'handicap', 'average_score'];
    return requiredFields.every(field => {
      const value = userData[field];
      if (value === null || value === undefined) return false;
      const strValue = String(value).trim();
      return strValue !== '';
    });
  };

  // 필수 필드가 모두 입력되었는지 확인
  const isFormValid = () => {
    const requiredFields = ['realname', 'phone_number', 'birthdate', 'gender', 'handicap', 'average_score'];
    return requiredFields.every(field => {
      const value = formData[field];
      if (value === null || value === undefined) return false;
      const strValue = String(value).trim();
      return strValue !== '';
    });
  };

  // 프로필 업데이트 뮤테이션
  const updateProfileMutation = useMutation({
    mutationFn: (data) => usersApi.updateMyProfile(data),
    onSuccess: (response) => {
      console.log('프로필 업데이트 성공:', response);
      onSuccess();
    },
    onError: (error) => {
      console.log('프로필 업데이트 실패:', error);
      const errorMessage = error.response?.data?.detail || '프로필 업데이트에 실패했습니다.';
      setErrors({ general: errorMessage });
      setSaving(false);
    }
  });

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
    // 평균 스코어: 숫자만 허용(소수점 허용)
    if (field === 'average_score') {
      value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
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
      if (field === 'average_score' && calculatedHandicap !== null) {
        newData.handicap = String(calculatedHandicap);
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
          // 핸디캡은 평균 스코어로부터 자동 계산되므로 검증은 평균 스코어 검증에서 처리
          return '';
        }
        case 'average_score': {
          if (value === '' || value === null || value === undefined) return '평균 스코어를 입력해주세요.';
          const num = Number(value);
          if (Number.isNaN(num) || num < 55 || num > 144) return '평균 스코어는 55-144 사이의 숫자여야 합니다.';
          // 평균 스코어가 유효하면 핸디캡도 자동으로 계산되므로 핸디캡 에러 제거
          if (!Number.isNaN(num) && num >= 55 && num <= 144) {
            setErrors(prev => ({ ...prev, handicap: '' }));
          }
          return '';
        }
        default:
          return '';
      }
    })();

    setErrors(prev => ({
      ...prev,
      [field]: fieldError,
      general: '' // 일반 에러 메시지 초기화
    }));
  };

  // 폼 유효성 검사
  const validateForm = () => {
    console.log('🔍 validateForm 호출 - formData.birthdate:', formData.birthdate);
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
    
    // 생년월일 검증: null, undefined, 빈 문자열, 공백만 있는 경우 모두 체크
    if (!formData.birthdate || 
        formData.birthdate === null || 
        formData.birthdate === undefined || 
        String(formData.birthdate).trim() === '' ||
        formData.birthdate === 'Invalid Date') {
      newErrors.birthdate = '생년월일을 선택해주세요.';
    } else {
      // 만 14세 이상 프론트 검증
      try {
        const birth = new Date(formData.birthdate);
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
        }
      } catch (e) {
        newErrors.birthdate = '올바른 생년월일을 입력해주세요.';
      }
    }
    
    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요.';
    }
    
    // 평균 스코어(필수) 범위 55-144 (핸디캡 자동 계산용)
    if (formData.average_score === '' || formData.average_score === null || formData.average_score === undefined) {
      newErrors.average_score = '평균 스코어를 입력해주세요.';
    } else if (isNaN(formData.average_score) || Number(formData.average_score) < 55 || Number(formData.average_score) > 144) {
      newErrors.average_score = '평균 스코어는 55-144 사이의 숫자여야 합니다.';
    } else {
      // 평균 스코어가 유효하면 핸디캡 자동 계산 확인
      const avgScore = Number(formData.average_score);
      const calculatedHandicap = Math.max(0, Math.min(72, Math.round(avgScore - 72)));
      if (formData.handicap === '' || formData.handicap === null || formData.handicap === undefined) {
        newErrors.handicap = '평균 스코어를 입력하면 핸디캡이 자동 계산됩니다.';
      } else if (isNaN(formData.handicap) || Number(formData.handicap) < 0 || Number(formData.handicap) > 72) {
        newErrors.handicap = '핸디캡은 0-72 사이의 숫자여야 합니다.';
      }
    }
    
    return newErrors;
  };

  // 프로필 저장
  const handleSave = () => {
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSaving(true);
    
    // 숫자 필드 변환
    const submitData = {
      ...formData,
      handicap: parseInt(formData.handicap, 10),
      average_score: parseFloat(formData.average_score)
    };
    
    console.log('프로필 저장 요청:', submitData);
    updateProfileMutation.mutate(submitData);
  };

  // 편집 모드 토글
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // 편집 취소 시 원래 데이터로 복원
      const userData = currentUser.data || currentUser;
      setFormData({
        realname: userData.realname || '',
        phone_number: userData.phone_number || '',
        birthdate: userData.birthdate || '',
        gender: userData.gender || '',
        handicap: userData.handicap ?? '',
        average_score: userData.average_score ?? ''
      });
    }
    setErrors({});
  };

  // 가입 신청 핸들러 (프로필이 이미 완성된 경우)
  const handleJoinDirect = () => {
    console.log('🔍 handleJoinDirect 호출 - formData:', formData);
    
    // 항상 폼 유효성 검사 실행
    const validationErrors = validateForm();
    console.log('🔍 validateForm 결과:', validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      console.log('❌ 검증 실패, 에러 표시:', validationErrors);
      setErrors(validationErrors);
      // 에러가 있으면 스크롤을 첫 번째 에러 필드로 이동
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"], input[id*="${firstErrorField}"], input[type="date"][max]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }
    
    // 모든 필수 필드가 채워졌는지 다시 한 번 확인 (이중 체크)
    const requiredFields = ['realname', 'phone_number', 'birthdate', 'gender', 'handicap', 'average_score'];
    const emptyFields = requiredFields.filter(field => {
      const value = formData[field];
      // null, undefined 체크
      if (value === null || value === undefined) return true;
      
      // 문자열인 경우 trim해서 체크
      const strValue = String(value).trim();
      if (strValue === '') return true;
      
      // 날짜 필드인 경우 특별 체크
      if (field === 'birthdate') {
        if (strValue === 'Invalid Date' || strValue === 'NaN') return true;
        const date = new Date(strValue);
        if (isNaN(date.getTime())) return true;
      }
      
      return false;
    });
    
    if (emptyFields.length > 0) {
      const fieldNames = {
        realname: '실명',
        phone_number: '전화번호',
        birthdate: '생년월일',
        gender: '성별',
        handicap: '핸디캡',
        average_score: '평균 스코어'
      };
      const missingFields = emptyFields.map(f => fieldNames[f] || f).join(', ');
      setErrors({ general: `다음 필수 항목을 입력해주세요: ${missingFields}` });
      
      // 첫 번째 빈 필드로 스크롤
      const firstEmptyField = emptyFields[0];
      const emptyFieldElement = document.querySelector(`[name="${firstEmptyField}"], input[id*="${firstEmptyField}"]`);
      if (emptyFieldElement) {
        emptyFieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emptyFieldElement.focus();
      }
      return;
    }
    
    // 모든 검증 통과 시에만 가입 신청 진행
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 pb-16 sm:pb-20">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] sm:max-h-[80vh] flex flex-col shadow-xl -mt-4 sm:-mt-8">
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
            클럽 가입 - 프로필 정보
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 sm:p-2"
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 프로필 완성도 표시 */}
        {!isProfileComplete && (
          <div className="mb-3 sm:mb-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 sm:p-3">
              <p className="text-xs sm:text-sm text-yellow-800">
                모든 필수 정보를 입력해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 일반 에러 메시지 */}
        {errors.general && (
          <div className="mb-3 sm:mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3">
              <p className="text-xs sm:text-sm text-red-800">{errors.general}</p>
            </div>
          </div>
        )}

        {/* 프로필 완성 사용자의 경우 편집 버튼 표시 */}
        {isProfileComplete && !isEditing && (
          <div className="mb-3 sm:mb-4 flex justify-end">
            <button
              onClick={toggleEdit}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors text-xs sm:text-sm"
            >
              <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>수정</span>
            </button>
          </div>
        )}

        {/* 프로필 폼 */}
        <div className="space-y-3 sm:space-y-4">
          {/* 실명 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
              {/* <FaUser className="inline w-4 h-4 mr-2" /> */}
              실명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.realname}
              onChange={(e) => handleInputChange('realname', e.target.value)}
              onCompositionStart={() => setIsNameComposing(true)}
              onCompositionEnd={(e) => { setIsNameComposing(false); handleInputChange('realname', e.target.value); }}
              disabled={!isEditing && isProfileComplete}
              className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.realname ? 'border-red-300' : 'border-neutral-300'
              } ${!isEditing && isProfileComplete ? 'bg-neutral-50' : ''}`}
              placeholder="실명을 입력하세요"
            />
            {errors.realname && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.realname}</p>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
              {/* <FaPhone className="inline w-4 h-4 mr-2" /> */}
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              disabled={!isEditing && isProfileComplete}
              className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.phone_number ? 'border-red-300' : 'border-neutral-300'
              } ${!isEditing && isProfileComplete ? 'bg-neutral-50' : ''}`}
              placeholder="전화번호를 입력하세요"
            />
            {errors.phone_number && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.phone_number}</p>
            )}
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
              {/* <FaCalendarAlt className="inline w-4 h-4 mr-2" /> */}
              생년월일 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.birthdate}
              onChange={(e) => handleInputChange('birthdate', e.target.value)}
              disabled={!isEditing && isProfileComplete}
              max={maxBirthdate}
              className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.birthdate ? 'border-red-300' : 'border-neutral-300'
              } ${!isEditing && isProfileComplete ? 'bg-neutral-50' : ''}`}
            />
            {errors.birthdate && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.birthdate}</p>
            )}
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
              {/* <FaVenusMars className="inline w-4 h-4 mr-2" /> */}
              성별 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5 sm:space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="MALE"
                  checked={formData.gender === 'MALE'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  disabled={!isEditing && isProfileComplete}
                  className="mr-2 sm:mr-3 w-3.5 h-3.5 sm:w-4 sm:h-4"
                />
                <span className="text-xs sm:text-sm text-neutral-700">남성</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="FEMALE"
                  checked={formData.gender === 'FEMALE'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  disabled={!isEditing && isProfileComplete}
                  className="mr-2 sm:mr-3 w-3.5 h-3.5 sm:w-4 sm:h-4"
                />
                <span className="text-xs sm:text-sm text-neutral-700">여성</span>
              </label>
            </div>
            {errors.gender && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.gender}</p>
            )}
          </div>

          {/* 평균 스코어 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
              {/* <FaChartLine className="inline w-4 h-4 mr-2" /> */}
              평균 스코어 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="55"
              step="1"
              value={formData.average_score}
              onChange={(e) => handleInputChange('average_score', e.target.value)}
              disabled={!isEditing && isProfileComplete}
              className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.average_score ? 'border-red-300' : 'border-neutral-300'
              } ${!isEditing && isProfileComplete ? 'bg-neutral-50' : ''}`}
              placeholder="평균 스코어를 입력하세요 (55-144)"
            />
            {errors.average_score && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.average_score}</p>
            )}
          </div>

          {/* 핸디캡 */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1.5 sm:mb-2">
              {/* <FaGolfBall className="inline w-4 h-4 mr-2" /> */}
              핸디캡 <span className="text-red-500">*</span>
              <span className="text-[10px] sm:text-xs text-neutral-500 ml-1.5 sm:ml-2">(평균 스코어로 자동 계산)</span>
            </label>
            <input
              type="number"
              min="0"
              max="72"
              step="1"
              value={formData.handicap}
              onChange={(e) => handleInputChange('handicap', e.target.value)}
              disabled={true}
              className={`w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border rounded-lg bg-neutral-50 ${
                errors.handicap ? 'border-red-300' : 'border-neutral-300'
              }`}
              placeholder="평균 스코어 입력 시 자동 계산됩니다"
            />
            {errors.handicap && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.handicap}</p>
            )}
          </div>
        </div>
        </div>
        
        {/* 하단 버튼 - 고정 영역 */}
        <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-neutral-200 flex justify-end gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          >
            취소
          </button>
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={saving || updateProfileMutation.isPending || !isFormValid()}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <FaSave className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{saving || updateProfileMutation.isPending ? '저장 중...' : '저장'}</span>
            </button>
          ) : isProfileComplete ? (
            <>
              <button
                onClick={toggleEdit}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium"
              >
                수정
              </button>
              <button
                onClick={handleJoinDirect}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                가입 신청
              </button>
            </>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || updateProfileMutation.isPending || !isFormValid()}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving || updateProfileMutation.isPending ? '저장 중...' : '저장 및 가입 신청'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileInputModal;

