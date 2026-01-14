import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import { roundsApi } from '../../lib/api/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

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
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setGrossScore('');
      setError('');
      setIsSubmitting(false);
    }
  }, [visible]);

  const newHandicap = useMemo(() => {
    if (!grossScore) return null;
    const score = parseInt(grossScore, 10);
    if (Number.isNaN(score)) return null;
    const handicap = Math.max(0, Math.min(72, score - 72));
    return handicap.toFixed(1);
  }, [grossScore]);

  const handleSubmit = async () => {
    if (!grossScore) {
      setError('라운딩 스코어를 입력해주세요.');
      return;
    }

    const score = parseInt(grossScore, 10);
    if (Number.isNaN(score)) {
      setError('숫자만 입력 가능합니다.');
      return;
    }

    if (score < 55 || score > 144) {
      setError('스코어는 55~144 사이의 값이어야 합니다.');
      return;
    }

    if (!meetingId || !participantId) {
      setError('참가자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (shouldCompleteRounding) {
        await roundsApi.completeRounding(meetingId);
      }

      await roundsApi.submitSimpleScore(meetingId, participantId, {
        gross_score: score,
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (submitError) {
      console.error('점수 입력 실패:', submitError);
      setError(submitError?.message || '점수 입력에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="점수 입력"
      onClose={onClose}
      footer={(
        <View style={styles.footerRow}>
          <Button
            variant="outline"
            size="sm"
            style={styles.footerButton}
            onPress={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            size="sm"
            style={styles.footerButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            저장하기
          </Button>
        </View>
      )}
    >
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>현재 핸디캡</Text>
        <Text style={styles.sectionValue}>
          {currentHandicap !== null && currentHandicap !== undefined && currentHandicap !== ''
            ? Number(currentHandicap).toFixed(1)
            : '-'}
        </Text>
      </View>

      <Input
        label="라운딩 스코어"
        value={grossScore}
        onChangeText={(value) => {
          if (value === '') {
            setGrossScore('');
            return;
          }
          if (!/^[0-9]+$/.test(value)) {
            return;
          }
          setGrossScore(value.replace(/^0+(?=\d)/, ''));
        }}
        placeholder="55~144 사이의 숫자 입력"
        keyboardType="number-pad"
        required
      />

      {newHandicap !== null && (
        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>새로운 핸디캡 (예상)</Text>
          <Text style={styles.previewValue}>{newHandicap}</Text>
          <Text style={styles.previewHint}>라운딩 스코어 - 72로 계산됩니다.</Text>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </Modal>
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
