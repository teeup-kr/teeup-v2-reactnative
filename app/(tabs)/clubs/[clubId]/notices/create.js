import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Switch,
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
import { backOrHome } from '@/lib/navigation/cappedHistory';
import { extractData } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export function ClubNoticeForm({ mode = 'create' }) {
  const router = useRouter();
  const { clubId, noticeId } = useLocalSearchParams();
  const resolvedClubId = Array.isArray(clubId) ? clubId[0] : clubId;
  const resolvedNoticeId = Array.isArray(noticeId) ? noticeId[0] : noticeId;
  const isEditMode = mode === 'edit';
  const screenTitle = isEditMode ? '공지사항 수정' : '공지사항 등록';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isEditMode || !resolvedClubId || !resolvedNoticeId) return;
      try {
        setIsLoading(true);
        setFetchError('');
        const notice = extractData(await clubsApi.getClubNotice(resolvedClubId, resolvedNoticeId));
        if (!cancelled) {
          setTitle(notice?.title || '');
          setContent(notice?.content || '');
          setIsImportant(notice?.is_important || false);
          setIsPrivate(notice?.is_private || false);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err?.message || '공지사항을 불러오는데 실패했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, resolvedClubId, resolvedNoticeId]);

  const handleSubmit = async () => {
    const newErrors = {};
    if (!title?.trim()) newErrors.title = '제목을 입력해주세요.';
    if (!content?.trim()) newErrors.content = '내용을 입력해주세요.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        is_important: isImportant,
        is_private: isEditMode ? isPrivate : false,
      };

      if (isEditMode) {
        await clubsApi.updateClubNotice(resolvedClubId, resolvedNoticeId, payload);
      } else {
        await clubsApi.createClubNotice(resolvedClubId, payload);
      }

      Alert.alert(
        isEditMode ? '수정 완료' : '등록 완료',
        isEditMode ? '공지사항이 수정되었습니다.' : '공지사항이 등록되었습니다.',
        [
          {
            text: '확인',
            onPress: () => router.replace(
              isEditMode
                ? `/clubs/${resolvedClubId}/notices/${resolvedNoticeId}`
                : `/clubs/${resolvedClubId}/notices`
            ),
          },
        ]
      );
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        (isEditMode ? '수정에 실패했습니다.' : '공지사항 등록에 실패했습니다.');
      Alert.alert(isEditMode ? '수정 실패' : '등록 실패', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title={screenTitle} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title={screenTitle} />
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>{fetchError}</Text>
          <Button
            variant="outline"
            onPress={() => backOrHome(router)}
            style={styles.backButton}
          >
            뒤로가기
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title={screenTitle} />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.label}>제목 *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="공지사항 제목을 입력하세요"
            style={[styles.input, errors.title && styles.inputError]}
            placeholderTextColor={colors.neutral[400]}
          />
          {errors.title ? (
            <Text style={styles.errorText}>{errors.title}</Text>
          ) : null}

          <Text style={styles.label}>내용 *</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="공지사항 내용을 입력하세요"
            style={[styles.input, styles.textArea, errors.content && styles.inputError]}
            multiline
            placeholderTextColor={colors.neutral[400]}
          />
          {errors.content ? (
            <Text style={styles.errorText}>{errors.content}</Text>
          ) : null}

          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <FontAwesome5 name="star" size={14} color={colors.primary[600]} />
              <Text style={styles.switchLabel}>중요 공지로 표시</Text>
            </View>
            <Switch
              value={isImportant}
              onValueChange={setIsImportant}
              trackColor={{ false: colors.neutral[300], true: colors.primary[200] }}
              thumbColor={isImportant ? colors.primary[600] : colors.neutral[50]}
            />
          </View>

          {isEditMode ? (
            <View style={styles.switchRow}>
              <View style={styles.switchLabelWrap}>
                <FontAwesome5 name="lock" size={14} color={colors.neutral[600]} />
                <Text style={styles.switchLabel}>비공개 (리더/매니저만 조회)</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: colors.neutral[300], true: colors.neutral[400] }}
                thumbColor={isPrivate ? colors.neutral[600] : colors.neutral[50]}
              />
            </View>
          ) : null}
        </Card>

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? (isEditMode ? '저장 중...' : '등록 중...')
            : (isEditMode ? '저장하기' : '등록하기')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ClubNoticeCreateScreen() {
  return <ClubNoticeForm mode="create" />;
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
  backButton: {
    marginTop: tokens.spacing.md,
  },
  card: {
    marginBottom: tokens.spacing.md,
  },
  label: base.labelSm,
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.base,
    fontSize: tokens.font.base,
    color: colors.neutral[900],
    backgroundColor: colors.white,
    marginBottom: tokens.spacing.xs,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  errorText: base.textSmError,
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.sm2,
    paddingVertical: tokens.padding.xs,
  },
  switchLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs2,
  },
  switchLabel: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    fontWeight: tokens.fontWeight.medium,
  },
});
