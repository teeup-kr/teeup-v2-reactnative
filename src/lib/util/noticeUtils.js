import { responseUtils } from './responseUtils';

function normalizeNotice(payload)  {
  const notice = responseUtils.extractData(payload) || {};
  return {
    id: notice?.id || notice?.notice_id || notice?.title,
    title: notice?.title || '공지사항',
    summary: notice?.summary || notice?.content || '',
    content: notice?.content || notice?.summary || '',
    category: notice?.type || notice?.category || 'GENERAL',
    date: notice?.created_at ? notice.created_at.slice(0, 10) : notice?.date || '',
    important: notice?.is_important || notice?.important || false,
  };
};

export const noticeUtils = {
  normalizeNotice,
};