import sanitizeHtml from 'sanitize-html';

import { extractData } from './responseUtils';

/**
 * HTML 태그를 제거하고 순수 텍스트만 반환 (리스트 요약 등에 사용)
 */
export function stripHtmlToText(html) {
  if (html == null || typeof html !== 'string') return '';
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).trim();
}

export function normalizeNotice(payload) {
  const notice = extractData(payload) || {};
  const rawSummary = notice?.summary || notice?.content || '';
  const rawContent = notice?.content || notice?.summary || '';
  return {
    id: notice?.id || notice?.notice_id || notice?.title,
    title: notice?.title || '공지사항',
    summary: stripHtmlToText(rawSummary),
    content: rawContent,
    category: notice?.type || notice?.category || 'GENERAL',
    date: notice?.created_at ? notice.created_at.slice(0, 10) : notice?.date || '',
    important: notice?.is_important || notice?.important || false,
  };
};

// export const noticeUtils = {
//   normalizeNotice,
// };