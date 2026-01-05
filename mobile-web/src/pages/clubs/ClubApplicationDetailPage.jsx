import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '../../lib/clubsApi.js';
import { FaFileAlt, FaExclamationTriangle, FaCheck, FaArrowLeft, FaTimes, FaDownload, FaCalendarAlt, FaUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ClubApplicationDetailPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', tone: 'success' });

  // 클럽 신청 상세 정보 조회
  const {
    data: application,
    isLoading,
    error
  } = useQuery({
    queryKey: ['club-application', applicationId],
    queryFn: async () => {
      try {
        const result = await clubsApi.getClubApplicationDetail(applicationId);
        return result;
      } catch (error) {
        console.error('API 호출 실패:', error);
        throw error;
      }
    },
    enabled: !!applicationId,
    retry: 1,
  });

  // 편집 모드 토글
  const startEdit = () => {
    if (!application) return;
    setForm({
      name: application.club_name || application.name || '',
      description: application.description || '',
      type: application.club_type || application.type || 'REGULAR',
      location: application.location || '',
      additional_info: application.additional_info || '',
      member_count: application.member_count || 1,
      attachment_file: application.attachment_file || '',
    });
    setEditMode(true);
  };

  const saveEdit = async () => {
    await clubsApi.updateClubApplication(applicationId, {
      name: form.name,
      description: form.description,
      type: form.type,
      location: form.location,
      additional_info: form.additional_info,
      member_count: form.member_count,
      attachment_file: form.attachment_file,
    });
    setEditMode(false);
    queryClient.invalidateQueries({ queryKey: ['club-application', applicationId] });
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const res = await clubsApi.uploadFile(file);
      setForm(prev => ({ ...prev, attachment_file: res.filename }));
    } finally {
      setUploading(false);
    }
  };

  // 신청 취소 뮤테이션
  const cancelApplicationMutation = useMutation({
    mutationFn: (applicationId) => clubsApi.cancelClubApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['club-application', applicationId] });
      setShowSuccessModal(true);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || '신청 취소에 실패했습니다.';
      setToast({ open: true, message: errorMessage, tone: 'error' });
    }
  });

  const handleCancelApplication = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    cancelApplicationMutation.mutate(applicationId);
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigate('/clubs');
  };

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast.open) return undefined;
    const timeout = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.open]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      APPROVED: { text: '승인됨', className: 'bg-green-100 text-green-800' },
      PENDING: { text: '승인 대기', className: 'bg-yellow-100 text-yellow-800' },
      REJECTED: { text: '거절됨', className: 'bg-red-100 text-red-800' },
      CANCELED: { text: '취소됨', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getClubTypeBadge = (type) => {
    const typeConfig = {
      REGULAR: { text: '정기', className: 'bg-blue-100 text-blue-800' },
      IRREGULAR: { text: '비정기', className: 'bg-purple-100 text-purple-800' }
    };

    const config = typeConfig[type] || typeConfig.REGULAR;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">신청 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">신청 정보를 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-6">잠시 후 다시 시도해주세요.</p>
          <button
            onClick={() => navigate('/clubs')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            클럽 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/clubs')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  클럽 신청 상세
                </h1>
                <p className="text-sm text-gray-600">
                  신청 정보 및 처리 상태를 확인하세요
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(application.status)}
              {getClubTypeBadge(application.club_type)}
              {application.status === 'PENDING' && (
                !editMode ? (
                  <button onClick={startEdit} className="ml-3 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg">수정하기</button>
                ) : (
                  <>
                    <button onClick={saveEdit} className="ml-3 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg">저장</button>
                    <button onClick={() => setEditMode(false)} className="ml-2 px-3 py-1.5 text-sm bg-gray-200 rounded-lg">취소</button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 신청 정보 카드 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              신청 정보
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  클럽명
                </label>
                <p className="text-sm text-gray-900">{application.club_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  신청일
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(application.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  신청자
                </label>
                <p className="text-sm text-gray-900">{application.applicant_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <p className="text-sm text-gray-900">{application.contact_info}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 클럽 상세 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              클럽 상세 정보
            </h2>
          </div>
          <div className="px-6 py-4">
            {!editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">클럽 설명</label>
                  <p className="text-sm text-gray-900">{application.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">클럽 타입</label>
                    <p className="text-sm text-gray-900">
                      {application.club_type === 'REGULAR' ? '정기' : application.club_type === 'IRREGULAR' ? '비정기' : application.club_type}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">예상 멤버 수</label>
                    <p className="text-sm text-gray-900">{application.member_count}명</p>
                  </div>
                </div>
                {application.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">활동 지역</label>
                    <p className="text-sm text-gray-900">{application.location}</p>
                  </div>
                )}
                {application.additional_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">추가 정보</label>
                    <p className="text-sm text-gray-900">{application.additional_info}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">클럽명</label>
                  <input className="w-full border rounded px-3 py-2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">클럽 설명</label>
                  <textarea className="w-full border rounded px-3 py-2" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">클럽 타입</label>
                    <select className="w-full border rounded px-3 py-2" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>
                      <option value="REGULAR">정기</option>
                      <option value="IRREGULAR">비정기</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">예상 멤버 수</label>
                    <input type="number" className="w-full border rounded px-3 py-2" value={form.member_count} onChange={e=>setForm({...form,member_count: Number(e.target.value)||1})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">활동 지역</label>
                  <input className="w-full border rounded px-3 py-2" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">추가 정보</label>
                  <textarea className="w-full border rounded px-3 py-2" rows={2} value={form.additional_info} onChange={e=>setForm({...form,additional_info:e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">첨부 파일 변경</label>
                  <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(e)=> e.target.files?.[0] && handleUpload(e.target.files[0])} />
                  {uploading && <p className="text-xs text-gray-500 mt-1">업로드 중...</p>}
                  {form.attachment_file && <p className="text-xs text-gray-600 mt-1">현재 파일: {form.attachment_file}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 첨부 파일 */}
        {application.attachment_file && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                첨부 파일
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-start p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FaFileAlt className="h-8 w-8 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {application.attachment_file}
                    </p>
                    <p className="text-xs text-gray-500">
                      첨부 파일
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 처리 상태 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              처리 상태
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">현재 상태</span>
                {getStatusBadge(application.status)}
              </div>
              {application.processed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">처리일</span>
                  <span className="text-sm text-gray-900">
                    {new Date(application.processed_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )}
              {application.rejection_reason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    거부 사유
                  </label>
                  <p className="text-sm text-gray-900">{application.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        {application.status === 'PENDING' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    신청을 취소하시겠습니까?
                  </h3>
                  <p className="text-sm text-gray-600">
                    신청 취소 후에는 다시 신청할 수 있습니다.
                  </p>
                </div>
                <button
                  onClick={handleCancelApplication}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  신청 취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 취소 확인 모달 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  신청 취소 확인
                </h3>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                정말로 이 클럽 신청을 취소하시겠습니까?<br />
                취소 후에는 다시 신청할 수 있습니다.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={handleCancelModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelApplicationMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelApplicationMutation.isPending ? '처리 중...' : '신청 취소'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <FaCheck className="h-6 w-6 text-green-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  신청 취소 완료
                </h3>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                클럽 신청이 성공적으로 취소되었습니다.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
              <button
                onClick={handleSuccessModalClose}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 transition-colors"
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

export default ClubApplicationDetailPage;
