import { Pressable, Text, View } from 'react-native';

import { base } from '@/styles/style';

export default function PaginationNav({
  mode = 'numbered',
  currentPage,
  totalPages,
  pageNumbers = [],
  onPrev,
  onNext,
  onPage,
  styles: externalStyles,
  styleKeys,
  showWhenSingle = false,
  variant = 'default',
}) {
  if (!showWhenSingle && totalPages <= 1) return null;

  const s = resolveStyles(externalStyles, styleKeys, variant);

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  if (mode === 'simple') {
    return (
      <View style={s.container}>
        <Pressable
          onPress={onPrev}
          disabled={isPrevDisabled}
          style={[s.navButton, isPrevDisabled && s.navButtonDisabled]}
        >
          <Text style={s.navText}>이전</Text>
        </Pressable>

        <Text style={s.summaryText}>
          {currentPage} / {totalPages}
        </Text>

        <Pressable
          onPress={onNext}
          disabled={isNextDisabled}
          style={[s.navButton, isNextDisabled && s.navButtonDisabled]}
        >
          <Text style={s.navText}>다음</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Pressable
        onPress={onPrev}
        disabled={isPrevDisabled}
        style={[s.navButton, isPrevDisabled && s.navButtonDisabled]}
      >
        <Text style={s.navText}>이전</Text>
      </Pressable>

      <View style={s.numbersRow}>
        {pageNumbers.map((pageNum) => {
          const selected = pageNum === currentPage;
          return (
            <Pressable
              key={`page-${pageNum}`}
              onPress={onPage ? onPage(pageNum) : undefined}
              style={[
                s.numberButton,
                selected ? s.numberButtonActive : s.numberButtonInactive,
              ]}
            >
              <Text style={[s.numberText, selected && s.numberTextActive]}>{pageNum}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onNext}
        disabled={isNextDisabled}
        style={[s.navButton, isNextDisabled && s.navButtonDisabled]}
      >
        <Text style={s.navText}>다음</Text>
      </Pressable>
    </View>
  );
}

function resolveStyles(externalStyles, styleKeys, variant) {
  if (externalStyles && styleKeys) {
    return resolveExternalStyles(externalStyles, styleKeys);
  }

  if (variant === 'bordered') {
    return {
      container: base.paginationRow,
      navButton: base.paginationNavButtonBordered,
      navButtonDisabled: base.paginationNavButtonDisabled,
      navText: base.paginationNavText,
      summaryText: base.paginationSummaryText,
      numbersRow: base.paginationNumbersRow,
      numberButton: base.paginationNumber,
      numberButtonActive: base.paginationNumberActive,
      numberButtonInactive: undefined,
      numberText: base.paginationNumberText,
      numberTextActive: base.paginationNumberTextActive,
    };
  }

  return {
    container: base.paginationRow,
    navButton: base.paginationNavButton,
    navButtonDisabled: base.paginationNavButtonDisabled,
    navText: base.paginationNavText,
    summaryText: base.paginationSummaryText,
    numbersRow: base.paginationNumbersRow,
    numberButton: base.paginationNumber,
    numberButtonActive: base.paginationNumberActive,
    numberButtonInactive: undefined,
    numberText: base.paginationNumberText,
    numberTextActive: base.paginationNumberTextActive,
  };
}

function resolveExternalStyles(styles, styleKeys) {
  const get = (key) => {
    const resolvedKey = styleKeys?.[key] || key;
    return styles?.[resolvedKey];
  };
  return {
    container: get('container'),
    navButton: get('navButton'),
    navButtonDisabled: get('navButtonDisabled'),
    navText: get('navText'),
    summaryText: get('summaryText'),
    numbersRow: get('numbersRow'),
    numberButton: get('numberButton'),
    numberButtonActive: get('numberButtonActive'),
    numberButtonInactive: get('numberButtonInactive'),
    numberText: get('numberText'),
    numberTextActive: get('numberTextActive'),
  };
}
