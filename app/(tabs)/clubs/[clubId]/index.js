import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import ScreenHeader from '../../../../src/components/ui/ScreenHeader';
import Button from '../../../../src/components/ui/Button';
import Card from '../../../../src/components/ui/Card';
import { colors } from '../../../../src/theme/colors';
import { clubsApi } from '../../../../src/lib/clubsApi';

const typeLabel = {
  REGULAR: '정기 모임',
  IRREGULAR: '비정기 모임',
};

const statusLabel = {
  APPROVED: '활성',
  ACTIVE: '활성',
  PENDING: '승인 대기',
  REJECTED: '반려',
  CANCELED: '취소',
};

export default function ClubDetailScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClub = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClub(resolvedId);
        const data = response?.data || response || null;
        setClub(data);
      } catch (fetchError) {
        console.error('클럽 상세 조회 실패:', fetchError);
        setError(fetchError?.message || '클럽 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadClub();
  }, [resolvedId]);

  const clubStatusLabel = useMemo(() => {
    const status = club?.status || club?.membership_status;
    return statusLabel[status] || status || '-';
  }, [club]);

  const clubTypeLabel = useMemo(() => {
    const type = club?.type;
    return typeLabel[type] || type || '모임';
  }, [club]);

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
              <Text style={styles.clubName}>{club?.name || '클럽명 없음'}</Text>
              <Text style={styles.clubSubtitle}>{club?.description || club?.additional_info || '-'}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>{club?.location || '-'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="users" size={12} color={colors.neutral[500]} />
                  <Text style={styles.metaText}>멤버 {club?.member_count ?? '-'}명</Text>
                </View>
              </View>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{clubTypeLabel}</Text>
                </View>
                <View style={[styles.badge, styles.badgeAccent]}>
                  <Text style={styles.badgeText}>{clubStatusLabel}</Text>
                </View>
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>클럽 소개</Text>
              <Text style={styles.sectionText}>
                {club?.description || club?.additional_info || '등록된 소개가 없습니다.'}
              </Text>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>운영 정보</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>대표자</Text>
                <Text style={styles.infoValue}>{club?.representative_name || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>연락처</Text>
                <Text style={styles.infoValue}>{club?.contact_info || '-'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>추가 정보</Text>
                <Text style={styles.infoValue}>{club?.additional_info || '-'}</Text>
              </View>
            </Card>
          </>
        )}

        <View style={styles.actionRow}>
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.push(`/clubs/${resolvedId || clubId}/manage`)}
          >
            클럽 관리
          </Button>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>가입 신청</Text>
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
  heroCard: {
    marginBottom: 16,
  },
  clubName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  clubSubtitle: {
    fontSize: 13,
    color: colors.neutral[600],
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.neutral[600],
    marginLeft: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    marginRight: 8,
  },
  badgeAccent: {
    backgroundColor: colors.success[50],
  },
  badgeText: {
    fontSize: 11,
    color: colors.primary[700],
    fontWeight: '600',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.neutral[500],
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  infoValue: {
    fontSize: 12,
    color: colors.neutral[800],
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});
