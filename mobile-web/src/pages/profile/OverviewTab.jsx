import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../lib/api';
import { clubsApi } from '../../lib/clubsApi';
import { FaUser, FaEnvelope, FaCalendarAlt, FaVenusMars, FaGolfBall, FaChartLine, FaInfoCircle, FaUsers, FaArrowRight } from 'react-icons/fa';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const OverviewTab = () => {
  const navigate = useNavigate();

  // 사용자 프로필 조회
  const {
    data: userProfile,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getMyProfile
  });

  // 사용자 ID 추출 (핸디캡 정보 조회용)
  const userId = userProfile?.id || (userProfile?.data && userProfile.data.id) || null;

  // 핸디캡 정보 조회
  const {
    data: handicapResponse,
    isLoading: handicapLoading
  } = useQuery({
    queryKey: ['user-handicap', userId],
    queryFn: () => usersApi.getUserHandicap(userId),
    enabled: !!userId,
    retry: false
  });

  // 내 클럽 목록 조회 (최대 3개만)
  const {
    data: myClubsData,
    isLoading: clubsLoading
  } = useQuery({
    queryKey: ['my-clubs', 'overview'],
    queryFn: () => clubsApi.getMyClubs({ page: 1, limit: 3 }),
    retry: false
  });

  // 데이터 추출
  const user = userProfile?.data || userProfile || {};
  const handicapInfo = handicapResponse?.data || handicapResponse || {
    initial_handicap: null,
    calculated_handicap: null,
    handicap_calculation_count: 0,
    is_auto_calculated: false
  };
  
  // 클럽 데이터 추출
  const myClubs = myClubsData?.data || myClubsData || [];

  // 날짜 포맷팅 헬퍼
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일', { locale: ko });
    } catch (e) {
      return dateString;
    }
  };

  // 성별 표시
  const getGenderLabel = (gender) => {
    if (!gender) return '-';
    const genderUpper = String(gender).toUpperCase();
    switch (genderUpper) {
      case 'M':
      case 'MALE':
      case '남성':
        return '남성';
      case 'F':
      case 'FEMALE':
      case '여성':
        return '여성';
      default:
        return gender; // 원본 값 반환 (혹시 다른 형식일 경우)
    }
  };

  // 핸디캡 표시 로직
  const getHandicapDisplay = () => {
    if (handicapInfo.calculated_handicap !== null && handicapInfo.calculated_handicap !== undefined) {
      const isAutoCalculated = handicapInfo.handicap_calculation_count >= 1;
      return {
        value: handicapInfo.calculated_handicap.toFixed(1),
        badge: isAutoCalculated ? '자동 계산됨' : null,
        description: isAutoCalculated
          ? `누적 평균으로 자동 계산됨 (${handicapInfo.handicap_calculation_count}회 기록)`
          : null
      };
    } else if (handicapInfo.initial_handicap !== null && handicapInfo.initial_handicap !== undefined) {
      return {
        value: handicapInfo.initial_handicap.toFixed(1),
        badge: null,
        description: '초기 핸디캡'
      };
    } else if (user.handicap !== null && user.handicap !== undefined) {
      return {
        value: user.handicap.toFixed(1),
        badge: null,
        description: '기본 핸디캡'
      };
    }
    return {
      value: '-',
      badge: null,
      description: null
    };
  };

  const handicapDisplay = getHandicapDisplay();

  // 내 클럽 전체보기 클릭 핸들러
  const handleViewAllClubs = () => {
    navigate('/clubs#my');
  };

  // 로딩 상태
  if (isLoading || handicapLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <div className="text-center text-red-600">
          <FaInfoCircle className="mx-auto h-12 w-12 mb-4" />
          <p>사용자 정보를 불러오는데 실패했습니다.</p>
          <p className="text-sm mt-2">{error.message || '알 수 없는 오류가 발생했습니다.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 사용자 기본 정보 카드 */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4 sm:mb-6">기본 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 실명 */}
          <div className="flex items-start space-x-3">
            <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">실명</p>
              <p className="text-base font-medium text-neutral-900">{user.realname || '-'}</p>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="flex items-start space-x-3">
            <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">닉네임</p>
              <p className="text-sm sm:text-base font-medium text-neutral-900">{user.nickname || '-'}</p>
            </div>
          </div>

          {/* 이메일 */}
          <div className="flex items-start space-x-3">
            <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">이메일</p>
              <p className="text-sm sm:text-base font-medium text-neutral-900">{user.email || '-'}</p>
            </div>
          </div>

          {/* 성별 */}
          <div className="flex items-start space-x-3">
            <FaVenusMars className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">성별</p>
              <p className="text-sm sm:text-base font-medium text-neutral-900">
                {user.gender ? getGenderLabel(user.gender) : '-'}
              </p>
            </div>
          </div>

          {/* 생년월일 */}
          <div className="flex items-start space-x-3">
            <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">생년월일</p>
              <p className="text-sm sm:text-base font-medium text-neutral-900">{formatDate(user.birthdate)}</p>
            </div>
          </div>

          {/* 가입일 */}
          <div className="flex items-start space-x-3">
            <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">가입일</p>
              <p className="text-base font-medium text-neutral-900">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 골프 정보 카드 */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-4 sm:mb-6">골프 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 평균 타수 */}
          <div className="flex items-start space-x-3">
            <FaGolfBall className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">평균 타수</p>
              <p className="text-sm sm:text-base font-medium text-neutral-900">
                {user.average_score !== null && user.average_score !== undefined ? `${user.average_score}타` : '-'}
              </p>
            </div>
          </div>

          {/* 핸디캡 */}
          <div className="flex items-start space-x-3">
            <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-neutral-500 mb-1">핸디캡</p>
              <div className="flex items-center space-x-2">
                <p className="text-base font-medium text-neutral-900">{handicapDisplay.value}</p>
                {handicapDisplay.badge && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {handicapDisplay.badge}
                  </span>
                )}
              </div>
              {handicapDisplay.description && (
                <p className="text-xs text-neutral-500 mt-1">{handicapDisplay.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 소속 클럽 정보 카드 */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">소속 클럽</h2>
          <button
            onClick={handleViewAllClubs}
            className="flex items-center space-x-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <span>내 클럽 전체보기</span>
            <FaArrowRight className="w-3 h-3" />
          </button>
        </div>

        {clubsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : myClubs.length === 0 ? (
          <div className="text-center py-8">
            <FaUsers className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
            <p className="text-neutral-500">소속된 클럽이 없습니다.</p>
            <button
              onClick={handleViewAllClubs}
              className="mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              클럽 찾아보기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myClubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center space-x-4 p-4 rounded-lg border border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/clubs/${club.id}`)}
              >
                <div className="flex-shrink-0">
                  {club.profile_image ? (
                    <img
                      src={club.profile_image}
                      alt={club.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FaUsers className="w-6 h-6 text-emerald-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900 truncate">{club.name}</h3>
                  <div className="flex items-center space-x-3 mt-1">
                    {club.location && (
                      <p className="text-sm text-neutral-500 truncate">{club.location}</p>
                    )}
                    {club.member_count !== undefined && (
                      <p className="text-sm text-neutral-500">
                        멤버 {club.member_count}명
                      </p>
                    )}
                  </div>
                  {club.my_role && (
                    <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      {club.my_role === 'LEADER' ? '리더' : club.my_role === 'MANAGER' ? '매니저' : club.my_role === 'MEMBER' ? '멤버' : club.my_role}
                    </span>
                  )}
                </div>
                <FaArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;

