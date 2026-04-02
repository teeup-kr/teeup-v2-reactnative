export function extractData(payload) {
  if (!payload) return null;
  if (payload.data && Object.keys(payload).length === 1) return payload.data;
  return payload.data ?? payload;
};

export function extractList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  if (Array.isArray(payload.scores)) return payload.scores;
  if (payload.data && Array.isArray(payload.data.scores)) return payload.data.scores;
  if (Array.isArray(payload.items)) return payload.items;
  if (payload.data && Array.isArray(payload.data.items)) return payload.data.items;
  if (Array.isArray(payload.value)) return payload.value;
  if (Array.isArray(payload.results)) return payload.results;
  if (payload.data && Array.isArray(payload.data.results)) return payload.data.results;
  if (Array.isArray(payload.notices)) return payload.notices;
  if (Array.isArray(payload.regulations)) return payload.regulations;
  if (payload.data && Array.isArray(payload.data.regulations)) return payload.data.regulations;
  if (Array.isArray(payload.categories)) return payload.categories;
  if (payload.data && Array.isArray(payload.data.categories)) return payload.data.categories;
  if (Array.isArray(payload.inquiries)) return payload.inquiries;
  return [];
};

// export const responseUtils = {
//   extractData,
//   extractList,
// };
