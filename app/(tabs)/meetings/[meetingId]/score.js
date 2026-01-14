import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { meetingsApi } from '@/lib/api/api';
import { createFetchParticipantsHandler } from '@/lib/render/meetings';
import { normalizePlayers } from '@/lib/util/meetingUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export default function ScoreInputScreen() {
  const { meetingId } = useLocalSearchParams();
  const resolvedId = Array.isArray(meetingId) ? meetingId[0] : meetingId;
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadParticipants = useMemo(
    () =>
      createFetchParticipantsHandler({
        meetingId: resolvedId,
        fetchRoundParticipants: meetingsApi.fetchRoundParticipants,
        extractList,
        setParticipants,
        setIsLoading,
        setError,
      }),
    [resolvedId, setParticipants, setIsLoading, setError]
  );

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const players = useMemo(() => normalizePlayers(participants), [participants]);

  const renderPlayerRow = useCallback(function renderPlayerRow(player) {
    return (
      <View key={player.id} style={styles.row}>
        <Text style={styles.name}>{player.name}</Text>
        <TextInput
          placeholder="타수"
          style={styles.input}
          defaultValue={player.score ? String(player.score) : ''}
          keyboardType="numeric"
          placeholderTextColor={colors.neutral[400]}
        />
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="스코어 입력" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>참가자 스코어</Text>
          <Text style={styles.sectionSubtitle}>모임 ID: {resolvedId || meetingId}</Text>

          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
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
            players.map(renderPlayerRow)
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
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  card: {
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: base.sectionTitleMd,
  sectionSubtitle: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xxs,
    marginBottom: tokens.spacing.sm2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  name: {
    flex: 1,
    fontSize: tokens.font.md,
    color: colors.neutral[700],
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.xs2,
    textAlign: 'center',
    color: colors.neutral[900],
  },
  stateRow: {
    paddingVertical: tokens.padding.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: base.stateText,
  errorText: base.textSmError,
});
