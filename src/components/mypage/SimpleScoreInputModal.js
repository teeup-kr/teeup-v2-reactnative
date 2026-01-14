import { FontAwesome5 } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { completeRounding, submitSimpleScore } from '@/lib/api/mypage';
import {
  createCloseScoreEntryHandler,
  createGrossScoreChangeHandler,
  createResetScoreEntryHandler,
  createScoreSubmitHandler,
  createScoreValidationHandler,
} from '@/lib/render/mypage/records';
import { asNumber, getGrossScoreHandicap } from '@/lib/value/mypageRecords';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function SimpleScoreInputModal({
  visible,
  onClose,
  meetingId,
  participantId,
  currentHandicap,
  onSuccess,
  shouldCompleteRounding = false,
}) {
  const [grossScore, setGrossScore] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const newHandicap = useMemo(
    () => getGrossScoreHandicap(grossScore),
    [grossScore]
  );

  const resetLocal = useMemo(
    () => createResetScoreEntryHandler({ setGrossScore, setIsSubmitting, setErrors }),
    [setGrossScore, setIsSubmitting, setErrors]
  );
  const validate = useMemo(
    () => createScoreValidationHandler({ grossScore, setErrors }),
    [grossScore, setErrors]
  );
  const handleSubmit = useMemo(
    () =>
      createScoreSubmitHandler({
        validate,
        shouldCompleteRounding,
        meetingId,
        participantId,
        grossScore,
        submitSimpleScore,
        completeRounding,
        onSuccess,
        onClose,
        resetLocal,
        setIsSubmitting,
        setErrors,
      }),
    [
      validate,
      shouldCompleteRounding,
      meetingId,
      participantId,
      grossScore,
      onSuccess,
      onClose,
      resetLocal,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeAndReset}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>점수 입력</Text>
            <Pressable
              onPress={closeAndReset}
              style={({ pressed }) => [
                styles.iconBtn,
                pressed && { opacity: 0.7 },
              ]}
              disabled={isSubmitting}
            >
              <FontAwesome5 name="times" size={18} color={colors.neutral[500]} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.handicapBox}>
              <Text style={styles.handicapLabel}>현재 핸디캡</Text>
              <Text style={styles.handicapValue}>
                {currentHandicap !== null &&
                  currentHandicap !== undefined &&
                  currentHandicap !== ''
                  ? asNumber(currentHandicap, 0).toFixed(1)
                  : '-'}
              </Text>
            </View>

            <Text style={styles.fieldLabel}>
              라운딩 스코어 <Text style={{ color: colors.error[600] }}>*</Text>
            </Text>
            <TextInput
              value={grossScore}
              onChangeText={handleGrossScoreChange}
              placeholder="55~144 사이의 숫자 입력"
              keyboardType="number-pad"
              editable={!isSubmitting}
              style={[
                styles.input,
                errors.grossScore ? styles.inputError : styles.inputNormal,
              ]}
            />
            {!!errors.grossScore && (
              <Text style={styles.errorText}>{errors.grossScore}</Text>
            )}

            {newHandicap !== null && (
              <View style={styles.previewBox}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>새로운 핸디캡 (예상)</Text>
                  <Text style={styles.previewValue}>{newHandicap}</Text>
                </View>
                <Text style={styles.previewHint}>
                  라운딩 스코어 - 72 = 새로운 핸디캡{'\n'}(최근 5경기 평균으로
                  재계산됩니다)
                </Text>
              </View>
            )}

            {!!errors.submit && (
              <View style={styles.submitErrorBox}>
                <Text style={styles.submitErrorText}>{errors.submit}</Text>
              </View>
            )}

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={closeAndReset}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnOutline,
                  pressed && { opacity: 0.85 },
                  isSubmitting && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.modalBtnOutlineText}>취소</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting || !grossScore}
                style={({ pressed }) => [
                  styles.modalBtn,
                  styles.modalBtnPrimary,
                  pressed && { opacity: 0.9 },
                  (isSubmitting || !grossScore) && { opacity: 0.5 },
                ]}
              >
                {isSubmitting ? (
                  <View style={styles.inlineRow}>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={styles.modalBtnPrimaryText}>저장 중...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>
                    {shouldCompleteRounding ? '라운딩 종료 후 저장' : '저장'}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: tokens.padding.baseLg,
    justifyContent: 'center',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg2,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  modalTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: colors.neutral[900],
  },
  iconBtn: {
    padding: tokens.padding.xs,
    borderRadius: tokens.radius.base,
  },
  modalBody: {
    padding: tokens.padding.md,
  },
  handicapBox: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    borderRadius: tokens.radius.baseLg,
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.md2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  handicapLabel: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.bold,
  },
  handicapValue: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: colors.neutral[900],
  },
  fieldLabel: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
    color: colors.neutral[700],
    marginBottom: tokens.spacing.xs2,
  },
  input: {
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
  },
  inputNormal: {
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error[300],
    backgroundColor: colors.error[50],
  },
  errorText: {
    ...base.textSmError,
    marginTop: tokens.spacing.xs,
    color: colors.error[700],
    fontWeight: tokens.fontWeight.bold,
  },
  previewBox: {
    marginTop: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    borderRadius: tokens.radius.baseLg,
    padding: tokens.padding.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
    color: colors.primary[700],
  },
  previewValue: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.black,
    color: colors.primary[900] ?? colors.primary[700],
  },
  previewHint: {
    marginTop: tokens.spacing.xs2,
    fontSize: tokens.font.xs,
    color: colors.primary[700],
    lineHeight: 16,
    fontWeight: tokens.fontWeight.semibold,
  },
  submitErrorBox: {
    marginTop: tokens.spacing.sm2,
    borderWidth: 1,
    borderColor: colors.error[300],
    backgroundColor: colors.error[50],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.base,
  },
  submitErrorText: {
    fontSize: tokens.font.sm,
    color: colors.error[700],
    fontWeight: tokens.fontWeight.bold,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: tokens.spacing.md,
  },
  modalBtn: {
    flex: 1,
    borderRadius: tokens.radius.baseLg,
    paddingVertical: tokens.padding.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnOutline: {
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  modalBtnOutlineText: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.black,
    color: colors.neutral[700],
  },
  modalBtnPrimary: {
    backgroundColor: colors.primary[600],
  },
  modalBtnPrimaryText: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.black,
    color: colors.white,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
};
