import { StyleSheet } from 'react-native';
import { tokens } from '@/styles/style';

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
            placeholderTextColor={tokens.colors.neutral[400]}
          />

          <Text style={styles.label}>내용</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="규정 내용을 입력하세요"
            style={[styles.input, styles.textArea]}
            multiline
            placeholderTextColor={tokens.colors.neutral[400]}
          />
        </Card>

        <Button variant="primary" size="lg">
          저장하기
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.neutral[50],
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: tokens.colors.neutral[700],
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: tokens.colors.neutral[900],
    backgroundColor: tokens.colors.white,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
});
