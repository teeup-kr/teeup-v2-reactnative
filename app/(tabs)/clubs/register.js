import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import ScreenHeader from '../../../src/components/ui/ScreenHeader';
import { clubFeeCycles, clubRegisterTypes } from '../../../src/constants/clubConstants';
import { colors } from '../../../src/theme/colors';

export default function ClubRegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    type: 'REGULAR',
    description: '',
    memberCount: '1',
    location: '',
    contact: '',
    additionalInfo: '',
    attachment: '클럽 소개서.pdf',
  });
  const [hasRegularFee, setHasRegularFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState('');
  const [feeCycle, setFeeCycle] = useState('MONTHLY');
  const [feeDescription, setFeeDescription] = useState('');

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="클럽 만들기" />
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>클럽 기본 정보</Text>
          <Text style={styles.sectionSubtitle}>필수 정보를 입력해주세요.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>클럽명</Text>
            <TextInput
              value={formData.name}
              onChangeText={handleChange('name')}
              placeholder="클럽명을 입력하세요"
              style={styles.input}
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>클럽 타입</Text>
            <View style={styles.chipRow}>
              {clubRegisterTypes.map((type) => (
                <Pressable
                  key={type.id}
                  onPress={() => handleChange('type')(type.id)}
                  style={[styles.chip, formData.type === type.id && styles.chipActive]}
                >
                  <Text style={[styles.chipText, formData.type === type.id && styles.chipTextActive]}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>클럽 설명</Text>
            <TextInput
              value={formData.description}
              onChangeText={handleChange('description')}
              placeholder="클럽 소개글을 입력하세요"
              style={[styles.input, styles.textArea]}
              multiline
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          <View style={styles.fieldGroupRow}>
            <View style={styles.halfField}>
              <Text style={styles.label}>예상 멤버 수</Text>
              <TextInput
                value={formData.memberCount}
                onChangeText={handleChange('memberCount')}
                placeholder="예: 20"
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            <View style={[styles.halfField, styles.halfFieldLast]}>
              <Text style={styles.label}>지역</Text>
              <TextInput
                value={formData.location}
                onChangeText={handleChange('location')}
                placeholder="예: 서울/경기"
                style={styles.input}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>대표 연락처</Text>
            <TextInput
              value={formData.contact}
              onChangeText={handleChange('contact')}
              placeholder="01012345678"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>추가 안내</Text>
            <TextInput
              value={formData.additionalInfo}
              onChangeText={handleChange('additionalInfo')}
              placeholder="가입 안내, 회비 안내 등을 적어주세요"
              style={[styles.input, styles.textArea]}
              multiline
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>정기 회비</Text>
              <Text style={styles.sectionSubtitle}>회비가 있다면 설정해주세요.</Text>
            </View>
            <Pressable
              onPress={() => setHasRegularFee((prev) => !prev)}
              style={[styles.toggle, hasRegularFee && styles.toggleActive]}
            >
              <Text style={styles.toggleText}>{hasRegularFee ? 'ON' : 'OFF'}</Text>
            </Pressable>
          </View>

          {hasRegularFee && (
            <View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>회비 금액</Text>
                <TextInput
                  value={feeAmount}
                  onChangeText={setFeeAmount}
                  placeholder="예: 50000"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>회비 주기</Text>
                <View style={styles.chipRow}>
                  {clubFeeCycles.map((cycle) => (
                    <Pressable
                      key={cycle.id}
                      onPress={() => setFeeCycle(cycle.id)}
                      style={[styles.chip, feeCycle === cycle.id && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, feeCycle === cycle.id && styles.chipTextActive]}>
                        {cycle.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>회비 설명</Text>
                <TextInput
                  value={feeDescription}
                  onChangeText={setFeeDescription}
                  placeholder="회비 사용처 또는 납부 안내"
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            </View>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>첨부 파일</Text>
          <Text style={styles.sectionSubtitle}>클럽 소개서, 규정 등을 첨부하세요.</Text>
          <Pressable style={styles.uploadBox}>
            <FontAwesome5 name="file-alt" size={18} color={colors.neutral[500]} />
            <View style={styles.uploadTextWrap}>
              <Text style={styles.uploadTitle}>파일 선택</Text>
              <Text style={styles.uploadSubtitle}>{formData.attachment}</Text>
            </View>
          </Pressable>
        </Card>

        <Button variant="primary" size="lg">
          클럽 등록 신청
        </Button>
        <Text style={styles.noticeText}>등록 후 관리자의 승인이 필요합니다.</Text>
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
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldGroupRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  halfField: {
    flex: 1,
    marginRight: 12,
  },
  halfFieldLast: {
    marginRight: 0,
  },
  label: {
    fontSize: 12,
    color: colors.neutral[700],
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipText: {
    fontSize: 12,
    color: colors.neutral[600],
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.neutral[200],
  },
  toggleActive: {
    backgroundColor: colors.primary[600],
  },
  toggleText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
  },
  uploadTextWrap: {
    marginLeft: 12,
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  uploadSubtitle: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },
  noticeText: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 8,
  },
});
