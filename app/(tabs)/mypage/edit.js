
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

import { usersApi } from '@/lib/api';
import { authApi } from '@/lib/authApi';
import { extractData } from '@/lib/responseUtils';
import { base, tokens } from '@/styles/style';

import { ChangePasswordModal } from './change-password-modal';

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
  const [, setError] = useState(null);
  const [handicapInfo, setHandicapInfo] = useState(null);
  const [handicapLoading, setHandicapLoading] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [updateProfilePending, setUpdateProfilePending] = useState(false);
  const [toast, setToast] = useState({ open: false, tone: 'success', message: '' });

  const isSocialLogin = useMemo(() => {
    if (profile?.is_social_login != null) return profile.is_social_login;
    if (profile?.is_social != null) return profile.is_social;
    const provider =
      profile?.provider ||
      profile?.auth_provider ||
      profile?.login_provider ||
      profile?.social_provider;
    return Boolean(provider && provider !== 'LOCAL' && provider !== 'local');
  }, [profile]);

  const calcHandicapFromAvg = useCallback((avgStr) => {
    const n = Number(avgStr);
    if (!avgStr || Number.isNaN(n)) return null;
    if (n < 55 || n > 144) return null;
    return Math.max(0, Math.min(72, Math.round(n - 72)));
  }, []);

  const formatDateYYYYMMDD = useCallback((date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const parseBirthdate = useCallback((value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  const normalizeBirthdate = useCallback(
    (value) => {
      if (!value) return '';
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
      }
      const parsed = parseBirthdate(value);
      return parsed ? formatDateYYYYMMDD(parsed) : '';
    },
    [formatDateYYYYMMDD, parseBirthdate],
  );

  const birthDateValue = useMemo(() => {
    const parsed = parseBirthdate(formData.birthdate);
    return parsed || maxBirthDate;
  }, [formData.birthdate, maxBirthDate, parseBirthdate]);

  const isNicknameSame = useMemo(() => {
    if (!profile?.nickname) return false;
    return profile.nickname === (formData.nickname || '').trim();
  }, [formData.nickname, profile?.nickname]);

  useEffect(() => {
    if (isNicknameSame) {
      setNicknameChecked(true);
      setErrors((prev) => ({ ...prev, nickname: '' }));
    }
  }, [isNicknameSame]);

  const showToast = useCallback((tone, message) => {
    setToast({ open: true, tone, message });
  }, []);

  useEffect(() => {
    if (!toast.open) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 2200);
    return () => clearTimeout(timer);
  }, [toast.open]);

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        if (field === 'average_score') {
          next.calculatedHandicap = calcHandicapFromAvg(value);
        }
        return next;
      });
      setErrors((prev) => ({ ...prev, [field]: '' }));
      if (field === 'nickname') {
        setNicknameChecked(false);
        setNicknameMessage('');
      }
    },
    [calcHandicapFromAvg],
  );

  const checkNicknameDuplicate = useCallback(async () => {
    if (!formData.nickname) {
      setErrors((prev) => ({ ...prev, nickname: '닉네임을 입력해주세요.' }));
      return;
    }

    if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      setErrors((prev) => ({ ...prev, nickname: '닉네임은 2-20자여야 합니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    if (!/^[a-zA-Z가-힣0-9]+$/.test(formData.nickname)) {
      setErrors((prev) => ({ ...prev, nickname: '닉네임은 영문, 한글, 숫자만 사용 가능합니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    try {
      setIsCheckingNickname(true);
      setErrors((prev) => ({ ...prev, nickname: '' }));
      const result = await authApi.checkNickname(formData.nickname.trim());
      if (result?.is_available && result?.is_valid) {
        setNicknameChecked(true);
        setNicknameMessage('사용 가능한 닉네임입니다.');
      } else {
        setNicknameChecked(false);
        setNicknameMessage('');
        setErrors((prev) => ({
          ...prev,
          nickname: result?.message || '이미 사용 중인 닉네임입니다.',
        }));
      }
    } catch (checkError) {
      setNicknameChecked(false);
      setNicknameMessage('');
      setErrors((prev) => ({
        ...prev,
        nickname: checkError?.message || '닉네임 확인에 실패했습니다.',
      }));
    } finally {
      setIsCheckingNickname(false);
    }
  }, [formData.nickname]);

  const validateForm = useCallback(() => {
    const nextErrors = {};
    const nickname = formData.nickname?.trim();

    if (!nickname) {
      nextErrors.nickname = '닉네임을 입력해주세요.';
    } else if (nickname.length < 2 || nickname.length > 20) {
      nextErrors.nickname = '닉네임은 2-20자여야 합니다.';
    } else if (!/^[a-zA-Z가-힣0-9]+$/.test(nickname)) {
      nextErrors.nickname = '닉네임은 영문, 한글, 숫자만 사용 가능합니다.';
    } else if (!isNicknameSame && !nicknameChecked) {
      nextErrors.nickname = '닉네임 중복확인을 해주세요.';
    }

    if (!formData.realname?.trim()) {
      nextErrors.realname = '실명을 입력해주세요.';
    }

    if (!formData.phone_number?.trim()) {
      nextErrors.phone_number = '전화번호를 입력해주세요.';
    }

    if (!formData.birthdate) {
      nextErrors.birthdate = '생년월일을 선택해주세요.';
    }

    if (isSocialLogin) {
      const avg = Number(formData.average_score);
      if (!formData.average_score) {
        nextErrors.average_score = '평균 타수를 입력해주세요.';
      } else if (Number.isNaN(avg) || avg < 55 || avg > 144) {
        nextErrors.average_score = '평균 타수는 55~144 사이여야 합니다.';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [formData, isNicknameSame, isSocialLogin, nicknameChecked]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getMyProfile();
      const user = extractData(response);
      setProfile(user || {});
      const averageScore = user?.average_score != null ? String(user.average_score) : '';
      setFormData((prev) => ({
        ...prev,
        nickname: user?.nickname || '',
        realname: user?.realname || '',
        phone_number: user?.phone_number || '',
        birthdate: normalizeBirthdate(user?.birthdate),
        gender: user?.gender || '',
        average_score: averageScore,
        calculatedHandicap: calcHandicapFromAvg(averageScore),
      }));
      setNicknameChecked(Boolean(user?.nickname));
      setNicknameMessage('');
      if (user?.id) {
        setHandicapLoading(true);
        try {
          const handicapResponse = await usersApi.getUserHandicap(user.id);
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
      setError('사용자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [calcHandicapFromAvg, normalizeBirthdate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    const payload = {
      nickname: formData.nickname.trim(),
      realname: formData.realname.trim(),
      phone_number: formData.phone_number.trim(),
      birthdate: formData.birthdate || null,
      gender: formData.gender || profile?.gender || null,
    };

    if (isSocialLogin) {
      payload.average_score = formData.average_score ? Number(formData.average_score) : null;
    }

    try {
      setUpdateProfilePending(true);
      await usersApi.updateMyProfile(payload);
      showToast('success', '저장되었습니다.');
      setNicknameChecked(true);
      fetchProfile();
    } catch (updateError) {
      console.error('회원정보 수정 실패:', updateError);
      showToast('error', updateError?.message || '회원정보 수정에 실패했습니다.');
    } finally {
      setUpdateProfilePending(false);
    }
  }, [fetchProfile, formData, isSocialLogin, profile?.gender, showToast, validateForm]);

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
                  onChangeText={(t) =>
                    handleInputChange('nickname', t)
                  }
                  placeholder="닉네임을 입력하세요"
                  placeholderTextColor={tokens.colors.gray[400]}
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
                  onPress={() => setShowPasswordModal(true)}
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
                onChangeText={(t) => {
                  if (!isNameComposing)
                    handleInputChange('realname', t);
                }}
                onCompositionStart={() =>
                  setIsNameComposing(true)
                }
                onCompositionEnd={(e) => {
                  setIsNameComposing(false);
                  handleInputChange(
                    'realname',
                    e?.nativeEvent?.text ?? formData.realname
                  );
                }}
                placeholder="실명을 입력하세요"
                placeholderTextColor={tokens.colors.gray[400]}
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
                onChangeText={(t) =>
                  handleInputChange('phone_number', t)
                }
                placeholder="전화번호를 입력하세요"
                placeholderTextColor={tokens.colors.gray[400]}
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
                onPress={() => setShowBirthPicker(true)}
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
                  onChange={(event, selected) => {
                    if (Platform.OS !== 'ios')
                      setShowBirthPicker(false);
                    if (event.type === 'dismissed') return;
                    if (selected) {
                      handleInputChange(
                        'birthdate',
                        formatDateYYYYMMDD(selected)
                      );
                    }
                  }}
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
                    onChangeText={(t) =>
                      handleInputChange('average_score', t)
                    }
                    placeholder="평균 타수를 입력하세요 (55-144)"
                    placeholderTextColor={tokens.colors.gray[400]}
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
              <FontAwesome5 name="save" size={14} color={tokens.colors.white} />
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
            onClose={() => setShowPasswordModal(false)}
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
            color={tokens.colors.white}
          />
          <Text style={styles.toastText}>
            {toast.message}
          </Text>
        </View>
      )}
    </View>
  );
}

const PRIMARY_600 = tokens.colors.green[600];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.colors.bg },
  container: base.container,

  card: {
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.padding.md,
    shadowColor: tokens.colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { ...base.cardTitle, color: tokens.colors.text, marginBottom: tokens.spacing.md },

  stackLg: { gap: 18 },
  stackSm: { gap: 8 },
  rowGap: { flexDirection: 'row', gap: 8 },

  label: {
    fontSize: tokens.font.md,
    fontWeight: tokens.fontWeight.semibold,
    color: tokens.colors.textMuted,
    marginBottom: tokens.spacing.xs2,
  },
  labelIcon: { marginRight: tokens.spacing.xs2, color: tokens.colors.textMuted },
  required: { color: tokens.colors.red[500] },

  input: {
    flex: 1,
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.sm,
    fontSize: tokens.font.lg,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.white,
  },
  inputLike: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.sm,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.white,
  },
  inputLikeText: { fontSize: tokens.font.lg, color: tokens.colors.text },
  inputPressed: { opacity: 0.9 },

  inputNormal: { borderColor: tokens.colors.inputBorder },
  inputError: {
    borderColor: tokens.colors.red[300],
    backgroundColor: tokens.colors.red[50],
  },

  readonlyBox: {
    paddingHorizontal: tokens.padding.baseLg,
    paddingVertical: tokens.padding.sm,
    backgroundColor: tokens.colors.bg,
    borderWidth: 1,
    borderColor: tokens.colors.inputBorder,
    borderRadius: tokens.radius.md,
  },
  readonlyText: { color: tokens.colors.textMuted, fontSize: tokens.font.lg },

  helperText: { marginTop: tokens.spacing.xs, fontSize: tokens.font.sm, color: tokens.colors.textSubtle },
  loadingText: base.textSmSubtle,

  errorText: {
    ...base.textSmError,
    marginTop: tokens.spacing.xs,
    color: tokens.colors.red[600],
    fontSize: tokens.font.md,
  },
  successText: {
    ...base.textSmSuccess,
    marginTop: tokens.spacing.xs,
    color: tokens.colors.green[600],
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
    color: tokens.colors.white,
    fontSize: tokens.font.sm,
    fontWeight: tokens.fontWeight.bold,
  },

  grayBtn: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.gray[100],
    alignSelf: 'flex-start',
  },
  grayBtnText: {
    color: tokens.colors.textMuted,
    fontWeight: tokens.fontWeight.bold,
    fontSize: tokens.font.sm,
  },

  btnDisabled: { opacity: 0.5 },
  btnPressed: { transform: [{ scale: 0.98 }] },

  infoBox: {
    marginTop: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.green[200],
    backgroundColor: tokens.colors.green[50],
    padding: tokens.padding.sm,
  },
  infoTitle: { fontWeight: tokens.fontWeight.extrabold, color: tokens.colors.green[800] },
  infoSub: { fontSize: tokens.font.xs, color: tokens.colors.green[600], marginTop: tokens.spacing.xxs },

  autoBox: {
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.green[200],
    backgroundColor: tokens.colors.green[50],
    padding: tokens.padding.sm,
  },
  autoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  autoTitle: { fontWeight: tokens.fontWeight.extrabold, color: tokens.colors.green[900] },
  autoSub: { fontSize: tokens.font.xs, color: tokens.colors.green[700] },
  autoHint: { fontSize: tokens.font.xs, color: tokens.colors.green[600], marginTop: tokens.spacing.xxs },

  badge: {
    paddingHorizontal: tokens.padding.xs,
    paddingVertical: tokens.padding.micro,
    borderRadius: tokens.radius.pill,
    backgroundColor: PRIMARY_600,
  },
  badgeText: { color: tokens.colors.white, fontSize: tokens.font.xs, fontWeight: tokens.fontWeight.extrabold },

  footer: {
    marginTop: tokens.spacing.md3,
    paddingTop: tokens.padding.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
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
  saveBtnText: { color: tokens.colors.white, fontWeight: tokens.fontWeight.extrabold, fontSize: tokens.font.sm },

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
  toastError: { backgroundColor: tokens.colors.red[600] },
  toastInfo: { backgroundColor: tokens.colors.blue[600] },
  toastSuccess: { backgroundColor: tokens.colors.green[600] },
  toastText: { color: tokens.colors.white, fontWeight: tokens.fontWeight.extrabold },
});
