import {
useLocalSearchParams,
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

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/clubsApi';
import { extractData } from '@/lib/responseUtils';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/tabs/clubs/clubId/regulations/regulationId';

export default function ClubRegulationDetailScreen() {
  const router = useRouter();
  const { clubId, regulationId } = useLocalSearchParams();
  const resolvedClubId = Array.isArray(clubId) ? clubId[0] : clubId;
  const resolvedRegulationId = Array.isArray(regulationId) ? regulationId[0] : regulationId;
  const [regulation, setRegulation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRegulation = async () => {
      if (!resolvedClubId || !resolvedRegulationId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await clubsApi.getClubRegulation(resolvedClubId, resolvedRegulationId);
        const data = extractData(response);
        setRegulation(data);
      } catch (fetchError) {
        console.error('클럽 규정 상세 조회 실패:', fetchError);
        setError(fetchError?.message || '규정을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRegulation();
  }, [resolvedClubId, resolvedRegulationId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="규정 상세" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>규정을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <>
              <Text style={styles.title}>{regulation?.title || '규정'}</Text>
              <Text style={styles.meta}>
                마지막 업데이트{' '}
                {regulation?.updated_at
                  ? regulation.updated_at.slice(0, 10)
                  : regulation?.created_at
                    ? regulation.created_at.slice(0, 10)
                    : '-'}
              </Text>
              <Text style={styles.body}>{regulation?.content || '등록된 내용이 없습니다.'}</Text>
            </>
          )}
        </Card>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/clubs/${resolvedClubId || clubId}/regulations/create`)}
        >
          <Text style={styles.editButtonText}>수정하기</Text>
        </Pressable>
        <Text style={styles.helperText}>규정 수정 화면은 동일한 작성 화면으로 연결됩니다.</Text>
        <Text style={styles.helperText}>Regulation ID: {resolvedRegulationId || regulationId}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

