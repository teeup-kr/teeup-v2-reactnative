import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import Card from '../../../src/components/ui/Card';
import Button from '../../../src/components/ui/Button';
import { colors } from '../../../src/theme/colors';
import { clubApi } from '../../../src/lib/api';
import { clubsApi } from '../../../src/lib/clubsApi';

const tabs = [
  { id: 'my', label: '내 클럽' },
  { id: 'all', label: '클럽 찾기' },
  { id: 'applications', label: '개설 신청' },
  { id: 'join', label: '가입 신청' },
];

const statusLabel = {
  ACTIVE: '활성',
  APPROVED: '승인',
  PENDING: '승인 대기',
  OPEN: '모집 중',
  REVIEW: '심사 중',
  WAITING: '가입 대기',
  REJECTED: '반려',
  CANCELED: '취소',
};

const statusColor = {
  ACTIVE: colors.success[600],
  APPROVED: colors.success[600],
  PENDING: colors.warning[600],
  OPEN: colors.primary[600],
  REVIEW: colors.accent[600],
  WAITING: colors.warning[600],
  REJECTED: colors.error[600],
  CANCELED: colors.neutral[500],
};

const ClubCard = ({ club, onPress }) => {
  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{club.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor[club.status] || colors.neutral[400] }]}
        >
          <Text style={styles.statusText}>{statusLabel[club.status] || club.status}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <FontAwesome5 name="map-marker-alt" size={12} color={colors.neutral[500]} />
          <Text style={styles.metaText}>{club.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <FontAwesome5 name="users" size={12} color={colors.neutral[500]} />
          <Text style={styles.metaText}>{club.members}명</Text>
        </View>
      </View>
      <Pressable style={styles.detailButton} onPress={onPress}>
        <Text style={styles.detailButtonText}>상세 보기</Text>
      </Pressable>
    </Card>
  );
};

export default function ClubsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('my');
  const [searchTerm, setSearchTerm] = useState('');
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const normalizeList = useCallback((payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.value)) return payload.value;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  }, []);

  const normalizeClub = useCallback((club) => ({
    id: club?.id || club?.club_id || club?.application_id || club?.name,
    name: club?.name || '클럽명 없음',
    location: club?.location || club?.region || '-',
    members: club?.member_count ?? club?.members ?? club?.memberCount ?? 0,
    status: club?.status || club?.membership_status || club?.application_status || 'PENDING',
  }), []);

  const loadClubs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      let response;
      if (activeTab === 'my') {
        response = await clubsApi.getMyClubs({ page: 1, limit: 20 });
      } else if (activeTab === 'all') {
        const search = searchTerm.trim();
        response = await clubsApi.getClubs({ page: 1, limit: 20, ...(search ? { search } : {}) });
      } else if (activeTab === 'applications') {
        response = await clubsApi.getMyClubApplications({ page: 1, limit: 20 });
      } else if (activeTab === 'join') {
        response = await clubApi.getClubApplications({ page: 1, limit: 20 });
      }
      const list = normalizeList(response);
      setClubs(list.map(normalizeClub));
    } catch (fetchError) {
      console.error('클럽 목록 조회 실패:', fetchError);
      setError(fetchError?.message || '클럽 목록을 불러오는데 실패했습니다.');
      setClubs([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, normalizeClub, normalizeList, searchTerm]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const filteredClubs = useMemo(() => {
    const list = clubs || [];
    if (!searchTerm.trim()) return list;
    return list.filter((club) => club.name.includes(searchTerm.trim()));
  }, [clubs, searchTerm]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>클럽</Text>
            <Text style={styles.subtitle}>내 모임과 클럽을 관리하세요</Text>
          </View>
          <Button variant="primary" size="sm" onPress={() => router.push('/clubs/register')}>
            클럽 만들기
          </Button>
        </View>

        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchBox}>
          <FontAwesome5 name="search" size={14} color={colors.neutral[400]} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="클럽 이름으로 검색"
            style={styles.searchInput}
            placeholderTextColor={colors.neutral[400]}
          />
        </View>

        <View style={styles.cardList}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>클럽을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="exclamation-circle" size={24} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : (
            <>
              {filteredClubs.map((club) => (
                <ClubCard key={club.id} club={club} onPress={() => router.push(`/clubs/${club.id}`)} />
              ))}
              {filteredClubs.length === 0 && (
                <View style={styles.emptyState}>
                  <FontAwesome5 name="exclamation-circle" size={24} color={colors.neutral[300]} />
                  <Text style={styles.emptyText}>표시할 클럽이 없습니다.</Text>
                </View>
              )}
            </>
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
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  subtitle: {
    fontSize: 12,
    color: colors.neutral[600],
    marginTop: 4,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    marginRight: 8,
    marginBottom: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  tabText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.neutral[900],
  },
  cardList: {
    marginTop: 16,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stateText: {
    marginLeft: 8,
    fontSize: 12,
    color: colors.neutral[500],
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  cardMeta: {
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
  detailButton: {
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.neutral[500],
  },
});
