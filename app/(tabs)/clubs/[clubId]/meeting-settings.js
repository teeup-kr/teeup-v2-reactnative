import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const CAN_MANAGE_ROLES = ['LEADER', 'MANAGER'];

export default function ClubMeetingSettingsScreen() {
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [settlementEnabled, setSettlementEnabled] = useState(true);
  const [initialEnabled, setInitialEnabled] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true);
    setError('');
    try {
      const club = extractData(await clubsApi.getClub(resolvedId));
      const role = club?.membership_role || club?.my_role;
      setCanManage(CAN_MANAGE_ROLES.includes(String(role).toUpperCase()));
      const se = club?.settlement_enabled !== false;
      setSettlementEnabled(se);
      setInitialEnabled(se);
    } catch (e) {
      setError(e?.message || '클럽 정보를 불러올 수 없습니다.');
      setCanManage(false);
    } finally {
      setLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = settlementEnabled !== initialEnabled;

  const handleSave = useCallback(async () => {
    if (!resolvedId || !dirty) return;
    setSaving(true);
    try {
      await clubsApi.updateClub(resolvedId, { settlement_enabled: settlementEnabled });
      setInitialEnabled(settlementEnabled);
      Alert.alert('저장 완료', '모임 설정이 저장되었습니다.');
    } catch (e) {
      Alert.alert('오류', e?.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [resolvedId, dirty, settlementEnabled]);

  const subtitle = useMemo(
    () =>
      '끄면 클럽 모임에서 정산 탭·플로우가 숨겨지고, 정산 저장·확정을 할 수 없습니다. 기존 정산 데이터는 삭제되지 않습니다.',
    []
  );

  if (!resolvedId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="모임 설정" />
        <Text style={styles.errorText}>클럽을 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="모임 설정" />
      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <View style={styles.stateRow}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.stateText}>불러오는 중…</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : !canManage ? (
          <Card style={styles.card}>
            <Text style={styles.bodyText}>클럽 리더 또는 매니저만 모임 설정을 변경할 수 있습니다.</Text>
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.labelCol}>
                <Text style={styles.title}>정산 기능 사용</Text>
                <Text style={styles.hint}>{subtitle}</Text>
              </View>
              <Switch
                value={settlementEnabled}
                onValueChange={setSettlementEnabled}
                trackColor={{ false: colors.neutral[300], true: colors.primary[200] }}
                thumbColor={settlementEnabled ? colors.primary[600] : colors.neutral[100]}
              />
            </View>
            {dirty ? (
              <Button variant="primary" onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? '저장 중…' : '저장'}
              </Button>
            ) : null}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  stateRow: base.stateRow,
  stateText: base.stateText,
  card: {
    padding: tokens.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  labelCol: { flex: 1 },
  title: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xxs,
  },
  hint: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  saveBtn: { marginTop: tokens.spacing.md },
  errorText: base.textSmError,
  bodyText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    lineHeight: 20,
  },
});
