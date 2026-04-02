import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

import Button from '../ui/Button';
import Modal from '../ui/Modal';


const formationModeOptions = [
  { value: 'GENDER_SEPARATED_HANDICAP', label: '성별 분리 + 핸디캡 기준' },
  { value: 'GENDER_SEPARATED_PREVIOUS_RECORD', label: '성별 분리 + 직전대회 성적 기준' },
  { value: 'GENDER_SEPARATED_RANDOM', label: '성별 분리 + 랜덤' },
  { value: 'GENDER_MIXED_HANDICAP', label: '성별 혼합 + 핸디캡 기준' },
  { value: 'GENDER_MIXED_PREVIOUS_RECORD', label: '성별 혼합 + 직전대회 성적 기준' },
  { value: 'GENDER_MIXED_RANDOM', label: '성별 혼합 + 랜덤' },
];

export default function BatchFormationModal({
  isOpen,
  visible,
  onClose,
  meeting,
  onFormTeams,
  onViewDetail,
  processing,
}) {
  const isVisible = visible ?? isOpen;
  const [selectedModes, setSelectedModes] = useState([]);
  const [teamSize, setTeamSize] = useState(String(meeting?.team_size || 4));
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setSelectedModes([]);
      setResults([]);
      setLoading(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const toggleMode = (mode) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((item) => item !== mode) : [...prev, mode],
    );
  };

  const handleRunBatch = async () => {
    if (!onFormTeams) return;
    setLoading(true);
    setResults([]);

    try {
      const batchResults = await Promise.all(
        selectedModes.map(async (mode) => {
          try {
            const response = await onFormTeams({
              formation_mode: mode,
              team_size: Number(teamSize),
              preview: true,
              batchMode: true,
            });
            const teams = extractList(response?.data?.teams || response?.teams || response);
            return {
              mode,
              label: formationModeOptions.find((option) => option.value === mode)?.label || mode,
              teams,
              teamSize: Number(teamSize),
              success: true,
            };
          } catch (error) {
            return {
              mode,
              label: formationModeOptions.find((option) => option.value === mode)?.label || mode,
              teams: [],
              teamSize: Number(teamSize),
              success: false,
              error: error?.message || '편성 실패',
            };
          }
        }),
      );
      setResults(batchResults);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      title="일괄 편성 및 비교"
      onClose={onClose}
      footer={(
        <View style={styles.footerRow}>
          <Button variant="outline" size="sm" style={styles.footerButton} onPress={onClose}>
            닫기
          </Button>
          <Button size="sm" style={styles.footerButton} onPress={handleRunBatch} loading={loading || processing}>
            비교 시작
          </Button>
        </View>
      )}
    >
      <Text style={styles.sectionTitle}>편성 모드 선택</Text>
      <View style={styles.modeGrid}>
        {formationModeOptions.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => toggleMode(option.value)}
            style={({ pressed }) => [
              styles.modeChip,
              selectedModes.includes(option.value) && styles.modeChipActive,
              pressed && styles.modeChipPressed,
            ]}
          >
            <Text style={[styles.modeChipText, selectedModes.includes(option.value) && styles.modeChipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>팀 인원</Text>
      <View style={styles.teamSizeRow}>
        <Pressable
          onPress={() => setTeamSize('3')}
          style={[styles.teamSizeChip, teamSize === '3' && styles.teamSizeChipActive]}
        >
          <Text style={[styles.teamSizeText, teamSize === '3' && styles.teamSizeTextActive]}>3명</Text>
        </Pressable>
        <Pressable
          onPress={() => setTeamSize('4')}
          style={[styles.teamSizeChip, teamSize === '4' && styles.teamSizeChipActive]}
        >
          <Text style={[styles.teamSizeText, teamSize === '4' && styles.teamSizeTextActive]}>4명</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.loadingText}>편성 결과를 불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView style={styles.resultsList}>
          {results.map((result) => (
            <View key={result.mode} style={styles.resultCard}>
              <Text style={styles.resultTitle}>{result.label}</Text>
              {result.success ? (
                <>
                  <Text style={styles.resultMeta}>팀 수: {result.teams.length}</Text>
                  <View style={styles.resultActionRow}>
                    <Button
                      size="sm"
                      variant="outline"
                      style={styles.resultActionButton}
                      onPress={() => {
                        if (onViewDetail) {
                          onViewDetail(result);
                        }
                      }}
                    >
                      상세 보기
                    </Button>
                    <Button
                      size="sm"
                      style={[styles.resultActionButton, { backgroundColor: colors.accent[600] }]}
                      onPress={() => {
                        if (onFormTeams) {
                          onFormTeams({
                            formation_mode: result.mode,
                            team_size: Number(teamSize),
                            preview: true,
                          });
                        }
                        onClose();
                      }}
                    >
                      이 결과 선택
                    </Button>
                  </View>
                </>
              ) : (
                <Text style={styles.errorText}>{result.error}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
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
  teamSizeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: tokens.spacing.sm2,
  },
  teamSizeChip: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.baseLg,
    backgroundColor: colors.neutral[100],
  },
  teamSizeChipActive: {
    backgroundColor: colors.primary[600],
  },
  teamSizeText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  teamSizeTextActive: {
    color: colors.white,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: tokens.padding.md,
  },
  loadingText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  resultsList: {
    maxHeight: 280,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
    marginBottom: tokens.spacing.sm,
  },
  resultTitle: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  resultMeta: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginBottom: tokens.spacing.xs2,
  },
  resultActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resultActionButton: {
    flex: 1,
  },
  errorText: {
    fontSize: tokens.font.xs,
    color: colors.error[600],
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
