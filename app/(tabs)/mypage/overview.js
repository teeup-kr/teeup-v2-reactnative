import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '../../../src/components/ui/Card';
import { usersApi } from '../../../src/lib/api';
import { clubsApi } from '../../../src/lib/clubsApi';
import { colors } from '../../../src/theme/colors';
import AppHeader from '../../../src/components/layout/AppHeader';
import AppFooter from '../../../src/components/layout/AppFooter';
import { formatProfileDate, getGenderLabel } from '../../../src/lib/mypageUtils';
import { extractData, extractList } from '../../../src/lib/responseUtils';

export default function OverviewScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [handicapInfo, setHandicapInfo] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getMyProfile();
      const user = extractData(response);
      setProfile(user);
      if (user?.id) {
        const handicapResponse = await usersApi.getUserHandicap(user.id);
        setHandicapInfo(extractData(handicapResponse));
      }
    } catch (fetchError) {
      console.error('프로필 조회 실패:', fetchError);
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClubs = useCallback(async () => {
    try {
      setClubsLoading(true);
      const response = await clubsApi.getMyClubs({ page: 1, limit: 3 });
      const items = extractList(response);
      setClubs(items);
    } catch (fetchError) {
      console.error('클럽 목록 조회 실패:', fetchError);
      setClubs([]);
    } finally {
      setClubsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchClubs();
  }, [fetchProfile, fetchClubs]);

  const handicapDisplay = useMemo(() => {
    if (!profile) {
      return { value: '-', badge: null, description: null };
    }

    if (handicapInfo?.calculated_handicap !== null && handicapInfo?.calculated_handicap !== undefined) {
      const isAutoCalculated = handicapInfo?.handicap_calculation_count >= 1;
      return {
        value: handicapInfo.calculated_handicap.toFixed(1),
        badge: isAutoCalculated ? '자동 계산됨' : null,
        description: isAutoCalculated
          ? `누적 평균으로 자동 계산됨 (${handicapInfo.handicap_calculation_count}회 기록)`
          : null,
      };
    }

    if (handicapInfo?.initial_handicap !== null && handicapInfo?.initial_handicap !== undefined) {
      return {
        value: handicapInfo.initial_handicap.toFixed(1),
        badge: null,
        description: '초기 핸디캡',
      };
    }

    if (profile?.handicap !== null && profile?.handicap !== undefined) {
      return {
        value: Number(profile.handicap).toFixed(1),
        badge: null,
        description: '기본 핸디캡',
      };
    }

    return { value: '-', badge: null, description: null };
  }, [profile, handicapInfo]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <AppHeader />
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
          <AppHeader />
          <View style={styles.stateContainer}>
            <FontAwesome5 name="info-circle" size={32} color={colors.error[500]} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <AppFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const infoItems = [
    { label: '실명', value: profile?.realname || '-' },
    { label: '닉네임', value: profile?.nickname || '-' },
    { label: '이메일', value: profile?.email || '-' },
    { label: '성별', value: getGenderLabel(profile?.gender) },
    { label: '생년월일', value: formatProfileDate(profile?.birthdate) },
    { label: '가입일', value: formatProfileDate(profile?.created_at) },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>기본 정보</Text>
          <View style={styles.infoGrid}>
            {infoItems.map((item) => (
              <View key={item.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>골프 정보</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>평균 타수</Text>
            <Text style={styles.infoValue}>
              {profile?.average_score !== null && profile?.average_score !== undefined
                ? `${profile.average_score}타`
                : '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>핸디캡</Text>
            <View>
              <View style={styles.handicapRow}>
                <Text style={styles.infoValue}>{handicapDisplay.value}</Text>
                {handicapDisplay.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{handicapDisplay.badge}</Text>
                  </View>
                ) : null}
              </View>
              {handicapDisplay.description ? (
                <Text style={styles.infoSubtext}>{handicapDisplay.description}</Text>
              ) : null}
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>소속 클럽</Text>
            <Pressable onPress={() => router.push('/clubs')}>
              <Text style={styles.linkText}>내 클럽 전체보기</Text>
            </Pressable>
          </View>
          {clubsLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
            </View>
          ) : clubs.length === 0 ? (
            <View style={styles.emptyClub}>
              <FontAwesome5 name="users" size={28} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>소속된 클럽이 없습니다.</Text>
              <Pressable onPress={() => router.push('/clubs')}>
                <Text style={styles.linkText}>클럽 찾아보기</Text>
              </Pressable>
            </View>
          ) : (
            clubs.map((club) => (
              <Pressable
                key={club.id}
                onPress={() => router.push(`/clubs/${club.id}`)}
                style={({ pressed }) => [styles.clubRow, pressed && styles.clubRowPressed]}
              >
                <View style={styles.clubIcon}>
                  <FontAwesome5 name="users" size={16} color={colors.primary[600]} />
                </View>
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{club.name}</Text>
                  <Text style={styles.clubMeta}>
                    {club.location || '-'} · 멤버 {club.member_count ?? '-'}명
                  </Text>
                  {club.my_role ? (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>
                        {club.my_role === 'LEADER'
                          ? '리더'
                          : club.my_role === 'MANAGER'
                            ? '매니저'
                            : club.my_role === 'MEMBER'
                              ? '멤버'
                              : club.my_role}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
              </Pressable>
            ))
          )}
        </Card>
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
    textAlign: 'center',
    marginTop: 8,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  infoSubtext: {
    marginTop: 4,
    fontSize: 11,
    color: colors.neutral[500],
  },
  handicapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: colors.primary[700],
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
  },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyClub: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  clubRowPressed: {
    backgroundColor: colors.primary[50],
  },
  clubIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  clubMeta: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 10,
    color: colors.primary[700],
    fontWeight: '600',
  },
});
