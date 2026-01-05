import React from 'react';
import { FaTimes, FaCheck, FaRedo, FaHistory } from 'react-icons/fa';

const TeamFormationPreviewModal = ({
  isOpen,
  onClose,
  teams,
  formationMode,
  teamSize,
  onConfirm,
  onReform,
  onSaveHistory,
  processing
}) => {
  if (!isOpen || !teams || teams.length === 0) return null;

  // 편성 모드 라벨
  const formationModeLabels = {
    'GENDER_SEPARATED_HANDICAP': '성별 분리 + 핸디캡 기준',
    'GENDER_SEPARATED_PREVIOUS_RECORD': '성별 분리 + 직전대회 성적 기준',
    'GENDER_SEPARATED_RANDOM': '성별 분리 + 랜덤',
    'GENDER_MIXED_HANDICAP': '성별 혼합 + 핸디캡 기준',
    'GENDER_MIXED_PREVIOUS_RECORD': '성별 혼합 + 직전대회 성적 기준',
    'GENDER_MIXED_RANDOM': '성별 혼합 + 랜덤'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-3 sm:p-4 pb-2 sm:pb-3 border-b border-neutral-200 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2 sm:pr-4">
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
              팀 편성 결과 미리보기
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 sm:mt-1 line-clamp-1">
              편성 모드: {formationModeLabels[formationMode] || formationMode} | 팀 크기: {teamSize}명
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 p-1 sm:p-2 flex-shrink-0"
            disabled={processing}
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 팀 목록 - 스크롤 가능 영역 */}
        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="space-y-3 sm:space-y-4">
          {teams.map((team, index) => {
            // members 정보가 있는지 확인 (API 응답 구조에 따라 다를 수 있음)
            const members = team.members || team.team_members || [];
            
            // 총 핸디캡 계산 (team.total_handicap 또는 members의 handicap_index 합계)
            const totalHandicap = team.total_handicap 
              ? parseFloat(team.total_handicap)
              : members.reduce((sum, member) => {
                  const handicap = member.handicap_index || member.handicap || 0;
                  return sum + (typeof handicap === 'number' ? handicap : parseFloat(handicap) || 0);
                }, 0);
            
            return (
              <div key={team.id || index} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
                <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-1">
                    {team.name || `팀 ${index + 1}`}
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-neutral-500">
                      {members.length || team.member_count || 0}명
                    </span>
                    {totalHandicap > 0 && (
                      <span className="text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">
                        총 핸디캡: {totalHandicap.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                {members.length > 0 ? (
                  <div className="grid gap-2 sm:gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {members.map((member, memberIndex) => {
                      // 게스트 여부 확인
                      const isGuest = member.is_guest === true;
                      
                      // 멤버 정보 추출 (API 응답 구조에 따라 다를 수 있음)
                      const userName = isGuest 
                        ? (member.guest_name || member.user_name || member.name || '이름 없음')
                        : (member.user_name || member.name || '이름 없음');
                      const userNickname = member.user_nickname || member.nickname || '';
                      
                      // 성별 표시 - 다양한 형식 처리
                      const getGenderText = (gender) => {
                        if (!gender) return null;
                        // Enum 객체인 경우 .value 속성 확인
                        let genderStr = gender;
                        if (typeof gender === 'object' && gender.value) {
                          genderStr = gender.value;
                        }
                        const genderUpper = String(genderStr).toUpperCase().trim();
                        if (genderUpper === 'MALE' || genderUpper === '남' || genderUpper === '남성') {
                          return '남';
                        }
                        if (genderUpper === 'FEMALE' || genderUpper === '여' || genderUpper === '여성') {
                          return '여';
                        }
                        return null;
                      };
                      
                      // 성별 정보 추출 - 게스트인 경우 guest_gender를 우선 확인 (TeamEditorModal과 동일한 로직)
                      const genderValue = isGuest 
                        ? (member.guest_gender || member.gender)
                        : (member.gender || member.guest_gender || member.user_gender || member.gender_value);
                      
                      const genderText = getGenderText(genderValue);
                      
                      // 핸디캡: null/undefined가 아니면 표시 (0도 표시)
                      const handicapText = (member.handicap_index !== null && member.handicap_index !== undefined)
                        ? `핸디: ${member.handicap_index}` 
                        : '';
                      
                      // 직전대회성적: null/undefined가 아니면 표시 (0도 표시)
                      const scoreText = (member.recent_avg_score !== null && member.recent_avg_score !== undefined)
                        ? `직전대회: ${member.recent_avg_score}타`
                        : '';
                      
                      return (
                        <div
                          key={member.id || member.user_id || memberIndex}
                          className="rounded-lg border border-neutral-200 bg-white p-2.5 sm:p-3"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white flex-shrink-0">
                              <span className="text-xs sm:text-sm font-semibold">
                                {userName.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <p className="text-xs sm:text-sm font-semibold text-neutral-900 truncate">
                                  {userName}
                                </p>
                                {genderText && (
                                  <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap flex-shrink-0">
                                    {genderText}
                                  </span>
                                )}
                              </div>
                              {userNickname && userName !== userNickname && (
                                <p className="text-[10px] sm:text-xs text-neutral-500 truncate mt-0.5">
                                  {userNickname}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-neutral-600">
                            {handicapText && (
                              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-green-50 text-green-700">
                                {handicapText}
                              </span>
                            )}
                            {scoreText && (
                              <span className="px-1.5 sm:px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                {scoreText}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-neutral-500 py-3 sm:py-4 text-center">
                    팀 멤버 정보를 불러올 수 없습니다.
                  </p>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* 하단 버튼 - 고정 */}
        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 p-3 sm:p-4 border-t border-neutral-200 bg-white rounded-b-xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 font-medium"
            disabled={processing}
          >
            취소
          </button>
          {onSaveHistory && (
            <button
              type="button"
              onClick={onSaveHistory}
              className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 font-medium"
              disabled={processing}
            >
              <FaHistory className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">히스토리에 저장</span>
              <span className="sm:hidden">저장</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReform}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 font-medium"
            disabled={processing}
          >
            <FaRedo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">다시 편성하기</span>
            <span className="sm:hidden">다시 편성</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 font-medium"
            disabled={processing}
          >
            <FaCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {processing ? '처리 중...' : <><span className="hidden sm:inline">편성 확정</span><span className="sm:hidden">확정</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamFormationPreviewModal;
