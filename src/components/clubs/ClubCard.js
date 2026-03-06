import { FontAwesome5 } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import StatusBadge from '@/components/ui/StatusBadge';
import {
  formatClubDate,
  getClubMembershipStatusBadgeConfig,
  getClubRoleBadgeConfig,
  getClubStatusBadgeConfig,
  getClubTypeBadgeConfig,
} from '@/lib/util/clubUtils';
import { colors } from '@/styles/colors';

export default function ClubCard({ club, variant, onPress, styles, logoImage, locationLabel }) {
  const showStatus = variant === 'all' || variant === 'my';
  const showMembershipStatus = variant === 'my' || variant === 'join-applications';
  const showMembershipRole = variant === 'my' || variant === 'join-applications';

  const statusConfig = showStatus
    ? getClubStatusBadgeConfig(club?.status, club?.club_deleted_at)
    : null;
  const membershipConfig = showMembershipStatus
    ? getClubMembershipStatusBadgeConfig(club?.membership_status)
    : null;
  const typeConfig = getClubTypeBadgeConfig(club?.type);
  const roleConfig = showMembershipRole
    ? getClubRoleBadgeConfig(club?.membership_role)
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.logoCircle}>
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {club?.name || '클럽명 없음'}
            </Text>
          </View>
          <View style={styles.badgeStack}>
            {statusConfig ? (
              <StatusBadge
                text={statusConfig.text}
                backgroundColor={statusConfig.bg}
                textColor={statusConfig.fg}
                style={styles.badge}
                textStyle={styles.badgeText}
              />
            ) : null}
            {membershipConfig ? (
              <StatusBadge
                text={membershipConfig.text}
                backgroundColor={membershipConfig.bg}
                textColor={membershipConfig.fg}
                style={styles.badge}
                textStyle={styles.badgeText}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.badgeRow}>
          {typeConfig ? (
            <StatusBadge
              text={typeConfig.text}
              backgroundColor={typeConfig.bg}
              textColor={typeConfig.fg}
              style={styles.badge}
              textStyle={styles.badgeText}
            />
          ) : null}
          {roleConfig ? (
            <StatusBadge
              text={roleConfig.text}
              backgroundColor={roleConfig.bg}
              textColor={roleConfig.fg}
              style={[styles.badge, styles.roleBadge]}
              textStyle={styles.badgeText}
            />
          ) : null}
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {club?.description || ''}
        </Text>

        <View style={styles.metaList}>
          <View style={styles.metaItem}>
            <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText} numberOfLines={1}>
              {locationLabel || club?.location || '-'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <FontAwesome5 name="user-friends" size={12} color={colors.neutral[500]} />
            <Text style={styles.metaText}>멤버 {club?.member_count ?? 0}명</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>
            {formatClubDate(club?.created_at || club?.joined_at)}
          </Text>
          <Text style={styles.cardLink}>상세 보기</Text>
        </View>
      </View>
    </Pressable>
  );
}
