import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import HtmlContent from '@/components/ui/HtmlContent';
import Modal from '@/components/ui/Modal';
import { termsApi } from '@/lib/api/api';
import { replaceWithPolicy } from '@/lib/navigation/cappedHistory';
import { colors } from '@/styles/colors';

const TermsAgreeScreen = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // 약관 데이터
  const [terms, setTerms] = useState({
    service: null,
    privacy: null,
    collection: null,
    marketing: null,
  });

  // 체크 상태
  const [checked, setChecked] = useState({
    service: false,
    privacy: false,
    collection: false,
    marketing: false,
  });

  // 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [currentTermsKey, setCurrentTermsKey] = useState(null);

  /* --------------------------------------------------
   * 1. 화면 렌더링 시 약관 로드
   * -------------------------------------------------- */
  useEffect(() => {
    const loadTerms = async () => {
      try {
        const [
          service,
          privacy,
          collection,
          marketing,
        ] = await Promise.all([
          termsApi.getActiveServiceTerms(),
          termsApi.getActivePrivacyTerms(),
          termsApi.getActivePrivacyCollectionTerms(),
          termsApi.getActiveMarketingTerms(),
        ]);

        setTerms({ service, privacy, collection, marketing });
      } catch (e) {
        console.error(e);
        Alert.alert('오류', '약관 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadTerms();
  }, []);

  /* --------------------------------------------------
   * 체크 처리
   * -------------------------------------------------- */
  const toggleCheck = (key) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const allChecked = Object.values(checked).every(Boolean);
    setChecked({
      service: !allChecked,
      privacy: !allChecked,
      collection: !allChecked,
      marketing: !allChecked,
    });
  };

  /* --------------------------------------------------
   * 모달 처리
   * -------------------------------------------------- */
  const openModal = (key) => {
    setCurrentTermsKey(key);
    setModalVisible(true);
  };

  const acceptFromModal = () => {
    setChecked((prev) => ({ ...prev, [currentTermsKey]: true }));
    setModalVisible(false);
  };

  /* --------------------------------------------------
   * 하단 동의 버튼
   * -------------------------------------------------- */
  const handleSubmit = async () => {
    if (!checked.service || !checked.privacy || !checked.collection) {
      Alert.alert('필수 약관', '필수 약관에 모두 동의해야 합니다.');
      return;
    }

    const termsIds = Object.entries(checked)
      .filter(([_, agreed]) => agreed)
      .map(([key]) => terms[key]?.id)
      .filter(Boolean);

    const payload = {
      terms_ids: termsIds,
      agreed_at: new Date().toISOString(),
      user_agent: 'Expo / React Native',
      // ip_address는 서버에서 추출하는 게 베스트
    };

    try {
      await termsApi.postAgreementsBulk(payload);
      if (Platform.OS === 'web') {
        replaceWithPolicy(router, '/app', { webHardReplace: true });
        return;
      }
      Alert.alert('완료', '약관 동의가 완료되었습니다.', [
        { text: '확인', onPress: () => replaceWithPolicy(router, '/app') },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '약관 동의 처리에 실패했습니다.');
    }
  };

  const allRequiredChecked = checked.service && checked.privacy && checked.collection;


  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={Platform.OS === 'web' ? [] : ['top']}
      >
        <View style={styles.center}>
          <Text>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={Platform.OS === 'web' ? [] : ['top']}
    >
      <View style={styles.container}>
        <Text style={styles.title}>약관 동의</Text>

      {/* 전체 동의 */}
      <CheckRow
        label="전체 동의"
        checked={Object.values(checked).every(Boolean)}
        onPress={toggleAll}
      />

      <View style={styles.divider} />

      <CheckRow
        label="서비스 이용약관 (필수)"
        checked={checked.service}
        onPress={() => toggleCheck('service')}
        onView={() => openModal('service')}
      />

      <CheckRow
        label="개인정보처리방침 (필수)"
        checked={checked.privacy}
        onPress={() => toggleCheck('privacy')}
        onView={() => openModal('privacy')}
      />

      <CheckRow
        label="개인정보 수집 및 이용동의 (필수)"
        checked={checked.collection}
        onPress={() => toggleCheck('collection')}
        onView={() => openModal('collection')}
      />

      <CheckRow
        label="마케팅정보 수신동의 (선택)"
        checked={checked.marketing}
        onPress={() => toggleCheck('marketing')}
        onView={() => openModal('marketing')}
      />

      {/* 하단 버튼 */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          !allRequiredChecked && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!allRequiredChecked}
      >
        <Text style={styles.submitText}>동의</Text>
      </TouchableOpacity>

        {/* 중앙 모달 */}
        <Modal
          visible={modalVisible}
          title={terms[currentTermsKey]?.title ?? '약관'}
          onClose={() => setModalVisible(false)}
          containerStyle={styles.modalBox}
          backdropStyle={styles.modalOverlay}
          footer={(
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={acceptFromModal}>
                <Text style={styles.accept}>동의</Text>
              </TouchableOpacity>
            </View>
          )}
        >
          {terms[currentTermsKey]?.content ? (
            <HtmlContent html={terms[currentTermsKey].content} />
          ) : (
            <Text>약관 내용이 준비되지 않았습니다.</Text>
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
};

/* --------------------------------------------------
 * 체크 행 컴포넌트
 * -------------------------------------------------- */
const CheckRow = ({ label, checked, onPress, onView }) => (
  <View style={styles.row}>
    <TouchableOpacity onPress={onPress}>
      <Text style={styles.checkbox}>{checked ? '☑' : '☐'}</Text>
    </TouchableOpacity>
    <Text style={styles.rowText}>{label}</Text>
    {onView && (
      <TouchableOpacity onPress={onView}>
        <Text style={styles.view}>[보기]</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* --------------------------------------------------
 * 스타일 TODO : 스타일 통일
 * -------------------------------------------------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },

  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  checkbox: { fontSize: 18, marginRight: 8 },
  rowText: { flex: 1, fontSize: 14 },
  view: { color: '#16a34a', marginLeft: 8 },

  submitButton: {
    marginTop: 'auto',
    backgroundColor: colors.primary[600],
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: {
    padding: 20,
  },
  modalBox: {
    maxHeight: '80%',
    width: '100%',
    maxWidth: 470,
    alignSelf: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  cancel: { color: '#6b7280' },
  accept: { color: '#16a34a', fontWeight: 'bold' },
});

export default TermsAgreeScreen;
