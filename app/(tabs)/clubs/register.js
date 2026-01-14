import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView, StyleSheet, Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChipOption from '@/components/clubs/ChipOption';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { clubFeeCycles, clubRegisterTypes } from '@/constants/clubConstants';
import { clubsApi } from '@/lib/api/api';
import {
  createFieldChangeHandler,
  createSelectRegularFeeCycleHandler,
  createSubmitClubRegisterHandler,
  createToggleRegularFeeHandler,
} from '@/lib/render/clubs';
import { buildClubRegisterPayload, defaultClubRegisterErrors } from '@/lib/util/clubUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';



export default function ClubRegisterScreen() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    type: 'REGULAR',
    description: '',
    memberCount: '1',
    location: '',
    contact: '',
    additionalInfo: '',
    attachment: '',
    hasRegularFee: false,
    regularFeeAmount: '',
    regularFeeCycle: '',
    regularFeeDescription: '',
  });

  const [errors, setErrors] = useState(defaultClubRegisterErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useMemo(
    () => createFieldChangeHandler({ setFormData }),
    [setFormData]
  );
  const handleToggleRegularFee = useMemo(
    () => createToggleRegularFeeHandler({ setFormData }),
    [setFormData]
  );
  const handleSelectFeeCycle = useMemo(
    () => createSelectRegularFeeCycleHandler({ setFormData }),
    [setFormData]
  );

  const handleRegister = useMemo(
    () =>
      createSubmitClubRegisterHandler({
        formData,
        buildPayload: buildClubRegisterPayload,
        registerClubApplication: clubsApi.registerClubApplication,
        setErrors,
        setIsSubmitting,
        defaultErrors: defaultClubRegisterErrors,
        router,
      }),
    [formData, setErrors, setIsSubmitting, router]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 만들기" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>클럽 기본 정보</Text>
          <Text style={styles.sectionSubtitle}>필수 정보를 입력해주세요.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>클럽명</Text>
            <TextInput
              value={formData.name}
              onChangeText={handleChange('name')}
              placeholder="클럽명을 입력하세요"
              style={styles.input}
              placeholderTextColor={colors.neutral[400]}
              error={errors.name}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>클럽 타입</Text>
            <View style={styles.chipRow}>
              {clubRegisterTypes.map((type) => (
                <ChipOption
                  key={type.id}
                  label={type.label}
                  selected={formData.type === type.id}
                  onPress={handleChange('type')(type.id)}
                  styles={styles}
                />
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>클럽 설명</Text>
            <TextInput
              value={formData.description}
              onChangeText={handleChange('description')}
              placeholder="클럽 소개글을 입력하세요"
              style={[styles.input, styles.textArea]}
              multiline
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={styles.halfField}>
              <Text style={styles.label}>예상 멤버 수</Text>
              <TextInput
                value={formData.memberCount}
                onChangeText={handleChange('memberCount')}
                placeholder="예: 20"
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor={colors.neutral[400]}
                error={errors.memberCount}
              />
            </View>
            <View style={[styles.halfField, styles.halfFieldLast]}>
              <Text style={styles.label}>지역</Text>
              <TextInput
                value={formData.location}
                onChangeText={handleChange('location')}
                placeholder="예: 서울/경기"
                style={styles.input}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>대표 연락처</Text>
            <TextInput
              value={formData.contact}
              onChangeText={handleChange('contact')}
              placeholder="01012345678"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>추가 안내</Text>
            <TextInput
              value={formData.additionalInfo}
              onChangeText={handleChange('additionalInfo')}
              placeholder="가입 안내, 회비 안내 등을 적어주세요"
              style={[styles.input, styles.textArea]}
              multiline
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>정기 회비</Text>
              <Text style={styles.sectionSubtitle}>회비가 있다면 설정해주세요.</Text>
            </View>

            <Pressable
              onPress={handleToggleRegularFee}
              style={[styles.toggle, formData.hasRegularFee && styles.toggleActive]}
            >
              <Text style={styles.toggleText}>
                {formData.hasRegularFee ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>

          {formData.hasRegularFee && (
            <View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>회비 금액</Text>
                <TextInput
                  value={formData.regularFeeAmount}
                  onChangeText={handleChange('regularFeeAmount')}
                  placeholder="예: 50000"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>회비 주기</Text>
                <View style={styles.chipRow}>
                  {clubFeeCycles.map((cycle) => (
                    <ChipOption
                      key={cycle.id}
                      label={cycle.label}
                      selected={formData.regularFeeCycle === cycle.id}
                      onPress={handleSelectFeeCycle(cycle.id)}
                      styles={styles}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>회비 설명</Text>
                <TextInput
                  value={formData.regularFeeDescription}
                  onChangeText={handleChange('regularFeeDescription')}
                  placeholder="회비 사용처 또는 납부 안내"
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>첨부 파일</Text>
          <Text style={styles.sectionSubtitle}>클럽 소개서, 규정 등을 첨부하세요.</Text>
          <Pressable style={styles.uploadBox}>
            <FontAwesome5 name="file-alt" size={18} color={colors.neutral[500]} />
            <View style={styles.uploadTextWrap}>
              <Text style={styles.uploadTitle}>파일 선택</Text>
              <Text style={styles.uploadSubtitle}>{formData.attachment}</Text>
            </View>
          </Pressable>
        </Card>

        <Button
          variant="primary"
          size="lg"
          onPress={handleRegister}
          disabled={isSubmitting}
        >
          클럽 등록 신청
        </Button>
        <Text style={styles.noticeText}>등록 후 관리자의 승인이 필요합니다.</Text>
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
  sectionTitle: base.sectionTitle,
  sectionSubtitle: { ...base.sectionSubtitle, marginTop: tokens.spacing.xxs, marginBottom: tokens.spacing.sm2 },
  sectionRow: base.rowBetween,
  fieldGroup: {
    marginBottom: tokens.spacing.sm2,
  },
  fieldGroupRow: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm2,
  },
  halfField: {
    flex: 1,
    marginRight: tokens.spacing.sm2,
  },
  halfFieldLast: {
    marginRight: 0,
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
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: tokens.spacing.xxs,
  },
  chip: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginRight: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  chipTextActive: {
    color: colors.white,
  },
  toggle: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.xs2,
    borderRadius: tokens.radius.baseLg,
    backgroundColor: colors.neutral[200],
  },
  toggleActive: {
    backgroundColor: colors.primary[600],
  },
  toggleText: {
    color: colors.white,
    fontWeight: tokens.fontWeight.bold,
    fontSize: tokens.font.sm,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.padding.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.md,
    backgroundColor: colors.neutral[50],
  },
  uploadTextWrap: {
    marginLeft: tokens.spacing.sm2,
  },
  uploadTitle: {
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[800],
  },
  uploadSubtitle: {
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.hairline,
  },
  noticeText: {
    textAlign: 'center',
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    marginTop: tokens.spacing.xs2,
  },
});
