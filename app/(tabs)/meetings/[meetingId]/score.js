import { StyleSheet } from 'react-native';
import { tokens } from '@/styles/style';

import {
useLocalSearchParams } from 'expo-router';
import { useEffect,
useMemo,
useState } from 'react';
import { ActivityIndicator,
ScrollView,
Text,
TextInput,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { roundsApi } from '@/lib/api';
import { extractList } from '@/lib/responseUtils';

export default function ScoreInputScreen() {
  const { meetingId } = useLocalSearchParams();
  const resolvedId = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadParticipants = async () => {
      if (!resolvedId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError('');
        const response = await roundsApi.getRoundParticipants(resolvedId);
        const list = extractList(response);
        setParticipants(list);
      } catch (fetchError) {
        console.error('참가자 조회 실패:', fetchError);
        setError(fetchError?.message || '참가자를 불러오는데 실패했습니다.');
        setParticipants([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipants();
  }, [resolvedId]);

  const players = useMemo(() => (
    participants.map((participant) => ({
      id: participant?.id || participant?.participant_id || participant?.user_id,
      name:
        participant?.user?.name ||
        participant?.user?.realname ||
        participant?.user?.nickname ||
        participant?.name ||
        participant?.nickname ||
        '-',
      score:
        participant?.score ??
        participant?.total_score ??
        participant?.simple_score ??
        participant?.average_score ??
        '',
    }))
  ), [participants]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="스코어 입력" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>참가자 스코어</Text>
          <Text style={styles.sectionSubtitle}>모임 ID: {resolvedId || meetingId}</Text>

          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={tokens.colors.primary[600]} />
              <Text style={styles.stateText}>참가자를 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : players.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>표시할 참가자가 없습니다.</Text>
            </View>
          ) : (
            players.map((player) => (
              <View key={player.id} style={styles.row}>
                <Text style={styles.name}>{player.name}</Text>
                <TextInput
                  placeholder="타수"
                  style={styles.input}
                  defaultValue={player.score ? String(player.score) : ''}
                  keyboardType="numeric"
                  placeholderTextColor={tokens.colors.neutral[400]}
                />
              </View>
            ))
          )}
        </Card>

        <Button variant="primary" size="lg">
          스코어 저장
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: tokens.colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: 11,
    color: tokens.colors.neutral[500],
    marginTop: 4,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    flex: 1,
    fontSize: 13,
    color: tokens.colors.neutral[700],
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderColor: tokens.colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
    color: tokens.colors.neutral[900],
  },
  stateRow: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    marginTop: 6,
    fontSize: 12,
    color: tokens.colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: tokens.colors.error[600],
  },
});
