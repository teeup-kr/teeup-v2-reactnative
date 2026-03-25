import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  createCloseScoreEntryHandler,
  createGrossScoreChangeHandler,
  createResetScoreEntryHandler,
  createScoreSubmitHandler,
  createScoreValidationHandler,
} from '@/lib/handler/mypage';
import { getGrossScoreHandicap } from '@/lib/util/mypageUtils';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import { roundsApi } from '../../lib/api/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

export function BaseSimpleScoreInputModal({
  visible,
  onClose,
  meetingId,
  participantId,
  currentHandicap,
  onSuccess,
  shouldCompleteRounding = false,
  submitSimpleScore,
  updateSimpleScore,
  completeRounding,
  validateParticipantOnSubmit = true,
  resetOnVisible = true,
  disableSubmitWhenEmpty = false,
  submitButtonText = '저장하기',
  previewHint = '라운딩 스코어 - 72로 계산됩니다.',
  formatCurrentHandicap = (value) => Number(value).toFixed(1),
  /** 기록 수정 시 기존 그로스 (미전달 시 초기화 동작은 유지) */
  initialGrossScore,
}) {
  const [grossScore, setGrossScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const newHandicap = useMemo(() => getGrossScoreHandicap(grossScore), [grossScore]);
  const resetLocal = useMemo(
    () => createResetScoreEntryHandler({ setGrossScore, setIsSubmitting, setErrors }),
    [setGrossScore, setIsSubmitting, setErrors]
  );
  const validate = useMemo(
    () => createScoreValidationHandler({ grossScore, setErrors }),
    [grossScore, setErrors]
  );
  const handleSubmit = useMemo(
    () => {
      const submit = createScoreSubmitHandler({
        validate,
        shouldCompleteRounding,
        meetingId,
        participantId,
        grossScore,
        submitSimpleScore,
        updateSimpleScore,
        completeRounding,
        onSuccess,
        onClose,
        resetLocal,
        setIsSubmitting,
        setErrors,
      });

      return () => {
        if (validateParticipantOnSubmit && (!meetingId || !participantId)) {
          setErrors({ submit: '참가자 정보를 찾을 수 없습니다.' });
          return;
        }
        submit();
      };
    },
    [
      validate,
      shouldCompleteRounding,
      meetingId,
      participantId,
      grossScore,
      submitSimpleScore,
      updateSimpleScore,
      completeRounding,
      onSuccess,
      onClose,
      resetLocal,
      validateParticipantOnSubmit,
      setIsSubmitting,
      setErrors,
    ]
  );
  const closeAndReset = useMemo(
    () => createCloseScoreEntryHandler({ isSubmitting, onClose, resetLocal }),
    [isSubmitting, onClose, resetLocal]
  );
  const handleGrossScoreChange = useMemo(
    () => createGrossScoreChangeHandler({ setGrossScore }),
    [setGrossScore]
  );

  useEffect(() => {
    if (!resetOnVisible || !visible) return;
    resetLocal();
  }, [visible, resetLocal, resetOnVisible]);

  useEffect(() => {
    if (!visible) return;
    const raw = initialGrossScore;
    if (raw != null && String(raw).trim() !== '') {
      setGrossScore(String(raw));
      return;
    }
    if (raw === undefined) return;
    setGrossScore('');
  }, [visible, initialGrossScore]);

  return (
    <Modal
      visible={visible}
      title="점수 입력"
      onClose={closeAndReset}
      footer={(
        <View style={styles.footerRow}>
          <Button
            variant="outline"
            size="sm"
            style={styles.footerButton}
            onPress={closeAndReset}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            style={styles.footerButton}
            onPress={handleSubmit}
            disabled={isSubmitting || (disableSubmitWhenEmpty && !grossScore)}
            loading={isSubmitting}
          >
            {submitButtonText}
          </Button>
        </View>
      )}
    >
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>현재 핸디캡</Text>
        <Text style={styles.sectionValue}>
          {currentHandicap !== null && currentHandicap !== undefined && currentHandicap !== ''
            ? formatCurrentHandicap(currentHandicap)
            : '-'}
        </Text>
      </View>

      <Input
        label="라운딩 스코어"
        value={grossScore}
        onChangeText={handleGrossScoreChange}
        placeholder="55~144 사이의 숫자 입력"
        keyboardType="number-pad"
        required
      />

      {!!errors.grossScore && <Text style={styles.errorText}>{errors.grossScore}</Text>}

      {newHandicap !== null && (
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>이번 라운딩 핸디캡 (예상)</Text>
          <Text style={styles.previewValue}>{newHandicap}</Text>
          <Text style={styles.previewHint}>{previewHint}</Text>
        </View>
      )}

      {!!errors.submit && <Text style={styles.errorText}>{errors.submit}</Text>}
    </Modal>
  );
}

export default function SimpleScoreInputModal(props) {
  return (
    <BaseSimpleScoreInputModal
      {...props}
      submitSimpleScore={roundsApi.submitSimpleScore}
      updateSimpleScore={roundsApi.updateSimpleScore}
      completeRounding={roundsApi.completeRounding}
    />
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  sectionLabel: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    marginBottom: tokens.spacing.xs,
  },
  sectionValue: {
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  previewCard: {
    backgroundColor: colors.primary[50],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
    borderWidth: 1,
    borderColor: colors.primary[100],
    marginTop: tokens.spacing.xxs,
  },
  previewLabel: {
    fontSize: tokens.font.sm,
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  previewValue: {
    marginTop: tokens.spacing.xxs,
    fontSize: tokens.font.xl,
    fontWeight: tokens.fontWeight.bold,
    color: colors.primary[800],
  },
  previewHint: {
    marginTop: tokens.spacing.xs,
    fontSize: tokens.font.xs,
    color: colors.primary[600],
  },
  errorText: {
    marginTop: tokens.spacing.xs2,
    fontSize: tokens.font.sm,
    color: colors.error[600],
  },
});
