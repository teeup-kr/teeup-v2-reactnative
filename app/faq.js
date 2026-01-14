
import {
  FontAwesome5
} from '@expo/vector-icons';
import {
  useEffect,
  useState
} from 'react';
import {
  Pressable,
  ScrollView, StyleSheet, Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { faqApi } from '@/lib/api/api';
import { normalizeFaqList } from '@/lib/util/faqUtils';
import { colors } from '@/styles/colors';
import { base, tokens } from '@/styles/style';


export default function FaqScreen() {
  const [items, setItems] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await faqApi.getFaqs({ page: 1, limit: 20 });
        const normalized = normalizeFaqList(response);
        if (normalized.length > 0) {
          setItems(normalized);
          setOpenId(normalized[0]?.id || null);
        }
      } catch (apiError) {
        setError(apiError?.message || 'FAQ를 불러오는 데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFaqs();
  }, []);

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="FAQ" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>자주 묻는 질문을 확인하세요.</Text>
        {isLoading ? (
          <Card style={styles.card}>
            <Text style={styles.loadingText}>FAQ를 불러오는 중입니다...</Text>
          </Card>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : items.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.loadingText}>등록된 FAQ가 없습니다.</Text>
          </Card>
        ) : (
          items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <Card key={item.id} style={styles.card}>
                <Pressable onPress={() => toggleItem(item.id)} style={styles.questionRow}>
                  <Text style={styles.questionText}>{item.question}</Text>
                  <FontAwesome5
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={12}
                    color={colors.neutral[500]}
                  />
                </Pressable>
                {isOpen ? <Text style={styles.answerText}>{item.answer}</Text> : null}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: base.safeAreaNeutral,
  container: base.containerLg,
  subtitle: { ...base.textSmMuted, marginBottom: tokens.spacing.sm2 },
  card: {
    marginBottom: tokens.spacing.sm2,
  },
  questionRow: base.rowBetween,
  questionText: {
    fontSize: tokens.font.base,
    fontWeight: tokens.fontWeight.semibold,
    color: colors.neutral[900],
    flex: 1,
    marginRight: tokens.spacing.xs2,
  },
  answerText: {
    fontSize: tokens.font.sm,
    color: colors.neutral[600],
    marginTop: tokens.spacing.sm2,
    lineHeight: 18,
  },
  loadingText: base.textSmSubtle,
  errorText: base.textSmError,
});