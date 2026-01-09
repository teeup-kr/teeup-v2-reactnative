import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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
import { registerInitialErrors, registerInitialForm } from '@/constants/authConstants';
import { authApi } from '@/lib/authApi';
import { colors } from '@/theme/colors';

const logoImage = require('../public/icons/icon-512.png');

const Checkbox = ({ checked, onPress }) => {
  return (
    <Pressable onPress={onPress} style={[styles.checkboxBox, checked && styles.checkboxChecked]}>
      {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
    </Pressable>
  );
};

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState(registerInitialForm);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState(registerInitialErrors);
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    complexity: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (formData.password) {
      checkPasswordConditions(formData.password);
    }
  }, [formData.password]);

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitError) {
      setSubmitError('');
    }

    if (field === 'email') {
      setEmailChecked(false);
      setEmailMessage('');
      setValidationErrors((prev) => ({ ...prev, email: '' }));
    }

    if (field === 'nickname') {
      setNicknameChecked(false);
      setNicknameMessage('');
      setValidationErrors((prev) => ({ ...prev, nickname: '' }));
    }

    if (field === 'password') {
      setValidationErrors((prev) => ({ ...prev, password: '' }));
    }

    if (field === 'average_score') {
      setValidationErrors((prev) => ({ ...prev, average_score: '' }));
    }
  };

  const checkPasswordConditions = (password) => {
    const lengthCheck = password.length >= 6 && password.length <= 32;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const complexityCheck = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length >= 2;

    setPasswordChecks({
      length: lengthCheck,
      complexity: complexityCheck,
    });
  };

  const checkEmailDuplicate = async () => {
    if (!formData.email) {
      setValidationErrors((prev) => ({ ...prev, email: '이메일을 입력해주세요.' }));
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      setValidationErrors((prev) => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }));
      setEmailChecked(false);
      setEmailMessage('');
      return;
    }

    try {
      setIsCheckingEmail(true);
      setValidationErrors((prev) => ({ ...prev, email: '' }));
      const result = await authApi.checkEmail(formData.email.trim());
      if (result?.is_available && result?.is_valid) {
        setEmailChecked(true);
        setEmailMessage('사용 가능한 이메일입니다.');
      } else {
        setEmailChecked(false);
        setEmailMessage('');
        setValidationErrors((prev) => ({
          ...prev,
          email: result?.message || '이미 사용 중인 이메일입니다.',
        }));
      }
    } catch (error) {
      setEmailChecked(false);
      setEmailMessage('');
      setValidationErrors((prev) => ({
        ...prev,
        email: error?.message || '이메일 확인에 실패했습니다.',
      }));
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkNicknameDuplicate = async () => {
    if (!formData.nickname) {
      setValidationErrors((prev) => ({ ...prev, nickname: '닉네임을 입력해주세요.' }));
      return;
    }

    if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      setValidationErrors((prev) => ({ ...prev, nickname: '닉네임은 2-20자여야 합니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    if (!/^[a-zA-Z가-힣0-9]+$/.test(formData.nickname)) {
      setValidationErrors((prev) => ({ ...prev, nickname: '닉네임은 영문, 한글, 숫자만 사용 가능합니다.' }));
      setNicknameChecked(false);
      setNicknameMessage('');
      return;
    }

    try {
      setIsCheckingNickname(true);
      setValidationErrors((prev) => ({ ...prev, nickname: '' }));
      const result = await authApi.checkNickname(formData.nickname.trim());
      if (result?.is_available && result?.is_valid) {
        setNicknameChecked(true);
        setNicknameMessage('사용 가능한 닉네임입니다.');
      } else {
        setNicknameChecked(false);
        setNicknameMessage('');
        setValidationErrors((prev) => ({
          ...prev,
          nickname: result?.message || '이미 사용 중인 닉네임입니다.',
        }));
      }
    } catch (error) {
      setNicknameChecked(false);
      setNicknameMessage('');
      setValidationErrors((prev) => ({
        ...prev,
        nickname: error?.message || '닉네임 확인에 실패했습니다.',
      }));
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
      return;
    }

    if (confirmPassword !== formData.password) {
      setValidationErrors((prev) => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다.' }));
    } else {
      setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.email) {
      nextErrors.email = '이메일을 입력해주세요.';
    } else if (!emailChecked) {
      nextErrors.email = '이메일 중복확인을 해주세요.';
    }

    if (!formData.password) {
      nextErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6 || formData.password.length > 32) {
      nextErrors.password = '비밀번호는 6자 이상 32자 이하여야 합니다.';
    } else if (!passwordChecks.length || !passwordChecks.complexity) {
      nextErrors.password = '비밀번호 조건을 충족해주세요.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = '비밀번호 재확인을 입력해주세요.';
    } else if (confirmPassword !== formData.password) {
      nextErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.nickname) {
      nextErrors.nickname = '닉네임을 입력해주세요.';
    } else if (!nicknameChecked) {
      nextErrors.nickname = '닉네임 중복확인을 해주세요.';
    }

    if (formData.average_score) {
      const averageScoreValue = parseInt(formData.average_score, 10);
      if (Number.isNaN(averageScoreValue) || averageScoreValue < 55 || averageScoreValue > 144) {
        nextErrors.average_score = '평균 타수는 55타 이상 144타 이하여야 합니다.';
      }
    }

    if (!formData.terms_agreement) {
      nextErrors.terms_agreement = '서비스 이용약관에 동의해주세요.';
    }
    if (!formData.privacy_policy) {
      nextErrors.privacy_policy = '개인정보처리방침에 동의해주세요.';
    }
    if (!formData.privacy_collection) {
      nextErrors.privacy_collection = '개인정보 수집 및 이용동의에 동의해주세요.';
    }

    setValidationErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      setSubmitError('');
      await authApi.register({
        ...formData,
        email: formData.email.trim(),
        nickname: formData.nickname.trim(),
        average_score: formData.average_score ? Number(formData.average_score) : undefined,
      });
      router.replace('/register-success');
    } catch (error) {
      setSubmitError(error?.message || '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = (checked) => {
    setFormData((prev) => ({
      ...prev,
      terms_agreement: checked,
      privacy_policy: checked,
      privacy_collection: checked,
      marketing_consent: checked,
    }));
  };

  const isAllTermsAgreed =
    formData.terms_agreement &&
    formData.privacy_policy &&
    formData.privacy_collection;

  const isFormValid =
    formData.email &&
    emailChecked &&
    formData.password &&
    passwordChecks.length &&
    passwordChecks.complexity &&
    formData.nickname &&
    nicknameChecked &&
    formData.terms_agreement &&
    formData.privacy_policy &&
    formData.privacy_collection;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#E8F5E8', '#FFF8E1']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Card style={styles.card}>
              <View style={styles.brandSection}>
                <View style={styles.logoWrap}>
                  <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                </View>
                <Text style={styles.pageTitle}>회원가입</Text>
                <Text style={styles.pageSubtitle}>골프 모임 플랫폼에 오신 것을 환영합니다</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  이메일 <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inlineField}>
                  <TextInput
                    value={formData.email}
                    onChangeText={handleInputChange('email')}
                    placeholder="이메일을 입력하세요"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, validationErrors.email && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  <Pressable
                    onPress={checkEmailDuplicate}
                    disabled={!formData.email || emailChecked || isCheckingEmail}
                    style={[
                      styles.inlineButton,
                      (!formData.email || emailChecked || isCheckingEmail) && styles.inlineButtonDisabled,
                    ]}
                  >
                    <Text style={styles.inlineButtonText}>
                      {emailChecked ? '확인완료' : isCheckingEmail ? '확인중' : '중복확인'}
                    </Text>
                  </Pressable>
                </View>
                {validationErrors.email ? (
                  <Text style={styles.errorText}>{validationErrors.email}</Text>
                ) : emailMessage ? (
                  <Text style={styles.successText}>{emailMessage}</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  비밀번호 <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={formData.password}
                  onChangeText={handleInputChange('password')}
                  placeholder="비밀번호를 입력하세요"
                  secureTextEntry
                  style={[styles.input, validationErrors.password && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {formData.password ? (
                  <View style={styles.passwordChecks}>
                    <Text style={[styles.checkItem, passwordChecks.length && styles.checkItemSuccess]}>
                      {passwordChecks.length ? '✓' : '○'} 6자 이상 32자 이하
                    </Text>
                    <Text style={[styles.checkItem, passwordChecks.complexity && styles.checkItemSuccess]}>
                      {passwordChecks.complexity ? '✓' : '○'} 영문/특수문자/숫자 중 2개 이상
                    </Text>
                  </View>
                ) : null}
                {validationErrors.password ? (
                  <Text style={styles.errorText}>{validationErrors.password}</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  비밀번호 재확인 <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    if (validationErrors.confirmPassword) {
                      setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  onBlur={validateConfirmPassword}
                  placeholder="비밀번호를 다시 입력하세요"
                  secureTextEntry
                  style={[styles.input, validationErrors.confirmPassword && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {validationErrors.confirmPassword ? (
                  <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
                ) : confirmPassword && confirmPassword === formData.password ? (
                  <Text style={styles.successText}>✓ 비밀번호가 일치합니다.</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  닉네임 <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inlineField}>
                  <TextInput
                    value={formData.nickname}
                    onChangeText={handleInputChange('nickname')}
                    placeholder="닉네임을 입력하세요"
                    style={[styles.input, validationErrors.nickname && styles.inputError]}
                    placeholderTextColor={colors.neutral[400]}
                  />
                  <Pressable
                    onPress={checkNicknameDuplicate}
                    disabled={!formData.nickname || nicknameChecked || isCheckingNickname}
                    style={[
                      styles.inlineButton,
                      (!formData.nickname || nicknameChecked || isCheckingNickname) && styles.inlineButtonDisabled,
                    ]}
                  >
                    <Text style={styles.inlineButtonText}>
                      {nicknameChecked ? '확인완료' : isCheckingNickname ? '확인중' : '중복확인'}
                    </Text>
                  </Pressable>
                </View>
                {validationErrors.nickname ? (
                  <Text style={styles.errorText}>{validationErrors.nickname}</Text>
                ) : nicknameMessage ? (
                  <Text style={styles.successText}>{nicknameMessage}</Text>
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>평균 타수</Text>
                <TextInput
                  value={formData.average_score}
                  onChangeText={(value) => handleInputChange('average_score')(value.replace(/[^0-9]/g, ''))}
                  placeholder="예: 90 (55-144타)"
                  keyboardType="numeric"
                  style={[styles.input, validationErrors.average_score && styles.inputError]}
                  placeholderTextColor={colors.neutral[400]}
                />
                {validationErrors.average_score ? (
                  <Text style={styles.errorText}>{validationErrors.average_score}</Text>
                ) : null}
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>약관 동의</Text>
                <View style={styles.checkboxRow}>
                  <Checkbox checked={isAllTermsAgreed} onPress={() => handleSelectAll(!isAllTermsAgreed)} />
                  <Text style={styles.checkboxLabel}>전체 동의</Text>
                </View>

                <View style={styles.termsList}>
                  <View style={styles.checkboxRow}>
                    <Checkbox
                      checked={formData.terms_agreement}
                      onPress={() => handleInputChange('terms_agreement')(!formData.terms_agreement)}
                    />
                    <Text style={styles.checkboxLabel}>서비스 이용약관 동의 (필수)</Text>
                    <Pressable
                      onPress={() => router.push('/terms?tab=terms')}
                    >
                      <Text style={styles.termsLink}>[보기]</Text>
                    </Pressable>
                  </View>

                  <View style={styles.checkboxRow}>
                    <Checkbox
                      checked={formData.privacy_policy}
                      onPress={() => handleInputChange('privacy_policy')(!formData.privacy_policy)}
                    />
                    <Text style={styles.checkboxLabel}>개인정보처리방침 동의 (필수)</Text>
                    <Pressable
                      onPress={() => router.push('/terms?tab=privacy')}
                    >
                      <Text style={styles.termsLink}>[보기]</Text>
                    </Pressable>
                  </View>

                  <View style={styles.checkboxRow}>
                    <Checkbox
                      checked={formData.privacy_collection}
                      onPress={() => handleInputChange('privacy_collection')(!formData.privacy_collection)}
                    />
                    <Text style={styles.checkboxLabel}>개인정보 수집 및 이용 동의 (필수)</Text>
                    <Pressable
                      onPress={() => router.push('/terms?tab=collection')}
                    >
                      <Text style={styles.termsLink}>[보기]</Text>
                    </Pressable>
                  </View>

                  <View style={styles.checkboxRow}>
                    <Checkbox
                      checked={formData.marketing_consent}
                      onPress={() => handleInputChange('marketing_consent')(!formData.marketing_consent)}
                    />
                    <Text style={styles.checkboxLabel}>마케팅정보 수신동의 (선택)</Text>
                    <Pressable
                      onPress={() => router.push('/terms?tab=marketing')}
                    >
                      <Text style={styles.termsLink}>[보기]</Text>
                    </Pressable>
                  </View>
                </View>

                {(validationErrors.terms_agreement ||
                  validationErrors.privacy_policy ||
                  validationErrors.privacy_collection) && (
                    <Text style={styles.errorText}>
                      {validationErrors.terms_agreement ||
                        validationErrors.privacy_policy ||
                        validationErrors.privacy_collection}
                    </Text>
                  )}
              </View>

              <Button
                variant="primary"
                size="lg"
                loading={isSubmitting}
                disabled={!isFormValid || isSubmitting}
                onPress={handleSubmit}
                style={styles.submitButton}
              >
                {isSubmitting ? '처리 중...' : '회원가입'}
              </Button>
              {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
                <Pressable onPress={() => router.replace('/login')}>
                  <Text style={styles.loginLink}>로그인</Text>
                </Pressable>
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary[50],
  },
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 48,
    height: 48,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 13,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 6,
  },
  required: {
    color: colors.error[500],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error[500],
  },
  inlineField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineButton: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.primary[600],
    borderRadius: 10,
  },
  inlineButtonDisabled: {
    opacity: 0.5,
  },
  inlineButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.error[600],
  },
  successText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.success[600],
  },
  passwordChecks: {
    marginTop: 8,
  },
  checkItem: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  checkItemSuccess: {
    color: colors.success[600],
  },
  termsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: 16,
    marginTop: 8,
  },
  termsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 10,
  },
  termsList: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 12,
    color: colors.neutral[700],
    marginRight: 6,
  },
  termsLink: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 12,
  },
  loginRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
  loginLink: {
    fontSize: 12,
    color: colors.primary[600],
    fontWeight: '600',
    marginLeft: 6,
  },
});
