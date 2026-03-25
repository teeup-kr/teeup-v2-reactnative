import { FontAwesome5 } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { asNumber, formatKoreanDate } from '@/lib/util/mypageUtils';
import { colors } from '@/styles/colors';


export default function RecordMeetingCard({
  meeting,
  isCompleted = false,
  onOpenDetail,
  onOpenScore,
  onOpenHoleScore,
  styles,
}) {
  const hasHoleScores = Boolean(meeting?.has_hole_scores);
  const handleOpenDetail = useMemo(
    () => onOpenDetail(meeting.meeting_id),
    [onOpenDetail, meeting.meeting_id]
  );
  const handleOpenScore = useMemo(
    () => () => onOpenScore(meeting),
    [onOpenScore, meeting]
  );
  const handleOpenHoleScore = useMemo(
    () => () => onOpenHoleScore(meeting),
    [onOpenHoleScore, meeting]
  );
  const detailButtonStyle = hasHoleScores ? styles.softPrimaryBtn : styles.outlineBtn;
  const detailButtonTextStyle = hasHoleScores
    ? styles.softPrimaryBtnText
    : styles.outlineBtnText;
  const detailButtonText = hasHoleScores ? '상세 수정' : '상세입력';

  const handicapDisplayText = useMemo(() => {
    const v = meeting.handicap_after_round ?? meeting.handicap_used;
    if (v == null || v === '') return '—';
    return asNumber(v, 0).toFixed(1);
  }, [meeting.handicap_after_round, meeting.handicap_used]);

  return (
    <View
      style={[
        styles.meetingBox,
        isCompleted ? styles.meetingCompleted : styles.meetingMissing,
      ]}
    >
      <Pressable onPress={handleOpenDetail}>
        <Text style={styles.meetingTitle} numberOfLines={1}>
          {meeting.meeting_name}
        </Text>
      </Pressable>

      <Text style={styles.meetingClub}>{meeting.club_name}</Text>

      <View style={styles.meetingDatesRow}>
        <Text style={styles.meetingDateText}>
          경기일: {formatKoreanDate(meeting.meeting_time)}
        </Text>
      </View>

      {isCompleted && (
        <View style={styles.scoreRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreLabel}>라운딩 스코어</Text>
            <Text style={styles.scoreValue}>{meeting.gross_score}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreLabel}>경기 핸디캡</Text>
            <Text style={styles.handicapGreen}>{handicapDisplayText}</Text>
          </View>
        </View>
      )}

      <View style={styles.cardBtnRow}>
        {!isCompleted ? (
          <>
            <Pressable
              onPress={handleOpenScore}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={styles.inlineRow}>
                <FontAwesome5 name="golf-ball" size={14} color={colors.white} />
                <Text style={styles.primaryBtnText}>점수 입력</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleOpenHoleScore}
              style={({ pressed }) => [
                detailButtonStyle,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={detailButtonTextStyle}>{detailButtonText}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={handleOpenScore}
              style={({ pressed }) => [
                styles.outlineBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={styles.inlineRow}>
                <FontAwesome5
                  name="edit"
                  size={14}
                  color={colors.neutral[700]}
                />
                <Text style={styles.outlineBtnText}>수정</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={handleOpenHoleScore}
              style={({ pressed }) => [
                detailButtonStyle,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={detailButtonTextStyle}>{detailButtonText}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
