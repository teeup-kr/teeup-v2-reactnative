import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clubsApi } from '../../lib';
import { FaUsers, FaCrown, FaUserShield, FaUser, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ClubMembersTab = ({ club, canManage = false }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 5;

  // 멤버 목록 조회 (페이지네이션 적용)
  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError
  } = useQuery({
    queryKey: ['club-members', club.id, currentPage],
    queryFn: () => clubsApi.getClubMembers(club.id, { page: currentPage, limit }),
    enabled: !!club.id,
  });

  const members = membersData?.data || [];
  const totalPages = membersData?.total_pages || 1;

  const getRoleBadge = (role) => {
    const roleConfig = {
      LEADER: { text: '리더', className: 'bg-purple-100 text-purple-800', icon: FaCrown },
      MANAGER: { text: '매니저', className: 'bg-blue-100 text-blue-800', icon: FaUserShield },
      MEMBER: { text: '일반회원', className: 'bg-gray-100 text-gray-800', icon: FaUser }
    };

    const config = roleConfig[role] || roleConfig.MEMBER;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      ACTIVE: { text: '승인됨', className: 'bg-green-100 text-green-800' },
      APPROVED: { text: '승인됨', className: 'bg-green-100 text-green-800' },
      PENDING: { text: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      REJECTED: { text: '거부됨', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (membersLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (membersError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-error-600 mb-4">
            <FaUsers className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">멤버를 불러올 수 없습니다</h3>
          <p className="text-neutral-600">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">클럽 멤버</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-neutral-500">
            총 {membersData?.total || 0}명
          </div>
          {canManage && (
            <button
              onClick={() => navigate(`/clubs/${club.display_id || club.id}/members`)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <FaUsers className="h-4 w-4" />
              <span>멤버 관리하기</span>
            </button>
          )}
        </div>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <FaUsers className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">멤버가 없습니다</h3>
          <p className="text-neutral-600">아직 가입한 멤버가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center shadow-md">
                      <FaUser className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-neutral-900">{member.user_name}</h4>
                      <p className="text-sm text-neutral-500">{member.user_email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getRoleBadge(member.role)}
                    {getStatusBadge(member.status)}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <div className="flex items-center space-x-4">
                      <span>가입일: {new Date(member.joined_at).toLocaleDateString('ko-KR')}</span>
                      {member.last_activity && (
                        <span>최근 활동: {new Date(member.last_activity).toLocaleDateString('ko-KR')}</span>
                      )}
                    </div>
                    {member.user_phone_number && (
                      <span className="text-neutral-400">{member.user_phone_number}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 (항상 표시) */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg border ${
                currentPage === 1
                  ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center space-x-1">
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
                      className={`px-3 py-2 rounded-lg border ${
                        !isValidPage
                          ? 'border-neutral-200 text-neutral-300 cursor-not-allowed'
                          : currentPage === pageNum
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg border ${
                currentPage === totalPages
                  ? 'border-neutral-300 text-neutral-400 cursor-not-allowed'
                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ClubMembersTab;
