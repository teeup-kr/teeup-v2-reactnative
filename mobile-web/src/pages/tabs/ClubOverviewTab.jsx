import React from 'react';
import { FaMapMarkerAlt, FaUsers, FaPhone, FaCalendarAlt, FaInfoCircle, FaUser, FaMoneyBillWave } from 'react-icons/fa';

const ClubOverviewTab = ({ club, membersData, isEditing = false, editForm = {}, onEditFormChange = () => {} }) => {
  // 디버깅: API 응답 확인
  console.log('🔍 ClubOverviewTab 디버깅:');
  console.log('  - club:', club);
  console.log('  - club.member_count:', club?.member_count);
  console.log('  - club.current_member_count:', club?.current_member_count);
  console.log('  - membersData:', membersData);
  
  const handleFieldChange = (field, value) => {
    onEditFormChange(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* 클럽 기본 정보 */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
            <FaInfoCircle className="mr-2 text-primary-600" />
            클럽 정보
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <FaMapMarkerAlt className="h-5 w-5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">주요 활동 지역</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.location ?? club.location ?? ''}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-neutral-900">{club.location}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FaUser className="h-5 w-5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">대표자명</p>
                {(() => {
                  // 백엔드에서 이미 최신 리더의 실명을 representative_name으로 반환하므로 우선 사용
                  // 백엔드에서 가져온 값이 없을 경우 멤버 목록에서 리더 찾기
                  if (club.representative_name) {
                    return <p className="text-neutral-900">{club.representative_name}</p>;
                  }
                  
                  // 백엔드 값이 없을 경우 멤버 목록에서 리더 찾기
                  const members = Array.isArray(membersData) ? membersData : (membersData?.data || membersData?.members || []);
                  const leader = members.find(m => m.role === 'LEADER' || m.role?.value === 'LEADER');
                  
                  if (leader) {
                    // 실명만 표시 (클럽 등록 시 실명 필수)
                    const realname = leader.user_realname || leader.user_name;
                    if (realname && realname !== 'Unknown') {
                      return <p className="text-neutral-900">{realname}</p>;
                    }
                  }
                  // 리더를 찾지 못했거나 실명이 없으면 기본값 표시
                  return <p className="text-neutral-900">N/A</p>;
                })()}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FaUsers className="h-5 w-5 text-neutral-400" />
              <div>
                <p className="text-sm font-medium text-neutral-500">멤버 수</p>
                <p className="text-neutral-900">{club.current_member_count || club.member_count || 0}명</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FaPhone className="h-5 w-5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">대표 연락처</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.contact_info ?? club.contact_info ?? ''}
                    onChange={(e) => handleFieldChange('contact_info', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-neutral-900">{club.contact_info}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FaCalendarAlt className="h-5 w-5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">생성일</p>
                <p className="text-neutral-900">{new Date(club.created_at).toLocaleDateString('ko-KR')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FaCalendarAlt className="h-5 w-5 text-neutral-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-500">모집 마감시간</p>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={editForm.application_deadline ?? ''}
                    onChange={(e) => handleFieldChange('application_deadline', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-neutral-900">
                    {club.application_deadline 
                      ? new Date(club.application_deadline).toLocaleString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '미설정'}
                  </p>
                )}
              </div>
            </div>
            {club.has_regular_fee && (
              <div className="flex items-center space-x-3">
                <FaMoneyBillWave className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-500">정기 회비</p>
                  <p className="text-neutral-900">
                    {club.regular_fee_amount?.toLocaleString()}원
                    {club.regular_fee_cycle && (
                      <span className="ml-2 text-sm text-neutral-500">
                        ({club.regular_fee_cycle === 'MONTHLY' ? '월간' : club.regular_fee_cycle === 'QUARTERLY' ? '분기' : '연간'})
                      </span>
                    )}
                  </p>
                  {club.regular_fee_description && (
                    <p className="text-xs text-neutral-500 mt-1">{club.regular_fee_description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 클럽 설명 */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">클럽 소개</h3>
          {isEditing ? (
            <textarea
              value={editForm.description ?? club.description ?? ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
            />
          ) : (
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-neutral-700 leading-relaxed">{club.description}</p>
            </div>
          )}
        </div>

        {/* 추가 정보 */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">추가 정보</h3>
          {isEditing ? (
            <textarea
              value={editForm.additional_info ?? club.additional_info ?? ''}
              onChange={(e) => handleFieldChange('additional_info', e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="추가 정보를 입력하세요"
            />
          ) : club.additional_info ? (
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-neutral-700 leading-relaxed">{club.additional_info}</p>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-neutral-500 italic">추가 정보가 없습니다</p>
            </div>
          )}
        </div>

        {/* 클럽 통계 */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">클럽 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">{club.current_member_count || club.member_count || 0}</div>
              <div className="text-sm text-primary-800">총 멤버</div>
            </div>
            <div className="bg-success-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-success-600">0</div>
              <div className="text-sm text-success-800">진행 중인 모임</div>
            </div>
            <div className="bg-warning-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-warning-600">0</div>
              <div className="text-sm text-warning-800">완료된 모임</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubOverviewTab;
