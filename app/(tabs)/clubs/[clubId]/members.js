
import {
FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect,
useState } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator,
Pressable,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubMemberStatusColors } from '@/constants/clubConstants';
import { clubsApi } from '@/lib/clubsApi';
import { extractList } from '@/lib/responseUtils';
import { base, tokens } from '@/styles/style';
import { colors } from '@/theme/colors';
export default function ClubMemberManageScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMembers = async () => {
      setError('');
      if (!resolvedId) {
        setMembers([]);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await clubsApi.getClubMembers(resolvedId, { page: 1, limit: 50 });
        const list = extractList(response);
        setMembers(list);
      } catch (fetchError) {
        console.error('클럽 멤버 조회 실패:', fetchError);
        setError(fetchError?.message || '멤버 정보를 불러오는데 실패했습니다.');
        setMembers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMembers();
  }, [resolvedId]);

  const normalizedMembers = [];
  let pendingCount = 0;

  for (const member of members) {
    const status = member?.status || member?.membership_status || 'ACTIVE';
    if (status === 'PENDING' || status === 'WAITING') {
      pendingCount += 1;
    }

    normalizedMembers.push({
      id: member?.id || member?.member_id || member?.user_id,
      name:
        member?.user?.name ||
        member?.user?.realname ||
        member?.user?.nickname ||
        member?.name ||
        member?.nickname ||
        '-',
      role: member?.role || member?.membership_role || '-',
      status,
    });
  }

  const summaryText = `총 ${normalizedMembers.length}명 · 승인 대기 ${pendingCount}명`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="멤버 관리" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>멤버 현황</Text>
          <Text style={styles.summaryText}>{summaryText}</Text>
        </Card>

        <View style={styles.listCard}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>멤버를 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : normalizedMembers.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>표시할 멤버가 없습니다.</Text>
            </View>
          ) : (
            normalizedMembers.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.avatar}>
                  <FontAwesome5 name="user" size={14} color={colors.neutral[500]} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>{member.role}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: clubMemberStatusColors[member.status] || colors.neutral[400] },
                  ]}
                >
                  <Text style={styles.statusText}>{member.status}</Text>
                </View>
                <Pressable style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>관리</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  summaryCard: {
    marginBottom: tokens.spacing.md,
  },
  summaryTitle: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs,
  },
  summaryText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.lg,
    paddingVertical: tokens.padding.xxs,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  memberRole: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  statusBadge: {
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.xxs,
    borderRadius: tokens.radius.base,
    marginRight: tokens.spacing.xs2,
  },
  statusText: {
    fontSize: tokens.font.xxs,
    color: colors.white,
    fontWeight: tokens.fontWeight.semibold,
  },
  actionButton: {
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  actionButtonText: {
    fontSize: tokens.font.xs,
    color: colors.neutral[700],
  },
});