import { FontAwesome5 } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import Card from '@/components/ui/Card';
import {
  formatCost,
  formatMeetingTime,
  getMeetingStatusBadgeConfigs,
  getMeetingTypeBadgeConfig,
} from '@/lib/util/meetingUtils';
import { colors } from '@/styles/colors';

import MeetingBadge from './MeetingBadge';


export default function MeetingCard({ meeting, onPress, styles }) {
  const meetingType = meeting?.meeting_type || meeting?.type || 'ROUND';
  const maxParticipants = meeting?.max_participants ?? meeting?.maxParticipants;
  const typeConfig = getMeetingTypeBadgeConfig(meetingType);
  const statusBadges = getMeetingStatusBadgeConfigs(meeting);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
    >
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleArea}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {meeting?.name || '모임명 없음'}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {meeting?.club_name || '-'}
            </Text>
          </View>
          <View style={styles.cardBadgeRow}>
            {typeConfig ? (
              <MeetingBadge
                text={typeConfig.text}
                backgroundColor={typeConfig.backgroundColor}
                textColor={typeConfig.textColor}
                style={styles.badge}
                textStyle={styles.badgeText}
              />
            ) : null}
            <View style={styles.statusBadgeRow}>
              {statusBadges.map((badge) => (
                <MeetingBadge
                  key={badge.key}
                  text={badge.text}
                  backgroundColor={badge.backgroundColor}
                  textColor={badge.textColor}
                  style={styles.badge}
                  textStyle={styles.badgeText}
                />
              ))}
            </View>
          </View>
        </View>

        {meeting?.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {meeting.description}
          </Text>
        ) : null}

        <View style={styles.metaList}>
          <View style={styles.metaItem}>
            <FontAwesome5 name="calendar-alt" size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {formatMeetingTime(meeting?.meeting_time)}
            </Text>
          </View>
          {meeting?.location ? (
            <View style={styles.metaItem}>
              <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText} numberOfLines={1}>
                {meeting.location}
              </Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <FontAwesome5 name="users" size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText}>
              {meeting?.participant_count ?? 0}
              {maxParticipants ? `/${maxParticipants}` : ''}명
            </Text>
          </View>
          {meeting?.application_deadline ? (
            <View style={styles.metaItem}>
              <FontAwesome5 name="clock" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText} numberOfLines={1}>
                참가 신청 마감: {formatMeetingTime(meeting.application_deadline)}
              </Text>
            </View>
          ) : null}
        </View>

        {meetingType === 'ROUND' && (
          <View style={styles.extraList}>
            {meeting?.course_name ? (
              <View style={styles.metaItem}>
                <Text style={styles.golfEmoji}>🏌️</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {meeting.course_name}
                </Text>
              </View>
            ) : null}
            {meeting?.total_cost ? (
              <View style={styles.metaItem}>
                <FontAwesome5 name="dollar-sign" size={12} color={colors.neutral[500]} />
                <Text style={styles.metaText}>
                  총 비용: {formatCost(meeting.total_cost)}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {meetingType === 'SOCIAL' && meeting?.social_cost ? (
          <View style={styles.extraList}>
            <View style={styles.metaItem}>
              <FontAwesome5 name="dollar-sign" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText}>
                참가 비용(원): {formatCost(meeting.social_cost)}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            {meeting?.created_at
              ? new Date(meeting.created_at).toLocaleDateString('ko-KR')
              : '-'}
          </Text>
          <Text style={styles.cardLink}>자세히 보기 →</Text>
        </View>
      </Card>
    </Pressable>
  );
}
