import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView, StyleSheet, Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi, regionApi } from '@/lib/api/api';
import {
  createFetchClubDetailHandler,
  createJoinRequestHandler,
  createOpenManageHandler,
  createOpenMembersHandler,
} from '@/lib/handler/clubs';
import { buildClubDetailDisplay } from '@/lib/util/clubUtils';
import { extractData, extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export default function ClubDetailScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [club, setClub] = useState(null);
  const [regionLabel, setRegionLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJoinSubmitting, setIsJoinSubmitting] = useState(false);

  const loadClub = useMemo(
    () =>
      createFetchClubDetailHandler({
        clubId: resolvedId,
        fetchClubDetail: clubsApi.getClub,
        extractData,
        setClub,
        setIsLoading,
        setError,
      }),
    [resolvedId, setClub, setIsLoading, setError]
  );

  useEffect(() => {
    loadClub();
  }, [loadClub]);

  useEffect(() => {
    if (!club) {
      setRegionLabel('');
      return;
    }
    let isActive = true;
    const sidoCode = club?.sido_code || club?.sidoCode || '';
    const rawGunguCodes = club?.gungu_codes || club?.gunguCodes || [];
    const gunguCodes = Array.isArray(rawGunguCodes) ? rawGunguCodes : [];

    if (!sidoCode) {
      setRegionLabel('');
      return () => {
        isActive = false;
      };
    }

    const fetchRegionLabel = async () => {
      try {
        const [sidoRes, gunguRes] = await Promise.all([
          regionApi.getSidoList(),
          regionApi.getGunguList(sidoCode),
        ]);
        const sidoList = extractList(sidoRes);
        const gunguList = extractList(gunguRes);
        if (!isActive) return;

        const sidoName = sidoList.find((o) => String(o.code) === String(sidoCode))?.name || '';
        const gunguNameMap = Object.fromEntries(
          gunguList.map((o) => [String(o.code), o.name])
        );
        const gunguNames = gunguCodes
          .map((code) => gunguNameMap[String(code)])
          .filter(Boolean);
        const label = sidoName
          ? gunguNames.length > 0
            ? `${sidoName}, ${gunguNames.join(', ')}`
            : sidoName
          : gunguNames.length > 0
            ? gunguNames.join(', ')
            : '';
        setRegionLabel(label);
      } catch (err) {
        console.error('시도군구 조회 실패:', err);
        if (isActive) setRegionLabel('');
      }
    };

    fetchRegionLabel();
    return () => {
      isActive = false;
    };
  }, [club]);

  const display = useMemo(() => buildClubDetailDisplay(club), [club]);
  const hasRegionCodes = !!(
    club?.sido_code ||
    club?.sidoCode ||
    (Array.isArray(club?.gungu_codes || club?.gunguCodes) && (club?.gungu_codes || club?.gunguCodes).length > 0)
  );
  const locationDisplay =
    regionLabel || (!hasRegionCodes ? display.location : null) || '-';
  const handleManagePress = useMemo(
    () => createOpenManageHandler({ clubId: resolvedId, router }),
    [resolvedId, router]
  );
  const handleOpenMemberListPress = useMemo(
    () => createOpenMembersHandler({ clubId: resolvedId, router }),
    [resolvedId, router]
  );
  const handleOpenApplicationStatusPress = useMemo(
    () => createOpenMembersHandler({ clubId: resolvedId, router, manage: true }),
    [resolvedId, router]
  );
  const handleOpenJoinApplications = useMemo(
    () => () => {
      router.replace({ pathname: '/clubs', params: { tab: 'join-applications' } });
    },
    [router]
  );
  const handleJoinPress = useMemo(
    () =>
      createJoinRequestHandler({
        clubId: resolvedId,
        requestJoinClub: clubsApi.joinClub,
        setIsSubmitting: setIsJoinSubmitting,
        onSuccess: loadClub,
        alert: Alert.alert,
        onOpenJoinApplications: handleOpenJoinApplications,
      }),
    [resolvedId, loadClub, handleOpenJoinApplications]
  );

  const membershipStatus = String(club?.membership_status || '').toUpperCase().trim();
  const membershipRole = String(club?.membership_role || '').toUpperCase().trim();
  const isApprovedMember = membershipStatus === 'ACTIVE' || membershipStatus === 'APPROVED';
  const isManagerOrLeader = isApprovedMember && ['LEADER', 'MANAGER'].includes(membershipRole);
  const isGeneralMember = isApprovedMember && membershipRole === 'MEMBER';
  const isPendingApplicant = membershipStatus === 'PENDING';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <Card style={styles.heroCard}>
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>클럽 정보를 불러오는 중...</Text>
            </View>
          </Card>
        ) : error ? (
          <Card style={styles.heroCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : (
          <>
            <Card style={styles.heroCard}>
              <Text style={styles.clubName}>{display.clubName}</Text>
              <Text style={styles.clubSubtitle}>{display.clubSubtitle}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>{locationDisplay}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="users" size={12} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>멤버 {display.memberCount}명</Text>
                </View>
              </View>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{display.clubTypeLabel}</Text>
                </View>
                <View style={[styles.badge, styles.badgeAccent]}>
                  <Text style={styles.badgeText}>{display.clubStatusLabel}</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>클럽 소개</Text>
              <Text style={styles.sectionText}>{display.clubIntro}</Text>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>운영 정보</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>개설일</Text>
                <Text style={styles.infoValue}>{display.createdAtDisplay}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>회비</Text>
                <Text style={styles.infoValue}>{display.feeSummaryDisplay}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>활동 지역</Text>
                <Text style={styles.infoValue}>{locationDisplay}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>대표자</Text>
                <Text style={styles.infoValue}>{display.representativeName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>연락처</Text>
                <Text style={styles.infoValue}>{display.contactInfo}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>추가 정보</Text>
                <Text style={styles.infoValue}>{display.additionalInfo}</Text>
              </View>
            </Card>
          </>
        )}

        {!isLoading && !error ? (
          <View style={styles.actionRow}>
            {isManagerOrLeader ? (
              <>
                <Button variant="primary" size="lg" onPress={handleManagePress}>
                  클럽 관리
                </Button>
                <Button variant="outline" size="lg" onPress={handleOpenApplicationStatusPress} style={styles.actionGap}>
                  가입 신청 현황
                </Button>
              </>
            ) : isGeneralMember ? (
              <Button variant="outline" size="lg" onPress={handleOpenMemberListPress}>
                회원목록
              </Button>
            ) : isPendingApplicant ? (
              <Button variant="outline" size="lg" onPress={handleOpenJoinApplications}>
                가입 신청 내역 보기
              </Button>
            ) : (
              <Button variant="primary" size="lg" onPress={handleJoinPress} loading={isJoinSubmitting}>
                클럽 가입 신청
              </Button>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  heroCard: {
    marginBottom: tokens.spacing.md,
  },
  clubName: {
    fontSize: tokens.font.display,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  clubSubtitle: {
    fontSize: tokens.font.md,
    color: colors.neutral[600],
    marginBottom: tokens.spacing.sm2,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: tokens.spacing.sm2,
  },
  metaText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    marginLeft: tokens.spacing.xxs,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primary[50],
    marginRight: tokens.spacing.xs2,
  },
  badgeAccent: {
    backgroundColor: colors.success[50],
  },
  badgeText: {
    fontSize: tokens.font.xs,
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateText: {
    marginLeft: tokens.spacing.xs2,
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  sectionCard: {
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: { ...base.sectionTitleMd, marginBottom: tokens.spacing.xs2 },
  sectionText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: tokens.padding.xs2,
  },
  infoLabel: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: tokens.font.sm,
    color: colors.neutral[800],
    fontWeight: tokens.fontWeight.semibold,
  },
  actionRow: {
    marginTop: tokens.spacing.xs2,
  },
  actionGap: {
    marginTop: tokens.spacing.sm2,
  },
  errorText: base.textSmError,
});
