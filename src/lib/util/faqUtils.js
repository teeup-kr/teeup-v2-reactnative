import { responseUtils } from './responseUtils';

export function normalizeFaqList(payload) {
  return (
    responseUtils.extractList(payload).map((item) => ({
      id: item?.id || item?.faq_id || item?.title,
      question: item?.question || item?.title || '질문',
      answer: item?.answer || item?.content || '',
    }))
  );
}
