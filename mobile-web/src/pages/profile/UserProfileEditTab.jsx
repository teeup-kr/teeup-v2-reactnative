import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaVenusMars, FaGolfBall, FaChartLine, FaCheckCircle, FaInfoCircle, FaSave, FaLock, FaTimesCircle } from 'react-icons/fa';
import { usersApi, api } from '../../lib/api';
import ChangePasswordModal from './ChangePasswordModal';

const UserProfileEditTab = () => {
  const queryClient = useQueryClient();
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    nickname: '',
    realname: '',
    phone_number: '',
    birthdate: '',
    gender: '',
    average_score: '',
    calculatedHandicap: null
  });
  
  const [errors, setErrors] = useState({});
  const [isNameComposing, setIsNameComposing] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', tone: 'success' });

  // 만 14세 미만 입력 방지를 위한 최대 선택 가능 생년월일
  const maxBirthdate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 14);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  // 사용자 정보 조회
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getMyProfile
  });

  // 사용자 ID 추출
  const userId = currentUser?.id || (currentUser?.data && currentUser.data.id) || null;
  const userData = currentUser?.data || currentUser || {};

  // 소셜 로그인 사용자 여부 확인
  const isSocialLogin = userData.provider && userData.provider !== 'LOCAL';

  // 핸디캡 정보 조회
  const { data: handicapResponse, isLoading: handicapLoading } = useQuery({
    queryKey: ['user-handicap', userId],
    queryFn: () => usersApi.getUserHandicap(userId),
    enabled: !!userId,
    retry: false,
  });

  // 핸디캡 정보 추출
  const handicapInfo = handicapResponse?.data || handicapResponse || {
    initial_handicap: null,
    calculated_handicap: null,
    handicap_update_method: null,
    handicap_calculation_count: 0,
    is_auto_calculated: false,
  };

  // 사용자 데이터 로드 및 폼 초기화
  useEffect(() => {
    if (userData && userData.id) {
      setFormData({
        nickname: userData.nickname || '',
        realname: userData.realname || '',
        phone_number: userData.phone_number || '',
        birthdate: userData.birthdate ? userData.birthdate.split('T')[0] : '',
        gender: userData.gender || '',
        average_score: userData.average_score || '',
        calculatedHandicap: null
      });
      setNicknameChecked(true); // 기존 닉네임은 이미 확인된 것으로 간주
    }
  }, [userData]);

  // 닉네임 중복 확인 (버튼 클릭)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  
  const checkNicknameDuplicate = async () => {
    if (!formData.nickname) {
      setErrors(prev => ({ ...prev, nickname: '닉네임을 입력해주세요.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    // 닉네임 형식 검사
    if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      setErrors(prev => ({ ...prev, nickname: '닉네임은 2-20자여야 합니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    if (!/^[a-zA-Z가-힣0-9]+$/.test(formData.nickname)) {
      setErrors(prev => ({ ...prev, nickname: '닉네임은 영문 대소문자, 한글, 숫자만 사용 가능합니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    // 기존 닉네임과 동일하면 확인 불필요
    if (formData.nickname === userData.nickname) {
      setErrors(prev => ({ ...prev, nickname: '' }));
      setNicknameChecked(true);
      setNicknameMessage('기존 닉네임입니다.');
      return;
    }

    setIsCheckingNickname(true);
    try {
      const data = await api.get('/auth/check-nickname', {
        params: { nickname: formData.nickname }
      });

      if (data.is_available && data.is_valid) {
        setErrors(prev => ({ ...prev, nickname: '' }));
        setNicknameChecked(true);
        setNicknameMessage('사용 가능한 닉네임입니다.');
      } else {
        setErrors(prev => ({ ...prev, nickname: data.message }));
        setNicknameChecked(false);
        setNicknameMessage('');
      }
    } catch (error) {
      console.error('Nickname check error:', error);
      setErrors(prev => ({ ...prev, nickname: '닉네임 확인 중 오류가 발생했습니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 프로필 업데이트 뮤테이션
  const updateProfileMutation = useMutation({
    mutationFn: (data) => usersApi.updateMyProfile(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setToast({ open: true, message: '회원정보가 수정되었습니다.', tone: 'success' });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || '프로필 업데이트에 실패했습니다.';
      setToast({ open: true, message: errorMessage, tone: 'error' });
    }
  });

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast.open) return undefined;
    const timeout = setTimeout(() => {
      setToast(prev => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.open]);

  // 폼 데이터 업데이트
  const handleInputChange = (field, value) => {
    // 한글 IME 조합 중에는 필터/검증을 적용하지 않고 그대로 입력을 반영
    if (field === 'realname' && isNameComposing) {
      setFormData(prev => ({ ...prev, realname: value }));
      if ((value || '').trim()) {
        setErrors(prev => ({ ...prev, realname: '' }));
      }
      return;
    }

    // 실명 입력 규칙
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

    // 평균 스코어: 정수만 허용 (55-144)
    if (field === 'average_score') {
      value = value.replace(/[^0-9]/g, '');
      // 평균 타수 입력 시 자동으로 핸디캡 계산
      if (value && !isNaN(value)) {
        const avgScore = parseInt(value);
        if (avgScore >= 55 && avgScore <= 144) {
          const calculatedHandicap = Math.max(0, Math.min(72, avgScore - 72));
          setFormData(prev => ({ ...prev, calculatedHandicap: calculatedHandicap.toFixed(1) }));
        }
      } else {
        setFormData(prev => ({ ...prev, calculatedHandicap: null }));
      }
    }

    // 닉네임 변경 시 중복 확인 상태 초기화 (기존 닉네임과 동일하면 유지)
    if (field === 'nickname') {
      if (value !== userData.nickname) {
        setNicknameChecked(false);
        setNicknameMessage('');
      } else {
        setNicknameChecked(true);
        setNicknameMessage('');
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 실시간 필드 검증
    const fieldError = (() => {
      switch (field) {
        case 'nickname': {
          if (!value) return '닉네임을 입력해주세요.';
          if (value.length < 2 || value.length > 20) return '닉네임은 2-20자여야 합니다.';
          if (!/^[a-zA-Z가-힣0-9]+$/.test(value)) return '닉네임은 영문 대소문자, 한글, 숫자만 사용 가능합니다.';
          if (!nicknameChecked && value !== userData.nickname) return '닉네임 중복 확인을 해주세요.';
          return '';
        }
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
        case 'average_score': {
          if (isSocialLogin) {
            if (value === '' || value === null || value === undefined) return '평균 스코어를 입력해주세요.';
            const num = Number(value);
            if (Number.isNaN(num) || num < 55 || num > 144) return '평균 스코어는 55-144 사이의 숫자여야 합니다.';
          }
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
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (!nicknameChecked && formData.nickname !== userData.nickname) {
      newErrors.nickname = '닉네임 중복 확인을 해주세요.';
    }
    
    if (!formData.realname.trim()) {
      newErrors.realname = '실명을 입력해주세요.';
    } else if (formData.realname.trim().length < 2) {
      newErrors.realname = '실명은 2자 이상 입력해주세요.';
    } else {
      const hasKorean = /[\uAC00-\uD7A3]/.test(formData.realname);
      if (hasKorean) {
        if (!/^[\uAC00-\uD7A3]+$/.test(formData.realname)) {
          newErrors.realname = '한글 이름은 공백 없이 한글만 입력해주세요.';
        }
      } else {
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
    
    // 소셜 로그인 사용자는 평균 타수 필수
    if (isSocialLogin) {
      if (formData.average_score === '' || formData.average_score === null || formData.average_score === undefined) {
        newErrors.average_score = '평균 스코어를 입력해주세요.';
      } else if (isNaN(formData.average_score) || Number(formData.average_score) < 55 || Number(formData.average_score) > 144) {
        newErrors.average_score = '평균 스코어는 55-144 사이의 숫자여야 합니다.';
      }
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
      const submitData = {
        nickname: formData.nickname,
        realname: formData.realname,
        phone_number: formData.phone_number,
        birthdate: formData.birthdate,
        gender: formData.gender,
      };

      // 소셜 로그인 사용자는 평균 타수도 업데이트
      if (isSocialLogin && formData.average_score) {
        submitData.average_score = parseInt(formData.average_score);
      }

      await updateProfileMutation.mutateAsync(submitData);
      
      // 소셜 로그인 사용자이고 평균 타수가 있으면 핸디캡 업데이트
      if (isSocialLogin && userId && formData.average_score) {
        try {
          const averageScoreValue = parseInt(formData.average_score);
          if (!isNaN(averageScoreValue) && averageScoreValue >= 55 && averageScoreValue <= 144) {
            await usersApi.updateUserHandicap(userId, {
              average_score: averageScoreValue,
            });
            queryClient.invalidateQueries({ queryKey: ['user-handicap', userId] });
          }
        } catch (handicapErr) {
          console.error('핸디캡 수정 실패:', handicapErr);
          const handicapMessage = handicapErr?.response?.data?.detail || '핸디캡 수정에 실패했습니다.';
          setToast({ open: true, message: handicapMessage, tone: 'error' });
        }
      }
    } catch (error) {
      console.error('프로필 저장 실패:', error);
    }
  };

  if (userLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 프로필 폼 */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-4 sm:mb-6">회원정보 수정</h2>

        <div className="space-y-4 sm:space-y-6">
          {/* 이메일 (읽기 전용) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FaEnvelope className="inline w-4 h-4 mr-2" />
              아이디(이메일)
            </label>
            <div className="px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-700">
              {userData.email || '-'}
            </div>
            <p className="mt-1 text-xs text-neutral-500">이메일은 수정할 수 없습니다.</p>
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FaUser className="inline w-4 h-4 mr-2" />
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                className={`flex-1 px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.nickname ? 'border-red-300 bg-red-50' : 'border-neutral-300'
                }`}
                placeholder="닉네임을 입력하세요"
              />
              <button
                type="button"
                onClick={checkNicknameDuplicate}
                disabled={isCheckingNickname || !formData.nickname || formData.nickname === userData.nickname}
                className="px-3 py-2 sm:px-4 sm:py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium whitespace-nowrap text-xs sm:text-sm"
              >
                {isCheckingNickname ? '확인 중...' : '중복확인'}
              </button>
            </div>
            {errors.nickname && (
              <p className="mt-1 text-sm text-red-600">{errors.nickname}</p>
            )}
            {nicknameMessage && !errors.nickname && (
              <p className="mt-1 text-sm text-green-600">{nicknameMessage}</p>
            )}
          </div>

          {/* 비밀번호 변경 (일반 사용자만) */}
          {!isSocialLogin && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                <FaLock className="inline w-4 h-4 mr-2" />
                비밀번호
              </label>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="w-full sm:w-auto px-3 py-2 sm:px-4 sm:py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors font-medium text-xs sm:text-sm"
              >
                비밀번호 변경
              </button>
            </div>
          )}

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
              className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.realname ? 'border-red-300 bg-red-50' : 'border-neutral-300'
              }`}
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
              inputMode="numeric"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.phone_number ? 'border-red-300 bg-red-50' : 'border-neutral-300'
              }`}
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
              max={maxBirthdate}
              className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.birthdate ? 'border-red-300 bg-red-50' : 'border-neutral-300'
              }`}
            />
            {errors.birthdate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthdate}</p>
            )}
          </div>

          {/* 성별 (읽기 전용) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <FaVenusMars className="inline w-4 h-4 mr-2" />
              성별 <span className="text-red-500">*</span>
            </label>
            <div className="px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-700">
              {formData.gender === 'MALE' ? '남성' : formData.gender === 'FEMALE' ? '여성' : '-'}
            </div>
            <p className="mt-1 text-xs text-neutral-500">성별은 수정할 수 없습니다.</p>
          </div>


          {/* 평균 타수/핸디캡 (소셜 로그인 사용자만 수정 가능) */}
          {isSocialLogin ? (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <FaChartLine className="inline w-4 h-4 mr-2" />
                  평균 타수 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="55"
                  max="144"
                  step="1"
                  value={formData.average_score || ''}
                  onChange={(e) => handleInputChange('average_score', e.target.value)}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.average_score ? 'border-red-300 bg-red-50' : 'border-neutral-300'
                  }`}
                  placeholder="평균 타수를 입력하세요 (55-144)"
                />
                {formData.calculatedHandicap && (
                  <div className="mt-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                    <p className="font-semibold">계산된 핸디캡: {formData.calculatedHandicap}</p>
                    <p className="text-xs text-primary-600 mt-1">
                      평균 타수 {formData.average_score}타 → 핸디캡 {formData.calculatedHandicap}
                    </p>
                  </div>
                )}
                {errors.average_score && (
                  <p className="mt-1 text-sm text-red-600">{errors.average_score}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <FaGolfBall className="inline w-4 h-4 mr-2" />
                  핸디캡
                </label>
                <div className="px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-700">
                  {formData.calculatedHandicap 
                    ? Math.round(parseFloat(formData.calculatedHandicap))
                    : (formData.average_score && !isNaN(formData.average_score) && formData.average_score >= 55 && formData.average_score <= 144
                      ? Math.max(0, Math.min(72, Math.round(parseFloat(formData.average_score) - 72)))
                      : '-')}
                </div>
                <p className="mt-1 text-xs text-neutral-500">평균 타수로부터 자동 계산됩니다.</p>
              </div>
            </>
          ) : (
            <>
              {/* 평균 타수 (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <FaChartLine className="inline w-4 h-4 mr-2" />
                  평균 타수
                </label>
                <div className="px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-700">
                  {userData.average_score || '-'}
                </div>
                <p className="mt-1 text-xs text-neutral-500">일반 사용자는 평균 타수를 수정할 수 없습니다.</p>
              </div>

              {/* 핸디캡 (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  <FaGolfBall className="inline w-4 h-4 mr-2" />
                  핸디캡
                </label>
                {handicapLoading ? (
                  <div className="px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-500">
                    불러오는 중...
                  </div>
                ) : (
                  <div className="space-y-2">
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
                    <div className={`px-4 py-3 rounded-lg border ${
                      handicapInfo.calculated_handicap !== null && handicapInfo.calculated_handicap !== undefined
                        ? 'border-neutral-200 bg-neutral-50 text-neutral-700'
                        : 'border-neutral-300 bg-neutral-50 text-neutral-700'
                    }`}>
                      {handicapInfo.initial_handicap !== null && handicapInfo.initial_handicap !== undefined
                        ? `수동 입력: ${handicapInfo.initial_handicap}`
                        : userData.handicap
                        ? `수동 입력: ${userData.handicap}`
                        : '미등록'}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-neutral-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
            className="flex items-center space-x-2 px-4 py-2 sm:px-6 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-xs sm:text-sm"
          >
            <FaSave className="w-4 h-4" />
            <span>{updateProfileMutation.isPending ? '저장 중...' : '저장'}</span>
          </button>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {!isSocialLogin && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />
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

export default UserProfileEditTab;
