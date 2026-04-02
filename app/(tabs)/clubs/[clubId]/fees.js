import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import { createFetchFeesHandler, createFeeCreateHandler, createFeePressHandler } from '@/lib/handler/clubs';
import { normalizeFeeItem } from '@/lib/util/clubUtils';
import { extractData, extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const CAN_MANAGE_ROLES = ['LEADER', 'MANAGER'];

export default function ClubFeesScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;
  const [fees, setFees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [canManage, setCanManage] = useState(false);

  const loadRole = useCallback(async () => {
    if (!resolvedId) return;
    try {
      const club = extractData(await clubsApi.getClub(resolvedId));
      const role = club?.membership_role || club?.my_role;
      setCanManage(CAN_MANAGE_ROLES.includes(String(role).toUpperCase()));
    } catch {
      setCanManage(false);
    }
  }, [resolvedId]);

  const loadFees = useMemo(
    () =>
      createFetchFeesHandler({
        clubId: resolvedId,
        fetchClubFees: clubsApi.getClubFees,
        extractList,
        setFees,
        setIsLoading,
        setError,
      }),
    [resolvedId, setFees, setIsLoading, setError]
  );

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const normalizedFees = useMemo(() => fees.map(normalizeFeeItem), [fees]);
  const handleCreatePress = useMemo(
    () => createFeeCreateHandler({ router, clubId: resolvedId }),
    [router, resolvedId]
  );
  const handleFeePress = useMemo(
    () => createFeePressHandler({ router, clubId: resolvedId }),
    [router, resolvedId]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="회비 관리" />
      <ScrollView contentContainerStyle={styles.container}>
        {canManage && (
          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>회비 항목을 관리하세요.</Text>
            <Button variant="primary" size="sm" onPress={handleCreatePress}>
              회비 등록
            </Button>
          </View>
        )}

        <View style={styles.list}>
          {isLoading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.primary[600]} />
              <Text style={styles.stateText}>회비 내역을 불러오는 중...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateRow}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : normalizedFees.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>등록된 회비 내역이 없습니다.</Text>
            </View>
          ) : (
            normalizedFees.map((fee) => (
              <Pressable
                key={fee.id}
                onPress={canManage ? handleFeePress(fee.id) : undefined}
                style={({ pressed }) => [styles.feeCardWrap, canManage && pressed && styles.feeCardPressed]}
              >
                <Card style={styles.feeCard}>
                  <View style={styles.feeRow}>
                    <View style={styles.feeInfo}>
                      <Text style={styles.feeTitle}>{fee.title}</Text>
                      <Text style={styles.feeAmount}>{fee.amount}</Text>
                      <Text style={styles.feeStatus}>{fee.status}</Text>
                    </View>
                    {canManage && (
                      <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
                    )}
                  </View>
                </Card>
              </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm2,
  },
  subtitle: base.textSmMuted,
  list: {
    marginBottom: tokens.spacing.md,
  },
  feeCardWrap: {
    marginBottom: tokens.spacing.sm2,
  },
  feeCardPressed: {
    opacity: 0.7,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeInfo: {
    flex: 1,
  },
  stateRow: base.stateRow,
  stateText: base.stateText,
  errorText: base.textSmError,
  feeCard: {
    marginBottom: tokens.spacing.sm2,
  },
  feeTitle: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  feeAmount: {
    fontSize: tokens.font.title,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginTop: tokens.spacing.xs,
  },
  feeStatus: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xxs,
  },
});
