import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import {
  createFetchRegulationsHandler,
  createRegulationEditHandler,
} from '@/lib/handler/clubs';
import { normalizeClubRegulations } from '@/lib/util/clubUtils';
import { extractData, extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const CAN_MANAGE_ROLES = ['LEADER', 'MANAGER'];

function ensureCategories(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.categories)) return raw.categories;
  return [];
}

export default function ClubRegulationsScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;

  const [regulations, setRegulations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState('');

  // 카테고리 모달
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

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

  const loadCategories = useCallback(async () => {
    if (!resolvedId) return;
    try {
      const res = await clubsApi.getClubRegulationCategories(resolvedId);
      setCategories(ensureCategories(res));
    } catch (e) {
      console.error('카테고리 조회 실패:', e);
    }
  }, [resolvedId]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  useEffect(() => {
    loadRegulations();
  }, [loadRegulations]);

  useEffect(() => {
    if (canManage) loadCategories();
  }, [canManage, loadCategories]);

  const normalizedRegulations = useMemo(
    () => normalizeClubRegulations(regulations),
    [regulations]
  );

  const handleRegulationPress = useMemo(
    () => (regulationId) => {
      router.push(`/clubs/${resolvedId || clubId}/regulations/${regulationId}`);
    },
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

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryModalVisible(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name || '');
    setCategoryModalVisible(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalVisible(false);
    setEditingCategory(null);
    setCategoryName('');
  };

  const handleSaveCategory = async () => {
    const name = categoryName?.trim();
    if (!name) {
      if (Platform.OS === 'web') window.alert('카테고리 이름을 입력해주세요.');
      else Alert.alert('입력 오류', '카테고리 이름을 입력해주세요.');
      return;
    }
    setIsCategorySubmitting(true);
    try {
      if (editingCategory) {
        await clubsApi.updateClubRegulationCategory(resolvedId, editingCategory.id, { name });
        if (Platform.OS === 'web') {
          window.alert('카테고리가 수정되었습니다.');
        } else {
          Alert.alert('수정 완료', '카테고리가 수정되었습니다.');
        }
      } else {
        await clubsApi.createClubRegulationCategory(resolvedId, { name, order: categories.length });
        if (Platform.OS === 'web') {
          window.alert('카테고리가 추가되었습니다.');
        } else {
          Alert.alert('추가 완료', '카테고리가 추가되었습니다.');
        }
      }
      closeCategoryModal();
      loadCategories();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || '처리에 실패했습니다.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('오류', msg);
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = (cat) => {
    const confirmMsg = `"${cat.name}" 카테고리를 삭제하시겠습니까? 해당 카테고리의 규정도 함께 삭제됩니다.`;
    const doDelete = async () => {
      try {
        await clubsApi.deleteClubRegulationCategory(resolvedId, cat.id);
        if (Platform.OS === 'web') {
          window.alert('카테고리가 삭제되었습니다.');
        } else {
          Alert.alert('삭제 완료', '카테고리가 삭제되었습니다.');
        }
        loadCategories();
        loadRegulations();
      } catch (err) {
        const msg = err?.response?.data?.detail || err?.message || '삭제에 실패했습니다.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('삭제 실패', msg);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) doDelete();
    } else {
      Alert.alert('카테고리 삭제', confirmMsg, [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 규정" />
      <ScrollView contentContainerStyle={styles.container}>
        {canManage && (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.subtitle}>카테고리 관리</Text>
              <Button variant="outline" size="sm" onPress={openAddCategory}>
                카테고리 추가
              </Button>
            </View>
            <Card style={styles.categoryCard}>
              {categories.length === 0 ? (
                <Text style={styles.stateText}>등록된 카테고리가 없습니다.</Text>
              ) : (
                categories.map((cat) => (
                  <View key={cat.id} style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <View style={styles.categoryActions}>
                      <Pressable
                        onPress={() => openEditCategory(cat)}
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                      >
                        <FontAwesome5 name="pen" size={14} color={colors.primary[600]} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteCategory(cat)}
                        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                      >
                        <FontAwesome5 name="trash-alt" size={14} color={colors.error[500]} />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </Card>

            <View style={[styles.headerRow, { marginTop: tokens.spacing.md }]}>
              <Text style={styles.subtitle}>클럽 운영 규정을 확인하세요.</Text>
              <Button variant="primary" size="sm" onPress={handleCreatePress}>
                규정 작성
              </Button>
            </View>
          </>
        )}

        {!canManage && (
          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>클럽 운영 규정을 확인하세요.</Text>
          </View>
        )}

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

      <Modal
        maxContentWidth={tokens.layout.regulationsModalMaxPreferred}
        visible={categoryModalVisible}
        title={editingCategory ? '카테고리 수정' : '카테고리 추가'}
        onClose={closeCategoryModal}
        animationType="fade"
        closeOnBackdropPress
        containerStyle={styles.modalContent}
        backdropStyle={styles.modalOverlay}
        footer={(
          <View style={styles.modalActions}>
            <Button variant="outline" onPress={closeCategoryModal} style={styles.modalBtn}>
              취소
            </Button>
            <Button
              variant="primary"
              onPress={handleSaveCategory}
              disabled={isCategorySubmitting}
              style={styles.modalBtn}
            >
              {isCategorySubmitting ? '저장 중...' : '저장'}
            </Button>
          </View>
        )}
      >
        <Text style={styles.label}>카테고리 이름 *</Text>
        <TextInput
          value={categoryName}
          onChangeText={setCategoryName}
          placeholder="예: 회칙, 운영규정"
          style={styles.modalInput}
          placeholderTextColor={colors.neutral[400]}
          autoFocus
        />
      </Modal>
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
  categoryCard: {
    marginBottom: tokens.spacing.sm2,
    paddingVertical: tokens.padding.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.padding.sm,
    paddingHorizontal: tokens.padding.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  categoryName: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.medium,
    color: colors.neutral[800],
  },
  categoryActions: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  iconBtn: {
    padding: tokens.padding.xs,
  },
  iconBtnPressed: {
    opacity: 0.6,
  },
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
  modalOverlay: {
    padding: tokens.spacing.lg,
  },
  modalContent: {
    width: '100%',
  },
  label: base.labelSm,
  modalInput: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
  },
  modalBtn: {
    minWidth: 80,
  },
});
