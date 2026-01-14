import { FontAwesome5 } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { asNumber, formatKoreanDate } from '@/lib/value/mypageRecords';
import { colors } from '@/styles/colors';

export default function RecordMeetingCard({
  meeting,
  isCompleted = false,
  currentHandicap,
  onOpenDetail,
  onOpenScore,
  onOpenComingSoon,
  styles,
}) {
  const handleOpenDetail = useMemo(
    () => onOpenDetail(meeting.meeting_id),
    [onOpenDetail, meeting.meeting_id]
  );
  const handleOpenScore = useMemo(
    () => onOpenScore(meeting),
    [onOpenScore, meeting]
  );
  const handleOpenComingSoon = useMemo(
    () => onOpenComingSoon(),
    [onOpenComingSoon]
  );

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
        <Text style={styles.meetingDot}>•</Text>
        <Text style={styles.meetingDateText}>
          종료일: {formatKoreanDate(meeting.rounding_completed_at)}
        </Text>
      </View>

      {isCompleted && (
        <View style={styles.scoreRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreLabel}>라운딩 스코어</Text>
            <Text style={styles.scoreValue}>{meeting.gross_score}</Text>
          </View>
          {currentHandicap !== null && currentHandicap !== undefined && (
            <View style={{ flex: 1 }}>
              <Text style={styles.scoreLabel}>업데이트된 핸디캡</Text>
              <Text style={styles.handicapGreen}>
                {asNumber(currentHandicap, 0).toFixed(1)}
              </Text>
            </View>
          )}
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
              onPress={handleOpenComingSoon}
              style={({ pressed }) => [
                styles.outlineBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.outlineBtnText}>상세 입력</Text>
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
              onPress={handleOpenComingSoon}
              style={({ pressed }) => [
                styles.softPrimaryBtn,
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.softPrimaryBtnText}>상세 수정</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
