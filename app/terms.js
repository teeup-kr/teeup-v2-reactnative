import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import HtmlContent from '@/components/ui/HtmlContent';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { termsTabs } from '@/constants/termsConstants';
import { termsApi } from '@/lib/api/api';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';


function readTabFromHash() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const raw = (window.location.hash || '').replace(/^#/, '').trim();
  if (!raw) return null;
  return termsTabs.some((t) => t.id === raw) ? raw : null;
}

function syncUrlHash(tabId) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  const { pathname, search } = window.location;
  const next = `${pathname}${search}#${tabId}`;
  if (`${pathname}${search}${window.location.hash}` === next) return;
  window.history.replaceState(null, '', next);
}

const TabButton = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.tabButton,
      selected && styles.tabButtonActive,
      pressed && styles.tabButtonPressed,
    ]}
  >
    <Text style={[styles.tabButtonText, selected && styles.tabButtonTextActive]}>{label}</Text>
  </Pressable>
);

export default function TermsScreen() {
  const params = useLocalSearchParams();

  const tabFromParams = useMemo(() => {
    const tab = typeof params.tab === 'string' ? params.tab : '';
    return termsTabs.some((item) => item.id === tab) ? tab : null;
  }, [params.tab]);

  const [activeTab, setActiveTab] = useState(() => {
    const fromHash = readTabFromHash();
    if (fromHash) return fromHash;
    if (tabFromParams) return tabFromParams;
    return 'terms';
  });

  const [termsData, setTermsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  /** 쿼리 ?tab= 만 바뀐 진입 (해시 없음) */
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (readTabFromHash()) return;
    if (tabFromParams && tabFromParams !== activeTab) {
      setActiveTab(tabFromParams);
    }
  }, [tabFromParams, activeTab]);

  /** 브라우저 뒤로/앞으로·주소창 해시 변경 */
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
    const onHashChange = () => {
      const next = readTabFromHash();
      if (next) setActiveTab(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  /** 첫 방문 시 해시 없으면 현재 탭을 URL에 맞춤 */
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (window.location.hash) return;
    syncUrlHash(activeTab);
  }, [activeTab]);

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
          terms: service?.content,
          privacy: privacy?.content,
          collection: collection?.content,
          marketing: marketing?.content,
        });
      } catch (apiError) {
        setError(apiError?.message || '약관을 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTerms();
  }, []);

  const activeContent = termsData[activeTab] ?? '';

  const handleSelectTab = useCallback((tabId) => {
    setActiveTab(tabId);
    syncUrlHash(tabId);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="약관 및 정책" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tabRow}>
          {termsTabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              selected={activeTab === tab.id}
              onPress={() => handleSelectTab(tab.id)}
            />
          ))}
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{termsTabs.find((tab) => tab.id === activeTab)?.label}</Text>
          {isLoading ? (
            <Text style={styles.loadingText}>약관을 불러오는 중입니다...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : !activeContent || String(activeContent).trim() === '' ? (
            <Text style={styles.loadingText}>등록된 약관이 없습니다.</Text>
          ) : (
            <View style={styles.contentBox}>
              <HtmlContent html={activeContent} baseStyle={styles.contentText} />
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: tokens.spacing.md,
  },
  tabButton: {
    paddingHorizontal: tokens.padding.sm,
    paddingVertical: tokens.padding.xs,
    borderRadius: tokens.radius.lg,
    backgroundColor: colors.neutral[100],
    marginRight: tokens.spacing.xs2,
    marginBottom: tokens.spacing.xs2,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabButtonPressed: {
    opacity: 0.9,
  },
  tabButtonText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    fontWeight: tokens.fontWeight.semibold,
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  card: {
    padding: tokens.padding.lg,
  },
  cardTitle: { ...base.cardTitle, marginBottom: tokens.spacing.sm2 },
  contentBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: tokens.radius.md,
    padding: tokens.padding.sm,
  },
  contentText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[700],
    lineHeight: 18,
    marginBottom: tokens.spacing.xs2,
  },
  loadingText: base.textSmSubtle,
  errorText: base.textSmError,
});