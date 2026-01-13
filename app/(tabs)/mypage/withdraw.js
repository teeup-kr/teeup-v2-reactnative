import { StyleSheet } from 'react-native';
import { tokens } from '@/styles/style';

import {
FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
ScrollView,
Text,
TextInput,
View,
} from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { authApi } from '@/lib/authApi';

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
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <FontAwesome5 name="exclamation-triangle" size={16} color={tokens.colors.error[600]} />
            <Text style={styles.warningTitle}>회원 탈퇴 안내</Text>
          </View>
          <Text style={styles.warningText}>• 회원 탈퇴 시 개인정보는 관련 법령에 따라 처리됩니다.</Text>
          <Text style={styles.warningText}>• 가입한 클럽, 모임, 골프 기록 및 통계 데이터는 삭제되며 복구할 수 없습니다.</Text>
          <Text style={styles.warningText}>• 법령에 따라 일부 정보는 일정 기간 보관될 수 있습니다.</Text>
        </View>

        <Card style={styles.card}>
          <Pressable
            onPress={() => setAgreed((prev) => !prev)}
            style={styles.agreeRow}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed ? (
                <FontAwesome5 name="check" size={12} color={tokens.colors.white} />
              ) : null}
            </View>
            <Text style={styles.agreeText}>위 내용을 확인했으며 동의합니다.</Text>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.inputLabel}>확인을 위해 '회원탈퇴'를 입력하세요.*</Text>
          <TextInput
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder="회원탈퇴"
            style={[styles.input, error && styles.inputError]}
            placeholderTextColor={tokens.colors.neutral[400]}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </Card>

        <Button style={styles.withdrawButton} onPress={handleSubmit} color={tokens.colors.red[600]}>
          회원 탈퇴
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
    </View>
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
  warningCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: tokens.colors.error[50],
    borderWidth: 1,
    borderColor: tokens.colors.error[500],
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
    color: tokens.colors.error[700],
  },
  warningText: {
    fontSize: 12,
    color: tokens.colors.error[700],
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
    borderColor: tokens.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: tokens.colors.error[600],
    borderColor: tokens.colors.error[600],
  },
  agreeText: {
    fontSize: 12,
    color: tokens.colors.neutral[700],
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.neutral[700],
    marginBottom: 8,
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
  },
  inputError: {
    borderColor: tokens.colors.error[500],
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: tokens.colors.error[600],
  },
  successText: {
    marginTop: 8,
    fontSize: 12,
    color: tokens.colors.success[600],
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
    color: tokens.colors.neutral[700],
    marginBottom: 8,
  },
});
