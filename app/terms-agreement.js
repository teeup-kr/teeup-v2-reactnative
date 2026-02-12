import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import HtmlContent from '@/components/ui/HtmlContent';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { termsTabs } from '@/constants/termsConstants';
import { useAuth } from '@/context/AuthContext';
import { authApi, termsApi } from '@/lib/api/api';
import { tokenStorage } from '@/lib/tokenStorage';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';

const REQUIRED_TERMS = [
  { id: 'terms', key: 'TERMS_OF_SERVICE', label: '서비스 이용약관', required: true },
  { id: 'privacy', key: 'PRIVACY_POLICY', label: '개인정보처리방침', required: true },
  { id: 'collection', key: 'PRIVACY_COLLECTION', label: '개인정보 수집 및 이용동의', required: true },
];

const OPTIONAL_TERMS = [
  { id: 'marketing', key: 'MARKETING_OPT_IN', label: '마케팅 정보 수신 동의', required: false },
];

export default function TermsAgreementScreen() {
  const router = useRouter();
  const { refreshAuth, setAuthError } = useAuth();

  const [agreements, setAgreements] = useState({
    TERMS_OF_SERVICE: false,
    PRIVACY_POLICY: false,
    PRIVACY_COLLECTION: false,
    MARKETING_OPT_IN: false, // 마케팅 동의 (선택)
  });
  const [termsData, setTermsData] = useState({});
  const [termsIds, setTermsIds] = useState({}); // 약관 ID 저장
  const [expandedTerm, setExpandedTerm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 약관 데이터 로드
  useEffect(() => {
    const loadTerms = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [service, privacy, collection, marketing] = await Promise.all([
          termsApi.getActiveServiceTerms(),
          termsApi.getActivePrivacyTerms(),
          termsApi.getActivePrivacyCollectionTerms(),
          termsApi.getActiveMarketingTerms(),
        ]);
        setTermsData({
          TERMS_OF_SERVICE: service?.content || '',
          PRIVACY_POLICY: privacy?.content || '',
          PRIVACY_COLLECTION: collection?.content || '',
          MARKETING_OPT_IN: marketing?.content || '',
        });
        // 약관 ID 저장
        setTermsIds({
          TERMS_OF_SERVICE: service?.id || null,
          PRIVACY_POLICY: privacy?.id || null,
          PRIVACY_COLLECTION: collection?.id || null,
          MARKETING_OPT_IN: marketing?.id || null,
        });
      } catch (apiError) {
        setError(apiError?.message || '약관을 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTerms();
  }, []);

  // 약관 동의 토큰 확인
  useEffect(() => {
    const checkToken = async () => {
      const token = await tokenStorage.getTermsAgreementToken();
      if (!token) {
        // 약관 동의 토큰이 없으면 로그인 페이지로 리다이렉트
        router.replace('/login');
      }
    };
    checkToken();
  }, [router]);

  const handleToggleAgreement = useCallback((key) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleToggleExpand = useCallback((termId) => {
    setExpandedTerm((prev) => (prev === termId ? null : termId));
  }, []);

  const allRequiredAgreed = useMemo(() => {
    return REQUIRED_TERMS.every((term) => agreements[term.key]);
  }, [agreements]);

  const handleSubmit = useCallback(async () => {
    if (!allRequiredAgreed) {
      setError('필수 약관에 모두 동의해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // 동의한 약관의 ID 배열 생성 (필수 + 선택 약관 모두 포함)
      const allTerms = [...REQUIRED_TERMS, ...OPTIONAL_TERMS];
      const agreedTermsIds = allTerms
        .filter((term) => agreements[term.key])
        .map((term) => termsIds[term.key])
        .filter((id) => id !== null && id !== undefined);

      if (agreedTermsIds.length === 0) {
        throw new Error('약관 ID를 찾을 수 없습니다.');
      }

      // 약관 동의 API 호출
      await authApi.agreeToTerms(agreedTermsIds);

      // 약관 동의 완료 후 다시 로그인 시도
      // OAuth 정보가 없으므로 약관 동의 완료 후 자동 로그인은 불가능
      // 사용자에게 다시 로그인하도록 안내하거나, 백엔드에서 정상 토큰을 발급해주는지 확인 필요
      // 일단 홈으로 이동하고 refreshAuth로 상태 확인
      await refreshAuth();
      router.replace('/');
    } catch (err) {
      console.error('약관 동의 실패:', err);
      setError(err?.message || '약관 동의에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [agreements, termsIds, allRequiredAgreed, refreshAuth, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="약관 동의" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>약관을 불러오는 중입니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="약관 동의" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.title}>서비스 이용을 위해 약관 동의가 필요합니다</Text>
          <Text style={styles.subtitle}>
            아래 약관에 동의해주시면 서비스를 이용하실 수 있습니다.
          </Text>
        </Card>

        {/* 필수 약관 */}
        {REQUIRED_TERMS.map((term) => (
          <Card key={term.id} style={styles.card}>
            <View style={styles.termHeader}>
              <Pressable
                onPress={() => handleToggleAgreement(term.key)}
                style={({ pressed }) => [
                  styles.checkbox,
                  agreements[term.key] && styles.checkboxChecked,
                  pressed && styles.checkboxPressed,
                ]}
              >
                {agreements[term.key] && (
                  <FontAwesome5 name="check" size={12} color={colors.white} />
                )}
              </Pressable>
              <View style={styles.termHeaderText}>
                <Text style={styles.termLabel}>
                  {term.label} <Text style={styles.required}>*</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => handleToggleExpand(term.id)}
                style={styles.expandButton}
              >
                <FontAwesome5
                  name={expandedTerm === term.id ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.neutral[600]}
                />
              </Pressable>
            </View>

            {expandedTerm === term.id && (
              <View style={styles.termContent}>
                {termsData[term.key] ? (
                  <HtmlContent html={termsData[term.key]} baseStyle={styles.termText} />
                ) : (
                  <Text style={styles.termTextEmpty}>
                    약관 내용을 불러올 수 없습니다.
                  </Text>
                )}
              </View>
            )}
          </Card>
        ))}

        {/* 선택 약관 (마케팅) */}
        {OPTIONAL_TERMS.map((term) => (
          <Card key={term.id} style={styles.card}>
            <View style={styles.termHeader}>
              <Pressable
                onPress={() => handleToggleAgreement(term.key)}
                style={({ pressed }) => [
                  styles.checkbox,
                  agreements[term.key] && styles.checkboxChecked,
                  pressed && styles.checkboxPressed,
                ]}
              >
                {agreements[term.key] && (
                  <FontAwesome5 name="check" size={12} color={colors.white} />
                )}
              </Pressable>
              <View style={styles.termHeaderText}>
                <Text style={styles.termLabel}>
                  {term.label} <Text style={styles.optional}>(선택)</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => handleToggleExpand(term.id)}
                style={styles.expandButton}
              >
                <FontAwesome5
                  name={expandedTerm === term.id ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.neutral[600]}
                />
              </Pressable>
            </View>

            {expandedTerm === term.id && (
              <View style={styles.termContent}>
                {termsData[term.key] ? (
                  <HtmlContent html={termsData[term.key]} baseStyle={styles.termText} />
                ) : (
                  <Text style={styles.termTextEmpty}>
                    약관 내용을 불러올 수 없습니다.
                  </Text>
                )}
              </View>
            )}
          </Card>
        ))}

        {error && (
          <Card style={[styles.card, styles.errorCard]}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          disabled={!allRequiredAgreed || isSubmitting}
        >
          {isSubmitting ? '처리 중...' : '동의하고 시작하기'}
        </Button>

        <Text style={styles.noticeText}>
          약관에 동의하지 않으시면 서비스를 이용하실 수 없습니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.padding.xl,
  },
  loadingText: {
    marginTop: tokens.spacing.md,
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
  },
  card: {
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.font.lg,
    fontWeight: tokens.fontWeight.bold,
    color: colors.neutral[900],
    marginBottom: tokens.spacing.xs2,
  },
  subtitle: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  checkboxPressed: {
    opacity: 0.8,
  },
  termHeaderText: {
    flex: 1,
  },
  termLabel: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[900],
  },
  required: {
    color: colors.error[600],
  },
  optional: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    fontWeight: tokens.fontWeight.normal,
  },
  expandButton: {
    padding: tokens.padding.xs,
  },
  termContent: {
    marginTop: tokens.spacing.sm,
    padding: tokens.padding.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: tokens.radius.md,
    maxHeight: 300,
  },
  termText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  termTextEmpty: {
    fontSize: tokens.font.sm,
    color: colors.neutral[500],
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
  },
  errorText: {
    fontSize: tokens.font.sm,
    color: colors.error[700],
  },
  noticeText: {
    textAlign: 'center',
    fontSize: tokens.font.xs,
    color: colors.neutral[500],
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
});
