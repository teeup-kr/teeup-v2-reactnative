import { api } from './api';

export const termsApi = {
  getActiveTerms: async () => {
    const response = await api.get('/terms/active/');
    return response?.value || response || [];
  },

  getActiveTermsByType: async (type) => {
    try {
      const response = await api.get('/terms/active/', { params: { type_filter: type } });
      if (Array.isArray(response)) {
        return response;
      }
      return response?.value || [];
    } catch (error) {
      console.error(`약관 조회 실패 (${type}):`, error);
      return [];
    }
  },

  getActiveServiceTerms: async () => {
    try {
      const terms = await termsApi.getActiveTermsByType('TERMS_OF_SERVICE');
      return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('서비스이용약관 조회 실패:', error);
      return null;
    }
  },

  getActivePrivacyTerms: async () => {
    try {
      const terms = await termsApi.getActiveTermsByType('PRIVACY_POLICY');
      return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('개인정보처리방침 조회 실패:', error);
      return null;
    }
  },

  getActivePrivacyCollectionTerms: async () => {
    try {
      const terms = await termsApi.getActiveTermsByType('PRIVACY_COLLECTION');
      return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('개인정보 수집 및 활용동의 조회 실패:', error);
      return null;
    }
  },

  getActiveMarketingTerms: async () => {
    try {
      const terms = await termsApi.getActiveTermsByType('MARKETING_OPT_IN');
      return Array.isArray(terms) && terms.length > 0 ? terms[0] : null;
    } catch (error) {
      console.error('마케팅정보수신동의 조회 실패:', error);
      return null;
    }
  },

  getTerms: async (type) => {
    try {
      const typeMapping = {
        service: 'TERMS_OF_SERVICE',
        privacy: 'PRIVACY_POLICY',
        collection: 'PRIVACY_COLLECTION',
        marketing: 'MARKETING_OPT_IN',
      };

      const dbType = typeMapping[type] || type;
      const terms = await termsApi.getActiveTermsByType(dbType);

      if (Array.isArray(terms) && terms.length > 0) {
        return terms[0];
      }

      return {
        title: getDefaultTermsTitle(type),
        content: getDefaultTermsContent(type),
      };
    } catch (error) {
      console.error(`약관 조회 실패 (${type}):`, error);
      return {
        title: getDefaultTermsTitle(type),
        content: getDefaultTermsContent(type),
      };
    }
  },
};

const getDefaultTermsTitle = (type) => {
  const titles = {
    service: '서비스 이용약관',
    privacy: '개인정보처리방침',
    collection: '개인정보 수집 및 이용동의',
    marketing: '마케팅 정보 수신동의',
  };
  return titles[type] || '약관';
};

const getDefaultTermsContent = (type) => {
  const contents = {
    service: '서비스 이용약관 내용이 준비되지 않았습니다.',
    privacy: '개인정보처리방침 내용이 준비되지 않았습니다.',
    collection: '개인정보 수집 및 이용동의 내용이 준비되지 않았습니다.',
    marketing: '마케팅 정보 수신동의 내용이 준비되지 않았습니다.',
  };
  return contents[type] || '약관 내용이 준비되지 않았습니다.';
};

export default termsApi;
