import React, { useMemo, useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Card from '../../components/ui/Card';
import { colors } from '../../theme/colors';
import { termsApi } from '../../lib/termsApi';

const tabs = [
  { id: 'terms', label: '서비스 이용약관' },
  { id: 'privacy', label: '개인정보처리방침' },
  { id: 'collection', label: '개인정보 수집' },
  { id: 'marketing', label: '마케팅 수신' },
];


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
  const initialTab = useMemo(() => {
    const tab = typeof params.tab === 'string' ? params.tab : 'terms';
    return tabs.some((item) => item.id === tab) ? tab : 'terms';
  }, [params.tab]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [termsData, setTermsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const contentList = useMemo(() => {
    const content = termsData[activeTab];
    if (content) {
      return String(content).split('\n').filter(Boolean);
    }
    return [];
  }, [activeTab, termsData]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="약관 및 정책" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              selected={activeTab === tab.id}
              onPress={() => setActiveTab(tab.id)}
            />
          ))}
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{tabs.find((tab) => tab.id === activeTab)?.label}</Text>
          {isLoading ? (
            <Text style={styles.loadingText}>약관을 불러오는 중입니다...</Text>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : contentList.length === 0 ? (
            <Text style={styles.loadingText}>등록된 약관이 없습니다.</Text>
          ) : (
            <View style={styles.contentBox}>
              {contentList.map((line) => (
                <Text key={line} style={styles.contentText}>
                  {line}
                </Text>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    marginRight: 8,
    marginBottom: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.primary[600],
  },
  tabButtonPressed: {
    opacity: 0.9,
  },
  tabButtonText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  card: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  contentBox: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: 12,
  },
  contentText: {
    fontSize: 12,
    color: colors.neutral[700],
    lineHeight: 18,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
});
