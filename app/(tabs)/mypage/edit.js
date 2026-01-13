import { StyleSheet } from 'react-native';

import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { tokens } from '@/styles/style';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

/* ===========================
   유틸
=========================== */
function formatDateYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYYYYMMDD(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

/* ===========================
   Component
=========================== */
export default function UserProfileEditForm({
  userData = {},
  formData = {},
  errors = {},
  isSocialLogin,

  nicknameMessage,
  isCheckingNickname,
  checkNicknameDuplicate,
  handleInputChange,

  handicapLoading,
  handicapInfo,

  updateProfilePending,
  handleSave,

  showPasswordModal,
  setShowPasswordModal,
  ChangePasswordModal,

  toast,
}) {
  const [isNameComposing, setIsNameComposing] = useState(false);
  const [showBirthPicker, setShowBirthPicker] = useState(false);

  const maxBirthDate = useMemo(() => new Date(), []);
  const birthDateValue =
    parseYYYYMMDD(formData.birthdate) ?? new Date(1990, 0, 1);

  const isNicknameSame =
    (formData.nickname || '') === (userData.nickname || '');

  const calcHandicapFromAvg = (avgStr) => {
    const n = Number(avgStr);
    if (!avgStr || isNaN(n)) return null;
    if (n < 55 || n > 144) return null;
    return Math.max(0, Math.min(72, Math.round(n - 72)));
  };

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
                  {userData.email || '-'}
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
                      {userData.average_score ?? '-'}
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
                            : userData.handicap
                            ? `수동 입력: ${userData.handicap}`
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: 16,
    shadowColor: tokens.colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { ...base.cardTitle, color: tokens.colors.text, marginBottom: 16 },

  stackLg: { gap: 18 },
  stackSm: { gap: 8 },
  rowGap: { flexDirection: 'row', gap: 8 },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: tokens.colors.textMuted,
    marginBottom: 8,
  },
  labelIcon: { marginRight: 8, color: tokens.colors.textMuted },
  required: { color: tokens.colors.red[500] },

  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: tokens.colors.white,
  },
  inputLike: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: tokens.colors.white,
  },
  inputLikeText: { fontSize: 15, color: tokens.colors.text },
  inputPressed: { opacity: 0.9 },

  inputNormal: { borderColor: tokens.colors.inputBorder },
  inputError: {
    borderColor: tokens.colors.red[300],
    backgroundColor: tokens.colors.red[50],
  },

  readonlyBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: tokens.colors.bg,
    borderWidth: 1,
    borderColor: tokens.colors.inputBorder,
    borderRadius: 12,
  },
  readonlyText: { color: tokens.colors.textMuted, fontSize: 15 },

  helperText: { marginTop: 6, fontSize: 12, color: tokens.colors.textSubtle },
  loadingText: base.textSmSubtle,

  errorText: {
    ...base.textSmError,
    marginTop: 6,
    color: tokens.colors.red[600],
    fontSize: 13,
  },
  successText: {
    ...base.textSmSuccess,
    marginTop: 6,
    color: tokens.colors.green[600],
    fontSize: 13,
  },

  primaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PRIMARY_600,
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: tokens.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  grayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: tokens.colors.gray[100],
    alignSelf: 'flex-start',
  },
  grayBtnText: {
    color: tokens.colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
  },

  btnDisabled: { opacity: 0.5 },
  btnPressed: { transform: [{ scale: 0.98 }] },

  infoBox: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.green[200],
    backgroundColor: tokens.colors.green[50],
    padding: 12,
  },
  infoTitle: { fontWeight: '800', color: tokens.colors.green[800] },
  infoSub: { fontSize: 11, color: tokens.colors.green[600], marginTop: 4 },

  autoBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.green[200],
    backgroundColor: tokens.colors.green[50],
    padding: 12,
  },
  autoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  autoTitle: { fontWeight: '800', color: tokens.colors.green[900] },
  autoSub: { fontSize: 11, color: tokens.colors.green[700] },
  autoHint: { fontSize: 11, color: tokens.colors.green[600], marginTop: 4 },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: PRIMARY_600,
  },
  badgeText: { color: tokens.colors.white, fontSize: 11, fontWeight: '800' },

  footer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    alignItems: 'flex-end',
  },
  saveBtn: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PRIMARY_600,
    alignItems: 'center',
  },
  saveBtnText: { color: tokens.colors.white, fontWeight: '800', fontSize: 12 },

  toast: {
    position: 'absolute',
    top: 24,
    right: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    elevation: 8,
  },
  toastError: { backgroundColor: tokens.colors.red[600] },
  toastInfo: { backgroundColor: tokens.colors.blue[600] },
  toastSuccess: { backgroundColor: tokens.colors.green[600] },
  toastText: { color: tokens.colors.white, fontWeight: '800' },
});
