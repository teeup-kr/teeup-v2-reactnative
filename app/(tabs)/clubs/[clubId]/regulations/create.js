import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubsApi } from '@/lib/api/api';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

function ensureCategories(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.categories)) return raw.categories;
  return [];
}

export default function ClubRegulationCreateScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const loadCategories = useCallback(async () => {
    if (!resolvedId) return;
    try {
      setIsLoadingCategories(true);
      const res = await clubsApi.getClubRegulationCategories(resolvedId);
      const list = ensureCategories(res);
      setCategories(list);
      if (list.length > 0) {
        setCategoryId((prev) => prev ?? list[0].id);
      }
    } catch (err) {
      console.error('규정 카테고리 조회 실패:', err);
      setErrors({ categories: err?.response?.data?.detail || '카테고리를 불러올 수 없습니다.' });
    } finally {
      setIsLoadingCategories(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async () => {
    const newErrors = {};
    if (!title?.trim()) newErrors.title = '제목을 입력해주세요.';
    if (!content?.trim()) newErrors.content = '내용을 입력해주세요.';
    if (!categoryId) newErrors.category = '카테고리를 선택해주세요.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await clubsApi.createClubRegulation(resolvedId, {
        category_id: categoryId,
        title: title.trim(),
        content: content.trim(),
        status: 'ACTIVE',
      });
      if (Platform.OS === 'web') {
        window.alert('규정이 등록되었습니다.');
        router.replace(`/clubs/${resolvedId}/regulations`);
      } else {
        Alert.alert('등록 완료', '규정이 등록되었습니다.', [
          { text: '확인', onPress: () => router.replace(`/clubs/${resolvedId}/regulations`) },
        ]);
      }
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        '규정 등록에 실패했습니다.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('등록 실패', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCategories) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="규정 작성" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.loadingText}>카테고리를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="규정 작성" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.label}>카테고리 *</Text>
          <View style={styles.categoryRow}>
            {categories.map((c) => (
              <Button
                key={c.id}
                variant={categoryId === c.id ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setCategoryId(c.id)}
                style={styles.categoryBtn}
              >
                {c.name || `카테고리 ${c.id}`}
              </Button>
            ))}
          </View>
          {categories.length === 0 ? (
            <Text style={styles.hintText}>카테고리가 없습니다. 규정 목록에서 카테고리를 먼저 추가해주세요.</Text>
          ) : null}
          {errors.category ? (
            <Text style={styles.errorText}>{errors.category}</Text>
          ) : null}

          <Text style={styles.label}>제목 *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="규정 제목을 입력하세요"
            style={[styles.input, errors.title && styles.inputError]}
            placeholderTextColor={colors.neutral[400]}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

          <Text style={styles.label}>내용 *</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="규정 내용을 입력하세요"
            style={[styles.input, styles.textArea, errors.content && styles.inputError]}
            multiline
            placeholderTextColor={colors.neutral[400]}
          />
          {errors.content ? <Text style={styles.errorText}>{errors.content}</Text> : null}
        </Card>

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={isSubmitting || !categoryId}
        >
          {isSubmitting ? '저장 중...' : '저장하기'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  loadingWrap: {
    flex: 1,
    padding: tokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: base.textSmMuted,
  card: {
    marginBottom: tokens.spacing.md,
  },
  label: base.labelSm,
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs2,
    marginBottom: tokens.spacing.sm2,
  },
  categoryBtn: {
    marginRight: tokens.spacing.xs,
  },
  hintText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    marginBottom: tokens.spacing.sm2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
    marginBottom: tokens.spacing.sm2,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  errorText: base.textSmError,
});
