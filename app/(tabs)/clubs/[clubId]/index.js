import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { fetchClubDetail } from '@/lib/api/clubs';
import { createFetchClubDetailHandler, createJoinRequestHandler, createOpenManageHandler } from '@/lib/render/clubs/detail';
import { extractData } from '@/lib/responseUtils';
import { buildClubDetailDisplay } from '@/lib/value/clubDetail';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function ClubDetailScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClub = useMemo(
    () =>
      createFetchClubDetailHandler({
        clubId: resolvedId,
        fetchClubDetail,
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

  const display = useMemo(() => buildClubDetailDisplay(club), [club]);
  const handleManagePress = useMemo(
    () => createOpenManageHandler({ clubId: resolvedId, router }),
    [resolvedId, router]
  );
  const handleJoinPress = useMemo(
    () => createJoinRequestHandler({ clubId: resolvedId, router }),
    [resolvedId, router]
  );

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
                  <Text style={styles.metaText}>{display.location}</Text>
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

        <View style={styles.actionRow}>
          <Button variant="primary" size="lg" onPress={handleManagePress}>
            클럽 관리
          </Button>
          <Pressable style={styles.secondaryButton} onPress={handleJoinPress}>
            <Text style={styles.secondaryButtonText}>가입 신청</Text>
          </Pressable>
        </View>
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
  secondaryButton: {
    ...base.btnOutline,
    marginTop: tokens.spacing.sm2,
  },
  secondaryButtonText: { ...base.btnOutlineText, fontSize: tokens.font.base },
  errorText: base.textSmError,
});
