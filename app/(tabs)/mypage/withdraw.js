import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import Modal from '../../../src/components/ui/Modal';
import ScreenHeader from '../../../src/components/ui/ScreenHeader';
import { authApi } from '../../../src/lib/authApi';
import { colors } from '../../../src/theme/colors';

export default function WithdrawScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const handleSubmit = () => {
    if (!agreed) {
      setError('안내사항에 동의해주세요.');
      return;
    }
    if (confirmText !== '회원탈퇴') {
      setError('정확히 "회원탈퇴"를 입력해주세요.');
      return;
    }
    setError('');
    setModalOpen(true);
  };

  const handleWithdrawConfirm = async () => {
    try {
      setIsSubmitting(true);
      await authApi.deleteAccount();
      setResultMessage('회원 탈퇴가 완료되었습니다.');
      setModalOpen(false);
      router.replace('/login');
    } catch (apiError) {
      setError(apiError?.message || '회원 탈퇴에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="회원탈퇴" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <FontAwesome5 name="exclamation-triangle" size={16} color={colors.error[600]} />
            <Text style={styles.warningTitle}>회원 탈퇴 안내</Text>
          </View>
          <Text style={styles.warningText}>• 탈퇴 시 가입한 클럽 및 기록 데이터가 삭제됩니다.</Text>
          <Text style={styles.warningText}>• 복구가 불가능하므로 신중하게 진행해주세요.</Text>
          <Text style={styles.warningText}>• 법령에 따라 일부 정보는 일정 기간 보관됩니다.</Text>
        </View>

        <Card style={styles.card}>
          <Pressable
            onPress={() => setAgreed((prev) => !prev)}
            style={styles.agreeRow}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed ? (
                <FontAwesome5 name="check" size={12} color={colors.white} />
              ) : null}
            </View>
            <Text style={styles.agreeText}>위 내용을 확인했으며 동의합니다.</Text>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.inputLabel}>확인을 위해 "회원탈퇴"를 입력하세요.</Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="회원탈퇴"
            style={[styles.input, error && styles.inputError]}
            placeholderTextColor={colors.neutral[400]}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </Card>

        <Button style={styles.withdrawButton} onPress={handleSubmit}>
          탈퇴 진행
        </Button>
        {resultMessage ? <Text style={styles.successText}>{resultMessage}</Text> : null}
      </ScrollView>

      <Modal
        visible={modalOpen}
        title="회원 탈퇴 확인"
        onClose={() => setModalOpen(false)}
        footer={(
          <View style={styles.modalFooter}>
            <Button
              variant="outline"
              size="sm"
              style={[styles.modalButton, styles.modalButtonSpacing]}
              onPress={() => setModalOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              style={styles.modalButton}
              onPress={handleWithdrawConfirm}
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? '처리 중...' : '탈퇴 확정'}
            </Button>
          </View>
        )}
      >
        <Text style={styles.modalText}>회원 탈퇴 후에는 모든 데이터가 삭제됩니다.</Text>
        <Text style={styles.modalText}>정말로 탈퇴하시겠습니까?</Text>
      </Modal>
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
  warningCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
    marginBottom: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: colors.error[700],
  },
  warningText: {
    fontSize: 12,
    color: colors.error[700],
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.error[600],
    borderColor: colors.error[600],
  },
  agreeText: {
    fontSize: 12,
    color: colors.neutral[700],
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
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
  inputError: {
    borderColor: colors.error[500],
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: colors.error[600],
  },
  successText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.success[600],
    textAlign: 'center',
  },
  withdrawButton: {
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
  },
  modalButtonSpacing: {
    marginRight: 8,
  },
  modalText: {
    fontSize: 13,
    color: colors.neutral[700],
    marginBottom: 8,
  },
});
