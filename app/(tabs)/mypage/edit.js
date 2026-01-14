
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView, StyleSheet, Text,
  TextInput,
  View
} from 'react-native';

import {
  checkNicknameAvailability,
  fetchMyProfile,
  fetchUserHandicap,
  updateMyProfile,
} from '@/lib/api/mypage';
import {
  createBirthPickerChangeHandler,
  createBirthPickerOpenHandler,
  createCheckNicknameDuplicateHandler,
  createCompositionEndHandler,
  createCompositionStartHandler,
  createConditionalFieldChangeHandler,
  createFieldChangeHandler,
  createInputChangeHandler,
  createPasswordModalCloseHandler,
  createPasswordModalOpenHandler,
  createSaveProfileHandler,
  createShowToastHandler,
  createValidateProfileFormHandler,
} from '@/lib/render/mypage/edit';
import { extractData } from '@/lib/responseUtils';
import {
  buildProfileFormData,
  calcHandicapFromAvg,
  getBirthDateValue,
  isNicknameSame as isNicknameSameValue,
  isSocialLoginUser,
} from '@/lib/value/mypage';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

import ChangePasswordModal from './change-password-modal';
/* ===========================
   Component
=========================== */
export default function UserProfileEditForm() {
  const [isNameComposing, setIsNameComposing] = useState(false);
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const maxBirthDate = useMemo(() => new Date(), []);
  const [profile, setProfile] = useState({
    email: '',
    nickname: '',
    realname: '',
    phone_number: '',
    birthdate: '',
    gender: '',
    average_score: null,
    handicap: null,
  });
  const [formData, setFormData] = useState({
    nickname: '',
    realname: '',
    phone_number: '',
    birthdate: '',
    gender: '',
    average_score: '',
    calculatedHandicap: null,
  });
  const [errors, setErrors] = useState({});
  const [, setLoading] = useState(true);
  const [handicapInfo, setHandicapInfo] = useState(null);
  const [handicapLoading, setHandicapLoading] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [updateProfilePending, setUpdateProfilePending] = useState(false);
  const [toast, setToast] = useState({ open: false, tone: 'success', message: '' });

  const isSocialLogin = useMemo(() => {
    return isSocialLoginUser(profile);
  }, [profile]);

  const birthDateValue = useMemo(() => {
    return getBirthDateValue(formData.birthdate, maxBirthDate);
  }, [formData.birthdate, maxBirthDate]);

  const isNicknameSame = useMemo(() => {
    return isNicknameSameValue(profile?.nickname, formData.nickname);
  }, [formData.nickname, profile?.nickname]);

  useEffect(() => {
    if (isNicknameSame) {
      setNicknameChecked(true);
      setErrors((prev) => ({ ...prev, nickname: '' }));
    }
  }, [isNicknameSame]);

  const showToast = useMemo(() => createShowToastHandler(setToast), []);

  useEffect(() => {
    if (!toast.open) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2200);
    return () => clearTimeout(timer);
  }, [toast.open]);

  const openPasswordModal = useMemo(
    () => createPasswordModalOpenHandler(setShowPasswordModal),
    [setShowPasswordModal],
  );

  const closePasswordModal = useMemo(
    () => createPasswordModalCloseHandler(setShowPasswordModal),
    [setShowPasswordModal],
  );

  const openBirthPicker = useMemo(
    () => createBirthPickerOpenHandler(setShowBirthPicker),
    [setShowBirthPicker],
  );

  const handleBirthPickerChange = useMemo(
    () => createBirthPickerChangeHandler({ setShowBirthPicker, handleInputChange }),
    [handleInputChange, setShowBirthPicker],
  );

  const handleCompositionStart = useMemo(
    () => createCompositionStartHandler(setIsNameComposing),
    [setIsNameComposing],
  );

  const handleCompositionEnd = useMemo(
    () => createCompositionEndHandler({
      setIsNameComposing,
      handleInputChange,
      fallbackValue: formData.realname,
    }),
    [formData.realname, handleInputChange, setIsNameComposing],
  );

  const handleInputChange = useMemo(
    () => createInputChangeHandler({
      setFormData,
      setErrors,
      setNicknameChecked,
      setNicknameMessage,
      calcHandicapFromAvg,
    }),
    [setFormData, setErrors, setNicknameChecked, setNicknameMessage],
  );

  const handleNicknameChange = useMemo(
    () => createFieldChangeHandler(handleInputChange, 'nickname'),
    [handleInputChange],
  );

  const handleRealnameChange = useMemo(
    () => createConditionalFieldChangeHandler({
      handleInputChange,
      field: 'realname',
      shouldBlock: () => isNameComposing,
    }),
    [handleInputChange, isNameComposing],
  );

  const handlePhoneChange = useMemo(
    () => createFieldChangeHandler(handleInputChange, 'phone_number'),
    [handleInputChange],
  );

  const handleAverageScoreChange = useMemo(
    () => createFieldChangeHandler(handleInputChange, 'average_score'),
    [handleInputChange],
  );

  const checkNicknameDuplicate = useMemo(
    () => createCheckNicknameDuplicateHandler({
      nickname: formData.nickname,
      isNicknameSame,
      setErrors,
      setIsCheckingNickname,
      setNicknameChecked,
      setNicknameMessage,
      checkNicknameAvailability,
    }),
    [
      formData.nickname,
      isNicknameSame,
      setErrors,
      setIsCheckingNickname,
      setNicknameChecked,
      setNicknameMessage,
    ],
  );

  const validateForm = useMemo(
    () => createValidateProfileFormHandler({
      formData,
      isSocialLogin,
      isNicknameSame,
      nicknameChecked,
      setErrors,
    }),
    [formData, isSocialLogin, isNicknameSame, nicknameChecked, setErrors],
  );

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchMyProfile();
      const user = extractData(response);
      setProfile(user || {});
      setFormData((prev) => buildProfileFormData(user, prev));
      setNicknameChecked(Boolean(user?.nickname));
      setNicknameMessage('');
      if (user?.id) {
        setHandicapLoading(true);
        try {
          const handicapResponse = await fetchUserHandicap(user.id);
          setHandicapInfo(extractData(handicapResponse));
        } catch (handicapError) {
          console.error('핸디캡 조회 실패:', handicapError);
          setHandicapInfo(null);
        } finally {
          setHandicapLoading(false);
        }
      } else {
        setHandicapInfo(null);
        setHandicapLoading(false);
      }
    } catch (fetchError) {
      console.error('프로필 조회 실패:', fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = useMemo(
    () => createSaveProfileHandler({
      formData,
      profile,
      isSocialLogin,
      validateForm,
      updateMyProfile,
      showToast,
      setNicknameChecked,
      fetchProfile,
      setUpdateProfilePending,
    }),
    [
      fetchProfile,
      formData,
      isSocialLogin,
      profile,
      setNicknameChecked,
      setUpdateProfilePending,
      showToast,
      validateForm,
    ],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>회원정보 수정</Text>

          <View style={styles.stackLg}>
            {/* 이메일 */}
            <View>
              <Text style={styles.label}>
                <FontAwesome5 name="envelope" size={14} style={styles.labelIcon} />
                아이디(이메일)
              </Text>

              <View style={styles.readonlyBox}>
                <Text style={styles.readonlyText}>
                  {profile.email || '-'}
                </Text>
              </View>

              <Text style={styles.helperText}>
                이메일은 수정할 수 없습니다.
              </Text>
            </View>

            {/* 닉네임 */}
            <View>
              <Text style={styles.label}>
                <FontAwesome5 name="user" size={14} style={styles.labelIcon} />
                닉네임 <Text style={styles.required}>*</Text>
              </Text>

              <View style={styles.rowGap}>
                <TextInput
                  value={formData.nickname}
                  onChangeText={handleNicknameChange}
                  placeholder="닉네임을 입력하세요"
                  placeholderTextColor={colors.gray[400]}
                  style={[
                    styles.input,
                    errors.nickname
                      ? styles.inputError
                      : styles.inputNormal,
                  ]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Pressable
                  onPress={checkNicknameDuplicate}
                  disabled={
                    isCheckingNickname ||
                    !formData.nickname ||
                    isNicknameSame
                  }
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (isCheckingNickname ||
                      !formData.nickname ||
                      isNicknameSame) &&
                    styles.btnDisabled,
                    pressed &&
                    !(isCheckingNickname ||
                      !formData.nickname ||
                      isNicknameSame) &&
                    styles.btnPressed,
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {isCheckingNickname ? '확인 중...' : '중복확인'}
                  </Text>
                </Pressable>
              </View>

              {!!errors.nickname && (
                <Text style={styles.errorText}>
                  {errors.nickname}
                </Text>
              )}
              {!!nicknameMessage && !errors.nickname && (
                <Text style={styles.successText}>
                  {nicknameMessage}
                </Text>
              )}
            </View>

            {/* 비밀번호 변경 */}
            {!isSocialLogin && (
              <View>
                <Text style={styles.label}>
                  <FontAwesome5 name="lock" size={14} style={styles.labelIcon} />
                  비밀번호
                </Text>

                <Pressable
                  onPress={openPasswordModal}
                  style={({ pressed }) => [
                    styles.grayBtn,
                    pressed && styles.btnPressed,
                  ]}
                >
                  <Text style={styles.grayBtnText}>
                    비밀번호 변경
                  </Text>
                </Pressable>
              </View>
            )}

            {/* 실명 */}
            <View>
              <Text style={styles.label}>
                <FontAwesome5 name="user" size={14} style={styles.labelIcon} />
                실명 <Text style={styles.required}>*</Text>
              </Text>

              <TextInput
                value={formData.realname}
                onChangeText={handleRealnameChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                placeholder="실명을 입력하세요"
                placeholderTextColor={colors.gray[400]}
                style={[
                  styles.input,
                  errors.realname
                    ? styles.inputError
                    : styles.inputNormal,
                ]}
              />

              {!!errors.realname && (
                <Text style={styles.errorText}>
                  {errors.realname}
                </Text>
              )}
            </View>

            {/* 전화번호 */}
            <View>
              <Text style={styles.label}>
                <FontAwesome5 name="phone" size={14} style={styles.labelIcon} />
                전화번호 <Text style={styles.required}>*</Text>
              </Text>

              <TextInput
                value={formData.phone_number}
                onChangeText={handlePhoneChange}
                placeholder="전화번호를 입력하세요"
                placeholderTextColor={colors.gray[400]}
                style={[
                  styles.input,
                  errors.phone_number
                    ? styles.inputError
                    : styles.inputNormal,
                ]}
                keyboardType={
                  Platform.OS === 'ios' ? 'number-pad' : 'numeric'
                }
                inputMode="numeric"
              />

              {!!errors.phone_number && (
                <Text style={styles.errorText}>
                  {errors.phone_number}
                </Text>
              )}
            </View>

            {/* 생년월일 */}
            <View>
              <Text style={styles.label}>
                <FontAwesome5
                  name="calendar-alt"
                  size={14}
                  style={styles.labelIcon}
                />
                생년월일 <Text style={styles.required}>*</Text>
              </Text>

              <Pressable
                onPress={openBirthPicker}
                style={({ pressed }) => [
                  styles.inputLike,
                  errors.birthdate
                    ? styles.inputError
                    : styles.inputNormal,
                  pressed && styles.inputPressed,
                ]}
              >
                <Text style={styles.inputLikeText}>
                  {formData.birthdate || '날짜를 선택하세요'}
                </Text>
              </Pressable>

              {showBirthPicker && (
                <DateTimePicker
                  value={birthDateValue}
                  mode="date"
                  maximumDate={maxBirthDate}
                  display={
                    Platform.OS === 'ios'
                      ? 'spinner'
                      : 'default'
                  }
                  onChange={handleBirthPickerChange}
                />
              )}

              {!!errors.birthdate && (
                <Text style={styles.errorText}>
                  {errors.birthdate}
                </Text>
              )}
            </View>

            {/* 성별 */}
            <View>
              <Text style={styles.label}>
                <FontAwesome5
                  name="venus-mars"
                  size={14}
                  style={styles.labelIcon}
                />
                성별 <Text style={styles.required}>*</Text>
              </Text>

              <View style={styles.readonlyBox}>
                <Text style={styles.readonlyText}>
                  {formData.gender === 'MALE'
                    ? '남성'
                    : formData.gender === 'FEMALE'
                      ? '여성'
                      : '-'}
                </Text>
              </View>

              <Text style={styles.helperText}>
                성별은 수정할 수 없습니다.
              </Text>
            </View>

            {/* 평균타수 / 핸디캡 */}
            {isSocialLogin ? (
              <>
                <View>
                  <Text style={styles.label}>
                    <FontAwesome5
                      name="chart-line"
                      size={14}
                      style={styles.labelIcon}
                    />
                    평균 타수 <Text style={styles.required}>*</Text>
                  </Text>

                  <TextInput
                    value={formData.average_score || ''}
                    onChangeText={handleAverageScoreChange}
                    placeholder="평균 타수를 입력하세요 (55-144)"
                    placeholderTextColor={colors.gray[400]}
                    style={[
                      styles.input,
                      errors.average_score
                        ? styles.inputError
                        : styles.inputNormal,
                    ]}
                    keyboardType="numeric"
                    inputMode="numeric"
                  />

                  {!!formData.calculatedHandicap && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoTitle}>
                        계산된 핸디캡: {formData.calculatedHandicap}
                      </Text>
                      <Text style={styles.infoSub}>
                        평균 타수 {formData.average_score}타 → 핸디캡{' '}
                        {formData.calculatedHandicap}
                      </Text>
                    </View>
                  )}

                  {!!errors.average_score && (
                    <Text style={styles.errorText}>
                      {errors.average_score}
                    </Text>
                  )}
                </View>

                <View>
                  <Text style={styles.label}>
                    <FontAwesome5
                      name="golf-ball"
                      size={14}
                      style={styles.labelIcon}
                    />
                    핸디캡
                  </Text>

                  <View style={styles.readonlyBox}>
                    <Text style={styles.readonlyText}>
                      {formData.calculatedHandicap
                        ? Math.round(
                          Number(formData.calculatedHandicap)
                        )
                        : calcHandicapFromAvg(
                          formData.average_score
                        ) ?? '-'}
                    </Text>
                  </View>

                  <Text style={styles.helperText}>
                    평균 타수로부터 자동 계산됩니다.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* 일반 사용자 */}
                <View>
                  <Text style={styles.label}>
                    <FontAwesome5
                      name="chart-line"
                      size={14}
                      style={styles.labelIcon}
                    />
                    평균 타수
                  </Text>

                  <View style={styles.readonlyBox}>
                    <Text style={styles.readonlyText}>
                      {profile.average_score ?? '-'}
                    </Text>
                  </View>

                  <Text style={styles.helperText}>
                    일반 사용자는 평균 타수를 수정할 수 없습니다.
                  </Text>
                </View>

                <View>
                  <Text style={styles.label}>
                    <FontAwesome5
                      name="golf-ball"
                      size={14}
                      style={styles.labelIcon}
                    />
                    핸디캡
                  </Text>

                  {handicapLoading ? (
                    <View style={styles.readonlyBox}>
                      <Text style={styles.loadingText}>
                        불러오는 중...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.stackSm}>
                      {handicapInfo?.calculated_handicap != null && (
                        <View style={styles.autoBox}>
                          <View style={styles.autoTopRow}>
                            <Text style={styles.autoTitle}>
                              자동 계산:{' '}
                              {handicapInfo.calculated_handicap}
                            </Text>

                            {handicapInfo.handicap_update_method ===
                              'AUTO' && (
                                <View style={styles.badge}>
                                  <Text style={styles.badgeText}>
                                    자동
                                  </Text>
                                </View>
                              )}
                          </View>

                          <Text style={styles.autoSub}>
                            (
                            {handicapInfo.handicap_calculation_count ??
                              0}
                            경기 기준)
                          </Text>

                          {handicapInfo.handicap_update_method ===
                            'AUTO' && (
                              <Text style={styles.autoHint}>
                                경기 기록 기반으로 자동 업데이트됩니다
                              </Text>
                            )}
                        </View>
                      )}

                      <View style={styles.readonlyBox}>
                        <Text style={styles.readonlyText}>
                          {handicapInfo?.initial_handicap != null
                            ? `수동 입력: ${handicapInfo.initial_handicap}`
                            : profile.handicap
                              ? `수동 입력: ${profile.handicap}`
                              : '미등록'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          {/* 저장 */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSave}
              disabled={updateProfilePending}
              style={({ pressed }) => [
                styles.saveBtn,
                updateProfilePending && styles.btnDisabled,
                pressed &&
                !updateProfilePending &&
                styles.btnPressed,
              ]}
            >
              <FontAwesome5 name="save" size={14} color={colors.white} />
              <Text style={styles.saveBtnText}>
                {updateProfilePending ? '저장 중...' : '저장'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 비밀번호 모달 */}
        {!isSocialLogin && ChangePasswordModal && (
          <ChangePasswordModal
            isOpen={showPasswordModal}
            onClose={closePasswordModal}
          />
        )}
      </ScrollView>

      {/* Toast */}
      {toast?.open && (
        <View
          style={[
            styles.toast,
            toast.tone === 'error'
              ? styles.toastError
              : toast.tone === 'info'
                ? styles.toastInfo
                : styles.toastSuccess,
          ]}
        >
          <FontAwesome5
            name={
              toast.tone === 'error'
                ? 'times-circle'
                : 'check-circle'
            }
            size={16}
            color={colors.white}
          />
          <Text style={styles.toastText}>
            {toast.message}
          </Text>
        </View>
      )}
    </View>
  );
}

const PRIMARY_600 = colors.green[600];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: base.container,

  card: {
    backgroundColor: colors.white,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: tokens.padding.md,
    shadowColor: colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { ...base.cardTitle, color: colors.text, marginBottom: tokens.spacing.md },

  stackLg: { gap: 18 },
  stackSm: { gap: 8 },
  rowGap: { flexDirection: 'row', gap: 8 },

  label: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.textMuted,
    marginBottom: tokens.spacing.xs2,
  },
  labelIcon: { marginRight: tokens.spacing.xs2, color: colors.textMuted },
  required: { color: colors.red[500] },

  input: {
    flex: 1,
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.sm,
    fontSize: tokens.font.lg,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.white,
  },
  inputLike: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.sm,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.white,
  },
  inputLikeText: { fontSize: tokens.font.lg, color: colors.text },
  inputPressed: { opacity: 0.9 },

  inputNormal: { borderColor: colors.inputBorder },
  inputError: {
    borderColor: colors.red[300],
    backgroundColor: colors.red[50],
  },

  readonlyBox: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: tokens.radius.md,
  },
  readonlyText: { color: colors.textMuted, fontSize: tokens.font.lg },

  helperText: { marginTop: tokens.spacing.xs, fontSize: tokens.font.sm, color: colors.textSubtle },
  loadingText: base.textSmSubtle,

  errorText: {
    ...base.textSmError,
    marginTop: tokens.spacing.xs,
    color: colors.red[600],
    fontSize: tokens.font.md,
  },
  successText: {
    ...base.textSmSuccess,
    marginTop: tokens.spacing.xs,
    color: colors.green[600],
    fontSize: tokens.font.md,
  },

  primaryBtn: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: PRIMARY_600,
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
  },

  grayBtn: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: colors.gray[100],
    alignSelf: 'flex-start',
  },
  grayBtnText: {
    color: colors.textMuted,
    fontWeight: tokens.fontWeight.bold,
    fontSize: tokens.font.sm,
  },

  btnDisabled: { opacity: 0.5 },
  btnPressed: { transform: [{ scale: 0.98 }] },

  infoBox: {
    marginTop: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.green[200],
    backgroundColor: colors.green[50],
    padding: tokens.padding.sm,
  },
  infoTitle: { fontWeight: tokens.fontWeight.extrabold, color: colors.green[800] },
  infoSub: { fontSize: tokens.font.xs, color: colors.green[600], marginTop: tokens.spacing.xxs },

  autoBox: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: colors.green[200],
    backgroundColor: colors.green[50],
    padding: tokens.padding.sm,
  },
  autoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  autoTitle: { fontWeight: tokens.fontWeight.extrabold, color: colors.green[900] },
  autoSub: { fontSize: tokens.font.xs, color: colors.green[700] },
  autoHint: { fontSize: tokens.font.xs, color: colors.green[600], marginTop: tokens.spacing.xxs },

  badge: {
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.micro,
    borderRadius: tokens.radius.pill,
    backgroundColor: PRIMARY_600,
  },
  badgeText: { color: colors.white, fontSize: tokens.font.xs, fontWeight: tokens.fontWeight.extrabold },

  footer: {
    marginTop: tokens.spacing.md3,
    paddingTop: tokens.padding.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  saveBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: tokens.padding.md,
    paddingVertical: tokens.padding.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: PRIMARY_600,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.white, fontWeight: tokens.fontWeight.extrabold, fontSize: tokens.font.sm },

  toast: {
    position: 'absolute',
    top: 24,
    right: 16,
    flexDirection: 'row',
    gap: 10,
    padding: tokens.padding.baseLg,
    borderRadius: tokens.radius.baseLg,
    elevation: 8,
  },
  toastError: { backgroundColor: colors.red[600] },
  toastInfo: { backgroundColor: colors.blue[600] },
  toastSuccess: { backgroundColor: colors.green[600] },
  toastText: { color: colors.white, fontWeight: tokens.fontWeight.extrabold },
});
