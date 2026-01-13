import {
useState } from 'react';
import { ScrollView,
Text,
TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { colors } from '@/theme/colors';
import styles from '@/styles/screens/tabs/clubs/clubId/regulations/create';

export default function ClubRegulationCreateScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="규정 작성" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.label}>제목</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="규정 제목을 입력하세요"
            style={styles.input}
            placeholderTextColor={colors.neutral[400]}
          />

          <Text style={styles.label}>내용</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="규정 내용을 입력하세요"
            style={[styles.input, styles.textArea]}
            multiline
            placeholderTextColor={colors.neutral[400]}
          />
        </Card>

        <Button variant="primary" size="lg">
          저장하기
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

