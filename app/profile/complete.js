import { StyleSheet } from 'react-native';
import { tokens } from '@/styles/style';

import {
LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ScrollView,
Text,
View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ScreenHeader from '@/components/ui/ScreenHeader';

export default function ProfileCompleteScreen() {
  const [form, setForm] = useState({
    realName: '',
    phone: '',
    birthdate: '',
    gender: '',
    handicap: '',
    averageScore: '',
  });

  const handleChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="프로필 완성" />
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient
          colors={[tokens.colors.emerald[600], tokens.colors.teal[700]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle}>프로필을 완성하면</Text>
          <Text style={styles.heroSubtitle}>핸디캡 계산과 자동 조편성 기능을 더 정확하게 사용할 수 있습니다.</Text>
        </LinearGradient>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>기본 정보</Text>
          <Input
            label="실명"
            value={form.realName}
            onChangeText={handleChange('realName')}
            placeholder="실명 입력"
            required
          />
          <Input
            label="연락처"
            value={form.phone}
            onChangeText={handleChange('phone')}
            placeholder="01012345678"
            keyboardType="number-pad"
          />
          <Input
            label="생년월일"
            value={form.birthdate}
            onChangeText={handleChange('birthdate')}
            placeholder="YYYY-MM-DD"
          />
          <Input
            label="성별"
            value={form.gender}
            onChangeText={handleChange('gender')}
            placeholder="남성 / 여성"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>골프 정보</Text>
          <Input
            label="현재 핸디캡"
            value={form.handicap}
            onChangeText={handleChange('handicap')}
            placeholder="예: 15.8"
          />
          <Input
            label="평균 스코어"
            value={form.averageScore}
            onChangeText={handleChange('averageScore')}
            placeholder="예: 88"
            keyboardType="number-pad"
          />
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>평균 스코어를 입력하면 자동으로 핸디캡이 계산됩니다.</Text>
          </View>
        </Card>

        <Button style={styles.saveButton}>프로필 저장</Button>
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
  hero: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 12,
    color: tokens.colors.emerald[100],
    lineHeight: 18,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.neutral[900],
    marginBottom: 12,
  },
  tipBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: tokens.colors.primary[50],
  },
  tipText: {
    fontSize: 12,
    color: tokens.colors.primary[700],
  },
  saveButton: {
    marginTop: 8,
  },
});
