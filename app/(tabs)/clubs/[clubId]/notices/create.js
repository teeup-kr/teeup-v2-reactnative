import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

export default function ClubNoticeCreateScreen() {
  const router = useRouter();
  const { clubId } = useLocalSearchParams();
  const resolvedId = Array.isArray(clubId) ? clubId[0] : clubId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
      await clubsApi.createClubNotice(resolvedId, {
        title: title.trim(),
        content: content.trim(),
        is_important: isImportant,
        is_private: false,
      });
      Alert.alert('등록 완료', '공지사항이 등록되었습니다.', [
        {
          text: '확인',
          onPress: () => router.replace(`/clubs/${resolvedId}/notices`),
        },
      ]);
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        '공지사항 등록에 실패했습니다.';
      Alert.alert('등록 실패', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="공지사항 등록" />
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
        </Card>

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '등록 중...' : '등록하기'}
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
  errorText: {
    fontSize: tokens.font.xs,
    color: colors.error[600],
    marginBottom: tokens.spacing.sm2,
  },
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
