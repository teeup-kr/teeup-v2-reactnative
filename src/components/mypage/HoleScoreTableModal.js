import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Modal from '@/components/ui/Modal';
import { roundsApi } from '@/lib/api/api';
import {
  clampStrokeDigitsToDoublePar,
  clampStrokesNumberToDoublePar,
} from '@/lib/util/holeScoreLimits';
import { extractData, extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

const DEFAULT_HOLE_COUNT = 18;
const DEFAULT_PAR = '4';

/** PAR 드롭다운 옵션 */
const PAR_OPTIONS = [3, 4, 5];

function toDigits(value) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

function createInitialRows(holeCount) {
  return Array.from({ length: holeCount }, (_, index) => ({
    hole_number: index + 1,
    par: DEFAULT_PAR,
    strokes: '',
  }));
}

function normalizeScoreItem(item) {
  const holeNumber = Number(item?.hole_number);
  const strokes = Number(item?.strokes ?? item?.score);
  const par = Number(item?.par);

  return {
    id: item?.id,
    hole_number: Number.isInteger(holeNumber) ? holeNumber : null,
    strokes: Number.isFinite(strokes) ? strokes : null,
    par: Number.isFinite(par) ? par : null,
  };
}

/** +/- 표기: "+2", "-1", "0" 등 숫자만 */
function getDiffDisplayText(strokes, par) {
  const strokeNum = Number(strokes);
  const parNum = Number(par);
  if (!Number.isFinite(strokeNum) || !Number.isFinite(parNum)) return '-';
  const diff = strokeNum - parNum;
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

function getDiffColor(strokes, par) {
  const strokeNum = Number(strokes);
  const parNum = Number(par);
  if (!Number.isFinite(strokeNum) || !Number.isFinite(parNum)) return colors.neutral[500];
  const diff = strokeNum - parNum;
  if (diff === 0) return colors.info[700];
  if (diff > 0) return colors.error[700];
  return colors.success[700];
}

export default function HoleScoreTableModal({
  visible,
  onClose,
  meetingId,
  participantId,
  holeCount = DEFAULT_HOLE_COUNT,
  /** 간편 점수(라운딩 스코어)가 있으면 홀별 합계와 일치할 때만 저장 허용 */
  simpleGrossScore = null,
  onSuccess,
}) {
  const normalizedHoleCount = useMemo(() => {
    const parsed = Number(holeCount);
    if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_HOLE_COUNT;
    return Math.min(parsed, DEFAULT_HOLE_COUNT);
  }, [holeCount]);

  const [rows, setRows] = useState(createInitialRows(normalizedHoleCount));
  const [existingScoresByHole, setExistingScoresByHole] = useState({});
  const [scoreStats, setScoreStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveMismatchMessage, setSaveMismatchMessage] = useState('');

  const closeModal = useCallback(() => {
    if (isSaving) return;
    onClose?.();
  }, [isSaving, onClose]);

  const loadScores = useCallback(async () => {
    if (!meetingId || !participantId) {
      setRows(createInitialRows(normalizedHoleCount));
      setExistingScoresByHole({});
      setScoreStats(null);
      setLoadError('');
      setSaveMismatchMessage('');
      return;
    }

    try {
      setIsLoading(true);
      setLoadError('');
      setSaveMismatchMessage('');

      const [scoreResponse, statsResponse] = await Promise.all([
        roundsApi.getParticipantScores(meetingId, participantId),
        roundsApi.getParticipantScoreStats(meetingId, participantId),
      ]);

      const rawScores = extractList(scoreResponse);
      const normalizedScores = rawScores
        .map(normalizeScoreItem)
        .filter((item) => Number.isInteger(item.hole_number) && item.hole_number > 0);

      const byHole = {};
      let maxHole = normalizedHoleCount;
      normalizedScores.forEach((item) => {
        byHole[item.hole_number] = item;
        if (item.hole_number > maxHole) {
          maxHole = item.hole_number;
        }
      });

      const nextRows = createInitialRows(maxHole).map((row) => {
        const existing = byHole[row.hole_number];
        if (!existing) return row;
        const parStr = String(existing.par ?? DEFAULT_PAR);
        const rawStrokes =
          existing.strokes != null && existing.strokes !== undefined
            ? String(existing.strokes)
            : '';
        return {
          hole_number: row.hole_number,
          par: parStr,
          strokes: rawStrokes
            ? clampStrokeDigitsToDoublePar(toDigits(rawStrokes), parStr)
            : '',
        };
      });

      setRows(nextRows);
      setExistingScoresByHole(byHole);
      setScoreStats(extractData(statsResponse));
    } catch (err) {
      console.error('홀별 점수 조회 실패:', err);
      setLoadError(err?.message || '홀별 점수를 불러오지 못했습니다.');
      setRows(createInitialRows(normalizedHoleCount));
      setExistingScoresByHole({});
      setScoreStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, normalizedHoleCount, participantId]);

  useEffect(() => {
    if (!visible) {
      setRows(createInitialRows(normalizedHoleCount));
      setExistingScoresByHole({});
      setScoreStats(null);
      setIsLoading(false);
      setIsSaving(false);
      setLoadError('');
      setSaveMismatchMessage('');
      return;
    }
    loadScores();
  }, [visible, normalizedHoleCount, loadScores]);

  const handleParChange = useCallback((holeNumber, value) => {
    setSaveMismatchMessage('');
    const normalized = value != null ? String(value) : DEFAULT_PAR;
    setRows((prev) =>
      prev.map((row) => {
        if (row.hole_number !== holeNumber) return row;
        return {
          ...row,
          par: normalized,
          strokes: clampStrokeDigitsToDoublePar(row.strokes, normalized),
        };
      })
    );
  }, []);

  const handleStrokeChange = useCallback((holeNumber, value) => {
    setSaveMismatchMessage('');
    const digits = toDigits(value);
    setRows((prev) =>
      prev.map((row) =>
        row.hole_number === holeNumber
          ? { ...row, strokes: clampStrokeDigitsToDoublePar(digits, row.par) }
          : row
      )
    );
  }, []);

  const totalInputCount = useMemo(
    () => rows.filter((row) => row.strokes.trim() !== '').length,
    [rows]
  );

  const handleSave = useCallback(async () => {
    if (!meetingId || !participantId) return;

    setSaveMismatchMessage('');

    const expectedGross = Number(simpleGrossScore);
    if (Number.isFinite(expectedGross) && expectedGross > 0) {
      const filledCount = rows.filter((r) => r.strokes.trim() !== '').length;
      if (filledCount !== normalizedHoleCount) {
        setSaveMismatchMessage(
          `간편 입력 라운딩 스코어는 ${expectedGross}타입니다. 홀별로 ${normalizedHoleCount}홀을 모두 입력해야 저장할 수 있습니다. (현재 ${filledCount}홀)`
        );
        return;
      }
      let holeSum = 0;
      for (const row of rows) {
        const parsedPar = Number(row.par || DEFAULT_PAR);
        let parsedStrokes = Number(row.strokes);
        if (!Number.isInteger(parsedStrokes) || parsedStrokes <= 0) {
          Alert.alert('입력 확인', `${row.hole_number}번 홀 타수를 올바르게 입력해주세요.`);
          return;
        }
        if (!Number.isInteger(parsedPar) || parsedPar <= 0) {
          Alert.alert('입력 확인', `${row.hole_number}번 홀 PAR를 올바르게 입력해주세요.`);
          return;
        }
        holeSum += clampStrokesNumberToDoublePar(parsedStrokes, parsedPar);
      }
      if (holeSum !== expectedGross) {
        setSaveMismatchMessage(
          `홀별 타수 합계는 ${holeSum}타입니다. 간편 입력 스코어(${expectedGross}타)와 같아야 저장할 수 있습니다. 타수를 맞추거나 간편 점수를 먼저 수정해 주세요.`
        );
        return;
      }
    }

    const requests = [];

    for (const row of rows) {
      const existing = existingScoresByHole[row.hole_number];
      const hasStrokeInput = row.strokes.trim() !== '';

      if (!hasStrokeInput) {
        if (existing?.id) {
          requests.push(() =>
            roundsApi.deleteScore(meetingId, participantId, existing.id)
          );
        }
        continue;
      }

      const parsedPar = Number(row.par || DEFAULT_PAR);
      let parsedStrokes = Number(row.strokes);

      if (!Number.isInteger(parsedStrokes) || parsedStrokes <= 0) {
        Alert.alert('입력 확인', `${row.hole_number}번 홀 타수를 올바르게 입력해주세요.`);
        return;
      }

      if (!Number.isInteger(parsedPar) || parsedPar <= 0) {
        Alert.alert('입력 확인', `${row.hole_number}번 홀 PAR를 올바르게 입력해주세요.`);
        return;
      }

      parsedStrokes = clampStrokesNumberToDoublePar(parsedStrokes, parsedPar);

      const payload = {
        hole_number: row.hole_number,
        strokes: parsedStrokes,
        par: parsedPar,
      };

      if (existing?.id) {
        const changed = existing.strokes !== parsedStrokes || existing.par !== parsedPar;
        if (changed) {
          requests.push(() =>
            roundsApi.updateScore(meetingId, participantId, existing.id, payload)
          );
        }
      } else {
        requests.push(() =>
          roundsApi.createScore(meetingId, participantId, payload)
        );
      }
    }

    if (requests.length === 0) {
      closeModal();
      return;
    }

    try {
      setIsSaving(true);
      for (const request of requests) {
        await request();
      }

      if (typeof onSuccess === 'function') {
        await onSuccess();
      } else {
        await loadScores();
      }
    } catch (err) {
      console.error('홀별 점수 저장 실패:', err);
      Alert.alert('오류', err?.message || '홀별 점수 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [
    closeModal,
    existingScoresByHole,
    loadScores,
    meetingId,
    normalizedHoleCount,
    onSuccess,
    participantId,
    rows,
    simpleGrossScore,
  ]);

  const averageValue = scoreStats?.average_strokes ?? scoreStats?.average_score ?? '-';
  const totalValue = scoreStats?.total_strokes ?? scoreStats?.total_score ?? '-';
  const bestValue = scoreStats?.best_hole ?? '-';
  const worstValue = scoreStats?.worst_hole ?? '-';

  return (
    <Modal
      visible={visible}
      title="홀별 점수 입력"
      onClose={isSaving ? undefined : closeModal}
      animationType="fade"
      scroll={false}
      containerStyle={styles.modalSheet}
      backdropStyle={styles.modalBackdrop}
      bodyStyle={styles.modalBody}
      footer={(
        <View style={styles.footerRow}>
          <Pressable
            onPress={closeModal}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.footerBtn,
              styles.footerBtnOutline,
              pressed && { opacity: 0.9 },
              isSaving && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.footerBtnOutlineText}>취소</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={isSaving || isLoading}
            style={({ pressed }) => [
              styles.footerBtn,
              styles.footerBtnPrimary,
              pressed && { opacity: 0.9 },
              (isSaving || isLoading) && { opacity: 0.5 },
            ]}
          >
            {isSaving ? (
              <View style={styles.inlineRow}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.footerBtnPrimaryText}>저장 중...</Text>
              </View>
            ) : (
              <Text style={styles.footerBtnPrimaryText}>저장</Text>
            )}
          </Pressable>
        </View>
      )}
    >
      <Text style={styles.subTitle}>입력값을 비우면 해당 홀 기록은 삭제됩니다.</Text>
      {isLoading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.stateText}>홀별 점수를 불러오는 중...</Text>
        </View>
      ) : loadError ? (
        <View style={styles.stateWrap}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : (
        <>
          {saveMismatchMessage ? (
            <Text style={styles.saveMismatchText}>{saveMismatchMessage}</Text>
          ) : null}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>입력 홀</Text>
              <Text style={styles.summaryValue}>{totalInputCount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 타수</Text>
              <Text style={styles.summaryValue}>{totalValue}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>평균</Text>
              <Text style={styles.summaryValue}>{averageValue}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>최고/최악</Text>
              <Text style={styles.summaryValue}>{`${bestValue} / ${worstValue}`}</Text>
            </View>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.holeCol]}>홀</Text>
            <Text style={[styles.headerCell, styles.parCol]}>PAR</Text>
            <Text style={[styles.headerCell, styles.strokeCol]}>타수</Text>
            <Text style={[styles.headerCell, styles.diffCol]}>+/-</Text>
          </View>

          <ScrollView style={styles.tableBody} contentContainerStyle={styles.tableBodyContent}>
            {rows.map((row, index) => (
              <View
                key={`hole-${row.hole_number}`}
                style={[
                  styles.tableRow,
                  index % 2 === 0 && styles.tableRowAlt,
                ]}
              >
                <View style={[styles.bodyCell, styles.holeCol]}>
                  <Text style={styles.holeText}>{row.hole_number}</Text>
                </View>

                <View style={[styles.bodyCell, styles.parCol]}>
                  <View style={styles.pickerWrap}>
                    <Picker
                      selectedValue={PAR_OPTIONS.map(String).includes(row.par) ? row.par : DEFAULT_PAR}
                      onValueChange={(value) => handleParChange(row.hole_number, value)}
                      enabled={!isSaving}
                      style={styles.picker}
                      mode={Platform.OS === 'android' ? 'dropdown' : undefined}
                      dropdownIconColor={colors.neutral[600]}
                      itemStyle={Platform.OS === 'ios' ? styles.pickerItem : undefined}
                      prompt="PAR 선택"
                    >
                      {PAR_OPTIONS.map((p) => (
                        <Picker.Item key={p} label={String(p)} value={String(p)} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={[styles.bodyCell, styles.strokeCol]}>
                  <TextInput
                    value={row.strokes}
                    onChangeText={(value) => handleStrokeChange(row.hole_number, value)}
                    keyboardType="number-pad"
                    editable={!isSaving}
                    style={styles.input}
                    placeholder="-"
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>

                <View style={[styles.bodyCell, styles.diffCol]}>
                  <Text
                    style={[styles.diffText, { color: getDiffColor(row.strokes, row.par) }]}
                    numberOfLines={1}
                  >
                    {getDiffDisplayText(row.strokes, row.par)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    padding: tokens.padding.baseLg,
  },
  modalSheet: {
    maxHeight: '92%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    width: '100%',
    maxWidth: 458,
    alignSelf: 'center',
  },
  modalBody: {
    flex: 1,
  },
  subTitle: {
    marginBottom: tokens.spacing.sm2,
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  saveMismatchText: {
    marginBottom: tokens.spacing.sm,
    fontSize: tokens.font.sm,
    color: colors.error[700],
    lineHeight: 20,
  },
  stateWrap: {
    paddingVertical: tokens.padding.lg2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: tokens.font.sm,
    color: colors.error[700],
    textAlign: 'center',
    paddingHorizontal: tokens.padding.md,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  summaryItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
  },
  summaryLabel: {
    fontSize: tokens.font.xs,
    color: colors.neutral[600],
  },
  summaryValue: {
    marginTop: 4,
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  tableHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: tokens.padding.sm,
  },
  headerCell: {
    paddingVertical: tokens.padding.xs,
    fontSize: tokens.font.xs,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[700],
    textAlign: 'center',
  },
  tableBody: {
    maxHeight: 360,
  },
  tableBodyContent: {
    paddingHorizontal: tokens.padding.sm,
    paddingBottom: tokens.padding.sm,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    minHeight: 46,
  },
  tableRowAlt: {
    backgroundColor: colors.neutral[50],
  },
  bodyCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  holeCol: {
    width: '16%',
  },
  parCol: {
    width: '24%',
  },
  strokeCol: {
    width: '30%',
  },
  diffCol: {
    width: '30%',
  },
  holeText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
    color: colors.neutral[800],
  },
  pickerWrap: {
    width: '80%',
    minWidth: 52,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    backgroundColor: colors.white,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
  },
  pickerItem: {
    fontSize: tokens.font.sm,
  },
  input: {
    width: '80%',
    minWidth: 52,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    textAlign: 'center',
    fontSize: tokens.font.sm,
    color: colors.neutral[900],
    paddingVertical: tokens.padding.xs2,
    paddingHorizontal: tokens.padding.xs2,
    backgroundColor: colors.white,
  },
  diffText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  footerBtn: {
    flex: 1,
    borderRadius: tokens.radius.md,
    paddingVertical: tokens.padding.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBtnOutline: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
  },
  footerBtnOutlineText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[700],
  },
  footerBtnPrimary: {
    backgroundColor: colors.primary[600],
  },
  footerBtnPrimaryText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.extrabold,
    color: colors.white,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
