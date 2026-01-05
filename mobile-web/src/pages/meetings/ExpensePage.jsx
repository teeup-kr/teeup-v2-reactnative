import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaArrowLeft, FaPlus, FaDollarSign, FaReceipt, FaCheck, FaTimes, FaEdit, FaTrash, FaUsers, FaCalendarAlt, FaHashtag } from 'react-icons/fa';
import { roundsApi } from '../../lib/api';

const ExpensePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    description: '',
    amount: 0,
    category: '',
    participant_ids: [],
    split_type: 'EQUAL'
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 토스트 메시지 자동 숨김
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // 모임 참가자 목록 조회
  const fetchParticipants = async () => {
    try {
      const response = await roundsApi.getRoundParticipants(id);
      setParticipants(response.data);
    } catch (err) {
      console.error('참가자 목록 조회 실패:', err);
      setError('참가자 목록을 불러올 수 없습니다.');
    }
  };

  // 지출 목록 조회
  const fetchExpenses = async () => {
    try {
      const response = await roundsApi.getRoundExpenses(id);
      setExpenses(response.data);
    } catch (err) {
      console.error('지출 목록 조회 실패:', err);
      setError('지출 목록을 불러올 수 없습니다.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchParticipants(), fetchExpenses()]);
      } catch (err) {
        console.error('데이터 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 지출 추가/수정
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingExpense) {
        await roundsApi.updateRoundExpense(id, editingExpense.id, expenseFormData);
        setSuccessMessage('지출이 수정되었습니다.');
      } else {
        await roundsApi.createRoundExpense(id, expenseFormData);
        setSuccessMessage('지출이 추가되었습니다.');
      }
      
      setExpenseDialogOpen(false);
      setEditingExpense(null);
      setExpenseFormData({
        title: '',
        description: '',
        amount: 0,
        category: '',
        participant_ids: [],
        split_type: 'EQUAL'
      });
      setShowSuccessToast(true);
      fetchExpenses();
      
    } catch (err) {
      console.error('지출 처리 실패:', err);
      setError(err.response?.data?.detail || '지출 처리에 실패했습니다.');
    }
  };

  // 지출 수정
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount,
      category: expense.category,
      participant_ids: expense.participants.map(p => p.user_id),
      split_type: 'EQUAL'
    });
    setExpenseDialogOpen(true);
  };

  // 지출 삭제
  const handleDeleteExpense = async () => {
    try {
      await roundsApi.deleteRoundExpense(id, expenseToDelete.id);
      setShowDeleteModal(false);
      setExpenseToDelete(null);
      setSuccessMessage('지출이 삭제되었습니다.');
      setShowSuccessToast(true);
      fetchExpenses();
    } catch (err) {
      console.error('지출 삭제 실패:', err);
      setError(err.response?.data?.detail || '지출 삭제에 실패했습니다.');
    }
  };

  // 폼 데이터 업데이트
  const updateFormData = (field, value) => {
    setExpenseFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 참가자 선택 토글
  const toggleParticipant = (participantId) => {
    setExpenseFormData(prev => ({
      ...prev,
      participant_ids: prev.participant_ids.includes(participantId)
        ? prev.participant_ids.filter(id => id !== participantId)
        : [...prev.participant_ids, participantId]
    }));
  };

  // 전체 참가자 선택/해제
  const toggleAllParticipants = () => {
    const allSelected = participants.length === expenseFormData.participant_ids.length;
    setExpenseFormData(prev => ({
      ...prev,
      participant_ids: allSelected ? [] : participants.map(p => p.user_id)
    }));
  };

  // 지출 상태 배지
  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { text: '대기', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { text: '승인', className: 'bg-green-100 text-green-800' },
      REJECTED: { text: '거부', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return `${amount.toLocaleString()}원`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (err) {
      return dateString;
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-1.5 sm:mb-2">오류가 발생했습니다</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">{error}</p>
            <button
              onClick={() => navigate('/meetings')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm rounded-lg transition-colors"
            >
              모임 목록으로
            </button>
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
              onClick={() => navigate(`/meetings/rounding/${id}`)}
              className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors"
            >
              <FaArrowLeft className="mr-1.5 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">모임 상세</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1.5 sm:mb-2">모임 정산</h1>
            <p className="text-sm sm:text-base text-neutral-600">모임 지출을 관리하고 정산하세요</p>
          </div>
        </div>

        {/* 지출 요약 */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">지출 요약</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-neutral-500">총 지출</p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-900">
                  {formatAmount(expenses.reduce((sum, expense) => sum + expense.amount, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-neutral-500">지출 건수</p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-900">{expenses.length}건</p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-medium text-neutral-500">참가자 수</p>
                <p className="text-xl sm:text-2xl font-bold text-neutral-900">{participants.length}명</p>
              </div>
            </div>
          </div>
        </div>

        {/* 지출 목록 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">지출 목록</h2>
            <button
              onClick={() => setExpenseDialogOpen(true)}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FaPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>지출 추가</span>
            </button>
          </div>
          
          {expenses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 sm:p-8 text-center">
              <FaReceipt className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-1.5 sm:mb-2">지출이 없습니다</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">첫 번째 지출을 추가해보세요</p>
              <button
                onClick={() => setExpenseDialogOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm rounded-lg transition-colors"
              >
                지출 추가
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {expenses.map((expense) => (
                <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-1 line-clamp-1">{expense.title}</h3>
                      {expense.description && (
                        <p className="text-sm sm:text-base text-neutral-600 mb-1.5 sm:mb-2 line-clamp-2">{expense.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <span className="text-xl sm:text-2xl font-bold text-primary-600">
                          {formatAmount(expense.amount)}
                        </span>
                        <span className="text-xs sm:text-sm text-neutral-500">{expense.category}</span>
                        {getStatusBadge(expense.status)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="p-1.5 sm:p-2 text-neutral-400 hover:text-primary-600 transition-colors"
                        title="수정"
                      >
                        <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setExpenseToDelete(expense);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 sm:p-2 text-neutral-400 hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="border-t border-neutral-200 pt-3 sm:pt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-neutral-500">
                      <span>{formatDate(expense.created_at)}</span>
                      <span>{expense.participants.length}명 참여</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 지출 추가/수정 모달 */}
      {expenseDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingExpense ? '지출 수정' : '지출 추가'}
              </h3>
              <button
                onClick={() => {
                  setExpenseDialogOpen(false);
                  setEditingExpense(null);
                  setExpenseFormData({
                    title: '',
                    description: '',
                    amount: 0,
                    category: '',
                    participant_ids: [],
                    split_type: 'EQUAL'
                  });
                }}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-4 sm:space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={expenseFormData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="지출 제목을 입력하세요"
                  required
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  설명
                </label>
                <textarea
                  value={expenseFormData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={3}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="지출에 대한 설명을 입력하세요"
                />
              </div>

              {/* 금액 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  금액 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={expenseFormData.amount}
                  onChange={(e) => updateFormData('amount', parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                  required
                />
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  카테고리
                </label>
                <select
                  value={expenseFormData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">카테고리를 선택하세요</option>
                  <option value="식비">식비</option>
                  <option value="교통비">교통비</option>
                  <option value="숙박비">숙박비</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              {/* 참가자 선택 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  참가자 선택
                </label>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={participants.length === expenseFormData.participant_ids.length}
                      onChange={toggleAllParticipants}
                      className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span className="text-xs sm:text-sm text-gray-700">전체 선택</span>
                  </label>
                  {participants.map((participant) => (
                    <label key={participant.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={expenseFormData.participant_ids.includes(participant.user_id)}
                        onChange={() => toggleParticipant(participant.user_id)}
                        className="mr-2 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span className="text-xs sm:text-sm text-gray-700">{participant.user_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setExpenseDialogOpen(false);
                    setEditingExpense(null);
                    setExpenseFormData({
                      title: '',
                      description: '',
                      amount: 0,
                      category: '',
                      participant_ids: [],
                      split_type: 'EQUAL'
                    });
                  }}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingExpense ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                지출 삭제
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                정말로 이 지출을 삭제하시겠습니까?<br />
                삭제된 지출은 복구할 수 없습니다.
              </p>
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteExpense}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 성공 토스트 메시지 */}
      {showSuccessToast && (
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2 bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm rounded-lg shadow-lg animate-slide-up">
          <FaCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ExpensePage;
