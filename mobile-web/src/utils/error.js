/**
 * API 에러에서 메시지를 추출합니다.
 * @param {any} err - 에러 객체
 * @returns {string} 추출된 에러 메시지
 */
export function extractApiError(err) {
  // axios 스타일
  const msgAxios = err?.response?.data?.detail || err?.response?.data?.message;
  if (msgAxios) return msgAxios;

  // fetch 스타일
  const msgFetch = err?.data?.detail || err?.data?.message;
  if (msgFetch) return msgFetch;

  // 기본 에러 메시지
  return err?.message || '알 수 없는 오류가 발생했습니다.';
}
