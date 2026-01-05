import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaPlus, FaTrophy, FaFlag, FaCircle, FaChartLine, FaGolfBall } from 'react-icons/fa';
import { roundsApi } from '../../lib/api';

const ScoreInputPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [scoreStats, setScoreStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [scoreFormData, setScoreFormData] = useState({
    hole_number: 1,
    score: 0,
    par: 4
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scoreToDelete, setScoreToDelete] = useState(null);
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

  // 데이터 조회
  const fetchScores = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [scoresResponse, statsResponse] = await Promise.all([
        roundsApi.getParticipantScores(id, 'current'), // 현재 사용자 ID
        roundsApi.getParticipantScoreStats(id, 'current')
      ]);
      
      setScores(scoresResponse.data);
      setScoreStats(statsResponse.data || statsResponse);
    } catch (err) {
      setError(err.message || '점수 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [id]);

  // 점수 추가/수정
  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingScore) {
        await roundsApi.updateParticipantScore(id, editingScore.id, scoreFormData);
        setSuccessMessage('점수가 수정되었습니다.');
      } else {
        await roundsApi.createParticipantScore(id, scoreFormData);
        setSuccessMessage('점수가 추가되었습니다.');
      }
      
      setScoreDialogOpen(false);
      setEditingScore(null);
      setScoreFormData({
        hole_number: 1,
        score: 0,
        par: 4
      });
      setShowSuccessToast(true);
      fetchScores();
      
    } catch (err) {
      console.error('점수 처리 실패:', err);
      setError(err.response?.data?.detail || '점수 처리에 실패했습니다.');
    }
  };

  // 점수 수정
  const handleEditScore = (score) => {
    setEditingScore(score);
    setScoreFormData({
      hole_number: score.hole_number,
      score: score.score,
      par: score.par
    });
    setScoreDialogOpen(true);
  };

  // 점수 삭제
  const handleDeleteScore = async () => {
    try {
      await roundsApi.deleteParticipantScore(id, scoreToDelete.id);
      setShowDeleteModal(false);
      setScoreToDelete(null);
      setSuccessMessage('점수가 삭제되었습니다.');
      setShowSuccessToast(true);
      fetchScores();
    } catch (err) {
      console.error('점수 삭제 실패:', err);
      setError(err.response?.data?.detail || '점수 삭제에 실패했습니다.');
    }
  };

  // 폼 데이터 업데이트
  const updateFormData = (field, value) => {
    setScoreFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 점수 차이 계산
  const getScoreDiff = (score, par) => {
    if (score === null || score === undefined || par === null || par === undefined) return '-';
    const diff = score - par;
    if (diff === 0) return 'PAR';
    if (diff > 0) return `+${diff}`;
    return diff.toString();
  };

  // 점수 차이 색상
  const getScoreDiffColor = (score, par) => {
    if (score === null || score === undefined || par === null || par === undefined) return 'text-gray-500';
    const diff = score - par;
    if (diff === 0) return 'text-blue-600';
    if (diff > 0) return 'text-red-600';
    return 'text-green-600';
  };

  // 점수 타입 배지
  const getScoreTypeBadge = (score, par) => {
    if (score === null || score === undefined || par === null || par === undefined) return null;
    const diff = score - par;
    
    if (diff === -3) return { text: '알바트로스', className: 'bg-purple-100 text-purple-800' };
    if (diff === -2) return { text: '이글', className: 'bg-yellow-100 text-yellow-800' };
    if (diff === -1) return { text: '버디', className: 'bg-green-100 text-green-800' };
    if (diff === 0) return { text: '파', className: 'bg-blue-100 text-blue-800' };
    if (diff === 1) return { text: '보기', className: 'bg-orange-100 text-orange-800' };
    if (diff === 2) return { text: '더블보기', className: 'bg-red-100 text-red-800' };
    if (diff >= 3) return { text: '트리플보기+', className: 'bg-red-200 text-red-900' };
    
    return null;
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
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1.5 sm:mb-2">점수 입력</h1>
            <p className="text-sm sm:text-base text-neutral-600">골프 라운딩 점수를 기록하세요</p>
          </div>
        </div>

        {/* 점수 통계 */}
        {scoreStats && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">점수 통계</h2>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-neutral-500">총 스트로크</p>
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900">{scoreStats.total_strokes}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-neutral-500">평균 스코어</p>
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900">{scoreStats.average_score}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-neutral-500">최고 홀</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{scoreStats.best_hole}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-neutral-500">최악 홀</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{scoreStats.worst_hole}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 점수 목록 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900">점수 목록</h2>
            <button
              onClick={() => setScoreDialogOpen(true)}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FaPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>점수 추가</span>
            </button>
          </div>
          
          {scores.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 sm:p-8 text-center">
              <FaGolfBall className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-1.5 sm:mb-2">점수가 없습니다</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">첫 번째 점수를 입력해보세요</p>
              <button
                onClick={() => setScoreDialogOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-sm rounded-lg transition-colors"
              >
                점수 추가
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {scores.map((score) => {
                const scoreType = getScoreTypeBadge(score.score, score.par);
                return (
                  <div key={score.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                          <span className="text-base sm:text-lg font-bold text-white">{score.hole_number}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-1">{score.hole_number}번 홀</h3>
                          <p className="text-xs sm:text-sm text-neutral-500">파 {score.par}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditScore(score)}
                          className="p-1.5 sm:p-2 text-neutral-400 hover:text-primary-600 transition-colors"
                          title="수정"
                        >
                          <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setScoreToDelete(score);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 sm:p-2 text-neutral-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-1.5 sm:mb-2">{score.score}</div>
                      <div className={`text-base sm:text-lg font-medium ${getScoreDiffColor(score.score, score.par)}`}>
                        {getScoreDiff(score.score, score.par)}
                      </div>
                      {scoreType && (
                        <div className="mt-1.5 sm:mt-2">
                          <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${scoreType.className}`}>
                            {scoreType.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 점수 추가/수정 모달 */}
      {scoreDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-3 sm:px-4">
          <div className="bg-white rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {editingScore ? '점수 수정' : '점수 추가'}
              </h3>
              <button
                onClick={() => {
                  setScoreDialogOpen(false);
                  setEditingScore(null);
                  setScoreFormData({
                    hole_number: 1,
                    score: 0,
                    par: 4
                  });
                }}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTrash className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleScoreSubmit} className="space-y-4 sm:space-y-6">
              {/* 홀 번호 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  홀 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={scoreFormData.hole_number}
                  onChange={(e) => updateFormData('hole_number', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* 파 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  파 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="3"
                  max="6"
                  value={scoreFormData.par}
                  onChange={(e) => updateFormData('par', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* 스코어 */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  스코어 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={scoreFormData.score}
                  onChange={(e) => updateFormData('score', parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              {/* 버튼들 */}
              <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setScoreDialogOpen(false);
                    setEditingScore(null);
                    setScoreFormData({
                      hole_number: 1,
                      score: 0,
                      par: 4
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
                  {editingScore ? '수정' : '추가'}
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
                점수 삭제
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                정말로 이 점수를 삭제하시겠습니까?<br />
                삭제된 점수는 복구할 수 없습니다.
              </p>
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteScore}
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
          <FaTrophy className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ScoreInputPage;
