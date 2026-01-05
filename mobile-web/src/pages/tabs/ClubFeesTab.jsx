import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clubsApi } from '../../lib';
import { FaMoneyBillWave, FaCalendarAlt } from 'react-icons/fa';

const ClubFeesTab = ({ club, canManage = false }) => {
  const navigate = useNavigate();

  // 정기 회비 조회
  const {
    data: feeData,
    isLoading: feesLoading,
    error: feesError
  } = useQuery({
    queryKey: ['club-regular-fee', club.id],
    queryFn: () => clubsApi.getRegularFee(club.id),
    enabled: !!club.id,
  });

  // 회비 항목 목록 조회
  const {
    data: feeItemsRaw,
    isLoading: feeItemsLoading,
    error: feeItemsError
  } = useQuery({
    queryKey: ['club-fees', club.id],
    queryFn: async () => {
      const data = await clubsApi.getClubFees(club.id);
      // 배열이 아닌 경우 빈 배열로 변환
      return Array.isArray(data) ? data : (data ? [data] : []);
    },
    enabled: !!club.id,
  });

  // feeItems를 항상 배열로 보장
  const feeItems = Array.isArray(feeItemsRaw) ? feeItemsRaw : (feeItemsRaw ? [feeItemsRaw] : []);

  // 주기 텍스트 변환 함수
  const getCycleText = (cycle) => {
    if (!cycle) return '-';
    switch (cycle) {
      case 'MONTHLY': return '매월';
      case 'QUARTERLY': return '분기별';
      case 'YEARLY': return '연간';
      case 'ONE_TIME': return '일회성';
      default: return cycle;
    }
  };

  // 회비 관리 페이지로 이동
  const handleManageFees = () => {
    const clubId = club?.display_id || club?.id;
    navigate(`/clubs/${clubId}/fees`);
  };

  if (feesLoading || feeItemsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (feesError || feeItemsError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-error-600 mb-4">
            <FaMoneyBillWave className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">회비를 불러올 수 없습니다</h3>
          <p className="text-neutral-600">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">회비 관리</h3>
        {canManage && (
          <button
            onClick={handleManageFees}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <span>회비 관리</span>
          </button>
        )}
      </div>

      {!feeData?.has_regular_fee ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <FaMoneyBillWave className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">정기 회비가 설정되지 않았습니다</h3>
          <p className="text-neutral-600 mb-4">클럽의 정기 회비를 설정하세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-neutral-900 mb-2">정기 회비</h4>
                {feeData.regular_fee_description && (
                  <p className="text-neutral-600 text-sm mb-3">{feeData.regular_fee_description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  활성
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="flex items-center space-x-3">
                <FaMoneyBillWave className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-500">회비 금액</p>
                  <p className="text-xl font-semibold text-neutral-900">
                    {feeData.regular_fee_amount?.toLocaleString() || 0}원
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FaCalendarAlt className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-500">납부 주기</p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {feeData.regular_fee_cycle === 'MONTHLY' ? '매월' :
                     feeData.regular_fee_cycle === 'QUARTERLY' ? '분기별' :
                     feeData.regular_fee_cycle === 'YEARLY' ? '연간' : feeData.regular_fee_cycle || '-'}
                  </p>
                </div>
              </div>
            </div>
            
            {feeData.updated_at && (
              <div className="pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-500">
                  설정일: {new Date(feeData.updated_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 회비 항목 섹션 */}
      {feeItems && feeItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">회비 항목</h3>
          <div className="space-y-4">
            {feeItems.map((feeItem) => (
              <div key={feeItem.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-neutral-900">{feeItem.name}</h4>
                      {feeItem.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          활성
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          비활성
                        </span>
                      )}
                    </div>
                    
                    {feeItem.description && (
                      <p className="text-neutral-600 text-sm mb-3">{feeItem.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                      <div className="flex items-center space-x-3">
                        <FaMoneyBillWave className="h-4 w-4 text-neutral-400" />
                        <div>
                          <p className="text-xs font-medium text-neutral-500">금액</p>
                          <p className="text-lg font-semibold text-neutral-900">
                            {feeItem.amount?.toLocaleString() || 0}원
                          </p>
                        </div>
                      </div>
                      {feeItem.cycle && (
                        <div className="flex items-center space-x-3">
                          <FaCalendarAlt className="h-4 w-4 text-neutral-400" />
                          <div>
                            <p className="text-xs font-medium text-neutral-500">주기</p>
                            <p className="text-sm font-semibold text-neutral-900">
                              {getCycleText(feeItem.cycle)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {feeItem.updated_at && (
                      <p className="text-xs text-neutral-500">
                        설정일: {new Date(feeItem.updated_at).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubFeesTab;
