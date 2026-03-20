import { mypageApi } from '@/lib/api/api';
import { asNumber } from '@/lib/util/mypageUtils';

import { BaseSimpleScoreInputModal } from '../meetings/SimpleScoreInputModal';

export default function SimpleScoreInputModal({
  visible,
  onClose,
  meetingId,
  participantId,
  currentHandicap,
  onSuccess,
  shouldCompleteRounding = false,
}) {
  return (
    <BaseSimpleScoreInputModal
      visible={visible}
      onClose={onClose}
      meetingId={meetingId}
      participantId={participantId}
      currentHandicap={currentHandicap}
      onSuccess={onSuccess}
      shouldCompleteRounding={shouldCompleteRounding}
      submitSimpleScore={mypageApi.submitSimpleScore}
      completeRounding={mypageApi.completeRounding}
      validateParticipantOnSubmit={false}
      resetOnVisible={false}
      disableSubmitWhenEmpty
      submitButtonText={shouldCompleteRounding ? '라운딩 종료 후 저장' : '저장'}
      previewHint={'라운딩 스코어 - 72 = 새로운 핸디캡\n(최근 5경기 평균으로 재계산됩니다)'}
      formatCurrentHandicap={(value) => asNumber(value, 0).toFixed(1)}
    />
  );
}
