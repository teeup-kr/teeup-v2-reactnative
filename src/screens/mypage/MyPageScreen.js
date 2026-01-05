import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Card from '../../components/ui/Card';
import { authApi } from '../../lib/authApi';
import { usersApi } from '../../lib/api';
import { colors } from '../../theme/colors';

const quickLinks = [
  {
    id: 'overview',
    label: '개요',
    description: '기본 정보와 핸디캡 요약',
    icon: 'id-card',
    href: '/mypage/overview',
  },
  {
    id: 'meetings',
    label: '내 참여내역',
    description: '참여한 모임 일정과 상태',
    icon: 'calendar-check',
    href: '/mypage/meetings',
  },
  {
    id: 'records',
    label: '기록 관리',
    description: '라운딩 기록과 통계 확인',
    icon: 'clipboard-list',
    href: '/mypage/records',
  },
  {
    id: 'notifications',
    label: '알림',
    description: '공지 및 모임 소식을 확인',
    icon: 'bell',
    href: '/mypage/notifications',
  },
];

const settingsLinks = [
  {
    id: 'edit',
    label: '회원정보 수정',
    description: '프로필과 연락처를 관리하세요',
    icon: 'user-edit',
    href: '/mypage/edit',
  },
  {
    id: 'password',
    label: '비밀번호 변경',
    description: '비밀번호를 안전하게 업데이트',
    icon: 'lock',
    href: '/mypage/change-password',
  },
  {
    id: 'withdraw',
    label: '회원탈퇴',
    description: '계정 탈퇴 전에 확인하세요',
    icon: 'user-slash',
    href: '/mypage/withdraw',
  },
];

export default function MyPageScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [meetingTotal, setMeetingTotal] = useState(null);
  const [recordTotal, setRecordTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  const heroGradient = ['#059669', '#0F766E'];

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, meetingsRes, recordsRes] = await Promise.all([
        usersApi.getMyProfile(),
        usersApi.getMyMeetings({ page: 1, limit: 1 }),
        usersApi.getMyRoundingMeetings({ page: 1, limit: 1 }),
      ]);

      setProfile(profileRes?.data || profileRes || null);

      const meetingsPayload = meetingsRes?.data ? meetingsRes : { data: meetingsRes };
      const meetingsTotal = meetingsPayload?.total ?? meetingsPayload?.total_count ?? meetingsPayload?.count ?? null;
      setMeetingTotal(meetingsTotal);

      const recordsPayload = recordsRes?.data ? recordsRes : { data: recordsRes };
      const recordsTotal = recordsPayload?.total ?? recordsPayload?.total_count ?? recordsPayload?.count ?? null;
      setRecordTotal(recordsTotal);
    } catch (error) {
      console.error('마이페이지 요약 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const summaryStats = useMemo(() => {
    return [
      { label: '핸디캡', value: profile?.handicap !== null && profile?.handicap !== undefined ? Number(profile.handicap).toFixed(1) : '-' },
      { label: '참여 모임', value: meetingTotal ?? '-' },
      { label: '기록 수', value: recordTotal ?? '-' },
    ];
  }, [meetingTotal, profile, recordTotal]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.replace('/login');
    } catch (error) {
      Alert.alert('오류', '로그아웃에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Image
                source={require('../../../assets/teeuplink-logo.png')}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{profile?.realname || '사용자'}</Text>
              <Text style={styles.heroNickname}>{profile?.nickname || '-'}</Text>
              <Text style={styles.heroEmail}>{profile?.email || '-'}</Text>
            </View>
          </View>

          <View style={styles.membershipBadge}>
            <FontAwesome5 name="crown" size={12} color={colors.white} />
            <Text style={styles.membershipText}>{profile?.membership || '일반 멤버'}</Text>
          </View>

          <View style={styles.heroStats}>
            {summaryStats.map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.heroStatItem,
                  index !== summaryStats.length - 1 && styles.heroStatDivider,
                ]}
              >
                <Text style={styles.heroStatValue}>{item.value}</Text>
                <Text style={styles.heroStatLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.push('/mypage/overview')}
            style={styles.heroAction}
          >
            <Text style={styles.heroActionText}>내 프로필 더보기</Text>
            <FontAwesome5 name="arrow-right" size={14} color={colors.white} />
          </Pressable>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 이동</Text>
          <View style={styles.menuCard}>
            {quickLinks.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                  index !== quickLinks.length - 1 && styles.menuItemDivider,
                ]}
              >
                <View style={styles.menuIconWrap}>
                  <FontAwesome5 name={item.icon} size={16} color={colors.primary[600]} />
                </View>
                <View style={styles.menuTextGroup}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
          <Card style={styles.settingsCard}>
            {settingsLinks.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.settingsItem,
                  pressed && styles.menuItemPressed,
                  index !== settingsLinks.length - 1 && styles.menuItemDivider,
                ]}
              >
                <View style={styles.settingsIcon}>
                  <FontAwesome5 name={item.icon} size={14} color={colors.neutral[600]} />
                </View>
                <View style={styles.settingsTextGroup}>
                  <Text style={styles.settingsLabel}>{item.label}</Text>
                  <Text style={styles.settingsDescription}>{item.description}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
              </Pressable>
            ))}
          </Card>
        </View>

        <View style={styles.logoutSection}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>
        </View>
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
  },
  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: 34,
    height: 34,
  },
  heroInfo: {
    flex: 1,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  heroNickname: {
    fontSize: 14,
    color: '#D1FAE5',
    marginTop: 2,
  },
  heroEmail: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 4,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  membershipText: {
    marginLeft: 6,
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  heroStatLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#D1FAE5',
  },
  heroAction: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroActionText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  menuItemPressed: {
    backgroundColor: colors.neutral[100],
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextGroup: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  menuDescription: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
  settingsCard: {
    padding: 0,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingsIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsTextGroup: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  settingsDescription: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
  logoutSection: {
    marginTop: 8,
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error[600],
  },
});
