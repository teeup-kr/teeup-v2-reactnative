import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { clubsApi, regionApi } from '@/lib/api/api';
import {
  createFieldChangeHandler,
  createRegisterPressHandler,
  createSelectRegularFeeCycleHandler,
  createSidoSelectHandler,
  createSubmitClubRegisterHandler,
  createToggleGunguHandler,
  createToggleRegularFeeHandler,
} from '@/lib/handler/clubs';
import { buildClubRegisterPayload, defaultClubRegisterErrors } from '@/lib/util/clubUtils';
import { extractList } from '@/lib/util/responseUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';



export default function ClubRegisterScreen() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    type: 'REGULAR',
    description: '',
    memberCount: '1',
    sidoCode: '',
    gunguCodes: [],
    contact: '',
    additionalInfo: '',
    attachment: '',
    hasRegularFee: false,
    regularFeeAmount: '',
    regularFeeCycle: clubFeeCycles[0]?.id ?? '',
    regularFeeDescription: '',
  });

  const [errors, setErrors] = useState(defaultClubRegisterErrors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidoOptions, setSidoOptions] = useState([]);
  const [gunguOptions, setGunguOptions] = useState([]);
  const [selectedSidoCode, setSelectedSidoCode] = useState('');
  const [selectedGunguCodes, setSelectedGunguCodes] = useState([]);
  const [isSidoLoading, setIsSidoLoading] = useState(false);
  const [isGunguLoading, setIsGunguLoading] = useState(false);
  const [regionFetchError, setRegionFetchError] = useState('');

  const handleChange = useMemo(
    () => createFieldChangeHandler({ setFormData }),
    [setFormData]
  );
  const handleToggleRegularFee = useMemo(
    () =>
      createToggleRegularFeeHandler({
        setFormData,
        defaultCycleId: clubFeeCycles[0]?.id ?? '',
      }),
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
        successParams: { toast: 'club_registered' },
      }),
    [formData, setErrors, setIsSubmitting, router]
  );

  const handleSidoSelect = useMemo(
    () =>
      createSidoSelectHandler({
        setSelectedSidoCode,
        setSelectedGunguCodes,
        setErrors,
      }),
    [setSelectedSidoCode, setSelectedGunguCodes, setErrors]
  );
  const handleToggleGungu = useMemo(
    () =>
      createToggleGunguHandler({
        setSelectedGunguCodes,
        setErrors,
      }),
    [setSelectedGunguCodes, setErrors]
  );
  const handleRegisterPress = useMemo(
    () =>
      createRegisterPressHandler({
        selectedGunguCodes,
        setErrors,
        handleRegister,
      }),
    [selectedGunguCodes, setErrors, handleRegister]
  );

  const selectedSidoName = useMemo(() => {
    const match = sidoOptions.find((option) => String(option.code) === String(selectedSidoCode));
    return match?.name || '';
  }, [sidoOptions, selectedSidoCode]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      sidoCode: selectedSidoCode,
      gunguCodes: selectedGunguCodes,
    }));
  }, [selectedSidoCode, selectedGunguCodes, setFormData]);

  useEffect(() => {
    let isActive = true;

    const fetchSidoOptions = async () => {
      try {
        setIsSidoLoading(true);
        setRegionFetchError('');
        const response = await regionApi.getSidoList();
        const list = extractList(response);
        if (isActive) {
          setSidoOptions(list);
        }
      } catch (error) {
        console.error('시도 목록 조회 실패:', error);
        if (isActive) {
          setRegionFetchError(error?.message || '시/도 목록을 불러오지 못했습니다.');
          setSidoOptions([]);
        }
      } finally {
        if (isActive) {
          setIsSidoLoading(false);
        }
      }
    };

    fetchSidoOptions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!selectedSidoCode) {
      setGunguOptions([]);
      setSelectedGunguCodes([]);
      return () => {
        isActive = false;
      };
    }

    const fetchGunguOptions = async () => {
      try {
        setIsGunguLoading(true);
        setRegionFetchError('');
        const response = await regionApi.getGunguList(selectedSidoCode);
        const list = extractList(response);
        if (isActive) {
          setGunguOptions(list);
          setSelectedGunguCodes([]);
        }
      } catch (error) {
        console.error('시군구 목록 조회 실패:', error);
        if (isActive) {
          setRegionFetchError(error?.message || '시/군/구 목록을 불러오지 못했습니다.');
          setGunguOptions([]);
          setSelectedGunguCodes([]);
        }
      } finally {
        if (isActive) {
          setIsGunguLoading(false);
        }
      }
    };

    fetchGunguOptions();

    return () => {
      isActive = false;
    };
  }, [selectedSidoCode]);

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
                  onPress={() => handleChange('type')(type.id)}
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

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>활동 지역 (시/도)</Text>
            <View style={styles.selectBox}>
              <Text style={styles.selectText}>
                {selectedSidoName ||
                  (isSidoLoading ? '시/도 목록을 불러오는 중...' : '시/도를 선택하세요')}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
              <Picker
                selectedValue={selectedSidoCode}
                onValueChange={handleSidoSelect}
                mode="dialog"
                style={styles.hiddenPicker}
                dropdownIconColor="transparent"
                enabled={!isSidoLoading}
              >
                <Picker.Item label="시/도를 선택하세요" value="" />
                {sidoOptions.map((option) => (
                  <Picker.Item
                    key={option.code}
                    label={option.name}
                    value={String(option.code)}
                  />
                ))}
              </Picker>
            </View>
            {regionFetchError ? (
              <Text style={styles.errorText}>{regionFetchError}</Text>
            ) : null}
          </View>

          <Text style={styles.label}>시/군/구 선택</Text>
          <View style={[styles.input, styles.textArea]}>
            {isGunguLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary[600]} />
                <Text style={styles.helperText}>시/군/구 목록을 불러오는 중...</Text>
              </View>
            ) : selectedSidoCode ? (
              gunguOptions.length > 0 ? (
                <View style={styles.chipRow}>
                  {gunguOptions.map((option) => (
                    <ChipOption
                      key={option.code}
                      label={option.name}
                      selected={selectedGunguCodes.includes(String(option.code))}
                      onPress={() => handleToggleGungu(option.code)}
                      styles={styles}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.helperText}>선택한 시/도에 시/군/구가 없습니다.</Text>
              )
            ) : (
              <Text style={styles.helperText}>시/도를 먼저 선택해주세요.</Text>
            )}
            {errors.gungu_codes ? (
              <Text style={styles.errorText}>{errors.gungu_codes}</Text>
            ) : null}

          </View>
          <Text style={styles.helperText}>
            <FontAwesome5 name="info-circle" size={10} color={colors.neutral[500]} />
            최소 1개, 최대 4개의 지역을 선택해주세요</Text>

          <View style={styles.fieldGroup}>
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

        <Button
          variant="primary"
          size="lg"
          onPress={handleRegisterPress}
          disabled={isSubmitting}
        >
          클럽 등록 신청
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
  selectBox: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: tokens.radius.base,
    backgroundColor: colors.white,
    paddingHorizontal: tokens.padding.base,
    paddingVertical: tokens.padding.xs2,
    minHeight: 44,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectText: {
    flex: 1,
    fontSize: tokens.font.base,
    color: colors.neutral[800],
  },
  selectArrow: {
    marginLeft: tokens.spacing.xs,
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  hiddenPicker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  helperText: {
    margin: tokens.spacing.xs,
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
  },
  errorText: base.textSmError,
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginTop: tokens.spacing.xs,
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
