import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clubsApi } from '../../lib/clubsApi.js';
import { authUtils } from '../../lib/auth';
import { useAuth } from '../../hooks/useAuth';
import { FaLock, FaExclamationTriangle, FaSearch, FaUsers, FaMapMarkerAlt, FaFileAlt, FaCalendarAlt, FaCheckCircle, FaUserFriends, FaExclamationCircle } from 'react-icons/fa';
import LoginRequired from '../../components/LoginRequired';

const ClubListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // URL 해시에서 초기 탭 설정
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['my', 'all', 'applications', 'join-applications'];
    return validTabs.includes(hash) ? hash : 'my'; // 기본값: 'my'
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [myClubStatusFilter, setMyClubStatusFilter] = useState('ACTIVE'); // 내 클럽 탭 상태 필터 (기본값: 활성화)
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // 토스트 메시지 상태
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 비활성 클럽 모달 상태
  const [showInactiveClubModal, setShowInactiveClubModal] = useState(false);
  const [selectedInactiveClub, setSelectedInactiveClub] = useState(null);

  // location state에서 성공 메시지 확인
  useEffect(() => {
    console.log('🔍 ClubListPage location.state:', location.state);
    if (location.state?.successMessage) {
      console.log('🔍 성공 메시지 받음:', location.state.successMessage);
      setSuccessMessage(location.state.successMessage);
      setShowSuccessToast(true);
      // state 초기화 (뒤로가기 시 중복 표시 방지)
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // 토스트 메시지 자동 숨김
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // 검색 시 첫 페이지로 이동
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    setCurrentPage(1); // 탭 변경 시 첫 페이지로
  };
  
  // 해시 변경 감지 (브라우저 뒤로가기/앞으로가기)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['my', 'all', 'applications', 'join-applications'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
        setCurrentPage(1);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // 탭 변경 시 페이지 초기화 및 캐시 무효화
  useEffect(() => {
    setCurrentPage(1);
    // 탭 변경 시 이전 탭의 쿼리 캐시를 무효화하여 잘못된 데이터 표시 방지
    queryClient.invalidateQueries({ queryKey: ['clubs'] });
  }, [activeTab, queryClient]);
  
  // 내 클럽 탭 상태 필터 변경 핸들러
  const handleMyClubStatusFilterChange = (status) => {
    setMyClubStatusFilter(status);
    setCurrentPage(1);
  };

  // 클럽 목록 조회
  const {
    data: clubsData,
    isLoading: clubsLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['clubs', currentPage, statusFilter, debouncedSearchTerm, activeTab, myClubStatusFilter],
    queryFn: () => {
      console.log('🔍 클럽 목록 조회 시작:', { activeTab, currentPage, statusFilter, debouncedSearchTerm });
      
      if (activeTab === 'my') {
        console.log('🔍 내 클럽 목록 조회 API 호출 (필터 적용)');
        return clubsApi.getMyClubs({
          page: currentPage,
          limit: 6
        }).then(response => {
          // 내 클럽 목록에서 상태 필터 적용
          let filteredData = {
            ...response,
            data: (response.data || []).filter(club => {
              // membership_status가 반드시 있어야 함 (가입한 클럽만)
              const hasValidMembership = club.membership_status && 
                                         club.membership_status !== 'null' && 
                                         club.membership_status !== '' &&
                                         (club.membership_status === 'APPROVED' || 
                                          club.membership_status === 'ACTIVE' || 
                                          club.membership_status === 'PENDING');
              return hasValidMembership;
            })
          };
          
          // 상태 필터 적용
          if (myClubStatusFilter && myClubStatusFilter !== 'ALL') {
            if (myClubStatusFilter === 'ACTIVE') {
              filteredData.data = filteredData.data.filter(
                (club) => club.status === 'ACTIVE' || club.status === 'APPROVED'
              );
            } else {
              filteredData.data = filteredData.data.filter((club) => club.status === myClubStatusFilter);
            }
          }
          
          // 날짜순 정렬 (최신순)
          filteredData.data = [...filteredData.data].sort((a, b) => {
            const dateA = new Date(a.created_at || a.joined_at || 0);
            const dateB = new Date(b.created_at || b.joined_at || 0);
            return dateB - dateA;
          });
          
          return filteredData;
        });
      } else if (activeTab === 'applications') {
        console.log('🔍 내 클럽 개설 신청 내역 조회 API 호출');
        return clubsApi.getMyClubApplications({
          page: currentPage,
          limit: 6
        });
      } else if (activeTab === 'join-applications') {
        console.log('🔍 내 클럽 가입 신청 내역 조회 API 호출 (가입 대기 상태만)');
        return clubsApi.getMyClubs({
          page: currentPage,
          limit: 6,
          status_filter: 'PENDING'  // 가입 대기 상태만 표시
        }).then(response => {
          // 개설자가 아닌 클럽만 필터링 (다른 사람이 만든 클럽에 가입 신청한 것만)
          const filteredData = {
            ...response,
            data: response.data.filter((club) => {
              // created_by가 현재 사용자와 다르면 가입 신청한 클럽
              const isNotOwner = club.created_by !== user?.id;
              console.log('🔍 클럽 필터링:', {
                clubName: club.name,
                createdBy: club.created_by,
                currentUserId: user?.id,
                isNotOwner,
                membershipStatus: club.membership_status,
                comparison: `${club.created_by} !== ${user?.id} = ${isNotOwner}`
              });
              return isNotOwner;
            })
          };
          console.log('🔍 가입 신청 내역 필터링 결과:', filteredData);
          return filteredData;
        });
      } else {
        console.log('🔍 전체 클럽 목록 조회 API 호출');
        // 클럽 찾아보기 탭에서는 INACTIVE 클럽 제외
        return clubsApi.getClubs({
          page: currentPage,
          limit: 6,
          status_filter: activeTab === 'all' ? undefined : (statusFilter === 'ALL' ? undefined : statusFilter),
          search: debouncedSearchTerm || undefined
        }).then(response => {
          // 클럽 찾아보기 탭에서는 INACTIVE 상태의 클럽 제외
          if (activeTab === 'all') {
            const filteredData = {
              ...response,
              data: response.data.filter(club => club.status !== 'INACTIVE')
            };
            return filteredData;
          }
          return response;
        });
      }
    },
    enabled: activeTab !== undefined, // 탭이 확정된 후에만 쿼리 실행
    refetchOnMount: true, // 마운트 시 항상 최신 데이터 가져오기
    placeholderData: undefined, // 이전 캐시 데이터를 placeholder로 사용하지 않음
    staleTime: 5 * 60 * 1000, // 5분
  });

  // 디버깅: 데이터 로그 출력
  console.log('🔍 클럽 목록 데이터:', {
    activeTab,
    clubsData,
    isLoading,
    error,
    clubs: clubsData?.data || []
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 클럽 상세보기 클릭 핸들러
  const handleClubClick = (club, e) => {
    // Link 클릭 이벤트가 있는 경우 stopPropagation
    if (e?.target?.tagName === 'A' || e?.target?.closest('a')) {
      return;
    }
    
    // 비활성 클럽인 경우 모달 표시
    if (club.status === 'INACTIVE') {
      e?.preventDefault();
      e?.stopPropagation();
      setSelectedInactiveClub(club);
      setShowInactiveClubModal(true);
      return;
    }
    
    // 정상 클럽인 경우 상세 페이지로 이동
    navigate(`/clubs/${club.display_id}`);
  };

  // 날짜 포맷팅 헬퍼 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('ko-KR');
    } catch (error) {
      return '-';
    }
  };

  const getStatusBadge = (status, clubDeletedAt = null) => {
    // club_deleted_at이 있으면 무조건 삭제됨 배지 표시
    if (clubDeletedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          삭제됨
        </span>
      );
    }

    const normalizedStatus = String(status).toUpperCase();

    const statusConfig = {
      ACTIVE: { text: '활성', className: 'bg-success-100 text-success-800' },
      APPROVED: { text: '활성', className: 'bg-success-100 text-success-800' },
      INACTIVE: { text: '비공개', className: 'bg-neutral-100 text-neutral-800' },
      PENDING: { text: '승인 대기', className: 'bg-warning-100 text-warning-800' },
      REJECTED: { text: '거부됨', className: 'bg-error-100 text-error-800' },
      CANCELED: { text: '취소됨', className: 'bg-red-100 text-red-800' },
      SUSPENDED: { text: '정지', className: 'bg-error-100 text-error-800' }
    };

    const config =
      statusConfig[normalizedStatus] || { text: status || '알 수 없음', className: 'bg-neutral-100 text-neutral-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getMembershipStatusBadge = (status) => {
    // null, undefined, 빈 문자열, 'null' 문자열 체크
    if (!status || status === 'null' || status === '' || status === null || status === undefined) {
      return null;
    }

    const normalizedStatus = String(status).toUpperCase().trim();

    // 유효한 상태값만 허용
    const validStatuses = ['APPROVED', 'ACTIVE', 'PENDING', 'REJECTED'];
    if (!validStatuses.includes(normalizedStatus)) {
      return null;
    }

    const statusConfig = {
      APPROVED: { text: '가입됨', className: 'bg-success-100 text-success-800' },
      ACTIVE: { text: '가입됨', className: 'bg-success-100 text-success-800' },
      PENDING: { text: '가입 대기', className: 'bg-warning-100 text-warning-800' },
      REJECTED: { text: '가입 거부', className: 'bg-error-100 text-error-800' }
    };

    const config = statusConfig[normalizedStatus];
    
    if (!config) return null;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getClubTypeBadge = (type) => {
    const typeConfig = {
      REGULAR: { text: '정기 모임', className: 'bg-blue-100 text-blue-800' },
      IRREGULAR: { text: '비정기 모임', className: 'bg-purple-100 text-purple-800' },
      ROUND: { text: '라운딩', className: 'bg-primary-100 text-primary-800' },
      SOCIAL: { text: '소셜 모임', className: 'bg-secondary-100 text-secondary-800' },
      MIXED: { text: '혼합', className: 'bg-accent-100 text-accent-800' }
    };

    const config = typeConfig[type] || { text: type, className: 'bg-neutral-100 text-neutral-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // 로딩 중
  if (isLoading || clubsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <LoginRequired 
        message="로그인 후 이용가능합니다"
        description="클럽 목록을 보려면 로그인이 필요합니다."
      />
    );
  }

  if (error) {
    // 인증 에러인지 확인 (403 Forbidden 또는 토큰이 없는 경우)
    const isAuthError = error?.response?.status === 403 || !authUtils.isAuthenticated();
    
    if (isAuthError) {
      return (
        <div className="min-h-screen bg-neutral-50">
          <div className="container-main py-4 sm:py-6">
            <div className="text-center">
              <div className="text-primary-600 mb-3 sm:mb-4">
                <FaLock className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">로그인 후 이용가능합니다</h3>
              <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">클럽 목록을 보려면 로그인이 필요합니다.</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-4 sm:px-6 rounded-lg transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium py-2 px-4 sm:px-6 rounded-lg transition-colors"
                >
                  회원가입
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // 일반 에러인 경우
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="text-center">
            <div className="text-error-600 mb-3 sm:mb-4">
              <FaExclamationTriangle className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">클럽 목록을 불러올 수 없습니다</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">잠시 후 다시 시도해주세요.</p>
            <button
              onClick={() => refetch()}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  const clubs = clubsData?.data || [];
  const totalPages = clubsData?.total_pages || 1;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 헤더 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">클럽 목록</h1>
            <Link
              to="/clubs/register"
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg transition-colors"
            >
              클럽 등록
            </Link>
          </div>

          {/* 탭 메뉴 */}
          <div className="border-b border-neutral-200 mb-4 sm:mb-6">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => handleTabChange('my')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'my'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                내 클럽
              </button>
              <button
                onClick={() => handleTabChange('all')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                클럽 찾아보기
              </button>
              <button
                onClick={() => handleTabChange('applications')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'applications'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                클럽 등록 신청 내역
              </button>
              <button
                onClick={() => handleTabChange('join-applications')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === 'join-applications'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                가입 신청 내역
              </button>
            </nav>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  placeholder="클럽명, 설명, 위치로 검색..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-full pl-8 sm:pl-10 pr-2.5 sm:pr-3 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            {activeTab === 'all' && (
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="block w-full px-2.5 sm:px-3 py-2 text-sm sm:text-base border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="ALL">전체 상태</option>
                  <option value="APPROVED">승인됨</option>
                  <option value="PENDING">승인 대기</option>
                  <option value="REJECTED">거부됨</option>
                </select>
              </div>
            )}
          </div>
          
          {/* 내 클럽 탭 상태 필터 */}
          {activeTab === 'my' && (
            <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={() => handleMyClubStatusFilterChange('ACTIVE')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                  myClubStatusFilter === 'ACTIVE'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                활성/승인
              </button>
              <button
                onClick={() => handleMyClubStatusFilterChange('INACTIVE')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                  myClubStatusFilter === 'INACTIVE'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                비공개
              </button>
              <button
                onClick={() => handleMyClubStatusFilterChange('ALL')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                  myClubStatusFilter === 'ALL'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                전체
              </button>
            </div>
          )}
        </div>

        {/* 클럽 목록 */}
        {activeTab === 'all' && (
          <div>
            {!clubs.length ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-neutral-400 mb-3 sm:mb-4">
                  <FaCalendarAlt className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">클럽이 없습니다</h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? '검색 조건에 맞는 클럽이 없습니다.' 
                    : '아직 등록된 클럽이 없습니다.'}
                </p>
                {!searchTerm && statusFilter === 'ALL' && (
                  <Link
                    to="/clubs/register"
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
                  >
                    첫 번째 클럽 등록하기
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clubs.map((club) => (
                    <div 
                      key={club.id} 
                      className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={(e) => handleClubClick(club, e)}
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white border border-neutral-200 flex-shrink-0">
                              <img 
                                src="/logo.png" 
                                alt={club.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-1">
                              {club.name}
                            </h3>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {getStatusBadge(club.status)}
                          </div>
                        </div>

                        <div className="mb-2 sm:mb-3">
                          {getClubTypeBadge(club.type)}
                        </div>

                        <p className="text-neutral-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                          {club.description}
                        </p>

                        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                          <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                            <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <span className="line-clamp-1">{club.location}</span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                            <FaUserFriends className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            멤버 {club.member_count}명
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">
                            {formatDate(club.created_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClubClick(club, e);
                            }}
                            className="text-primary-600 hover:text-primary-700 font-medium text-xs sm:text-sm"
                          >
                            자세히 보기 →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {clubs.length > 0 && (
                  <div className="mt-6 sm:mt-8 flex items-center justify-center">
                    <nav className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
                      {(() => {
                        // 표시할 페이지 번호 계산 (5개씩 정렬)
                        const pageNumbers = [];
                        
                        if (totalPages <= 5) {
                          // 5개 이하면 모두 표시
                          for (let i = 1; i <= totalPages; i++) {
                            pageNumbers.push(i);
                          }
                        } else {
                          // 6개 이상: 항상 5개씩 표시 (5의 배수 단위로 그룹화)
                          // 현재 페이지가 속한 5의 배수 그룹 계산
                          // 예: 4페이지면 1-5 그룹, 6페이지면 6-10 그룹
                          const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
                          const groupEnd = Math.min(groupStart + 4, totalPages);
                          
                          for (let i = groupStart; i <= groupEnd; i++) {
                            pageNumbers.push(i);
                          }
                        }
                        
                        return pageNumbers.map((pageNum) => {
                          const isValidPage = pageNum >= 1 && pageNum <= totalPages;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                // 존재하지 않는 페이지 클릭 방지
                                if (!isValidPage) return;
                                handlePageChange(pageNum);
                              }}
                              disabled={!isValidPage}
                              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg ${
                                !isValidPage
                                  ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                                  : currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 내 클럽 탭 */}
        {activeTab === 'my' && (
          <div>
            {!clubs.length ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-neutral-400 mb-3 sm:mb-4">
                  <FaUsers className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">내 클럽</h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">
                  가입한 클럽이 없습니다. 클럽에 가입해보세요!
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
                >
                  클럽 둘러보기
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clubs.map((club) => (
                    <div 
                      key={club.id} 
                      className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/clubs/${club.display_id}`)}
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white border border-neutral-200 flex-shrink-0">
                              <img 
                                src="/logo.png" 
                                alt={club.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-1">
                              {club.name}
                            </h3>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0 ml-2">
                            {club.status && (
                              getStatusBadge(club.status)
                            )}
                            {getMembershipStatusBadge(club.membership_status)}
                          </div>
                        </div>

                        <div className="mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {getClubTypeBadge(club.type)}
                          {club.membership_role && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${
                              club.membership_role === 'LEADER' 
                                ? 'bg-purple-100 text-purple-800'
                                : club.membership_role === 'MANAGER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {club.membership_role === 'LEADER' ? '리더' : club.membership_role === 'MANAGER' ? '매니저' : '일반회원'}
                            </span>
                          )}
                        </div>

                        <p className="text-neutral-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                          {club.description}
                        </p>

                        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                          <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                            <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <span className="line-clamp-1">{club.location}</span>
                          </div>
                          <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                            <FaUserFriends className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            멤버 {club.member_count}명
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">
                            {formatDate(club.created_at || club.joined_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClubClick(club, e);
                            }}
                            className="text-primary-600 hover:text-primary-700 font-medium text-xs sm:text-sm"
                          >
                            자세히 보기 →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {clubs.length > 0 && (
                  <div className="mt-6 sm:mt-8 flex items-center justify-center">
                    <nav className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
                      {(() => {
                        // 표시할 페이지 번호 계산 (5개씩 정렬)
                        const pageNumbers = [];
                        
                        if (totalPages <= 5) {
                          // 5개 이하면 모두 표시
                          for (let i = 1; i <= totalPages; i++) {
                            pageNumbers.push(i);
                          }
                        } else {
                          // 6개 이상: 항상 5개씩 표시 (5의 배수 단위로 그룹화)
                          // 현재 페이지가 속한 5의 배수 그룹 계산
                          // 예: 4페이지면 1-5 그룹, 6페이지면 6-10 그룹
                          const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
                          const groupEnd = Math.min(groupStart + 4, totalPages);
                          
                          for (let i = groupStart; i <= groupEnd; i++) {
                            pageNumbers.push(i);
                          }
                        }
                        
                        return pageNumbers.map((pageNum) => {
                          const isValidPage = pageNum >= 1 && pageNum <= totalPages;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                // 존재하지 않는 페이지 클릭 방지
                                if (!isValidPage) return;
                                handlePageChange(pageNum);
                              }}
                              disabled={!isValidPage}
                              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg ${
                                !isValidPage
                                  ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                                  : currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 신청 내역 탭 */}
        {activeTab === 'applications' && (
          <div>
            {!clubs.length ? (
              <div className="text-center py-12">
                <div className="text-neutral-400 mb-4">
                  <FaFileAlt className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">개설 신청 내역</h3>
                <p className="text-neutral-600 mb-4">
                  클럽 개설 신청 내역이 없습니다.
                </p>
                <Link
                  to="/clubs/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  클럽 등록하기
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clubs.map((application) => (
                    <div 
                      key={application.id} 
                      className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/clubs/applications/${application.id}`)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white border border-neutral-200">
                              <img 
                                src="/logo.png" 
                                alt={application.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-900 line-clamp-1">
                              {application.name}
                            </h3>
                          </div>
                          {getStatusBadge(application.status, application.club_deleted_at)}
                        </div>

                        <div className="mb-3">
                          {getClubTypeBadge(application.type)}
                        </div>

                        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                          {application.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-neutral-500">
                            <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                            {application.location}
                          </div>
                          <div className="flex items-center text-sm text-neutral-500">
                            <FaUserFriends className="h-4 w-4 mr-2" />
                            멤버 {application.member_count}명
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">
                            신청일: {formatDate(application.created_at)}
                          </span>
                          <span className="text-primary-600 font-medium text-sm">
                            상세보기 →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {clubs.length > 0 && (
                  <div className="mt-6 sm:mt-8 flex items-center justify-center">
                    <nav className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
                      {(() => {
                        // 표시할 페이지 번호 계산 (5개씩 정렬)
                        const pageNumbers = [];
                        
                        if (totalPages <= 5) {
                          // 5개 이하면 모두 표시
                          for (let i = 1; i <= totalPages; i++) {
                            pageNumbers.push(i);
                          }
                        } else {
                          // 6개 이상: 항상 5개씩 표시 (5의 배수 단위로 그룹화)
                          // 현재 페이지가 속한 5의 배수 그룹 계산
                          // 예: 4페이지면 1-5 그룹, 6페이지면 6-10 그룹
                          const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
                          const groupEnd = Math.min(groupStart + 4, totalPages);
                          
                          for (let i = groupStart; i <= groupEnd; i++) {
                            pageNumbers.push(i);
                          }
                        }
                        
                        return pageNumbers.map((pageNum) => {
                          const isValidPage = pageNum >= 1 && pageNum <= totalPages;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                // 존재하지 않는 페이지 클릭 방지
                                if (!isValidPage) return;
                                handlePageChange(pageNum);
                              }}
                              disabled={!isValidPage}
                              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg ${
                                !isValidPage
                                  ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                                  : currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* 가입 신청 내역 탭 */}
        {activeTab === 'join-applications' && (
          <div>
            {!clubs.length ? (
              <div className="text-center py-12">
                <div className="text-neutral-400 mb-4">
                  <FaUsers className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">가입 신청 내역</h3>
                <p className="text-neutral-600 mb-4">
                  가입 승인 대기 중인 클럽이 없습니다.
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  클럽 둘러보기
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clubs.map((club) => (
                    <div 
                      key={club.id} 
                      className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/clubs/${club.display_id}`)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white border border-neutral-200">
                              <img 
                                src="/logo.png" 
                                alt={club.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-900 line-clamp-1">
                              {club.name}
                            </h3>
                          </div>
                          <div className="flex flex-col gap-1">
                            {getMembershipStatusBadge(club.membership_status)}
                          </div>
                        </div>

                        <div className="mb-3 flex items-center gap-2">
                          {getClubTypeBadge(club.type)}
                          {club.membership_role && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              club.membership_role === 'LEADER' 
                                ? 'bg-purple-100 text-purple-800'
                                : club.membership_role === 'MANAGER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {club.membership_role === 'LEADER' ? '리더' : club.membership_role === 'MANAGER' ? '매니저' : '일반회원'}
                            </span>
                          )}
                        </div>

                        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                          {club.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-neutral-500">
                            <FaMapMarkerAlt className="h-4 w-4 mr-2" />
                            {club.location}
                          </div>
                          <div className="flex items-center text-sm text-neutral-500">
                            <FaUserFriends className="h-4 w-4 mr-2" />
                            멤버 {club.member_count}명
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-neutral-400">
                            가입 신청일: {formatDate(club.created_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClubClick(club, e);
                            }}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                          >
                            자세히 보기 →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                {clubs.length > 0 && (
                  <div className="mt-6 sm:mt-8 flex items-center justify-center">
                    <nav className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                      
                      {(() => {
                        // 표시할 페이지 번호 계산 (5개씩 정렬)
                        const pageNumbers = [];
                        
                        if (totalPages <= 5) {
                          // 5개 이하면 모두 표시
                          for (let i = 1; i <= totalPages; i++) {
                            pageNumbers.push(i);
                          }
                        } else {
                          // 6개 이상: 항상 5개씩 표시 (5의 배수 단위로 그룹화)
                          // 현재 페이지가 속한 5의 배수 그룹 계산
                          // 예: 4페이지면 1-5 그룹, 6페이지면 6-10 그룹
                          const groupStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
                          const groupEnd = Math.min(groupStart + 4, totalPages);
                          
                          for (let i = groupStart; i <= groupEnd; i++) {
                            pageNumbers.push(i);
                          }
                        }
                        
                        return pageNumbers.map((pageNum) => {
                          const isValidPage = pageNum >= 1 && pageNum <= totalPages;
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                // 존재하지 않는 페이지 클릭 방지
                                if (!isValidPage) return;
                                handlePageChange(pageNum);
                              }}
                              disabled={!isValidPage}
                              className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg ${
                                !isValidPage
                                  ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                                  : currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* 성공 토스트 메시지 */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-up">
          <FaCheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* 비활성 클럽 모달 */}
      {showInactiveClubModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <FaExclamationCircle className="h-8 w-8 text-yellow-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                클럽 비활성 상태
              </h3>
              
              <p className="text-gray-600 mb-6">
                이 클럽은 관리자에 의해 비활성화 상태입니다.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowInactiveClubModal(false);
                    setSelectedInactiveClub(null);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  클럽 목록으로
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubListPage;
