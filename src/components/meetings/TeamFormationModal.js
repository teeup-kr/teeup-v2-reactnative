import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
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

const genderOptions = [
  { value: 'MALE', label: '남성' },
  { value: 'FEMALE', label: '여성' },
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
  const [guests, setGuests] = useState([]);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestForm, setGuestForm] = useState({
    name: '',
    birthdate: '',
    gender: '',
    handicap: '',
    average_score: '',
  });

  const canSubmit = useMemo(() => {
    return !!formationMode && !!teamSize;
  }, [formationMode, teamSize]);

  if (!isVisible) return null;

  const handleAddGuest = () => {
    if (!guestForm.name) return;
    setGuests((prev) => [...prev, { ...guestForm }]);
    setGuestForm({ name: '', birthdate: '', gender: '', handicap: '', average_score: '' });
    setShowGuestForm(false);
  };

  const handleRemoveGuest = (index) => {
    setGuests((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (onFormTeams) {
      onFormTeams({
        formation_mode: formationMode,
        team_size: Number(teamSize),
        guests,
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>게스트 추가</Text>
        <Button size="sm" variant="outline" onPress={() => setShowGuestForm((prev) => !prev)}>
          {showGuestForm ? '닫기' : '게스트 추가'}
        </Button>
      </View>

      {showGuestForm ? (
        <View style={styles.guestForm}>
          <Input
            label="이름"
            value={guestForm.name}
            onChangeText={(value) => setGuestForm((prev) => ({ ...prev, name: value }))}
            placeholder="게스트 이름"
          />
          <Input
            label="생년월일"
            value={guestForm.birthdate}
            onChangeText={(value) => setGuestForm((prev) => ({ ...prev, birthdate: value }))}
            placeholder="YYYY-MM-DD"
          />
          <Text style={styles.fieldLabel}>성별</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setGuestForm((prev) => ({ ...prev, gender: option.value }))}
                style={({ pressed }) => [
                  styles.genderChip,
                  guestForm.gender === option.value && styles.genderChipActive,
                  pressed && styles.genderChipPressed,
                ]}
              >
                <Text style={[styles.genderText, guestForm.gender === option.value && styles.genderTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input
            label="핸디캡"
            value={guestForm.handicap}
            onChangeText={(value) => setGuestForm((prev) => ({ ...prev, handicap: value }))}
            placeholder="예: 15.8"
            keyboardType="decimal-pad"
          />
          <Input
            label="평균 타수"
            value={guestForm.average_score}
            onChangeText={(value) => setGuestForm((prev) => ({ ...prev, average_score: value }))}
            placeholder="예: 90"
            keyboardType="number-pad"
          />
          <Button size="sm" onPress={handleAddGuest}>
            게스트 추가 완료
          </Button>
        </View>
      ) : null}

      {guests.length > 0 && (
        <View style={styles.guestList}>
          {guests.map((guest, index) => (
            <View key={`${guest.name}-${index}`} style={styles.guestItem}>
              <Text style={styles.guestName}>{guest.name}</Text>
              <Text style={styles.guestMeta}>성별: {guest.gender || '-'}</Text>
              <Pressable onPress={() => handleRemoveGuest(index)}>
                <Text style={styles.removeText}>삭제</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  modeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
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
    fontSize: 11,
    color: colors.neutral[600],
  },
  modeChipTextActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  guestForm: {
    marginTop: 8,
  },
  guestList: {
    marginTop: 8,
    gap: 8,
  },
  guestItem: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  guestName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  guestMeta: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
  },
  removeText: {
    marginTop: 6,
    fontSize: 11,
    color: colors.error[600],
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footerButton: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
  },
  genderChipActive: {
    backgroundColor: colors.primary[600],
  },
  genderChipPressed: {
    opacity: 0.9,
  },
  genderText: {
    fontSize: 11,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  genderTextActive: {
    color: colors.white,
  },
});
