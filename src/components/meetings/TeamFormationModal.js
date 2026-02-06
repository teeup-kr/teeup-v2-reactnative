import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatBirthdateForApi, normalizeBirthdateInput } from '@/lib/util/meetingUtils';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const formationModeOptions = [
  { value: 'GENDER_SEPARATED_HANDICAP', label: '성별 분리 + 핸디캡 기준' },
  { value: 'GENDER_SEPARATED_PREVIOUS_RECORD', label: '성별 분리 + 직전대회 성적 기준' },
  { value: 'GENDER_SEPARATED_RANDOM', label: '성별 분리 + 랜덤' },
  { value: 'GENDER_MIXED_HANDICAP', label: '성별 혼합 + 핸디캡 기준' },
  { value: 'GENDER_MIXED_PREVIOUS_RECORD', label: '성별 혼합 + 직전대회 성적 기준' },
  { value: 'GENDER_MIXED_RANDOM', label: '성별 혼합 + 랜덤' },
];

export default function TeamFormationModal({
  isOpen,
  visible,
  onClose,
  onFormTeams,
  meeting,
  processing,
  onOpenBatch,
}) {
  const isVisible = visible ?? isOpen;
  const [formationMode, setFormationMode] = useState(meeting?.team_formation_mode || 'GENDER_MIXED_HANDICAP');
  const [teamSize, setTeamSize] = useState(String(meeting?.team_size || 4));

  const canSubmit = useMemo(() => {
    return !!formationMode && !!teamSize;
  }, [formationMode, teamSize]);

  if (!isVisible) return null;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const invalidGuest = guests.find((g) => {
      const raw = String(g.birthdate || '').trim().replace(/\D/g, '');
      return raw.length === 8 && !formatBirthdateForApi(g.birthdate);
    });
    if (invalidGuest) {
      Alert.alert('확인', '게스트 생년월일을 확인해주세요. (1900년~올해, 올바른 월·일)');
      return;
    }
    if (onFormTeams) {
      const guestsForApi = guests.map((g) => ({
        ...g,
        birthdate: formatBirthdateForApi(g.birthdate) || null,
      }));
      onFormTeams({
        formation_mode: formationMode,
        team_size: Number(teamSize),
      });
    }
  };

  return (
    <Modal
      visible={isVisible}
      title="팀 편성"
      onClose={onClose}
      footer={(
        <View style={styles.footerRow}>
          <Button variant="outline" size="sm" style={styles.footerButton} onPress={onClose}>
            닫기
          </Button>
          {onOpenBatch ? (
            <Button size="sm" variant="outline" style={styles.footerButton} onPress={onOpenBatch}>
              일괄 비교
            </Button>
          ) : null}
          <Button size="sm" style={styles.footerButton} onPress={handleSubmit} disabled={!canSubmit} loading={processing}>
            팀 편성 시작
          </Button>
        </View>
      )}
    >
      <Text style={styles.sectionTitle}>편성 조건</Text>
      <View style={styles.modeGrid}>
        {formationModeOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setFormationMode(option.value)}
            style={({ pressed }) => [
              styles.modeChip,
              formationMode === option.value && styles.modeChipActive,
              pressed && styles.modeChipPressed,
            ]}
          >
            <Text style={[styles.modeChipText, formationMode === option.value && styles.modeChipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="팀 인원"
        value={teamSize}
        onChangeText={setTeamSize}
        keyboardType="number-pad"
        placeholder="예: 4"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs2,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: tokens.spacing.sm2,
  },
  modeChip: {
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  modeChipActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  modeChipPressed: {
    opacity: 0.8,
  },
  modeChipText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
  },
  modeChipTextActive: {
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerButton: {
    flex: 1,
  },
});
