import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { clubsApi } from '../../lib/clubsApi.js';
import { useAuth } from '../../hooks/useAuth';
import { FaFileAlt, FaCheckCircle, FaInfoCircle, FaQuestionCircle, FaCheck, FaArrowLeft, FaUsers, FaGolfBall, FaMoneyBillWave, FaExclamationTriangle } from 'react-icons/fa';

const ClubRegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [formData, setFormDataState] = useState({
    name: '',
    type: 'REGULAR',
    description: '',
    member_count: 1,
    location: '',
    contact_info: '',
    additional_info: '',
    attachment_file: ''
  });

  // 정기 회비 관련 상태
  const [hasRegularFee, setHasRegularFee] = useState(false);
  const [regularFeeAmount, setRegularFeeAmount] = useState('');
  const [regularFeeCycle, setRegularFeeCycle] = useState('MONTHLY');
  const [regularFeeDescription, setRegularFeeDescription] = useState('');

  // 폼 데이터 설정 함수 (로컬 스토리지 자동 저장)
  const setFormData = (data) => {
    const newData = typeof data === 'function' ? data(formData) : data;
    setFormDataState(newData);
    // 로컬 스토리지에 저장 (회비 정보 포함)
    const dataToSave = {
      ...newData,
      hasRegularFee,
      regularFeeAmount,
      regularFeeCycle,
      regularFeeDescription
    };
    console.log('클럽 등록 폼 데이터 저장:', dataToSave);
    localStorage.setItem('clubRegisterFormData', JSON.stringify(dataToSave));
  };
  const [errors, setErrors] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadInfo, setUploadInfo] = useState(null);
  const [banner, setBanner] = useState({ type: '', message: '' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const fileInputRef = useRef(null);

  // 프로필 완성 여부 체크 및 리다이렉트
  useEffect(() => {
    if (user) {
      const needsRealname = !user.realname || user.realname.trim() === '';
      const needsPhone = !user.phone_number || user.phone_number.trim() === '';
      const needsBirthdate = !user.birthdate;
      const needsGender = !user.gender;
      
      if ((needsRealname || needsPhone || needsBirthdate || needsGender) && !location.state?.fromProfileComplete) {
        navigate('/profile/complete', { state: { fromClubRegister: true, returnTo: '/clubs/register' } });
        return;
      }
      
      console.log('User profile complete, proceeding to club registration');
    }
  }, [user, location.state, navigate]);

  // 로컬 스토리지에서 클럽 등록 폼 데이터 복원
  useEffect(() => {
    // 디버깅을 위해 로컬 스토리지 초기화 (임시)
    // localStorage.removeItem('clubRegisterFormData');
    
    const savedFormData = localStorage.getItem('clubRegisterFormData');
    console.log('클럽 등록 페이지 로컬 스토리지 데이터:', savedFormData);
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        console.log('클럽 등록 폼 데이터 복원:', parsedData);
        const validType = (parsedData.type === 'REGULAR' || parsedData.type === 'IRREGULAR') ? parsedData.type : 'REGULAR';
        setFormDataState({ ...parsedData, type: validType });
      } catch (error) {
        console.error('클럽 등록 폼 데이터 파싱 오류:', error);
        // 파싱 오류 시 초기 데이터로 설정
        const initialData = {
          name: '',
          type: 'REGULAR',
          description: '',
          member_count: 1,
          location: '',
          contact_info: '',
          additional_info: '',
          attachment_file: ''
        };
        setFormDataState(initialData);
        setHasRegularFee(false);
        setRegularFeeAmount('');
        setRegularFeeCycle('MONTHLY');
        setRegularFeeDescription('');
      }
    } else {
      // 저장된 데이터가 없으면 초기 데이터로 설정 (로컬 스토리지에 저장하지 않음)
      console.log('클럽 등록 저장된 데이터 없음, 초기 데이터로 설정');
      const initialData = {
        name: '',
        type: 'REGULAR',
        description: '',
        member_count: 1,
        location: '',
        contact_info: '',
        additional_info: '',
        attachment_file: ''
      };
      setFormDataState(initialData);
    }
  }, []);

  // 클럽 등록 신청 뮤테이션
  const registerClubMutation = useMutation({
    mutationFn: (data) => clubsApi.registerClubApplication(data),
    onSuccess: () => {
      // 클럽 등록 성공 시 로컬 스토리지 정리
      localStorage.removeItem('clubRegisterFormData');
      setShowSuccessModal(true);
    },
    onError: (error) => {
      const detail = error?.response?.data?.detail;
      let message = '클럽 등록 신청에 실패했습니다.';
      if (Array.isArray(detail)) {
        // FastAPI 검증 에러 배열 형태 처리
        message = detail
          .map((d) => d?.msg || d?.message || `${d?.type || 'validation_error'}`)
          .join(', ');
      } else if (typeof detail === 'object' && detail) {
        message = detail.msg || detail.message || JSON.stringify(detail);
      } else if (typeof detail === 'string') {
        message = detail;
      }
      setBanner({ type: 'error', message });
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`클럽 등록 입력 변경: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: name === 'member_count' ? parseInt(value) || 1 : value
    }));
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 클럽 정보 검증
    if (!formData.name.trim()) {
      newErrors.name = '클럽명을 입력해주세요.';
    } else if (formData.name.length < 2) {
      newErrors.name = '클럽명은 2자 이상 입력해주세요.';
    }

    // 타입 검증
    if (!formData.type || (formData.type !== 'REGULAR' && formData.type !== 'IRREGULAR')) {
      newErrors.type = '클럽 타입을 선택해주세요.';
    }

    if (!formData.description.trim()) {
      newErrors.description = '클럽 설명을 입력해주세요.';
    } else if (formData.description.length < 10) {
      newErrors.description = '클럽 설명은 10자 이상 입력해주세요.';
    }

    if (!formData.location.trim()) {
      newErrors.location = '위치를 입력해주세요.';
    }

    if (!formData.contact_info.trim()) {
      newErrors.contact_info = '클럽 대표연락처를 입력해주세요.';
    } else if (!/^\d{11}$/.test(formData.contact_info)) {
      newErrors.contact_info = '클럽 대표연락처는 11자리 숫자여야 합니다.';
    }

    if (formData.member_count < 1) {
      newErrors.member_count = '멤버 수는 1명 이상이어야 합니다.';
    }

    if (!formData.attachment_file.trim()) {
      newErrors.attachment_file = '첨부 파일을 업로드해주세요.';
    }

    // 정기 회비 검증
    if (hasRegularFee && !regularFeeAmount) {
      newErrors.regularFeeAmount = '회비 금액을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 유효성 검사 함수 (에러 설정 없이)
  const isFormValid = () => {
    return (
      formData.name.trim().length >= 2 &&
      formData.description.trim().length >= 10 &&
      formData.location.trim().length > 0 &&
      /^\d{11}$/.test(formData.contact_info) &&
      formData.member_count >= 1 &&
      formData.attachment_file.trim().length > 0
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    submitClubRegistration();
  };

  const submitClubRegistration = () => {
    registerClubMutation.mutate(formData);
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    setShowCancelConfirmModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirmModal(false);
    navigate('/clubs');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setBanner({ type: 'error', message: '파일 크기는 10MB를 초과할 수 없습니다.' });
        return;
      }
      
      // 파일 형식 체크
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setBanner({ type: 'error', message: 'PNG, JPG, JPEG, PDF 파일만 업로드 가능합니다.' });
        return;
      }
      
      setSelectedFile(file);
      
      // 자동 업로드
      setUploading(true);
      try {
        const result = await clubsApi.uploadFile(file);
        // 파일 ID를 저장 (파일명이 아닌 파일 ID로 저장하여 구글 드라이브 링크 생성 가능)
        setFormData(prev => ({
          ...prev,
          attachment_file: result.file_id || result.filename
        }));
        setUploadInfo({ name: file.name, size: file.size, fileId: result.file_id, link: result.web_view_link });
        setUploadModalOpen(true);
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        setBanner({ type: 'error', message: error.response?.data?.detail || '파일 업로드에 실패했습니다.' });
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } finally {
        setUploading(false);
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    try {
      const result = await clubsApi.uploadFile(selectedFile);
      // 파일 ID를 저장 (파일명이 아닌 파일 ID로 저장하여 구글 드라이브 링크 생성 가능)
      setFormData(prev => ({
        ...prev,
        attachment_file: result.file_id || result.filename
      }));
      setUploadInfo({ name: selectedFile.name, size: selectedFile.size, fileId: result.file_id, link: result.web_view_link });
      setUploadModalOpen(true);
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      setBanner({ type: 'error', message: error.response?.data?.detail || '파일 업로드에 실패했습니다.' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFormData(prev => ({
      ...prev,
      attachment_file: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/clubs');
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="max-w-2xl mx-auto px-3 sm:px-4">
          {banner.message && (
            <div className={`mb-3 sm:mb-4 rounded-md p-3 sm:p-4 text-sm sm:text-base ${banner.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              {banner.message}
            </div>
          )}

          {/* 뒤로가기 버튼 */}
          <div className="flex items-center mb-4 sm:mb-6">
            <button
              onClick={() => {
                navigate('/clubs');
              }}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">클럽 목록으로</span>
            </button>
          </div>

          {/* 페이지 제목 */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">클럽 등록 신청</h1>
            <p className="text-gray-600 text-base sm:text-lg">
              새로운 골프 클럽을 등록하고 싶으시다면 아래 양식을 작성해주세요.
            </p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              관리자 승인 후 클럽이 생성됩니다.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* 클럽 기본 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <FaUsers className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                기본 정보
              </h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* 클럽명 */}
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    클럽명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="예: 서울 골프 동호회"
                  />
                  {errors.name && <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* 클럽 타입 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    클럽 타입 <span className="text-red-500">*</span>
                  </label>
                  <div className={`rounded-lg border ${errors.type ? 'border-red-300' : 'border-gray-300'} p-2.5 sm:p-3`}>
                    <label className="inline-flex items-center mr-4 sm:mr-6 text-xs sm:text-sm">
                      <input
                        type="radio"
                        name="type"
                        value="REGULAR"
                        checked={formData.type === 'REGULAR'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="mr-1.5 sm:mr-2"
                      />
                      정기 클럽
                    </label>
                    <label className="inline-flex items-center text-xs sm:text-sm">
                      <input
                        type="radio"
                        name="type"
                        value="IRREGULAR"
                        checked={formData.type === 'IRREGULAR'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                        className="mr-1.5 sm:mr-2"
                      />
                      비정기 클럽
                    </label>
                  </div>
                  {errors.type && <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600">{errors.type}</p>}
                </div>

                {/* 클럽 설명 */}
                <div>
                  <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    클럽 설명 <span className="text-red-500">*</span> (10자 이상 입력해주세요.)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors ${
                      errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="클럽의 목적, 활동 내용, 특징 등을 자세히 설명해주세요. (10자 이상)"
                  />
                  {errors.description && <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600">{errors.description}</p>}
                </div>

                {/* 멤버 수 */}
                <div>
                  <label htmlFor="member_count" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    예상 멤버 수 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="member_count"
                    name="member_count"
                    value={formData.member_count}
                    onChange={handleInputChange}
                    min="1"
                    className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors ${
                      errors.member_count ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {errors.member_count && <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600">{errors.member_count}</p>}
                </div>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">대표연락처 정보</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {/* 위치 */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    주요 활동 지역 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors ${
                      errors.location ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="예: 서울시 강남구, 경기도 성남시"
                  />
                  {errors.location && <p className="mt-2 text-sm text-red-600">{errors.location}</p>}
                </div>

                {/* 클럽 연락처 */}
                <div>
                  <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700 mb-2">
                    클럽 대표연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contact_info"
                    name="contact_info"
                    value={formData.contact_info}
                    onChange={(e) => {
                      // 숫자만 허용하고 11자리로 제한
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                      setFormData(prev => ({ ...prev, contact_info: value }));
                    }}
                    onKeyPress={(e) => {
                      // 숫자만 허용
                      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
                        e.preventDefault();
                      }
                    }}
                    className={`block w-full px-3 py-2 sm:px-4 sm:py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors ${
                      errors.contact_info ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="클럽 대표연락처, 숫자만 입력 (ex. 01012345678)"
                    maxLength={11}
                  />
                  <p className="mt-1 text-xs text-gray-500">클럽 대표연락처를 11자리 숫자로 입력해주세요.</p>
                  {errors.contact_info && <p className="mt-2 text-sm text-red-600">{errors.contact_info}</p>}
                </div>
              </div>
            </div>

            {/* 정기 회비 설정 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <FaMoneyBillWave className="mr-3 text-green-600" />
                정기 회비 설정
              </h2>
              
              <div className="space-y-6">
                {/* 정기 회비 여부 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    정기 회비 여부
                  </label>
                  <select
                    value={hasRegularFee ? 'yes' : 'no'}
                    onChange={(e) => {
                      const newValue = e.target.value === 'yes';
                      setHasRegularFee(newValue);
                      // 로컬 스토리지 저장
                      const savedData = localStorage.getItem('clubRegisterFormData');
                      if (savedData) {
                        const parsed = JSON.parse(savedData);
                        parsed.hasRegularFee = newValue;
                        localStorage.setItem('clubRegisterFormData', JSON.stringify(parsed));
                      }
                    }}
                    className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors hover:border-gray-400"
                  >
                    <option value="no">없음</option>
                    <option value="yes">있음</option>
                  </select>
                </div>
                
                {hasRegularFee && (
                  <>
                    {/* 회비 금액 */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        회비 금액
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={regularFeeAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            setRegularFeeAmount(value);
                            // 로컬 스토리지 저장
                            const savedData = localStorage.getItem('clubRegisterFormData');
                            if (savedData) {
                              const parsed = JSON.parse(savedData);
                              parsed.regularFeeAmount = value;
                              localStorage.setItem('clubRegisterFormData', JSON.stringify(parsed));
                            }
                          }}
                          className={`block w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base transition-colors ${
                            errors.regularFeeAmount ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                      </div>
                      {errors.regularFeeAmount && <p className="mt-2 text-sm text-red-600">{errors.regularFeeAmount}</p>}
                    </div>
                    
                    {/* 회비 주기 */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        회비 주기
                      </label>
                      <select
                        value={regularFeeCycle}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegularFeeCycle(value);
                          // 로컬 스토리지 저장
                          const savedData = localStorage.getItem('clubRegisterFormData');
                          if (savedData) {
                            const parsed = JSON.parse(savedData);
                            parsed.regularFeeCycle = value;
                            localStorage.setItem('clubRegisterFormData', JSON.stringify(parsed));
                          }
                        }}
                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors hover:border-gray-400"
                      >
                        <option value="MONTHLY">월간</option>
                        <option value="QUARTERLY">분기</option>
                        <option value="YEARLY">연간</option>
                      </select>
                    </div>
                    
                    {/* 회비 설명 */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        회비 설명 (선택)
                      </label>
                      <textarea
                        value={regularFeeDescription}
                        onChange={(e) => {
                          const value = e.target.value;
                          setRegularFeeDescription(value);
                          // 로컬 스토리지 저장
                          const savedData = localStorage.getItem('clubRegisterFormData');
                          if (savedData) {
                            const parsed = JSON.parse(savedData);
                            parsed.regularFeeDescription = value;
                            localStorage.setItem('clubRegisterFormData', JSON.stringify(parsed));
                          }
                        }}
                        rows={2}
                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors hover:border-gray-400"
                        placeholder="회비 사용 용도, 납부 방법 등을 설명해주세요."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 골프 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <FaGolfBall className="mr-3 text-green-600" />
                추가 정보
              </h2>
              
              <div className="space-y-6">
                {/* 추가 정보 텍스트 */}
                <div>
                  <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700 mb-2">
                    기타 사항 (선택)
                  </label>
                  <textarea
                    id="additional_info"
                    name="additional_info"
                    value={formData.additional_info}
                    onChange={handleInputChange}
                    rows={4}
                    className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base transition-colors hover:border-gray-400"
                    placeholder="클럽 운영 방침, 특별한 규칙, 기타 참고사항 등을 입력해주세요."
                  />
                </div>

                {/* 파일 업로드 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    첨부 파일 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    <p className="text-sm text-red-500">
                      클럽을 확인할 수 있는 자료(회원 명부 또는 단체 채팅방 명단 캡처 이미지 등)를 첨부해주시면 됩니다.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    
                    {selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <FaFileAlt className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleFileUpload}
                            disabled={uploading || !!formData.attachment_file}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {uploading ? '등록 중...' : formData.attachment_file ? '등록 완료' : '등록하기'}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {formData.attachment_file && (
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <FaCheckCircle className="h-4 w-4" />
                        <span>파일이 등록되었습니다: {formData.attachment_file}</span>
                      </div>
                    )}
                    
                    {errors.attachment_file && !formData.attachment_file && <p className="text-sm text-red-600">{errors.attachment_file}</p>}
                    <p className="text-xs text-gray-500">
                      PNG, JPG, JPEG, PDF 파일만 업로드 가능합니다. (최대 10MB)
                      <br /> 클럽 확인용 자료(회원 명부 또는 단체 채팅방 명단 캡처 이미지 등)를 첨부해주시면 됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaInfoCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green-900 mb-3">안내사항</h3>
                  <div className="text-sm text-green-800">
                    <ul className="list-disc list-inside space-y-2">
                      <li>클럽 등록 신청 후 관리자 검토를 거쳐 승인됩니다.</li>
                      <li>승인까지 1-3일 정도 소요될 수 있습니다.</li>
                      <li>승인된 클럽은 자동으로 생성되며, 신청자가 클럽 리더가 됩니다.</li>
                      <li>부적절한 내용이 포함된 경우 승인이 거부될 수 있습니다.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-center space-x-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={registerClubMutation.isPending || !isFormValid()}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {registerClubMutation.isPending ? '신청 중...' : '클럽 등록 신청'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              {/* 확인 아이콘 */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <FaQuestionCircle className="h-8 w-8 text-green-600" />
              </div>
              
              {/* 제목 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                클럽 등록 신청
              </h3>
              
              {/* 메시지 */}
              <p className="text-gray-600 mb-6">
                클럽 등록 신청을 제출하시겠습니까?<br />
                제출 후에는 수정할 수 없습니다.
              </p>
              
              {/* 버튼들 */}
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmModalClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  disabled={registerClubMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                >
                  {registerClubMutation.isPending ? '제출 중...' : '제출'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              {/* 성공 아이콘 */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <FaCheck className="h-8 w-8 text-green-600" />
              </div>
              
              {/* 제목 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                클럽 등록 신청 완료
              </h3>
              
              {/* 메시지 */}
              <p className="text-gray-600 mb-6">
                클럽 등록 신청이 완료되었습니다.<br />
                관리자 승인 후 클럽이 생성됩니다.
              </p>
              
              {/* 버튼 */}
              <button
                onClick={handleSuccessModalClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                <FaCheck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">파일 업로드 완료</h3>
              <p className="text-gray-600 mb-1">{uploadInfo?.name} 업로드가 완료되었습니다.</p>
              {uploadInfo?.link && (
                <a href={uploadInfo.link} target="_blank" rel="noreferrer" className="inline-block mt-2 text-sm text-blue-600 hover:underline">
                  드라이브에서 보기
                </a>
              )}
              <div className="mt-6">
                <button onClick={() => setUploadModalOpen(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 취소 확인 모달 */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                취소 확인
              </h3>
              <p className="text-gray-600 mb-6">
                작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCancelConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClubRegisterPage;
