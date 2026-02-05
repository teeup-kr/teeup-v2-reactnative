export function extractData(payload) {
  if (!payload) return null;
  if (payload.data && Object.keys(payload).length === 1) return payload.data;
  return payload.data ?? payload;
};

export function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.value)) return payload.value;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.notices)) return payload.notices;
  if (Array.isArray(payload.regulations)) return payload.regulations;
  if (payload.data && Array.isArray(payload.data.regulations)) return payload.data.regulations;
  if (Array.isArray(payload.inquiries)) return payload.inquiries;
  return [];
};

// export const responseUtils = {
//   extractData,
//   extractList,
// };