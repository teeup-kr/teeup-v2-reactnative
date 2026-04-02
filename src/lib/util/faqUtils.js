import { extractList } from './responseUtils';

export function normalizeFaqList(payload) {
  return (
    extractList(payload).map((item) => ({
      id: item?.id || item?.faq_id || item?.title,
      question: item?.question || item?.title || '질문',
      answer: item?.answer || item?.content || '',
    }))
  );
}
