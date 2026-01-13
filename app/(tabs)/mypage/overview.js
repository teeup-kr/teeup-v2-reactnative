import {
FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback,
useEffect,
useMemo,
useState } from 'react';
import {
  ActivityIndicator,
Pressable,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppFooter from '@/components/layout/AppFooter';
import Card from '@/components/ui/Card';
import { usersApi } from '@/lib/api';
import { clubsApi } from '@/lib/clubsApi';
import { formatProfileDate, getGenderLabel } from '@/lib/mypageUtils';
import { extractData, extractList } from '@/lib/responseUtils';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/tabs/mypage/overview';

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
      return { value: '-', badge: null, description: null, type: 'none' };
    }

    const hasCalculated =
      handicapInfo?.calculated_handicap != null &&
      handicapInfo?.handicap_calculation_count >= 1;

    if (hasCalculated) {
      return {
        value: handicapInfo.calculated_handicap.toFixed(1),
        badge: '자동 계산됨',
        description: `누적 평균으로 자동 계산됨 (${handicapInfo.handicap_calculation_count}회 기록)`,
        type: 'calculated',
      };
    }

    if (handicapInfo?.initial_handicap != null) {
      return {
        value: handicapInfo.initial_handicap.toFixed(1),
        badge: null,
        description: '초기 핸디캡',
        type: 'initial', // ✅ 핵심
      };
    }

    if (profile?.handicap != null) {
      return {
        value: Number(profile.handicap).toFixed(1),
        badge: null,
        description: '기본 핸디캡',
        type: 'base',
      };
    }

    return { value: '-', badge: null, description: null, type: 'none' };
  }, [profile, handicapInfo]);

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

  const infoItems = [
    { label: '실명', value: profile?.realname || '-' },
    { label: '닉네임', value: profile?.nickname || '-' },
    { label: '이메일', value: profile?.email || '-' },
    { label: '성별', value: getGenderLabel(profile?.gender) },
    { label: '생년월일', value: formatProfileDate(profile?.birthdate) },
    { label: '가입일', value: formatProfileDate(profile?.created_at) },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 기본 정보 */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>기본 정보</Text>

        {infoItems.map(item => (
          <View key={item.label} style={[styles.row]}>
            <FontAwesome5
              name={
                item.label === '이메일' ? 'envelope' :
                  item.label === '성별' ? 'venus-mars' :
                    item.label === '생년월일' ? 'calendar-alt' :
                      item.label === '가입일' ? 'calendar-check' :
                        'user-alt'
              }
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
        <View style={styles.row}>
          <FontAwesome5 name="golf-ball" size={14} color={colors.neutral[500]} style={styles.icon} />
          <View style={styles.rowContent}>
            <Text style={styles.infoLabel}>평균 타수</Text>
            <Text style={styles.infoValue}>
              {profile?.average_score != null ? `${profile.average_score}타` : '-'}
            </Text>
          </View>
        </View>

        {/* 핸디캡 */}
        <View style={styles.row}>
          <FontAwesome5
            name="chart-line"
            size={14}
            color={colors.neutral[500]}
            style={styles.icon}
          />
          <View style={styles.rowContent}>
            <Text style={styles.infoLabel}>
              {handicapDisplay.type === 'initial' ? '초기 핸디캡' : '핸디캡'}
            </Text>
            <Text style={styles.infoValue}>
              {handicapDisplay.value}
            </Text>
          </View>
        </View>

      </Card>

      {/* 소속 클럽 */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>소속 클럽</Text>
          <Pressable onPress={() => router.push('/clubs')}>
            <Text style={styles.linkText}>내 클럽 전체보기</Text>
          </Pressable>
        </View>

        {clubs.map(club => (
          <Pressable
            key={club.id}
            onPress={() => router.push(`/clubs/${club.id}`)}
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

      <AppFooter />
    </ScrollView >
  );
}
