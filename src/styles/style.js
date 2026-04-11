import { Platform } from 'react-native';

import { colors } from '@/styles/colors';
/* ===========================
   DESIGN TOKENS
=========================== */
export const tokens = {
    colors,
    padding: {
        hairline: 2,
        micro: 3,
        xxs: 4,
        xs2: 6,
        xs: 8,
        base: 10,
        sm: 12,
        baseLg: 14,
        md: 16,
        lg2: 18,
        lg: 20,
        lg3: 22,
        xl: 24,
        xl3: 26,
        xl2: 28,
        xxl: 32,
        xxxl: 48,
        mega: 60,
    },
    radius: {
        xxs: 4,
        xs: 6,
        sm: 8,
        base: 10,
        md: 12,
        baseLg: 14,
        lg: 16,
        lg2: 18,
        xl: 20,
        xxl: 28,
        pill: 999,
    },
    spacing: {
        hairline: 2,
        micro: 3,
        xxs: 4,
        xs: 6,
        xs2: 8,
        sm: 10,
        sm2: 12,
        md2: 14,
        md: 16,
        md3: 18,
        lg2: 20,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    layout: {
        /** 반응형 기준 설계 폭 (스케일 계산) */
        referenceDesignWidth: 390,
        breakpointSmallPhone: 0,
        breakpointPhone: 360,
        breakpointLargePhone: 480,
        breakpointTablet: 768,
        /** 태블릿 본문 컬럼 최대 폭 */
        tabletContentMaxWidth: 840,
        tabletContentGutter: 32,
        uiScaleMin: 0.92,
        uiScaleMax: 1.18,
        spacingScaleMin: 0.96,
        spacingScaleMax: 1.1,
        shortScaleMin: 0.92,
        shortScaleMax: 1.15,
        /** 터치 타깃 최소 (pt/dp) */
        minTouchTarget: 44,
        /** 웹 셸·가운데 컬럼 상한 (`getShellMaxWidth`). 태블릿·가로 넓은 뷰에서도 거의 전체 폭 사용 */
        shellMaxCap: 1536,
        /** 모달·폼 카드 등 기본 선호 최대 너비 */
        contentMaxPreferred: 470,
        /** 모임·클럽 등 넓은 모달 선호 최대 너비 */
        wideContentMaxPreferred: 462,
        /** 스코어·정산 시트 모달 */
        scoreSheetModalMaxPreferred: 466,
        /** 홀 스코어 테이블 모달 */
        holeScoreModalMaxPreferred: 458,
        /** 팀 편성(간단) 모달 */
        formationModalMaxPreferred: 320,
        /** 클럽 규정 모달 */
        regulationsModalMaxPreferred: 360,
        /** 알림 삭제 등 작은 확인 모달 */
        notificationsModalMaxPreferred: 430,
        /** 팀 편성 에디터(넓은 표) */
        teamEditorModalMaxPreferred: 760,
        /** 랜딩 CTA 영역 최대 너비 */
        landingCtaMaxPreferred: 340,
    },
    font: {
        xxs: 10,
        xs: 11,
        sm: 12,
        md: 13,
        base: 14,
        lg: 15,
        xl: 18,
        title: 16,
        display: 20,
        xxl: 22,
        mega: 36,
    },
    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
    },
};

const cardShadow = Platform.OS === 'web'
    ? {
        boxShadow: '0 8px 12px rgba(0, 0, 0, 0.08)',
    }
    : {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    };

export const base = {
    /* Layout */
    safeArea: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    safeAreaNeutral: {
        flex: 1,
        backgroundColor: colors.neutral[50],
    },
    safeAreaPrimary: {
        flex: 1,
        backgroundColor: colors.primary[50],
    },
    safeAreaWhite: {
        flex: 1,
        backgroundColor: colors.white,
    },
    tabScreenSafeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    tabScreenHeaderSafeArea: {
        backgroundColor: colors.white,
    },
    container: {
        padding: tokens.spacing.md,
        paddingBottom: tokens.spacing.lg,
    },
    containerLg: {
        padding: tokens.spacing.md,
        paddingBottom: tokens.spacing.xl,
    },
    modalSheet: {
        backgroundColor: colors.white,
        borderTopLeftRadius: tokens.radius.xl,
        borderTopRightRadius: tokens.radius.xl,
        padding: tokens.padding.md,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: tokens.padding.md,
        marginBottom: tokens.spacing.md,
        ...cardShadow,
    },
    tabCard: {
        backgroundColor: colors.white,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: colors.neutral[200],
        padding: tokens.padding.md,
        minHeight: 220,
        ...cardShadow,
    },
    tabCardFooterLine: {
        marginTop: 'auto',
        paddingTop: tokens.spacing.sm2,
        borderTopWidth: 1,
        borderTopColor: colors.neutral[200],
    },
    tabCardActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    tabCardActionButton: {
        flex: 1,
        minHeight: 40,
        borderRadius: tokens.radius.base,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Rows */
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tabScreenHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 32,
        marginBottom: tokens.padding.sm,
    },
    tabScreenTabBar: {
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral[200],
        marginBottom: tokens.padding.md,
    },
    tabScreenTabBarRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tabScreenTabButton: {
        paddingVertical: tokens.spacing.sm,
        paddingHorizontal: tokens.spacing.xs,
        marginRight: tokens.padding.sm,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabScreenTabButtonActive: {
        borderBottomColor: colors.primary[500],
    },

    /* Text */
    h1: {
        fontSize: tokens.font.xl,
        fontWeight: tokens.fontWeight.extrabold,
        color: colors.text,
    },
    h2: {
        fontSize: tokens.font.lg,
        fontWeight: tokens.fontWeight.bold,
        color: colors.text,
    },
    label: {
        fontSize: tokens.font.md,
        fontWeight: tokens.fontWeight.semibold,
        color: colors.textMuted,
        marginBottom: tokens.spacing.xs,
    },
    body: {
        fontSize: tokens.font.md,
        color: colors.textMuted,
    },
    caption: {
        fontSize: tokens.font.xs,
        color: colors.textSubtle,
    },
    sectionTitle: {
        fontSize: tokens.font.title,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },
    sectionTitleMd: {
        fontSize: tokens.font.base,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },
    sectionTitleSm: {
        fontSize: tokens.font.md,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[800],
    },
    sectionSubtitle: {
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
    },
    cardTitleSm: {
        fontSize: tokens.font.lg,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },
    textSmMuted: {
        fontSize: tokens.font.sm,
        color: colors.neutral[600],
    },
    textSmSubtle: {
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
    },
    textSmError: {
        fontSize: tokens.font.sm,
        color: colors.error[600],
    },
    textSmSuccess: {
        fontSize: tokens.font.sm,
        color: colors.success[600],
    },
    labelSm: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.semibold,
        color: colors.neutral[700],
        marginBottom: tokens.spacing.xs,
    },
    cardTitle: {
        fontSize: tokens.font.title,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },
    tabScreenTitle: {
        fontSize: tokens.font.xxl,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
    },
    tabScreenTabText: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.semibold,
        color: colors.neutral[500],
    },
    tabScreenTabTextActive: {
        color: colors.primary[600],
    },

    /* Inputs */
    input: {
        borderWidth: 1,
        borderColor: colors.neutral[300],
        borderRadius: tokens.radius.base,
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.base,
        fontSize: tokens.font.base,
        backgroundColor: colors.white,
        color: colors.neutral[900],
    },
    inputError: {
        borderColor: colors.red[500],
        backgroundColor: colors.red[100],
    },

    /* Buttons */
    btnPrimary: {
        backgroundColor: colors.primary[600],
        borderRadius: tokens.radius.md,
        paddingVertical: tokens.padding.sm,
        paddingHorizontal: tokens.padding.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.extrabold,
    },
    btnGray: {
        backgroundColor: colors.gray[100],
        borderRadius: tokens.radius.md,
        paddingVertical: tokens.padding.sm,
        paddingHorizontal: tokens.padding.md,
        alignItems: 'center',
    },
    btnGrayText: {
        color: colors.textMuted,
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.bold,
    },
    btnOutline: {
        backgroundColor: colors.white,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: colors.neutral[200],
        paddingVertical: tokens.padding.sm,
        paddingHorizontal: tokens.padding.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnOutlineText: {
        color: colors.neutral[700],
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.semibold,
    },

    /* Feedback */
    errorText: {
        fontSize: tokens.font.sm,
        color: colors.error[600],
        marginTop: tokens.spacing.xs,
    },
    successText: {
        fontSize: tokens.font.sm,
        color: colors.success[600],
        marginTop: tokens.spacing.xs,
    },

    /* States */
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.padding.md,
    },
    stateRow: {
        paddingVertical: tokens.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateText: {
        marginTop: tokens.spacing.xs,
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
    },

    /* Components */
    badge: {
        paddingHorizontal: tokens.padding.xs,
        paddingVertical: tokens.padding.xxs,
        borderRadius: tokens.radius.pill,
    },
    chip: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs,
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
    },
    stateBox: {
        alignItems: 'center',
        padding: tokens.padding.xl,
    },

    /* ===== Form ===== */
    formInput: {
        borderWidth: 1,
        borderColor: colors.neutral[300],
        borderRadius: tokens.radius.base,
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.base,
        fontSize: tokens.font.base,
        color: colors.neutral[900],
        backgroundColor: colors.white,
    },
    formInputError: {
        borderColor: colors.error[500],
    },
    formTextArea: {
        minHeight: 88,
        textAlignVertical: 'top',
    },
    formFieldGroup: {
        marginBottom: tokens.spacing.sm2,
    },
    formErrorText: {
        marginTop: tokens.spacing.xxs,
        fontSize: tokens.font.sm,
        color: colors.error[600],
    },
    formHelperText: {
        margin: tokens.spacing.xs,
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
    },
    formRequired: {
        color: colors.red[500],
    },

    /* ===== Chip (for SelectableChip) ===== */
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chipBase: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs2,
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
        borderColor: colors.neutral[200],
        marginRight: tokens.spacing.xs2,
        marginBottom: tokens.spacing.xs2,
    },
    chipBaseActive: {
        backgroundColor: colors.primary[600],
        borderColor: colors.primary[600],
    },
    chipBaseText: {
        fontSize: tokens.font.sm,
        color: colors.neutral[600],
        fontWeight: tokens.fontWeight.semibold,
    },
    chipBaseTextActive: {
        color: colors.white,
    },
    /* Chip variant: soft (form screens) */
    chipSoft: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs2,
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
        borderColor: colors.neutral[300],
        backgroundColor: colors.white,
        marginRight: tokens.spacing.xs2,
        marginBottom: tokens.spacing.xs2,
    },
    chipSoftActive: {
        backgroundColor: colors.primary[50],
        borderColor: colors.primary[500],
    },
    chipSoftPressed: {
        opacity: 0.85,
    },
    chipSoftText: {
        fontSize: tokens.font.sm,
        color: colors.neutral[600],
    },
    chipSoftTextActive: {
        color: colors.primary[700],
        fontWeight: tokens.fontWeight.semibold,
    },

    /* ===== Select Box (Picker wrapper) ===== */
    selectBox: {
        borderWidth: 1,
        borderColor: colors.neutral[300],
        borderRadius: tokens.radius.base,
        backgroundColor: colors.white,
        paddingHorizontal: tokens.padding.base,
        paddingVertical: tokens.padding.xs2,
        minHeight: 44,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectBoxText: {
        flex: 1,
        fontSize: tokens.font.base,
        color: colors.neutral[800],
    },
    selectBoxArrow: {
        marginLeft: tokens.spacing.xs,
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
    },
    hiddenPicker: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
    },

    /* ===== Filter Button ===== */
    filterButton: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs,
        borderRadius: tokens.radius.base,
        backgroundColor: colors.neutral[100],
    },
    filterButtonActive: {
        backgroundColor: colors.primary[600],
    },
    filterButtonText: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.semibold,
        color: colors.neutral[700],
    },
    filterButtonTextActive: {
        color: colors.white,
    },

    /* ===== Tab Card List ===== */
    tabCardPressable: {
        marginBottom: tokens.spacing.sm2,
    },
    tabCardPressed: {
        opacity: 0.95,
    },
    tabCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: tokens.spacing.sm,
    },
    tabCardDescription: {
        fontSize: tokens.font.sm,
        color: colors.neutral[600],
        lineHeight: 18,
        marginBottom: tokens.spacing.sm2,
    },
    tabCardMetaList: {
        gap: 6,
        marginBottom: tokens.spacing.sm2,
    },
    tabCardMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tabCardMetaText: {
        fontSize: tokens.font.sm,
        color: colors.neutral[600],
        flex: 1,
    },
    tabCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: tokens.spacing.sm2,
        borderTopWidth: 1,
        borderTopColor: colors.neutral[200],
    },
    tabCardDate: {
        fontSize: tokens.font.xs,
        color: colors.neutral[400],
    },
    tabCardLink: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.semibold,
        color: colors.primary[600],
    },

    /* ===== Badge ===== */
    badgeBase: {
        paddingHorizontal: tokens.padding.xs,
        paddingVertical: tokens.padding.xxs,
        borderRadius: tokens.radius.pill,
    },
    badgeBaseText: {
        fontSize: tokens.font.xs,
        fontWeight: tokens.fontWeight.semibold,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },

    /* ===== Empty State ===== */
    emptyState: {
        paddingVertical: tokens.spacing.xxl,
        alignItems: 'center',
    },
    emptyStateTitle: {
        marginTop: tokens.padding.md,
        fontSize: tokens.font.title,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[900],
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        marginTop: tokens.padding.xs,
        marginBottom: tokens.padding.md,
        fontSize: tokens.font.sm,
        color: colors.neutral[600],
        textAlign: 'center',
        paddingHorizontal: tokens.padding.xl,
    },

    /* ===== Loading / Center State ===== */
    stateCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateLoading: {
        paddingVertical: tokens.spacing.xl,
        alignItems: 'center',
    },
    stateInlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: tokens.padding.md,
    },

    /* ===== Pagination (common) ===== */
    paginationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: tokens.spacing.sm2,
    },
    paginationNavButton: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs,
        borderRadius: tokens.radius.base,
    },
    paginationNavButtonDisabled: {
        opacity: 0.5,
    },
    paginationNavText: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[700],
    },
    paginationNumbersRow: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    paginationNumber: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs,
        borderRadius: tokens.radius.base,
    },
    paginationNumberActive: {
        backgroundColor: colors.primary[600],
    },
    paginationNumberText: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.bold,
        color: colors.neutral[500],
    },
    paginationNumberTextActive: {
        color: colors.white,
    },
    paginationSummaryText: {
        fontSize: tokens.font.sm,
        color: colors.neutral[600],
    },
    /* Pagination variant: bordered (simple nav buttons with border) */
    paginationNavButtonBordered: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs2,
        borderRadius: tokens.radius.sm,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.neutral[200],
    },

    /* ===== Search Box ===== */
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.base,
        borderRadius: tokens.radius.base,
        borderWidth: 1,
        borderColor: colors.neutral[300],
        backgroundColor: colors.white,
    },
    searchInput: {
        flex: 1,
        marginLeft: tokens.padding.xs,
        paddingVertical: 0,
        fontSize: tokens.font.base,
        color: colors.neutral[900],
    },
    searchButton: {
        paddingHorizontal: tokens.padding.baseLg,
        paddingVertical: tokens.padding.base,
        borderRadius: tokens.radius.base,
        backgroundColor: colors.primary[600],
    },
    searchButtonText: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.bold,
        color: colors.white,
    },

    /* ===== Form Screen (create/register) ===== */
    formScreenCard: {
        marginBottom: tokens.spacing.md,
    },
    formScreenSectionSubtitle: {
        fontSize: tokens.font.sm,
        color: colors.neutral[500],
        marginTop: tokens.spacing.xxs,
        marginBottom: tokens.spacing.sm2,
    },
    formScreenSubmitRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: tokens.spacing.lg,
    },
    formScreenSubmitButton: {
        flex: 1,
    },
    formScreenLoadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: tokens.padding.mega,
    },
    formScreenLoadingText: {
        fontSize: tokens.font.base,
        color: colors.neutral[600],
        marginTop: tokens.spacing.sm2,
    },
    formScreenRow: {
        flexDirection: 'row',
    },
    formScreenHalfField: {
        flex: 1,
        marginRight: tokens.spacing.sm2,
    },
    formScreenHalfFieldLast: {
        marginRight: 0,
    },

    /* ===== Loading Row ===== */
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: tokens.spacing.xs,
        marginTop: tokens.spacing.xs,
    },

    /* ===== Create Button (header) ===== */
    headerCreateButton: {
        paddingHorizontal: tokens.padding.sm,
        paddingVertical: tokens.padding.xs,
        borderRadius: tokens.radius.base,
    },
    headerCreateButtonText: {
        fontSize: tokens.font.sm,
        fontWeight: tokens.fontWeight.bold,
        color: colors.white,
    },

    /* ===== Card List ===== */
    cardList: {
        marginTop: tokens.padding.md,
    },
};
