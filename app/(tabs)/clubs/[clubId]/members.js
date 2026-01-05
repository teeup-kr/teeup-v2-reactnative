import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ScreenHeader from '../../../../src/components/ui/ScreenHeader';
import Card from '../../../../src/components/ui/Card';
import { colors } from '../../../../src/theme/colors';
import { clubsApi } from '../../../../src/lib/clubsApi';

const statusColors = {
  ACTIVE: colors.success[600],
  PENDING: colors.warning[600],
};

export default function ClubMemberManageScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMembers = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubMembers(resolvedId, { page: 1, limit: 50 });
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : response?.items || [];
        setMembers(Array.isArray(list) ? list : []);
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

  const summaryText = useMemo(() => {
    const total = members.length;
    const pending = members.filter((member) => {
      const status = member?.status || member?.membership_status;
      return status === 'PENDING' || status === 'WAITING';
    }).length;
    return `총 ${total}명 · 승인 대기 ${pending}명`;
  }, [members]);

  const normalizedMembers = useMemo(() => (
    members.map((member) => ({
      id: member?.id || member?.member_id || member?.user_id,
      name:
        member?.user?.name ||
        member?.user?.realname ||
        member?.user?.nickname ||
        member?.name ||
        member?.nickname ||
        '-',
      role: member?.role || member?.membership_role || '-',
      status: member?.status || member?.membership_status || 'ACTIVE',
    }))
  ), [members]);

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
                    { backgroundColor: statusColors[member.status] || colors.neutral[400] },
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
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 4,
  },
  stateRow: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  memberRole: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  actionButtonText: {
    fontSize: 11,
    color: colors.neutral[700],
  },
});
