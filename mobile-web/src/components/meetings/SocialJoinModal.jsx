import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FaTimes, FaUserEdit } from 'react-icons/fa';

const formatDatetime = (value) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      console.warn('formatDatetime: Invalid date', value);
      return value;
    }
    return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  } catch (err) {
    console.error('formatDatetime error:', err, value);
    return value;
  }
};

const SocialJoinModal = ({
  isOpen,
  onClose,
  meeting,
  userInfo,
  setUserInfo,
  userInfoLoading,
  isEditingUserInfo,
  onEditUserInfo,
  onUpdateUserInfo,
  onJoin,
  processingAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 sm:px-4">
      <div className="w-full max-w-3xl max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-8rem)] rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900">소셜 모임 참가 신청</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 transition-colors hover:text-neutral-600"
          >
            <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 flex-1">
          <section className="rounded-xl border border-primary-100 bg-primary-50 p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-primary-700">모임 정보</h4>
            <div className="mt-2 sm:mt-3 grid gap-2 sm:gap-3 text-xs sm:text-sm text-primary-800 md:grid-cols-2">
              <div>
                <p className="text-xs text-primary-500">클럽</p>
                <p className="font-semibold">{meeting.club_name}</p>
              </div>
              <div>
                <p className="text-xs text-primary-500">모임명</p>
                <p className="font-semibold">{meeting.name}</p>
              </div>
              <div>
                <p className="text-xs text-primary-500">일시</p>
                <p className="font-semibold">{formatDatetime(meeting.meeting_time)}</p>
              </div>
              <div>
                <p className="text-xs text-primary-500">장소</p>
                <p className="font-semibold">{meeting.location || meeting.venue_name}</p>
              </div>
            </div>
          </section>

          <section className="mt-4 sm:mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
            <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <FaUserEdit className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
                <h4 className="text-xs sm:text-sm font-semibold text-neutral-900">내 참가 정보</h4>
              </div>
              {isEditingUserInfo ? (
                <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onEditUserInfo(false);
                    }}
                    className="flex-1 sm:flex-none rounded-lg border border-neutral-300 px-2.5 py-1 sm:px-3 text-xs font-semibold text-neutral-500 transition-colors hover:bg-white"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={onUpdateUserInfo}
                    disabled={processingAction}
                    className="flex-1 sm:flex-none rounded-lg bg-primary-600 px-2.5 py-1 sm:px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onEditUserInfo(true);
                  }}
                  className="w-full sm:w-auto rounded-lg border border-primary-500 px-2.5 py-1 sm:px-3 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50"
                >
                  정보 수정
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-neutral-500">
                  실명
                </label>
                {isEditingUserInfo ? (
                  <input
                    type="text"
                    value={userInfo.realname}
                    onChange={(e) =>
                      setUserInfo((prev) => ({ ...prev, realname: e.target.value }))
                    }
                    className="w-full rounded-lg border border-neutral-300 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="실명을 입력하세요"
                  />
                ) : (
                  <div className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-neutral-800">
                    {userInfoLoading ? '불러오는 중...' : userInfo.realname || '미등록'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 sm:mb-2 block text-xs font-semibold text-neutral-500">
                  전화번호
                </label>
                {isEditingUserInfo ? (
                  <input
                    type="tel"
                    value={userInfo.phone_number}
                    onChange={(e) =>
                      setUserInfo((prev) => ({
                        ...prev,
                        phone_number: e.target.value.replace(/[^0-9]/g, ''),
                      }))
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="01012345678"
                  />
                ) : (
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">
                    {userInfoLoading
                      ? '불러오는 중...'
                      : userInfo.phone_number || '미등록'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-neutral-500">
                  생년월일
                </label>
                {isEditingUserInfo ? (
                  <input
                    type="date"
                    value={userInfo.birthdate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) =>
                      setUserInfo((prev) => ({ ...prev, birthdate: e.target.value }))
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">
                    {userInfoLoading
                      ? '불러오는 중...'
                      : userInfo.birthdate || '미등록'}
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-neutral-500">
                  성별
                </label>
                <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">
                  {userInfo.gender === 'MALE'
                    ? '남성'
                    : userInfo.gender === 'FEMALE'
                    ? '여성'
                    : '미등록'}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-700">참가 전 확인하세요</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-700">
              <li>클럽 멤버만 참가할 수 있으며 참가 신청 후 승인이 필요할 수 있습니다.</li>
              <li>신청 마감 이후에는 참가자 변경이 제한될 수 있습니다.</li>
              <li>정확한 연락처 정보를 제공해 주셔야 매니저가 연락드릴 수 있습니다.</li>
            </ul>
          </section>
        </div>
        <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onJoin}
            disabled={processingAction || isEditingUserInfo}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            참가 신청
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialJoinModal;

