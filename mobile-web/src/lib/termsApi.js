import { api } from './api';

// 약관 API 함수들 (클라이언트용)
export const termsApi = {
  // 활성화된 모든 약관 조회
  getActiveTerms: async () => {
    const response = await api.get('/terms/active/');
    // api.get()이 이미 response.data를 반환하므로, 여기서는 response 자체가 백엔드 응답 데이터
    // 백엔드 응답이 { value: [...], Count: n } 형태이므로 value 배열을 반환
    return response?.value || [];
  },

  // 특정 타입의 활성화된 약관 조회
  getActiveTermsByType: async (type) => {
    try {
      const response = await api.get(`/terms/active/?type_filter=${type}`);
      console.log('API Response:', response);
      // 백엔드가 직접 배열을 반환하는 경우와 { value: [...] } 형태를 모두 처리
      if (Array.isArray(response)) {
        return response;
      }
      return response?.value || [];
    } catch (error) {
      console.error(`약관 조회 실패 (${type}):`, error);
      return [];
    }
  },

  // 서비스이용약관 조회
  getActiveServiceTerms: async () => {
    try {
      const terms = await termsApi.getActiveTermsByType('TERMS_OF_SERVICE');
      return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('서비스이용약관 조회 실패:', error);
      return null;
    }
  },

  // 개인정보처리방침 조회
  getActivePrivacyTerms: async () => {
    try {
      const terms = await termsApi.getActiveTermsByType('PRIVACY_POLICY');
      return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('개인정보처리방침 조회 실패:', error);
      return null;
    }
  },

  // 개인정보 수집 및 활용동의 조회
  getActivePrivacyCollectionTerms: async () => {
    try {
      const terms = await termsApi.getActiveTermsByType('PRIVACY_COLLECTION');
      return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('개인정보 수집 및 활용동의 조회 실패:', error);
      return null;
    }
  },

  // 마케팅정보수신동의 조회
  getActiveMarketingTerms: async () => {
    try {
      const terms = await termsApi.getActiveTermsByType('MARKETING_OPT_IN');
      return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('마케팅정보수신동의 조회 실패:', error);
      return null;
    }
  },

  // 일반적인 약관 조회 함수 (TermsModal에서 사용)
  getTerms: async (type) => {
    try {
      // 타입 매핑
      const typeMapping = {
        'service': 'TERMS_OF_SERVICE',
        'privacy': 'PRIVACY_POLICY',
        'collection': 'PRIVACY_COLLECTION',
        'marketing': 'MARKETING_OPT_IN'
      };

      const dbType = typeMapping[type] || type;
      const terms = await termsApi.getActiveTermsByType(dbType);
      
      if (Array.isArray(terms) && terms.length > 0) {
        return terms[0];
      }
      
      // 약관이 없는 경우 기본값 반환
      return {
        title: getDefaultTermsTitle(type),
        content: getDefaultTermsContent(type)
      };
    } catch (error) {
      console.error(`약관 조회 실패 (${type}):`, error);
      // 에러 발생 시 기본값 반환
      return {
        title: getDefaultTermsTitle(type),
        content: getDefaultTermsContent(type)
      };
    }
  }
};

// 기본 약관 제목 반환 함수
const getDefaultTermsTitle = (type) => {
  const titles = {
    'service': '서비스 이용약관',
    'privacy': '개인정보처리방침',
    'collection': '개인정보 수집 및 이용동의',
    'marketing': '마케팅 정보 수신동의'
  };
  return titles[type] || '약관';
};

// 기본 약관 내용 반환 함수
const getDefaultTermsContent = (type) => {
  const contents = {
    'service': '서비스 이용약관 내용이 준비되지 않았습니다.',
    'privacy': '개인정보처리방침 내용이 준비되지 않았습니다.',
    'collection': '개인정보 수집 및 이용동의 내용이 준비되지 않았습니다.',
    'marketing': '마케팅 정보 수신동의 내용이 준비되지 않았습니다.'
  };
  return contents[type] || '약관 내용이 준비되지 않았습니다.';
};

export default termsApi;





