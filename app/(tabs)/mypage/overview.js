
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppFooter from '@/components/layout/AppFooter';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import { mypageApi } from '@/lib/api/api';
import {
  createFetchClubsHandler,
  createFetchProfileHandler,
  createOpenClubDetailHandler,
  createOpenClubsHandler,
} from '@/lib/handler/mypage';
import {
  buildProfileInfoItems,
  formatProfileDate,
  getAverageScoreDisplay,
  getGenderLabel,
  getHandicapDisplay,
  getHandicapDisplayInfo,
  getProfileInfoIconName
} from '@/lib/util/mypageUtils';
import { extractData, extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function OverviewScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [handicapInfo, setHandicapInfo] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useMemo(
    () =>
      createFetchProfileHandler({
        fetchMyProfile: mypageApi.fetchMyProfile,
        fetchUserHandicap: mypageApi.fetchUserHandicap,
        extractData,
        setProfile,
        setHandicapInfo,
        setLoading,
        setError,
      }),
    [setError, setHandicapInfo, setLoading, setProfile],
  );
  const averageScoreDisplay = useMemo(
    () => getAverageScoreDisplay(profile),
    [profile]
  );

  const handicapDisplayInfo = useMemo(
    () => getHandicapDisplayInfo(profile),
    [profile]
  );

  const fetchClubs = useMemo(
    () =>
      createFetchClubsHandler({
        fetchMyClubs: mypageApi.fetchMyClubs,
        extractList,
        setClubs,
      }),
    [setClubs],
  );

  useEffect(() => {
    fetchProfile();
    fetchClubs();
  }, [fetchProfile, fetchClubs]);

  const handicapDisplay = useMemo(() => {
    return getHandicapDisplay(profile, handicapInfo);
  }, [handicapInfo, profile]);

  const infoItems = useMemo(() => {
    return buildProfileInfoItems(profile, { formatProfileDate, getGenderLabel });
  }, [profile]);

  const handleOpenClubs = useMemo(
    () => createOpenClubsHandler(router),
    [router],
  );

  const createOpenClub = useMemo(
    () => (clubId) => createOpenClubDetailHandler(router, clubId),
    [router],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/');
  }, [logout, router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <Text style={styles.stateText}>로딩 중...</Text>
          </View>
          <AppFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.stateContainer}>
            <FontAwesome5 name="info-circle" size={32} color={colors.error[500]} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <AppFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 기본 정보 */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>기본 정보</Text>

        {infoItems.map(item => (
          <View key={item.label} style={[styles.row]}>
            <FontAwesome5
              name={getProfileInfoIconName(item.label)}
              size={14}
              color={colors.neutral[500]}
              style={styles.icon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* 골프 정보 */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>골프 정보</Text>

        {/* 평균 타수 */}
        {averageScoreDisplay && (
          <View style={styles.row}>
            <FontAwesome5
              name="golf-ball"
              size={14}
              color={colors.neutral[500]}
              style={styles.icon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>
                {averageScoreDisplay.label}
              </Text>
              <Text style={styles.infoValue}>
                {averageScoreDisplay.value}
              </Text>
            </View>
          </View>
        )}
        {handicapDisplayInfo && (
          <View style={styles.row}>
            <FontAwesome5
              name="chart-line"
              size={14}
              color={colors.neutral[500]}
              style={styles.icon}
            />
            <View style={styles.rowContent}>
              <Text style={styles.infoLabel}>
                {handicapDisplayInfo.label}
              </Text>
              <Text style={styles.infoValue}>
                {handicapDisplayInfo.value}
              </Text>
            </View>
          </View>
        )}

      </Card>

      {/* 소속 클럽 */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>소속 클럽</Text>
          <Pressable onPress={handleOpenClubs}>
            <Text style={styles.linkText}>내 클럽 전체보기</Text>
          </Pressable>
        </View>

        {clubs.map(club => (
          <Pressable
            key={club.id}
            onPress={createOpenClub(club.id)}
            style={({ pressed }) => [
              styles.clubRow,
              pressed && styles.clubRowPressed,
            ]}
          >
            <View style={styles.clubIcon}>
              <FontAwesome5 name="users" size={16} color={colors.primary[600]} />
            </View>

            <View style={styles.clubInfo}>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubMeta}>
                {club.location || '-'} · 멤버 {club.member_count ?? '-'}명
              </Text>

              {club.my_role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {club.my_role === 'LEADER' ? '리더' :
                      club.my_role === 'MANAGER' ? '매니저' :
                        '멤버'}
                  </Text>
                </View>
              )}
            </View>

            <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
          </Pressable>
        ))}
      </Card>

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutBtnText}>로그아웃</Text>
      </Pressable>

      <AppFooter />
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  card: {
    marginBottom: tokens.spacing.md,
  },
  cardTitle: { ...base.cardTitle, marginBottom: tokens.spacing.sm2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: tokens.spacing.sm2,
  },
  rowContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    marginBottom: tokens.spacing.hairline,
  },
  infoValue: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[900],
  },
  infoSubtext: {
    marginTop: tokens.spacing.xxs,
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
  },
  handicapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.micro,
    borderRadius: tokens.radius.md,
  },
  badgeText: {
    fontSize: tokens.font.xxs,
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  cardHeader: { ...base.rowBetween, marginBottom: tokens.spacing.xs2 },
  linkText: {
    fontSize: tokens.font.sm,
    color: colors.primary[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: tokens.radius.baseLg,
    padding: tokens.padding.sm,
    marginTop: tokens.spacing.sm,
  },
  clubRowPressed: {
    backgroundColor: colors.primary[50],
  },
  clubIcon: {
    width: 42,
    height: 42,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
  },
  clubMeta: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xxs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: tokens.spacing.xs,
    backgroundColor: colors.primary[50],
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.micro,
    borderRadius: tokens.radius.md,
  },
  roleBadgeText: {
    fontSize: tokens.font.xxs,
    color: colors.primary[700],
    fontWeight: tokens.fontWeight.semibold,
  },
  logoutBtn: {
    marginTop: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    paddingVertical: tokens.padding.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    backgroundColor: colors.white,
  },
  logoutBtnPressed: {
    backgroundColor: colors.neutral[100],
  },
  logoutBtnText: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[600],
  },
});
