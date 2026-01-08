import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppFooter from '@/components/layout/AppFooter';
import AppHeader from '@/components/layout/AppHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { genderOptions } from '@/constants/mypageConstants';
import { usersApi } from '@/lib/api';
import { formatBirthdate, normalizeGender } from '@/lib/mypageUtils';
import { extractData } from '@/lib/responseUtils';
import { colors } from '@/theme/colors';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    nickname: '',
    realname: '',
    phone_number: '',
    birthdate: '',
    gender: 'none',
    email: '',
    average_score: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getMyProfile();
      const user = extractData(response) || {};
      setForm({
        nickname: user.nickname || '',
        realname: user.realname || '',
        phone_number: user.phone_number || '',
        birthdate: formatBirthdate(user.birthdate),
        gender: normalizeGender(user.gender),
        email: user.email || '',
        average_score: user.average_score !== null && user.average_score !== undefined ? String(user.average_score) : '',
      });
    } catch (fetchError) {
      console.error('프로필 조회 실패:', fetchError);
      setError('회원정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.nickname || !form.realname) {
      Alert.alert('안내', '닉네임과 실명은 필수입니다.');
      return;
    }

    const payload = {
      nickname: form.nickname,
      realname: form.realname,
      phone_number: form.phone_number || null,
      birthdate: form.birthdate || null,
      gender: genderOptions.find((option) => option.id === form.gender)?.value || '',
      average_score: form.average_score ? Number(form.average_score) : null,
    };

    try {
      setSaving(true);
      await usersApi.updateMyProfile(payload);
      Alert.alert('완료', '회원정보가 수정되었습니다.');
      router.back();
    } catch (saveError) {
      console.error('프로필 저장 실패:', saveError);
      Alert.alert('오류', saveError?.message || '프로필 업데이트에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <AppHeader />
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.primary[600]} />
          </View>
          <AppFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <AppHeader />
          <View style={styles.stateContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <AppFooter />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AppHeader />
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>기본 정보</Text>
          <Input
            label="닉네임"
            value={form.nickname}
            onChangeText={handleChange('nickname')}
            placeholder="닉네임 입력"
            required
          />
          <Input
            label="실명"
            value={form.realname}
            onChangeText={handleChange('realname')}
            placeholder="실명 입력"
            required
          />
          <Input
            label="연락처"
            value={form.phone_number}
            onChangeText={handleChange('phone_number')}
            placeholder="01012345678"
            keyboardType="number-pad"
          />
          <Input
            label="생년월일"
            value={form.birthdate}
            onChangeText={handleChange('birthdate')}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.fieldLabel}>성별</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((option) => {
              const selected = form.gender === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleChange('gender')(option.id)}
                  style={({ pressed }) => [
                    styles.genderChip,
                    selected && styles.genderChipActive,
                    pressed && styles.genderChipPressed,
                  ]}
                >
                  <Text style={[styles.genderText, selected && styles.genderTextActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.infoRow}>
            <FontAwesome5 name="envelope" size={12} color={colors.neutral[500]} />
            <Text style={styles.infoText}>이메일</Text>
            <Text style={styles.infoValue}>{form.email}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>골프 정보</Text>
          <Input
            label="평균 스코어"
            value={form.average_score}
            onChangeText={handleChange('average_score')}
            placeholder="예: 88"
            keyboardType="number-pad"
          />
          <View style={styles.infoRow}>
            <FontAwesome5 name="golf-ball" size={12} color={colors.neutral[500]} />
            <Text style={styles.infoText}>핸디캡 자동 계산</Text>
            <Text style={styles.infoValue}>최근 5회 기록 반영</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>보안 설정</Text>
          <Pressable
            onPress={() => router.push('/mypage/change-password')}
            style={({ pressed }) => [styles.securityRow, pressed && styles.securityRowPressed]}
          >
            <View>
              <Text style={styles.securityTitle}>비밀번호 변경</Text>
              <Text style={styles.securitySubtitle}>정기적으로 비밀번호를 변경하세요.</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={12} color={colors.neutral[400]} />
          </Pressable>
        </Card>

        <Button style={styles.saveButton} onPress={handleSave} loading={saving}>
          저장하기
        </Button>
        <AppFooter />
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
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.error[600],
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    marginRight: 8,
    marginBottom: 8,
  },
  genderChipActive: {
    backgroundColor: colors.primary[600],
  },
  genderChipPressed: {
    opacity: 0.9,
  },
  genderText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  genderTextActive: {
    color: colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 12,
    color: colors.neutral[700],
    marginLeft: 8,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  securityRowPressed: {
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  securitySubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
  saveButton: {
    marginTop: 8,
  },
});
