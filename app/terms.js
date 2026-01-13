import {
useLocalSearchParams } from 'expo-router';
import { useEffect,
useMemo,
useState } from 'react';
import { Pressable,
ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { termsTabs } from '@/constants/termsConstants';
import { termsApi } from '@/lib/termsApi';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/terms';

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
    return termsTabs.some((item) => item.id === tab) ? tab : 'terms';
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
          {termsTabs.map((tab) => (
            <TabButton
              key={tab.id}
              label={tab.label}
              selected={activeTab === tab.id}
              onPress={() => setActiveTab(tab.id)}
            />
          ))}
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{termsTabs.find((tab) => tab.id === activeTab)?.label}</Text>
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

