import { StyleSheet } from 'react-native';
import { base, tokens } from '@/styles/style';

import {
FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams,
useRouter } from 'expo-router';
import { useEffect,
useState } from 'react';
import { ActivityIndicator,
Pressable,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubDetailStatusLabel, clubDetailTypeLabel } from '@/constants/clubConstants';
import { clubsApi } from '@/lib/clubsApi';
import { extractData } from '@/lib/responseUtils';

export default function ClubDetailScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClub = async () => {
      setError('');
      if (!resolvedId) {
        setClub(null);
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await clubsApi.getClub(resolvedId);
        const data = extractData(response);
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

  const clubStatus = club?.status || club?.membership_status;
  const clubStatusLabel = clubDetailStatusLabel[clubStatus] || clubStatus || '-';
  const clubType = club?.type;
  const clubTypeLabel = clubDetailTypeLabel[clubType] || clubType || '모임';
  const clubName = club?.name || '클럽명 없음';
  const clubDescription = club?.description || club?.additional_info;
  const clubSubtitle = clubDescription || '-';
  const clubIntro = clubDescription || '등록된 소개가 없습니다.';
  const location = club?.location || '-';
  const memberCount = club?.member_count ?? '-';
  const representativeName = club?.representative_name || '-';
  const contactInfo = club?.contact_info || '-';
  const additionalInfo = club?.additional_info || '-';

  const handleManagePress = () => {
    if (!resolvedId) {
      return;
    }
    router.push(`/clubs/${resolvedId}/manage`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <Card style={styles.heroCard}>
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={tokens.colors.primary[600]} />
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
              <Text style={styles.clubName}>{clubName}</Text>
              <Text style={styles.clubSubtitle}>{clubSubtitle}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="map-marker-alt" size={12} color={tokens.colors.neutral[500]} />
                  <Text style={styles.metaText}>{location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <FontAwesome5 name="users" size={12} color={tokens.colors.neutral[500]} />
                  <Text style={styles.metaText}>멤버 {memberCount}명</Text>
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
              <Text style={styles.sectionText}>{clubIntro}</Text>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>운영 정보</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>대표자</Text>
                <Text style={styles.infoValue}>{representativeName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>연락처</Text>
                <Text style={styles.infoValue}>{contactInfo}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>추가 정보</Text>
                <Text style={styles.infoValue}>{additionalInfo}</Text>
              </View>
            </Card>
          </>
        )}

        <View style={styles.actionRow}>
          <Button variant="primary" size="lg" onPress={handleManagePress}>
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
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  heroCard: {
    marginBottom: 16,
  },
  clubName: {
    fontSize: 20,
    fontWeight: '700',
    color: tokens.colors.neutral[900],
    marginBottom: 6,
  },
  clubSubtitle: {
    fontSize: 13,
    color: tokens.colors.neutral[600],
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
    color: tokens.colors.neutral[600],
    marginLeft: 4,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: tokens.colors.primary[50],
    marginRight: 8,
  },
  badgeAccent: {
    backgroundColor: tokens.colors.success[50],
  },
  badgeText: {
    fontSize: 11,
    color: tokens.colors.primary[700],
    fontWeight: '600',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stateText: {
    marginLeft: 8,
    fontSize: 12,
    color: tokens.colors.neutral[500],
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: { ...base.sectionTitleMd, marginBottom: 8 },
  sectionText: {
    fontSize: 12,
    color: tokens.colors.neutral[600],
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: tokens.colors.neutral[500],
  },
  infoValue: {
    fontSize: 12,
    color: tokens.colors.neutral[800],
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 8,
  },
  secondaryButton: {
    ...base.btnOutline,
    marginTop: 12,
  },
  secondaryButtonText: { ...base.btnOutlineText, fontSize: 14 },
  errorText: base.textSmError,
});
