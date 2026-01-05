import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaUsers, FaDollarSign, FaCalculator, FaPlus, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaSearch, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import LoginRequired from '../../components/LoginRequired';
import { useAuth } from '../../hooks/useAuth';
import { roundsApi, clubApi, socialsApi } from '../../lib/api';

const MeetingListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [toast, setToast] = useState({ open: false, message: '', tone: 'success' });
  
  // URL 해시에서 초기 탭 설정
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#', '');
    return hash === 'social' ? 'social' : 'rounding';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [roundingMeetings, setRoundingMeetings] = useState([]);
  const [socialMeetings, setSocialMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasClubs, setHasClubs] = useState(false);
  
  // 페이지네이션 상태
  const [roundingPage, setRoundingPage] = useState(1);
  const [socialPage, setSocialPage] = useState(1);
  const [roundingTotalPages, setRoundingTotalPages] = useState(1);
  const [socialTotalPages, setSocialTotalPages] = useState(1);
  
  // 필터 상태 (탭별로 독립 관리)
  // 라운딩 탭 필터
  const [roundingSearchInput, setRoundingSearchInput] = useState('');
  const [roundingSearchQuery, setRoundingSearchQuery] = useState('');
  const [roundingStartDate, setRoundingStartDate] = useState('');
  const [roundingEndDate, setRoundingEndDate] = useState('');
  const [roundingStatusFilter, setRoundingStatusFilter] = useState('active'); // 'active' 또는 'completed'
  
  // 소셜 탭 필터
  const [socialSearchInput, setSocialSearchInput] = useState('');
  const [socialSearchQuery, setSocialSearchQuery] = useState('');
  const [socialStartDate, setSocialStartDate] = useState('');
  const [socialEndDate, setSocialEndDate] = useState('');
  const [socialStatusFilter, setSocialStatusFilter] = useState('active'); // 'active' 또는 'completed'

  // 클럽 목록 조회
  const fetchClubs = async () => {
    try {
      const response = await clubApi.getMyClubs();
      const clubs = response?.data || [];
      // 활성 상태(ACTIVE/APPROVED)의 클럽만 필터링
      const activeClubs = clubs.filter(
        (club) => club.status === 'ACTIVE' || club.status === 'APPROVED'
      );
      setHasClubs(activeClubs.length > 0);
    } catch (err) {
      // 인증 에러인지 확인 (403 Forbidden 또는 토큰이 없는 경우)
      const isAuthError = err?.response?.status === 403;
      
      if (isAuthError) {
        setError('AUTH_REQUIRED');
      } else {
        console.error('클럽 목록 조회 실패:', err);
        // 에러가 발생해도 클럽이 없는 것으로 간주
        setHasClubs(false);
      }
    }
  };

  // 날짜 필터 계산 함수
  const getDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return null;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    // 종료일은 하루 끝까지 포함하도록 설정
    if (end) {
      end.setHours(23, 59, 59, 999);
    }
    
    return { startDate: start, endDate: end };
  };

  // 날짜 필터링 함수 (프론트엔드에서 필터링)
  const filterByDate = (meetings, dateRange) => {
    if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) return meetings;
    return meetings.filter((meeting) => {
      if (!meeting.meeting_time) return false;
      const meetingDate = new Date(meeting.meeting_time);
      
      if (dateRange.startDate && dateRange.endDate) {
        return meetingDate >= dateRange.startDate && meetingDate <= dateRange.endDate;
      } else if (dateRange.startDate) {
        return meetingDate >= dateRange.startDate;
      } else if (dateRange.endDate) {
        return meetingDate <= dateRange.endDate;
      }
      return true;
    });
  };

  // 모임이 진행 중인지 판단하는 함수
  // getStatusBadge와 동일한 로직 사용
  const isMeetingActive = (meeting) => {
    const status = meeting?.status;
    const participantCount = meeting?.participant_count || 0;
    const applicationDeadline = meeting?.application_deadline;
    const applicationClosedEarly = meeting?.application_closed_early || false;
    const meetingType = meeting?.meeting_type;
    const isRoundingMeeting = meetingType === 'ROUND';
    const meetingTime = meeting?.meeting_time;
    const settlementConfirmed = meeting?.settlement_confirmed;
    const roundingCompletedAt = meeting?.rounding_completed_at;
    
    // 최소 인원 미달 체크 - 라운딩과 소셜 구분
    // 라운딩: 1-3명, 소셜: 1명
    const isMinParticipantsNotMet = isRoundingMeeting
      ? participantCount >= 1 && participantCount <= 3
      : participantCount === 1;
    
    // 마감 기한 지났는지 체크
    const isDeadlinePassed = applicationDeadline ? isPastDateTime(applicationDeadline) : false;
    
    // 마감 처리 여부: 마감 기한이 지났거나 조기 마감 처리됨
    const isApplicationClosed = isDeadlinePassed || applicationClosedEarly;
    
    // 취소 상태 판단 (getStatusBadge와 동일한 로직)
    const isCanceled = 
      status === 'CANCELED' ||
      (status === 'SCHEDULED' && isApplicationClosed && isMinParticipantsNotMet);
    
    // 완료 상태
    const isCompleted = status === 'COMPLETED';
    
    // 정산 확정된 모임은 무조건 비활성 (완료/취소 탭)
    if (settlementConfirmed === true) {
      return false;
    }
    
    // 모임이 완료 처리된 경우 비활성 (완료/취소 탭)
    if (meeting?.is_completed === true) {
      return false;
    }
    
    // 상태가 COMPLETED인 경우 비활성 (완료/취소 탭)
    if (isCompleted) {
      return false;
    }
    
    // 모임 일시가 지났는지 체크
    const isMeetingTimePassed = meetingTime ? isPastDateTime(meetingTime) : false;
    
    // 라운딩 모임 처리
    if (isRoundingMeeting) {
      // rounding_completed_at이 있으면 비활성 (완료/취소 탭)
      if (roundingCompletedAt) {
        return false;
      }
      // meeting_time이 지났는데 rounding_completed_at이 없으면 비활성 (미진행 상태로 완료/취소 탭)
      if (isMeetingTimePassed && !roundingCompletedAt) {
        return false;
      }
    } else {
      // 소셜 모임: meeting_time이 지났으면 비활성 (완료/취소 탭)
      if (isMeetingTimePassed) {
        return false;
      }
    }
    
    // 완료/취소: 취소 또는 완료
    // 진행중/진행예정: 그 외 모든 상태
    return !isCanceled && !isCompleted;
  };

  // 상태 필터링 함수
  const filterByStatus = (meetings, statusFilter) => {
    if (statusFilter === 'active') {
      return meetings.filter(meeting => isMeetingActive(meeting));
    } else {
      return meetings.filter(meeting => !isMeetingActive(meeting));
    }
  };

  // 검색 실행 핸들러
  const handleSearch = () => {
    if (activeTab === 'rounding') {
      setRoundingSearchQuery(roundingSearchInput);
      setRoundingPage(1);
    } else {
      setSocialSearchQuery(socialSearchInput);
      setSocialPage(1);
    }
  };
  
  // 필터가 적용되었는지 확인
  const hasActiveFilters = () => {
    if (activeTab === 'rounding') {
      return !!(roundingSearchQuery || roundingStartDate || roundingEndDate);
    } else {
      return !!(socialSearchQuery || socialStartDate || socialEndDate);
    }
  };

  // 라운딩 목록 조회
  const fetchRoundingMeetings = async (page = roundingPage, search = roundingSearchQuery) => {
    try {
      // 진행 탭과 완료 탭 모두 모든 페이지를 조회하여 프론트엔드에서 필터링
      // (SCHEDULED 상태지만 취소 조건인 경우도 포함되므로 모든 데이터 조회 필요)
      const allPagesMeetings = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore && currentPage <= 10) { // 최대 10페이지까지 조회 (60개)
        const params = {
          page: currentPage,
          limit: 100, // 충분히 큰 값으로 한 페이지에 모두 가져오기
          ...(search && { search })
        };
        
        const pageResponse = await roundsApi.getRounds(params);
        const pageMeetings = pageResponse?.data || [];
        
        if (pageMeetings.length === 0) {
          hasMore = false;
        } else {
          allPagesMeetings.push(...pageMeetings);
          // 백엔드에서 반환한 total_pages 확인
          const totalPages = pageResponse?.total_pages || 1;
          if (currentPage >= totalPages) {
            hasMore = false;
          } else {
            currentPage++;
          }
        }
      }
      
      // 모든 데이터를 가져온 후 날짜/상태 필터 적용
      const dateRange = getDateRange(roundingStartDate, roundingEndDate);
      let filteredMeetings = filterByDate(allPagesMeetings, dateRange);
      
      // 상태 필터 적용
      if (roundingStatusFilter === 'completed') {
        filteredMeetings = filterByStatus(filteredMeetings, 'completed');
      } else {
        filteredMeetings = filterByStatus(filteredMeetings, 'active');
      }
      
      // 프론트엔드에서 페이지네이션 처리 (진행 탭과 완료 탭 모두 동일)
      const itemsPerPage = 6;
      const calculatedTotalPages = Math.max(1, Math.ceil(filteredMeetings.length / itemsPerPage));
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedMeetings = filteredMeetings.slice(startIndex, endIndex);
      
      setRoundingMeetings(paginatedMeetings);
      setRoundingTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error('라운딩 조회 실패:', err);
      setRoundingMeetings([]);
      setRoundingTotalPages(1);
    }
  };

  // 소셜 모임 목록 조회
  const fetchSocialMeetings = async (page = socialPage, search = socialSearchQuery) => {
    try {
      const params = {
        page,
        limit: 6,
      };
      if (search) {
        params.search = search;
      }
      // 상태 필터: 완료/취소 탭에서는 모든 상태를 조회 (프론트엔드에서 필터링)
      // 진행 탭에서도 모든 상태를 조회하여 프론트엔드에서 필터링
      
      const response = await socialsApi.getSocials(params);
      // PaginatedResponse 형식: { data: [...], total: number, page: number, limit: number, total_pages: number }
      const socialData = response?.data || [];
      
      // 디버깅: 실제 응답 데이터 형식 확인
      if (socialData.length > 0) {
        console.log('🔍 소셜 모임 응답 데이터 샘플:', {
          application_deadline: socialData[0].application_deadline,
          meeting_time: socialData[0].meeting_time,
          type: typeof socialData[0].application_deadline
        });
      }
      
      const socials = (Array.isArray(socialData) ? socialData : []).map((social) => ({
        ...social,
        meeting_type: 'SOCIAL',
        meeting_time: social.meeting_time,
        participant_count: social.participant_count || 0
      }));
      
      // 백엔드에서 이미 상태별 우선순위 + created_at 오름차순으로 정렬되어 있으므로
      // 프론트엔드에서 추가 정렬 불필요
      
      // 날짜 필터 적용 (프론트엔드에서)
      const dateRange = getDateRange(socialStartDate, socialEndDate);
      let filteredSocials = filterByDate(socials, dateRange);
      
      // 상태 필터 적용
      if (socialStatusFilter === 'completed') {
        filteredSocials = filterByStatus(filteredSocials, 'completed');
      } else {
        filteredSocials = filterByStatus(filteredSocials, 'active');
      }
      
      // 프론트엔드에서 페이지네이션 처리 (진행 탭과 완료 탭 모두 동일)
      const itemsPerPage = 6;
      const calculatedTotalPages = Math.max(1, Math.ceil(filteredSocials.length / itemsPerPage));
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedSocials = filteredSocials.slice(startIndex, endIndex);
      
      setSocialMeetings(paginatedSocials);
      setSocialTotalPages(calculatedTotalPages);
    } catch (err) {
      console.error('소셜 모임 조회 실패:', err);
      setSocialMeetings([]);
      setSocialTotalPages(1);
    }
  };

  // location.state에서 토스트 메시지 확인
  useEffect(() => {
    if (location.state?.message) {
      setToast({ 
        open: true, 
        message: location.state.message, 
        tone: location.state.type || 'success' 
      });
      // state 초기화 (뒤로가기 시 중복 표시 방지)
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast.open) return undefined;
    const timeout = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [toast.open]);

  // URL 해시 변경 감지
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const newTab = hash === 'social' ? 'social' : 'rounding';
      if (newTab !== activeTab) {
        setActiveTab(newTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.location.hash = tab;
    // 탭 변경 시 첫 페이지로 리셋
    if (tab === 'rounding') {
      setRoundingPage(1);
    } else {
      setSocialPage(1);
    }
  };

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    // 인증되지 않은 경우 loading 상태를 false로 설정하고 종료
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await fetchClubs();
        if (activeTab === 'rounding') {
          await fetchRoundingMeetings(roundingPage, roundingSearchQuery);
        } else {
          await fetchSocialMeetings(socialPage, socialSearchQuery);
        }
      } catch (err) {
        console.error('데이터 로딩 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    isAuthenticated,
    activeTab,
    roundingPage,
    socialPage,
    roundingSearchQuery,
    socialSearchQuery,
    roundingStartDate,
    roundingEndDate,
    socialStartDate,
    socialEndDate,
    roundingStatusFilter,
    socialStatusFilter,
  ]);

  const handleCreateMeeting = (type) => {
    if (type === 'rounding') {
      navigate('/meetings/rounding/create');
    } else {
      navigate('/meetings/social/create');
    }
  };

  const handleMeetingClick = (meeting) => {
    if (meeting.meeting_type === 'ROUND') {
      navigate(`/meetings/rounding/${meeting.id}`);
    } else {
      navigate(`/meetings/social/${meeting.id}`);
    }
  };

  const isPastDateTime = (value) => {
    if (!value) return false;
    try {
      return new Date(value).getTime() <= Date.now();
    } catch {
      return false;
    }
  };

  const getStatusBadge = (meeting) => {
    const status = meeting?.status;
    const cancelReason = meeting?.cancel_reason || '';
    const participantCount = meeting?.participant_count || 0;
    const applicationDeadline = meeting?.application_deadline;
    const applicationClosedEarly = meeting?.application_closed_early || false;
    const meetingType = meeting?.meeting_type;
    const isRoundingMeeting = meetingType === 'ROUND';
    const meetingTime = meeting?.meeting_time;
    
    // 최소 인원 미달 체크 - 라운딩과 소셜 구분
    // 라운딩: 1-3명, 소셜: 1명
    const isMinParticipantsNotMet = isRoundingMeeting
      ? participantCount >= 1 && participantCount <= 3
      : participantCount === 1;
    
    // 마감 기한 지났는지 체크
    const isDeadlinePassed = applicationDeadline ? isPastDateTime(applicationDeadline) : false;
    
    // 마감 처리 여부: 마감 기한이 지났거나 조기 마감 처리됨
    const isApplicationClosed = isDeadlinePassed || applicationClosedEarly;

    // 모임 완료 여부 체크
    const isMeetingTimePassed = meetingTime ? isPastDateTime(meetingTime) : false;
    const isMeetingCompleted = 
      meeting?.is_completed === true || 
      meeting?.status === 'COMPLETED' || 
      isMeetingTimePassed;

    // 취소 상태 판단 (상세 페이지와 동일한 로직)
    const isCanceled = 
      status === 'CANCELED' ||
      (status === 'SCHEDULED' && isApplicationClosed && isMinParticipantsNotMet);

    // 취소 상태는 취소 배지만 표시 (모집마감 배지 표시 안 함)
    if (isCanceled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          취소
        </span>
      );
    }

    // 종료 상태는 단일 배지만 표시
    if (meeting?.settlement_confirmed === true) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          종료
        </span>
      );
    }

    // 라운딩 모임에서 meeting_time이 지났는데 rounding_completed_at이 없는 경우 "미진행" 배지 표시
    if (isRoundingMeeting && isMeetingTimePassed && !meeting?.rounding_completed_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          미진행
        </span>
      );
    }

    // 진행중, 완료 상태는 단일 배지만 표시
    if (status === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          진행중
        </span>
      );
    }

    if (meeting?.settlement_confirmed === false && meeting?.teams?.length > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          완료
        </span>
      );
    }

    // 모집마감 상태 판단
    const isApplicationClosedStatus = status === 'SCHEDULED' && isApplicationClosed && !isMinParticipantsNotMet;

    // 모집마감 또는 예정 상태에서 모집마감/모임완료 배지 표시
    // 취소 상태가 아닐 때만 모집마감 배지 표시
    return (
      <>
        {isApplicationClosedStatus && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            모집마감
          </span>
        )}
        {isMeetingCompleted && !isCanceled && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            모임완료
          </span>
        )}
        {!isApplicationClosedStatus && !isMeetingCompleted && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            예정
          </span>
        )}
      </>
    );
  };

  const getMeetingTypeBadge = (type) => {
    const typeConfig = {
      ROUND: { text: '라운딩', className: 'bg-blue-100 text-blue-800' },
      SOCIAL: { text: '소셜', className: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || typeConfig.ROUND;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const formatMeetingTime = (meetingTime) => {
    try {
      if (!meetingTime) return meetingTime;
      // 백엔드에서 한국 시간으로 저장되어 있으므로 그대로 사용
      const date = new Date(meetingTime);
      if (Number.isNaN(date.getTime())) {
        console.warn('formatMeetingTime: Invalid date', meetingTime);
        return meetingTime;
      }
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (err) {
      console.error('formatMeetingTime error:', err, meetingTime);
      return meetingTime;
    }
  };

  const formatCost = (cost) => {
    if (!cost) return '미정';
    return `${cost.toLocaleString()}원`;
  };

  // 로딩 중 (인증 상태 확인 중)
  if (isLoading) {
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
        description="모임 목록을 보려면 로그인이 필요합니다."
      />
    );
  }

  // 데이터 로딩 중
  if (loading) {
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

  if (error === 'AUTH_REQUIRED') {
    return (
      <LoginRequired 
        message="로그인 후 이용가능합니다"
        description="모임 목록을 보려면 로그인이 필요합니다."
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="container-main py-4 sm:py-6">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">오류가 발생했습니다</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 상태 필터 적용 (fetchRoundingMeetings에서 이미 필터링되었으므로 그대로 반환)
  const getFilteredMeetings = () => {
    const meetings = activeTab === 'rounding' ? roundingMeetings : socialMeetings;
    // fetchRoundingMeetings와 fetchSocialMeetings에서 이미 필터링하고 페이지네이션까지 완료했으므로
    // 여기서는 그대로 반환
    return meetings;
  };

  const currentMeetings = getFilteredMeetings();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-main py-4 sm:py-6">
        {/* 클럽이 없을 때는 안내 페이지만 표시 */}
        {!hasClubs ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-neutral-400 mb-3 sm:mb-4">
              <FaUsers className="mx-auto h-12 w-12 sm:h-16 sm:w-16" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 sm:mb-3">소속된 클럽이 없습니다.</h3>
            <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
              모임을 개설하거나 참여하려면,<br />
              먼저 클럽을 개설하거나, 클럽에 가입해 주세요.
            </p>
            <button
              onClick={() => navigate('/clubs')}
              className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors"
            >
              클럽 가입하기
            </button>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">모임 목록</h1>
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleCreateMeeting('rounding')}
                    className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FaPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>라운딩 생성</span>
                  </button>
                  <button
                    onClick={() => handleCreateMeeting('social')}
                    className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">소셜 이벤트 생성</span>
                    <span className="sm:hidden">소셜 생성</span>
                  </button>
                </div>
              </div>

              {/* 탭 메뉴 */}
              <div className="border-b border-neutral-200 mb-4 sm:mb-6">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => handleTabChange('rounding')}
                    className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === 'rounding'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    라운딩 모임
                  </button>
                  <button
                    onClick={() => handleTabChange('social')}
                    className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === 'social'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    소셜 모임
                  </button>
                </nav>
              </div>

              {/* 필터 영역 */}
              <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* 날짜 필터 */}
                  <div className="flex gap-1.5 sm:gap-2 items-center">
                    <input
                      type="date"
                      value={activeTab === 'rounding' ? roundingStartDate : socialStartDate}
                      onChange={(e) => {
                        if (activeTab === 'rounding') {
                          setRoundingStartDate(e.target.value);
                          setRoundingPage(1);
                        } else {
                          setSocialStartDate(e.target.value);
                          setSocialPage(1);
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <span className="text-xs sm:text-sm text-neutral-500">~</span>
                    <input
                      type="date"
                      value={activeTab === 'rounding' ? roundingEndDate : socialEndDate}
                      onChange={(e) => {
                        if (activeTab === 'rounding') {
                          setRoundingEndDate(e.target.value);
                          setRoundingPage(1);
                        } else {
                          setSocialEndDate(e.target.value);
                          setSocialPage(1);
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {((activeTab === 'rounding' && (roundingStartDate || roundingEndDate)) ||
                      (activeTab === 'social' && (socialStartDate || socialEndDate))) && (
                      <button
                        onClick={() => {
                          if (activeTab === 'rounding') {
                            setRoundingStartDate('');
                            setRoundingEndDate('');
                            setRoundingPage(1);
                          } else {
                            setSocialStartDate('');
                            setSocialEndDate('');
                            setSocialPage(1);
                          }
                        }}
                        className="px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 transition-colors whitespace-nowrap"
                      >
                        초기화
                      </button>
                    )}
                  </div>

                  {/* 검색 입력 및 버튼 */}
                  <div className="flex gap-1.5 sm:gap-2">
                    <div className="flex-1 relative">
                      <FaSearch className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <input
                        type="text"
                        placeholder="모임명으로 검색..."
                        value={activeTab === 'rounding' ? roundingSearchInput : socialSearchInput}
                        onChange={(e) => {
                          if (activeTab === 'rounding') {
                            setRoundingSearchInput(e.target.value);
                          } else {
                            setSocialSearchInput(e.target.value);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                        className="w-full pl-8 sm:pl-10 pr-2.5 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      className="px-3 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium whitespace-nowrap"
                    >
                      검색
                    </button>
                  </div>
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="mb-4 sm:mb-6 flex items-center gap-2 sm:gap-4 flex-wrap">
                <button
                  onClick={() => {
                    if (activeTab === 'rounding') {
                      setRoundingStatusFilter('active');
                      setRoundingPage(1); // 페이지 리셋
                    } else {
                      setSocialStatusFilter('active');
                      setSocialPage(1); // 페이지 리셋
                    }
                  }}
                  className={`px-3 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
                    (activeTab === 'rounding' ? roundingStatusFilter : socialStatusFilter) === 'active'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  진행
                </button>
                <span className="text-xs sm:text-sm text-neutral-400">|</span>
                <button
                  onClick={() => {
                    if (activeTab === 'rounding') {
                      setRoundingStatusFilter('completed');
                      setRoundingPage(1); // 페이지 리셋
                    } else {
                      setSocialStatusFilter('completed');
                      setSocialPage(1); // 페이지 리셋
                    }
                  }}
                  className={`px-3 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors ${
                    (activeTab === 'rounding' ? roundingStatusFilter : socialStatusFilter) === 'completed'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  완료/취소
                </button>
              </div>
            </div>

            {/* 모임 목록 */}
            {currentMeetings.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-neutral-400 mb-3 sm:mb-4">
              <FaCalendarAlt className="mx-auto h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            {hasActiveFilters() ? (
              <>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">
                  조건에 해당하는 {activeTab === 'rounding' ? '라운딩' : '소셜'} 모임이 없습니다
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">
                  검색 조건을 변경해보세요.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">
                  {(() => {
                    const statusFilter = activeTab === 'rounding' ? roundingStatusFilter : socialStatusFilter;
                    const meetingType = activeTab === 'rounding' ? '라운딩' : '소셜';
                    if (statusFilter === 'completed') {
                      return `완료/취소된 ${meetingType} 모임이 없습니다`;
                    } else {
                      return `진행 중인 ${meetingType} 모임이 없습니다`;
                    }
                  })()}
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">
                  {(() => {
                    const statusFilter = activeTab === 'rounding' ? roundingStatusFilter : socialStatusFilter;
                    if (statusFilter === 'completed') {
                      return '완료되거나 취소된 모임이 없습니다.';
                    } else {
                      return '현재 진행 중이거나 진행 예정인 모임이 없습니다.';
                    }
                  })()}
                </p>
                {(() => {
                  const statusFilter = activeTab === 'rounding' ? roundingStatusFilter : socialStatusFilter;
                  // 완료/취소 탭에서는 생성 버튼을 표시하지 않음
                  if (statusFilter === 'completed') {
                    return null;
                  }
                  return (
                <button
                  onClick={() => handleCreateMeeting(activeTab)}
                  className={`${
                    activeTab === 'rounding' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                      } text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg transition-colors`}
                >
                  {activeTab === 'rounding' ? '라운딩' : '소셜'} 모임 생성하기
                </button>
                  );
                })()}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {currentMeetings.map((meeting) => (
              <div 
                key={meeting.id} 
                className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleMeetingClick(meeting)}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-1 mb-0.5 sm:mb-1">
                        {meeting.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-500 line-clamp-1">{meeting.club_name}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4 flex-shrink-0">
                      {getMeetingTypeBadge(meeting.meeting_type)}
                      {getStatusBadge(meeting)}
                    </div>
                  </div>

                  {meeting.description && (
                    <p className="text-neutral-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                      {meeting.description}
                    </p>
                  )}

                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                      <FaCalendarAlt className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      <span className="line-clamp-1">{formatMeetingTime(meeting.meeting_time)}</span>
                    </div>
                    
                    {meeting.location && (
                      <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                        <FaMapMarkerAlt className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">{meeting.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                      <FaUsers className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                      {meeting.participant_count}/{meeting.max_participants}명
                    </div>
                    {meeting.application_deadline && (
                      <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                        <FaClock className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">참가 신청 마감: {formatMeetingTime(meeting.application_deadline)}</span>
                      </div>
                    )}
                  </div>

                  {meeting.meeting_type === 'ROUND' && (
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {meeting.course_name && (
                        <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                          <span className="mr-1.5 sm:mr-2">🏌️</span>
                          <span className="line-clamp-1">{meeting.course_name}</span>
                        </div>
                      )}
                      
                      {meeting.total_cost && (
                        <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                          <FaDollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          총 비용: {formatCost(meeting.total_cost)}
                        </div>
                      )}
                    </div>
                  )}

                  {meeting.meeting_type === 'SOCIAL' && (
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      {meeting.social_cost && (
                        <div className="flex items-center text-xs sm:text-sm text-neutral-500">
                          <FaDollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          참가 비용(원): {formatCost(meeting.social_cost)}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      {new Date(meeting.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    <span className="text-primary-600 font-medium text-xs sm:text-sm">
                      자세히 보기 →
                    </span>
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {(() => {
              const currentPage = activeTab === 'rounding' ? roundingPage : socialPage;
              const totalPages = activeTab === 'rounding' ? roundingTotalPages : socialTotalPages;
              
              // totalPages가 0이면 표시하지 않음 (데이터가 없는 경우)
              if (totalPages <= 0) return null;

              return (
                <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1 sm:gap-2">
                  <button
                    onClick={() => {
                      if (activeTab === 'rounding') {
                        setRoundingPage(Math.max(1, roundingPage - 1));
                      } else {
                        setSocialPage(Math.max(1, socialPage - 1));
                      }
                    }}
                    disabled={currentPage === 1}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    이전
                  </button>
                  
                  <div className="flex gap-0.5 sm:gap-1">
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
                              
                              if (activeTab === 'rounding') {
                                setRoundingPage(pageNum);
                              } else {
                                setSocialPage(pageNum);
                              }
                            }}
                            disabled={!isValidPage}
                            className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                              !isValidPage
                                ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
                                : currentPage === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  
                  <button
                    onClick={() => {
                      if (activeTab === 'rounding') {
                        setRoundingPage(Math.min(roundingTotalPages, roundingPage + 1));
                      } else {
                        setSocialPage(Math.min(socialTotalPages, socialPage + 1));
                      }
                    }}
                    disabled={currentPage === totalPages}
                    className={`px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    다음
                  </button>
                </div>
              );
            })()}
          </>
            )}
          </>
        )}
      </div>

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

export default MeetingListPage;
