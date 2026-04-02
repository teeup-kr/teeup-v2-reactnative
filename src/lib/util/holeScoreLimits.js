/** 더블파(파의 2배) 상한: 홀당 최대 타수 = PAR × 2 (더블보기 PAR+2와 다름) */

export function maxStrokesForDoublePar(par) {
  const p = Number(par);
  if (!Number.isInteger(p) || p <= 0) return null;
  return p * 2;
}

/**
 * 숫자만 남긴 타수 문자열을 PAR×2(더블파)까지로 제한.
 * PAR가 아직 없으면 defaultPar로 상한 계산.
 */
export function clampStrokeDigitsToDoublePar(digits, parValue, { defaultPar = 4 } = {}) {
  const raw = String(digits ?? '').replace(/[^0-9]/g, '');
  if (raw === '') return '';
  const par = Number(parValue);
  const effectivePar = Number.isInteger(par) && par > 0 ? par : defaultPar;
  const max = maxStrokesForDoublePar(effectivePar);
  if (max == null) return raw;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return raw;
  if (n > max) return String(max);
  return raw;
}

export function clampStrokesNumberToDoublePar(strokes, par) {
  const s = Number(strokes);
  const max = maxStrokesForDoublePar(par);
  if (!Number.isFinite(s) || max == null) return s;
  return Math.min(Math.max(1, Math.floor(s)), max);
}
