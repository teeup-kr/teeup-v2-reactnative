
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView, StyleSheet, Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import {
  createFetchRegulationsHandler,
  createRegulationEditHandler,
  createRegulationPressHandler,
} from '@/lib/render/clubs';
import { normalizeClubRegulations } from '@/lib/util/clubUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';





export default function ClubRegulationsScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [regulations, setRegulations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRegulations = useMemo(
    () =>
      createFetchRegulationsHandler({
        clubId: resolvedId,
        fetchClubRegulations: clubsApi.getClubRegulations,
        extractList,
        setRegulations,
        setIsLoading,
        setError,
      }),
    [resolvedId, setRegulations, setIsLoading, setError]
  );

  useEffect(() => {
    loadRegulations();
  }, [loadRegulations]);

  const normalizedRegulations = useMemo(
    () => normalizeClubRegulations(regulations),
    [regulations]
  );

  const handleRegulationPress = useMemo(
    () =>
      createRegulationPressHandler({
        router,
        clubId: resolvedId || clubId,
      }),
    [router, resolvedId, clubId]
  );

  const regulationItems = useMemo(
    () =>
      normalizedRegulations.map((item) => ({
        ...item,
        onPress: () => handleRegulationPress(item.id),
      })),
    [normalizedRegulations, handleRegulationPress]
  );

  const handleCreatePress = useMemo(
    () => createRegulationEditHandler({ router, clubId: resolvedId || clubId }),
    [router, resolvedId, clubId]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 규정" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.subtitle}>클럽 운영 규정을 확인하세요.</Text>
          <Button variant="primary" size="sm" onPress={handleCreatePress}>
            규정 작성
          </Button>
        </View>

        <Card style={styles.listCard}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>규정을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : regulationItems.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 규정이 없습니다.</Text>
            </View>
          ) : (
            regulationItems.map((item) => (
              <Pressable
                key={item.id}
                style={styles.listRow}
                onPress={item.onPress}
              >
                <View style={styles.listIcon}>
                  <FontAwesome5 name="file-alt" size={14} color={colors.primary[600]} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{item.title}</Text>
                  <Text style={styles.listDate}>업데이트: {item.updated}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
              </Pressable>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  subtitle: base.textSmMuted,
  listCard: {
    paddingVertical: tokens.padding.xxs,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
  },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.sm2,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  listDate: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
});
