import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaArrowLeft, FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaGolfBall, FaTrophy, FaChartLine, FaFlag, FaCircle } from 'react-icons/fa';
import { roundsApi } from '../../lib/api';

const MeetingStatsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [scoreStats, setScoreStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 모임 상세 정보 조회
  const fetchMeetingDetail = async () => {
    try {
      const response = await roundsApi.getRound(id);
      setMeeting(response.data);
      setParticipants(response.data.participants || []);
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('모임 상세 조회 실패:', err);
      setError('모임 정보를 불러올 수 없습니다.');
    }
  };

  // 점수 통계 조회
  const fetchScoreStats = async () => {
    try {
      const response = await roundsApi.getRoundScoreStats(id);
      setScoreStats(response.data);
    } catch (err) {
      console.error('점수 통계 조회 실패:', err);
      // 점수 통계는 선택사항이므로 에러를 무시
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchMeetingDetail(), fetchScoreStats()]);
      } catch (err) {
        console.error('데이터 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (err) {
      return dateString;
    }
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    if (!amount) return '미정';
    return `${amount.toLocaleString()}원`;
  };

  // 점수 포맷팅
  const formatScore = (score) => {
    if (score === null || score === undefined) return '-';
    return score.toString();
  };

  // 점수 차이 포맷팅
  const formatScoreDiff = (score, par) => {
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

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-1.5 sm:mb-2">모임을 찾을 수 없습니다</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">{error || '요청하신 모임이 존재하지 않습니다.'}</p>
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
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-1.5 sm:mb-2">모임 통계</h1>
            <p className="text-sm sm:text-base text-neutral-600">{meeting.name}</p>
          </div>
        </div>

        {/* 모임 기본 정보 */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">모임 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <FaCalendarAlt className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-neutral-500">모임 시간</p>
                  <p className="text-sm sm:text-base text-neutral-900 line-clamp-1">{formatDate(meeting.meeting_time)}</p>
                </div>
              </div>
              
              {meeting.location && (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <FaMapMarkerAlt className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-neutral-500">장소</p>
                    <p className="text-sm sm:text-base text-neutral-900 line-clamp-1">{meeting.location}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <FaUsers className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-neutral-500">참가자</p>
                  <p className="text-sm sm:text-base text-neutral-900">{meeting.participant_count}/{meeting.max_participants}명</p>
                </div>
              </div>
              
              {meeting.course_name && (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <FaGolfBall className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-neutral-500">골프장</p>
                    <p className="text-sm sm:text-base text-neutral-900 line-clamp-1">{meeting.course_name}</p>
                  </div>
                </div>
              )}
            </div>
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
                  <p className="text-xl sm:text-2xl font-bold text-neutral-900">{formatScore(scoreStats.average_score)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-neutral-500">최고 홀</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">{formatScore(scoreStats.best_hole)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-neutral-500">최악 홀</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">{formatScore(scoreStats.worst_hole)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 참가자 목록 */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">참가자 목록</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 bg-neutral-50 rounded-lg">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-white">
                      {participant.user_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">{participant.user_name}</h4>
                    <p className="text-[10px] sm:text-xs text-neutral-500 line-clamp-1">{participant.user_email}</p>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                      participant.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : participant.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {participant.status === 'CONFIRMED' ? '확정' : 
                       participant.status === 'PENDING' ? '대기' : '취소'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 팀 정보 */}
        {teams.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">팀 구성</h2>
              <div className="space-y-3 sm:space-y-4">
                {teams.map((team) => (
                  <div key={team.id} className="border border-neutral-200 rounded-lg p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-2 sm:mb-3">{team.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2 sm:space-x-3 p-2 bg-neutral-50 rounded-lg">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                            <span className="text-[10px] sm:text-xs font-bold text-white">
                              {member.user_name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1">{member.user_name}</h4>
                            <p className="text-[10px] sm:text-xs text-neutral-500 line-clamp-1">{member.user_email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 비용 정보 */}
        {(meeting.total_cost || meeting.social_cost) && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">비용 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {meeting.meeting_type === 'ROUND' && meeting.total_cost && (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <FaDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-neutral-500">총 비용(원)</p>
                      <p className="text-base sm:text-lg font-semibold text-neutral-900">{formatAmount(meeting.total_cost)}</p>
                    </div>
                  </div>
                )}
                
                {meeting.meeting_type === 'SOCIAL' && meeting.social_cost && (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <FaDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-neutral-500">소셜 비용</p>
                      <p className="text-base sm:text-lg font-semibold text-neutral-900">{formatAmount(meeting.social_cost)}</p>
                    </div>
                  </div>
                )}
                
                {meeting.green_fee && (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <FaGolfBall className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-neutral-500">그린피</p>
                      <p className="text-base sm:text-lg font-semibold text-neutral-900">{formatAmount(meeting.green_fee)}</p>
                    </div>
                  </div>
                )}
                
                {meeting.caddy_fee && (
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <FaUsers className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-neutral-500">캐디비</p>
                      <p className="text-base sm:text-lg font-semibold text-neutral-900">{formatAmount(meeting.caddy_fee)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4">
          <button
            onClick={() => navigate(`/meetings/rounding/${id}/expense`)}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <FaDollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>정산 관리</span>
          </button>
          
          <button
            onClick={() => navigate(`/meetings/rounding/${id}/score`)}
            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <FaTrophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>점수 입력</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingStatsPage;
