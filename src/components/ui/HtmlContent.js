import { useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import sanitizeHtml from 'sanitize-html';

import { colors } from '@/styles/colors';
import { tokens } from '@/styles/style';

/**
 * 허용할 HTML 태그 (굵게, 기울임, 링크, 목록 등)
 * XSS 방지를 위해 허용 목록만 사용
 */
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'div', 'span',
  'strong', 'b', 'em', 'i', 'u', 's',
  'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'hr',
];

const DEFAULT_ALLOWED_ATTRIBUTES = {
  a: ['href', 'title', 'target'],
  span: ['style'],
  div: ['style'],
  p: ['style'],
};

const defaultSanitizeOptions = {
  allowedTags: DEFAULT_ALLOWED_TAGS,
  allowedAttributes: DEFAULT_ALLOWED_ATTRIBUTES,
  allowedSchemes: ['http', 'https', 'mailto'],
};

/**
 * HTML 문자열을 새니타이징 후 렌더링 (웹/앱 공용).
 * - 저장: 백엔드에서 HTML 그대로 저장
 * - 표시: 여기서 sanitize 후 RenderHtml로 렌더링 (굵게, 기울임, 링크 등 유지)
 */
export default function HtmlContent({
  html,
  baseStyle,
  sanitizeOptions = defaultSanitizeOptions,
  ...renderHtmlProps
}) {
  const { width } = useWindowDimensions();

  if (html == null || String(html).trim() === '') {
    return null;
  }

  const raw = String(html);
  const sanitized = sanitizeHtml(raw, sanitizeOptions);

  const baseTextStyle = {
    fontSize: tokens.font.md,
    color: colors.neutral[700],
    lineHeight: 22,
    ...baseStyle,
  };

  const tagsStyles = {
    body: baseTextStyle,
    p: { marginVertical: tokens.spacing.xs, ...baseTextStyle },
    a: { color: colors.primary[600], textDecorationLine: 'underline' },
    strong: { fontWeight: '700' },
    b: { fontWeight: '700' },
    em: { fontStyle: 'italic' },
    i: { fontStyle: 'italic' },
    h1: { fontSize: tokens.font.xxl, fontWeight: '700', marginVertical: tokens.spacing.sm },
    h2: { fontSize: tokens.font.xl, fontWeight: '700', marginVertical: tokens.spacing.xs },
    h3: { fontSize: tokens.font.lg, fontWeight: '600', marginVertical: tokens.spacing.xs },
    ul: { marginVertical: tokens.spacing.xs },
    ol: { marginVertical: tokens.spacing.xs },
    li: { marginVertical: 2, ...baseTextStyle },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: colors.neutral[300],
      paddingLeft: tokens.padding.md,
      marginVertical: tokens.spacing.sm,
      ...baseTextStyle,
    },
  };

  return (
    <RenderHtml
      contentWidth={width}
      source={{ html: sanitized }}
      tagsStyles={tagsStyles}
      baseStyle={baseTextStyle}
      enableExperimentalMarginCollapsing
      {...renderHtmlProps}
    />
  );
}
